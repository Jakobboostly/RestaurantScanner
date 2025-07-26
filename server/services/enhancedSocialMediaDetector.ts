import axios from 'axios';
import * as cheerio from 'cheerio';

export class EnhancedSocialMediaDetector {
  
  async detectAllSocialMedia(
    domain: string, 
    businessName?: string, 
    address?: string, 
    phone?: string, 
    placeId?: string,
    apifySocialData?: any
  ) {
    console.log('🔍 Enhanced social media detection starting for:', domain);
    
    const result = {
      facebook: null as string | null,
      instagram: null as string | null,
      twitter: null as string | null,
      youtube: null as string | null,
      tiktok: null as string | null,
      linkedin: null as string | null
    };

    try {
      // Step 1: Check Apify social data first (most reliable)
      if (apifySocialData) {
        console.log('✅ Using Apify social media data');
        if (apifySocialData.facebooks?.length > 0) {
          result.facebook = apifySocialData.facebooks[0];
          console.log('📘 Facebook from Apify:', result.facebook);
        }
        if (apifySocialData.instagrams?.length > 0) {
          result.instagram = apifySocialData.instagrams[0];
          console.log('📷 Instagram from Apify:', result.instagram);
        }
        
        // If we found both platforms from Apify, return early
        if (result.facebook && result.instagram) {
          console.log('✅ Both Facebook and Instagram found via Apify');
          return result;
        }
      }

      // Step 2: Website scanning for social media links
      try {
        console.log('🔍 Scanning website for social media links...');
        const response = await axios.get(domain, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        
        // Facebook detection patterns
        const facebookSelectors = [
          'a[href*="facebook.com/"]:not([href*="/sharer/"]):not([href*="/share.php"])',
          'a[href*="fb.com/"]',
          'div[data-href*="facebook.com/"]',
          'iframe[src*="facebook.com/"]'
        ];

        // Instagram detection patterns  
        const instagramSelectors = [
          'a[href*="instagram.com/"]:not([href*="/share"])',
          'a[href*="instagr.am/"]',
          'div[data-href*="instagram.com/"]'
        ];

        // Find Facebook links
        if (!result.facebook) {
          for (const selector of facebookSelectors) {
            const links = $(selector);
            links.each((i, element) => {
              const href = $(element).attr('href') || $(element).attr('data-href') || $(element).attr('src');
              if (href && this.isValidFacebookUrl(href)) {
                result.facebook = this.cleanSocialUrl(href);
                console.log('📘 Facebook found via website scan:', result.facebook);
                return false; // Break out of each loop
              }
            });
            if (result.facebook) break;
          }
        }

        // Find Instagram links
        if (!result.instagram) {
          for (const selector of instagramSelectors) {
            const links = $(selector);
            links.each((i, element) => {
              const href = $(element).attr('href') || $(element).attr('data-href');
              if (href && this.isValidInstagramUrl(href)) {
                result.instagram = this.cleanSocialUrl(href);
                console.log('📷 Instagram found via website scan:', result.instagram);
                return false; // Break out of each loop
              }
            });
            if (result.instagram) break;
          }
        }

      } catch (error) {
        console.log('⚠️ Website scanning failed:', error);
      }

      console.log('🔍 Social media detection results:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Enhanced social media detection failed:', error);
      return result;
    }
  }

  async detectAllPlatforms(domain: string) {
    return this.detectAllSocialMedia(domain);
  }

  private isValidFacebookUrl(url: string): boolean {
    if (!url) return false;
    
    // Clean and normalize URL
    const cleanUrl = url.toLowerCase().trim();
    
    // Must contain facebook.com or fb.com
    if (!cleanUrl.includes('facebook.com') && !cleanUrl.includes('fb.com')) {
      return false;
    }

    // Exclude Facebook system URLs, APIs, and share links
    const excludePatterns = [
      '/sharer/', '/share.php', '/dialog/', '/login', '/connect',
      '/tr?', '/plugins/', '/embed/', '/widget/', '/badge/',
      'facebook.com/api', 'facebook.com/ajax', 'facebook.com/common'
    ];

    return !excludePatterns.some(pattern => cleanUrl.includes(pattern));
  }

  private isValidInstagramUrl(url: string): boolean {
    if (!url) return false;
    
    const cleanUrl = url.toLowerCase().trim();
    
    // Must contain instagram.com or instagr.am
    if (!cleanUrl.includes('instagram.com') && !cleanUrl.includes('instagr.am')) {
      return false;
    }

    // Exclude Instagram system URLs and share links
    const excludePatterns = [
      '/share', '/embed/', '/api/', '/oauth/', '/developer/'
    ];

    return !excludePatterns.some(pattern => cleanUrl.includes(pattern));
  }

  private cleanSocialUrl(url: string): string {
    if (!url) return url;
    
    // Add protocol if missing
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    try {
      const urlObj = new URL(url);
      // Remove query parameters and fragments for cleaner URLs
      return urlObj.origin + urlObj.pathname.replace(/\/$/, '');
    } catch {
      return url;
    }
  }
}