#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';

interface LeadRecord {
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

interface ScanResult {
  'Company Name': string; // This is actually the Record ID
  'Website': string;
  'Screenshot URL': string;
  'Place ID': string;
  'Status': string;
}

interface MergedRecord extends LeadRecord {
  'Place ID': string;
  'Revenue Gate URL': string;
  'Screenshot URL': string;
  'Scan Status': string;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
}

function parseCSV<T>(content: string, headers: string[]): T[] {
  const lines = content.trim().split('\n');
  const dataLines = lines.slice(1); // Skip header row
  
  return dataLines.map(line => {
    const values = parseCSVRow(line);
    const obj: any = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    return obj as T;
  });
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatCSVRow(record: any, headers: string[]): string {
  return headers.map(header => escapeCSVField(record[header] || '')).join(',');
}

async function mergeLeadsWithRevenueGates() {
  console.log('🔗 Starting merge process...');
  
  try {
    // Read original leads.csv
    console.log('📖 Reading original leads.csv...');
    const leadsPath = '/Users/jakobthompson/Desktop/leads.csv';
    const leadsContent = await fs.readFile(leadsPath, 'utf-8');
    
    const leadHeaders = [
      'Record ID', 'Company name', 'Company owner', 'Phone Number',
      'City', 'Street Address', 'Street Address 2', 'Postal Code', 'Website URL'
    ];
    
    const leads = parseCSV<LeadRecord>(leadsContent, leadHeaders);
    console.log(`✅ Found ${leads.length} lead records`);
    
    // Read successful scan results
    console.log('📖 Reading successful scan results...');
    const scanResultsPath = './leads-scan-results/successful-websites-2025-09-03T15-58-25-288Z.csv';
    const scanResultsContent = await fs.readFile(scanResultsPath, 'utf-8');
    
    const scanHeaders = ['Company Name', 'Website', 'Screenshot URL', 'Place ID', 'Status'];
    const scanResults = parseCSV<ScanResult>(scanResultsContent, scanHeaders);
    console.log(`✅ Found ${scanResults.length} successful scan results`);
    
    // Create a map of Record ID -> Scan Result for quick lookup
    const scanResultsMap = new Map<string, ScanResult>();
    scanResults.forEach(result => {
      // The "Company Name" field in scan results is actually the Record ID
      scanResultsMap.set(result['Company Name'], result);
    });
    
    console.log('🔗 Merging data by Record ID...');
    
    // Merge the data
    const mergedRecords: MergedRecord[] = leads.map(lead => {
      const scanResult = scanResultsMap.get(lead['Record ID']);
      
      const baseURL = 'https://boostly-restaurant-scanner.onrender.com';
      
      return {
        ...lead,
        'Place ID': scanResult?.['Place ID'] || '',
        'Revenue Gate URL': scanResult?.['Place ID'] 
          ? `${baseURL}/revenue-gate/${scanResult['Place ID']}`
          : '',
        'Screenshot URL': scanResult?.['Screenshot URL'] || '',
        'Scan Status': scanResult?.['Status'] || 'not_scanned'
      };
    });
    
    // Count statistics
    const successfulScans = mergedRecords.filter(r => r['Scan Status'] === 'success').length;
    const failedScans = mergedRecords.filter(r => r['Scan Status'] === 'not_scanned').length;
    
    console.log(`📊 Merge Statistics:`);
    console.log(`   • Total records: ${mergedRecords.length}`);
    console.log(`   • Successful scans: ${successfulScans}`);
    console.log(`   • Not scanned: ${failedScans}`);
    
    // Create output CSV
    console.log('💾 Creating output CSV...');
    
    const outputHeaders = [
      'Record ID', 'Company name', 'Company owner', 'Phone Number',
      'City', 'Street Address', 'Street Address 2', 'Postal Code', 'Website URL',
      'Place ID', 'Revenue Gate URL', 'Screenshot URL', 'Scan Status'
    ];
    
    const csvLines = [
      outputHeaders.join(','),
      ...mergedRecords.map(record => formatCSVRow(record, outputHeaders))
    ];
    
    const outputPath = './leads-with-revenue-gates.csv';
    await fs.writeFile(outputPath, csvLines.join('\n'));
    
    console.log(`✅ Output saved to: ${outputPath}`);
    console.log('🎉 Merge complete!');
    
    // Show sample of successful records
    const sampleSuccessful = mergedRecords
      .filter(r => r['Scan Status'] === 'success')
      .slice(0, 3);
    
    if (sampleSuccessful.length > 0) {
      console.log('\n📋 Sample successful records:');
      sampleSuccessful.forEach(record => {
        console.log(`   • ${record['Company name']} -> ${record['Revenue Gate URL']}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during merge process:', error);
    process.exit(1);
  }
}

// Run the merge process
mergeLeadsWithRevenueGates();