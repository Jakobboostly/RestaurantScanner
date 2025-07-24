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
   * Get targeted competitive keywords for restaurants
   * Checks specific restaurant-relevant keywords to see where competitors are beating you
   */
  async getTargetedCompetitiveKeywords(
    domain: string,
    cuisine: string,
    city: string,
    state: string,
    locationName: string = 'United States',
    languageCode: string = 'en'
  ): Promise<ProcessedKeyword[]> {

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

    try {
      console.log(`🔍 TARGETED COMPETITIVE KEYWORDS: Checking ${targetKeywords.length} keywords for ${domain}`);
      console.log(`🔍 Keywords:`, targetKeywords);

      // Step 2: Get search volume and difficulty for these keywords
      const keywordData = await this.client.post('/dataforseo_labs/google/keyword_overview/live', [{
        keywords: targetKeywords,
        location_name: locationName,
        language_code: languageCode
      }]);

      if (keywordData.data.status_code !== 20000) {
        throw new Error(`Keyword overview API error: ${keywordData.data.status_message}`);
      }

      const volumeResults = keywordData.data.tasks[0]?.result?.[0]?.items || [];
      console.log(`🔍 Got volume data for ${volumeResults.length} keywords`);

      // Step 3: Check rankings for each keyword
      const results: ProcessedKeyword[] = [];
      
      for (let i = 0; i < targetKeywords.length; i++) {
        const keyword = targetKeywords[i];
        const volumeData = volumeResults[i];
        
        try {
          // Check where domain ranks for this specific keyword
          const serpResponse = await this.client.post('/serp/google/organic/live/advanced', [{
            keyword: keyword,
            location_name: locationName,
            language_code: languageCode,
            depth: 50
          }]);

          if (serpResponse.data.status_code !== 20000) {
            console.error(`SERP API error for keyword "${keyword}": ${serpResponse.data.status_message}`);
            continue;
          }

          const serpItems = serpResponse.data.tasks[0]?.result?.[0]?.items || [];
          let position = 0;
          
          // Find domain position
          for (let j = 0; j < serpItems.length; j++) {
            const item = serpItems[j];
            if (item.type === 'organic' && 
                (item.domain?.includes(domain) || item.url?.includes(domain))) {
              position = item.rank_absolute || (j + 1);
              break;
            }
          }

          // Only include if ranking in positions 6+ (competitors beating you)
          if (position > 5) {
            results.push({
              keyword: keyword,
              position: position,
              searchVolume: volumeData?.keyword_info?.search_volume || 0,
              difficulty: volumeData?.keyword_info?.keyword_difficulty || 0,
              cpc: volumeData?.keyword_info?.cpc || 0,
              competition: volumeData?.keyword_info?.competition || 0,
              // Calculate opportunity score
              opportunityScore: this.calculateOpportunityScore(position, volumeData?.keyword_info?.search_volume || 0)
            });
          }

        } catch (error) {
          console.error(`Error checking keyword "${keyword}":`, error);
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
    return positionScore + volumeScore;
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

      const result = task.result && task.result[0];
      if (!result || !result.items) {
        console.log(`🔍 RANKED KEYWORDS API: No ranked keywords found for domain: ${domain}`);
        return [];
      }

      console.log(`🔍 RANKED KEYWORDS API: Total count: ${result.total_count}`);
      console.log(`🔍 RANKED KEYWORDS API: Items count: ${result.items_count}`);
      console.log(`🔍 RANKED KEYWORDS API: Requested limit: ${limit}`);

      const keywords = result.items.map((item: any) => this.processKeywordFromAPI(item));
      
      // Apply the requested limit to the returned keywords
      const limitedKeywords = keywords.slice(0, limit);
      
      console.log(`🔍 RANKED KEYWORDS API: Found ${keywords.length} ranked keywords, returning ${limitedKeywords.length} (limit: ${limit}) for ${domain}`);
      console.log(`🔍 RANKED KEYWORDS API: Sample ranked keyword:`, limitedKeywords[0] || 'No keywords');
      return limitedKeywords;

    } catch (error) {
      console.error('🔍 RANKED KEYWORDS API: Error fetching ranked keywords:', error);
      if (axios.isAxiosError(error)) {
        console.error('🔍 RANKED KEYWORDS API: Response data:', error.response?.data);
        console.error('🔍 RANKED KEYWORDS API: Response status:', error.response?.status);
      }
      return [];
    }
  }

  /**
   * Process a keyword item from the DataForSEO API into our standard format
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
      isNew: serpItem.is_new || false,
      isLost: serpItem.is_lost || false,
      positionChange: positionChange,
      previousPosition: previousPosition,
      impressions: keywordInfo.impressions || 0,
      clickthroughRate: keywordInfo.clickthrough_rate || 0,
      intent: this.classifyKeywordIntent(keywordData?.keyword || '')
    };
  }

  /**
   * Classify keyword intent based on keyword content
   */
  private classifyKeywordIntent(keyword: string): 'local' | 'commercial' | 'informational' | 'navigational' {
    const lowerKeyword = keyword.toLowerCase();
    
    // Local intent indicators
    if (lowerKeyword.includes('near me') || lowerKeyword.includes('nearby') || 
        lowerKeyword.includes('local') || /\b(in|at)\s+[A-Z]/.test(keyword)) {
      return 'local';
    }
    
    // Commercial intent indicators
    if (lowerKeyword.includes('buy') || lowerKeyword.includes('order') || 
        lowerKeyword.includes('delivery') || lowerKeyword.includes('menu') ||
        lowerKeyword.includes('price') || lowerKeyword.includes('book') ||
        lowerKeyword.includes('reserve')) {
      return 'commercial';
    }
    
    // Navigational intent indicators
    if (lowerKeyword.includes('website') || lowerKeyword.includes('contact') ||
        lowerKeyword.includes('location') || lowerKeyword.includes('hours')) {
      return 'navigational';
    }
    
    // Default to informational
    return 'informational';
  }

  /**
   * Get keyword performance summary statistics
   */
  getKeywordStats(keywords: ProcessedKeyword[]): any {
    const totalKeywords = keywords.length;
    const topPositions = keywords.filter(k => k.position <= 3).length;
    const firstPage = keywords.filter(k => k.position <= 10).length;
    const averagePosition = keywords.length > 0 ? 
      keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length : 0;
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
}