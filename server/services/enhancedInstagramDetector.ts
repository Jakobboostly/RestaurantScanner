import axios from 'axios';
import * as cheerio from 'cheerio';

export interface InstagramPageResult {
  url: string;
  name: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'website_scan' | 'google_places' | 'recursive_scan' | 'manual_input' | 'search';
  verified: boolean;
}

export class EnhancedInstagramDetector {
  async detectInstagramPage(
    websiteUrl: string,
    businessName: string,
    address?: string,
    phone?: string,
    placeId?: string
  ): Promise<InstagramPageResult | null> {
    console.log('🔍 Enhanced Instagram detection starting for:', businessName);
    console.log('🔍 Instagram detection parameters:', { websiteUrl, businessName, address, phone, placeId });

    // Step 1: Enhanced website scanning
    try {
      console.log('📍 Step 1: Running enhanced website scan...');
      const websiteInstagram = await this.enhancedWebsiteScan(websiteUrl);
      if (websiteInstagram) {
        console.log('✅ Instagram found via enhanced website scan:', websiteInstagram.url);
        return websiteInstagram;
      }
      console.log('📍 Step 1 completed - no Instagram found via website scan');
    } catch (error) {
      console.error('❌ Enhanced website scan failed:', error);
    }

    // Step 2: Google Places API social media fields
    try {
      console.log('📍 Step 2: Checking Google Places API...');
      if (placeId) {
        const placesInstagram = await this.checkGooglePlacesForInstagram(placeId, businessName);
        if (placesInstagram) {
          console.log('✅ Instagram found via Google Places API:', placesInstagram.url);
          return placesInstagram;
        }
        console.log('📍 Step 2 completed - no Instagram found via Google Places');
      } else {
        console.log('📍 Step 2 skipped - no placeId provided');
      }
    } catch (error) {
      console.error('❌ Google Places Instagram check failed:', error);
    }

    // Step 3: Recursive scan for Instagram links on other pages
    try {
      console.log('📍 Step 3: Running recursive Instagram scan...');
      const recursiveInstagram = await this.recursiveInstagramScan(websiteUrl);
      if (recursiveInstagram) {
        console.log('✅ Instagram found via recursive scan:', recursiveInstagram.url);
        return recursiveInstagram;
      }
      console.log('📍 Step 3 completed - no Instagram found via recursive scan');
    } catch (error) {
      console.error('❌ Recursive Instagram scan failed:', error);
    }

    // Step 4: Known business override (for manual corrections)
    try {
      console.log('📍 Step 4: Checking known business overrides...');
      const knownOverride = this.checkKnownBusinessOverrides(businessName, websiteUrl);
      if (knownOverride) {
        console.log('✅ Instagram found via business override:', knownOverride.url);
        return knownOverride;
      }
      console.log('📍 Step 4 completed - no Instagram found via business overrides');
    } catch (error) {
      console.error('❌ Business override check failed:', error);
    }

    // Step 5: Search by name + location fallback (could be enhanced with Instagram API in future)
    try {
      console.log('📍 Step 5: Running name + location search...');
      if (businessName && address) {
        const searchInstagram = await this.searchInstagramByNameLocation(businessName, address);
        if (searchInstagram) {
          console.log('✅ Instagram found via name/location search:', searchInstagram.url);
          return searchInstagram;
        }
        console.log('📍 Step 5 completed - no Instagram found via name/location search');
      } else {
        console.log('📍 Step 5 skipped - missing business name or address');
      }
    } catch (error) {
      console.error('❌ Name/location search failed:', error);
    }

    console.log('❌ All Instagram detection steps completed - no Instagram found');
    return null;
  }

  private async enhancedWebsiteScan(websiteUrl: string): Promise<InstagramPageResult | null> {
    try {
      const response = await axios.get(websiteUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Enhanced Instagram link detection patterns
      const instagramSelectors = [
        'a[href*="instagram.com"]',
        'a[href*="www.instagram.com"]',
        'a.contact-icon[href*="instagram.com"]', // Specific pattern from Rib Shack
        'a[href*="ig.com"]',
        'a[href*="instagr.am"]',
        'iframe[src*="instagram.com"]',
        'script[src*="instagram.com"]'
      ];

      for (const selector of instagramSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const element = elements.eq(i);
          let instagramUrl = element.attr('href') || element.attr('src');
          
          if (instagramUrl) {
            const cleanUrl = this.cleanInstagramUrl(instagramUrl);
            if (cleanUrl && this.isValidInstagramPageUrl(cleanUrl)) {
              return {
                url: cleanUrl,
                name: this.extractPageNameFromUrl(cleanUrl),
                confidence: 'high',
                source: 'website_scan',
                verified: true
              };
            }
          }
        }
      }

      // Enhanced Instagram icon detection
      const iconSelectors = [
        'i.fab.fa-instagram',
        'i.fa-instagram', 
        'i.social-icon.fa-instagram',
        'i.fa.fa-instagram'
      ];

      for (const iconSelector of iconSelectors) {
        const $icons = $(iconSelector);
        let found = false;
        
        $icons.each((_, element) => {
          const $parent = $(element).closest('a[href]');
          if ($parent.length) {
            const href = $parent.attr('href');
            if (href && href.includes('instagram.com')) {
              const cleanUrl = this.cleanInstagramUrl(href);
              if (cleanUrl && this.isValidInstagramPageUrl(cleanUrl)) {
                found = true;
                return false; // Break out of each loop
              }
            }
          }
        });
        
        if (found) {
          const $firstIcon = $icons.first();
          const $parent = $firstIcon.closest('a[href]');
          const href = $parent.attr('href');
          if (href) {
            const cleanUrl = this.cleanInstagramUrl(href);
            if (cleanUrl && this.isValidInstagramPageUrl(cleanUrl)) {
              return {
                url: cleanUrl,
                name: this.extractPageNameFromUrl(cleanUrl),
                confidence: 'high',
                source: 'website_scan',
                verified: true
              };
            }
          }
        }
      }

    } catch (error) {
      console.error('Enhanced Instagram website scan error:', error);
    }

    return null;
  }

  private async checkGooglePlacesForInstagram(placeId: string, businessName: string): Promise<InstagramPageResult | null> {
    try {
      // This would integrate with Google Places API to check for Instagram in social media fields
      // For now, we'll use the Google Places data passed from the main scanner
      console.log('🔍 Checking Google Places API for Instagram links...');
      
      // Note: This could be enhanced to check editorial_summary and other fields
      // where Instagram links might be mentioned

    } catch (error) {
      console.error('Google Places Instagram check error:', error);
    }

    return null;
  }

  private async recursiveInstagramScan(websiteUrl: string): Promise<InstagramPageResult | null> {
    try {
      const baseUrl = new URL(websiteUrl).origin;
      const pagesToCheck = [
        `${baseUrl}/contact`,
        `${baseUrl}/about`,
        `${baseUrl}/about-us`,
        `${baseUrl}/social`,
        `${baseUrl}/follow`,
        `${baseUrl}/connect`
      ];

      for (const pageUrl of pagesToCheck) {
        try {
          const response = await axios.get(pageUrl, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const $ = cheerio.load(response.data);
          const instagramLink = $('a[href*="instagram.com"]').first().attr('href');
          
          if (instagramLink) {
            const cleanUrl = this.cleanInstagramUrl(instagramLink);
            if (cleanUrl && this.isValidInstagramPageUrl(cleanUrl)) {
              return {
                url: cleanUrl,
                name: this.extractPageNameFromUrl(cleanUrl),
                confidence: 'medium',
                source: 'recursive_scan',
                verified: true
              };
            }
          }
        } catch (error) {
          // Continue to next page if this one fails
          continue;
        }
      }

    } catch (error) {
      console.error('Recursive Instagram scan error:', error);
    }

    return null;
  }

  private checkKnownBusinessOverrides(businessName: string, websiteUrl: string): InstagramPageResult | null {
    // This could be enhanced with a database of known Instagram pages for businesses
    // where detection might fail but we have manual verification
    
    const knownOverrides: { [key: string]: string } = {
      // Add known Instagram pages here if needed
      // 'ribshacksmokehouse': 'https://www.instagram.com/ribshacksmokehouse'
    };

    const businessKey = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const overrideUrl = knownOverrides[businessKey];
    
    if (overrideUrl) {
      return {
        url: overrideUrl,
        name: businessName,
        confidence: 'high',
        source: 'manual_input',
        verified: true
      };
    }

    return null;
  }

  private async searchInstagramByNameLocation(businessName: string, address: string): Promise<InstagramPageResult | null> {
    // This could be enhanced with Instagram Basic Display API or Instagram Graph API
    // For now, we return null as we don't have external Instagram search capability
    console.log('🔍 Instagram search by name/location not yet implemented');
    return null;
  }

  private cleanInstagramUrl(url: string): string | null {
    try {
      if (!url) return null;
      
      // Remove unwanted characters and normalize
      let cleaned = url.trim();
      
      // Add protocol if missing
      if (!cleaned.startsWith('http')) {
        cleaned = 'https://' + cleaned;
      }
      
      // Parse URL to normalize
      const urlObj = new URL(cleaned);
      
      // Ensure it's Instagram
      if (!urlObj.hostname.includes('instagram.com')) {
        return null;
      }
      
      // Remove tracking parameters
      urlObj.search = '';
      urlObj.hash = '';
      
      return urlObj.toString();
    } catch (error) {
      return null;
    }
  }

  private isValidInstagramPageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Must be Instagram domain
      if (!urlObj.hostname.includes('instagram.com')) {
        return false;
      }
      
      // Exclude certain patterns
      const excludePatterns = [
        '/embed/',
        '/developer/',
        '/api/',
        '/legal/',
        '/help/',
        '/press/',
        '/blog/',
        'facebook.com/tr',
        'instagram.com/accounts',
        'instagram.com/oauth'
      ];
      
      for (const pattern of excludePatterns) {
        if (url.includes(pattern)) {
          return false;
        }
      }
      
      // Must have a valid path (not just root)
      const path = urlObj.pathname;
      if (path === '/' || path === '') {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractPageNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      if (pathParts.length > 0) {
        return pathParts[0];
      }
      
      return 'Instagram Page';
    } catch (error) {
      return 'Instagram Page';
    }
  }
}