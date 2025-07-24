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
  url?: string;
  title?: string;
  description?: string;
  isNew?: boolean;
  isLost?: boolean;
  positionChange?: number;
  previousPosition?: number;
  impressions?: number;
  clickthroughRate?: number;
  intent?: 'local' | 'commercial' | 'informational' | 'navigational';
  opportunityScore?: number;
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
      
      // Apply the requested limit to the returned keywords
      const limitedKeywords = keywords.slice(0, limit);
      
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Found ${keywords.length} opportunity keywords, returning ${limitedKeywords.length} (limit: ${limit}) for ${domain}`);
      console.log(`🔍 COMPETITIVE OPPORTUNITIES API: Sample opportunity keyword:`, limitedKeywords[0] || 'No keywords');
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
    const improvedPositions = keywords.filter(k => k.positionChange && k.positionChange > 0).length;
    const declinedPositions = keywords.filter(k => k.positionChange && k.positionChange < 0).length;

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

  /**
   * Get targeted competitive keywords for restaurant based on cuisine, city, and state
   * Returns 8 specific keywords with their rankings and search data
   */
  async getTargetedCompetitiveKeywords(
    domain: string,
    cuisine: string,
    city: string,
    state: string,
    locationName: string = 'United States',
    languageCode: string = 'en'
  ): Promise<ProcessedKeyword[]> {
    try {
      console.log(`🔍 TARGETED COMPETITIVE KEYWORDS: Getting 8 specific keywords for ${domain}`);
      console.log(`🔍 Parameters: cuisine="${cuisine}", city="${city}", state="${state}"`);

      // Step 1: Generate the 8 specific keywords
      const targetKeywords = [
        `${cuisine} near me`,
        `${cuisine} delivery ${city}`,
        `best ${cuisine} ${city}`,
        `${city} ${cuisine}`,
        `${cuisine} places near me`,
        `${cuisine} ${city} ${state}`,
        `${cuisine} delivery near me`,
        `${cuisine} open now`
      ];

      console.log(`🔍 Target keywords:`, targetKeywords);

      // Step 2: Get search volume and difficulty for these keywords
      const keywordResponse = await this.client.post('/dataforseo_labs/google/keyword_overview/live', [{
        keywords: targetKeywords,
        location_name: locationName,
        language_code: languageCode
      }]);

      console.log(`🔍 Keyword overview API response status: ${keywordResponse.data.status_code}`);

      if (keywordResponse.data.status_code !== 20000) {
        console.error(`🔍 Keyword overview API error: ${keywordResponse.data.status_message}`);
        throw new Error(`Keyword overview API error: ${keywordResponse.data.status_message}`);
      }

      const keywordData = keywordResponse.data.tasks[0]?.result?.[0]?.items || [];
      console.log(`🔍 Got keyword data for ${keywordData.length} keywords`);

      // Step 3: Check rankings for each keyword
      const results: ProcessedKeyword[] = [];
      
      for (let i = 0; i < targetKeywords.length; i++) {
        const keyword = targetKeywords[i];
        const volumeData = keywordData[i];
        
        try {
          console.log(`🔍 Checking SERP rankings for: "${keyword}"`);
          
          // Check where domain ranks for this specific keyword
          const serpResponse = await this.client.post('/serp/google/organic/live/advanced', [{
            keyword: keyword,
            location_name: locationName,
            language_code: languageCode,
            depth: 50
          }]);

          console.log(`🔍 SERP API response status for "${keyword}": ${serpResponse.data.status_code}`);

          if (serpResponse.data.status_code !== 20000) {
            console.error(`🔍 SERP API error for "${keyword}": ${serpResponse.data.status_message}`);
            continue;
          }

          const serpItems = serpResponse.data.tasks[0]?.result?.[0]?.items || [];
          let position = 0;
          let url = '';
          let title = '';
          let description = '';
          
          // Find domain position in search results
          for (let j = 0; j < serpItems.length; j++) {
            const item = serpItems[j];
            if (item.type === 'organic' && 
                (item.domain?.includes(domain.replace(/^https?:\/\//, '').replace(/^www\./, '')) || 
                 item.url?.includes(domain.replace(/^https?:\/\//, '').replace(/^www\./, '')))) {
              position = item.rank_absolute || (j + 1);
              url = item.url || '';
              title = item.title || '';
              description = item.description || '';
              break;
            }
          }

          console.log(`🔍 Found position ${position} for "${keyword}"`);

          // Only include if ranking in positions 6+ (competitors beating you)
          if (position > 5) {
            const searchVolume = volumeData?.keyword_info?.search_volume || 0;
            const difficulty = volumeData?.keyword_info?.keyword_difficulty || 0;
            const cpc = volumeData?.keyword_info?.cpc || 0;
            const competition = volumeData?.keyword_info?.competition || 0;

            results.push({
              keyword: keyword,
              position: position,
              searchVolume: searchVolume,
              difficulty: difficulty,
              cpc: cpc,
              competition: competition,
              url: url,
              title: title,
              description: description,
              // Calculate opportunity score
              opportunityScore: this.calculateOpportunityScore(position, searchVolume),
              intent: this.classifyKeywordIntent(keyword)
            });

            console.log(`🔍 Added competitive keyword: "${keyword}" at position ${position} with opportunity score ${this.calculateOpportunityScore(position, searchVolume)}`);
          } else if (position > 0) {
            console.log(`🔍 Skipping "${keyword}" - already ranking well at position ${position}`);
          } else {
            console.log(`🔍 Skipping "${keyword}" - not found in top 50 results`);
          }

        } catch (error) {
          console.error(`🔍 Error checking keyword "${keyword}":`, error);
        }
      }

      // Sort by opportunity score (high volume + close to top 5 = best opportunity)
      const sortedResults = results
        .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
        .slice(0, 8);

      console.log(`🔍 TARGETED COMPETITIVE KEYWORDS: Found ${sortedResults.length} competitive opportunities for ${domain}`);
      console.log(`🔍 Results:`, sortedResults.map(r => `${r.keyword} (pos: ${r.position}, vol: ${r.searchVolume})`));

      return sortedResults;

    } catch (error) {
      console.error('🔍 TARGETED COMPETITIVE KEYWORDS: Error:', error);
      return [];
    }
  }

  /**
   * Calculate opportunity score for targeted competitive keywords
   */
  private calculateOpportunityScore(position: number, searchVolume: number): number {
    // Higher score = better opportunity
    // Closer to position 6 + higher volume = higher score
    const positionScore = Math.max(0, 20 - position); // Position 6 gets 14 points, position 15 gets 5 points
    const volumeScore = Math.log10(searchVolume + 1) * 5; // Logarithmic scale for volume
    return Math.round((positionScore + volumeScore) * 10) / 10;
  }
}