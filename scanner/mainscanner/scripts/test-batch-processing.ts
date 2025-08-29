#!/usr/bin/env tsx

// Disable the CLI argument check for testing
process.argv = ['node', 'test-script'];

import { CSVBatchProcessor } from './batch-scan-csv';

/**
 * Test script to validate batch processing with a few sample restaurants
 * Run this BEFORE processing your full CSV file
 */

async function testBatchProcessing() {
  console.log('🧪 Testing batch processing with sample restaurants...');
  
  // Create a small test CSV content
  const testCSVContent = `Company Name,Website
Pizza Palace Test,https://pizzapalace.com
Burger Test Kitchen,https://burgerking.com
Test Restaurant,https://testrestaurant.com`;

  // Write test CSV file
  const { writeFileSync } = await import('fs');
  const testCSVPath = './test-restaurants.csv';
  writeFileSync(testCSVPath, testCSVContent);
  
  console.log(`📝 Created test CSV file: ${testCSVPath}`);
  console.log(`🍕 Testing with 3 sample restaurants...`);

  try {
    const processor = new CSVBatchProcessor();
    
    await processor.processCSVFile(testCSVPath, {
      batchSize: 2, // Small batch size for testing
      baseUrl: 'https://boostly-restaurant-scanner.onrender.com',
      outputDir: './test-results'
    });

    console.log('\n🎉 Test completed! Check ./test-results/ for output files.');
    console.log('\n✅ If test results look good, you can run the full batch with:');
    console.log('   npx tsx scripts/batch-scan-csv.ts "/Users/jakobthompson/Downloads/Historical Client Data.csv"');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Fix the issues above before running the full batch.');
  }
}

// Run the test
testBatchProcessing().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});