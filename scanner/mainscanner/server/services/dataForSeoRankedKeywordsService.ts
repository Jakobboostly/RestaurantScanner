import { UnifiedKeywordService } from './unifiedKeywordService';
import { isRestaurantRelevant } from '../utils/keywordUtils';

export class DataForSeoRankedKeywordsService {
  private login: string;
  private password: string;
  private unifiedService: UnifiedKeywordService;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
    this.unifiedService = new UnifiedKeywordService(login, password);
  }

  async getRankedKeywords(domain: string, location?: string, language?: string, limit?: number) {
    // Minimal implementation to prevent errors
    return [];
  }

  /**
   * Get live ranked keywords for a domain using DataForSEO Labs
   * Returns simplified array: { absolute_position, keyword, competition, search_volume }
   */
  async getDomainRankedKeywords(params: {
    target: string;
    location_code?: number; // Labs expects location_code; default to US (2840)
    language_code?: string;
    limit?: number; // 1-1000
    include_subdomains?: boolean; // default false
    filters?: any[];
    order_by?: string[];
    // location_name kept for backward-compat but ignored by Labs; do not use
    location_name?: string;
  }): Promise<Array<{ absolute_position: number | null; keyword: string; competition: number | null; search_volume: number | null }>> {
    try {
      if (!params?.target) {
        throw new Error('Target domain is required');
      }

      // Strip protocol and www
      let target = params.target.replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (target.endsWith('/')) target = target.slice(0, -1);

      const postBody = [{
        target,
        target_type: 'domain',
        location_code: params.location_code ?? 2840,
        language_code: params.language_code || 'en',
        limit: Math.min(Math.max(params.limit || 100, 1), 1000),
        include_subdomains: params.include_subdomains ?? false,
        filters: params.filters || [],
        order_by: params.order_by || ['keyword_data.keyword_info.search_volume,desc']
      }];

      const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const task = data?.tasks?.[0];
      const statusCode = task?.status_code;
      if (statusCode !== 20000) {
        const message = task?.status_message || 'Unknown API error';
        throw new Error(message);
      }

      const items = task?.result?.[0]?.items || [];
      const simplified = items.map((it: any) => ({
        absolute_position: it?.ranked_serp_element?.serp_item?.rank_absolute ?? null,
        keyword: it?.keyword_data?.keyword ?? '',
        competition: it?.keyword_data?.keyword_info?.competition ?? null,
        search_volume: it?.keyword_data?.keyword_info?.search_volume ?? null
      })).filter((k: any) => k.keyword);

      return simplified;
    } catch (error: any) {
      console.log('❌ getDomainRankedKeywords error:', error?.message || error);
      return [];
    }
  }

  async getLocalCompetitiveKeywords(businessName: string, cuisine: string, city: string, state: string, location?: string, language?: string, websiteUrl?: string) {
    console.log(`🚀 OPTIMIZED LOCAL ANALYSIS: Using unified batch service for: ${businessName}`);
    
    try {
      // Use the unified service for batch processing
      const results = await this.unifiedService.analyzeKeywordsBatch({
        businessName,
        cuisine,
        city,
        state,
        websiteUrl,
        locationName: location,
        languageCode: language || 'en'
      });

      // Convert unified results to expected format
      const localKeywords = results.localRankings.map(ranking => ({
        keyword: ranking.keyword,
        position: ranking.position,
        searchVolume: ranking.searchVolume,
        difficulty: ranking.difficulty,
        intent: ranking.intent,
        cpc: ranking.cpc,
        competition: ranking.competition,
        opportunity: ranking.opportunity
      }));

      console.log(`✅ OPTIMIZED LOCAL ANALYSIS: Completed ${localKeywords.length} keywords in batch`);
      
      // If website URL provided, enhance with website-specific keywords
      if (websiteUrl && localKeywords.length > 0) {
        console.log(`🌐 SMART HYBRID: Adding website-specific opportunities for ${websiteUrl}`);
        try {
          const locationName = `${city},${state},United States`;
          const siteKeywords = await this.getKeywordsForSite(websiteUrl, locationName);
          
          const qualityWebsiteKeywords = siteKeywords
            .filter(k => k.search_volume >= 100)
            .filter(k => isRestaurantRelevant(k.keyword, cuisine, city))
            .filter(k => !localKeywords.some(lk => lk.keyword === k.keyword))
            .sort((a, b) => b.search_volume - a.search_volume)
            .slice(0, 2) // Add up to 2 website keywords
            .map(k => ({
              keyword: k.keyword,
              position: 0, // New keywords start unranked
              searchVolume: k.search_volume,
              difficulty: k.keyword_difficulty || 0,
              intent: 'local',
              cpc: k.cpc || 0,
              competition: k.competition || 0,
              opportunity: 75 // High opportunity for unranked keywords
            }));

          if (qualityWebsiteKeywords.length > 0) {
            console.log(`✅ SMART HYBRID: Added ${qualityWebsiteKeywords.length} website keywords`);
            return [...localKeywords.slice(0, 6), ...qualityWebsiteKeywords];
          }
        } catch (error) {
          console.log(`⚠️ Website keyword enhancement failed, using core keywords only`);
        }
      }

      return localKeywords;
      
    } catch (error) {
      console.log('❌ Optimized local analysis failed:', error);
      
      // Fallback to empty results
      return [];
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

  async getKeywordsForSite(websiteUrl: string, locationName: string = 'United States'): Promise<any[]> {
    try {
      console.log(`🔍 Getting SERP keywords for site: ${websiteUrl}`);
      
      // Clean up the URL - remove protocol and www for the target parameter
      let target = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (target.endsWith('/')) {
        target = target.slice(0, -1);
      }
      
      const post_array = [{
        target: target,
        target_type: "domain",
        location_code: 2840, // US-wide to avoid invalid field errors
        language_code: "en",
        include_clickstream_data: true,
        sort_by: "search_volume"
      }];

      const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(post_array)
      });

      if (!response.ok) {
        console.log(`❌ Keywords For Site API failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.tasks && data.tasks[0] && data.tasks[0].result) {
        const keywords = data.tasks[0].result;
        console.log(`✅ Got ${keywords.length} SERP keywords for site: ${websiteUrl}`);
        
        // Transform SERP API response to expected format
        const transformedKeywords = keywords.map((keyword: any) => ({
          keyword: keyword.se_results_keywords,
          search_volume: keyword.impressions || keyword.search_volume || 0,
          competition: 'MEDIUM',
          competition_index: keyword.keyword_difficulty || 50,
          cpc: keyword.cpc || 0,
          keyword_difficulty: keyword.keyword_difficulty || 50,
          position: keyword.se_results_position || 0,
          clicks: keyword.clicks || 0
        })).filter((k: any) => k.keyword && k.search_volume > 0);
        
        return transformedKeywords;
      } else {
        console.log(`⚠️ No keywords returned for site: ${websiteUrl}`);
        return [];
      }
      
    } catch (error) {
      console.log(`❌ Keywords For Site API error for ${websiteUrl}:`, error);
      return [];
    }
  }

  // Removed redundant methods - now using shared utilities and unified service
}