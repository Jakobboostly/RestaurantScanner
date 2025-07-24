// Test the scanner functionality
const axios = require('axios');
const EventSource = require('eventsource');

async function testScanner() {
  console.log('=== Restaurant Scanner Audit ===\n');

  // Test 1: Restaurant Search
  console.log('1. Testing Restaurant Search...');
  try {
    const searchResponse = await axios.get('http://localhost:5000/api/restaurants/search?q=pizza');
    console.log('✅ Restaurant search working');
    console.log(`   Found ${searchResponse.data.length} restaurants`);
    
    if (searchResponse.data.length > 0) {
      const restaurant = searchResponse.data[0];
      console.log(`   First result: ${restaurant.name} (${restaurant.rating}★)`);
      
      // Test 2: Start a scan
      console.log('\n2. Testing Scanner...');
      const scanData = {
        placeId: restaurant.placeId,
        domain: restaurant.domain || 'nuevavilla.top',
        restaurantName: restaurant.name,
        latitude: restaurant.location.lat,
        longitude: restaurant.location.lng
      };
      
      console.log(`   Scanning ${scanData.restaurantName}...`);
      
      // Use EventSource to track progress
      const scanUrl = `http://localhost:5000/api/scan/professional?placeId=${scanData.placeId}&domain=${scanData.domain}&restaurantName=${encodeURIComponent(scanData.restaurantName)}&latitude=${scanData.latitude}&longitude=${scanData.longitude}`;
      
      const es = new EventSource(scanUrl);
      
      es.on('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.progress) {
          console.log(`   Progress: ${data.progress}% - ${data.status}`);
        }
        if (data.type === 'complete') {
          console.log('\n✅ Scan completed successfully!');
          console.log('\n3. Scan Results:');
          console.log(`   Overall Score: ${data.result.overallScore}/100`);
          console.log(`   Performance: ${data.result.performance}/100`);
          console.log(`   SEO: ${data.result.seo}/100`);
          console.log(`   Mobile: ${data.result.mobile}/100`);
          console.log(`   Keywords found: ${data.result.keywords?.length || 0}`);
          console.log(`   Competitors found: ${data.result.competitors?.length || 0}`);
          console.log(`   Issues identified: ${data.result.issues?.length || 0}`);
          
          console.log('\n4. API Status:');
          console.log(`   ✅ Google Places API: Working`);
          console.log(`   ${data.result.keywords?.length > 0 ? '✅' : '❌'} DataForSEO Keywords: ${data.result.keywords?.length > 0 ? 'Working' : 'Not working'}`);
          console.log(`   ${data.result.performance > 0 ? '✅' : '❌'} PageSpeed API: ${data.result.performance > 0 ? 'Working' : 'Not working'}`);
          console.log(`   ${data.result.reviewsAnalysis?.totalReviews > 0 ? '✅' : '❌'} Reviews Analysis: ${data.result.reviewsAnalysis?.totalReviews > 0 ? 'Working' : 'Not working'}`);
          
          es.close();
          process.exit(0);
        }
      });
      
      es.on('error', (error) => {
        console.error('❌ Scan failed:', error.message);
        es.close();
        process.exit(1);
      });
    }
  } catch (error) {
    console.error('❌ Restaurant search failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testScanner();