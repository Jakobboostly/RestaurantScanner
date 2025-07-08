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
      timeout: 30000
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
        // Get keyword ideas
        const response = await this.client.post('/keywords_data/google_ads/keywords_for_keywords/live', [{
          keywords: [keyword],
          location_name: location,
          language_name: 'English',
          include_serp_info: true,
          limit: 50
        }]);

        const results = response.data.tasks?.[0]?.result || [];
        
        const keywordData: KeywordData[] = results.map((item: any) => ({
          keyword: item.keyword || keyword,
          searchVolume: item.search_volume || 0,
          difficulty: this.calculateDifficulty(item.competition || 0),
          cpc: item.cpc || 0,
          competition: item.competition || 0,
          intent: this.classifySearchIntent(item.keyword || keyword),
          relatedKeywords: []
        }));

        // Get related keywords
        try {
          const relatedResponse = await this.client.post('/keywords_data/google_ads/keywords_for_keywords/live', [{
            keywords: [keyword],
            location_name: location,
            language_name: 'English',
            include_serp_info: true,
            limit: 20
          }]);

          const relatedResults = relatedResponse.data.tasks?.[0]?.result || [];
          const relatedKeywords = relatedResults.map((item: any) => item.keyword).filter(Boolean);
          
          if (keywordData.length > 0) {
            keywordData[0].relatedKeywords = relatedKeywords;
          }
        } catch (error) {
          console.error('Related keywords fetch failed:', error);
        }

        // Cache the results
        cache.set(cacheKey, keywordData);
        
        return keywordData;

      } catch (error) {
        console.error('Keyword research failed:', error);
        
        // Return fallback data
        return [{
          keyword,
          searchVolume: this.estimateSearchVolume(keyword),
          difficulty: 50,
          cpc: 1.0,
          competition: 0.5,
          intent: this.classifySearchIntent(keyword),
          relatedKeywords: []
        }];
      }
    });
  }

  async analyzeCompetitors(
    domain: string,
    keywords: string[]
  ): Promise<CompetitorInsight[]> {
    return limit(async () => {
      const cacheKey = `competitors_${domain}_${keywords.join('_')}`;
      const cached = cache.get<CompetitorInsight[]>(cacheKey);
      
      if (cached) {
        console.log('Using cached competitor analysis for:', domain);
        return cached;
      }

      try {
        // Get domain competitors
        const response = await this.client.post('/dataforseo_labs/google/competitors_domain/live', [{
          target: domain,
          location_name: 'United States',
          language_name: 'English',
          limit: 10
        }]);

        const results = response.data.tasks?.[0]?.result || [];
        
        const competitors: CompetitorInsight[] = results.map((item: any) => ({
          domain: item.domain || '',
          organicTraffic: item.organic_etv || 0,
          organicKeywords: item.organic_count || 0,
          paidTraffic: item.paid_etv || 0,
          paidKeywords: item.paid_count || 0,
          domainRank: item.rank || 0,
          backlinks: item.backlinks || 0
        }));

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

  clearCache(): void {
    cache.flushAll();
  }
}