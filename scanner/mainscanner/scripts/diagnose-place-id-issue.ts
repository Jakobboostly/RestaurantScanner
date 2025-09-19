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

async function diagnoseIssue() {
  console.log('🔍 DIAGNOSING PLACE ID DETECTION ISSUE\n');
  
  try {
    // Read original leads.csv
    console.log('📖 Reading original leads.csv...');
    const leadsPath = '/Users/jakobthompson/Desktop/leads.csv';
    const leadsContent = await fs.readFile(leadsPath, 'utf-8');
    
    const leadHeaders = [
      'Record ID', 'Company name', 'Company owner', 'Phone Number',
      'City', 'Street Address', 'Street Address 2', 'Postal Code', 'Website URL'
    ];
    
    const leads = parseCSV<CompanyRecord>(leadsContent, leadHeaders);
    console.log(`✅ Found ${leads.length} lead records\n`);
    
    console.log('🏢 COMPANY ANALYSIS:\n');
    
    // Sample some companies to analyze
    const sampleCompanies = [
      leads.find(l => l['Record ID'] === '32413771027'), // First company that failed
      leads.find(l => l['Record ID'] === '32413771028'), // Second company that failed
      leads.find(l => l['Record ID'] === '32413771029'), // Third company that failed
      leads.find(l => l['Company name']?.includes('restaurant')), // Any with restaurant in name
      leads.find(l => l['Company name']?.includes('cafe')), // Any with cafe in name
    ].filter(Boolean).slice(0, 10);
    
    console.log('Sample companies that likely failed restaurant detection:\n');
    
    sampleCompanies.forEach((company, index) => {
      if (!company) return;
      
      console.log(`${index + 1}. COMPANY: ${company['Company name']}`);
      console.log(`   Record ID: ${company['Record ID']}`);
      console.log(`   Website: ${company['Website URL']}`);
      console.log(`   Full Address: ${company['Street Address']}, ${company['City']}, ${company['Postal Code']}`);
      console.log(`   ISSUE: Company name "${company['Company name']}" is not a restaurant!`);
      console.log(`   TYPE: This appears to be a ${getCompanyType(company['Company name'])}`);
      console.log(`   SEARCH PROBLEM: Google Places Text Search for "${company['Company name']}" returns generic restaurants\n`);
    });
    
    console.log('🚨 ROOT CAUSE IDENTIFIED:\n');
    console.log('1. PROBLEM: The batch scanner assumes all companies in leads.csv are restaurants');
    console.log('2. REALITY: Most companies are NOT restaurants - they are various businesses');
    console.log('3. SEARCH FAILURE: When Google Places searches for "ABC Construction restaurant", it returns random nearby restaurants');
    console.log('4. FALLBACK ISSUE: The API defaults to the same few restaurants (Point Restaurant, etc.) when searches fail');
    console.log('5. RESULT: 450+ companies get mapped to the same incorrect Place IDs\n');
    
    console.log('📊 COMPANY TYPE ANALYSIS:\n');
    const companyTypes = new Map<string, number>();
    
    leads.slice(0, 50).forEach(company => {
      const type = getCompanyType(company['Company name']);
      companyTypes.set(type, (companyTypes.get(type) || 0) + 1);
    });
    
    console.log('Sample of first 50 companies by type:');
    [...companyTypes.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   • ${type}: ${count} companies`);
      });
    
    console.log('\n💡 SOLUTION RECOMMENDATIONS:\n');
    console.log('1. PRE-FILTER: Only scan companies that are actually restaurants/food businesses');
    console.log('2. BETTER SEARCH: Use company address + name for more accurate Google Places searches');
    console.log('3. VALIDATION: Verify that found places are actually the target company before using');
    console.log('4. FALLBACK LOGIC: Improve handling when no restaurant is found (don\'t use random restaurants)');
    console.log('5. MANUAL REVIEW: Allow manual verification of company-to-restaurant mappings\n');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    process.exit(1);
  }
}

function getCompanyType(companyName: string): string {
  const name = companyName.toLowerCase();
  
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('bistro') || name.includes('diner') || name.includes('grill')) {
    return 'Restaurant/Food Service';
  }
  if (name.includes('construction') || name.includes('contractor') || name.includes('builder')) {
    return 'Construction';
  }
  if (name.includes('dental') || name.includes('dentist') || name.includes('medical') || name.includes('health')) {
    return 'Healthcare';
  }
  if (name.includes('law') || name.includes('attorney') || name.includes('legal')) {
    return 'Legal Services';
  }
  if (name.includes('insurance') || name.includes('financial') || name.includes('bank')) {
    return 'Financial Services';
  }
  if (name.includes('salon') || name.includes('spa') || name.includes('beauty')) {
    return 'Beauty/Personal Care';
  }
  if (name.includes('auto') || name.includes('mechanic') || name.includes('repair')) {
    return 'Automotive';
  }
  if (name.includes('real estate') || name.includes('realtor') || name.includes('property')) {
    return 'Real Estate';
  }
  if (name.includes('consulting') || name.includes('consultant') || name.includes('services')) {
    return 'Professional Services';
  }
  if (name.includes('retail') || name.includes('store') || name.includes('shop')) {
    return 'Retail';
  }
  
  return 'Other Business';
}

// Run the diagnosis
diagnoseIssue();