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
          const siteKeywords = await this.getKeywordsForSite(websiteUrl);
          
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

  async getKeywordsForSite(websiteUrl: string, locationCode: number = 2840): Promise<any[]> {
    try {
      console.log(`🔍 Getting keywords for site: ${websiteUrl}`);
      
      // Clean up the URL - remove protocol and www for the target parameter
      let target = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (target.endsWith('/')) {
        target = target.slice(0, -1);
      }
      
      const post_array = [{
        target: target,
        target_type: "site",
        location_code: locationCode,
        language_code: "en",
        search_partners: false,
        include_adult_keywords: false,
        sort_by: "search_volume"
      }];

      const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/live', {
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
        console.log(`✅ Got ${keywords.length} keywords for site: ${websiteUrl}`);
        return keywords;
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