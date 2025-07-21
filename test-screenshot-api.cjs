const http = require('http');

function testAPI() {
  console.log('🧪 Testing restaurant screenshot API...');
  
  const postData = JSON.stringify({
    searchQuery: 'pizza restaurants near me'
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
    console.log(`Content-Type: ${res.headers['content-type']}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        if (res.headers['content-type']?.includes('application/json')) {
          const result = JSON.parse(data);
          console.log('✅ Screenshot API Response:', {
            success: result.success,
            hasBase64: !!result.screenshotBase64,
            base64Length: result.screenshotBase64?.length || 0,
            error: result.error,
            timestamp: result.timestamp
          });
          
          if (result.success && result.screenshotBase64) {
            console.log('✅ Screenshot captured successfully! Size:', (result.screenshotBase64.length / 1024).toFixed(2) + 'KB');
          } else {
            console.log('❌ Screenshot failed:', result.error);
          }
        } else {
          console.log('❌ Response is not JSON, got HTML page instead');
          console.log('First 200 chars:', data.substring(0, 200));
        }
      } catch (e) {
        console.error('❌ Failed to parse response:', e.message);
        console.log('Raw response (first 500 chars):', data.substring(0, 500));
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
  });

  req.setTimeout(120000, () => {
    console.log('❌ Request timed out after 2 minutes');
    req.destroy();
  });

  req.write(postData);
  req.end();
}

testAPI();