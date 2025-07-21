// Direct test of the screenshot service
const http = require('http');

function testAPI() {
  console.log('🧪 Testing screenshot API endpoint...');
  
  const postData = JSON.stringify({
    searchQuery: 'pizza restaurants'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/screenshot/restaurant-search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ API Response:', {
          success: result.success,
          hasBase64: !!result.screenshotBase64,
          error: result.error,
          timestamp: result.timestamp
        });
      } catch (e) {
        console.log('❌ Response is not JSON:', data.substring(0, 200));
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
  });

  req.write(postData);
  req.end();
}

testAPI();