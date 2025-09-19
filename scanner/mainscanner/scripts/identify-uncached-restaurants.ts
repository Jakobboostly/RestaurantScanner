#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';
import { eq } from 'drizzle-orm';
import { db } from '../server/db';
import { fullScanResults } from '../shared/schema';

interface CSVRecord {
  'Record ID': string;
  'Company name': string;
  'Website URL': string;
  [key: string]: string;
}

interface UncachedRecord extends CSVRecord {
  reason: 'no_database_entry' | 'no_filesystem_cache' | 'empty_url' | 'invalid_url';
}

// CSV parsing functions (copied from existing scripts)
function parseCSVRow(line: string): string[] {
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
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCSV<T>(content: string): T[] {
  const lines = content.trim().split('\n');
  const headerLine = lines[0];
  const headers = parseCSVRow(headerLine);
  const dataLines = lines.slice(1);

  return dataLines.map(line => {
    const values = parseCSVRow(line);
    const record: any = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    return record as T;
  });
}

function createCSV<T extends Record<string, any>>(records: T[]): string {
  if (records.length === 0) return '';

  const headers = Object.keys(records[0]);
  const lines = [headers.join(',')];

  records.forEach(record => {
    const values = headers.map(header => {
      const value = String(record[header] || '');
      // Escape quotes and wrap in quotes if needed
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

class UncachedRestaurantIdentifier {
  private cacheDir = path.join(process.cwd(), 'scan-cache');

  async identifyUncachedRestaurants(csvPath: string): Promise<void> {
    console.log('🔍 Identifying restaurants that need fresh scans...\n');

    try {
      // Read the CSV file
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const records: CSVRecord[] = parseCSV<CSVRecord>(csvContent);

      console.log(`📋 Found ${records.length} total records in CSV`);

      // Check database cache first
      let dbScanResults: any[] = [];
      if (db) {
        try {
          console.log('🗄️ Fetching all scan results from database...');
          dbScanResults = await db.select().from(fullScanResults);
          console.log(`📊 Found ${dbScanResults.length} scan results in database\n`);
        } catch (error) {
          console.warn('⚠️ Database unavailable, checking filesystem only:', error);
        }
      }

      // Create a map for quick lookup
      const dbUrlMap = new Map();
      const dbDomainMap = new Map();

      dbScanResults.forEach(result => {
        if (result.scanData?.domain) {
          dbDomainMap.set(result.scanData.domain, result);
        }
        if (result.scanData?.websiteUrl) {
          dbUrlMap.set(result.scanData.websiteUrl, result);
        }
      });

      // Process each record
      const uncachedRecords: UncachedRecord[] = [];
      const cachedRecords: CSVRecord[] = [];
      let processedCount = 0;

      for (const record of records) {
        processedCount++;
        const url = record['Website URL']?.trim();

        // Skip records with no URL
        if (!url || url === '' || url === '(No value)') {
          uncachedRecords.push({
            ...record,
            reason: 'empty_url'
          });
          if (processedCount % 100 === 0) {
            console.log(`⏳ Processed ${processedCount}/${records.length} records...`);
          }
          continue;
        }

        // Normalize URL for comparison
        const normalizedUrl = this.normalizeUrl(url);
        const domain = this.extractDomain(normalizedUrl);

        // Check database cache
        let foundInDb = false;
        if (dbUrlMap.has(url) || dbUrlMap.has(normalizedUrl) || dbDomainMap.has(domain)) {
          foundInDb = true;
          cachedRecords.push(record);
        }

        // If not in database, check filesystem cache
        if (!foundInDb) {
          const hasFilesystemCache = await this.checkFilesystemCache(domain);
          if (hasFilesystemCache) {
            cachedRecords.push(record);
          } else {
            uncachedRecords.push({
              ...record,
              reason: 'no_database_entry'
            });
          }
        }

        if (processedCount % 100 === 0) {
          console.log(`⏳ Processed ${processedCount}/${records.length} records...`);
        }
      }

      // Print summary
      console.log('\n' + '='.repeat(70));
      console.log('📊 CACHE ANALYSIS SUMMARY');
      console.log('='.repeat(70));
      console.log(`Total records: ${records.length}`);
      console.log(`Cached (have scan data): ${cachedRecords.length}`);
      console.log(`Uncached (need fresh scans): ${uncachedRecords.length}`);
      console.log(`Cache coverage: ${Math.round((cachedRecords.length / records.length) * 100)}%`);

      // Break down uncached reasons
      const reasonCounts = uncachedRecords.reduce((acc, record) => {
        acc[record.reason] = (acc[record.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\nUncached breakdown:');
      Object.entries(reasonCounts).forEach(([reason, count]) => {
        console.log(`  ${reason}: ${count}`);
      });

      // Save uncached records to CSV
      if (uncachedRecords.length > 0) {
        const uncachedCsvPath = './uncached-restaurants.csv';
        const cleanedRecords = uncachedRecords.map(record => {
          const { reason, ...csvData } = record;
          return csvData;
        });
        const uncachedCsvContent = createCSV(cleanedRecords);

        await fs.writeFile(uncachedCsvPath, uncachedCsvContent);
        console.log(`\n📄 Created uncached restaurants CSV: ${uncachedCsvPath}`);
        console.log(`🎯 Ready for targeted scanning of ${uncachedRecords.length} restaurants`);
      }

      // Also save cached records for reference
      if (cachedRecords.length > 0) {
        const cachedCsvPath = './cached-restaurants.csv';
        const cachedCsvContent = createCSV(cachedRecords);

        await fs.writeFile(cachedCsvPath, cachedCsvContent);
        console.log(`📄 Created cached restaurants CSV: ${cachedCsvPath}`);
      }

      console.log('='.repeat(70));

    } catch (error) {
      console.error('❌ Error identifying uncached restaurants:', error);
      process.exit(1);
    }
  }

  private normalizeUrl(url: string): string {
    // Remove protocol and trailing slashes for comparison
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  }

  private extractDomain(url: string): string {
    try {
      // Add protocol if missing for URL parsing
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(fullUrl);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      // Fallback for malformed URLs
      return url.split('/')[0].replace(/^www\./, '');
    }
  }

  private async checkFilesystemCache(domain: string): Promise<boolean> {
    try {
      // Check if there's a cache directory for this domain
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const cachePath = path.join(this.cacheDir, entry.name, 'scan.json');
          try {
            const content = await fs.readFile(cachePath, 'utf-8');
            const cachedScan = JSON.parse(content);

            // Check if this cache entry matches the domain
            if (cachedScan.data?.domain === domain ||
                cachedScan.data?.websiteUrl?.includes(domain)) {
              return true;
            }
          } catch {
            // Skip invalid cache files
            continue;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}

// Main execution
async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('❌ Usage: npx tsx scripts/identify-uncached-restaurants.ts <path-to-csv>');
    process.exit(1);
  }

  console.log(`🚀 Analyzing cache coverage for: ${csvPath}\n`);

  const identifier = new UncachedRestaurantIdentifier();
  await identifier.identifyUncachedRestaurants(csvPath);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});