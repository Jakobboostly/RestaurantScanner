import { ApifyClient } from 'apify-client';

export interface SerpScreenshotResult {
  keyword: string;
  location: string;
  screenshotUrl: string;
  restaurantRanking: {
    position: number;
    found: boolean;
    title: string;
    url: string;
    snippet: string;
  } | null;
  totalResults: number;
  searchUrl: string;
  localPackPresent: boolean;
  localPackResults: Array<{
    name: string;
    rating: number;
    reviews: number;
    position: number;
  }>;
}

export class SerpScreenshotService {
  private apifyClient: ApifyClient;
  
  constructor(apifyApiKey?: string) {
    this.apifyClient = new ApifyClient({
      token: apifyApiKey || process.env.APIFY_API_KEY || ''
    });
  }
  
  async captureSearchResults(
    cuisineType: string,
    city: string,
    state: string,
    restaurantName: string,
    restaurantDomain: string
  ): Promise<SerpScreenshotResult> {
    
    try {
      // Build search query in "food type + city + state" format
      const keyword = `${cuisineType} ${city} ${state}`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
      
      console.log(`🔍 Capturing SERP screenshot via Apify for: "${keyword}"`);
      console.log(`📍 Search URL: ${searchUrl}`);

      // Configure Apify screenshot input with correct format
      const input = {
        urls: [
          {
            url: searchUrl
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
      };

      // Run Apify screenshot actor
      console.log('🚀 Starting Apify screenshot actor...');
      const run = await this.apifyClient.actor("apify/screenshot-url").call({
        input,
        timeout: 30000
      });

      // Get screenshot URL from Apify storage or dataset
      console.log('🗂️ Retrieving screenshot from Apify storage...');
      console.log('Run details:', { id: run.id, status: run.status, storeId: run.defaultKeyValueStoreId });
      
      let screenshotUrl = null;
      
      try {
        // Try dataset first
        const dataset = await this.apifyClient.dataset(run.defaultDatasetId);
        const data = await dataset.listItems();
        console.log('📊 Dataset items count:', data.items.length);
        
        if (data.items.length > 0) {
          const firstItem = data.items[0];
          console.log('📄 First dataset item keys:', Object.keys(firstItem));
          screenshotUrl = firstItem.screenshotUrl || firstItem.url || firstItem.screenshot;
          if (screenshotUrl) {
            console.log(`✅ Screenshot found in dataset: ${screenshotUrl}`);
          }
        }
        
        // If not in dataset, try key-value store
        if (!screenshotUrl) {
          const storeId = run.defaultKeyValueStoreId;
          const store = await this.apifyClient.keyValueStore(storeId);
          const record = await store.getRecord('OUTPUT');
          
          console.log('📄 Storage record:', record ? 'Found' : 'Not found');
          if (record) {
            console.log('📄 Record keys:', Object.keys(record));
            screenshotUrl = (record as any).url || (record as any).screenshotUrl;
          }
        }
        
        if (!screenshotUrl) {
          console.log('❌ No screenshot URL found in dataset or key-value store');
          console.log('🔍 This is likely due to Google rate limiting/blocking the screenshot requests');
          throw new Error('Screenshot not generated - Google blocked the request (429 errors)');
        }
        
        console.log(`✅ Screenshot captured successfully: ${screenshotUrl}`);
      } catch (storageError) {
        console.error('❌ Error accessing Apify storage:', storageError);
        throw new Error(`Failed to retrieve screenshot: ${(storageError as Error).message}`);
      }

      // Basic restaurant ranking analysis (simplified for Apify approach)
      const restaurantRanking = {
        position: -1,
        found: false,
        title: restaurantName,
        url: restaurantDomain || '',
        snippet: `Restaurant analysis for ${restaurantName}`
      };

      // Return result with Apify screenshot URL
      return {
        keyword,
        location: `${city}, ${state}`,
        screenshotUrl,
        restaurantRanking,
        totalResults: 0, // Would need additional API call to get this
        searchUrl,
        localPackPresent: true, // Assume local pack is present for restaurant searches
        localPackResults: []
      };

    } catch (error) {
      console.error('❌ Apify screenshot capture failed:', error);
      
      // Return fallback result
      const keyword = `${cuisineType} ${city} ${state}`;
      return {
        keyword,
        location: `${city}, ${state}`,
        screenshotUrl: '',
        restaurantRanking: null,
        totalResults: 0,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
        localPackPresent: false,
        localPackResults: []
      };
    }
  }

  // Helper method to extract cuisine type from restaurant name/business info
  extractCuisineType(restaurantName: string, businessTypes?: string[]): string {
    const name = restaurantName.toLowerCase();
    const types = businessTypes?.join(' ').toLowerCase() || '';
    const combined = `${name} ${types}`;

    // Enhanced cuisine detection
    if (combined.includes('pizza')) return 'pizza';
    if (combined.includes('mexican') || combined.includes('taco') || combined.includes('burrito')) return 'mexican food';
    if (combined.includes('chinese') || combined.includes('asian')) return 'chinese food';
    if (combined.includes('italian')) return 'italian food';
    if (combined.includes('indian')) return 'indian food';
    if (combined.includes('thai')) return 'thai food';
    if (combined.includes('japanese') || combined.includes('sushi')) return 'japanese food';
    if (combined.includes('brewery') || combined.includes('brew')) return 'brewery';
    if (combined.includes('pub') || combined.includes('bar')) return 'pub';
    if (combined.includes('coffee') || combined.includes('cafe')) return 'coffee shop';
    if (combined.includes('bakery') || combined.includes('pastry')) return 'bakery';
    if (combined.includes('sandwich') || combined.includes('deli')) return 'sandwich shop';
    if (combined.includes('burger')) return 'burger restaurant';
    if (combined.includes('bbq') || combined.includes('barbecue')) return 'bbq restaurant';
    if (combined.includes('steakhouse') || combined.includes('steak')) return 'steakhouse';
    if (combined.includes('seafood') || combined.includes('fish')) return 'seafood restaurant';
    if (combined.includes('chicken')) return 'chicken restaurant';
    if (combined.includes('mediterranean')) return 'mediterranean food';
    if (combined.includes('french')) return 'french restaurant';

    // Default fallback
    return 'restaurant';
  }

  // Helper method to extract city and state from address
  extractCityState(address: string): { city: string; state: string } {
    console.log(`🗺️ Extracting city/state from address: "${address}"`);
    
    const addressParts = address.split(',').map(part => part.trim());
    console.log(`Address parts:`, addressParts);
    
    if (addressParts.length >= 3) {
      const cityPart = addressParts[addressParts.length - 3];
      const stateZip = addressParts[addressParts.length - 2];
      const statePart = stateZip.split(' ')[0];
      
      console.log(`Extracted - City: "${cityPart}", State: "${statePart}"`);
      
      return {
        city: cityPart || 'Unknown',
        state: statePart || 'Unknown'
      };
    }
    
    console.log(`Address parsing failed - not enough parts`);
    return { city: 'Unknown', state: 'Unknown' };
  }
}