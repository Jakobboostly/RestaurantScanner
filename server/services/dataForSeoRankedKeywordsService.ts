import axios from 'axios';

export interface ProcessedKeyword {
  keyword: string;
  position: number | null;
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

interface DataForSeoRankedKeywordsResponse {
  status_code: number;
  status_message: string;
  tasks: Array<{
    status_code: number;
    status_message: string;
    result: Array<{
      total_count: number;
      items_count: number;
      items: any[];
    }>;
  }>;
}

export class DataForSeoRankedKeywordsService {
  private baseUrl = 'https://api.dataforseo.com/v3';
  private login: string;
  private password: string;

  constructor() {
    this.login = process.env.DATAFORSEO_LOGIN || '';
    this.password = process.env.DATAFORSEO_PASSWORD || '';
    
    if (!this.login || !this.password) {
      console.error('⚠️ DataForSEO credentials missing. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.');
    }
  }

  /**
   * Generate meaningful competitive opportunity keywords
   * Focus on actual competitive terms like "best pizza [city]", "pizza delivery near me", etc.
   */
  async getCompetitiveOpportunityKeywords(
    domain: string, 
    locationName: string = 'United States',
    languageCode: string = 'en',
    limit: number = 5,
    restaurantCity?: string
  ): Promise<ProcessedKeyword[]> {
    
    // Generate competitive keyword candidates based on restaurant type and location
    const competitiveKeywords = this.generateCompetitiveKeywords(domain, restaurantCity);
    
    console.log(`🔍 COMPETITIVE OPPORTUNITIES: Generated ${competitiveKeywords.length} candidate keywords:`, competitiveKeywords.slice(0, 5));
    
    // Check ranking positions for these competitive keywords
    const rankedKeywords = await this.checkKeywordRankings(domain, competitiveKeywords, locationName, languageCode);
    
    // Filter for positions 6+ (competitive opportunities)
    const opportunities = rankedKeywords.filter(kw => kw.position && kw.position >= 6 && kw.position <= 50);
    
    console.log(`🔍 COMPETITIVE OPPORTUNITIES: Found ${opportunities.length} opportunities (ranking 6-50):`, opportunities.map(k => `${k.keyword} (#${k.position})`));
    
    return opportunities.slice(0, limit);
  }

  /**
   * Generate meaningful competitive keywords based on business type and location
   */
  private generateCompetitiveKeywords(domain: string, city?: string): string[] {
    const businessType = this.detectBusinessType(domain);
    const cityName = city || 'near me';
    
    const keywords: string[] = [];
    
    // High-value competitive terms
    if (businessType.includes('pizza')) {
      keywords.push(
        `best pizza ${cityName}`,
        `pizza delivery ${cityName}`,
        `pizza near me`,
        `pizza takeout ${cityName}`,
        `italian restaurant ${cityName}`,
        `pizza restaurant ${cityName}`,
        `pizza place ${cityName}`,
        `good pizza ${cityName}`,
        `pizza delivery near me`,
        `pizza lunch ${cityName}`
      );
    }
    
    if (businessType.includes('mexican')) {
      keywords.push(
        `best mexican food ${cityName}`,
        `mexican restaurant ${cityName}`,
        `mexican food near me`,
        `mexican delivery ${cityName}`,
        `tacos ${cityName}`,
        `burritos ${cityName}`
      );
    }
    
    if (businessType.includes('burger')) {
      keywords.push(
        `best burgers ${cityName}`,
        `burger restaurant ${cityName}`,
        `burgers near me`,
        `burger delivery ${cityName}`,
        `good burgers ${cityName}`
      );
    }
    
    if (businessType.includes('chinese')) {
      keywords.push(
        `best chinese food ${cityName}`,
        `chinese restaurant ${cityName}`,
        `chinese food near me`,
        `chinese delivery ${cityName}`,
        `chinese takeout ${cityName}`
      );
    }
    
    // Generic restaurant keywords
    keywords.push(
      `best restaurants ${cityName}`,
      `restaurants near me`,
      `food delivery ${cityName}`,
      `takeout ${cityName}`,
      `lunch ${cityName}`,
      `dinner ${cityName}`,
      `family restaurant ${cityName}`,
      `casual dining ${cityName}`
    );
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Detect business type from domain or other context
   */
  private detectBusinessType(domain: string): string {
    const domainLower = domain.toLowerCase();
    
    if (domainLower.includes('pizza')) return 'pizza';
    if (domainLower.includes('mexican') || domainLower.includes('taco') || domainLower.includes('burrito')) return 'mexican';
    if (domainLower.includes('burger')) return 'burger';
    if (domainLower.includes('chinese')) return 'chinese';
    if (domainLower.includes('italian')) return 'pizza'; // Italian often means pizza
    if (domainLower.includes('thai')) return 'thai';
    if (domainLower.includes('indian')) return 'indian';
    
    return 'restaurant'; // Generic fallback
  }

  /**
   * Check actual ranking positions for competitive keywords using SERP API
   */
  private async checkKeywordRankings(
    domain: string, 
    keywords: string[], 
    locationName: string,
    languageCode: string
  ): Promise<ProcessedKeyword[]> {
    const results: ProcessedKeyword[] = [];
    
    try {
      // Use DataForSEO SERP API to check rankings for these competitive keywords
      const postData = {
        location_name: locationName,
        language_code: languageCode,
        keyword: keywords.join('\n'), // Multiple keywords
        device: 'desktop',
        os: 'windows'
      };

      const response = await axios.post(`${this.baseUrl}/serp/google/organic/live`, [postData], {
        auth: { username: this.login, password: this.password },
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      if (response.data?.tasks?.[0]?.result?.[0]?.items) {
        const items = response.data.tasks[0].result[0].items;
        
        keywords.forEach((keyword, index) => {
          // Find if domain appears in results for this keyword
          const position = this.findDomainPosition(items, domain, keyword);
          
          results.push({
            keyword,
            position,
            searchVolume: this.estimateSearchVolume(keyword),
            difficulty: this.estimateDifficulty(keyword),
            intent: this.classifyIntent(keyword),
            cpc: 0,
            competition: 0.5,
            opportunity: position && position >= 6 ? Math.max(100 - position * 2, 10) : 0,
            url: '',
            title: '',
            description: '',
            isNew: false,
            isLost: false,
            positionChange: 0,
            previousPosition: 0
          });
        });
      }
    } catch (error) {
      console.error('🔍 COMPETITIVE OPPORTUNITIES: SERP API error:', error);
      
      // Fallback: create placeholder results for the keywords
      keywords.forEach(keyword => {
        results.push({
          keyword,
          position: null, // Unknown position
          searchVolume: this.estimateSearchVolume(keyword),
          difficulty: this.estimateDifficulty(keyword),
          intent: this.classifyIntent(keyword),
          cpc: 0,
          competition: 0.5,
          opportunity: 75, // Assume opportunity exists
          url: '',
          title: '',
          description: '',
          isNew: false,
          isLost: false,
          positionChange: 0,
          previousPosition: 0
        });
      });
    }
    
    return results;
  }

  /**
   * Find domain position in SERP results
   */
  private findDomainPosition(items: any[], domain: string, keyword: string): number | null {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.domain && item.domain.includes(domain.replace('www.', ''))) {
        return i + 1; // 1-based position
      }
    }
    return null; // Not found in top results
  }

  /**
   * Estimate search volume based on keyword characteristics
   */
  private estimateSearchVolume(keyword: string): number {
    if (keyword.includes('near me')) return 5000;
    if (keyword.includes('best')) return 2000;
    if (keyword.includes('delivery')) return 1500;
    if (keyword.includes('restaurant')) return 1000;
    if (keyword.includes('takeout')) return 800;
    return 500; // Default
  }

  /**
   * Estimate keyword difficulty based on competitiveness
   */
  private estimateDifficulty(keyword: string): number {
    if (keyword.includes('best')) return 75; // Very competitive
    if (keyword.includes('near me')) return 60; // Competitive
    if (keyword.includes('restaurant')) return 50; // Moderate
    if (keyword.includes('delivery')) return 40; // Moderate
    return 30; // Low difficulty
  }

  /**
   * Classify search intent based on keyword patterns
   */
  private classifyIntent(keyword: string): string {
    if (keyword.includes('best') || keyword.includes('top') || keyword.includes('good')) return 'commercial';
    if (keyword.includes('near me') || keyword.includes('delivery') || keyword.includes('takeout')) return 'local';
    if (keyword.includes('menu') || keyword.includes('hours') || keyword.includes('phone')) return 'informational';
    return 'navigational';
  }

  /**
   * Get ranked keywords for a domain (existing functionality)
   */
  async getRankedKeywords(
    domain: string,
    locationName: string = 'United States',
    languageCode: string = 'en',
    limit: number = 10
  ): Promise<ProcessedKeyword[]> {
    try {
      console.log(`🔍 RANKED KEYWORDS API: Getting ranked keywords for domain: ${domain}`);
      
      const postData = {
        target: domain,
        location_name: locationName,
        language_code: languageCode,
        order_by: ["ranked_serp_element.serp_item.rank_group,asc"],
        limit: limit
      };

      const response = await axios.post(`${this.baseUrl}/dataforseo_labs/google/ranked_keywords/live`, [postData], {
        auth: { username: this.login, password: this.password },
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      if (response.data.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${response.data.status_message}`);
      }

      const task = response.data.tasks[0];
      if (!task || task.status_code !== 20000) {
        throw new Error(`Task failed: ${task?.status_message || 'Unknown error'}`);
      }

      const result = task.result && task.result[0];
      if (!result || !result.items) {
        return [];
      }

      return result.items.map((item: any) => this.processKeywordFromAPI(item));

    } catch (error) {
      console.error('🔍 RANKED KEYWORDS API: Error:', error);
      return [];
    }
  }

  /**
   * Process keyword data from DataForSEO API response
   */
  private processKeywordFromAPI(item: any): ProcessedKeyword {
    const keyword = item.keyword_data?.keyword || '';
    const position = item.ranked_serp_element?.serp_item?.rank_group || null;
    const searchVolume = item.keyword_data?.keyword_info?.search_volume || 0;
    const difficulty = item.keyword_data?.keyword_info?.keyword_difficulty || 0;
    const cpc = item.keyword_data?.keyword_info?.cpc || 0;
    const competition = item.keyword_data?.keyword_info?.competition || 0;

    return {
      keyword,
      position,
      searchVolume,
      difficulty,
      intent: this.classifyIntent(keyword),
      cpc,
      competition,
      opportunity: position && position >= 6 ? Math.max(100 - position * 2, 10) : 0,
      url: item.ranked_serp_element?.serp_item?.url || '',
      title: item.ranked_serp_element?.serp_item?.title || '',
      description: item.ranked_serp_element?.serp_item?.description || '',
      isNew: false,
      isLost: false,
      positionChange: 0,
      previousPosition: 0
    };
  }
}