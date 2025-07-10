import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';
import pLimit from 'p-limit';

const limit = pLimit(2); // Limit concurrent DataForSEO API calls
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: string;
  relatedKeywords: string[];
}

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

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
    
    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      auth: {
        username: login,
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 45000
    });
  }

  async getKeywordResearch(
    keyword: string,
    location: string = 'United States'
  ): Promise<KeywordData[]> {
    return limit(async () => {
      const cacheKey = `keyword_research_${keyword}_${location}`;
      const cached = cache.get<KeywordData[]>(cacheKey);
      
      if (cached) {
        console.log('Using cached keyword research for:', keyword);
        return cached;
      }

      try {
        console.log('Getting comprehensive keyword data for:', keyword);
        
        // 1. Get keyword difficulty scores
        const difficultyResponse = await this.client.post('/keywords_data/google/keyword_difficulty/live', [{
          keywords: [keyword],
          location_name: location,
          language_name: 'English'
        }]);

        const difficultyResults = difficultyResponse.data.tasks?.[0]?.result || [];
        const difficultyData = difficultyResults.reduce((acc: any, item: any) => {
          acc[item.keyword] = item.keyword_difficulty || 50;
          return acc;
        }, {});

        // 2. Get keyword suggestions for comprehensive analysis
        const suggestionsResponse = await this.client.post('/keywords_data/google/keyword_suggestions/live', [{
          keyword: keyword,
          location_name: location,
          language_name: 'English',
          limit: 100
        }]);

        const suggestions = suggestionsResponse.data.tasks?.[0]?.result || [];
        
        // 3. Get search volume data
        const volumeResponse = await this.client.post('/keywords_data/google/search_volume/live', [{
          keywords: [keyword, ...suggestions.slice(0, 10).map((s: any) => s.keyword)],
          location_name: location,
          language_name: 'English'
        }]);

        const volumeResults = volumeResponse.data.tasks?.[0]?.result || [];
        
        // Combine all data sources
        const keywordData: KeywordData[] = volumeResults.map((item: any) => ({
          keyword: item.keyword || keyword,
          searchVolume: item.search_volume || 0,
          difficulty: difficultyData[item.keyword] || this.calculateDifficulty(item.competition || 0),
          cpc: item.keyword_info?.cpc || 0,
          competition: item.keyword_info?.competition || 0,
          intent: this.classifySearchIntent(item.keyword || keyword),
          relatedKeywords: suggestions.slice(0, 20).map((s: any) => s.keyword).filter(Boolean)
        }));

        // Cache the results
        cache.set(cacheKey, keywordData);
        
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
      const cacheKey = `competitors_${domain}_${keywords.join('_')}`;
      const cached = cache.get<CompetitorInsight[]>(cacheKey);
      
      if (cached) {
        console.log('Using cached competitor analysis for:', domain);
        return cached;
      }

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
        
        // 2. Get backlink analysis for top competitors
        const topCompetitorDomains = competitorResults.slice(0, 5).map((c: any) => c.domain);
        const backlinkPromises = topCompetitorDomains.map(async (competitorDomain: string) => {
          try {
            const backlinkResponse = await this.client.post('/backlinks/backlinks/live', [{
              target: competitorDomain,
              limit: 1000,
              filters: [["dofollow", "=", true]]
            }]);
            
            const backlinks = backlinkResponse.data.tasks?.[0]?.result || [];
            return {
              domain: competitorDomain,
              totalBacklinks: backlinks.length,
              qualityScore: this.calculateBacklinkQuality(backlinks)
            };
          } catch (error) {
            console.error(`Backlink analysis failed for ${competitorDomain}:`, error);
            return { domain: competitorDomain, totalBacklinks: 0, qualityScore: 0 };
          }
        });

        const backlinkData = await Promise.all(backlinkPromises);
        const backlinkMap = backlinkData.reduce((acc: any, item: any) => {
          acc[item.domain] = item;
          return acc;
        }, {});

        // 3. Get technical SEO issues for competitors
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

        // Cache the results
        cache.set(cacheKey, competitors);
        
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
      const cacheKey = `serp_${keyword}_${domain}_${location}`;
      const cached = cache.get<SerpAnalysis>(cacheKey);
      
      if (cached) {
        console.log('Using cached SERP analysis for:', keyword);
        return cached;
      }

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

        // Cache the results
        cache.set(cacheKey, analysis);
        
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
      const cacheKey = `technical_seo_${domain}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        console.log('Using cached technical SEO audit for:', domain);
        return cached;
      }

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
        
        // Get backlink profile
        const backlinkResponse = await this.client.post('/backlinks/backlinks/live', [{
          target: domain,
          limit: 1000,
          filters: [["dofollow", "=", true]]
        }]);
        
        const backlinks = backlinkResponse.data.tasks?.[0]?.result || [];
        
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

        // Cache the results
        cache.set(cacheKey, auditResult);
        
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
    const baseKeywords = [
      `${restaurantName}`,
      `${restaurantName} menu`,
      `${restaurantName} hours`,
      `${restaurantName} delivery`,
      `${restaurantName} reservations`,
      `${restaurantName} reviews`,
      `${restaurantName} near me`,
      `${restaurantName} ${location}`,
      `best restaurant ${location}`,
      `${cuisineType} restaurant ${location}`
    ].filter(Boolean);

    const keywordPromises = baseKeywords.map(keyword => 
      this.getKeywordResearch(keyword, location)
    );

    try {
      const results = await Promise.allSettled(keywordPromises);
      
      const allKeywords: KeywordData[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allKeywords.push(...result.value);
        }
      });

      // Sort by search volume and return top keywords
      return allKeywords
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 15);

    } catch (error) {
      console.error('Restaurant keyword suggestions failed:', error);
      return [];
    }
  }

  private calculateDifficulty(competition: number): number {
    return Math.round(competition * 100);
  }

  private classifySearchIntent(keyword: string): string {
    if (keyword.includes('buy') || keyword.includes('order') || keyword.includes('delivery')) {
      return 'transactional';
    }
    if (keyword.includes('how') || keyword.includes('what') || keyword.includes('why')) {
      return 'informational';
    }
    if (keyword.includes('best') || keyword.includes('review') || keyword.includes('vs')) {
      return 'investigational';
    }
    if (keyword.includes('near me') || keyword.includes('location')) {
      return 'local';
    }
    return 'navigational';
  }

  private estimateSearchVolume(keyword: string): number {
    // Fallback search volume estimation
    const baseVolume = 500;
    let multiplier = 1;

    if (keyword.includes('restaurant')) multiplier *= 2;
    if (keyword.includes('menu')) multiplier *= 1.5;
    if (keyword.includes('near me')) multiplier *= 3;
    if (keyword.includes('delivery')) multiplier *= 2;
    if (keyword.includes('hours')) multiplier *= 1.2;

    return Math.round(baseVolume * multiplier);
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

  clearCache(): void {
    cache.flushAll();
  }
}