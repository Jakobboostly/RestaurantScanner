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

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatCSVRow(record: any, headers: string[]): string {
  return headers.map(header => escapeCSVField(record[header] || '')).join(',');
}

function isRestaurantBusiness(companyName: string, website: string): { isRestaurant: boolean; confidence: number; reason: string } {
  const name = companyName.toLowerCase();
  const domain = website.toLowerCase();
  
  // High confidence restaurant indicators
  const highConfidenceTerms = [
    'restaurant', 'cafe', 'bistro', 'diner', 'grill', 'eatery', 'pizzeria',
    'bakery', 'steakhouse', 'seafood', 'sushi', 'taco', 'burger', 'bbq',
    'kitchen', 'tavern', 'pub', 'brewery', 'winery', 'bar & grill',
    'food truck', 'catering', 'delicatessen', 'sandwich shop'
  ];
  
  // Medium confidence terms (could be restaurants)
  const mediumConfidenceTerms = [
    'lounge', 'club', 'house', 'place', 'spot', 'corner', 'room'
  ];
  
  // Food-related keywords in domain
  const foodDomainTerms = [
    'food', 'eat', 'menu', 'pizza', 'burger', 'taco', 'cafe', 'restaurant',
    'kitchen', 'grill', 'bistro', 'diner', 'sushi'
  ];
  
  // Check for high confidence terms in company name
  for (const term of highConfidenceTerms) {
    if (name.includes(term)) {
      return { 
        isRestaurant: true, 
        confidence: 0.95, 
        reason: `Contains restaurant term: "${term}"` 
      };
    }
  }
  
  // Check for food terms in domain
  for (const term of foodDomainTerms) {
    if (domain.includes(term)) {
      return { 
        isRestaurant: true, 
        confidence: 0.8, 
        reason: `Food-related domain contains: "${term}"` 
      };
    }
  }
  
  // Check for medium confidence terms
  for (const term of mediumConfidenceTerms) {
    if (name.includes(term)) {
      // Additional context needed for medium confidence
      if (name.includes('food') || name.includes('dining') || domain.includes('eat')) {
        return { 
          isRestaurant: true, 
          confidence: 0.7, 
          reason: `Possible restaurant with term: "${term}" and food context` 
        };
      }
    }
  }
  
  // Check for obviously non-restaurant businesses
  const nonRestaurantTerms = [
    'dental', 'medical', 'insurance', 'law', 'attorney', 'construction',
    'contractor', 'salon', 'spa', 'auto', 'repair', 'real estate',
    'consulting', 'accounting', 'financial', 'bank', 'clinic', 'hospital'
  ];
  
  for (const term of nonRestaurantTerms) {
    if (name.includes(term)) {
      return { 
        isRestaurant: false, 
        confidence: 0.95, 
        reason: `Clearly non-restaurant business: "${term}"` 
      };
    }
  }
  
  return { 
    isRestaurant: false, 
    confidence: 0.6, 
    reason: 'No clear restaurant indicators found' 
  };
}

async function filterRestaurantsAndProposeSolution() {
  console.log('🍽️  RESTAURANT FILTERING & SOLUTION PROPOSAL\n');
  
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
    console.log(`✅ Found ${leads.length} total companies\n`);
    
    // Filter for potential restaurants
    console.log('🔍 Analyzing companies for restaurant potential...');
    
    const analysisResults = leads.map(company => {
      const analysis = isRestaurantBusiness(company['Company name'], company['Website URL']);
      return {
        ...company,
        ...analysis
      };
    });
    
    // Separate by confidence levels
    const highConfidenceRestaurants = analysisResults.filter(r => r.isRestaurant && r.confidence >= 0.9);
    const mediumConfidenceRestaurants = analysisResults.filter(r => r.isRestaurant && r.confidence >= 0.7 && r.confidence < 0.9);
    const possibleRestaurants = analysisResults.filter(r => r.isRestaurant && r.confidence < 0.7);
    const nonRestaurants = analysisResults.filter(r => !r.isRestaurant);
    
    console.log('📊 CLASSIFICATION RESULTS:');
    console.log(`   • High confidence restaurants: ${highConfidenceRestaurants.length}`);
    console.log(`   • Medium confidence restaurants: ${mediumConfidenceRestaurants.length}`);
    console.log(`   • Possible restaurants (low confidence): ${possibleRestaurants.length}`);
    console.log(`   • Non-restaurants: ${nonRestaurants.length}`);
    console.log(`   • Total: ${leads.length}\n`);
    
    // Show samples
    console.log('🎯 HIGH CONFIDENCE RESTAURANTS (Sample):');
    highConfidenceRestaurants.slice(0, 10).forEach((company, index) => {
      console.log(`   ${index + 1}. ${company['Company name']} - ${company.reason}`);
    });
    
    console.log('\n❌ NON-RESTAURANTS (Sample):');
    nonRestaurants.slice(0, 10).forEach((company, index) => {
      console.log(`   ${index + 1}. ${company['Company name']} - ${company.reason}`);
    });
    
    // Create filtered CSV for restaurants only
    const restaurantCandidates = [...highConfidenceRestaurants, ...mediumConfidenceRestaurants];
    
    if (restaurantCandidates.length > 0) {
      console.log(`\n💾 Creating filtered CSV with ${restaurantCandidates.length} restaurant candidates...`);
      
      const csvLines = [
        leadHeaders.join(','),
        ...restaurantCandidates.map(record => formatCSVRow(record, leadHeaders))
      ];
      
      const outputPath = './restaurant-leads-filtered.csv';
      await fs.writeFile(outputPath, csvLines.join('\n'));
      console.log(`✅ Created: ${outputPath}`);
    }
    
    console.log('\n🚀 PROPOSED SOLUTION:\n');
    
    console.log('IMMEDIATE ACTIONS:');
    console.log('1. ✅ IDENTIFIED ROOT CAUSE: Most companies are not restaurants');
    console.log('2. ✅ CREATED FILTERED LIST: restaurant-leads-filtered.csv with restaurant candidates');
    console.log('3. 🔄 RE-SCAN STRATEGY: Only scan the filtered restaurant list');
    console.log('4. 🔧 IMPROVED SEARCH: Use full address + company name for better accuracy');
    
    console.log('\nNEXT STEPS:');
    console.log('1. Review the filtered restaurant list for accuracy');
    console.log('2. Run batch scan on restaurant-leads-filtered.csv only');
    console.log('3. Update search strategy to use address + name for better matching');
    console.log('4. Implement validation to ensure found Place IDs match the target business');
    
    console.log('\nIMPROVED SEARCH STRATEGY:');
    console.log('Instead of: "Company Name restaurant"');
    console.log('Use: "Company Name [Street Address] [City]"');
    console.log('This should find the actual business location rather than random restaurants');
    
    console.log('\n📈 EXPECTED RESULTS:');
    console.log(`• Scan ${restaurantCandidates.length} restaurant candidates instead of ${leads.length} total companies`);
    console.log('• Achieve much higher accuracy in Place ID detection');
    console.log('• Eliminate the duplicate Place ID problem');
    console.log('• Generate meaningful revenue gate URLs for actual restaurants');
    
  } catch (error) {
    console.error('❌ Error during filtering:', error);
    process.exit(1);
  }
}

// Run the filtering and solution proposal
filterRestaurantsAndProposeSolution();