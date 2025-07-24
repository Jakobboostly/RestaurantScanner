const https = require('https');

const login = process.env.DATAFOREO_LOGIN || 'jakob@boostly.com';
const password = process.env.DATAFOREO_PASSWORD || 'bf81eb0c18e23e56';

console.log('Testing DataForSEO with credentials:');
console.log('Login:', login);
console.log('Password:', password ? '***' + password.substr(-3) : 'Not set');

const auth = Buffer.from(`${login}:${password}`).toString('base64');

const data = JSON.stringify([{
  keywords: ['pizza near me'],
  location_name: 'United States',
  language_name: 'English'
}]);

const options = {
  hostname: 'api.dataforseo.com',
  port: 443,
  path: '/v3/keywords_data/google/search_volume/live',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log('\nStatus Code:', res.statusCode);
  console.log('Status Message:', res.statusMessage);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('\nResponse:', JSON.stringify(result, null, 2));
      
      if (result.tasks && result.tasks[0] && result.tasks[0].result) {
        console.log('\n✅ DataForSEO API is working!');
        console.log('Keywords found:', result.tasks[0].result.length);
      } else {
        console.log('\n❌ DataForSEO API returned unexpected format');
      }
    } catch (error) {
      console.error('\nError parsing response:', error);
      console.log('Raw response:', responseData.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error);
});

req.write(data);
req.end();