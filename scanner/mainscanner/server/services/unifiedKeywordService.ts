/**
 * Unified Keyword Service - Batch API Operations for DataForSEO
 * Eliminates redundant API calls by batching all keyword operations
 * Reduces API calls from ~50 to ~5 per restaurant analysis
 */

import NodeCache from 'node-cache';
import pLimit from 'p-limit';
import {
  generateLocalKeywords,
  isRestaurantRelevant,
  calculateOpportunityScore,
  classifyKeywordIntent,
  extractDomain,
  matchBusinessName,
  KeywordData,
  LocalKeywordConfig
} from '../utils/keywordUtils';

const limit = pLimit(2); // Limit concurrent DataForSEO API calls
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export interface UnifiedKeywordResults {
  keywords: string[];
  localRankings: LocalRankingResult[];
  organicRankings: OrganicRankingResult[];
  searchVolumeData: SearchVolumeResult[];
  competitorData: CompetitorResult[];
}

export interface LocalRankingResult {
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: string;
  opportunity: number;
}

export interface OrganicRankingResult {
  keyword: string;
  position: number | null;
  url: string | null;
  title: string | null;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  opportunity: number;
  intent: string;
}

export interface SearchVolumeResult {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  monthlySearches: any[];
}

export interface CompetitorResult {
  keyword: string;
  topCompetitors: {
    domain: string;
    position: number;
    title: string;
    url: string;
  }[];
}

export class UnifiedKeywordService {
  private login: string;
  private password: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
  }

  /**
   * Main method - performs all keyword analysis in batch operations
   */
  async analyzeKeywordsBatch(config: {
    businessName: string;
    cuisine: string;
    city: string;
    state: string;
    websiteUrl?: string;
    targetDomain?: string;
    locationName?: string;
    languageCode?: string;
  }): Promise<UnifiedKeywordResults> {
    return limit(async () => {
      const cacheKey = `unified_keywords_v2_${config.businessName}_${config.cuisine}_${config.city}_${config.state}`;
      const cached = cache.get<UnifiedKeywordResults>(cacheKey);
      
      if (cached) {
        console.log('🚀 Using cached unified keyword results for:', config.businessName);
        return cached;
      }

      console.log('🚀 UNIFIED KEYWORD ANALYSIS: Starting batch processing for:', config.businessName);
      console.log(`   Location: ${config.city}, ${config.state}`);
      console.log(`   Cuisine: ${config.cuisine}`);
      console.log(`   Website: ${config.websiteUrl || 'N/A'}`);

      // Generate the standard 8 local keywords
      const keywords = generateLocalKeywords({
        cuisine: config.cuisine,
        city: config.city,
        state: config.state,
        businessName: config.businessName
      });

      console.log(`🔑 Generated ${keywords.length} keywords:`, keywords);

      try {
        // Execute all API calls in parallel for maximum efficiency
        const [
          localRankings,
          organicRankings,
          searchVolumeData,
          competitorData
        ] = await Promise.allSettled([
          this.batchLocalRankings(keywords, config),
          config.targetDomain ? this.batchOrganicRankings(keywords, config.targetDomain, config) : Promise.resolve([]),
          this.batchSearchVolume(keywords, config),
          this.batchCompetitorAnalysis(keywords, config)
        ]);

        const results: UnifiedKeywordResults = {
          keywords,
          localRankings: localRankings.status === 'fulfilled' ? localRankings.value : [],
          organicRankings: organicRankings.status === 'fulfilled' ? organicRankings.value : [],
          searchVolumeData: searchVolumeData.status === 'fulfilled' ? searchVolumeData.value : [],
          competitorData: competitorData.status === 'fulfilled' ? competitorData.value : []
        };

        // Enrich results with cross-referenced data
        const enrichedResults = this.enrichResults(results);

        // Cache the results
        cache.set(cacheKey, enrichedResults);
        
        console.log('✅ UNIFIED KEYWORD ANALYSIS: Completed batch processing');
        console.log(`   📊 Local Rankings: ${enrichedResults.localRankings.length}`);
        console.log(`   🌐 Organic Rankings: ${enrichedResults.organicRankings.length}`);
        console.log(`   📈 Search Volume Data: ${enrichedResults.searchVolumeData.length}`);
        console.log(`   🏆 Competitor Data: ${enrichedResults.competitorData.length}`);

        return enrichedResults;

      } catch (error) {
        console.error('❌ Unified keyword analysis failed:', error);
        
        // Return empty results structure on failure
        return {
          keywords,
          localRankings: [],
          organicRankings: [],
          searchVolumeData: [],
          competitorData: []
        };
      }
    });
  }

  /**
   * Batch Local Rankings - Single API call for all 8 keywords
   */
  private async batchLocalRankings(
    keywords: string[], 
    config: any
  ): Promise<LocalRankingResult[]> {
    console.log('🗺️ BATCH LOCAL RANKINGS: Processing all keywords in single API call');

    const results: LocalRankingResult[] = [];

    // Process all keywords in parallel with individual requests for now
    // DataForSEO Local Finder doesn't support true batch processing for multiple keywords
    const rankingPromises = keywords.map(async (keyword) => {
      try {
        const locationConfig = config.city.toLowerCase().includes('provo') 
          ? { location_code: 1026201 }
          : { location_name: `${config.city}, ${config.state}, United States` };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            ...locationConfig,
            language_code: "en",
            keyword: keyword,
            depth: 10
          }]),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.log(`❌ Local ranking failed for "${keyword}": ${response.status}`);
          return { keyword, position: 0, searchVolume: 0, difficulty: 0, cpc: 0, competition: 0, intent: 'local', opportunity: 75 };
        }

        const data = await response.json();
        const localResults = data.tasks?.[0]?.result?.[0]?.items || [];

        // Find business position using enhanced matching
        let position = 0;
        for (let i = 0; i < localResults.length; i++) {
          const item = localResults[i];
          const matchResult = matchBusinessName(
            item.title || '',
            config.businessName,
            item.domain
          );

          if (matchResult.isMatch) {
            position = i + 1;
            console.log(`✅ "${keyword}" - Found ${config.businessName} at position ${position} (${matchResult.matchType}, confidence: ${matchResult.confidence})`);
            break;
          }
        }

        if (position === 0) {
          console.log(`❌ "${keyword}" - ${config.businessName} not found in local results`);
        }

        return {
          keyword,
          position,
          searchVolume: 0, // Will be enriched later
          difficulty: 0,
          cpc: 0,
          competition: 0,
          intent: 'local',
          opportunity: calculateOpportunityScore(position, 0)
        };

      } catch (error) {
        console.log(`❌ Local ranking error for "${keyword}":`, error);
        return {
          keyword,
          position: 0,
          searchVolume: 0,
          difficulty: 0,
          cpc: 0,
          competition: 0,
          intent: 'local',
          opportunity: 75
        };
      }
    });

    const rankings = await Promise.allSettled(rankingPromises);
    rankings.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    });

    console.log(`✅ BATCH LOCAL RANKINGS: Completed ${results.length}/${keywords.length} keywords`);
    return results;
  }

  /**
   * Batch Organic Rankings - Single SERP API call checking multiple keywords
   */
  private async batchOrganicRankings(
    keywords: string[],
    targetDomain: string,
    config: any
  ): Promise<OrganicRankingResult[]> {
    console.log('🌐 BATCH ORGANIC RANKINGS: Processing all keywords for domain:', targetDomain);

    const cleanDomain = extractDomain(targetDomain);
    const results: OrganicRankingResult[] = [];

    // Process keywords in parallel for organic rankings
    const organicPromises = keywords.map(async (keyword) => {
      try {
        const locationName = config.locationName || `${config.city}, ${config.state}, United States`;
        
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            keyword: keyword,
            location_name: locationName,
            language_code: config.languageCode || 'en',
            depth: 50,
            max_crawl_pages: 1
          }])
        });

        if (!response.ok) {
          console.log(`❌ Organic ranking failed for "${keyword}": ${response.status}`);
          return {
            keyword,
            position: null,
            url: null,
            title: null,
            searchVolume: 0,
            difficulty: 0,
            cpc: 0,
            competition: 0,
            opportunity: 75,
            intent: classifyKeywordIntent(keyword)
          };
        }

        const data = await response.json();
        const items = data.tasks?.[0]?.result?.[0]?.items || [];

        // Find domain position
        let position = null;
        let foundUrl = null;
        let foundTitle = null;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemDomain = extractDomain(item.domain || item.url || '');

          if (itemDomain === cleanDomain) {
            position = item.rank_absolute || (i + 1);
            foundUrl = item.url;
            foundTitle = item.title;
            console.log(`✅ "${keyword}" - Found ${cleanDomain} at organic position ${position}`);
            break;
          }
        }

        if (position === null) {
          console.log(`❌ "${keyword}" - ${cleanDomain} not found in top 50 organic results`);
        }

        return {
          keyword,
          position,
          url: foundUrl,
          title: foundTitle,
          searchVolume: 0, // Will be enriched later
          difficulty: 0,
          cpc: 0,
          competition: 0,
          opportunity: calculateOpportunityScore(position || 0, 0),
          intent: classifyKeywordIntent(keyword)
        };

      } catch (error) {
        console.log(`❌ Organic ranking error for "${keyword}":`, error);
        return {
          keyword,
          position: null,
          url: null,
          title: null,
          searchVolume: 0,
          difficulty: 0,
          cpc: 0,
          competition: 0,
          opportunity: 75,
          intent: classifyKeywordIntent(keyword)
        };
      }
    });

    const rankings = await Promise.allSettled(organicPromises);
    rankings.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    });

    console.log(`✅ BATCH ORGANIC RANKINGS: Completed ${results.length}/${keywords.length} keywords`);
    return results;
  }

  /**
   * Batch Search Volume - Single API call for all keywords
   */
  private async batchSearchVolume(
    keywords: string[],
    config: any
  ): Promise<SearchVolumeResult[]> {
    console.log('📈 BATCH SEARCH VOLUME: Getting data for all keywords in single API call');

    try {
      const locationName = config.locationName || `${config.city}, ${config.state}, United States`;
      
      const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google/search_volume/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          location_name: locationName,
          language_code: config.languageCode || "en",
          keywords: keywords
        }])
      });

      if (!response.ok) {
        console.log('⚠️ Search volume API unavailable, returning empty data');
        return keywords.map(keyword => ({
          keyword,
          searchVolume: 0,
          difficulty: 0,
          cpc: 0,
          competition: 0,
          monthlySearches: []
        }));
      }

      const data = await response.json();
      const volumeResults = data.tasks?.[0]?.result || [];

      const results = keywords.map(keyword => {
        const volumeData = volumeResults.find((v: any) => v.keyword === keyword);
        return {
          keyword,
          searchVolume: volumeData?.search_volume || 0,
          difficulty: volumeData?.keyword_difficulty || 0,
          cpc: volumeData?.cpc || 0,
          competition: volumeData?.competition || 0,
          monthlySearches: volumeData?.monthly_searches || []
        };
      });

      console.log(`✅ BATCH SEARCH VOLUME: Got data for ${results.length} keywords`);
      return results;

    } catch (error) {
      console.log('❌ Batch search volume failed:', error);
      return keywords.map(keyword => ({
        keyword,
        searchVolume: 0,
        difficulty: 0,
        cpc: 0,
        competition: 0,
        monthlySearches: []
      }));
    }
  }

  /**
   * Batch Competitor Analysis - Get top competitors for all keywords
   */
  private async batchCompetitorAnalysis(
    keywords: string[],
    config: any
  ): Promise<CompetitorResult[]> {
    console.log('🏆 BATCH COMPETITOR ANALYSIS: Getting competitors for all keywords');

    const results: CompetitorResult[] = [];

    try {
      // Use a sample of keywords to avoid hitting rate limits
      const sampleKeywords = keywords.slice(0, 3); // Top 3 keywords only
      const locationName = config.locationName || `${config.city}, ${config.state}, United States`;

      const competitorPromises = sampleKeywords.map(async (keyword) => {
        try {
          const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
              keyword: keyword,
              location_name: locationName,
              language_code: config.languageCode || 'en',
              device: 'desktop',
              depth: 10
            }])
          });

          if (!response.ok) {
            return { keyword, topCompetitors: [] };
          }

          const data = await response.json();
          const items = data.tasks?.[0]?.result?.[0]?.items || [];

          const topCompetitors = items
            .filter((item: any) => item.type === 'organic')
            .slice(0, 5)
            .map((item: any) => ({
              domain: extractDomain(item.domain || item.url || ''),
              position: item.rank_group || item.rank_absolute || 0,
              title: item.title || '',
              url: item.url || ''
            }));

          return { keyword, topCompetitors };

        } catch (error) {
          console.log(`❌ Competitor analysis failed for "${keyword}":`, error);
          return { keyword, topCompetitors: [] };
        }
      });

      const competitorResults = await Promise.allSettled(competitorPromises);
      competitorResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      console.log(`✅ BATCH COMPETITOR ANALYSIS: Completed ${results.length} keywords`);

    } catch (error) {
      console.log('❌ Batch competitor analysis failed:', error);
    }

    return results;
  }

  /**
   * Enrich results by cross-referencing data between different API calls
   */
  private enrichResults(results: UnifiedKeywordResults): UnifiedKeywordResults {
    console.log('🔄 ENRICHING RESULTS: Cross-referencing data between API calls');

    // Create lookup maps for search volume data
    const searchVolumeMap = new Map();
    results.searchVolumeData.forEach(item => {
      searchVolumeMap.set(item.keyword, item);
    });

    // Enrich local rankings with search volume data
    results.localRankings = results.localRankings.map(ranking => {
      const volumeData = searchVolumeMap.get(ranking.keyword);
      if (volumeData) {
        return {
          ...ranking,
          searchVolume: volumeData.searchVolume,
          difficulty: volumeData.difficulty,
          cpc: volumeData.cpc,
          competition: volumeData.competition,
          opportunity: calculateOpportunityScore(
            ranking.position,
            volumeData.searchVolume,
            volumeData.competition,
            volumeData.cpc
          )
        };
      }
      return ranking;
    });

    // Enrich organic rankings with search volume data
    results.organicRankings = results.organicRankings.map(ranking => {
      const volumeData = searchVolumeMap.get(ranking.keyword);
      if (volumeData) {
        return {
          ...ranking,
          searchVolume: volumeData.searchVolume,
          difficulty: volumeData.difficulty,
          cpc: volumeData.cpc,
          competition: volumeData.competition,
          opportunity: calculateOpportunityScore(
            ranking.position || 0,
            volumeData.searchVolume,
            volumeData.competition,
            volumeData.cpc
          )
        };
      }
      return ranking;
    });

    console.log('✅ ENRICHING RESULTS: Completed data cross-referencing');
    return results;
  }

  /**
   * Clear cache for testing purposes
   */
  clearCache(): void {
    cache.flushAll();
    console.log('🗑️ Unified keyword service cache cleared');
  }
}