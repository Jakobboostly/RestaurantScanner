const { DataForSeoRankedKeywordsService } = require('./server/services/dataForSeoRankedKeywordsService.ts');

// Test the targeted competitive keywords generation
async function testTargetedKeywords() {
  console.log('🧪 Testing targeted keywords generation...');
  
  const service = new DataForSeoRankedKeywordsService(
    process.env.DATAFORSEO_LOGIN || 'jakob@boostly.com',
    process.env.DATAFORSEO_PASSWORD || 'your_password'
  );
  
  try {
    const keywords = await service.getTargetedCompetitiveKeywords(
      'theslicepizzasc.com',  // Jimmy's NY Pizza domain
      'pizza',                // cuisine type
      'Simpsonville',         // city
      'SC',                  // state
      'United States',       // country
      'en'                   // language
    );
    
    console.log('✅ Generated targeted keywords:');
    keywords.forEach((keyword, index) => {
      console.log(`${index + 1}. "${keyword.keyword}" - Position: ${keyword.position || 'Not Ranked'}`);
    });
    
    console.log(`\n📊 Total keywords: ${keywords.length}`);
    console.log('Expected: 8 targeted keywords like "pizza near me", "pizza delivery Simpsonville", etc.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTargetedKeywords();