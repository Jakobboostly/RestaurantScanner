#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';
import { calculateScores, type ScanData } from '../shared/scoreCalculator';

const placeId = 'ChIJ_89zv2oP9YgRJi2MUeoAfWA';

async function testSpecificRestaurant() {
  try {
    const scanFile = path.join(process.cwd(), 'scan-cache', placeId, 'scan.json');
    const content = await fs.readFile(scanFile, 'utf-8');
    const cachedScan = JSON.parse(content);

    console.log('🍕 Testing specific restaurant:', cachedScan.metadata.restaurantName);
    console.log('📁 Place ID:', placeId);
    console.log();

    // Show cached backend scores
    console.log('🔧 Cached Backend Scores (raw API values):');
    console.log(`   SEO: ${cachedScan.data.seo}`);
    console.log(`   Overall: ${cachedScan.data.overallScore}`);
    console.log(`   Performance: ${cachedScan.data.performance}`);
    console.log(`   User Experience: ${cachedScan.data.userExperience}`);
    console.log();

    // Calculate frontend scores using shared logic
    const scanData: ScanData = cachedScan.data;
    const frontendScores = calculateScores(scanData);

    console.log('🎨 Frontend Calculated Scores (using scoreCalculator.ts):');
    console.log(`   Search: ${frontendScores.search}`);
    console.log(`   Social: ${frontendScores.social}`);
    console.log(`   Local: ${frontendScores.local}`);
    console.log(`   Reviews: ${frontendScores.reviews}`);
    console.log(`   Overall: ${frontendScores.overall}`);
    console.log();

    console.log('🖼️ Frontend Screenshot Shows:');
    console.log('   Search: 65');
    console.log('   Social: 100');
    console.log('   Local: 47');
    console.log('   Reviews: 90');
    console.log('   Overall: 76');
    console.log();

    // Check if our calculation matches the screenshot
    const matches = {
      search: frontendScores.search === 65,
      social: frontendScores.social === 100,
      local: frontendScores.local === 47,
      reviews: frontendScores.reviews === 90,
      overall: frontendScores.overall === 76
    };

    console.log('✅ Verification Results:');
    console.log(`   Search: ${matches.search ? '✓' : '✗'} (${frontendScores.search} vs 65)`);
    console.log(`   Social: ${matches.social ? '✓' : '✗'} (${frontendScores.social} vs 100)`);
    console.log(`   Local: ${matches.local ? '✓' : '✗'} (${frontendScores.local} vs 47)`);
    console.log(`   Reviews: ${matches.reviews ? '✓' : '✗'} (${frontendScores.reviews} vs 90)`);
    console.log(`   Overall: ${matches.overall ? '✓' : '✗'} (${frontendScores.overall} vs 76)`);

    const allMatch = Object.values(matches).every(Boolean);
    console.log();
    console.log(allMatch ? '🎉 ALL SCORES MATCH!' : '⚠️ Some scores differ - may indicate version differences');

    // Show some of the raw data that affects calculations
    console.log();
    console.log('🔍 Key Data Factors:');
    console.log(`   Business Profile Rating: ${scanData.businessProfile?.rating}`);
    console.log(`   Total Reviews: ${scanData.businessProfile?.totalReviews}`);
    console.log(`   Facebook: ${scanData.socialMediaLinks?.facebook ? 'Yes' : 'No'}`);
    console.log(`   Instagram: ${scanData.socialMediaLinks?.instagram ? 'Yes' : 'No'}`);
    console.log(`   Target Keywords: ${scanData.keywordAnalysis?.targetKeywords?.length || 0}`);
    console.log(`   Local Pack Visibility: ${scanData.localPackReport?.summary?.visibility_score || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSpecificRestaurant();