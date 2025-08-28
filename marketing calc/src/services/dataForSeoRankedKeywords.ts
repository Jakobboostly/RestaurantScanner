import { 
  DataForSeoRankedKeywordsResponse, 
  RankedKeywordRequest, 
  KeywordFetchResult,
  DataForSeoRankedKeyword 
} from '../types/dataForSeoRankedKeywords';
import { KeywordData } from './revenueCalculations';
import { RestaurantCache } from '../utils/cache';

/**
 * Service for fetching ranked keywords using DataForSEO API
 */
class DataForSeoRankedKeywordsService {
  private baseUrl = 'https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live';
  private credentials = {
    user: 'jakob@boostly.com',
    password: 'eba05fd94be85e56'
  };

  /**
   * Extract domain from website URL
   */
  private extractDomain(websiteUrl: string): string {
    try {
      const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      return url.hostname.replace(/^www\./, '');
    } catch (error) {
      // If URL parsing fails, try basic string manipulation
      return websiteUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .toLowerCase();
    }
  }

  /**
   * Fetch ranked keywords for a domain
   */
  async fetchRankedKeywords(websiteUrl: string): Promise<KeywordFetchResult> {
    const domain = this.extractDomain(websiteUrl);

    // Check cache first (7-day cache)
    const cacheKey = `ranked_keywords_${domain}`;
    const cached = RestaurantCache.getCachedSocialMediaData(cacheKey);
    if (cached) {
      console.log(`Using cached ranked keywords for ${domain}`);
      return cached as KeywordFetchResult;
    }

    const requestPayload: RankedKeywordRequest = {
      target: domain,
      language_name: "English",
      location_code: 2840, // United States
      limit: 12
    };

    try {
      console.log(`Fetching ranked keywords for domain: ${domain}`);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.credentials.user}:${this.credentials.password}`)}`
        },
        body: JSON.stringify([requestPayload])
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data: DataForSeoRankedKeywordsResponse = await response.json();
      
      console.log('DataForSEO Ranked Keywords Response:', JSON.stringify(data, null, 2));
      
      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${data.status_message}`);
      }

      const keywords: DataForSeoRankedKeyword[] = [];
      let totalCount = 0;
      
      if (data.tasks && data.tasks.length > 0) {
        const task = data.tasks[0];
        console.log('Processing task:', task);
        
        if (task.result && task.result.length > 0) {
          const result = task.result[0];
          totalCount = result.total_count || 0;
          console.log(`Total count: ${totalCount}, Result structure:`, result);
          
          if (result.items && result.items.length > 0) {
            console.log('Raw DataForSEO items:', JSON.stringify(result.items.slice(0, 2), null, 2)); // Log first 2 items for debugging
            keywords.push(...result.items);
          } else {
            console.log('No items found in DataForSEO result. Result keys:', Object.keys(result));
          }
        } else {
          console.log('No result found in task. Task keys:', Object.keys(task));
        }
      } else {
        console.log('No tasks found in response. Response keys:', Object.keys(data));
      }

      const result: KeywordFetchResult = {
        success: true,
        keywords: keywords,
        domain: domain,
        total_count: totalCount
      };

      // Cache for 7 days
      RestaurantCache.cacheSocialMediaData(cacheKey, result);
      
      console.log(`Found ${keywords.length} ranked keywords for ${domain} (${totalCount} total)`);
      return result;

    } catch (error) {
      console.error('DataForSEO Ranked Keywords API error:', error);
      
      const result: KeywordFetchResult = {
        success: false,
        keywords: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        domain: domain
      };

      return result;
    }
  }

  /**
   * Convert DataForSEO keyword to internal KeywordData format
   */
  convertToKeywordData(apiKeyword: DataForSeoRankedKeyword): KeywordData {
    // Extract data from the nested structure
    const keywordData = (apiKeyword as any).keyword_data;
    const serpElement = (apiKeyword as any).ranked_serp_element?.serp_item;
    
    const keyword = keywordData?.keyword || 'Unknown keyword';
    const searchVolume = keywordData?.keyword_info?.search_volume || 0;
    const position = serpElement?.rank_absolute || 0;
    const cpc = keywordData?.keyword_info?.cpc || 0;
    
    // Determine if this is a Local Pack result based on SERP features
    const serpInfo = keywordData?.serp_info;
    const hasLocalFeatures = serpInfo?.serp_item_types?.some((type: string) => 
      type.includes('local') || 
      type.includes('map') || 
      type.includes('pack')
    ) || false;
    
    // Position 1-3 with local features or location-based keywords typically indicates Local Pack
    const isLocalPack = hasLocalFeatures || (position <= 3 && 
      (keyword.includes('near me') || 
       keyword.includes('restaurant') ||
       keyword.includes('pizza') ||
       keyword.includes('food')));

    // Calculate target position (try to improve by 1-3 positions, minimum position 1)
    const targetPosition = Math.max(1, position - Math.min(3, Math.floor(position / 2)));
    
    console.log(`Extracted - keyword: "${keyword}", searchVolume: ${searchVolume}, position: ${position}, cpc: ${cpc}`);
    
    return {
      keyword: keyword,
      searchVolume: searchVolume,
      currentPosition: position,
      targetPosition: targetPosition,
      isLocalPack: isLocalPack
    };
  }

  /**
   * Fetch and convert keywords to internal format
   */
  async fetchKeywordsAsKeywordData(websiteUrl: string): Promise<{
    success: boolean;
    keywords: KeywordData[];
    error?: string;
    totalKeywords?: number;
    domain?: string;
  }> {
    try {
      const result = await this.fetchRankedKeywords(websiteUrl);
      
      if (!result.success) {
        console.log('DataForSEO fetch failed:', result.error);
        return {
          success: false,
          keywords: [],
          error: result.error,
          domain: result.domain
        };
      }

      console.log(`Converting ${result.keywords.length} keywords to internal format`);
      const keywordData = result.keywords.map(keyword => {
        try {
          return this.convertToKeywordData(keyword);
        } catch (conversionError) {
          console.error('Error converting keyword:', keyword, conversionError);
          // Return a safe default if conversion fails
          return {
            keyword: keyword.keyword || 'Unknown keyword',
            searchVolume: 0,
            currentPosition: 0,
            targetPosition: 1,
            isLocalPack: false
          };
        }
      });

      return {
        success: true,
        keywords: keywordData,
        totalKeywords: result.total_count,
        domain: result.domain
      };
    } catch (error) {
      console.error('Unexpected error in fetchKeywordsAsKeywordData:', error);
      return {
        success: false,
        keywords: [],
        error: error instanceof Error ? error.message : 'Unexpected error',
        domain: this.extractDomain(websiteUrl)
      };
    }
  }

  /**
   * Check if service is configured (always true since credentials are hardcoded)
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Get configuration status for debugging
   */
  getStatus(): { configured: boolean; hasCredentials: boolean } {
    return {
      configured: true,
      hasCredentials: !!(this.credentials.user && this.credentials.password)
    };
  }
}

export const dataForSeoRankedKeywordsAPI = new DataForSeoRankedKeywordsService();