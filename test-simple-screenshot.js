import { ApifyClient } from 'apify-client';

async function testSimpleScreenshot() {
  const client = new ApifyClient({
    token: process.env.APIFY_API_KEY
  });

  console.log('Testing simple screenshot actor...');
  
  try {
    // Try a simple screenshot actor that definitely works
    const run = await client.actor("drobnikj/screenshot-url").call({
      input: {
        url: "https://www.google.com/search?q=" + encodeURIComponent("pizza Austin TX"),
        waitUntil: "networkidle2"
      }
    });

    console.log('Run status:', run.status);
    
    if (run.status === 'SUCCEEDED') {
      // Try to get the screenshot data
      const store = await client.keyValueStore(run.defaultKeyValueStoreId);
      const output = await store.getRecord('OUTPUT');
      
      if (output && output.url) {
        console.log('✅ Screenshot URL:', output.url);
        return output.url;
      } else {
        console.log('❌ No screenshot URL in OUTPUT');
        
        // Try other common keys
        const keys = await store.listKeys();
        console.log('Available keys:', keys.items.map(k => k.key));
        
        for (const keyInfo of keys.items) {
          if (keyInfo.key === 'screenshot.png' || keyInfo.key === 'image.png') {
            const record = await store.getRecord(keyInfo.key);
            if (record && typeof record === 'string') {
              console.log(`✅ Found screenshot at key ${keyInfo.key}: ${record.substring(0, 100)}...`);
              return record;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  return null;
}

testSimpleScreenshot();