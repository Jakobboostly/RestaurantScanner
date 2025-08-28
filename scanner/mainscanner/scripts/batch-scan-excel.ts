#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import { writeFileSync, existsSync } from 'fs';
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
const db = drizzle(client);

// Types for processing
interface ExcelRow {
  companyName?: string;
  restaurantName?: string;
  website?: string;
  domain?: string;
  url?: string;
  [key: string]: any; // Allow for unknown column names
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

class ExcelBatchProcessor {
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

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Read and parse Excel file
   */
  private readExcelFile(filePath: string): ExcelRow[] {
    console.log(`📖 Reading Excel file: ${filePath}`);
    
    if (!existsSync(filePath)) {
      throw new Error(`Excel file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

    console.log(`📊 Found ${data.length} rows in Excel file`);
    console.log(`📄 Sheet name: ${sheetName}`);
    
    // Log first few rows to understand structure
    if (data.length > 0) {
      console.log(`🔍 Column names:`, Object.keys(data[0]));
      console.log(`📋 Sample row:`, data[0]);
    }

    return data;
  }

  /**
   * Extract website URL from various possible column names
   */
  private extractWebsite(row: ExcelRow): string | null {
    const possibleWebsiteFields = [
      'website', 'Website', 'WEBSITE',
      'url', 'URL', 'Url',
      'domain', 'Domain', 'DOMAIN',
      'Website URL', 'website_url',
      'Company Website', 'company_website',
      'Site', 'site', 'SITE'
    ];

    for (const field of possibleWebsiteFields) {
      if (row[field] && typeof row[field] === 'string') {
        let url = row[field].toString().trim();
        
        // Skip obvious non-URLs
        if (url.includes('@') || url.includes('phone') || url.includes('tel:')) {
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
  private extractCompanyName(row: ExcelRow): string {
    const possibleNameFields = [
      'companyName', 'Company Name', 'COMPANY_NAME',
      'restaurantName', 'Restaurant Name', 'RESTAURANT_NAME',
      'name', 'Name', 'NAME',
      'company', 'Company', 'COMPANY',
      'business', 'Business', 'BUSINESS',
      'Account Name', 'account_name'
    ];

    for (const field of possibleNameFields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].toString().trim();
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
  private async performScan(website: string): Promise<{ success: boolean; placeId?: string; error?: string }> {
    try {
      console.log(`🔍 Starting scan for: ${website}`);
      
      // Use Google Places API to search for the restaurant first
      const searchResponse = await fetch(`${this.baseUrl}/api/restaurants/search?query=${encodeURIComponent(website)}`);
      
      if (!searchResponse.ok) {
        return { success: false, error: `Search API error: ${searchResponse.status}` };
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.restaurants || searchData.restaurants.length === 0) {
        return { success: false, error: 'No restaurant found for this website' };
      }

      const restaurant = searchData.restaurants[0];
      const placeId = restaurant.place_id;

      // Perform professional scan
      const scanResponse = await fetch(`${this.baseUrl}/api/scan/professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: placeId,
          restaurantName: restaurant.name,
          website: website
        }),
      });

      if (!scanResponse.ok) {
        return { success: false, error: `Scan API error: ${scanResponse.status}` };
      }

      console.log(`✅ Scan completed for: ${website} (${placeId})`);
      return { success: true, placeId };

    } catch (error) {
      console.error(`❌ Scan failed for ${website}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Wait for screenshot to be generated and saved
   */
  private async waitForScreenshot(placeId: string, maxWaitTimeMs = 60000): Promise<{ success: boolean; url?: string }> {
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

    // Perform new scan
    const scanResult = await this.performScan(website);
    
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
   * Generate comprehensive reports
   */
  private generateReports(outputDir = './batch-results') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Success report - all working screenshot URLs
    const successfulResults = this.results.filter(r => r.status === 'success' || (r.status === 'skipped' && r.screenshotUrl));
    const successReport = {
      generated: new Date().toISOString(),
      total: successfulResults.length,
      results: successfulResults.map(r => ({
        companyName: r.companyName,
        website: r.website,
        screenshotUrl: r.screenshotUrl,
        placeId: r.placeId,
        status: r.status
      }))
    };

    // Failed report - for manual review and retry
    const failedResults = this.results.filter(r => r.status === 'failed');
    const failedReport = {
      generated: new Date().toISOString(),
      total: failedResults.length,
      results: failedResults.map(r => ({
        companyName: r.companyName,
        website: r.website,
        error: r.error,
        details: r.details,
        placeId: r.placeId
      }))
    };

    // Statistics report
    const statsReport = {
      ...this.stats,
      generated: new Date().toISOString(),
      successRate: this.stats.totalProcessed > 0 ? (this.stats.successful / this.stats.totalProcessed * 100).toFixed(2) + '%' : '0%'
    };

    // Write reports
    writeFileSync(`${outputDir}/success-report-${timestamp}.json`, JSON.stringify(successReport, null, 2));
    writeFileSync(`${outputDir}/failed-report-${timestamp}.json`, JSON.stringify(failedReport, null, 2));
    writeFileSync(`${outputDir}/stats-report-${timestamp}.json`, JSON.stringify(statsReport, null, 2));

    // Write CSV for easy viewing
    const csvData = this.results.map(r => ({
      'Company Name': r.companyName,
      'Website': r.website,
      'Status': r.status,
      'Screenshot URL': r.screenshotUrl || '',
      'Place ID': r.placeId || '',
      'Error': r.error || '',
      'Details': r.details || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    writeFileSync(`${outputDir}/batch-results-${timestamp}.csv`, csvContent);

    console.log(`\n📊 Reports generated:`);
    console.log(`✅ Success report: ${outputDir}/success-report-${timestamp}.json (${successfulResults.length} entries)`);
    console.log(`❌ Failed report: ${outputDir}/failed-report-${timestamp}.json (${failedResults.length} entries)`);
    console.log(`📈 Stats report: ${outputDir}/stats-report-${timestamp}.json`);
    console.log(`📋 CSV report: ${outputDir}/batch-results-${timestamp}.csv`);

    return { successReport, failedReport, statsReport };
  }

  /**
   * Main processing function
   */
  async processExcelFile(filePath: string, options: {
    batchSize?: number;
    baseUrl?: string;
    outputDir?: string;
  } = {}) {
    try {
      const { batchSize = 5, baseUrl = 'https://boostly-restaurant-scanner.onrender.com', outputDir = './batch-results' } = options;
      
      this.baseUrl = baseUrl;

      console.log(`🚀 Starting Excel batch processing`);
      console.log(`📁 Input file: ${filePath}`);
      console.log(`🌐 Base URL: ${baseUrl}`);
      console.log(`📦 Batch size: ${batchSize}`);
      console.log(`📊 Output directory: ${outputDir}`);

      // Read Excel file
      const excelData = this.readExcelFile(filePath);
      
      // Extract websites and company names
      const websites: { companyName: string; website: string }[] = [];
      
      for (const row of excelData) {
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
            details: 'Could not extract website URL from Excel row'
          });
        }
      }

      console.log(`\n📋 Found ${websites.length} valid websites to process`);
      
      if (websites.length === 0) {
        console.error(`❌ No valid websites found in Excel file. Check column names and data.`);
        return;
      }

      // Process all websites
      await this.processBatch(websites, batchSize);

      // Generate reports
      const reports = this.generateReports(outputDir);

      // Print final summary
      console.log(`\n🎉 Batch processing completed!`);
      console.log(`📊 Final Statistics:`);
      console.log(`   Total Processed: ${this.stats.totalProcessed}`);
      console.log(`   ✅ Successful: ${this.stats.successful}`);
      console.log(`   ⏭️ Skipped: ${this.stats.skipped}`);
      console.log(`   ❌ Failed: ${this.stats.failed}`);
      console.log(`   📈 Success Rate: ${reports.statsReport.successRate}`);
      console.log(`\n🔍 Error Breakdown:`);
      console.log(`   Invalid URLs: ${this.stats.errors.invalidUrl}`);
      console.log(`   Scan Failures: ${this.stats.errors.scanFailed}`);
      console.log(`   Screenshot Failures: ${this.stats.errors.screenshotFailed}`);
      console.log(`   Database Errors: ${this.stats.errors.databaseError}`);
      console.log(`   Other Errors: ${this.stats.errors.other}`);

      if (this.stats.failed > 0) {
        console.log(`\n⚠️ ${this.stats.failed} websites failed processing. Check the failed report for manual review.`);
      }

      console.log(`\n✅ All reports saved to: ${outputDir}`);

    } catch (error) {
      console.error(`💥 Batch processing failed:`, error);
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
🚀 Excel Batch Scanner Usage:

  npx tsx scripts/batch-scan-excel.ts <excel-file-path> [options]

Examples:
  npx tsx scripts/batch-scan-excel.ts "/path/to/HubSpot CRM Historical Clients Aug 27 2025.xlsx"
  npx tsx scripts/batch-scan-excel.ts "/path/to/file.xlsx" --batch-size=3 --base-url=http://localhost:3000

Options:
  --batch-size=N     Process N websites concurrently (default: 5)
  --base-url=URL     Scanner API base URL (default: https://boostly-restaurant-scanner.onrender.com)
  --output-dir=DIR   Output directory for reports (default: ./batch-results)

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

  const processor = new ExcelBatchProcessor();
  await processor.processExcelFile(filePath, options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { ExcelBatchProcessor };