/**
 * Optimized Local Competitor Service - Batched API calls for efficiency
 * Reduces API calls from 16 to 2 by batching all keywords in single requests
 * Uses DataForSEO Google Local Finder API and Maps API for accurate local results
 */

import pLimit from 'p-limit';

const limit = pLimit(2); // Reduced limit since we're batching

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

export class LocalCompetitorServiceOptimized {
  private login: string;
  private password: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
  }

  /**
   * Get top 5 restaurant competitors for all 8 keywords using BATCHED API calls
   * Reduces API calls from 16 to 2 (1 for Local Finder, 1 for Maps)
   */
  async getLocalCompetitors(config: {
    businessName: string;
    cuisine: string;
    city: string;
    state: string;
    keywords: string[];
  }): Promise<KeywordCompetitors[]> {

    console.log('🚀 OPTIMIZED LOCAL COMPETITOR ANALYSIS: Starting batched analysis');
    console.log(`   Location: ${config.city}, ${config.state}`);
    console.log(`   Keywords: ${config.keywords.length}`);
    console.log(`   Using BATCHED API calls for efficiency`);

    // Separate keywords by type for appropriate API endpoint
    const localFinderKeywords = config.keywords.filter(k => this.shouldUseLocalFinder(k));
    const mapsKeywords = config.keywords.filter(k => !this.shouldUseLocalFinder(k));

    console.log(`   Local Finder keywords: ${localFinderKeywords.length}`);
    console.log(`   Maps keywords: ${mapsKeywords.length}`);

    // Execute batched API calls in parallel
    const [localFinderResults, mapsResults, searchVolumeData] = await Promise.all([
      localFinderKeywords.length > 0 ? this.batchLocalFinderCompetitors(localFinderKeywords, config) : new Map(),
      mapsKeywords.length > 0 ? this.batchMapsCompetitors(mapsKeywords, config) : new Map(),
      this.batchSearchVolume(config.keywords, config)
    ]);

    // Combine results from both APIs
    const results: KeywordCompetitors[] = [];
    
    for (const keyword of config.keywords) {
      const competitorData = localFinderResults.get(keyword) || mapsResults.get(keyword);
      const volumeData = searchVolumeData.get(keyword) || { searchVolume: 0 };
      
      if (competitorData) {
        results.push({
          ...competitorData,
          searchVolume: volumeData.searchVolume
        });
      }
    }
    
    console.log(`✅ OPTIMIZED: Found competitors for ${results.length}/${config.keywords.length} keywords`);
    console.log(`   Total API calls made: ${localFinderKeywords.length > 0 ? 1 : 0} + ${mapsKeywords.length > 0 ? 1 : 0} + 1 = ${(localFinderKeywords.length > 0 ? 1 : 0) + (mapsKeywords.length > 0 ? 1 : 0) + 1}`);
    
    return results;
  }

  /**
   * BATCHED Local Finder API call - processes all keywords in ONE request
   */
  private async batchLocalFinderCompetitors(
    keywords: string[],
    config: any
  ): Promise<Map<string, KeywordCompetitors>> {
    console.log(`🗺️ BATCH Local Finder API: ${keywords.length} keywords in 1 call`);

    const results = new Map<string, KeywordCompetitors>();

    try {
      // Prepare location config (handle special cases like Provo)
      const locationConfig = config.city.toLowerCase().includes('provo')
        ? { location_code: 1026201 }
        : { location_name: `${config.city},${config.state},United States` };

      // Build array of tasks for batch request
      const tasks = keywords.map(keyword => ({
        ...locationConfig,
        language_code: "en",
        keyword: keyword,
        device: "mobile", // Mobile for "near me" searches
        os: "ios",
        depth: 20, // Get top 20 to ensure we have enough results
        min_rating: 3.5, // Optional: filter by minimum rating
        tag: `${config.businessName}_${keyword}` // Tag for tracking
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for batch

      const response = await fetch('https://api.dataforseo.com/v3/serp/google/local_finder/live/advanced', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasks),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`❌ Batch Local Finder API failed: ${response.status}`);
        return results;
      }

      const data = await response.json();
      
      // Process each task result
      data.tasks?.forEach((task: any, index: number) => {
        const keyword = keywords[index];
        
        if (task.status_code !== 20000) {
          console.log(`⚠️ Task failed for "${keyword}": ${task.status_message}`);
          return;
        }

        const items = task.result?.[0]?.items || [];
        
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

        results.set(keyword, {
          keyword,
          searchVolume: 0, // Will be filled by batch search volume
          yourPosition,
          topCompetitors
        });
      });

      console.log(`✅ Batch Local Finder completed: ${results.size} keywords processed`);
      return results;

    } catch (error) {
      console.log(`❌ Batch Local Finder error:`, error);
      return results;
    }
  }

  /**
   * BATCHED Maps API call - processes all keywords in ONE request
   */
  private async batchMapsCompetitors(
    keywords: string[],
    config: any
  ): Promise<Map<string, KeywordCompetitors>> {
    console.log(`📍 BATCH Maps API: ${keywords.length} keywords in 1 call`);

    const results = new Map<string, KeywordCompetitors>();

    try {
      const locationConfig = config.city.toLowerCase().includes('provo')
        ? { location_code: 1026201 }
        : { location_name: `${config.city},${config.state},United States` };

      // Build array of tasks for batch request
      const tasks = keywords.map(keyword => ({
        ...locationConfig,
        language_code: "en",
        keyword: keyword,
        depth: 20,
        tag: `${config.businessName}_${keyword}`
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasks),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`❌ Batch Maps API failed: ${response.status}`);
        return results;
      }

      const data = await response.json();
      
      // Process each task result
      data.tasks?.forEach((task: any, index: number) => {
        const keyword = keywords[index];
        
        if (task.status_code !== 20000) {
          console.log(`⚠️ Task failed for "${keyword}": ${task.status_message}`);
          return;
        }

        const items = task.result?.[0]?.items || [];

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
          if (topCompetitors.length < 5) {
            topCompetitors.push({
              name: item.title || 'Unknown Restaurant',
              position: i + 1,
              rating: item.rating?.value || 0,
              reviewCount: item.rating?.votes_count || 0,
              address: item.address || '',
              domain: item.domain || item.url || '',
              priceLevel: item.price?.level || '',
              category: item.category || 'Restaurant',
              phone: item.phone || ''
            });
          }
        }

        results.set(keyword, {
          keyword,
          searchVolume: 0, // Will be filled by batch search volume
          yourPosition,
          topCompetitors
        });
      });

      console.log(`✅ Batch Maps completed: ${results.size} keywords processed`);
      return results;

    } catch (error) {
      console.log(`❌ Batch Maps error:`, error);
      return results;
    }
  }

  /**
   * BATCHED Search Volume - gets volume for all keywords in ONE request
   */
  private async batchSearchVolume(
    keywords: string[],
    config: any
  ): Promise<Map<string, { searchVolume: number }>> {
    console.log(`📊 BATCH Search Volume: ${keywords.length} keywords in 1 call`);

    const results = new Map<string, { searchVolume: number }>();

    try {
      const locationName = `${config.city},${config.state},United States`;
      
      // Calculate date range (3 months ago to now)
      const today = new Date();
      const threeMonthsAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3, 1));
      const dateFrom = `${threeMonthsAgo.getUTCFullYear()}-${String(threeMonthsAgo.getUTCMonth() + 1).padStart(2, '0')}-01`;

      const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          keywords: keywords, // All keywords in one request (max 20)
          location_name: locationName,
          language_code: 'en',
          search_partners: true,
          date_from: dateFrom,
          sort_by: 'search_volume'
        }])
      });

      if (!response.ok) {
        console.log(`❌ Batch search volume failed: ${response.status}`);
        // Return 0 volumes as fallback
        keywords.forEach(keyword => {
          results.set(keyword, { searchVolume: 0 });
        });
        return results;
      }

      const data = await response.json();
      const items = data.tasks?.[0]?.result || [];

      // Map results back to keywords
      keywords.forEach(keyword => {
        const item = items.find((it: any) => 
          it.keyword?.toLowerCase() === keyword.toLowerCase()
        );
        
        const searchVolume = item?.search_volume || 0;
        results.set(keyword, { searchVolume });
      });

      console.log(`✅ Batch search volume completed: ${results.size} keywords processed`);
      return results;

    } catch (error) {
      console.log(`❌ Batch search volume error:`, error);
      // Return 0 volumes as fallback
      keywords.forEach(keyword => {
        results.set(keyword, { searchVolume: 0 });
      });
      return results;
    }
  }

  /**
   * Determine if we should use Local Finder (mobile) or Maps API
   */
  private shouldUseLocalFinder(keyword: string): boolean {
    const lowerKeyword = keyword.toLowerCase();
    
    // Use Local Finder for "near me" and local intent keywords
    if (lowerKeyword.includes('near me') ||
        lowerKeyword.includes('nearby') ||
        lowerKeyword.includes('close by') ||
        lowerKeyword.includes('around here')) {
      return true;
    }
    
    // Use Maps for city/state specific searches
    return false;
  }

  /**
   * Check if a business name matches the target restaurant
   */
  private isTargetRestaurant(businessName: string, targetName: string): boolean {
    if (!businessName || !targetName) return false;
    
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/restaurant|cafe|bar|grill|kitchen|bistro|pizzeria|diner/g, '');
    
    const normalizedBusiness = normalize(businessName);
    const normalizedTarget = normalize(targetName);
    
    // Check for exact match or contains
    return normalizedBusiness === normalizedTarget ||
           normalizedBusiness.includes(normalizedTarget) ||
           normalizedTarget.includes(normalizedBusiness);
  }
}