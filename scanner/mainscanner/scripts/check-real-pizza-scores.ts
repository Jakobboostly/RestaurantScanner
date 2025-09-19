#!/usr/bin/env tsx

import { db } from '../server/db';
import { fullScanResults } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkRealPizzaScores() {
  const placeId = 'ChIJg0GCagDVv1QRD4qfTTx581E';
  
  console.log('Checking scores for Real Pizza (placeId: ' + placeId + ')');
  console.log('='.repeat(60));
  
  try {
    const result = await db.query.fullScanResults.findFirst({
      where: eq(fullScanResults.placeId, placeId)
    });
    
    if (result && result.scanData) {
      const data = result.scanData as any;
      console.log('✅ Found in database:');
      console.log('Restaurant:', data.restaurantName);
      console.log('Overall Score:', data.overallScore);
      console.log('SEO Score:', data.seo);
      console.log('Social Score (maps to social_score in HubSpot):', data.performance);
      console.log('Local Score:', data.localScore || 'N/A');
      console.log('Reviews Score (maps to review_score in HubSpot):', data.userExperience);
      console.log('');
      console.log('Screenshot shows:');
      console.log('Search: 67/100');
      console.log('Social: 100/100');
      console.log('Local: 76/100');
      console.log('Reviews: 91/100');
      console.log('');
      console.log('Comparison:');
      console.log(`SEO/Search: DB=${data.seo} vs Screenshot=67 ${data.seo === 67 ? '✅' : '❌'}`);
      console.log(`Performance/Social: DB=${data.performance} vs Screenshot=100 ${data.performance === 100 ? '✅' : '❌'}`);
      console.log(`Local: DB=${data.localScore || 'N/A'} vs Screenshot=76`);
      console.log(`UX/Reviews: DB=${data.userExperience} vs Screenshot=91 ${data.userExperience === 91 ? '✅' : '❌'}`);
    } else {
      console.log('❌ No data found in database for Real Pizza');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkRealPizzaScores();