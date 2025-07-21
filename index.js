const { ApifyClient } = require('apify-client');

// Replace with your Apify API token
const APIFY_API_TOKEN = 'your-apify-api-token-here';

// Initialize Apify client
const client = new ApifyClient({
    token: APIFY_API_TOKEN
});

// Main function to run screenshot task
async function screenshotGoogleSearch(restaurantName) {
    const encodedQuery = encodeURIComponent(restaurantName);
    const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;

    const input = {
        url: searchUrl,
        waitUntil: "networkidle2",
        delay: 2000,
        viewportWidth: 1280,
        scrollToBottom: false
    };

    try {
        const run = await client.actor("apify/website-screenshot-generator").call({ input });

        const storeId = run.defaultKeyValueStoreId;
        const store = await client.keyValueStore(storeId);
        const { url: screenshotUrl } = await store.getRecord({ key: 'OUTPUT' });

        console.log("✅ Screenshot taken for:", restaurantName);
        console.log("🔗 Screenshot URL:", screenshotUrl);
    } catch (err) {
        console.error("❌ Error:", err);
    }
}

// 🔁 Change this to test different restaurants
screenshotGoogleSearch("Luigi's Pizza Austin TX");