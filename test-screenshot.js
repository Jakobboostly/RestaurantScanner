import { ApifyClient } from 'apify-client';

async function testScreenshot() {
  const client = new ApifyClient({
    token: process.env.APIFY_API_KEY
  });

  console.log('Testing Apify screenshot with cuisine + city + state format...');
  
  try {
    const run = await client.actor("apify/screenshot-url").call({
      urls: [
        {
          url: "https://www.google.com/search?q=" + encodeURIComponent("pizza Omaha NE")
        }
      ],
      format: "png",
      waitUntil: "networkidle2",
      delay: 2000,
      viewportWidth: 1366,
      scrollToBottom: false,
      delayAfterScrolling: 2500,
      waitUntilNetworkIdleAfterScroll: false,
      waitUntilNetworkIdleAfterScrollTimeout: 30000,
      proxy: {
        useApifyProxy: true
      },
      selectorsToHide: ""
    }, {
      timeout: 30000
    });

    console.log('Run completed:', run.status);
    console.log('Store ID:', run.defaultKeyValueStoreId);

    const store = await client.keyValueStore(run.defaultKeyValueStoreId);
    
    // Check all keys in store to find screenshot data
    try {
      const keys = await store.listKeys();
      console.log('Store keys count:', keys.items.length);
      console.log('All keys:', keys.items.map(k => k.key));
      
      // Check each key for screenshot data
      for (const keyInfo of keys.items) {
        const record = await store.getRecord(keyInfo.key);
        console.log(`\nKey '${keyInfo.key}' (${keyInfo.size} bytes):`);
        
        if (record && typeof record === 'object') {
          console.log('- Type: object');
          console.log('- Properties:', Object.keys(record));
          
          // Look for URL in various possible properties
          if (record.url || record.screenshotUrl || record.value) {
            console.log('✅ Found URL data:', record.url || record.screenshotUrl || record.value);
          }
        } else if (typeof record === 'string') {
          console.log('- Type: string');
          if (record.startsWith('http')) {
            console.log('✅ Found URL string:', record);
          } else {
            console.log('- Content preview:', record.substring(0, 100) + '...');
          }
        }
      }
      
      // Also check dataset
      const dataset = await client.dataset(run.defaultDatasetId);
      const data = await dataset.listItems();
      console.log('\nDataset items count:', data.items.length);
      if (data.items.length > 0) {
        console.log('First dataset item:', data.items[0]);
      }
    } catch (err) {
      console.log('Error accessing data:', err.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testScreenshot();