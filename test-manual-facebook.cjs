// Test manual Facebook URL override
const axios = require('axios');

async function testManualFacebookOverride() {
  console.log('🔍 Testing manual Facebook URL override...');
  
  const testData = {
    placeId: "ChIJywz4kD-gxIkRpvJJo-TK0e0",
    domain: "wolfeysbar.com", 
    restaurantName: "Wolfey's Wapsi Outback",
    manualFacebookUrl: "https://www.facebook.com/p/Wolfeys-Wapsi-Outback-100055314674794/"
  };
  
  try {
    console.log('📡 Starting scan with manual Facebook URL...');
    const response = await axios.post('http://localhost:5000/api/scan/professional', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 45000
    });
    
    const result = response.data;
    console.log('\n📊 Social Media Detection Results:');
    console.log('Facebook detected:', result.socialMediaLinks?.facebook || 'Not found');
    console.log('Instagram detected:', result.socialMediaLinks?.instagram || 'Not found');
    
    if (result.socialMediaLinks?.facebook) {
      console.log('\n✅ SUCCESS! Manual Facebook URL override working!');
      console.log('   Detected Facebook URL:', result.socialMediaLinks.facebook);
    } else {
      console.log('\n❌ Manual Facebook URL override not working');
      console.log('   Expected: https://www.facebook.com/p/Wolfeys-Wapsi-Outback-100055314674794/');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testManualFacebookOverride();