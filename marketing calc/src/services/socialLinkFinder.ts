// import { ApifyClient } from 'apify-client';
import { config } from '../config/api';
import { RestaurantCache } from '../utils/cache';

export interface SocialMediaProfile {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
  pinterest?: string;
}

export interface SocialDetectionResult {
  profiles: SocialMediaProfile;
  detectionMethod: 'apify';
  confidence: 'high' | 'medium' | 'low';
  success: boolean;
  error?: string;
}

class SocialLinkFinderService {
  private client?: any; // ApifyClient;
  private cache = new Map<string, SocialDetectionResult>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Temporarily disabled for browser compatibility
    // if (config.apify.token) {
    //   this.client = new ApifyClient({ token: config.apify.token });
    // }
  }

  /**
   * Detect social media profiles for a restaurant using Apify (with persistent caching)
   */
  async detectSocialProfiles(placeId: string): Promise<SocialDetectionResult> {
    // Check persistent cache first (7-day cache)
    const cachedData = RestaurantCache.getCachedSocialMediaData(placeId);
    if (cachedData) {
      console.log('Using cached social profiles from localStorage for:', placeId);
      return cachedData;
    }

    // Check in-memory cache as fallback
    const memoryCache = this.cache.get(placeId);
    if (memoryCache && this.isCacheValid(memoryCache)) {
      console.log('Using cached social profiles from memory for:', placeId);
      return memoryCache;
    }

    if (!config.apify.token) {
      return {
        profiles: {},
        detectionMethod: 'apify',
        confidence: 'low',
        success: false,
        error: 'Apify token not configured'
      };
    }

    try {
      console.log('Detecting social profiles for place ID:', placeId);

      const input = {
        language: 'en',
        placeIds: [placeId],
        scrapeContacts: true,
        website: 'withWebsite',
        scrapePlaceDetailPage: true
      };

      // Call Apify API directly
      const runResponse = await fetch(`https://api.apify.com/v2/acts/${config.apify.actorId}/runs?token=${config.apify.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
      });

      if (!runResponse.ok) {
        throw new Error(`Apify run failed: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${config.apify.token}`);
        const statusData = await statusResponse.json();
        
        if (statusData.data.status === 'SUCCEEDED') {
          // Get results
          const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?token=${config.apify.token}`);
          const items = await resultsResponse.json();

          if (!items || items.length === 0) {
            const result: SocialDetectionResult = {
              profiles: {},
              detectionMethod: 'apify',
              confidence: 'low',
              success: false,
              error: 'No data returned from Apify'
            };
            this.cacheResult(placeId, result);
            return result;
          }

          const place = items[0];
          const profiles: SocialMediaProfile = {};

          // Extract social media profiles
          if (place.instagrams && place.instagrams.length > 0) {
            profiles.instagram = this.cleanUrl(place.instagrams[0]);
          }

          if (place.facebooks && place.facebooks.length > 0) {
            profiles.facebook = this.cleanUrl(place.facebooks[0]);
          }

          if (place.linkedIns && place.linkedIns.length > 0) {
            profiles.linkedin = this.cleanUrl(place.linkedIns[0]);
          }

          if (place.youtubes && place.youtubes.length > 0) {
            profiles.youtube = this.cleanUrl(place.youtubes[0]);
          }

          if (place.tiktoks && place.tiktoks.length > 0) {
            profiles.tiktok = this.cleanUrl(place.tiktoks[0]);
          }

          if (place.twitters && place.twitters.length > 0) {
            profiles.twitter = this.cleanUrl(place.twitters[0]);
          }

          if (place.pinterests && place.pinterests.length > 0) {
            profiles.pinterest = this.cleanUrl(place.pinterests[0]);
          }

          // Determine confidence based on how many profiles we found
          let confidence: 'high' | 'medium' | 'low' = 'low';
          const profileCount = Object.keys(profiles).length;
          if (profileCount >= 3) {
            confidence = 'high';
          } else if (profileCount >= 1) {
            confidence = 'medium';
          }

          const result: SocialDetectionResult = {
            profiles,
            detectionMethod: 'apify',
            confidence,
            success: true
          };

          console.log('Social detection result:', result);
          this.cacheResult(placeId, result);
          // Also cache in persistent storage for 7 days
          RestaurantCache.cacheSocialMediaData(placeId, result);
          return result;
        } else if (statusData.data.status === 'FAILED') {
          throw new Error('Apify run failed');
        }
        
        attempts++;
      }

      throw new Error('Apify run timeout');

    } catch (error) {
      console.error('Error detecting social profiles:', error);
      const result: SocialDetectionResult = {
        profiles: {},
        detectionMethod: 'apify',
        confidence: 'low',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      this.cacheResult(placeId, result);
      // Cache error result for shorter duration (memory only)
      return result;
    }


  }

  /**
   * Clean and normalize social media URLs
   */
  private cleanUrl(url: string): string {
    if (!url) return '';
    
    let cleanUrl = url.trim();
    
    // Add protocol if missing
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    try {
      const urlObj = new URL(cleanUrl);
      
      // Remove tracking parameters and fragments
      urlObj.search = '';
      urlObj.hash = '';
      
      // Ensure consistent domains
      if (urlObj.hostname === 'fb.com') {
        urlObj.hostname = 'facebook.com';
      }
      if (urlObj.hostname === 'instagr.am') {
        urlObj.hostname = 'instagram.com';
      }
      
      // Add www prefix for main platforms
      if (['facebook.com', 'instagram.com'].includes(urlObj.hostname)) {
        urlObj.hostname = 'www.' + urlObj.hostname;
      }
      
      // Remove trailing slash
      let finalUrl = urlObj.toString();
      if (finalUrl.endsWith('/')) {
        finalUrl = finalUrl.slice(0, -1);
      }
      
      return finalUrl;
    } catch (error) {
      console.error('Error cleaning URL:', error);
      return url; // Return original if cleaning fails
    }
  }

  /**
   * Check if cached result is still valid
   */
  private isCacheValid(result: SocialDetectionResult): boolean {
    const timestamp = (result as any).timestamp;
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Cache detection result
   */
  private cacheResult(placeId: string, result: SocialDetectionResult): void {
    (result as any).timestamp = Date.now();
    this.cache.set(placeId, result);
    
    // Clean old cache entries
    for (const [key, cachedResult] of this.cache.entries()) {
      if (!this.isCacheValid(cachedResult)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const socialLinkFinder = new SocialLinkFinderService();