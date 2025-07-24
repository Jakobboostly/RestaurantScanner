import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: process.env.APIFY_API_KEY,
});

// Prepare Actor input
const input = {
    "startUrls": [
        {
            "url": "https://www.facebook.com/Upstream-Brewing-Company-149190721771663/"
        }
    ]
};

(async () => {
    console.log('Testing Facebook Actor 4Hv5RhChiaDk6iwad...');
    
    try {
        // Run the Actor and wait for it to finish
        const run = await client.actor("4Hv5RhChiaDk6iwad").call(input);
        
        console.log('Actor run completed, ID:', run.id);
        console.log('Status:', run.status);
        
        // Fetch and print Actor results from the run's dataset (if any)
        console.log('\nResults from dataset:');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        console.log('Total items found:', items.length);
        
        if (items.length > 0) {
            console.log('\nFirst item structure:');
            console.log('Keys:', Object.keys(items[0]));
            
            console.log('\nFirst item data:');
            console.dir(items[0], { depth: 3 });
        }
        
    } catch (error) {
        console.error('Error running Facebook actor:', error);
    }
})();