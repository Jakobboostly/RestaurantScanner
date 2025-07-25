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
   * Get local competitive keywords using Local Finder API for more accurate restaurant rankings
   * Returns ALL 8 targeted keywords with their local pack positions
   */
  async getLocalCompetitiveKeywords(
    businessName: string,
    cuisine: string,
    city: string,
    state: string,
    locationName: string = 'United States',
    languageCode: string = 'en'
  ): Promise<ProcessedKeyword[]> {

    // Generate the 8 local keyword patterns
    const localKeywordPatterns = [
      `${cuisine} near me`,
      `${cuisine} delivery ${city}`,
      `best ${cuisine} ${city}`,
      `${city} ${cuisine}`,
      `${cuisine} places near me`,
      `${cuisine} ${city} ${state}`,
      `${cuisine} delivery near me`,
      `${cuisine} open now`
    ];

    const results: ProcessedKeyword[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    console.log(`🔍 LOCAL COMPETITIVE KEYWORDS: Starting analysis for ${businessName}`);
    console.log(`🔍 Restaurant details: ${cuisine} cuisine in ${city}, ${state}`);
    console.log(`🔍 Generated ${localKeywordPatterns.length} targeted keywords:`, localKeywordPatterns);

    // Use Local Finder API for each keyword
    for (const keyword of localKeywordPatterns) {
      try {
        console.log(`🔍 Checking local rankings for: "${keyword}"`);
        
        // Add delay to avoid rate limiting
        await delay(1000);
        
        // Use Local Finder API instead of regular SERP
        const response = await this.client.post('/serp/google/local_finder/live/advanced', [{
          keyword: keyword,
          location_name: locationName,
          language_code: languageCode,
          depth: 50, // Check up to 50 local businesses
          device: 'desktop',
          min_rating: 3.5 // Only businesses with decent ratings
        }]);

        const result = response.data.tasks?.[0]?.result?.[0];
        const localBusinesses = result?.items || [];
        
        console.log(`    📊 Found ${localBusinesses.length} local businesses`);
        
        // Find where your business ranks in local pack
        let position = 0;
        let foundBusiness = null;
        
        console.log(`    🔍 Looking for business: "${businessName}" in ${localBusinesses.length} results`);
        
        for (let i = 0; i < localBusinesses.length; i++) {
          const business = localBusinesses[i];
          
          // Enhanced matching logic focusing on business names (not domains)
          const businessTitle = business.title?.toLowerCase() || '';
          const targetName = businessName.toLowerCase();
          const businessDomain = business.domain?.toLowerCase() || '';
          
          console.log(`    🔍 Checking business #${i+1}: "${business.title}" (domain: ${business.domain || 'none'})`);
          
          // Clean names for better matching
          const cleanBusinessTitle = businessTitle.replace(/[&\-\s]+/g, ' ').trim();
          const cleanTargetName = targetName.replace(/[&\-\s]+/g, ' ').trim();
          
          // Multiple matching strategies prioritizing name matching:
          // 1. Exact name match (after cleaning)
          const exactMatch = cleanBusinessTitle === cleanTargetName;
          
          // 2. Core business name contains target or target contains business name
          const nameContainsMatch = cleanBusinessTitle.includes(cleanTargetName) || cleanTargetName.includes(cleanBusinessTitle);
          
          // 3. First significant word match (skip articles like "the", "a")
          const businessWords = cleanBusinessTitle.split(' ').filter(w => w.length > 2);
          const targetWords = cleanTargetName.split(' ').filter(w => w.length > 2);
          const firstWordMatch = businessWords[0] && targetWords[0] && businessWords[0] === targetWords[0];
          
          // 4. Domain match (only if domain exists)
          const domainMatch = businessDomain && (
            businessDomain.includes(cleanTargetName.replace(/\s+/g, '')) || 
            businessDomain.includes(cleanTargetName.replace(/\s+/g, '').replace(/pizza|restaurant|cafe|grill/g, ''))
          );
          
          // 5. Partial word matching for restaurant names
          const partialMatch = businessWords.some(bWord => 
            targetWords.some(tWord => bWord.includes(tWord) || tWord.includes(bWord))
          );
          
          if (exactMatch || nameContainsMatch || firstWordMatch || domainMatch || partialMatch) {
            position = business.rank_absolute || (i + 1);
            foundBusiness = business;
            console.log(`    ✅ MATCH FOUND! Position ${position} - "${business.title}" matched "${businessName}"`);
            console.log(`    🔍 Match type: exact=${exactMatch}, nameContains=${nameContainsMatch}, firstWord=${firstWordMatch}, domain=${domainMatch}, partial=${partialMatch}`);
            break;
          }
        }

        // Get search volume data separately
        let volumeData = null;
        try {
          const volumeResponse = await this.client.post('/dataforseo_labs/google/keyword_overview/live', [{
            keywords: [keyword],
            location_name: locationName,
            language_code: languageCode
          }]);
          
          volumeData = volumeResponse.data.tasks[0].result[0].items[0];
        } catch (volumeError) {
          console.log(`    ⚠️ Could not get volume data for "${keyword}"`);
        }

        // Include ALL keywords regardless of position (show complete picture)
        results.push({
          keyword: keyword,
          position: position || 0, // 0 means "Not Ranked"
          searchVolume: volumeData?.keyword_info?.search_volume || 0,
          difficulty: volumeData?.keyword_info?.keyword_difficulty || 0,
          cpc: volumeData?.keyword_info?.cpc || 0,
          competition: volumeData?.keyword_info?.competition || 0,
          intent: 'local',
          
          opportunityScore: this.calculateLocalOpportunityScore(
            position, 
            volumeData?.keyword_info?.search_volume || 0,
            foundBusiness?.rating?.value || 0
          )
        });
        
        if (position > 0) {
          console.log(`    ✅ Found at position ${position} for "${keyword}"`);
        } else {
          console.log(`    ❌ Not found in local results for "${keyword}"`);
        }

      } catch (error) {
        console.error(`    ❌ Error checking "${keyword}":`, error.message);
        
        // Still include the keyword even if API call fails
        results.push({
          keyword: keyword,
          position: 0,
          searchVolume: 0,
          difficulty: 0,
          cpc: 0,
          competition: 0,
          intent: 'local',
          opportunityScore: 0
        });
      }
    }

    // Sort by opportunity score and return all 8 keywords
    const sortedResults = results.sort((a, b) => {
      if (a.position === 0 && b.position === 0) return 0;
      if (a.position === 0) return 1;
      if (b.position === 0) return -1;
      return a.position - b.position;
    });

    console.log(`🔍 LOCAL COMPETITIVE KEYWORDS: Returning ${sortedResults.length} targeted keywords`);
    console.log(`🔍 Results:`, sortedResults.map(r => `${r.keyword} (pos: ${r.position || 'not ranked'}, vol: ${r.searchVolume})`));

    return sortedResults;
  }

  private calculateLocalOpportunityScore(
    position: number, 
    searchVolume: number, 
    currentRating: number
  ): number {
    // Local opportunity scoring factors:
    const positionScore = Math.max(0, 25 - position); // Closer to top = higher score
    const volumeScore = Math.log10(searchVolume + 1) * 5; // Higher volume = higher score
    const ratingScore = currentRating * 2; // Better rating = easier to improve
    
    return positionScore + volumeScore + ratingScore;
  }

  /**
   * Legacy method for backward compatibility - now calls the improved local method
   */
  async getTargetedCompetitiveKeywords(
    domain: string,
    cuisine: string,
    city: string,
    state: string,
    locationName: string = 'United States',
    languageCode: string = 'en'
  ): Promise<ProcessedKeyword[]> {
    // Extract business name from domain for better matching
    const businessName = domain.replace(/\.(com|net|org|co|io)$/, '').replace(/www\./, '');
    
    return this.getLocalCompetitiveKeywords(
      businessName,
      cuisine,
      city,
      state,
      locationName,
      languageCode
    );
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