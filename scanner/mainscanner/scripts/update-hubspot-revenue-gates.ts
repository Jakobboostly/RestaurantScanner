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

interface HubSpotCompanyUpdate {
  id: string;
  properties: {
    revenue_opportunity_report: string;
  };
}

interface HubSpotBatchResponse {
  status: string;
  results?: Array<{
    id: string;
    properties: any;
    updatedAt: string;
  }>;
  errors?: Array<{
    id: string;
    error: {
      message: string;
      category: string;
    };
  }>;
}

// HubSpot API Configuration
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_API_KEY || '';
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const BATCH_SIZE = 100;

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

async function updateHubSpotCompaniesBatch(companies: HubSpotCompanyUpdate[]): Promise<HubSpotBatchResponse> {
  const url = `${HUBSPOT_API_BASE}/crm/v3/objects/companies/batch/update`;
  
  const payload = {
    inputs: companies
  };

  console.log(`🔄 Updating batch of ${companies.length} companies...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      console.error(`Response: ${responseText}`);
      throw new Error(`HubSpot API error: ${response.status} - ${responseText}`);
    }

    return JSON.parse(responseText) as HubSpotBatchResponse;
  } catch (error) {
    console.error('❌ Error updating HubSpot batch:', error);
    throw error;
  }
}

async function testHubSpotConnection(testCompanies: CompanyRecord[]): Promise<boolean> {
  console.log('🧪 Testing HubSpot connection with 5 companies...');
  
  const hubspotUpdates: HubSpotCompanyUpdate[] = testCompanies.slice(0, 5).map(company => ({
    id: company['Record ID'],
    properties: {
      revenue_opportunity_report: company['Revenue Gate URL']
    }
  }));

  try {
    const result = await updateHubSpotCompaniesBatch(hubspotUpdates);
    
    if (result.results && result.results.length > 0) {
      console.log(`✅ Test successful! Updated ${result.results.length} companies`);
      
      // Show sample of what was updated
      result.results.slice(0, 2).forEach(company => {
        console.log(`   • Company ${company.id} updated at ${company.updatedAt}`);
      });
      
      return true;
    } else {
      console.error('❌ Test failed - no results returned');
      if (result.errors) {
        result.errors.forEach(error => {
          console.error(`   • Error for ${error.id}: ${error.error.message}`);
        });
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

async function updateAllCompanies() {
  console.log('🚀 Starting HubSpot Revenue Gate Integration...');
  
  try {
    // Read the CSV with revenue gate URLs
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
    
    // Filter to only companies with successful scans and revenue gate URLs
    const successfulCompanies = allCompanies.filter(company => 
      company['Scan Status'] === 'success' && 
      company['Revenue Gate URL'] && 
      company['Revenue Gate URL'].trim() !== ''
    );
    
    console.log(`✅ Found ${successfulCompanies.length} companies with successful scans`);
    
    if (successfulCompanies.length === 0) {
      console.log('❌ No companies found with successful scans. Exiting...');
      return;
    }

    // Test connection first with 5 companies
    const testSuccess = await testHubSpotConnection(successfulCompanies);
    if (!testSuccess) {
      console.log('❌ Test failed. Aborting full update...');
      return;
    }

    console.log('\n🎯 Test passed! Starting full batch update...');
    
    // Process remaining companies in batches
    const remainingCompanies = successfulCompanies.slice(5); // Skip the 5 we already tested
    const totalBatches = Math.ceil(remainingCompanies.length / BATCH_SIZE);
    
    let totalSuccesses = 5; // Count the 5 test companies
    let totalErrors = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, remainingCompanies.length);
      const batchCompanies = remainingCompanies.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batchCompanies.length} companies)...`);
      
      const hubspotUpdates: HubSpotCompanyUpdate[] = batchCompanies.map(company => ({
        id: company['Record ID'],
        properties: {
          revenue_opportunity_report: company['Revenue Gate URL']
        }
      }));

      try {
        const result = await updateHubSpotCompaniesBatch(hubspotUpdates);
        
        if (result.results) {
          totalSuccesses += result.results.length;
          console.log(`   ✅ Successfully updated ${result.results.length} companies`);
        }
        
        if (result.errors) {
          totalErrors += result.errors.length;
          console.log(`   ⚠️  ${result.errors.length} errors in this batch`);
          result.errors.slice(0, 3).forEach(error => {
            console.log(`      • Company ${error.id}: ${error.error.message}`);
          });
        }
        
        // Add small delay between batches to be respectful of API limits
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, error);
        totalErrors += batchCompanies.length;
      }
    }
    
    // Final statistics
    console.log('\n🎉 HubSpot update complete!');
    console.log(`📊 Final Statistics:`);
    console.log(`   • Total companies processed: ${successfulCompanies.length}`);
    console.log(`   • Successfully updated: ${totalSuccesses}`);
    console.log(`   • Errors: ${totalErrors}`);
    console.log(`   • Success rate: ${Math.round((totalSuccesses / successfulCompanies.length) * 100)}%`);
    
    if (totalSuccesses > 0) {
      console.log(`\n✅ SUCCESS! ${totalSuccesses} companies now have their revenue gate URLs in HubSpot!`);
      console.log(`🔗 Check the "revenue_opportunity_report" property in your HubSpot company records.`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update process
updateAllCompanies();