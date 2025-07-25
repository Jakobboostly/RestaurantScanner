export class DataForSeoRankedKeywordsService {
  private login: string;
  private password: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
  }

  async getRankedKeywords(domain: string, location?: string, language?: string, limit?: number) {
    // Minimal implementation to prevent errors
    return [];
  }

  async getLocalCompetitiveKeywords(businessName: string, cuisine: string, city: string, state: string, location?: string, language?: string) {
    // Generate the 8 targeted keywords using business name and location
    const targetedKeywords = [
      `${cuisine} near me`,
      `${cuisine} delivery ${city}`,
      `best ${cuisine} ${city}`,
      `${city} ${cuisine}`,
      `${cuisine} places near me`,
      `${cuisine} ${city} ${state}`,
      `${cuisine} delivery near me`,
      `${cuisine} open now`
    ];

    console.log(`🔍 Making Local Finder API calls for business: ${businessName} in ${city}, ${state}`);
    
    try {
      // Make real DataForSEO Local Finder API calls for each keyword
      const keywordResults = await Promise.all(
        targetedKeywords.map(async (keyword) => {
          try {
            console.log(`🔍 Querying Local Finder API for: "${keyword}"`);
            
            const post_array = [{
              location_code: 2840, // Utah location code for Google Maps API
              language_code: "en",
              keyword: keyword,
              depth: 20 // Check first 20 local results
            }];

            const response = await fetch('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(post_array)
            });

            if (!response.ok) {
              console.log(`❌ Local Finder API failed for "${keyword}": ${response.status}`);
              return { keyword, position: 0 };
            }

            const data = await response.json();
            
            if (data.tasks && data.tasks[0] && data.tasks[0].result && data.tasks[0].result[0]) {
              const localResults = data.tasks[0].result[0].items || [];
              
              // Find business by name matching (flexible matching)
              const businessPosition = localResults.findIndex((item: any) => {
                const itemTitle = (item.title || '').toLowerCase();
                const searchName = businessName.toLowerCase();
                
                // Multiple matching strategies
                return itemTitle.includes(searchName) || 
                       searchName.includes(itemTitle.split(' ')[0]) ||
                       itemTitle.includes(cuisine.toLowerCase());
              });

              const position = businessPosition >= 0 ? businessPosition + 1 : 0;
              console.log(`✅ "${keyword}" - Business found at position: ${position}`);
              
              return {
                keyword,
                position,
                searchVolume: 0,
                difficulty: 0,
                intent: 'local',
                cpc: 0,
                competition: 0
              };
            } else {
              console.log(`⚠️ No local results for "${keyword}"`);
              return { keyword, position: 0 };
            }
          } catch (error) {
            console.log(`❌ Error querying "${keyword}":`, error);
            return { keyword, position: 0 };
          }
        })
      );

      console.log(`✅ Local Finder API completed for ${keywordResults.length} keywords`);
      return keywordResults;
      
    } catch (error) {
      console.log('❌ Local Finder API batch failed:', error);
      
      // Return fallback data with position 0 (Not Ranked) if API fails
      return targetedKeywords.map(keyword => ({
        keyword: keyword,
        position: 0,
        searchVolume: 0,
        difficulty: 0,
        intent: 'local',
        cpc: 0,
        competition: 0
      }));
    }
  }

  async getRealRestaurantRankings(domain: string, keywords: string[]) {
    // Minimal implementation to prevent errors
    return [];
  }

  async getTargetedCompetitiveKeywords(domain: string, cuisine: string, city: string, state: string) {
    // Minimal implementation to prevent errors
    return [];
  }
}