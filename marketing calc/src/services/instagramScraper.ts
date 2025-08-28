export interface InstagramMetrics {
  followersCount: number;
  postsCount: number;
  totalLikes: number;
  username?: string;
  profilePicUrl?: string;
  error?: string;
}

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN || '';
const ACTOR_ID = 'shu8hvrXbJbY3Eb9W';

export async function fetchInstagramMetrics(instagramUrl: string): Promise<InstagramMetrics> {
  try {
    console.log('Fetching Instagram metrics for:', instagramUrl);
    
    // Prepare Actor input
    const input = {
      addParentData: false,
      directUrls: [instagramUrl],
      enhanceUserSearchWithFacebookPage: false,
      isUserReelFeedURL: false,
      isUserTaggedFeedURL: false,
      resultsType: "details",
      searchLimit: 1,
      searchType: "user",
      resultsLimit: 10  // Limit to last 10 posts
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
    const maxAttempts = 30; // 30 seconds timeout
    
    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
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
    console.log('Instagram API Response:', items);
    
    if (items && items.length > 0) {
      const profile = items[0];
      console.log('Instagram Profile Data:', profile);
      console.log('Followers field:', profile.followersCount, 'Type:', typeof profile.followersCount);
      
      // Calculate total likes from last 10 posts
      let totalLikes = 0;
      if (profile.latestPosts && Array.isArray(profile.latestPosts)) {
        // Take only the first 10 posts (most recent)
        const recentPosts = profile.latestPosts.slice(0, 10);
        totalLikes = recentPosts.reduce((sum: number, post: any) => {
          return sum + (post.likesCount || 0);
        }, 0);
      }

      const result = {
        followersCount: Number(profile.followersCount) || 0,
        postsCount: Number(profile.postsCount) || 0,
        totalLikes,
        username: profile.username as string | undefined,
        profilePicUrl: profile.profilePicUrl as string | undefined
      };
      
      console.log('Instagram metrics to return:', result);
      return result;
    }

    throw new Error('No data returned from Instagram scraper');
  } catch (error) {
    console.error('Error fetching Instagram metrics:', error);
    return {
      followersCount: 0,
      postsCount: 0,
      totalLikes: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch Instagram data'
    };
  }
}