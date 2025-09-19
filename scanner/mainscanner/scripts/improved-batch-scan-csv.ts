#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';

interface CompanyRecord {
  'Record ID': string;
  'Company name': string;
  'Company owner': string;
  'Phone Number': string;
  'City': string;
  'Street Address': string;
  'Street Address 2': string;
  'Postal Code': string;
  'Website URL': string;
}

interface RestaurantSearchResult {
  id: string;
  name: string;
  address: string;
  placeId: string;
  rating?: number;
  totalRatings?: number;
}

class ImprovedBatchScanner {
  private baseUrl: string;
  private outputDir: string;
  private batchSize: number;
  private stats = {
    processed: 0,
    successful: 0,
    failed: 0,
    duplicatePlaceIds: 0,
    errors: {
      searchFailed: 0,
      noResults: 0,
      scanFailed: 0,
      screenshotFailed: 0,
      apiError: 0
    }
  };
  private processedPlaceIds = new Set<string>();

  constructor(baseUrl: string, outputDir: string, batchSize: number = 10) {
    this.baseUrl = baseUrl;
    this.outputDir = outputDir;
    this.batchSize = batchSize;
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

  private parseCSV<T>(content: string, headers: string[]): T[] {
    const lines = content.trim().split('\n');
    const dataLines = lines.slice(1);
    
    return dataLines.map(line => {
      const values = this.parseCSVRow(line);
      const obj: any = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      return obj as T;
    });
  }

  private async improvedRestaurantSearch(company: CompanyRecord): Promise<RestaurantSearchResult[]> {
    const searchStrategies = [
      // Strategy 1: Restaurant name + full address (most specific)
      `${company['Company name']} ${company['Street Address']} ${company['City']}`,
      
      // Strategy 2: Restaurant name + city (less specific)
      `${company['Company name']} ${company['City']}`,
      
      // Strategy 3: Just restaurant name (fallback)
      company['Company name'],
      
      // Strategy 4: Clean restaurant name (remove special characters)
      this.cleanRestaurantName(company['Company name'])
    ];

    console.log(`🔍 Improved search for: ${company['Company name']}`);
    
    for (let i = 0; i < searchStrategies.length; i++) {
      const query = searchStrategies[i];
      console.log(`   Strategy ${i + 1}: "${query}"`);
      
      try {
        const response = await fetch(`${this.baseUrl}/api/restaurants/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          console.log(`   ❌ Strategy ${i + 1} failed: HTTP ${response.status}`);
          continue;
        }

        const results: RestaurantSearchResult[] = await response.json();
        
        if (results && results.length > 0) {
          // Filter results for better matching
          const filteredResults = this.filterSearchResults(results, company);
          
          if (filteredResults.length > 0) {
            console.log(`   ✅ Strategy ${i + 1} found ${filteredResults.length} results`);
            return filteredResults;
          } else {
            console.log(`   ⚠️ Strategy ${i + 1} found ${results.length} results but none matched filtering`);
          }
        } else {
          console.log(`   ❌ Strategy ${i + 1}: No results`);
        }
      } catch (error) {
        console.log(`   ❌ Strategy ${i + 1} error: ${error.message}`);
      }
    }
    
    console.log(`   ❌ All strategies failed for ${company['Company name']}`);
    return [];
  }

  private cleanRestaurantName(name: string): string {
    // Remove location suffixes like "| City, State"
    let cleaned = name.replace(/\s*\|\s*[^|]*$/, '');
    
    // Remove common business suffixes
    cleaned = cleaned.replace(/\s+(LLC|Inc\.?|Corp\.?|Restaurant|Cafe)$/i, '');
    
    // Remove special characters that might confuse search
    cleaned = cleaned.replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  private filterSearchResults(results: RestaurantSearchResult[], company: CompanyRecord): RestaurantSearchResult[] {
    // Check if we've already processed this Place ID
    const uniqueResults = results.filter(result => {
      if (this.processedPlaceIds.has(result.placeId)) {
        console.log(`   ⚠️ Skipping duplicate Place ID: ${result.placeId} (${result.name})`);
        this.stats.duplicatePlaceIds++;
        return false;
      }
      return true;
    });

    // Basic name similarity check
    const companyNameLower = company['Company name'].toLowerCase();
    const cityLower = company['City'].toLowerCase();
    
    return uniqueResults.filter(result => {
      const resultNameLower = result.name.toLowerCase();
      const resultAddressLower = result.address.toLowerCase();
      
      // Check if result name contains key parts of company name
      const companyWords = this.cleanRestaurantName(companyNameLower).split(' ').filter(w => w.length > 2);
      const hasNameMatch = companyWords.some(word => resultNameLower.includes(word));
      
      // Check if result address contains the city
      const hasCityMatch = resultAddressLower.includes(cityLower);
      
      // Accept if we have name match OR city match (not too strict)
      const accepted = hasNameMatch || hasCityMatch;
      
      console.log(`   🔍 Filtering "${result.name}": name_match=${hasNameMatch}, city_match=${hasCityMatch}, accepted=${accepted}`);
      
      return accepted;
    });
  }

  private async performImprovedScan(company: CompanyRecord): Promise<{ success: boolean; placeId?: string; error?: string }> {
    try {
      console.log(`🔍 Starting improved scan for: ${company['Company name']} (${company['Website URL']})`);
      
      const searchResults = await this.improvedRestaurantSearch(company);
      
      if (searchResults.length === 0) {
        return { success: false, error: `No restaurant found for "${company['Company name']}" in ${company['City']}` };
      }

      const bestResult = searchResults[0]; // Use the first (best) result
      const placeId = bestResult.placeId;

      console.log(`🎯 Selected restaurant: ${bestResult.name} (${placeId})`);
      console.log(`   Address: ${bestResult.address}`);

      // Mark this Place ID as processed
      this.processedPlaceIds.add(placeId);

      // Perform professional scan with the found Place ID
      const scanResponse = await fetch(`${this.baseUrl}/api/scan/professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: placeId,
          restaurantName: bestResult.name,
          domain: new URL(company['Website URL'].startsWith('http') ? company['Website URL'] : `https://${company['Website URL']}`).hostname
        }),
      });

      if (!scanResponse.ok) {
        return { success: false, error: `Professional scan failed: ${scanResponse.status}` };
      }

      console.log(`✅ Professional scan completed for: ${bestResult.name}`);
      return { success: true, placeId };

    } catch (error) {
      console.error(`❌ Improved scan error for ${company['Company name']}:`, error);
      return { success: false, error: error.message };
    }
  }

  async processCSV(csvPath: string): Promise<void> {
    console.log('🚀 Starting IMPROVED CSV batch processing');
    console.log(`📁 Input file: ${csvPath}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`📦 Batch size: ${this.batchSize}`);
    console.log(`📊 Output directory: ${this.outputDir}\n`);

    try {
      // Read and parse CSV
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const headers = [
        'Record ID', 'Company name', 'Company owner', 'Phone Number',
        'City', 'Street Address', 'Street Address 2', 'Postal Code', 'Website URL'
      ];
      
      const allCompanies = this.parseCSV<CompanyRecord>(csvContent, headers);
      console.log(`📖 Found ${allCompanies.length} companies in CSV`);

      // Filter for valid websites
      const validCompanies = allCompanies.filter(company => {
        const website = company['Website URL']?.trim();
        return website && website.length > 0 && !website.toLowerCase().includes('n/a');
      });

      console.log(`📋 Found ${validCompanies.length} companies with valid websites\n`);

      // Process in smaller batches for better accuracy
      const totalBatches = Math.ceil(validCompanies.length / this.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, validCompanies.length);
        const batch = validCompanies.slice(startIndex, endIndex);

        console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)\n`);

        // Process batch with improved logic
        const batchPromises = batch.map(company => this.processSingleCompany(company));
        await Promise.all(batchPromises);

        console.log(`\n✅ Batch ${batchIndex + 1} completed`);
        console.log(`📊 Running stats: ${this.stats.successful} successful, ${this.stats.failed} failed, ${this.stats.duplicatePlaceIds} duplicates avoided`);

        // Rate limiting between batches
        if (batchIndex < totalBatches - 1) {
          console.log(`⏸️ Rate limiting: waiting 5 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Print final statistics
      this.printFinalStats();

    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  }

  private async processSingleCompany(company: CompanyRecord): Promise<void> {
    this.stats.processed++;
    
    console.log(`\n🏢 Processing: ${company['Record ID']} - ${company['Company name']}`);
    console.log(`   City: ${company['City']}`);
    console.log(`   Address: ${company['Street Address']}`);
    console.log(`   Website: ${company['Website URL']}`);

    const scanResult = await this.performImprovedScan(company);
    
    if (scanResult.success) {
      console.log(`✅ SUCCESS: ${company['Company name']} -> ${scanResult.placeId}`);
      this.stats.successful++;
    } else {
      console.log(`❌ FAILED: ${company['Company name']} - ${scanResult.error}`);
      this.stats.failed++;
      this.updateErrorStats(scanResult.error || 'Unknown error');
    }
  }

  private updateErrorStats(error: string): void {
    if (error.includes('No restaurant found')) {
      this.stats.errors.noResults++;
    } else if (error.includes('Search API error')) {
      this.stats.errors.searchFailed++;
    } else if (error.includes('scan failed')) {
      this.stats.errors.scanFailed++;
    } else if (error.includes('HTTP')) {
      this.stats.errors.apiError++;
    } else {
      this.stats.errors.searchFailed++;
    }
  }

  private printFinalStats(): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 IMPROVED BATCH PROCESSING COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n📊 FINAL STATISTICS:');
    console.log(`   • Total processed: ${this.stats.processed}`);
    console.log(`   • Successful scans: ${this.stats.successful}`);
    console.log(`   • Failed scans: ${this.stats.failed}`);
    console.log(`   • Duplicate Place IDs avoided: ${this.stats.duplicatePlaceIds}`);
    console.log(`   • Success rate: ${Math.round((this.stats.successful / this.stats.processed) * 100)}%`);
    
    console.log('\n❌ ERROR BREAKDOWN:');
    console.log(`   • No results found: ${this.stats.errors.noResults}`);
    console.log(`   • Search API failures: ${this.stats.errors.searchFailed}`);
    console.log(`   • Professional scan failures: ${this.stats.errors.scanFailed}`);
    console.log(`   • API errors: ${this.stats.errors.apiError}`);
    
    console.log('\n💡 IMPROVEMENTS MADE:');
    console.log('   ✅ Multi-strategy restaurant search (name+address, name+city, name-only)');
    console.log('   ✅ Duplicate Place ID detection and prevention');
    console.log('   ✅ Better result filtering based on location matching');
    console.log('   ✅ Clean restaurant name processing');
    console.log('   ✅ Detailed search strategy logging for debugging');
    
    if (this.stats.successful > 0) {
      console.log(`\n🎯 SUCCESS: ${this.stats.successful} restaurants now have unique Place IDs!`);
      console.log('🔗 Each restaurant should now have its own revenue gate URL.');
      
      if (this.stats.duplicatePlaceIds > 0) {
        console.log(`✅ PREVENTED: ${this.stats.duplicatePlaceIds} duplicate Place ID assignments!`);
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: npx tsx improved-batch-scan-csv.ts <csv-path> [--batch-size=N] [--output-dir=DIR]');
    process.exit(1);
  }
  
  const csvPath = args[0];
  let batchSize = 5; // Smaller batch size for better accuracy
  let outputDir = './improved-scan-results';
  const baseUrl = 'https://boostly-restaurant-scanner.onrender.com';
  
  // Parse additional arguments
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1]) || 5;
    } else if (arg.startsWith('--output-dir=')) {
      outputDir = arg.split('=')[1];
    }
  });
  
  const scanner = new ImprovedBatchScanner(baseUrl, outputDir, batchSize);
  await scanner.processCSV(csvPath);
}

// Run the improved scanner
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});