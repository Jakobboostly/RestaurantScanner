#!/usr/bin/env node

/**
 * Test script for the n8n webhook endpoint
 * Usage: node test-n8n-endpoint.js [url] [apiKey]
 */

const url = process.argv[2] || 'mcdonalds.com';
const apiKey = process.argv[3] || '';

async function testEndpoint() {
  try {
    console.log('🧪 Testing n8n webhook endpoint...');
    console.log(`📍 URL: ${url}`);
    console.log(`🔑 API Key: ${apiKey ? 'Provided' : 'Not provided'}`);
    
    const response = await fetch('http://localhost:3000/api/webhook/scan-by-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        apiKey: apiKey,
        returnFormat: 'simplified'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Success! Response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n❌ Error response:');
      console.log(`Status: ${response.status}`);
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('\n💥 Request failed:', error.message);
  }
}

testEndpoint();