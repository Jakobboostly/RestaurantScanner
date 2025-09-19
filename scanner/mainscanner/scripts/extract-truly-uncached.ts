#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import { eq } from 'drizzle-orm';
import { db } from '../server/db';
import { fullScanResults } from '../shared/schema';

interface CSVRecord {
  'Record ID': string;
  'Company name': string;
  'Website URL': string;
  [key: string]: string;
}

// CSV parsing functions
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
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
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

function extractDomain(url: string): string {
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

async function extractUncachedRestaurants(csvPath: string): Promise<void> {
  console.log('🎯 Extracting ONLY uncached restaurants...\n');

  try {
    // Read the CSV file
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const allRecords: CSVRecord[] = parseCSV<CSVRecord>(csvContent);

    console.log(`📋 Found ${allRecords.length} total records in CSV`);

    // Get all cached domains from database
    console.log('🗄️ Fetching all cached domains from database...');
    const dbResults = await db.select().from(fullScanResults);
    console.log(`📊 Found ${dbResults.length} cached scans in database`);

    // Create a Set of cached domains for fast lookup
    const cachedDomains = new Set<string>();
    dbResults.forEach(result => {
      if (result.domain) {
        cachedDomains.add(result.domain);
      }
      if (result.scanData?.domain) {
        cachedDomains.add(result.scanData.domain);
      }
      if (result.scanData?.websiteUrl) {
        const domain = extractDomain(result.scanData.websiteUrl);
        cachedDomains.add(domain);
      }
    });

    console.log(`🔍 Created lookup set with ${cachedDomains.size} unique cached domains`);

    // Find truly uncached records
    const uncachedRecords: CSVRecord[] = [];
    const emptyUrlRecords: CSVRecord[] = [];

    for (const record of allRecords) {
      const websiteUrl = record['Website URL']?.trim();

      // Skip records with no URL
      if (!websiteUrl || websiteUrl === '' || websiteUrl === '(No value)') {
        emptyUrlRecords.push(record);
        continue;
      }

      // Extract domain and check if cached
      const domain = extractDomain(websiteUrl);

      if (!cachedDomains.has(domain)) {
        uncachedRecords.push(record);
        console.log(`📝 Uncached: ${record['Company name']} - ${domain}`);
      }
    }

    // Calculate stats
    const cachedCount = allRecords.length - uncachedRecords.length - emptyUrlRecords.length;

    console.log('\n' + '='.repeat(70));
    console.log('📊 UNCACHED EXTRACTION RESULTS');
    console.log('='.repeat(70));
    console.log(`Total records: ${allRecords.length}`);
    console.log(`Already cached: ${cachedCount}`);
    console.log(`Need fresh scans: ${uncachedRecords.length}`);
    console.log(`Empty/invalid URLs: ${emptyUrlRecords.length}`);

    // Save uncached records to CSV
    if (uncachedRecords.length > 0) {
      const uncachedCsvPath = './uncached-restaurants-only.csv';
      const uncachedCsvContent = createCSV(uncachedRecords);
      await fs.writeFile(uncachedCsvPath, uncachedCsvContent);

      console.log(`\n📄 Created uncached-only CSV: ${uncachedCsvPath}`);
      console.log(`🎯 Contains exactly ${uncachedRecords.length} restaurants that need scanning`);
      console.log(`⏱️ Estimated scan time: ${Math.round((uncachedRecords.length * 2.5) / 60)} minutes`);
    } else {
      console.log('\n✅ All restaurants are already cached!');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error extracting uncached restaurants:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('❌ Usage: npx tsx scripts/extract-truly-uncached.ts <path-to-csv>');
    process.exit(1);
  }

  await extractUncachedRestaurants(csvPath);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});