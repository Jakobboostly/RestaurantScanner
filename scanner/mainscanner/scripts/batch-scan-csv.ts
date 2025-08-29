#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, sql } from 'drizzle-orm';
import { fullScanResults, revenueGateScreenshots } from '../shared/schema';

// Database setup
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('💡 Set DATABASE_URL in your environment variables');
  process.exit(1);
}

const client = postgres(connectionString, { ssl: 'require' });
const db = drizzle(client, {
  schema: { fullScanResults, revenueGateScreenshots }
});

// Types for CSV processing
interface CSVRow {
  [key: string]: string;
}

interface ProcessingResult {
  companyName: string;
  website: string;
  status: 'success' | 'failed' | 'skipped';
  scanId?: string;
  placeId?: string;
  screenshotUrl?: string;
  error?: string;
  details?: string;
}

interface BatchStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: {
    invalidUrl: number;
    scanFailed: number;
    screenshotFailed: number;
    databaseError: number;
    other: number;
  };
}

class CSVBatchProcessor {
  private baseUrl: string;
  private results: ProcessingResult[] = [];
  private stats: BatchStats = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: {
      invalidUrl: 0,
      scanFailed: 0,
      screenshotFailed: 0,
      databaseError: 0,
      other: 0
    }
  };

  constructor(baseUrl = 'https://boostly-restaurant-scanner.onrender.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Read and parse CSV file
   */
  private readCSVFile(filePath: string): CSVRow[] {
    console.log(`📖 Reading CSV file: ${filePath}`);
    
    if (!existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filePath}`);
    }

    const csvContent = readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log(`📊 Found ${lines.length - 1} data rows in CSV file`);
    console.log(`🔍 CSV columns:`, headers);

    // Parse rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index].trim();
        });
        rows.push(row);
      } else {
        console.warn(`⚠️ Skipping malformed row ${i + 1}: column count mismatch`);
      }
    }

    console.log(`✅ Successfully parsed ${rows.length} CSV rows`);
    if (rows.length > 0) {
      console.log(`📋 Sample row:`, rows[0]);
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current); // Add the last field
    return result;
  }

  /**
   * Extract website URL from various possible column names
   */
  private extractWebsite(row: CSVRow): string | null {
    const possibleWebsiteFields = [
      'website', 'Website', 'WEBSITE',
      'url', 'URL', 'Url',
      'domain', 'Domain', 'DOMAIN',
      'Website URL', 'website_url',
      'Company Website', 'company_website',
      'Site', 'site', 'SITE',
      'web', 'Web', 'WEB',
      'homepage', 'Homepage', 'HOMEPAGE'
    ];

    for (const field of possibleWebsiteFields) {
      if (row[field] && typeof row[field] === 'string') {
        let url = row[field].toString().trim();
        
        // Skip obvious non-URLs
        if (url.includes('@') || url.includes('phone') || url.includes('tel:') || url === 'N/A' || url === 'n/a' || url === '') {
          continue;
        }
        
        // Add protocol if missing
        if (url && !url.startsWith('http')) {
          url = `https://${url}`;
        }
        
        // Basic URL validation
        try {
          new URL(url);
          return url;
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extract company/restaurant name from various possible column names
   */
  private extractCompanyName(row: CSVRow): string {
    const possibleNameFields = [
      'companyName', 'Company Name', 'COMPANY_NAME',
      'restaurantName', 'Restaurant Name', 'RESTAURANT_NAME',
      'name', 'Name', 'NAME',
      'company', 'Company', 'COMPANY',
      'business', 'Business', 'BUSINESS',
      'Account Name', 'account_name',
      'client', 'Client', 'CLIENT',
      'customer', 'Customer', 'CUSTOMER'
    ];

    for (const field of possibleNameFields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].toString().trim();
      }
    }

    // Fallback: use first non-empty field
    for (const [key, value] of Object.entries(row)) {
      if (value && value.trim()) {
        return value.toString().trim();
      }
    }

    return 'Unknown Company';
  }

  /**
   * Check if we already have a recent scan for this website
   */
  private async checkExistingScan(website: string): Promise<{ hasRecent: boolean; placeId?: string; scanAge?: number }> {
    try {
      const domain = new URL(website).hostname.replace('www.', '');
      
      const existingScan = await db.query.fullScanResults.findFirst({
        where: sql`${fullScanResults.domain} = ${domain}`,
        orderBy: sql`${fullScanResults.createdAt} DESC`
      });

      if (existingScan) {
        const scanAge = Date.now() - new Date(existingScan.createdAt!).getTime();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        
        return {
          hasRecent: scanAge < sevenDaysInMs,
          placeId: existingScan.placeId,
          scanAge: Math.floor(scanAge / (24 * 60 * 60 * 1000)) // days
        };
      }

      return { hasRecent: false };
    } catch (error) {
      console.warn(`⚠️ Error checking existing scan for ${website}:`, error);
      return { hasRecent: false };
    }
  }

  /**
   * Check if screenshot exists for a placeId
   */
  private async checkExistingScreenshot(placeId: string): Promise<{ exists: boolean; url?: string }> {
    try {
      if (!placeId || placeId === 'undefined') {
        console.warn(`⚠️ Invalid placeId provided: ${placeId}`);
        return { exists: false };
      }
      
      const screenshot = await db.query.revenueGateScreenshots.findFirst({
        where: eq(revenueGateScreenshots.placeId, placeId)
      });

      if (screenshot && screenshot.screenshotData) {
        const screenshotUrl = `${this.baseUrl}/api/revenue-gate/screenshot/${placeId}`;
        return { exists: true, url: screenshotUrl };
      }

      return { exists: false };
    } catch (error) {
      console.warn(`⚠️ Error checking existing screenshot for ${placeId}:`, error);
      return { exists: false };
    }
  }

  /**
   * Perform professional scan via API
   */
  private async performScan(companyName: string, website: string): Promise<{ success: boolean; placeId?: string; error?: string }> {
    try {
      console.log(`🔍 Starting scan for: ${companyName} (${website})`);
      
      // Try to find restaurant by company name first
      let searchResponse = await fetch(`${this.baseUrl}/api/restaurants/search?q=${encodeURIComponent(companyName)}`);
      
      if (!searchResponse.ok) {
        return { success: false, error: `Search API error: ${searchResponse.status}` };
      }

      let searchData = await searchResponse.json();
      
      // If no results with company name, try with domain name
      if (!searchData || searchData.length === 0) {
        console.log(`⚠️ No results for "${companyName}", trying domain search...`);
        
        try {
          const domain = new URL(website).hostname.replace('www.', '');
          searchResponse = await fetch(`${this.baseUrl}/api/restaurants/search?q=${encodeURIComponent(domain)}`);
          
          if (searchResponse.ok) {
            searchData = await searchResponse.json();
          }
        } catch (urlError) {
          // Invalid URL, skip domain search
        }
      }
      
      if (!searchData || searchData.length === 0) {
        return { success: false, error: `No restaurant found for "${companyName}" or website domain` };
      }

      const restaurant = searchData[0];
      const placeId = restaurant.placeId || restaurant.place_id;

      console.log(`🎯 Found restaurant: ${restaurant.name} (${placeId})`);

      // Perform professional scan
      const scanResponse = await fetch(`${this.baseUrl}/api/scan/professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: placeId,
          restaurantName: restaurant.name,
          domain: new URL(website.startsWith('http') ? website : `https://${website}`).hostname
        }),
      });

      if (!scanResponse.ok) {
        const errorText = await scanResponse.text();
        return { success: false, error: `Scan API error: ${scanResponse.status} - ${errorText}` };
      }

      console.log(`✅ Scan completed for: ${restaurant.name} (${placeId})`);
      return { success: true, placeId };

    } catch (error) {
      console.error(`❌ Scan failed for ${companyName}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Wait for screenshot to be generated and saved
   */
  private async waitForScreenshot(placeId: string, maxWaitTimeMs = 60000): Promise<{ success: boolean; url?: string }> {
    if (!placeId || placeId === 'undefined') {
      console.warn(`⚠️ Cannot wait for screenshot - invalid placeId: ${placeId}`);
      return { success: false };
    }
    
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTimeMs) {
      const result = await this.checkExistingScreenshot(placeId);
      
      if (result.exists) {
        console.log(`📸 Screenshot ready for placeId: ${placeId}`);
        return { success: true, url: result.url };
      }

      console.log(`⏳ Waiting for screenshot... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.warn(`⚠️ Screenshot timeout for placeId: ${placeId}`);
    return { success: false };
  }

  /**
   * Process a single website
   */
  private async processWebsite(companyName: string, website: string): Promise<ProcessingResult> {
    console.log(`\n🏢 Processing: ${companyName} (${website})`);

    // Check if we already have recent data
    const existingCheck = await this.checkExistingScan(website);
    
    if (existingCheck.hasRecent && existingCheck.placeId) {
      console.log(`⏭️ Recent scan exists (${existingCheck.scanAge} days old), checking screenshot...`);
      
      const screenshotCheck = await this.checkExistingScreenshot(existingCheck.placeId);
      
      if (screenshotCheck.exists) {
        console.log(`✅ Complete data already exists, skipping...`);
        this.stats.skipped++;
        return {
          companyName,
          website,
          status: 'skipped',
          placeId: existingCheck.placeId,
          screenshotUrl: screenshotCheck.url,
          details: `Recent scan exists (${existingCheck.scanAge} days old) with screenshot`
        };
      }
    }

    // Perform new scan using company name for search
    const scanResult = await this.performScan(companyName, website);
    
    if (!scanResult.success) {
      console.error(`❌ Scan failed: ${scanResult.error}`);
      this.stats.failed++;
      this.updateErrorStats(scanResult.error || 'Unknown error');
      
      return {
        companyName,
        website,
        status: 'failed',
        error: scanResult.error,
        details: 'Professional scan failed'
      };
    }

    // Wait for screenshot to be generated
    console.log(`📸 Waiting for screenshot generation...`);
    const screenshotResult = await this.waitForScreenshot(scanResult.placeId!);
    
    if (!screenshotResult.success) {
      console.warn(`⚠️ Screenshot generation failed or timed out`);
      this.stats.failed++;
      this.stats.errors.screenshotFailed++;
      
      return {
        companyName,
        website,
        status: 'failed',
        placeId: scanResult.placeId,
        error: 'Screenshot generation failed',
        details: 'Scan completed but screenshot generation failed'
      };
    }

    console.log(`✅ Complete success for ${companyName}`);
    this.stats.successful++;
    
    return {
      companyName,
      website,
      status: 'success',
      placeId: scanResult.placeId,
      screenshotUrl: screenshotResult.url,
      details: 'Scan and screenshot completed successfully'
    };
  }

  /**
   * Update error statistics
   */
  private updateErrorStats(error: string) {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('url') || errorLower.includes('invalid') || errorLower.includes('domain')) {
      this.stats.errors.invalidUrl++;
    } else if (errorLower.includes('scan') || errorLower.includes('search') || errorLower.includes('restaurant')) {
      this.stats.errors.scanFailed++;
    } else if (errorLower.includes('screenshot') || errorLower.includes('image')) {
      this.stats.errors.screenshotFailed++;
    } else if (errorLower.includes('database') || errorLower.includes('sql')) {
      this.stats.errors.databaseError++;
    } else {
      this.stats.errors.other++;
    }
  }

  /**
   * Process websites in batches with rate limiting
   */
  private async processBatch(websites: { companyName: string; website: string }[], batchSize = 5): Promise<void> {
    console.log(`🚀 Starting batch processing of ${websites.length} websites (batch size: ${batchSize})`);

    for (let i = 0; i < websites.length; i += batchSize) {
      const batch = websites.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(websites.length / batchSize)} (${batch.length} websites)`);

      // Process batch concurrently
      const batchPromises = batch.map(({ companyName, website }) => 
        this.processWebsite(companyName, website)
      );

      const batchResults = await Promise.all(batchPromises);
      this.results.push(...batchResults);
      this.stats.totalProcessed += batch.length;

      // Rate limiting delay between batches
      if (i + batchSize < websites.length) {
        console.log(`⏸️ Rate limiting: waiting 10 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(outputDir: string) {
    if (!existsSync(outputDir)) {
      console.log(`📁 Creating output directory: ${outputDir}`);
      mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Generate CSV reports including separate CSV for non-working websites
   */
  private generateCSVReports(outputDir = './batch-results') {
    this.ensureOutputDirectory(outputDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Successful results CSV
    const successfulResults = this.results.filter(r => r.status === 'success' || (r.status === 'skipped' && r.screenshotUrl));
    const successCSV = [
      'Company Name,Website,Screenshot URL,Place ID,Status',
      ...successfulResults.map(r => 
        `"${r.companyName}","${r.website}","${r.screenshotUrl || ''}","${r.placeId || ''}","${r.status}"`
      )
    ].join('\n');

    // NON-WORKING WEBSITES CSV - This is what you specifically requested
    const failedResults = this.results.filter(r => r.status === 'failed');
    const nonWorkingCSV = [
      'Company Name,Website,Error,Details',
      ...failedResults.map(r => 
        `"${r.companyName}","${r.website}","${r.error || ''}","${r.details || ''}"`
      )
    ].join('\n');

    // Complete results CSV
    const allResultsCSV = [
      'Company Name,Website,Status,Screenshot URL,Place ID,Error,Details',
      ...this.results.map(r => 
        `"${r.companyName}","${r.website}","${r.status}","${r.screenshotUrl || ''}","${r.placeId || ''}","${r.error || ''}","${r.details || ''}"`
      )
    ].join('\n');

    // Write CSV files
    writeFileSync(`${outputDir}/successful-websites-${timestamp}.csv`, successCSV);
    writeFileSync(`${outputDir}/non-working-websites-${timestamp}.csv`, nonWorkingCSV);
    writeFileSync(`${outputDir}/all-results-${timestamp}.csv`, allResultsCSV);

    // Statistics summary
    const statsCSV = [
      'Metric,Count,Percentage',
      `Total Processed,${this.stats.totalProcessed},100%`,
      `Successful,${this.stats.successful},${(this.stats.successful / this.stats.totalProcessed * 100).toFixed(1)}%`,
      `Skipped (Already Done),${this.stats.skipped},${(this.stats.skipped / this.stats.totalProcessed * 100).toFixed(1)}%`,
      `Failed,${this.stats.failed},${(this.stats.failed / this.stats.totalProcessed * 100).toFixed(1)}%`,
      '',
      'Error Breakdown,,',
      `Invalid URLs,${this.stats.errors.invalidUrl},`,
      `Scan Failures,${this.stats.errors.scanFailed},`,
      `Screenshot Failures,${this.stats.errors.screenshotFailed},`,
      `Database Errors,${this.stats.errors.databaseError},`,
      `Other Errors,${this.stats.errors.other},`
    ].join('\n');

    writeFileSync(`${outputDir}/batch-statistics-${timestamp}.csv`, statsCSV);

    console.log(`\n📊 CSV Reports generated:`);
    console.log(`✅ Successful websites: ${outputDir}/successful-websites-${timestamp}.csv (${successfulResults.length} entries)`);
    console.log(`❌ Non-working websites: ${outputDir}/non-working-websites-${timestamp}.csv (${failedResults.length} entries)`);
    console.log(`📋 All results: ${outputDir}/all-results-${timestamp}.csv (${this.results.length} entries)`);
    console.log(`📈 Statistics: ${outputDir}/batch-statistics-${timestamp}.csv`);

    return { successfulResults, failedResults };
  }

  /**
   * Main processing function for CSV files
   */
  async processCSVFile(filePath: string, options: {
    batchSize?: number;
    baseUrl?: string;
    outputDir?: string;
  } = {}) {
    try {
      const { batchSize = 5, baseUrl = 'https://boostly-restaurant-scanner.onrender.com', outputDir = './batch-results' } = options;
      
      this.baseUrl = baseUrl;

      console.log(`🚀 Starting CSV batch processing`);
      console.log(`📁 Input file: ${filePath}`);
      console.log(`🌐 Base URL: ${baseUrl}`);
      console.log(`📦 Batch size: ${batchSize}`);
      console.log(`📊 Output directory: ${outputDir}`);

      // Read CSV file
      const csvData = this.readCSVFile(filePath);
      
      // Extract websites and company names
      const websites: { companyName: string; website: string }[] = [];
      
      for (const row of csvData) {
        const website = this.extractWebsite(row);
        const companyName = this.extractCompanyName(row);
        
        if (website) {
          websites.push({ companyName, website });
        } else {
          console.warn(`⚠️ No valid website found for: ${companyName}`);
          this.stats.failed++;
          this.stats.errors.invalidUrl++;
          this.results.push({
            companyName,
            website: 'N/A',
            status: 'failed',
            error: 'No valid website URL found',
            details: 'Could not extract website URL from CSV row'
          });
        }
      }

      console.log(`\n📋 Found ${websites.length} valid websites to process`);
      
      if (websites.length === 0) {
        console.error(`❌ No valid websites found in CSV file. Check column names and data.`);
        return;
      }

      // Process all websites
      await this.processBatch(websites, batchSize);

      // Generate CSV reports
      const { successfulResults, failedResults } = this.generateCSVReports(outputDir);

      // Print final summary
      console.log(`\n🎉 CSV batch processing completed!`);
      console.log(`📊 Final Statistics:`);
      console.log(`   Total Processed: ${this.stats.totalProcessed}`);
      console.log(`   ✅ Successful: ${this.stats.successful}`);
      console.log(`   ⏭️ Skipped: ${this.stats.skipped}`);
      console.log(`   ❌ Failed: ${this.stats.failed}`);
      console.log(`   📈 Success Rate: ${(this.stats.successful / this.stats.totalProcessed * 100).toFixed(1)}%`);
      
      console.log(`\n🔍 Error Breakdown:`);
      console.log(`   Invalid URLs: ${this.stats.errors.invalidUrl}`);
      console.log(`   Scan Failures: ${this.stats.errors.scanFailed}`);
      console.log(`   Screenshot Failures: ${this.stats.errors.screenshotFailed}`);
      console.log(`   Database Errors: ${this.stats.errors.databaseError}`);
      console.log(`   Other Errors: ${this.stats.errors.other}`);

      console.log(`\n📋 Key Files Generated:`);
      console.log(`   ✅ Working websites with screenshot URLs`);
      console.log(`   ❌ Non-working websites for your manual review`);

      if (failedResults.length > 0) {
        console.log(`\n⚠️ ${failedResults.length} websites need manual review. Check the non-working-websites CSV file.`);
      }

    } catch (error) {
      console.error(`💥 CSV batch processing failed:`, error);
      throw error;
    } finally {
      await client.end();
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 CSV Batch Scanner Usage:

  npx tsx scripts/batch-scan-csv.ts <csv-file-path> [options]

Examples:
  npx tsx scripts/batch-scan-csv.ts "/Users/jakobthompson/Downloads/Historical Client Data.csv"
  npx tsx scripts/batch-scan-csv.ts "/path/to/file.csv" --batch-size=3 --output-dir=./my-results

Options:
  --batch-size=N     Process N websites concurrently (default: 5)
  --base-url=URL     Scanner API base URL (default: https://boostly-restaurant-scanner.onrender.com)
  --output-dir=DIR   Output directory for CSV reports (default: ./batch-results)

Output Files:
  ✅ successful-websites-TIMESTAMP.csv    - All working websites with screenshot URLs
  ❌ non-working-websites-TIMESTAMP.csv   - Websites that failed (for manual review)
  📋 all-results-TIMESTAMP.csv            - Complete results
  📈 batch-statistics-TIMESTAMP.csv       - Success rates and error breakdown

Environment Variables:
  DATABASE_URL       PostgreSQL connection string (required)
    `);
    process.exit(1);
  }

  const filePath = args[0];
  
  // Parse options
  const options: any = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.split('=')[1];
    }
  }

  const processor = new CSVBatchProcessor();
  await processor.processCSVFile(filePath, options);
}

// Run if called directly
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export { CSVBatchProcessor };