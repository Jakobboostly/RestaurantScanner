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

interface DuplicateAnalysis {
  field: string;
  totalRecords: number;
  uniqueValues: number;
  duplicateCount: number;
  duplicateRecords: Array<{
    value: string;
    count: number;
    records: CompanyRecord[];
  }>;
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

function analyzeDuplicates(records: CompanyRecord[], field: keyof CompanyRecord): DuplicateAnalysis {
  const valueMap = new Map<string, CompanyRecord[]>();
  
  // Group records by field value
  records.forEach(record => {
    const value = record[field];
    if (value && value.trim() !== '') {
      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value)!.push(record);
    }
  });
  
  // Find duplicates
  const duplicateRecords: Array<{value: string; count: number; records: CompanyRecord[]}> = [];
  
  valueMap.forEach((recordList, value) => {
    if (recordList.length > 1) {
      duplicateRecords.push({
        value,
        count: recordList.length,
        records: recordList
      });
    }
  });
  
  return {
    field: field as string,
    totalRecords: records.length,
    uniqueValues: valueMap.size,
    duplicateCount: duplicateRecords.reduce((sum, dup) => sum + dup.count, 0),
    duplicateRecords: duplicateRecords.sort((a, b) => b.count - a.count)
  };
}

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates in CSV data...\n');
  
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
    console.log(`✅ Found ${allCompanies.length} total company records\n`);
    
    // Filter successful companies
    const successfulCompanies = allCompanies.filter(company => 
      company['Scan Status'] === 'success' && 
      company['Revenue Gate URL'] && 
      company['Revenue Gate URL'].trim() !== ''
    );
    console.log(`✅ Found ${successfulCompanies.length} successful companies\n`);
    
    // Analyze key fields for duplicates
    const fieldsToCheck: (keyof CompanyRecord)[] = [
      'Record ID',
      'Company name', 
      'Website URL',
      'Place ID',
      'Revenue Gate URL'
    ];
    
    console.log('🔍 DUPLICATE ANALYSIS RESULTS:\n');
    console.log('=' .repeat(60));
    
    let totalDuplicatesFound = 0;
    let criticalDuplicates = false;
    
    for (const field of fieldsToCheck) {
      const analysis = analyzeDuplicates(successfulCompanies, field);
      
      console.log(`\n📊 ${field.toUpperCase()} Analysis:`);
      console.log(`   • Total records: ${analysis.totalRecords}`);
      console.log(`   • Unique values: ${analysis.uniqueValues}`);
      console.log(`   • Duplicate records: ${analysis.duplicateCount}`);
      
      if (analysis.duplicateRecords.length > 0) {
        totalDuplicatesFound += analysis.duplicateCount;
        
        if (field === 'Record ID' || field === 'Revenue Gate URL') {
          criticalDuplicates = true;
        }
        
        console.log(`   ⚠️  DUPLICATES FOUND:`);
        analysis.duplicateRecords.slice(0, 5).forEach(dup => {
          console.log(`      • "${dup.value}" appears ${dup.count} times`);
          dup.records.forEach(record => {
            console.log(`        - Record ID: ${record['Record ID']}, Company: ${record['Company name']}`);
          });
        });
        
        if (analysis.duplicateRecords.length > 5) {
          console.log(`      ... and ${analysis.duplicateRecords.length - 5} more duplicates`);
        }
      } else {
        console.log(`   ✅ NO DUPLICATES FOUND`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n📋 SUMMARY:');
    
    if (totalDuplicatesFound === 0) {
      console.log('✅ EXCELLENT! No duplicates found in any critical fields.');
      console.log('✅ Your data is clean and ready for use.');
      console.log('✅ HubSpot integration should have been accurate.');
    } else {
      console.log(`⚠️  Found ${totalDuplicatesFound} total duplicate records across all fields.`);
      
      if (criticalDuplicates) {
        console.log('🚨 CRITICAL: Duplicates found in Record ID or Revenue Gate URL fields!');
        console.log('🚨 This could mean HubSpot received duplicate updates.');
        console.log('🚨 Recommend reviewing HubSpot records for consistency.');
      } else {
        console.log('✅ No critical duplicates found in Record ID or Revenue Gate URL.');
        console.log('✅ Duplicates in other fields (like company names) are normal.');
        console.log('✅ HubSpot integration should be accurate.');
      }
    }
    
    // Additional analysis for successful companies
    console.log('\n📊 ADDITIONAL STATISTICS:');
    console.log(`   • Original CSV records: ${allCompanies.length}`);
    console.log(`   • Successful scans: ${successfulCompanies.length}`);
    console.log(`   • Failed/missing scans: ${allCompanies.length - successfulCompanies.length}`);
    console.log(`   • Success rate: ${Math.round((successfulCompanies.length / allCompanies.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Error during duplicate analysis:', error);
    process.exit(1);
  }
}

// Run the duplicate check
checkDuplicates();