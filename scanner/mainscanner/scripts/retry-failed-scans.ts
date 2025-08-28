#!/usr/bin/env tsx

import { ExcelBatchProcessor } from './batch-scan-excel';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface FailedEntry {
  companyName: string;
  website: string;
  error: string;
  details: string;
  placeId?: string;
}

interface FailedReport {
  generated: string;
  total: number;
  results: FailedEntry[];
}

class RetryProcessor extends ExcelBatchProcessor {
  /**
   * Process only the failed entries from a previous batch run
   */
  async retryFailedEntries(failedReportPath: string, options: {
    batchSize?: number;
    baseUrl?: string;
    outputDir?: string;
    filterErrors?: string[]; // Only retry specific error types
  } = {}) {
    try {
      console.log(`🔄 Starting retry processing for failed entries`);
      console.log(`📁 Failed report: ${failedReportPath}`);

      if (!existsSync(failedReportPath)) {
        throw new Error(`Failed report file not found: ${failedReportPath}`);
      }

      // Read failed report
      const failedReportContent = readFileSync(failedReportPath, 'utf-8');
      const failedReport: FailedReport = JSON.parse(failedReportContent);

      console.log(`📊 Found ${failedReport.total} failed entries from ${failedReport.generated}`);

      if (failedReport.total === 0) {
        console.log(`✅ No failed entries to retry!`);
        return;
      }

      // Filter by error types if specified
      let entriesToRetry = failedReport.results;
      if (options.filterErrors && options.filterErrors.length > 0) {
        entriesToRetry = failedReport.results.filter(entry => {
          return options.filterErrors!.some(errorType => 
            entry.error.toLowerCase().includes(errorType.toLowerCase()) ||
            entry.details.toLowerCase().includes(errorType.toLowerCase())
          );
        });
        console.log(`🔍 Filtered to ${entriesToRetry.length} entries matching error types: ${options.filterErrors.join(', ')}`);
      }

      if (entriesToRetry.length === 0) {
        console.log(`⚠️ No entries match the specified filters`);
        return;
      }

      // Convert to the format expected by the processor
      const websites = entriesToRetry
        .filter(entry => entry.website && entry.website !== 'N/A')
        .map(entry => ({
          companyName: entry.companyName,
          website: entry.website
        }));

      console.log(`🔄 Retrying ${websites.length} websites`);

      // Process the retry batch
      const { batchSize = 3, baseUrl = 'https://boostly-restaurant-scanner.onrender.com', outputDir = './retry-results' } = options;
      
      this.baseUrl = baseUrl;
      
      console.log(`📦 Retry batch size: ${batchSize} (smaller batches for failed entries)`);
      console.log(`🌐 Base URL: ${baseUrl}`);
      console.log(`📊 Output directory: ${outputDir}`);

      await this.processBatch(websites, batchSize);

      // Generate retry-specific reports
      const reports = this.generateReports(outputDir);

      // Print retry summary
      console.log(`\n🔄 Retry processing completed!`);
      console.log(`📊 Retry Statistics:`);
      console.log(`   Total Retried: ${this.stats.totalProcessed}`);
      console.log(`   ✅ Now Successful: ${this.stats.successful}`);
      console.log(`   ⏭️ Skipped: ${this.stats.skipped}`);
      console.log(`   ❌ Still Failed: ${this.stats.failed}`);
      console.log(`   📈 Retry Success Rate: ${reports.statsReport.successRate}`);

      if (this.stats.successful > 0) {
        console.log(`\n🎉 ${this.stats.successful} previously failed websites are now working!`);
      }

      if (this.stats.failed > 0) {
        console.log(`\n⚠️ ${this.stats.failed} websites are still failing. These may need manual intervention.`);
      }

      console.log(`\n✅ Retry reports saved to: ${outputDir}`);

    } catch (error) {
      console.error(`💥 Retry processing failed:`, error);
      throw error;
    }
  }
}

// CLI usage for retry script
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔄 Failed Entry Retry Script Usage:

  npx tsx scripts/retry-failed-scans.ts <failed-report.json> [options]

Examples:
  npx tsx scripts/retry-failed-scans.ts "./batch-results/failed-report-2025-01-28T15-30-45-123Z.json"
  npx tsx scripts/retry-failed-scans.ts "./batch-results/failed-report.json" --batch-size=2 --filter-errors=screenshot,timeout

Options:
  --batch-size=N           Process N websites concurrently (default: 3, smaller for retries)
  --base-url=URL           Scanner API base URL (default: https://boostly-restaurant-scanner.onrender.com)
  --output-dir=DIR         Output directory for retry reports (default: ./retry-results)
  --filter-errors=TYPES    Only retry specific error types (comma-separated)
                           Examples: "screenshot", "timeout", "invalid", "scan"

Filter Examples:
  --filter-errors=screenshot    Only retry screenshot failures
  --filter-errors=scan,search   Only retry scan/search failures
  --filter-errors=invalid,url   Only retry URL/domain issues

Environment Variables:
  DATABASE_URL            PostgreSQL connection string (required)
    `);
    process.exit(1);
  }

  const failedReportPath = args[0];
  
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
    } else if (arg.startsWith('--filter-errors=')) {
      options.filterErrors = arg.split('=')[1].split(',').map(s => s.trim());
    }
  }

  console.log(`🔄 Retry Processor Starting...`);
  if (options.filterErrors) {
    console.log(`🔍 Filtering for error types: ${options.filterErrors.join(', ')}`);
  }

  const retryProcessor = new RetryProcessor();
  await retryProcessor.retryFailedEntries(failedReportPath, options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Retry processing fatal error:', error);
    process.exit(1);
  });
}

export { RetryProcessor };