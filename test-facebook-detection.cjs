// Test Facebook detection for Wolfey's
const axios = require('axios');

async function testFacebookDetection() {
  console.log('🔍 Testing Facebook detection for Wolfey\'s Wapsi Outback...');
  
  const testData = {
    placeId: "ChIJywz4kD-gxIkRpvJJo-TK0e0",
    domain: "wolfeysbar.com", 
    restaurantName: "Wolfey's Wapsi Outback"
  };
  
  try {
    console.log('📡 Starting scan...');
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
    console.log('Social media verification:', result.socialMediaLinks?.facebookVerified || false);
    console.log('Detection confidence:', result.socialMediaLinks?.facebookConfidence || 'N/A');
    
    if (!result.socialMediaLinks?.facebook) {
      console.log('\n❌ Facebook page not detected automatically');
      console.log('Expected: https://www.facebook.com/p/Wolfeys-Wapsi-Outback-100055314674794/');
      console.log('\n🔧 This suggests the Facebook page is not linked on the website');
      console.log('   or the detection patterns need improvement for this specific case.');
    } else {
      console.log('\n✅ Facebook page detected successfully!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFacebookDetection();