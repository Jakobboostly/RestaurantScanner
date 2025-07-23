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
    
    // Check Google Places types first
    for (let type of googlePlacesTypes) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
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
   * Call DataForSEO ranked keywords API with dynamic filters
   */
  private async callDataForSeoAPI(website: string, city: string, cuisine: string, state: string): Promise<any> {
    const cleanedWebsite = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Strategy 1: Cuisine-specific search
    const cuisineCall = {
      "target": cleanedWebsite,
      "language_code": "en",
      "location_name": state,
      "limit": 30,
      "order_by": ["keyword_data.keyword_info.search_volume,desc"],
      "filters": [
        ["keyword_data.keyword", "like", `%${cuisine}%`],
        "and",
        ["keyword_data.keyword", "like", `%${city.toLowerCase()}%`],
        "and", 
        ["keyword_data.keyword_info.search_volume", ">", 100]
      ]
    };

    try {
      const response = await axios.post(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live',
        [cuisineCall],
        {
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data?.tasks?.[0]?.result?.[0]?.items) {
        return response.data.tasks[0].result[0].items;
      }

      // Strategy 2: Generic restaurant search (fallback)
      const genericCall = {
        "target": cleanedWebsite,
        "language_code": "en", 
        "location_name": state,
        "limit": 50,
        "order_by": ["keyword_data.keyword_info.search_volume,desc"],
        "filters": [
          [
            ["keyword_data.keyword", "like", "%restaurant%"],
            "or",
            ["keyword_data.keyword", "like", "%food%"],
            "or", 
            ["keyword_data.keyword", "like", "%dining%"]
          ],
          "and",
          ["keyword_data.keyword", "like", `%${city.toLowerCase()}%`],
          "and",
          ["keyword_data.keyword_info.search_volume", ">", 50]
        ]
      };

      const fallbackResponse = await axios.post(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live',
        [genericCall],
        {
          headers: {
            'Authorization': `Basic ${this.authHeader}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return fallbackResponse.data?.tasks?.[0]?.result?.[0]?.items || [];

    } catch (error) {
      console.log('DataForSEO API error:', error);
      return [];
    }
  }

  /**
   * Process API results into structured keyword data
   */
  private processKeywordResults(apiResults: any[]): { rankedKeywords: KeywordResult[], competitiveOpportunityKeywords: KeywordResult[] } {
    const rankedKeywords: KeywordResult[] = [];
    const competitiveOpportunityKeywords: KeywordResult[] = [];

    for (const item of apiResults.slice(0, 10)) { // Limit to 10 keywords for cost control
      const keywordData = {
        keyword: item.keyword_data?.keyword || '',
        position: item.ranked_serp_element?.serp_item?.rank_group || 0,
        searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
        difficulty: item.keyword_data?.keyword_info?.competition || 0,
        intent: this.classifyIntent(item.keyword_data?.keyword || ''),
        cpc: item.keyword_data?.keyword_info?.cpc || 0,
        competition: item.keyword_data?.keyword_info?.competition || 0,
        opportunity: this.calculateOpportunity(item.ranked_serp_element?.serp_item?.rank_group || 0),
        url: item.ranked_serp_element?.serp_item?.url || '',
        title: item.ranked_serp_element?.serp_item?.title || '',
        description: item.ranked_serp_element?.serp_item?.description || '',
        isNew: false,
        isLost: false,
        positionChange: 0,
        previousPosition: item.ranked_serp_element?.serp_item?.rank_group || 0
      };

      // Categorize by ranking position
      if (keywordData.position <= 5) {
        rankedKeywords.push(keywordData);
      } else if (keywordData.position >= 6) {
        competitiveOpportunityKeywords.push(keywordData);
      }
    }

    return { rankedKeywords, competitiveOpportunityKeywords };
  }

  /**
   * Classify search intent
   */
  private classifyIntent(keyword: string): string {
    const local = ['near me', 'delivery', 'takeout', 'hours', 'location'];
    const commercial = ['best', 'top', 'reviews', 'menu', 'order'];
    
    for (const term of local) {
      if (keyword.toLowerCase().includes(term)) return 'local';
    }
    
    for (const term of commercial) {
      if (keyword.toLowerCase().includes(term)) return 'commercial';
    }
    
    return 'informational';
  }

  /**
   * Calculate opportunity score based on ranking position
   */
  private calculateOpportunity(position: number): number {
    if (position === 0) return 0;
    if (position <= 3) return 90;
    if (position <= 5) return 75;
    if (position <= 10) return 50;
    if (position <= 20) return 25;
    return 10;
  }

  /**
   * Main method to get dynamic keyword rankings for a restaurant
   */
  async getDynamicKeywordRankings(businessProfile: GoogleBusinessProfile): Promise<DynamicKeywordResponse> {
    try {
      // Extract location and cuisine data
      const { city, state } = this.extractLocationData(businessProfile.formatted_address);
      const cuisine = this.extractCuisine(businessProfile.types, businessProfile.name);

      console.log(`🔍 Dynamic keyword analysis for ${businessProfile.name} - ${cuisine} in ${city}, ${state}`);

      if (!businessProfile.website) {
        console.log('No website found for keyword analysis');
        return {
          rankedKeywords: [],
          competitiveOpportunityKeywords: [],
          locationData: { city, state, cuisine }
        };
      }

      // Call DataForSEO API with dynamic parameters
      const apiResults = await this.callDataForSeoAPI(businessProfile.website, city, cuisine, state);
      
      // Process results
      const { rankedKeywords, competitiveOpportunityKeywords } = this.processKeywordResults(apiResults);

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
}

export default DynamicKeywordService;