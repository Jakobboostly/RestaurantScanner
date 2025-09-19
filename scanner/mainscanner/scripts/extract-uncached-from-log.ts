#!/usr/bin/env tsx

import * as fs from 'fs/promises';

// Known uncached restaurants from the working cache script output
const knownUncachedCompanies = [
  "lionsdenpizzeria.com",
  "Pizza Delizia",
  "HG Bucks Bagel",
  "Mario's Pizza & BBQ (North Aurora)",
  "Russo's | Pearland",
  "Slice Minneapolis",
  "Phillips Group",
  "Carollos' Family Restaurant",
  "East of Chicago (Sugarcreek)",
  "Carluccis",
  "Russo's | Meyerland",
  "Zizi Ramen Sushi",
  "Good Vibes Pizza",
  "Pasquale's Pizzeria (Dravosburg)",
  "Pizza in the Neighbor Hood",
  "Uncle Chip's",
  "Bear Pizza and More",
  "Moscatos Pizza (Belvidere)",
  "Village Host Pizza & Grill Aptos",
  "Seven Nine Four",
  "Punjabi Dhaba Restaurant",
  "Fiery Nashville Hot Chicken",
  "Salerno's Pizzeria & Sports Bar (Hodgkins)",
  "Mr. Jim's Pizza",
  "Lon U",
  "Fox's Pizza Den | Michael Kumanchik",
  "Fratellis Pizzeria",
  "Village Host Pizza & Grill Capitola",
  "Vintage Restaurant",
  "New York J&P Pizza (Damascus)",
  "Russo's | Morton Ranch",
  "Millie's Pizza",
  "BK's Pizza Express",
  "Terry Ho's Quick",
  "Russo's | New Caney",
  "Villa Maria Pizza",
  "Trevi Square Pizza",
  "The Chef and I"
];

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
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
}

interface CSVRecord {
  'Record ID': string;
  'Company name': string;
  'Website URL': string;
  [key: string]: string;
}

async function extractUncachedRestaurants(csvPath: string): Promise<void> {
  console.log('🎯 Extracting uncached restaurants for targeted scanning...\n');

  try {
    // Read the full CSV
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const allRecords: CSVRecord[] = parseCSV<CSVRecord>(csvContent);

    console.log(`📋 Found ${allRecords.length} total records in CSV`);

    // Find records that need fresh scans
    const uncachedRecords: CSVRecord[] = [];
    const emptyUrlRecords: CSVRecord[] = [];

    for (const record of allRecords) {
      const companyName = record['Company name']?.trim();
      const websiteUrl = record['Website URL']?.trim();

      // Skip records with no URL or empty URL
      if (!websiteUrl || websiteUrl === '' || websiteUrl === '(No value)') {
        emptyUrlRecords.push(record);
        continue;
      }

      // Check if this company is in our known uncached list
      const isKnownUncached = knownUncachedCompanies.some(uncachedName =>
        companyName.includes(uncachedName) || uncachedName.includes(companyName) ||
        websiteUrl.includes(uncachedName)
      );

      if (isKnownUncached) {
        uncachedRecords.push(record);
      }
    }

    // Calculate stats
    const cachedCount = allRecords.length - uncachedRecords.length - emptyUrlRecords.length;
    const coverage = Math.round((cachedCount / allRecords.length) * 100);

    console.log('\n' + '='.repeat(70));
    console.log('📊 TARGETED SCAN ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Total records: ${allRecords.length}`);
    console.log(`Cached (already have scan data): ${cachedCount}`);
    console.log(`Need fresh scans: ${uncachedRecords.length}`);
    console.log(`Empty/invalid URLs: ${emptyUrlRecords.length}`);
    console.log(`Cache coverage: ${coverage}%`);

    // Save uncached records for targeted scanning
    if (uncachedRecords.length > 0) {
      const uncachedCsvPath = './uncached-restaurants-targeted.csv';
      const uncachedCsvContent = createCSV(uncachedRecords);
      await fs.writeFile(uncachedCsvPath, uncachedCsvContent);

      console.log(`\n📄 Created targeted uncached restaurants CSV: ${uncachedCsvPath}`);
      console.log(`🎯 Ready for efficient scanning of ${uncachedRecords.length} restaurants`);
      console.log(`⏱️ Estimated scan time: ${Math.round((uncachedRecords.length * 2.5) / 60)} minutes`);
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
    console.error('❌ Usage: npx tsx scripts/extract-uncached-from-log.ts <path-to-csv>');
    process.exit(1);
  }

  await extractUncachedRestaurants(csvPath);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});