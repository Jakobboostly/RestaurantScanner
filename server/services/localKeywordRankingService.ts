/**
 * Local Keyword Ranking Service
 * 
 * Provides authentic local keyword ranking data for restaurants
 * Uses 8 specific local search patterns to show restaurant rankings
 */

import axios, { AxiosInstance } from 'axios';

export interface LocalKeywordRanking {
  keyword: string;
  position: number | null;
  searchUrl: string;
  found: boolean;
  matchType: 'domain' | 'name' | 'none';
  searchEngine: 'google';
  location: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
}

export interface CuisineLocationData {
  cuisineType: string;
  city: string;
  state: string;
  restaurantName: string;
  domain: string;
}

export class LocalKeywordRankingService {
  private client: AxiosInstance;

  constructor(login: string, password: string) {
    const credentials = Buffer.from(`${login}:${password}`).toString('base64');
    
    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Extract cuisine type from Google Business Profile data
   */
  private extractCuisineType(businessProfile: any): string {
    const types = businessProfile.types || [];
    const name = (businessProfile.name || '').toLowerCase();
    
    // Define cuisine type mappings
    const cuisineMap = {
      pizza: ['pizza', 'pizzeria'],
      mexican: ['mexican', 'taco', 'burrito', 'tex-mex'],
      italian: ['italian', 'pasta', 'trattoria'],
      chinese: ['chinese', 'asian'],
      thai: ['thai'],
      indian: ['indian', 'curry'],
      japanese: ['japanese', 'sushi', 'ramen'],
      american: ['american', 'burger', 'grill', 'bbq', 'barbecue'],
      seafood: ['seafood', 'fish', 'crab', 'lobster'],
      steakhouse: ['steakhouse', 'steak'],
      pub: ['pub', 'bar', 'brewery', 'tavern'],
      coffee: ['coffee', 'cafe', 'espresso'],
      bakery: ['bakery', 'bread', 'pastry'],
      deli: ['deli', 'sandwich', 'sub'],
      mediterranean: ['mediterranean', 'greek', 'middle eastern']
    };

    // Check business name first
    for (const [cuisine, keywords] of Object.entries(cuisineMap)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return cuisine;
      }
    }

    // Check business types
    for (const type of types) {
      const typeStr = type.toLowerCase();
      for (const [cuisine, keywords] of Object.entries(cuisineMap)) {
        if (keywords.some(keyword => typeStr.includes(keyword))) {
          return cuisine;
        }
      }
    }

    // Default fallback based on restaurant type
    if (types.includes('restaurant') || name.includes('restaurant')) {
      return 'restaurant';
    }

    return 'food'; // Final fallback
  }

  /**
   * Extract city and state from Google Business Profile formatted address
   */
  private extractCityState(businessProfile: any): { city: string; state: string } {
    const address = businessProfile.formatted_address || businessProfile.vicinity || '';
    
    // Try to extract city and state from formatted address
    // Format is usually: "Street, City, State ZIP, Country"
    const parts = address.split(',').map(part => part.trim());
    
    let city = '';
    let state = '';
    
    if (parts.length >= 3) {
      city = parts[parts.length - 3] || '';
      const stateZip = parts[parts.length - 2] || '';
      state = stateZip.split(' ')[0] || '';
    } else if (parts.length >= 2) {
      city = parts[parts.length - 2] || '';
      const stateZip = parts[parts.length - 1] || '';
      state = stateZip.split(' ')[0] || '';
    }

    // Clean up extracted values
    city = city.replace(/^\d+\s+/, ''); // Remove leading numbers
    state = state.replace(/\d.*/, ''); // Remove ZIP codes
    
    return {
      city: city || 'Unknown',
      state: state || 'Unknown'
    };
  }

  /**
   * Generate the 8 local keyword queries
   */
  private generateLocalKeywords(cuisineLocationData: CuisineLocationData): string[] {
    const { cuisineType, city, state } = cuisineLocationData;
    
    return [
      `${cuisineType} near me`,
      `${cuisineType} delivery ${city}`,
      `best ${cuisineType} ${city}`,
      `${city} ${cuisineType}`,
      `${cuisineType} places near me`,
      `${cuisineType} ${city} ${state}`,
      `${cuisineType} delivery near me`,
      `${cuisineType} open now`
    ];
  }

  /**
   * Search for restaurant ranking in SERP results
   */
  private findRestaurantInResults(
    items: any[], 
    localPack: any[], 
    domain: string, 
    restaurantName: string
  ): { position: number | null; matchType: 'domain' | 'name' | 'none' } {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // First check Local Pack results (positions 1-3 in local pack)
    for (let i = 0; i < localPack.length; i++) {
      const localItem = localPack[i];
      const localDomain = (localItem.domain || '').replace(/^www\./, '');
      const localTitle = (localItem.title || '').toLowerCase();
      
      // Match by domain
      if (localDomain && localDomain === cleanDomain) {
        return { position: i + 1, matchType: 'domain' };
      }
      
      // Match by restaurant name
      if (restaurantName && localTitle.includes(restaurantName.toLowerCase())) {
        return { position: i + 1, matchType: 'name' };
      }
    }

    // Then check organic search results (positions start after local pack)
    const localPackOffset = localPack.length > 0 ? 3 : 0; // Local pack typically takes 3 positions
    
    for (let i = 0; i < items.length && i < 50; i++) {
      const item = items[i];
      const itemDomain = (item.domain || '').replace(/^www\./, '');
      
      if (itemDomain && itemDomain === cleanDomain) {
        return { position: (item.rank_group || (i + 1)) + localPackOffset, matchType: 'domain' };
      }
    }

    return { position: null, matchType: 'none' };
  }

  /**
   * Get search volume data for keywords
   */
  private async getSearchVolumeData(keywords: string[], location: string): Promise<any[]> {
    try {
      console.log('🔍 LOCAL RANKING: Fetching search volume for keywords:', keywords);
      
      const response = await this.client.post('/keywords_data/google/search_volume/live', [{
        keywords: keywords,
        location_name: location,
        language_code: 'en'
      }]);

      const result = response.data.tasks?.[0]?.result || [];
      console.log('🔍 LOCAL RANKING: Search volume API response:', result.length, 'items');
      
      return result;
    } catch (error) {
      console.error('🔍 LOCAL RANKING: Error fetching search volume:', error);
      return [];
    }
  }

  /**
   * Get local keyword rankings for a restaurant using the 8 specified patterns
   */
  async getLocalKeywordRankings(
    businessProfile: any,
    domain: string
  ): Promise<LocalKeywordRanking[]> {
    console.log('🔍 LOCAL RANKING: Starting local keyword ranking analysis');
    
    // Extract cuisine and location data
    const cuisineType = this.extractCuisineType(businessProfile);
    const { city, state } = this.extractCityState(businessProfile);
    const restaurantName = businessProfile.name || '';
    
    const cuisineLocationData: CuisineLocationData = {
      cuisineType,
      city,
      state,
      restaurantName,
      domain
    };

    console.log('🔍 LOCAL RANKING: Extracted data:', cuisineLocationData);

    // Generate the 8 local keywords
    const localKeywords = this.generateLocalKeywords(cuisineLocationData);
    console.log('🔍 LOCAL RANKING: Generated keywords:', localKeywords);

    // First, get search volume data for all keywords
    const keywordVolumeData = await this.getSearchVolumeData(localKeywords, locationString);
    console.log('🔍 LOCAL RANKING: Search volume data received:', keywordVolumeData.length);

    const rankings: LocalKeywordRanking[] = [];
    const locationString = `${city}, ${state}, United States`;

    // Process each keyword with DataForSEO SERP API
    for (const keyword of localKeywords) {
      try {
        console.log(`🔍 LOCAL RANKING: Checking ranking for "${keyword}"`);

        const response = await this.client.post('/serp/google/organic/live', [{
          keyword,
          location_name: locationString,
          language_code: 'en',
          device: 'desktop',
          depth: 50
        }]);

        const result = response.data.tasks?.[0]?.result?.[0];
        const items = result?.items || [];
        const localPack = result?.local_pack?.local_pack || result?.local_pack || [];

        console.log(`🔍 LOCAL RANKING: Found ${items.length} organic results and ${localPack.length} local pack results for "${keyword}"`);

        // Find restaurant position
        const { position, matchType } = this.findRestaurantInResults(items, localPack, domain, restaurantName);

        // Get search volume data for this keyword
        const volumeData = keywordVolumeData.find(item => item.keyword === keyword);
        
        const ranking: LocalKeywordRanking = {
          keyword,
          position,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}&near=${encodeURIComponent(locationString)}`,
          found: position !== null,
          matchType,
          searchEngine: 'google',
          location: locationString,
          searchVolume: volumeData?.search_volume || 0,
          difficulty: volumeData?.keyword_info?.keyword_difficulty || 0,
          cpc: volumeData?.keyword_info?.cpc || 0
        };

        rankings.push(ranking);

        if (position) {
          console.log(`🔍 LOCAL RANKING: Found ${restaurantName} at position ${position} for "${keyword}" (matched by ${matchType})`);
        } else {
          console.log(`🔍 LOCAL RANKING: ${restaurantName} not found in top 50 results for "${keyword}"`);
        }

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`🔍 LOCAL RANKING: Error checking "${keyword}":`, error);
        
        // Get search volume data for this keyword even on error
        const volumeData = keywordVolumeData.find(item => item.keyword === keyword);
        
        rankings.push({
          keyword,
          position: null,
          searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
          found: false,
          matchType: 'none',
          searchEngine: 'google',
          location: locationString,
          searchVolume: volumeData?.search_volume || 0,
          difficulty: volumeData?.keyword_info?.keyword_difficulty || 0,
          cpc: volumeData?.keyword_info?.cpc || 0
        });
      }
    }

    console.log(`🔍 LOCAL RANKING: Completed analysis. Found rankings for ${rankings.filter(r => r.found).length}/${rankings.length} keywords`);
    
    return rankings;
  }
}