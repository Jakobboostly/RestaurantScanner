import axios, { AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { UnifiedKeywordService } from './unifiedKeywordService';
import { 
  calculateOpportunityScore, 
  classifyKeywordIntent, 
  isCommercialOrLocalKeyword,
  extractDomain,
  KeywordData 
} from '../utils/keywordUtils';

const limit = pLimit(2); // Limit concurrent DataForSEO API calls

// KeywordData interface now imported from utils

export interface CompetitorInsight {
  domain: string;
  organicTraffic: number;
  organicKeywords: number;
  paidTraffic: number;
  paidKeywords: number;
  domainRank: number;
  backlinks: number;
  technicalIssues: number;
  contentGaps: string[];
  backlinkQuality: number;
}

export interface SerpAnalysis {
  keyword: string;
  position: number | null;
  url: string | null;
  title: string | null;
  topCompetitors: {
    domain: string;
    position: number;
    title: string;
    url: string;
  }[];
  features: string[];
  difficulty: number;
}

export class EnhancedDataForSeoService {
  private client: AxiosInstance;
  private login: string;
  private password: string;
  private unifiedService: UnifiedKeywordService;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
    this.unifiedService = new UnifiedKeywordService(login, password);
    
    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      auth: {
        username: login,
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // Reduced timeout for faster scanning
    });
  }

  async getKeywordResearch(
    keyword: string,
    location: string = 'United States'
  ): Promise<KeywordData[]> {
    return limit(async () => {

      try {
        console.log('Getting comprehensive keyword data for:', keyword);
        
        // 1. Generate basic keyword research data using available endpoints
        console.log('Starting keyword research for:', keyword);
        let keywordSuggestions = [];
        let searchVolumeData = [];

        // Use DataForSEO endpoints for keyword research
        try {
          // Try getting keyword suggestions
          const suggestionsResponse = await this.client.post('/dataforseo_labs/google/keyword_suggestions/live', [{
            keyword: keyword,
            location_name: location,
            language_name: 'English',
            limit: 50
          }]);
          keywordSuggestions = suggestionsResponse.data.tasks?.[0]?.result || [];
          console.log('Keyword suggestions received:', keywordSuggestions.length);
        } catch (error) {
          console.log('Keyword suggestions endpoint failed, using fallback');
        }

        // Search volume endpoint removed - no longer using search_volume/live

        // Try getting keyword difficulty using the correct endpoint
        let difficultyData = {};
        try {
          const difficultyResponse = await this.client.post('/dataforseo_labs/google/bulk_keyword_difficulty/live', [{
            keywords: [keyword, ...keywordSuggestions.slice(0, 9).map((s: any) => s.keyword || s)].filter(Boolean),
            location_name: location,
            language_name: 'English'
          }]);
          const difficultyResults = difficultyResponse.data.tasks?.[0]?.result || [];
          difficultyData = difficultyResults.reduce((acc: any, item: any) => {
            acc[item.keyword] = item.keyword_difficulty_index || item.difficulty || 0;
            return acc;
          }, {});
          console.log('Keyword difficulty data received:', Object.keys(difficultyData).length);
        } catch (error) {
          console.log('Keyword difficulty endpoint failed - no data available');
        }

        // Create combined keyword data with fallbacks - limit to 8 keywords (no search volume)
        const baseKeywords = [keyword, ...keywordSuggestions.slice(0, 7).map((s: any) => s.keyword || s)].filter(Boolean);
        const keywordData: KeywordData[] = baseKeywords.map((kw: string, index: number) => {
          const suggestion = keywordSuggestions.find((s: any) => (s.keyword || s) === kw);
          
          return {
            keyword: kw,
            searchVolume: 0, // No search volume data
            difficulty: difficultyData[kw] || 0, // Only use DataForSEO API data
            cpc: 0, // No CPC data without search volume
            competition: suggestion?.competition || 0,
            intent: classifyKeywordIntent(kw),
            relatedKeywords: keywordSuggestions.slice(0, 10).map((s: any) => s.keyword || s).filter(Boolean)
          };
        });

        
        return keywordData;



      } catch (error) {
        console.error('DataForSEO keyword research failed - API configuration required:', error);
        
        // NO MOCK DATA - Return empty array when DataForSEO fails
        return [];
      }
    });
  }

  async analyzeCompetitors(
    domain: string,
    keywords: string[],
    competitors: string[] = []
  ): Promise<CompetitorInsight[]> {
    return limit(async () => {

      try {
        console.log('Analyzing competitors for domain:', domain);
        
        // 1. Get domain competitors
        const competitorsResponse = await this.client.post('/dataforseo_labs/google/competitors_domain/live', [{
          target: domain,
          location_name: 'United States',
          language_name: 'English',
          limit: 10
        }]);

        const competitorResults = competitorsResponse.data.tasks?.[0]?.result || [];
        
        // 2. Skip backlink analysis - removed per user request
        const backlinkMap = {};

        // 3. Get technical SEO issues for competitors
        const topCompetitorDomains = competitorResults.slice(0, 5).map((c: any) => c.domain);
        const technicalPromises = topCompetitorDomains.map(async (competitorDomain: string) => {
          try {
            const technicalResponse = await this.client.post('/on_page/pages/live', [{
              target: competitorDomain,
              limit: 100,
              filters: [["status_code", "!=", 200]]
            }]);
            
            const issues = technicalResponse.data.tasks?.[0]?.result || [];
            return {
              domain: competitorDomain,
              issueCount: issues.length
            };
          } catch (error) {
            console.error(`Technical analysis failed for ${competitorDomain}:`, error);
            return { domain: competitorDomain, issueCount: 0 };
          }
        });

        const technicalData = await Promise.all(technicalPromises);
        const technicalMap = technicalData.reduce((acc: any, item: any) => {
          acc[item.domain] = item.issueCount;
          return acc;
        }, {});

        // 4. Content gap analysis
        const contentGapResponse = await this.client.post('/dataforseo_labs/google/bulk_traffic_estimation/live', [{
          targets: topCompetitorDomains,
          location_name: 'United States',
          language_name: 'English'
        }]);

        const trafficData = contentGapResponse.data.tasks?.[0]?.result || [];
        const contentGaps = this.identifyContentGaps(trafficData, keywords);

        // Combine all data
        const competitors: CompetitorInsight[] = competitorResults.map((item: any) => {
          const competitorDomain = item.domain || '';
          const backlinkInfo = backlinkMap[competitorDomain] || { totalBacklinks: 0, qualityScore: 0 };
          
          return {
            domain: competitorDomain,
            organicTraffic: item.organic_etv || 0,
            organicKeywords: item.organic_count || 0,
            paidTraffic: item.paid_etv || 0,
            paidKeywords: item.paid_count || 0,
            domainRank: item.rank || 0,
            backlinks: backlinkInfo.totalBacklinks,
            technicalIssues: technicalMap[competitorDomain] || 0,
            contentGaps: contentGaps[competitorDomain] || [],
            backlinkQuality: backlinkInfo.qualityScore
          };
        });

        
        return competitors;

      } catch (error) {
        console.error('Competitor analysis failed:', error);
        return [];
      }
    });
  }

  async getSerpAnalysis(
    keyword: string,
    domain: string,
    location: string = 'United States'
  ): Promise<SerpAnalysis> {
    return limit(async () => {

      try {
        const response = await this.client.post('/serp/google/organic/live/advanced', [{
          keyword,
          location_name: location,
          language_name: 'English',
          device: 'mobile',
          os: 'ios'
        }]);

        const items = response.data.tasks?.[0]?.result?.[0]?.items || [];
        
        // Find domain position
        let position = null;
        let url = null;
        let title = null;
        
        const domainClean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemDomain = item.domain || '';
          
          if (itemDomain === domainClean) {
            position = item.rank_group || i + 1;
            url = item.url || '';
            title = item.title || '';
            break;
          }
        }

        // Extract top competitors
        const topCompetitors = items.slice(0, 5).map((item: any) => ({
          domain: item.domain || '',
          position: item.rank_group || 0,
          title: item.title || '',
          url: item.url || ''
        }));

        // Extract SERP features
        const features: string[] = [];
        if (response.data.tasks?.[0]?.result?.[0]?.featured_snippet) {
          features.push('Featured Snippet');
        }
        if (response.data.tasks?.[0]?.result?.[0]?.local_pack) {
          features.push('Local Pack');
        }
        if (response.data.tasks?.[0]?.result?.[0]?.knowledge_graph) {
          features.push('Knowledge Graph');
        }

        const analysis: SerpAnalysis = {
          keyword,
          position,
          url,
          title,
          topCompetitors,
          features,
          difficulty: this.calculateDifficulty(items.length / 10)
        };

        
        return analysis;

      } catch (error) {
        console.error('SERP analysis failed:', error);
        
        return {
          keyword,
          position: null,
          url: null,
          title: null,
          topCompetitors: [],
          features: [],
          difficulty: 50
        };
      }
    });
  }

  async getTechnicalSeoAudit(domain: string): Promise<any> {
    return limit(async () => {

      try {
        console.log('Conducting technical SEO audit for:', domain);
        
        // Get technical SEO issues
        const technicalResponse = await this.client.post('/on_page/pages/live', [{
          target: domain,
          limit: 100,
          filters: [
            ["status_code", "!=", 200],
            ["size", ">", 1000000], // Large files
            ["loading_time", ">", 3000] // Slow loading
          ]
        }]);

        const technicalIssues = technicalResponse.data.tasks?.[0]?.result || [];
        
        // Skip backlink analysis - removed per user request
        const backlinks: any[] = [];
        
        const auditResult = {
          domain,
          technicalIssues: {
            total: technicalIssues.length,
            criticalIssues: technicalIssues.filter((issue: any) => issue.status_code >= 400).length,
            slowPages: technicalIssues.filter((issue: any) => issue.loading_time > 3000).length,
            largeFiles: technicalIssues.filter((issue: any) => issue.size > 1000000).length,
            issues: technicalIssues.slice(0, 10) // Top 10 issues
          },
          backlinkProfile: {
            totalBacklinks: backlinks.length,
            qualityScore: this.calculateBacklinkQuality(backlinks),
            domainAuthority: this.calculateDomainAuthority(backlinks),
            topReferrers: backlinks.slice(0, 10).map((link: any) => ({
              domain: link.domain,
              url: link.url,
              anchor: link.anchor,
              rank: link.domain_rank
            }))
          },
          auditScore: this.calculateTechnicalSeoScore(technicalIssues, backlinks),
          timestamp: new Date().toISOString()
        };

        
        return auditResult;

      } catch (error) {
        console.error('Technical SEO audit failed:', error);
        
        return {
          domain,
          technicalIssues: { total: 0, criticalIssues: 0, slowPages: 0, largeFiles: 0, issues: [] },
          backlinkProfile: { totalBacklinks: 0, qualityScore: 0, domainAuthority: 0, topReferrers: [] },
          auditScore: 0,
          error: 'Technical SEO audit failed'
        };
      }
    });
  }

  private calculateDomainAuthority(backlinks: any[]): number {
    if (!backlinks || backlinks.length === 0) return 0;
    
    const totalDomainRank = backlinks.reduce((sum, link) => sum + (link.domain_rank || 0), 0);
    return Math.round(totalDomainRank / backlinks.length);
  }

  private calculateTechnicalSeoScore(technicalIssues: any[], backlinks: any[]): number {
    let score = 100;
    
    // Deduct points for technical issues
    score -= technicalIssues.filter((issue: any) => issue.status_code >= 400).length * 5; // Critical issues
    score -= technicalIssues.filter((issue: any) => issue.loading_time > 3000).length * 2; // Slow pages
    score -= technicalIssues.filter((issue: any) => issue.size > 1000000).length * 1; // Large files
    
    // Add points for backlinks
    const backlinkScore = Math.min(backlinks.length / 10, 20); // Max 20 points
    score += backlinkScore;
    
    return Math.max(0, Math.min(100, score));
  }

  async getRestaurantKeywordSuggestions(
    restaurantName: string,
    location: string,
    cuisineType?: string
  ): Promise<KeywordData[]> {
    console.log(`🚀 OPTIMIZED KEYWORD SUGGESTIONS: Using unified service for ${restaurantName}`);

    try {
      // Parse location into city/state
      const locationParts = location.split(',').map(part => part.trim());
      const city = locationParts[0] || location;
      const state = locationParts[1] || '';

      // Use unified service for batch processing
      const results = await this.unifiedService.analyzeKeywordsBatch({
        businessName: restaurantName,
        cuisine: cuisineType || 'restaurant',
        city: city,
        state: state,
        locationName: location
      });

      // Convert unified results to expected format and filter for commercial/local keywords
      const keywordSuggestions: KeywordData[] = results.searchVolumeData
        .filter(item => isCommercialOrLocalKeyword(item.keyword))
        .map(item => ({
          keyword: item.keyword,
          searchVolume: item.searchVolume,
          difficulty: item.difficulty,
          cpc: item.cpc,
          competition: item.competition,
          intent: classifyKeywordIntent(item.keyword),
          relatedKeywords: [] // Could be enhanced later if needed
        }))
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 10);

      console.log(`✅ OPTIMIZED KEYWORD SUGGESTIONS: Found ${keywordSuggestions.length} relevant keywords`);
      return keywordSuggestions;

    } catch (error) {
      console.error('Optimized keyword suggestions failed:', error);
      return [];
    }
  }

  /**
   * Get real ranking positions for the three key restaurant keywords
   * Now uses unified service for batch processing
   */
  async getRealRestaurantRankings(
    domain: string,
    foodType: string,
    city: string,
    state: string,
    restaurantName?: string
  ): Promise<{ keyword: string; position: number | null }[]> {
    console.log(`🚀 OPTIMIZED RANKING CHECK: Using unified service for ${domain}`);

    try {
      // Use unified service for batch processing
      const results = await this.unifiedService.analyzeKeywordsBatch({
        businessName: restaurantName || '',
        cuisine: foodType,
        city: city,
        state: state,
        targetDomain: domain,
        locationName: `${city},${state},United States`
      });

      // Convert to expected format - use both local and organic rankings
      const rankings = [];
      
      // Get positions from local rankings (primary for restaurants)
      const localRankings = results.localRankings.filter(ranking => 
        ranking.keyword.includes(foodType)
      );
      
      // Get positions from organic rankings as fallback
      const organicRankings = results.organicRankings.filter(ranking => 
        ranking.keyword.includes(foodType)
      );

      // The three key keywords
      const targetKeywords = [
        `${foodType} near me`,
        `${foodType} restaurant near me`, 
        `${foodType}`
      ];

      targetKeywords.forEach(keyword => {
        // Check local rankings first (preferred for restaurants)
        const localMatch = localRankings.find(r => r.keyword === keyword);
        if (localMatch && localMatch.position > 0) {
          rankings.push({ keyword, position: localMatch.position });
          console.log(`✅ LOCAL: "${keyword}" - Found at position ${localMatch.position}`);
          return;
        }

        // Check organic rankings as fallback
        const organicMatch = organicRankings.find(r => r.keyword === keyword);
        if (organicMatch && organicMatch.position) {
          rankings.push({ keyword, position: organicMatch.position });
          console.log(`✅ ORGANIC: "${keyword}" - Found at position ${organicMatch.position}`);
          return;
        }

        // Not found
        rankings.push({ keyword, position: null });
        console.log(`❌ "${keyword}" - Not found in rankings`);
      });

      console.log(`✅ OPTIMIZED RANKING CHECK: Completed ${rankings.length} keywords in batch`);
      return rankings;

    } catch (error) {
      console.error('Optimized ranking check failed:', error);
      
      // Fallback to empty results
      const targetKeywords = [
        `${foodType} near me`,
        `${foodType} restaurant near me`, 
        `${foodType}`
      ];
      
      return targetKeywords.map(keyword => ({ keyword, position: null }));
    }
  }

  // Utility methods moved to keywordUtils.ts for consistency across services

  private calculateDifficulty(competition: number): number {
    return Math.round(competition * 100);
  }

  private calculateBacklinkQuality(backlinks: any[]): number {
    if (!backlinks || backlinks.length === 0) return 0;
    
    let qualityScore = 0;
    backlinks.forEach(link => {
      // Score based on domain authority, trust flow, citation flow
      const domainRank = link.domain_rank || 0;
      const trustFlow = link.trust_flow || 0;
      const citationFlow = link.citation_flow || 0;
      
      qualityScore += (domainRank * 0.4) + (trustFlow * 0.3) + (citationFlow * 0.3);
    });
    
    return Math.round(qualityScore / backlinks.length);
  }

  private identifyContentGaps(trafficData: any[], keywords: string[]): { [domain: string]: string[] } {
    const contentGaps: { [domain: string]: string[] } = {};
    
    trafficData.forEach(domainData => {
      if (!domainData.domain) return;
      
      const gaps: string[] = [];
      
      // Identify keywords that competitors rank for but target doesn't
      const competitorKeywords = domainData.keywords || [];
      keywords.forEach(keyword => {
        const hasKeyword = competitorKeywords.some((ck: any) => 
          ck.keyword?.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (!hasKeyword) {
          gaps.push(keyword);
        }
      });
      
      // Add high-traffic keywords they're missing
      if (domainData.organic_keywords) {
        const highTrafficKeywords = domainData.organic_keywords
          .filter((k: any) => k.search_volume > 1000)
          .slice(0, 5)
          .map((k: any) => k.keyword);
        
        gaps.push(...highTrafficKeywords);
      }
      
      contentGaps[domainData.domain] = gaps.slice(0, 10); // Limit to top 10 gaps
    });
    
    return contentGaps;
  }

}