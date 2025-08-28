import { PlaceDetails, RestaurantIntelligence } from '../services/placesAPI';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

export class Cache {
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private static readonly STORAGE_PREFIX = 'restaurant_cache_';
  
  /**
   * Store data in cache with 7-day expiry
   */
  static set<T>(key: string, data: T): void {
    const now = Date.now();
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiryTime: now + this.CACHE_DURATION
    };
    
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
      console.log(`Cached data for key: ${key} (expires in 7 days)`);
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // If localStorage is full or unavailable, silently fail
    }
  }
  
  /**
   * Retrieve data from cache if not expired
   */
  static get<T>(key: string): T | null {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const cached = localStorage.getItem(storageKey);
      
      if (!cached) {
        return null;
      }
      
      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache entry has expired
      if (now > cacheEntry.expiryTime) {
        console.log(`Cache expired for key: ${key}, removing...`);
        this.remove(key);
        return null;
      }
      
      const daysRemaining = Math.ceil((cacheEntry.expiryTime - now) / (24 * 60 * 60 * 1000));
      console.log(`Retrieved cached data for key: ${key} (expires in ${daysRemaining} days)`);
      return cacheEntry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }
  
  /**
   * Remove data from cache
   */
  static remove(key: string): void {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }
  
  /**
   * Clear all restaurant cache entries
   */
  static clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  static getStats(): { totalEntries: number; totalSize: number } {
    let totalEntries = 0;
    let totalSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          totalEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
    
    return { totalEntries, totalSize };
  }
}

// Specialized cache methods for restaurant data
export class RestaurantCache {
  /**
   * Cache Google Places details by place ID
   */
  static cachePlaceDetails(placeId: string, details: PlaceDetails): void {
    Cache.set(`place_details_${placeId}`, details);
  }
  
  /**
   * Get cached Google Places details by place ID
   */
  static getCachedPlaceDetails(placeId: string): PlaceDetails | null {
    return Cache.get<PlaceDetails>(`place_details_${placeId}`);
  }
  
  /**
   * Cache restaurant intelligence data by place ID
   */
  static cacheRestaurantIntelligence(placeId: string, intelligence: RestaurantIntelligence): void {
    Cache.set(`restaurant_intelligence_${placeId}`, intelligence);
  }
  
  /**
   * Get cached restaurant intelligence data by place ID
   */
  static getCachedRestaurantIntelligence(placeId: string): RestaurantIntelligence | null {
    return Cache.get<RestaurantIntelligence>(`restaurant_intelligence_${placeId}`);
  }
  
  /**
   * Cache social media detection results by place ID
   */
  static cacheSocialMediaData(placeId: string, socialData: any): void {
    Cache.set(`social_media_${placeId}`, socialData);
  }
  
  /**
   * Get cached social media data by place ID
   */
  static getCachedSocialMediaData(placeId: string): any | null {
    return Cache.get<any>(`social_media_${placeId}`);
  }

  /**
   * Cache keyword data by domain and location
   */
  static cacheKeywordData(domain: string, location: string, keywordData: any): void {
    Cache.set(`keywords_${domain}_${location}`, keywordData);
  }
  
  /**
   * Get cached keyword data by domain and location
   */
  static getCachedKeywordData(domain: string, location: string): any | null {
    return Cache.get<any>(`keywords_${domain}_${location}`);
  }

  /**
   * Cache keyword data by place ID (alternative method)
   */
  static cacheKeywordDataByPlaceId(placeId: string, keywordData: any): void {
    Cache.set(`keywords_place_${placeId}`, keywordData);
  }
  
  /**
   * Get cached keyword data by place ID (alternative method)
   */
  static getCachedKeywordDataByPlaceId(placeId: string): any | null {
    return Cache.get<any>(`keywords_place_${placeId}`);
  }
  
  /**
   * Check if we have any cached data for a place ID
   */
  static hasCachedData(placeId: string): boolean {
    return (
      this.getCachedPlaceDetails(placeId) !== null ||
      this.getCachedRestaurantIntelligence(placeId) !== null ||
      this.getCachedSocialMediaData(placeId) !== null
    );
  }
  
  /**
   * Remove all cached data for a specific place ID
   */
  static clearPlaceCache(placeId: string): void {
    Cache.remove(`place_details_${placeId}`);
    Cache.remove(`restaurant_intelligence_${placeId}`);
    Cache.remove(`social_media_${placeId}`);
  }
}