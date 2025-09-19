#!/usr/bin/env tsx

import * as fs from 'fs/promises';

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

function parseCSV<T>(content: string, headers: string[]): T[] {
  const lines = content.trim().split('\n');
  const dataLines = lines.slice(1);
  
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

async function extractSuccessfulCompanies() {
  console.log('📋 Extracting successful companies to separate CSV...');
  
  try {
    // Read the main CSV file
    console.log('📖 Reading leads-with-revenue-gates.csv...');
    const csvPath = './leads-with-revenue-gates.csv';
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    
    const headers = [
      'Record ID', 'Company name', 'Company owner', 'Phone Number',
      'City', 'Street Address', 'Street Address 2', 'Postal Code', 'Website URL',
      'Place ID', 'Revenue Gate URL', 'Screenshot URL', 'Scan Status'
    ];
    
    const allCompanies = parseCSV<CompanyRecord>(csvContent, headers);
    console.log(`✅ Found ${allCompanies.length} total company records`);
    
    // Filter to only companies with successful scans
    const successfulCompanies = allCompanies.filter(company => 
      company['Scan Status'] === 'success' && 
      company['Revenue Gate URL'] && 
      company['Revenue Gate URL'].trim() !== ''
    );
    
    console.log(`✅ Found ${successfulCompanies.length} companies with successful scans`);
    
    // Create output CSV
    console.log('💾 Creating successful-companies-with-revenue-gates.csv...');
    
    const csvLines = [
      headers.join(','),
      ...successfulCompanies.map(record => formatCSVRow(record, headers))
    ];
    
    const outputPath = './successful-companies-with-revenue-gates.csv';
    await fs.writeFile(outputPath, csvLines.join('\n'));
    
    console.log(`✅ Output saved to: ${outputPath}`);
    console.log(`📊 Contains ${successfulCompanies.length} companies with revenue gate URLs`);
    
    // Show sample of successful records
    const sampleCompanies = successfulCompanies.slice(0, 3);
    
    console.log('\n📋 Sample records in the new CSV:');
    sampleCompanies.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record['Company name']} (${record['Record ID']})`);
      console.log(`      Revenue Gate: ${record['Revenue Gate URL']}`);
    });
    
    console.log('\n🎉 Extraction complete!');
    
  } catch (error) {
    console.error('❌ Error during extraction:', error);
    process.exit(1);
  }
}

// Run the extraction
extractSuccessfulCompanies();