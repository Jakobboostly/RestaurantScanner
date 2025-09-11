#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';

interface CSVRecord {
  'Record ID': string;
  'City': string;
  'State/Region': string;
  'Website URL': string;
}

interface ScanResult {
  overallScore?: number;
  seo?: number;
  performance?: number;
  userExperience?: number;
  restaurantName?: string;
  placeId?: string;
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
  successful_scans: number;
  non_restaurants: number;
  scan_errors: number;
  hubspot_updates: number;
  hubspot_errors: number;
}

class CSVScannerHubSpotUpdater {
  private webhookUrl: string;
  private hubspotApiKey: string;
  private hubspotBaseUrl: string;
  private batchSize: number;
  private delayMs: number;
  private stats: ProcessingStats = {
    total: 0,
    processed: 0,
    successful_scans: 0,
    non_restaurants: 0,
    scan_errors: 0,
    hubspot_updates: 0,
    hubspot_errors: 0
  };

  constructor(
    webhookUrl: string = 'https://boostly-restaurant-scanner.onrender.com/api/webhook/scan-by-url',
    batchSize: number = 5,
    delayMs: number = 2000
  ) {
    this.webhookUrl = webhookUrl;
    this.batchSize = batchSize;
    this.delayMs = delayMs;
    
    // Get HubSpot credentials from environment
    this.hubspotApiKey = process.env.HUBSPOT_API_KEY || '';
    this.hubspotBaseUrl = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';
    
    if (!this.hubspotApiKey) {
      console.warn('⚠️ HUBSPOT_API_KEY not found in environment variables. HubSpot updates will be skipped.');
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

  private async scanWebsiteViaWebhook(url: string): Promise<ScanResult | null> {
    try {
      console.log(`🔍 Scanning: ${url}`);
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          returnFormat: 'json'
        }),
      });

      if (!response.ok) {
        console.log(`   ❌ Scan failed: HTTP ${response.status}`);
        
        // Try to get error details for better debugging
        try {
          const errorResult = await response.json();
          if (errorResult.message) {
            console.log(`   💥 Error details: ${errorResult.message}`);
          }
          if (errorResult.details) {
            console.log(`   🔍 Error context:`, errorResult.details);
          }
        } catch (parseError) {
          console.log(`   ⚠️ Could not parse error response`);
        }
        
        return null;
      }

      const result = await response.json();
      
      // Check if this looks like a successful restaurant scan result
      if (result.success && result.result && result.result.overallScore !== undefined) {
        console.log(`   ✅ Restaurant found: ${result.result.restaurantName || 'Unknown'}`);
        console.log(`      Scores - Overall: ${result.result.overallScore}, SEO: ${result.result.seo}, Performance: ${result.result.performance}, UX: ${result.result.userExperience}`);
        
        // Log additional validation info
        const hasValidScores = result.result.overallScore > 0 && result.result.seo > 0 && result.result.performance > 0 && result.result.userExperience > 0;
        console.log(`      Valid scores: ${hasValidScores ? '✅' : '❌'}`);
        
        // Check for suspicious fallback patterns
        const hasSuspiciousScores = (
          result.result.seo === 70 && result.result.userExperience === 60 && result.result.performance === 65
        );
        if (hasSuspiciousScores) {
          console.log(`      ⚠️ WARNING: Scores match common fallback pattern - may be inaccurate`);
        }
        
        return result.result;  // Return the nested result object
      } else {
        console.log(`   ℹ️ No restaurant found for this website`);
        if (result.error) {
          console.log(`   💥 Scan error: ${result.error}`);
        }
        if (result.message) {
          console.log(`   💬 Details: ${result.message}`);
        }
        return null;
      }

    } catch (error) {
      console.log(`   ❌ Scan error: ${error.message}`);
      return null;
    }
  }

  private mapScoresToHubSpot(scanResult: ScanResult): HubSpotUpdateData {
    const updateData: HubSpotUpdateData = {};
    
    if (scanResult.overallScore !== undefined) {
      updateData.overall_score = scanResult.overallScore;
    }
    
    if (scanResult.seo !== undefined) {
      updateData.seo_score = scanResult.seo;
    }
    
    if (scanResult.performance !== undefined) {
      updateData.social_score = scanResult.performance;  // performance -> social_score
    }
    
    if (scanResult.userExperience !== undefined) {
      updateData.review_score = scanResult.userExperience;  // userExperience -> review_score
    }
    
    return updateData;
  }

  private async updateHubSpotRecord(recordId: string, updateData: HubSpotUpdateData): Promise<boolean> {
    if (!this.hubspotApiKey) {
      console.log(`   ⏭️ Skipping HubSpot update (no API key): Record ${recordId}`);
      return false;
    }

    try {
      console.log(`   📤 Updating HubSpot record: ${recordId}`);
      console.log(`      Data:`, updateData);
      
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

  private async processRecord(record: CSVRecord): Promise<void> {
    this.stats.processed++;
    
    console.log(`\n🏢 Processing Record ${this.stats.processed}/${this.stats.total}: ${record['Record ID']}`);
    console.log(`   Website: ${record['Website URL']}`);
    console.log(`   Location: ${record['City']}, ${record['State/Region']}`);

    // Scan the website
    const scanResult = await this.scanWebsiteViaWebhook(record['Website URL']);
    
    if (scanResult) {
      this.stats.successful_scans++;
      
      // Map scores to HubSpot format
      const hubspotData = this.mapScoresToHubSpot(scanResult);
      
      // Update HubSpot record
      const updateSuccess = await this.updateHubSpotRecord(record['Record ID'], hubspotData);
      
      if (updateSuccess) {
        this.stats.hubspot_updates++;
      } else {
        this.stats.hubspot_errors++;
      }
      
    } else {
      // Check if this was a scan error or just no restaurant found
      this.stats.non_restaurants++;
    }
  }

  private async processBatch(records: CSVRecord[]): Promise<void> {
    const promises = records.map(record => this.processRecord(record));
    await Promise.all(promises);
  }

  private printStats(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total records: ${this.stats.total}`);
    console.log(`Processed: ${this.stats.processed}`);
    console.log(`Successful restaurant scans: ${this.stats.successful_scans}`);
    console.log(`Non-restaurants: ${this.stats.non_restaurants}`);
    console.log(`Scan errors: ${this.stats.scan_errors}`);
    console.log(`HubSpot updates: ${this.stats.hubspot_updates}`);
    console.log(`HubSpot errors: ${this.stats.hubspot_errors}`);
    console.log(`Success rate: ${Math.round((this.stats.successful_scans / this.stats.processed) * 100)}%`);
  }

  async processCSV(csvPath: string): Promise<void> {
    console.log('🚀 Starting CSV Restaurant Scanning & HubSpot Update');
    console.log(`📁 Input file: ${csvPath}`);
    console.log(`🌐 Webhook URL: ${this.webhookUrl}`);
    console.log(`📦 Batch size: ${this.batchSize}`);
    console.log(`⏱️ Rate limit delay: ${this.delayMs}ms`);
    console.log(`🔗 HubSpot API: ${this.hubspotApiKey ? 'Configured' : 'Not configured'}\n`);

    try {
      // Read and parse CSV
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const records = this.parseCSV(csvContent);
      
      console.log(`📖 Found ${records.length} records in CSV\n`);
      
      // Validate required columns
      if (records.length === 0) {
        throw new Error('No records found in CSV file');
      }
      
      const firstRecord = records[0];
      const requiredFields = ['Record ID', 'Website URL'];
      
      for (const field of requiredFields) {
        if (!(field in firstRecord)) {
          throw new Error(`Required column '${field}' not found in CSV`);
        }
      }

      this.stats.total = records.length;

      // Process records in batches
      const totalBatches = Math.ceil(records.length / this.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, records.length);
        const batch = records.slice(startIndex, endIndex);

        console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} records)`);

        await this.processBatch(batch);

        // Rate limiting between batches
        if (batchIndex < totalBatches - 1) {
          console.log(`⏸️ Rate limiting: waiting ${this.delayMs}ms before next batch...`);
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
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: npx tsx csv-scan-hubspot-update.ts <csv-path> [--batch-size=N] [--delay=MS]');
    console.error('');
    console.error('Environment variables:');
    console.error('  HUBSPOT_API_KEY - Required for HubSpot updates');
    console.error('  HUBSPOT_BASE_URL - Optional (defaults to https://api.hubapi.com)');
    process.exit(1);
  }
  
  const csvPath = args[0];
  let batchSize = 5;
  let delayMs = 2000;
  
  // Parse additional arguments
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1]) || 5;
    } else if (arg.startsWith('--delay=')) {
      delayMs = parseInt(arg.split('=')[1]) || 2000;
    }
  });
  
  const scanner = new CSVScannerHubSpotUpdater(
    'https://boostly-restaurant-scanner.onrender.com/api/webhook/scan-by-url',
    batchSize,
    delayMs
  );
  
  await scanner.processCSV(csvPath);
}

// Run the scanner
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});