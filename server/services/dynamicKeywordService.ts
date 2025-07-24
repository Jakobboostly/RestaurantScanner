import axios from 'axios';

interface GoogleBusinessProfile {
  name: string;
  formatted_address: string;
  types: string[];
  website?: string;
}

interface KeywordResult {
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  intent: string;
  cpc: number;
  competition: number;
  opportunity: number;
  url: string;
  title: string;
  description: string;
  isNew: boolean;
  isLost: boolean;
  positionChange: number;
  previousPosition: number;
}

interface DynamicKeywordResponse {
  rankedKeywords: KeywordResult[];
  competitiveOpportunityKeywords: KeywordResult[];
  locationData: {
    city: string;
    state: string;
    cuisine: string;
  };
}

export class DynamicKeywordService {
  private dataForSeoLogin: string;
  private dataForSeoPassword: string;
  private authHeader: string;

  constructor() {
    this.dataForSeoLogin = process.env.DATAFORSEO_LOGIN || '';
    this.dataForSeoPassword = process.env.DATAFORSEO_PASSWORD || '';
    this.authHeader = Buffer.from(`${this.dataForSeoLogin}:${this.dataForSeoPassword}`).toString('base64');
  }

  /**
   * Extract cuisine type from Google Places types and business name
   */
  private extractCuisine(googlePlacesTypes: string[], businessName: string = ''): string {
    // Primary cuisine mapping from Google Places types
    const cuisineMap: { [key: string]: string } = {
      // Pizza & Italian
      'pizza_restaurant': 'pizza',
      'italian_restaurant': 'italian',
      
      // Asian Cuisines
      'chinese_restaurant': 'chinese',
      'japanese_restaurant': 'japanese', 
      'korean_restaurant': 'korean',
      'thai_restaurant': 'thai',
      'vietnamese_restaurant': 'vietnamese',
      'indian_restaurant': 'indian',
      'asian_restaurant': 'asian',
      
      // Mexican & Latin
      'mexican_restaurant': 'mexican',
      'latin_american_restaurant': 'latin',
      
      // American & Western
      'american_restaurant': 'american',
      'hamburger_restaurant': 'burger',
      'steak_house': 'steakhouse',
      'barbecue_restaurant': 'bbq',
      'sandwich_shop': 'sandwich',
      
      // Fast Food & Casual
      'meal_delivery': 'restaurant',
      'meal_takeaway': 'restaurant',
      'fast_food_restaurant': 'fast food',
      
      // Breakfast & Cafe
      'breakfast_restaurant': 'breakfast',
      'brunch_restaurant': 'brunch',
      'cafe': 'coffee',
      'coffee_shop': 'coffee',
      
      // Specialty
      'seafood_restaurant': 'seafood',
      'sushi_restaurant': 'sushi',
      'bakery': 'bakery',
      'ice_cream_shop': 'ice cream',
      'deli': 'deli',
      'food_truck': 'food truck',
      
      // Broad categories
      'restaurant': 'restaurant',
      'bar': 'bar',
      'night_club': 'bar'
    };
    
    // Check Google Places types first (with safety check)
    if (googlePlacesTypes && Array.isArray(googlePlacesTypes)) {
      for (let type of googlePlacesTypes) {
        if (cuisineMap[type]) {
          return cuisineMap[type];
        }
      }
    }
    
    // Fallback: Parse business name for cuisine keywords
    const nameKeywords = businessName.toLowerCase();
    const nameBasedCuisine: { [key: string]: string } = {
      'pizza': 'pizza',
      'burger': 'burger', 
      'taco': 'mexican',
      'sushi': 'sushi',
      'chinese': 'chinese',
      'thai': 'thai',
      'indian': 'indian',
      'italian': 'italian',
      'mexican': 'mexican',
      'bbq': 'bbq',
      'barbecue': 'bbq',
      'steakhouse': 'steakhouse',
      'steak': 'steakhouse',
      'seafood': 'seafood',
      'deli': 'deli',
      'bakery': 'bakery',
      'cafe': 'coffee',
      'coffee': 'coffee',
      'sandwich': 'sandwich',
      'wings': 'wings',
      'chicken': 'chicken',
      'ramen': 'ramen',
      'pho': 'vietnamese',
      'korean': 'korean',
      'mediterranean': 'mediterranean',
      'greek': 'greek',
      'french': 'french',
      'soul food': 'soul food',
      'cajun': 'cajun',
      'creole': 'creole'
    };
    
    for (let keyword in nameBasedCuisine) {
      if (nameKeywords.includes(keyword)) {
        return nameBasedCuisine[keyword];
      }
    }
    
    // Ultimate fallback: return 'restaurant'
    return 'restaurant';
  }

  /**
   * Extract city and state from Google Places formatted address
   */
  private extractLocationData(formattedAddress: string): { city: string; state: string } {
    const addressParts = formattedAddress.split(', ');
    
    // Handle different address formats
    if (addressParts.length >= 3) {
      const city = addressParts[addressParts.length - 3];
      const stateZip = addressParts[addressParts.length - 2];
      const state = stateZip.split(' ')[0];
      
      return { city: city.trim(), state: state.trim() };
    }
    
    // Fallback for shorter addresses
    if (addressParts.length >= 2) {
      const lastPart = addressParts[addressParts.length - 1];
      const secondLastPart = addressParts[addressParts.length - 2];
      
      // If last part contains state/country info
      if (lastPart.includes('USA') || lastPart.includes('United States')) {
        const stateZip = secondLastPart;
        const state = stateZip.split(' ')[0];
        const city = addressParts[addressParts.length - 3] || secondLastPart;
        return { city: city.trim(), state: state.trim() };
      }
    }
    
    // Ultimate fallback
    return { city: 'Unknown', state: 'Unknown' };
  }

  /**
   * Generate dynamic keywords based on location and cuisine
   */
  private generateKeywords(city: string, cuisine: string): string[] {
    const baseKeywords = [
      `${cuisine} ${city.toLowerCase()}`,
      `${cuisine} in ${city.toLowerCase()}`,
      `best ${cuisine} ${city.toLowerCase()}`,
      `${city.toLowerCase()} ${cuisine}`,
      `${cuisine} near me`,
      `${cuisine} delivery ${city.toLowerCase()}`,
      `${cuisine} takeout ${city.toLowerCase()}`
    ];
    
    // Add cuisine-specific variations
    const cuisineSpecific: { [key: string]: string[] } = {
      'pizza': [
        `pizza places ${city.toLowerCase()}`,
        `pizza delivery ${city.toLowerCase()}`,
        `best pizza ${city.toLowerCase()}`
      ],
      'burger': [
        `burger joint ${city.toLowerCase()}`,
        `hamburger ${city.toLowerCase()}`,
        `best burgers ${city.toLowerCase()}`
      ],
      'chinese': [
        `chinese food ${city.toLowerCase()}`,
        `chinese takeout ${city.toLowerCase()}`,
        `chinese delivery ${city.toLowerCase()}`
      ],
      'mexican': [
        `mexican food ${city.toLowerCase()}`,
        `tacos ${city.toLowerCase()}`,
        `mexican restaurant ${city.toLowerCase()}`
      ],
      'coffee': [
        `coffee shop ${city.toLowerCase()}`,
        `cafe ${city.toLowerCase()}`,
        `coffee ${city.toLowerCase()}`
      ],
      'restaurant': [
        `restaurants ${city.toLowerCase()}`,
        `dining ${city.toLowerCase()}`,
        `food ${city.toLowerCase()}`
      ]
    };
    
    if (cuisineSpecific[cuisine]) {
      baseKeywords.push(...cuisineSpecific[cuisine]);
    }
    
    return baseKeywords;
  }

  /**
   * Build local relevance filters for restaurant SEO
   */
  private buildLocalRelevanceFilters(restaurantData: any): any[] {
    const { name, cuisine, city, state } = restaurantData;

    // Core restaurant-relevant terms
    const relevantTerms = [
      // Cuisine-specific terms
      cuisine.toLowerCase(),
      ...this.getCuisineSpecificTerms(cuisine),
      
      // Location terms (critical for local SEO)
      city.toLowerCase(),
      state.toLowerCase(),
      
      // Local intent keywords (high value for restaurants)
      'near me', 'nearby', 'delivery', 'takeout', 'open now',
      'menu', 'hours', 'phone', 'address', 'location',
      
      // Restaurant business terms
      'restaurant', 'food', 'dining', 'eat', 'order',
      
      // Local qualifiers
      'best', 'top', 'good', 'great', 'reviews', 'rated'
    ];

    // Add restaurant name (first significant word)
    const nameWords = name.toLowerCase().split(' ');
    const significantName = nameWords.find((word: string) => word.length > 3);
    if (significantName) {
      relevantTerms.push(significantName);
    }

    // Convert to DataForSEO filter format (OR logic)
    return relevantTerms.map(term => 
      ["keyword_data.keyword", "like", `%${term}%`]
    );
  }

  /**
   * Get cuisine-specific terms for enhanced relevance
   */
  private getCuisineSpecificTerms(cuisine: string): string[] {
    const cuisineTermsMap: { [key: string]: string[] } = {
      'pizza': ['pizza', 'pizzeria', 'pizza place', 'pizza shop', 'slice'],
      'burger': ['burger', 'hamburger', 'cheeseburger', 'burger joint'],
      'chinese': ['chinese food', 'chinese restaurant', 'asian food', 'wok'],
      'mexican': ['mexican food', 'tacos', 'burrito', 'tex mex', 'mexican restaurant'],
      'italian': ['italian food', 'italian restaurant', 'pasta', 'spaghetti'],
      'thai': ['thai food', 'thai restaurant', 'pad thai'],
      'indian': ['indian food', 'indian restaurant', 'curry', 'tandoori'],
      'japanese': ['japanese food', 'sushi', 'ramen', 'japanese restaurant'],
      'coffee': ['coffee shop', 'cafe', 'coffee', 'espresso', 'latte'],
      'bakery': ['bakery', 'fresh bread', 'pastries', 'baked goods'],
      'seafood': ['seafood restaurant', 'fresh fish', 'shrimp', 'crab'],
      'steakhouse': ['steakhouse', 'steak restaurant', 'beef', 'prime rib'],
      'bbq': ['bbq', 'barbecue', 'ribs', 'bbq restaurant', 'smoked'],
      'breakfast': ['breakfast', 'brunch', 'breakfast spot', 'pancakes'],
      'sandwich': ['sandwich shop', 'deli', 'subs', 'hoagie']
    };

    return cuisineTermsMap[cuisine.toLowerCase()] || [cuisine.toLowerCase()];
  }

  /**
   * Get best performing keywords (rankings 1-20)
   */
  private async getBestPerformingKeywords(restaurantData: any): Promise<any[]> {
    const relevanceFilters = this.buildLocalRelevanceFilters(restaurantData);
    const localLocation = `${restaurantData.city}, ${restaurantData.state}`;

    const query = {
      target: restaurantData.website,
      language_code: 'en',
      location_name: localLocation,
      limit: 10,
      order_by: ['ranked_serp_element.serp_item.rank_absolute,asc'],
      filters: [
        relevanceFilters,
        'and',
        ['keyword_data.keyword_info.search_volume', '>', 50],
        'and',
        ['ranked_serp_element.serp_item.rank_absolute', '<=', 20]
      ]
    };

    return await this.makeDataForSEORequest(query);
  }

  /**
   * Get opportunity keywords (rankings 21+)
   */
  private async getOpportunityKeywords(restaurantData: any): Promise<any[]> {
    const relevanceFilters = this.buildLocalRelevanceFilters(restaurantData);
    const localLocation = `${restaurantData.city}, ${restaurantData.state}`;

    const query = {
      target: restaurantData.website,
      language_code: 'en',
      location_name: localLocation,
      limit: 10,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
      filters: [
        relevanceFilters,
        'and',
        ['ranked_serp_element.serp_item.rank_absolute', '>', 20],
        'and',
        ['keyword_data.keyword_info.search_volume', '>', 100]
      ]
    };

    return await this.makeDataForSEORequest(query);
  }

  /**
   * Make DataForSEO API request
   */
  private async makeDataForSEORequest(queryData: any): Promise<any[]> {
    try {
      console.log('🎯 DataForSEO Query:', JSON.stringify(queryData, null, 2));
      
      const response = await axios.post(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live',
        [queryData],
        {
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const items = response.data?.tasks?.[0]?.result?.[0]?.items || [];
      console.log(`🔍 DataForSEO returned ${items.length} keywords`);
      return items;

    } catch (error: any) {
      console.log('🚨 DataForSEO API error:', error.message);
      console.log('🚨 API URL:', 'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live');
      console.log('🚨 Auth header configured:', !!this.authHeader);
      if (error.response) {
        console.log('🚨 Response status:', error.response.status);
        console.log('🚨 Response data:', JSON.stringify(error.response.data, null, 2));
      }
      return [];
    }
  }



  /**
   * Main method to get dynamic keyword rankings for a restaurant using local SEO approach
   */
  async getDynamicKeywordRankings(businessProfile: GoogleBusinessProfile): Promise<DynamicKeywordResponse> {
    try {
      // Extract location and cuisine data from address field
      const { city, state } = this.extractLocationData(businessProfile.address || businessProfile);
      
      console.log(`🔍 DEBUG: businessProfile.types =`, businessProfile.types, typeof businessProfile.types);
      console.log(`🔍 DEBUG: businessProfile.name =`, businessProfile.name);
      
      const cuisine = this.extractCuisine(businessProfile.types, businessProfile.name);

      console.log(`🎯 Local SEO keyword analysis for ${businessProfile.name} - ${cuisine} in ${city}, ${state}`);

      if (!businessProfile.website) {
        console.log('No website found for keyword analysis');
        return {
          rankedKeywords: [],
          competitiveOpportunityKeywords: [],
          locationData: { city, state, cuisine }
        };
      }

      // Get the actual business website domain
      let website = '';
      try {
        const websiteUrl = new URL(businessProfile.website);
        website = websiteUrl.hostname.replace(/^www\./, '');
      } catch (error) {
        console.error('Failed to parse business website URL:', error);
        return {
          rankedKeywords: [],
          competitiveOpportunityKeywords: [],
          locationData: { city, state, cuisine }
        };
      }

      // Prepare restaurant data for local SEO analysis
      const restaurantData = {
        name: businessProfile.name,
        website: website,
        city: city,
        state: state,
        cuisine: cuisine
      };

      console.log(`🏆 Getting best performing keywords (ranks 1-20) for ${website}...`);
      const bestKeywords = await this.getBestPerformingKeywords(restaurantData);
      
      console.log(`🚀 Getting opportunity keywords (ranks 21+) for ${website}...`);
      const opportunityKeywords = await this.getOpportunityKeywords(restaurantData);

      // Format results for frontend compatibility
      const rankedKeywords = this.formatKeywordResults(bestKeywords, 'best');
      const competitiveOpportunityKeywords = this.formatKeywordResults(opportunityKeywords, 'opportunity');

      console.log(`✅ Found ${rankedKeywords.length} ranked keywords and ${competitiveOpportunityKeywords.length} competitive opportunities`);

      return {
        rankedKeywords,
        competitiveOpportunityKeywords,
        locationData: { city, state, cuisine }
      };

    } catch (error) {
      console.error('Error in getDynamicKeywordRankings:', error);
      return {
        rankedKeywords: [],
        competitiveOpportunityKeywords: [],
        locationData: { city: 'Unknown', state: 'Unknown', cuisine: 'restaurant' }
      };
    }
  }

  /**
   * Format keyword results for frontend display
   */
  private formatKeywordResults(results: any[], type: string = 'best'): KeywordResult[] {
    if (!results || results.length === 0) {
      return [];
    }

    return results.map(item => ({
      keyword: item.keyword_data.keyword,
      position: item.ranked_serp_element.serp_item.rank_absolute,
      searchVolume: item.keyword_data.keyword_info.search_volume,
      difficulty: this.calculateDifficulty(item.keyword_data.keyword_info.competition_level),
      intent: item.keyword_data.search_intent_info?.main_intent || 'local',
      cpc: item.keyword_data.keyword_info.cpc || 0,
      competition: item.keyword_data.keyword_info.competition_level,
      opportunity: type === 'opportunity' ? (item.ranked_serp_element.serp_item.rank_absolute > 20 ? 25 : 50) : 90,
      url: item.ranked_serp_element.serp_item.url,
      title: item.ranked_serp_element.serp_item.title || '',
      description: item.ranked_serp_element.serp_item.description || '',
      isNew: false,
      isLost: false,
      positionChange: 0,
      previousPosition: item.ranked_serp_element.serp_item.rank_absolute
    }));
  }

  /**
   * Calculate difficulty score from competition level
   */
  private calculateDifficulty(competitionLevel: string): number {
    const difficultyMap: { [key: string]: number } = {
      'low': 25,
      'medium': 50,
      'high': 75
    };
    return difficultyMap[competitionLevel?.toLowerCase()] || 50;
  }
}

export default DynamicKeywordService;