import { ApifyClient } from 'apify-client';

async function testScreenshot() {
  const client = new ApifyClient({
    token: process.env.APIFY_API_KEY
  });

  console.log('Testing Apify screenshot with cuisine + city + state format...');
  
  try {
    const run = await client.actor("drobnikj/screenshot-url").call({
      url: "https://www.google.com/search?q=" + encodeURIComponent("pizza Omaha NE"),
      waitUntil: "networkidle2", 
      delay: 2000,
      viewportWidth: 1366,
      viewportHeight: 768,
      scrollToBottom: false
    }, {
      timeout: 30000
    });

    console.log('Run completed:', run.status);
    console.log('Store ID:', run.defaultKeyValueStoreId);

    const store = await client.keyValueStore(run.defaultKeyValueStoreId);
    
    // Try both key-value store and dataset approaches
    try {
      const keys = await store.listKeys();
      console.log('Store keys count:', keys.items.length);
      
      // Also try dataset
      const dataset = await client.dataset(run.defaultDatasetId);
      const data = await dataset.listItems();
      console.log('Dataset items count:', data.items.length);
      
      if (data.items.length > 0) {
        console.log('First dataset item:', data.items[0]);
        const firstItem = data.items[0];
        if (firstItem.screenshotUrl || firstItem.url || firstItem.screenshot) {
          console.log('✅ Screenshot found in dataset:', firstItem.screenshotUrl || firstItem.url || firstItem.screenshot);
        }
      }
      
      // Try OUTPUT key anyway
      const outputRecord = await store.getRecord('OUTPUT');
      if (outputRecord) {
        console.log('✅ OUTPUT record found:', outputRecord);
      }
    } catch (err) {
      console.log('Error accessing data:', err.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testScreenshot();