/**
 * DataForSEO Ranked Keywords Service
 * 
 * Provides authentic keyword ranking data for restaurant domains
 * Shows actual keywords where the site appears in Google search results
 */

import axios, { AxiosInstance } from 'axios';

interface RankedKeyword {
  keyword: string;
  location_code: number;
  language_code: string;
  search_engine: string;
  device: string;
  se_type: string;
  position: number;
  url: string;
  title: string;
  description: string;
  search_volume: number;
  competition: number;
  cpc: number;
  high_top_of_page_bid: number;
  low_top_of_page_bid: number;
  keyword_difficulty: number;
  is_lost: boolean;
  is_new: boolean;
  is_up: boolean;
  is_down: boolean;
  position_change: number;
  previous_position: number;
  estimated_paid_traffic_cost: number;
  estimated_paid_traffic_volume: number;
  impressions: number;
  clickthrough_rate: number;
  average_bid: number;
  bid_range_average: number;
  bid_range_high: number;
  bid_range_low: number;
}

interface DataForSeoRankedKeywordsResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    result: Array<{
      se_type: string;
      location_code: number;
      language_code: string;
      total_count: number;
      items_count: number;
      items: any[];
    }>;
  }>;
}

export interface ProcessedKeyword {
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  url: string;
  title: string;
  description: string;
  isNew: boolean;
  isLost: boolean;
  positionChange: number;
  previousPosition: number;
  impressions: number;
  clickthroughRate: number;
  intent: 'local' | 'commercial' | 'informational' | 'navigational';
}

export class DataForSeoRankedKeywordsService {
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
   * Get competitive opportunity keywords (ranking positions 6+)
   * These are keywords where the restaurant ranks but not in top 5 - optimization opportunities
   */
  async getCompetitiveOpportunityKeywords(
    domain: string, 
    locationName: string = 'United States',
    languageCode: string = 'en',
    limit: number = 5
  ): Promise<ProcessedKeyword[]> {
    try {
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Getting opportunity keywords (rank 6+) for domain: ${domain}`);
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Request parameters:`, {
        target: domain,
        location_name: locationName,
        language_code: languageCode,
        filters: [["ranked_serp_element.serp_item.rank_group", ">", 5]],
        order_by: ["ranked_serp_element.serp_item.rank_group,asc"],
        limit: limit
      });
      
      const response = await this.client.post<DataForSeoRankedKeywordsResponse>(
        '/dataforseo_labs/google/ranked_keywords/live',
        [{
          target: domain,
          location_name: locationName,
          language_code: languageCode,
          filters: [["ranked_serp_element.serp_item.rank_group", ">", 5]],
          order_by: ["ranked_serp_element.serp_item.rank_group,asc"],
          limit: limit
        }]
      );

      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Response status_code: ${response.data.status_code}`);
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Response status_message: ${response.data.status_message}`);

      if (response.data.status_code !== 20000) {
        console.error(`🔍 COMPETITIVE OPPORTUNITIES API: Error - ${response.data.status_message}`);
        throw new Error(`DataForSEO API error: ${response.data.status_message}`);
      }

      const task = response.data.tasks[0];
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Task status_code: ${task?.status_code}`);
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Task status_message: ${task?.status_message}`);
      
      if (!task || task.status_code !== 20000) {
        console.error(`🔍 COMPETITIVE OPPORTUNITIES API: Task failed - ${task?.status_message || 'Unknown error'}`);
        throw new Error(`Task failed: ${task?.status_message || 'Unknown error'}`);
      }

      const result = task.result && task.result[0];
      if (!result || !result.items) {
        console.log(`🔍 COMPETITIVE OPPORTUNITIES API: No opportunity keywords found for domain: ${domain}`);
        return [];
      }

      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Total count: ${result.total_count}`);
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Items count: ${result.items_count}`);
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Requested limit: ${limit}`);

      const keywords = result.items.map((item: any) => this.processKeywordFromAPI(item));
      
      // Filter for restaurant-relevant keywords only (strict filtering for actionable keywords)
      const relevantKeywords = keywords.filter(keyword => {
        const kw = keyword.keyword.toLowerCase();
        
        // EXCLUDE any location-specific keywords (cities, neighborhoods, states)
        const locationTerms = [
          // Major cities
          'nyc', 'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington', 'boston', 'nashville', 'baltimore', 'oklahoma city', 'louisville', 'portland', 'las vegas', 'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'mesa', 'kansas city', 'atlanta', 'omaha', 'colorado springs', 'raleigh', 'miami', 'virginia beach', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans', 'wichita', 'cleveland', 'bakersfield', 'aurora', 'anaheim', 'honolulu', 'santa ana', 'riverside', 'corpus christi', 'lexington', 'stockton', 'henderson', 'saint paul', 'st paul', 'cincinnati', 'pittsburgh',
          // Utah specific locations that aren't useful for competitive analysis
          'utah', 'salt lake', 'provo', 'ogden', 'west valley', 'sandy', 'orem', 'west jordan', 'layton', 'taylorsville', 'murray', 'draper', 'bountiful', 'riverton', 'roy', 'spanish fork', 'pleasant grove', 'lehi', 'american fork', 'payson', 'springville', 'cedar city', 'st george', 'logan', 'tooele', 'park city', 'magna', 'kearns', 'millcreek', 'cottonwood heights', 'midvale', 'holladay', 'south jordan', 'herriman', 'eagle mountain', 'saratoga springs', 'vineyard', 'bluffdale', 'south salt lake', 'north salt lake', 'woods cross', 'clearfield', 'kaysville', 'farmington', 'centerville', 'clinton', 'sunset', 'north ogden', 'pleasant view', 'harrisville', 'washington terrace', 'south ogden', 'riverdale', 'syracuse', 'clearfield', 'west point', 'clinton', 'sunset', 'brigham city', 'tremonton', 'garland', 'corinne', 'willard', 'perry', 'honeyville', 'bear river city', 'mantua', 'paradise', 'hyrum', 'nibley', 'north logan', 'smithfield', 'richmond', 'lewiston', 'cornish', 'trenton', 'clarkston', 'newton', 'amalga', 'river heights', 'millville', 'providence', 'mendon', 'wellsville', 'cache', 'nob hill', 'downtown', 'midtown', 'uptown', 'eastside', 'westside', 'north', 'south', 'east', 'west'
        ];
        const hasLocation = locationTerms.some(location => kw.includes(location));
        
        // ONLY include keywords that don't have location terms
        const isNearMe = kw.includes('near me');
        const isDeliveryKeyword = kw.includes('delivery') && !hasLocation;
        const isTakeoutKeyword = kw.includes('takeout') && !hasLocation;
        const isCateringKeyword = kw.includes('catering') && !hasLocation;
        const isMenuKeyword = kw.includes('menu') && !hasLocation;
        const isOrderKeyword = kw.includes('order') && !hasLocation;
        const isHoursKeyword = kw.includes('hours') && !hasLocation;
        const isLocationsKeyword = kw.includes('locations') && !hasLocation;
        
        // Brand + service keywords without location (these are useful for competitive analysis)
        const hasBrandServiceKeyword = (kw.includes('pizza') || kw.includes('burger') || kw.includes('chicken') || kw.includes('mexican') || kw.includes('italian') || kw.includes('chinese') || kw.includes('sushi') || kw.includes('thai') || kw.includes('indian') || kw.includes('mediterranean')) && !hasLocation;
        
        // Allow branded keywords as long as they don't contain location terms
        const isBrandedKeyword = !hasLocation && (kw.includes('pizza') || kw.includes('burger') || kw.includes('restaurant') || kw.includes('food') || kw.includes('menu') || kw.includes('delivery') || kw.includes('takeout') || kw.includes('catering') || kw.includes('order') || kw.includes('hours') || kw.includes('locations'));
        
        return (isNearMe || isDeliveryKeyword || isTakeoutKeyword || isCateringKeyword || isMenuKeyword || isOrderKeyword || isHoursKeyword || isLocationsKeyword || hasBrandServiceKeyword || isBrandedKeyword) && !hasLocation;
      });
      
      // Apply the requested limit to the filtered keywords
      const limitedKeywords = relevantKeywords.slice(0, limit);
      
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Found ${keywords.length} total keywords, ${relevantKeywords.length} relevant, returning ${limitedKeywords.length} (limit: ${limit}) for ${domain}`);
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Sample relevant keyword:`, limitedKeywords[0] || 'No relevant keywords');
      return limitedKeywords;

    } catch (error) {
      console.error('🔍 COMPETITIVE OPPORTUNITIES API: Error fetching opportunity keywords:', error);
      if (axios.isAxiosError(error)) {
        console.error('🔍 COMPETITIVE OPPORTUNITIES API: Response data:', error.response?.data);
        console.error('🔍 COMPETITIVE OPPORTUNITIES API: Response status:', error.response?.status);
      }
      return [];
    }
  }

  /**
   * Get ranked keywords for a restaurant domain
   */
  async getRankedKeywords(
    domain: string, 
    locationName: string = 'United States',
    languageCode: string = 'en',
    limit: number = 10
  ): Promise<ProcessedKeyword[]> {
    try {
      console.log(`🔍 RANKED KEYWORDS API: Getting ranked keywords for domain: ${domain}`);
      console.log(`🔍 RANKED KEYWORDS API: Request parameters:`, {
        target: domain,
        location_name: locationName,
        language_code: languageCode,
        limit: limit
      });
      
      const response = await this.client.post<DataForSeoRankedKeywordsResponse>(
        '/dataforseo_labs/google/ranked_keywords/live',
        [{
          target: domain,
          location_name: locationName,
          language_code: languageCode,
          limit: limit
        }]
      );

      console.log(`🔍 RANKED KEYWORDS API: Response status_code: ${response.data.status_code}`);
      console.log(`🔍 RANKED KEYWORDS API: Response status_message: ${response.data.status_message}`);

      if (response.data.status_code !== 20000) {
        console.error(`🔍 RANKED KEYWORDS API: Error - ${response.data.status_message}`);
        throw new Error(`DataForSEO API error: ${response.data.status_message}`);
      }

      const task = response.data.tasks[0];
      console.log(`🔍 RANKED KEYWORDS API: Task status_code: ${task?.status_code}`);
      console.log(`🔍 RANKED KEYWORDS API: Task status_message: ${task?.status_message}`);
      
      if (!task || task.status_code !== 20000) {
        console.error(`🔍 RANKED KEYWORDS API: Task failed - ${task?.status_message || 'Unknown error'}`);
        throw new Error(`Task failed: ${task?.status_message || 'Unknown error'}`);
      }

      // The data structure is task.result[0].items, not task.data.items
      const result = task.result && task.result[0];
      if (!result || !result.items) {
        console.log(`🔍 RANKED KEYWORDS API: No result or items found for domain: ${domain}`);
        console.log(`🔍 RANKED KEYWORDS API: Task result exists: ${!!task.result}`);
        console.log(`🔍 RANKED KEYWORDS API: Result[0] exists: ${!!result}`);
        console.log(`🔍 RANKED KEYWORDS API: Items exists: ${!!result?.items}`);
        console.log(`🔍 RANKED KEYWORDS API: Items length: ${result?.items?.length || 0}`);
        return [];
      }

      console.log(`🔍 RANKED KEYWORDS API: Total count: ${result.total_count}`);
      console.log(`🔍 RANKED KEYWORDS API: Items count: ${result.items_count}`);
      console.log(`🔍 RANKED KEYWORDS API: Requested limit: ${limit}`);

      const keywords = result.items.map((item: any) => this.processKeywordFromAPI(item));
      
      // Apply the requested limit to the returned keywords
      const limitedKeywords = keywords.slice(0, limit);
      
      console.log(`🔍 RANKED KEYWORDS API: Found ${keywords.length} ranked keywords, returning ${limitedKeywords.length} (limit: ${limit}) for ${domain}`);
      console.log(`🔍 RANKED KEYWORDS API: Sample keyword:`, limitedKeywords[0] || 'No keywords');
      return limitedKeywords;

    } catch (error) {
      console.error('🔍 RANKED KEYWORDS API: Error fetching ranked keywords:', error);
      if (axios.isAxiosError(error)) {
        console.error('🔍 RANKED KEYWORDS API: Response data:', error.response?.data);
        console.error('🔍 RANKED KEYWORDS API: Response status:', error.response?.status);
        console.error('🔍 RANKED KEYWORDS API: Response headers:', error.response?.headers);
      }
      return [];
    }
  }

  /**
   * Process raw keyword data from API response into structured format
   */
  private processKeywordFromAPI(item: any): ProcessedKeyword {
    const keywordData = item.keyword_data;
    const keywordInfo = keywordData?.keyword_info || {};
    const serpElement = item.ranked_serp_element || {};
    const serpItem = serpElement.serp_item || {};
    
    // Extract ranking position from the correct location in the API response
    const position = serpItem.rank_absolute || serpItem.rank_group || 0;
    const previousPosition = serpItem.rank_changes?.previous_rank_absolute || 0;
    const positionChange = previousPosition > 0 ? (previousPosition - position) : 0;
    
    return {
      keyword: keywordData?.keyword || '',
      position: position,
      searchVolume: keywordInfo.search_volume || 0,
      difficulty: serpElement.keyword_difficulty || keywordInfo.keyword_difficulty || 0,
      cpc: keywordInfo.cpc || 0,
      competition: keywordInfo.competition || 0,
      url: serpItem.url || '',
      title: serpItem.title || '',
      description: serpItem.description || '',
      isNew: serpItem.rank_changes?.is_new || false,
      isLost: serpElement.is_lost || false,
      positionChange: positionChange,
      previousPosition: previousPosition,
      impressions: serpItem.impressions || 0,
      clickthroughRate: serpItem.clickthrough_rate || 0,
      intent: this.classifyKeywordIntent(keywordData?.keyword || '')
    };
  }

  /**
   * Process raw keyword data into structured format (legacy method kept for compatibility)
   */
  private processKeyword(item: RankedKeyword): ProcessedKeyword {
    return {
      keyword: item.keyword,
      position: item.position,
      searchVolume: item.search_volume || 0,
      difficulty: item.keyword_difficulty || 0,
      cpc: item.cpc || 0,
      competition: item.competition || 0,
      url: item.url || '',
      title: item.title || '',
      description: item.description || '',
      isNew: item.is_new || false,
      isLost: item.is_lost || false,
      positionChange: item.position_change || 0,
      previousPosition: item.previous_position || 0,
      impressions: item.impressions || 0,
      clickthroughRate: item.clickthrough_rate || 0,
      intent: this.classifyKeywordIntent(item.keyword)
    };
  }

  /**
   * Classify keyword intent based on content
   */
  private classifyKeywordIntent(keyword: string): 'local' | 'commercial' | 'informational' | 'navigational' {
    const lowerKeyword = keyword.toLowerCase();
    
    // Local intent patterns
    if (lowerKeyword.includes('near me') || 
        lowerKeyword.includes('near') || 
        lowerKeyword.includes('in ') ||
        lowerKeyword.match(/\b(restaurant|cafe|bar|pub|grill|bistro|diner)\b/)) {
      return 'local';
    }
    
    // Commercial intent patterns
    if (lowerKeyword.includes('order') || 
        lowerKeyword.includes('delivery') || 
        lowerKeyword.includes('takeout') ||
        lowerKeyword.includes('menu') ||
        lowerKeyword.includes('price') ||
        lowerKeyword.includes('book') ||
        lowerKeyword.includes('reservation')) {
      return 'commercial';
    }
    
    // Informational intent patterns
    if (lowerKeyword.includes('how') || 
        lowerKeyword.includes('what') || 
        lowerKeyword.includes('why') ||
        lowerKeyword.includes('when') ||
        lowerKeyword.includes('recipe') ||
        lowerKeyword.includes('hours') ||
        lowerKeyword.includes('review')) {
      return 'informational';
    }
    
    // Navigational intent (brand names, specific business names)
    return 'navigational';
  }

  /**
   * Get keyword performance metrics
   */
  getKeywordMetrics(keywords: ProcessedKeyword[]): {
    totalKeywords: number;
    topPositions: number; // Position 1-3
    firstPage: number; // Position 1-10
    averagePosition: number;
    totalSearchVolume: number;
    newKeywords: number;
    lostKeywords: number;
    improvedPositions: number;
    declinedPositions: number;
  } {
    if (keywords.length === 0) {
      return {
        totalKeywords: 0,
        topPositions: 0,
        firstPage: 0,
        averagePosition: 0,
        totalSearchVolume: 0,
        newKeywords: 0,
        lostKeywords: 0,
        improvedPositions: 0,
        declinedPositions: 0
      };
    }

    const topPositions = keywords.filter(k => k.position >= 1 && k.position <= 3).length;
    const firstPage = keywords.filter(k => k.position >= 1 && k.position <= 10).length;
    const averagePosition = keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length;
    const totalSearchVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);
    const newKeywords = keywords.filter(k => k.isNew).length;
    const lostKeywords = keywords.filter(k => k.isLost).length;
    const improvedPositions = keywords.filter(k => k.positionChange > 0).length;
    const declinedPositions = keywords.filter(k => k.positionChange < 0).length;

    return {
      totalKeywords: keywords.length,
      topPositions,
      firstPage,
      averagePosition: Math.round(averagePosition * 10) / 10,
      totalSearchVolume,
      newKeywords,
      lostKeywords,
      improvedPositions,
      declinedPositions
    };
  }

  /**
   * Filter keywords by intent type
   */
  filterKeywordsByIntent(keywords: ProcessedKeyword[], intent: string): ProcessedKeyword[] {
    return keywords.filter(k => k.intent === intent);
  }

  /**
   * Get top performing keywords (by position and search volume)
   */
  getTopKeywords(keywords: ProcessedKeyword[], limit: number = 10): ProcessedKeyword[] {
    return keywords
      .filter(k => k.position <= 20) // Only keywords ranking in top 20
      .sort((a, b) => {
        // Sort by position first (lower is better), then by search volume (higher is better)
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        return b.searchVolume - a.searchVolume;
      })
      .slice(0, limit);
  }
}