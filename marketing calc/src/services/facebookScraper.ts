export interface FacebookMetrics {
  followers: number;
  likes: number;
  isRunningAds: boolean;
  isActivePage: boolean;
  pageName?: string;
  error?: string;
}

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN || '';
const ACTOR_ID = '4Hv5RhChiaDk6iwad';

export async function fetchFacebookMetrics(facebookUrl: string): Promise<FacebookMetrics> {
  try {
    console.log('Fetching Facebook metrics for:', facebookUrl);
    
    // Ensure the URL is properly formatted
    let formattedUrl = facebookUrl;
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // Prepare Actor input
    const input = {
      startUrls: [
        {
          url: formattedUrl
        }
      ]
    };

    // Start the actor run using Apify REST API
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input)
    });

    if (!runResponse.ok) {
      throw new Error(`Failed to start Apify actor: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    // Wait for the run to finish (poll status)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes timeout
    
    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
    }
    
    if (status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${status}`);
    }
    
    // Fetch the results from the default dataset
    const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items?token=${APIFY_TOKEN}`);
    
    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch results: ${resultsResponse.statusText}`);
    }
    
    const items = await resultsResponse.json();
    console.log('Facebook API Response:', items);
    
    if (items && items.length > 0) {
      const pageData = items[0];
      console.log('Facebook Page Data:', pageData);
      
      // Check if the page returned an error (privacy restricted, deleted, etc.)
      if (pageData.error) {
        console.log('Facebook page error:', pageData.error, pageData.errorDescription);
        return {
          followers: 0,
          likes: 0,
          isRunningAds: false,
          isActivePage: false,
          pageName: pageData.url || 'Unknown',
          error: `Access restricted: ${pageData.errorDescription || pageData.error}`
        };
      }
      
      console.log('All available fields:', Object.keys(pageData));
      console.log('Followers field:', pageData.followers, 'Type:', typeof pageData.followers);
      console.log('Likes field:', pageData.likes, 'Type:', typeof pageData.likes);
      
      // Try multiple possible field names for followers and likes
      const followers = pageData.followers || pageData.followersCount || pageData.fanCount || pageData.fans || 0;
      const likes = pageData.likes || pageData.pageLikes || pageData.likesCount || 0;
      
      const result = {
        followers: Number(followers) || 0,
        likes: Number(likes) || 0,
        isRunningAds: pageData.ad_status === true || pageData.ad_status === 'true' || pageData.ad_status === 1,
        isActivePage: pageData.is_business_page_active === true || pageData.is_business_page_active === 'true',
        pageName: pageData.name || pageData.pageName || pageData.title
      };
      
      console.log('Facebook metrics to return:', result);
      return result;
    }

    throw new Error('No data returned from Facebook scraper');
  } catch (error) {
    console.error('Error fetching Facebook metrics:', error);
    return {
      followers: 0,
      likes: 0,
      isRunningAds: false,
      isActivePage: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Facebook data'
    };
  }
}