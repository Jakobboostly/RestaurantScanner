#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import { db } from '../server/db';
import { fullScanResults } from '../shared/schema';

interface CSVRecord {
  'Record ID': string;
  'Company name': string;
  'City': string;
  'State/Region': string;
  'Website URL': string;
}

interface HubSpotUpdateData {
  overall_score?: number;
  seo_score?: number;
  social_score?: number;  // maps to performance
  review_score?: number;  // maps to userExperience
}

interface ProcessingStats {
  total: number;
  processed: number;
  validScores: number;
  fallbackScores: number;
  hubspotUpdates: number;
  hubspotErrors: number;
  notFound: number;
}

class HubSpotScoreFixer {
  private hubspotApiKey: string;
  private hubspotBaseUrl: string;
  private batchSize: number = 10;
  private delayMs: number = 1000;
  private stats: ProcessingStats = {
    total: 0,
    processed: 0,
    validScores: 0,
    fallbackScores: 0,
    hubspotUpdates: 0,
    hubspotErrors: 0,
    notFound: 0
  };

  constructor() {
    this.hubspotApiKey = process.env.HUBSPOT_API_KEY || '';
    this.hubspotBaseUrl = 'https://api.hubapi.com';
    
    if (!this.hubspotApiKey) {
      throw new Error('HUBSPOT_API_KEY environment variable is required');
    }
  }

  private parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private parseCSV(content: string): CSVRecord[] {
    const lines = content.trim().split('\n');
    const headerLine = lines[0];
    const headers = this.parseCSVRow(headerLine);
    
    console.log('📋 CSV Headers detected:', headers);
    
    const dataLines = lines.slice(1);
    
    return dataLines.map(line => {
      const values = this.parseCSVRow(line);
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      return record as CSVRecord;
    });
  }

  private normalizeUrl(url: string): string {
    // Remove protocol and www
    return url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  private isFallbackScore(scanData: any): boolean {
    // Check for the suspicious fallback pattern
    return (
      scanData.seo === 70 && 
      scanData.userExperience === 60 && 
      scanData.performance === 65
    ) || (
      scanData.overallScore === 0 || 
      scanData.seo === 0 || 
      scanData.performance === 0 || 
      scanData.userExperience === 0
    );
  }

  private async updateHubSpotRecord(recordId: string, updateData: HubSpotUpdateData): Promise<boolean> {
    try {
      console.log(`   📤 Updating HubSpot record: ${recordId}`);
      console.log(`      Scores: Overall=${updateData.overall_score}, SEO=${updateData.seo_score}, Social=${updateData.social_score}, Reviews=${updateData.review_score}`);
      
      const response = await fetch(`${this.hubspotBaseUrl}/crm/v3/objects/companies/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.hubspotApiKey}`
        },
        body: JSON.stringify({
          properties: updateData
        })
      });

      if (!response.ok) {
        console.log(`   ❌ HubSpot update failed: HTTP ${response.status}`);
        const errorBody = await response.text();
        console.log(`      Error: ${errorBody}`);
        return false;
      }

      console.log(`   ✅ HubSpot record updated successfully`);
      return true;

    } catch (error) {
      console.log(`   ❌ HubSpot update error: ${error.message}`);
      return false;
    }
  }

  async processCSVAndFixScores(csvPath: string): Promise<void> {
    console.log('🚀 Starting HubSpot Score Fix from Database Cache');
    console.log(`📁 Input CSV: ${csvPath}`);
    console.log(`🗄️ Database: Connected`);
    console.log(`🔗 HubSpot API: ${this.hubspotApiKey ? 'Configured' : 'Not configured'}\n`);

    try {
      // Read and parse CSV
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const records = this.parseCSV(csvContent);
      
      console.log(`📖 Found ${records.length} records in CSV\n`);
      this.stats.total = records.length;

      // Get ALL scan results from database
      console.log('🔍 Fetching all scan results from database...');
      const allScans = await db.query.fullScanResults.findMany();
      console.log(`📊 Found ${allScans.length} scan results in database\n`);

      // Create a map of normalized URLs to scan data
      const scanMap = new Map<string, any>();
      for (const scan of allScans) {
        if (scan.domain) {
          const normalizedDomain = this.normalizeUrl(scan.domain);
          scanMap.set(normalizedDomain, scan.scanData);
        }
        // Also map by restaurant name as fallback
        if (scan.restaurantName) {
          scanMap.set(scan.restaurantName.toLowerCase(), scan.scanData);
        }
      }

      // Process records in batches
      const totalBatches = Math.ceil(records.length / this.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, records.length);
        const batch = records.slice(startIndex, endIndex);

        console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} records)`);

        for (const record of batch) {
          this.stats.processed++;
          
          console.log(`\n🏢 Processing ${this.stats.processed}/${this.stats.total}: ${record['Company name']}`);
          console.log(`   URL: ${record['Website URL']}`);
          
          // Try to find scan data by URL
          const normalizedUrl = this.normalizeUrl(record['Website URL']);
          let scanData = scanMap.get(normalizedUrl);
          
          // If not found by URL, try by company name
          if (!scanData) {
            const normalizedName = record['Company name'].toLowerCase();
            scanData = scanMap.get(normalizedName);
          }
          
          if (!scanData) {
            console.log(`   ⚠️ No scan data found in database`);
            this.stats.notFound++;
            continue;
          }

          // Check if this has fallback scores
          const hasFallback = this.isFallbackScore(scanData);
          if (hasFallback) {
            console.log(`   🔄 Has fallback scores (70/60/65) - needs update`);
            this.stats.fallbackScores++;
          } else {
            console.log(`   ✅ Has valid scores`);
            this.stats.validScores++;
          }

          // Prepare HubSpot update data using calculated scores that match frontend
          const updateData: HubSpotUpdateData = {
            overall_score: scanData.calculatedScores?.overall || scanData.overallScore || 0,
            seo_score: scanData.calculatedScores?.search || scanData.seo || 0,
            social_score: scanData.calculatedScores?.social || scanData.performance || 0,
            review_score: scanData.calculatedScores?.reviews || scanData.userExperience || 0
          };

          // Update HubSpot record
          const updateSuccess = await this.updateHubSpotRecord(record['Record ID'], updateData);
          
          if (updateSuccess) {
            this.stats.hubspotUpdates++;
          } else {
            this.stats.hubspotErrors++;
          }
        }

        // Rate limiting between batches
        if (batchIndex < totalBatches - 1) {
          console.log(`\n⏸️ Rate limiting: waiting ${this.delayMs}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }
      }

      this.printStats();

    } catch (error) {
      console.error('❌ Fatal error:', error);
      this.printStats();
      process.exit(1);
    }
  }

  private printStats(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total records: ${this.stats.total}`);
    console.log(`Processed: ${this.stats.processed}`);
    console.log(`Valid scores found: ${this.stats.validScores}`);
    console.log(`Fallback scores replaced: ${this.stats.fallbackScores}`);
    console.log(`Not found in database: ${this.stats.notFound}`);
    console.log(`HubSpot updates successful: ${this.stats.hubspotUpdates}`);
    console.log(`HubSpot update errors: ${this.stats.hubspotErrors}`);
    console.log(`Update success rate: ${Math.round((this.stats.hubspotUpdates / this.stats.processed) * 100)}%`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: npx tsx fix-hubspot-scores-from-cache.ts <csv-path>');
    console.error('');
    console.error('Environment variables:');
    console.error('  HUBSPOT_API_KEY - Required for HubSpot updates');
    console.error('  DATABASE_URL - Required for database connection');
    process.exit(1);
  }
  
  const csvPath = args[0];
  const fixer = new HubSpotScoreFixer();
  
  await fixer.processCSVAndFixScores(csvPath);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});