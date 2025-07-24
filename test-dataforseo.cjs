const axios = require('axios');

async function testDataForSEO() {
  console.log('Testing DataForSEO API...\n');
  
  const login = process.env.DATAFOREO_LOGIN;
  const password = process.env.DATAFOREO_PASSWORD;
  
  console.log(`Login: ${login}`);
  console.log(`Password: ${password ? '***' + password.substr(-3) : 'Not set'}`);
  
  const client = axios.create({
    baseURL: 'https://api.dataforseo.com/v3',
    auth: {
      username: login,
      password: password
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  try {
    // Test keyword research
    console.log('\nTesting keyword research...');
    const keywordResponse = await client.post('/keywords_data/google/search_volume/live', [{
      keywords: ['pizza near me', 'italian restaurant'],
      location_name: 'United States',
      language_name: 'English'
    }]);
    
    console.log('Keyword API Response Status:', keywordResponse.status);
    console.log('Tasks:', keywordResponse.data.tasks?.length || 0);
    
    if (keywordResponse.data.tasks?.[0]?.result) {
      console.log('✅ Keyword research working');
      console.log('Sample results:', keywordResponse.data.tasks[0].result.slice(0, 2));
    } else {
      console.log('❌ Keyword research failed');
      console.log('Response:', JSON.stringify(keywordResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ DataForSEO API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDataForSEO();