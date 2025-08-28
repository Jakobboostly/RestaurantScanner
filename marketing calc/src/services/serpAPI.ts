import { config } from '../config/api';
import { RestaurantCache } from '../utils/cache';

export interface LocalPackEntry {
  title: string;
  domain?: string;
  phone?: string;
  address?: string;
  rank_absolute: number;
  rank_group: number;
  url?: string;
}

export interface SerpKeywordResult {
  keyword: string;
  position: number;
  search_volume: number;
  isLocalPack: boolean;
  localPackPosition?: number;
  organic_position?: number;
}

export interface SerpAnalysisResult {
  success: boolean;
  keywords: SerpKeywordResult[];
  error?: string;
  restaurant_name?: string;
  location?: string;
}

class SerpAPIService {
  private baseUrl = 'https://api.dataforseo.com/v3/serp/google/local_finder/live/advanced';
  private credentials = {
    user: '',
    password: ''
  };

  /**
   * Generate local keyword candidates for a restaurant
   */
  private generateLocalKeywords(businessName: string, city: string, state: string): string[] {
    const cleanBusinessName = businessName.toLowerCase();
    const keywords = [
      businessName, // Exact business name
      `${businessName} ${city}`,
      `${businessName} ${state}`,
      `restaurants ${city}`,
      `restaurants near me`,
      `best restaurants ${city}`,
      `dining ${city}`,
      `food ${city}`,
    ];

    // Add cuisine-specific keywords if we can detect cuisine type
    if (cleanBusinessName.includes('pizza')) {
      keywords.push(`pizza ${city}`, `best pizza ${city}`, 'pizza near me');
    } else if (cleanBusinessName.includes('burger')) {
      keywords.push(`burgers ${city}`, `best burgers ${city}`, 'burgers near me');
    } else if (cleanBusinessName.includes('mexican') || cleanBusinessName.includes('taco')) {
      keywords.push(`mexican food ${city}`, `tacos ${city}`, 'mexican near me');
    } else if (cleanBusinessName.includes('chinese')) {
      keywords.push(`chinese food ${city}`, 'chinese near me');
    } else if (cleanBusinessName.includes('italian')) {
      keywords.push(`italian food ${city}`, `italian restaurant ${city}`, 'italian near me');
    }

    return keywords.slice(0, 10); // Limit to 10 keywords to control costs
  }

  /**
   * Query SERP API for a specific keyword
   */
  private async querySerpForKeyword(keyword: string, location: string): Promise<LocalPackEntry[]> {
    const requestPayload = {
      language_code: "en",
      location_name: location,
      device: "mobile",
      keyword: keyword
    };

    try {
      console.log(`Querying SERP for keyword: "${keyword}" in location: ${location}`);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.credentials.user}:${this.credentials.password}`)}`
        },
        body: JSON.stringify([requestPayload])
      });

      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`SERP API Response for "${keyword}":`, data);
      
      if (data.status_code !== 20000) {
        throw new Error(`SERP API error: ${data.status_message}`);
      }

      const localPackEntries: LocalPackEntry[] = [];
      
      if (data.tasks && data.tasks.length > 0) {
        const task = data.tasks[0];
        
        if (task.result && task.result.length > 0) {
          const result = task.result[0];
          
          if (result.items && result.items.length > 0) {
            result.items.forEach((item: any) => {
              if (item.rank_absolute && item.rank_absolute <= 10) {
                localPackEntries.push({
                  title: item.title || '',
                  domain: item.domain || '',
                  phone: item.phone || '',
                  address: item.address || '',
                  rank_absolute: item.rank_absolute,
                  rank_group: item.rank_group || item.rank_absolute,
                  url: item.url || ''
                });
              }
            });
          }
        }
      }

      return localPackEntries;
    } catch (error) {
      console.error(`Error querying SERP for keyword "${keyword}":`, error);
      return [];
    }
  }

  /**
   * Check if a local pack entry matches our restaurant
   */
  private matchesRestaurant(entry: LocalPackEntry, restaurantName: string, restaurantDomain: string): boolean {
    // Match by domain (strongest match)
    if (entry.domain && restaurantDomain && entry.domain.includes(restaurantDomain.replace('www.', ''))) {
      return true;
    }

    // Match by business name (case-insensitive, partial match)
    if (entry.title && restaurantName) {
      const entryTitle = entry.title.toLowerCase();
      const restName = restaurantName.toLowerCase();
      
      // Check if titles match closely
      if (entryTitle.includes(restName) || restName.includes(entryTitle)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze Local Pack presence for a restaurant
   */
  async analyzeLocalPackPresence(
    restaurantName: string, 
    restaurantDomain: string, 
    city: string, 
    state: string, 
    fullAddress: string
  ): Promise<SerpAnalysisResult> {
    if (!this.credentials.user || !this.credentials.password) {
      return {
        success: false,
        keywords: [],
        error: 'SERP API credentials not configured'
      };
    }

    // Check cache first
    const cacheKey = `serp_${restaurantDomain}_${city}_${state}`;
    const cached = RestaurantCache.getCachedKeywordData(restaurantDomain, `${city}, ${state}`);
    if (cached) {
      console.log(`Using cached SERP data for ${restaurantName}`);
      return cached as SerpAnalysisResult;
    }

    const location = `${city},${state},United States`;
    const keywords = this.generateLocalKeywords(restaurantName, city, state);
    const results: SerpKeywordResult[] = [];

    try {
      console.log(`Analyzing Local Pack presence for ${restaurantName} in ${location}`);
      console.log(`Testing keywords:`, keywords);

      // Query SERP for each keyword
      for (const keyword of keywords) {
        try {
          const localPackEntries = await this.querySerpForKeyword(keyword, location);
          
          // Check if our restaurant appears in local pack results
          let foundMatch = false;
          for (const entry of localPackEntries) {
            if (this.matchesRestaurant(entry, restaurantName, restaurantDomain)) {
              results.push({
                keyword: keyword,
                position: entry.rank_absolute,
                search_volume: this.estimateSearchVolume(keyword), // Estimate based on keyword type
                isLocalPack: true,
                localPackPosition: entry.rank_absolute,
                organic_position: undefined
              });
              foundMatch = true;
              console.log(`✓ Found ${restaurantName} in Local Pack for "${keyword}" at position ${entry.rank_absolute}`);
              break;
            }
          }
          
          if (!foundMatch && localPackEntries.length > 0) {
            console.log(`✗ ${restaurantName} not found in Local Pack for "${keyword}"`);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error processing keyword "${keyword}":`, error);
        }
      }

      const result: SerpAnalysisResult = {
        success: true,
        keywords: results,
        restaurant_name: restaurantName,
        location: location
      };

      // Cache for 24 hours (shorter than regular cache due to SERP volatility)
      RestaurantCache.cacheKeywordData(restaurantDomain, `${city}, ${state}`, result);
      
      console.log(`SERP analysis complete: Found ${results.length} Local Pack keywords for ${restaurantName}`);
      return result;

    } catch (error) {
      console.error('SERP analysis failed:', error);
      
      return {
        success: false,
        keywords: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        restaurant_name: restaurantName,
        location: location
      };
    }
  }

  /**
   * Estimate search volume based on keyword characteristics
   */
  private estimateSearchVolume(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    
    // High volume keywords
    if (lowerKeyword.includes('restaurants near me') || lowerKeyword === 'restaurants near me') return 2400;
    if (lowerKeyword.includes('pizza near me')) return 1800;
    if (lowerKeyword.includes('best restaurants')) return 1200;
    if (lowerKeyword.includes('food near me')) return 2000;
    
    // Medium volume keywords
    if (lowerKeyword.includes('near me')) return 800;
    if (lowerKeyword.includes('best')) return 600;
    if (lowerKeyword.includes('restaurants')) return 900;
    
    // Business-specific keywords (typically lower volume but high intent)
    if (lowerKeyword.split(' ').length <= 2) return 400; // Brand searches
    
    // Default estimate
    return 300;
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.credentials.user && this.credentials.password);
  }

  /**
   * Get configuration status for debugging
   */
  getStatus(): { configured: boolean; hasUser: boolean; hasPassword: boolean } {
    return {
      configured: this.isConfigured(),
      hasUser: !!this.credentials.user,
      hasPassword: !!this.credentials.password
    };
  }
}

export const serpAPI = new SerpAPIService();