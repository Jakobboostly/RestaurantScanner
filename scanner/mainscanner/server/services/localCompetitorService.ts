/**
 * Local Competitor Service - Gets top 5 restaurant competitors for local keywords
 * Uses DataForSEO Google Local Finder API and Maps API for accurate local results
 */

import NodeCache from 'node-cache';
import pLimit from 'p-limit';

const limit = pLimit(3); // Limit concurrent API calls
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export interface LocalCompetitor {
  name: string;
  position: number;
  rating: number;
  reviewCount: number;
  address: string;
  domain?: string;
  priceLevel?: string;
  category?: string;
  phone?: string;
}

export interface KeywordCompetitors {
  keyword: string;
  searchVolume: number;
  yourPosition: number;
  topCompetitors: LocalCompetitor[];
}

export class LocalCompetitorService {
  private login: string;
  private password: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
  }

  /**
   * Get top 5 restaurant competitors for all 8 keywords
   */
  async getLocalCompetitors(config: {
    businessName: string;
    cuisine: string;
    city: string;
    state: string;
    keywords: string[];
  }): Promise<KeywordCompetitors[]> {
    const cacheKey = `local_competitors_${config.businessName}_${config.city}_${config.state}`;
    const cached = cache.get<KeywordCompetitors[]>(cacheKey);
    
    if (cached) {
      console.log('🚀 Using cached local competitor results');
      return cached;
    }

    console.log('🏆 LOCAL COMPETITOR ANALYSIS: Starting for', config.businessName);
    console.log(`   Location: ${config.city}, ${config.state}`);
    console.log(`   Keywords: ${config.keywords.length}`);

    const results: KeywordCompetitors[] = [];

    // Process each keyword using the appropriate API endpoint
    const competitorPromises = config.keywords.map(keyword => 
      limit(() => this.getCompetitorsForKeyword(keyword, config))
    );

    const competitorResults = await Promise.allSettled(competitorPromises);
    
    competitorResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    // Cache the results
    cache.set(cacheKey, results);
    
    console.log(`✅ LOCAL COMPETITOR ANALYSIS: Found competitors for ${results.length}/${config.keywords.length} keywords`);
    
    return results;
  }

  /**
   * Get competitors for a single keyword using the optimal API endpoint
   */
  private async getCompetitorsForKeyword(
    keyword: string,
    config: {
      businessName: string;
      cuisine: string;
      city: string;
      state: string;
    }
  ): Promise<KeywordCompetitors | null> {
    try {
      // Determine which API to use based on keyword type
      const useLocalFinder = this.shouldUseLocalFinder(keyword);
      
      if (useLocalFinder) {
        return await this.getLocalFinderCompetitors(keyword, config);
      } else {
        return await this.getMapsCompetitors(keyword, config);
      }
    } catch (error) {
      console.log(`❌ Failed to get competitors for "${keyword}":`, error);
      return null;
    }
  }

  /**
   * Use Google Local Finder API for "near me" and local intent keywords
   */
  private async getLocalFinderCompetitors(
    keyword: string,
    config: any
  ): Promise<KeywordCompetitors | null> {
    console.log(`🗺️ Using Local Finder API for: "${keyword}"`);

    try {
      const locationConfig = config.city.toLowerCase().includes('provo')
        ? { location_code: 1026201 }
        : { location_name: `${config.city},${config.state},United States` };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.dataforseo.com/v3/serp/google/local_finder/live/advanced', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          ...locationConfig,
          language_code: "en",
          keyword: keyword,
          device: "mobile", // Mobile for "near me" searches
          os: "ios",
          depth: 20 // Get top 20 to ensure we have enough results
        }]),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`❌ Local Finder API failed for "${keyword}": ${response.status}`);
        return null;
      }

      const data = await response.json();
      const items = data.tasks?.[0]?.result?.[0]?.items || [];
      
      // Extract local pack results
      const localPackItems = items.filter((item: any) => 
        item.type === 'local_pack' || item.type === 'maps_search'
      );

      const localResults = localPackItems.length > 0 
        ? localPackItems[0].items || []
        : items.filter((item: any) => item.type === 'local_finder_element');

      // Find target restaurant position and extract top 5 competitors
      let yourPosition = 0;
      const topCompetitors: LocalCompetitor[] = [];
      
      for (let i = 0; i < Math.min(localResults.length, 20); i++) {
        const item = localResults[i];
        
        // Check if this is the target restaurant
        if (this.isTargetRestaurant(item.title, config.businessName)) {
          yourPosition = i + 1;
        }
        
        // Add to top competitors if within top 5
        if (topCompetitors.length < 5) {
          topCompetitors.push({
            name: item.title || 'Unknown Restaurant',
            position: i + 1,
            rating: item.rating?.value || 0,
            reviewCount: item.rating?.votes_count || 0,
            address: item.address || item.address_info?.address || '',
            domain: item.domain || item.url || '',
            priceLevel: item.hotel_info?.price_level || item.price_level || '',
            category: item.category || item.type || 'Restaurant',
            phone: item.phone || ''
          });
        }
      }

      // Get search volume (would come from separate API call)
      const searchVolume = await this.getSearchVolume(keyword, config);

      return {
        keyword,
        searchVolume,
        yourPosition,
        topCompetitors
      };

    } catch (error) {
      console.log(`❌ Local Finder error for "${keyword}":`, error);
      return null;
    }
  }

  /**
   * Use Google Maps API for city/state specific searches
   */
  private async getMapsCompetitors(
    keyword: string,
    config: any
  ): Promise<KeywordCompetitors | null> {
    console.log(`📍 Using Maps API for: "${keyword}"`);

    try {
      const locationConfig = config.city.toLowerCase().includes('provo')
        ? { location_code: 1026201 }
        : { location_name: `${config.city},${config.state},United States` };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
          depth: 20
        }]),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`❌ Maps API failed for "${keyword}": ${response.status}`);
        return null;
      }

      const data = await response.json();
      const items = data.tasks?.[0]?.result?.[0]?.items || [];

      // Find target restaurant position and extract top 5 competitors
      let yourPosition = 0;
      const topCompetitors: LocalCompetitor[] = [];
      
      for (let i = 0; i < Math.min(items.length, 20); i++) {
        const item = items[i];
        
        // Check if this is the target restaurant
        if (this.isTargetRestaurant(item.title, config.businessName)) {
          yourPosition = i + 1;
        }
        
        // Add to top competitors if within top 5
        if (topCompetitors.length < 5 && item.type === 'maps_search') {
          topCompetitors.push({
            name: item.title || 'Unknown Restaurant',
            position: i + 1,
            rating: item.rating?.value || 0,
            reviewCount: item.rating?.votes_count || 0,
            address: item.address || '',
            domain: item.domain || item.url || '',
            priceLevel: item.price_level || '',
            category: item.category || 'Restaurant',
            phone: item.phone || ''
          });
        }
      }

      // Get search volume
      const searchVolume = await this.getSearchVolume(keyword, config);

      return {
        keyword,
        searchVolume,
        yourPosition,
        topCompetitors
      };

    } catch (error) {
      console.log(`❌ Maps API error for "${keyword}":`, error);
      return null;
    }
  }

  /**
   * Get search volume for a keyword
   */
  private async getSearchVolume(keyword: string, config: any): Promise<number> {
    try {
      // Try to get search volume with location-specific data
      const locationName = `${config.city},${config.state},United States`;
      
      const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          keywords: [keyword],
          location_name: locationName,
          language_code: "en"
        }])
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.tasks?.[0]?.result?.[0];
        return result?.search_volume || 0;
      }
    } catch (error) {
      console.log(`⚠️ Could not get search volume for "${keyword}"`);
    }
    
    // Return estimated volume based on keyword type
    if (keyword.includes('near me')) return 1000;
    if (keyword.includes('delivery')) return 800;
    if (keyword.includes('best')) return 600;
    return 500;
  }

  /**
   * Determine if we should use Local Finder API based on keyword
   */
  private shouldUseLocalFinder(keyword: string): boolean {
    const localFinderKeywords = [
      'near me',
      'nearby',
      'close by',
      'around me',
      'delivery',
      'takeout',
      'open now',
      'open late',
      'places'
    ];
    
    return localFinderKeywords.some(term => keyword.toLowerCase().includes(term));
  }

  /**
   * Check if a business name matches the target restaurant
   */
  private isTargetRestaurant(itemName: string, targetName: string): boolean {
    if (!itemName || !targetName) return false;
    
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/restaurant|cafe|kitchen|grill|bar|pub|bistro|diner/g, '');
    
    const normalizedItem = normalize(itemName);
    const normalizedTarget = normalize(targetName);
    
    // Check for exact match
    if (normalizedItem === normalizedTarget) return true;
    
    // Check if one contains the other (for variations)
    if (normalizedItem.includes(normalizedTarget) || normalizedTarget.includes(normalizedItem)) {
      return true;
    }
    
    // Check for significant overlap (at least 70% match)
    const minLength = Math.min(normalizedItem.length, normalizedTarget.length);
    const maxLength = Math.max(normalizedItem.length, normalizedTarget.length);
    let matches = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (normalizedItem[i] === normalizedTarget[i]) matches++;
    }
    
    return (matches / maxLength) >= 0.7;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    cache.flushAll();
    console.log('🗑️ Local competitor service cache cleared');
  }
}