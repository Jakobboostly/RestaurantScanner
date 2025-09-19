#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';

interface ProcessingStats {
  total: number;
  successful: number;
  failed: number;
  hubspotUpdated: number;
  hubspotFailed: number;
}

class CSVHubSpotScoreUpdater {
  private apiUrl: string;
  private stats: ProcessingStats = {
    total: 0,
    successful: 0,
    failed: 0,
    hubspotUpdated: 0,
    hubspotFailed: 0
  };

  constructor(
    apiUrl: string = 'https://boostly-restaurant-scanner.onrender.com/api/csv/calculate-scores'
  ) {
    this.apiUrl = apiUrl;
  }

  private async readCSVFile(filePath: string): Promise<string> {
    console.log(`📖 Reading CSV file: ${filePath}`);

    if (!await fs.stat(filePath).catch(() => false)) {
      throw new Error(`CSV file not found: ${filePath}`);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`✅ CSV file read successfully`);
    return content;
  }

  private parseProgressEvent(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async processCSV(csvPath: string, outputPath?: string, batchSize: number = 5): Promise<void> {
    console.log('🚀 Starting CSV HubSpot Score Updater');
    console.log(`📁 Input file: ${csvPath}`);
    console.log(`🌐 API URL: ${this.apiUrl}`);
    console.log(`📦 Batch size: ${batchSize}`);
    console.log(`🔗 HubSpot API: ${process.env.HUBSPOT_API_KEY ? 'Configured' : 'Not configured'}\n`);

    try {
      // Read CSV content
      const csvContent = await this.readCSVFile(csvPath);

      // Validate CSV has content
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file must contain header and at least one data row');
      }

      // Check for Record ID column
      const headers = lines[0].toLowerCase();
      if (!headers.includes('record id')) {
        throw new Error('CSV must contain "Record ID" column for HubSpot updates');
      }

      console.log(`📊 Found ${lines.length - 1} records to process\n`);

      // Make API request with streaming response
      console.log('📤 Sending CSV to API for processing...\n');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvContent,
          batchSize
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      // Process Server-Sent Events
      const reader = response.body;
      if (!reader) {
        throw new Error('No response body received');
      }

      let csvOutput: string | null = null;
      let buffer = '';

      // Read streaming response
      for await (const chunk of reader) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            const event = this.parseProgressEvent(data);

            if (event) {
              switch (event.type) {
                case 'start':
                  console.log(`📋 Starting processing of ${event.totalRecords} records`);
                  break;

                case 'progress':
                  console.log(`\n📦 Batch ${event.batchNumber}/${event.totalBatches}`);
                  console.log(`   Processed: ${event.processedRecords}/${event.totalRecords}`);
                  break;

                case 'record':
                  const statusIcon = event.status === 'success' ? '✅' : '❌';
                  const hubspotIcon = event.hubspotStatus === 'updated' ? '📤' :
                                     event.hubspotStatus === 'failed' ? '⚠️' : '⏭️';

                  console.log(`   ${statusIcon} ${event.companyName}`);
                  console.log(`      Record ID: ${event.recordId}`);
                  console.log(`      Scores: Overall=${event.scores.overall}, Search=${event.scores.search}, Social=${event.scores.social}, Local=${event.scores.local}, Reviews=${event.scores.reviews}`);
                  console.log(`      ${hubspotIcon} HubSpot: ${event.hubspotStatus}`);
                  break;

                case 'complete':
                  this.stats = event.stats;
                  csvOutput = event.csvOutput;
                  console.log(`\n✅ Processing completed!`);
                  break;

                case 'error':
                  console.error(`\n❌ Error: ${event.error}`);
                  break;
              }
            }
          }
        }
      }

      // Save output CSV if requested
      if (csvOutput && outputPath) {
        await fs.writeFile(outputPath, csvOutput);
        console.log(`\n💾 Results saved to: ${outputPath}`);
      }

      // Print final statistics
      this.printStats();

    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      this.printStats();
      process.exit(1);
    }
  }

  private printStats(): void {
    if (this.stats.total === 0) return;

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total records processed: ${this.stats.total}`);
    console.log(`✅ Successful scans: ${this.stats.successful}`);
    console.log(`❌ Failed scans: ${this.stats.failed}`);
    console.log(`📤 HubSpot updates successful: ${this.stats.hubspotUpdated}`);
    console.log(`⚠️ HubSpot updates failed: ${this.stats.hubspotFailed}`);

    const successRate = Math.round((this.stats.successful / this.stats.total) * 100);
    const hubspotRate = this.stats.successful > 0
      ? Math.round((this.stats.hubspotUpdated / this.stats.successful) * 100)
      : 0;

    console.log(`\nScan success rate: ${successRate}%`);
    console.log(`HubSpot update rate: ${hubspotRate}%`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🚀 CSV HubSpot Score Updater

Usage:
  npx tsx scripts/csv-hubspot-score-updater.ts <csv-file> [options]

Options:
  --output=<path>     Save results to CSV file
  --batch-size=<n>    Process n records at a time (default: 5)
  --api-url=<url>     Custom API endpoint URL

Required CSV Columns:
  - Record ID (HubSpot company record ID)
  - Website or Website URL
  - Company Name (optional but recommended)

Environment Variables:
  HUBSPOT_API_KEY     Required for HubSpot updates

Example:
  npx tsx scripts/csv-hubspot-score-updater.ts companies.csv --output=results.csv --batch-size=3

Output Scores:
  The script calculates 5 scores for each restaurant:
  - Overall Score (weighted average)
  - Search Score (SEO performance)
  - Social Score (social media presence)
  - Local Score (local search visibility)
  - Reviews Score (review sentiment)

HubSpot Property Mappings:
  - Overall Score → overall_score
  - Reviews Score → review_score
  - Local Score → seo_score
  - Social Score → social_score
    `);
    process.exit(0);
  }

  const csvPath = args[0];
  let outputPath: string | undefined;
  let batchSize = 5;
  let apiUrl = process.env.API_URL || 'https://boostly-restaurant-scanner.onrender.com/api/csv/calculate-scores';

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--output=')) {
      outputPath = arg.split('=')[1];
    } else if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1]) || 5;
    } else if (arg.startsWith('--api-url=')) {
      apiUrl = arg.split('=')[1];
    }
  }

  // Check for HubSpot API key
  if (!process.env.HUBSPOT_API_KEY) {
    console.warn('⚠️ WARNING: HUBSPOT_API_KEY not set. HubSpot updates will be skipped.\n');
  }

  const updater = new CSVHubSpotScoreUpdater(apiUrl);
  await updater.processCSV(csvPath, outputPath, batchSize);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});