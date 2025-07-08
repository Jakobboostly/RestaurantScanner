import axios from 'axios';
import NodeCache from 'node-cache';
import pLimit from 'p-limit';

const limit = pLimit(2); // Limit concurrent SERP API calls
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export interface SerpResult {
  keyword: string;
  position?: number;
  title: string;
  url: string;
  snippet: string;
  ranking: number;
  searchVolume?: number;
  difficulty?: number;
}

export interface KeywordRankingAnalysis {
  keyword: string;
  currentPosition: number | null;
  competitors: {
    domain: string;
    position: number;
    title: string;
    url: string;
  }[];
  searchVolume: number;
  difficulty: number;
  opportunities: string[];
}

export class SerpApiService {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeKeywordRankings(
    domain: string,
    keywords: string[],
    location: string = 'United States'
  ): Promise<KeywordRankingAnalysis[]> {
    return limit(async () => {
      const cacheKey = `serp_${domain}_${keywords.join('_')}_${location}`;
      const cached = cache.get<KeywordRankingAnalysis[]>(cacheKey);
      
      if (cached) {
        console.log('Using cached SERP data for:', domain);
        return cached;
      }

      const results: KeywordRankingAnalysis[] = [];

      for (const keyword of keywords) {
        try {
          const response = await axios.get(this.baseUrl, {
            params: {
              q: keyword,
              location,
              hl: 'en',
              gl: 'us',
              api_key: this.apiKey,
              engine: 'google',
              num: 20 // Get top 20 results
            },
            timeout: 15000
          });

          const organicResults = response.data.organic_results || [];
          
          // Find current domain position
          let currentPosition = null;
          const domainClean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
          
          for (let i = 0; i < organicResults.length; i++) {
            const result = organicResults[i];
            const resultDomain = result.link?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            
            if (resultDomain === domainClean) {
              currentPosition = i + 1;
              break;
            }
          }

          // Extract competitor data
          const competitors = organicResults.slice(0, 10).map((result: any, index: number) => ({
            domain: result.link?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || '',
            position: index + 1,
            title: result.title || '',
            url: result.link || ''
          }));

          // Estimate search volume and difficulty
          const searchVolume = this.estimateSearchVolume(keyword);
          const difficulty = this.estimateKeywordDifficulty(keyword, organicResults.length);

          // Generate opportunities
          const opportunities = this.generateOpportunities(currentPosition, competitors, keyword);

          results.push({
            keyword,
            currentPosition,
            competitors,
            searchVolume,
            difficulty,
            opportunities
          });

        } catch (error) {
          console.error(`SERP analysis failed for keyword "${keyword}":`, error);
          
          // Add fallback data
          results.push({
            keyword,
            currentPosition: null,
            competitors: [],
            searchVolume: this.estimateSearchVolume(keyword),
            difficulty: 50,
            opportunities: ['Monitor this keyword for future optimization']
          });
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Cache the results
      cache.set(cacheKey, results);
      
      return results;
    });
  }

  async getLocalCompetitors(
    businessName: string,
    location: string,
    businessType: string = 'restaurant'
  ): Promise<SerpResult[]> {
    return limit(async () => {
      const cacheKey = `local_${businessName}_${location}_${businessType}`;
      const cached = cache.get<SerpResult[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      try {
        const query = `${businessType} near ${location}`;
        
        const response = await axios.get(this.baseUrl, {
          params: {
            q: query,
            location,
            hl: 'en',
            gl: 'us',
            api_key: this.apiKey,
            engine: 'google',
            num: 10
          },
          timeout: 15000
        });

        const organicResults = response.data.organic_results || [];
        const localResults = response.data.local_results || [];

        // Combine organic and local results
        const allResults = [...localResults, ...organicResults];
        
        const competitors: SerpResult[] = allResults.map((result: any, index: number) => ({
          keyword: query,
          position: index + 1,
          title: result.title || result.name || '',
          url: result.link || result.website || '',
          snippet: result.snippet || result.description || '',
          ranking: index + 1,
          searchVolume: this.estimateSearchVolume(query),
          difficulty: this.estimateKeywordDifficulty(query, allResults.length)
        }));

        // Cache the results
        cache.set(cacheKey, competitors);
        
        return competitors;

      } catch (error) {
        console.error('Local competitor analysis failed:', error);
        return [];
      }
    });
  }

  private estimateSearchVolume(keyword: string): number {
    // Simplified search volume estimation based on keyword characteristics
    const baseVolume = 1000;
    let multiplier = 1;

    if (keyword.includes('near me')) multiplier *= 2;
    if (keyword.includes('best')) multiplier *= 1.5;
    if (keyword.includes('restaurant')) multiplier *= 1.3;
    if (keyword.includes('menu')) multiplier *= 1.2;
    if (keyword.includes('hours')) multiplier *= 0.8;
    if (keyword.includes('delivery')) multiplier *= 1.4;

    return Math.round(baseVolume * multiplier);
  }

  private estimateKeywordDifficulty(keyword: string, competitorCount: number): number {
    // Simplified difficulty estimation
    let difficulty = 30;
    
    if (competitorCount > 15) difficulty += 20;
    if (keyword.includes('best')) difficulty += 15;
    if (keyword.includes('near me')) difficulty -= 10;
    if (keyword.split(' ').length > 3) difficulty -= 5;
    
    return Math.max(10, Math.min(90, difficulty));
  }

  private generateOpportunities(
    currentPosition: number | null,
    competitors: any[],
    keyword: string
  ): string[] {
    const opportunities: string[] = [];

    if (currentPosition === null) {
      opportunities.push(`Target "${keyword}" keyword for improved visibility`);
    } else if (currentPosition > 10) {
      opportunities.push(`Improve content for "${keyword}" to reach first page`);
    } else if (currentPosition > 3) {
      opportunities.push(`Optimize for "${keyword}" to reach top 3 positions`);
    }

    if (competitors.length > 5) {
      opportunities.push('High competition - focus on long-tail variations');
    }

    if (keyword.includes('near me')) {
      opportunities.push('Optimize Google Business Profile for local searches');
    }

    return opportunities;
  }

  clearCache(): void {
    cache.flushAll();
  }
}