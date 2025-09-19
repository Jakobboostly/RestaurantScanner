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

async function testImprovedSearch() {
  console.log('🔍 TESTING IMPROVED RESTAURANT SEARCH STRATEGY\n');
  
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
    console.log(`✅ Found ${leads.length} restaurant records\n`);
    
    // Test different search strategies on sample restaurants
    const testRestaurants = leads.slice(0, 10);
    
    console.log('🧪 TESTING SEARCH STRATEGIES:\n');
    
    for (let i = 0; i < Math.min(5, testRestaurants.length); i++) {
      const restaurant = testRestaurants[i];
      console.log(`${i + 1}. RESTAURANT: ${restaurant['Company name']}`);
      console.log(`   Address: ${restaurant['Street Address']}, ${restaurant['City']}`);
      console.log(`   Website: ${restaurant['Website URL']}\n`);
      
      // Strategy 1: Current approach (name + "restaurant")
      const currentQuery = `${restaurant['Company name']} restaurant`;
      console.log(`   🔍 CURRENT SEARCH: "${currentQuery}"`);
      await testSearch(currentQuery, '   Current Result');
      
      // Strategy 2: Name + Address
      const addressQuery = `${restaurant['Company name']} ${restaurant['Street Address']} ${restaurant['City']}`;
      console.log(`   🔍 IMPROVED SEARCH: "${addressQuery}"`);
      await testSearch(addressQuery, '   Improved Result');
      
      // Strategy 3: Just the restaurant name (no "restaurant" suffix)
      const nameOnlyQuery = restaurant['Company name'];
      console.log(`   🔍 NAME ONLY: "${nameOnlyQuery}"`);
      await testSearch(nameOnlyQuery, '   Name Only Result');
      
      console.log('   ' + '─'.repeat(60) + '\n');
    }
    
    console.log('💡 RECOMMENDATIONS BASED ON TEST:\n');
    console.log('1. DROP the "restaurant" suffix - it confuses Google Places');
    console.log('2. USE full address for better location matching');
    console.log('3. FALLBACK to name-only if address search fails');
    console.log('4. VALIDATE results match the expected location/business');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

async function testSearch(query: string, label: string): Promise<void> {
  try {
    // Test against the local restaurant search API
    const response = await fetch(`http://localhost:3000/api/restaurants/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      console.log(`${label}: API Error ${response.status}`);
      return;
    }
    
    const results = await response.json();
    
    if (results.length > 0) {
      const topResult = results[0];
      console.log(`${label}: Found "${topResult.name}" (${topResult.placeId})`);
      console.log(`${label}: Address - ${topResult.address}`);
    } else {
      console.log(`${label}: No results found`);
    }
    
  } catch (error) {
    console.log(`${label}: Search failed - ${error.message}`);
  }
}

// Run the test
testImprovedSearch();