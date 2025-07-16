import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleBusinessService } from './googleBusinessService';

export interface FacebookPageResult {
  url: string;
  name: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'website_scan' | 'google_places' | 'manual_input' | 'name_search' | 'external_db';
  verified: boolean;
}

export class EnhancedFacebookDetector {
  private googleBusinessService: GoogleBusinessService;

  constructor() {
    this.googleBusinessService = new GoogleBusinessService();
  }

  async detectFacebookPage(
    websiteUrl: string,
    businessName: string,
    address?: string,
    phone?: string,
    placeId?: string,
    manualUrl?: string
  ): Promise<FacebookPageResult | null> {
    
    // Step 1: Manual Input (highest priority)
    if (manualUrl) {
      return await this.verifyManualFacebookUrl(manualUrl, businessName);
    }

    // Step 2: Enhanced HTML/DOM Scan
    const websiteFbPage = await this.enhancedWebsiteScan(websiteUrl);
    if (websiteFbPage) {
      return websiteFbPage;
    }

    // Step 3: Google Places + Website Field Check
    if (placeId) {
      const googleFbPage = await this.checkGooglePlacesForFacebook(placeId);
      if (googleFbPage) {
        return googleFbPage;
      }
    }

    // Step 4: Recursive scan for FB links on other pages
    const recursiveFbPage = await this.recursiveFacebookScan(websiteUrl);
    if (recursiveFbPage) {
      return recursiveFbPage;
    }

    // Step 5: Fallback - Facebook search by name + location
    if (businessName && address) {
      const searchFbPage = await this.searchFacebookByNameLocation(businessName, address, phone);
      if (searchFbPage) {
        return searchFbPage;
      }
    }

    return null;
  }

  private async verifyManualFacebookUrl(url: string, businessName: string): Promise<FacebookPageResult | null> {
    try {
      if (!url.includes('facebook.com')) {
        return null;
      }

      // Basic URL format validation
      const cleanUrl = this.cleanFacebookUrl(url);
      if (!cleanUrl) {
        return null;
      }

      return {
        url: cleanUrl,
        name: businessName,
        confidence: 'high',
        source: 'manual_input',
        verified: true
      };
    } catch (error) {
      console.error('Manual Facebook URL verification error:', error);
      return null;
    }
  }

  private async enhancedWebsiteScan(websiteUrl: string): Promise<FacebookPageResult | null> {
    try {
      const response = await axios.get(websiteUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Enhanced Facebook link detection patterns
      const facebookSelectors = [
        'a[href*="facebook.com"]',
        'a[href*="fb.com"]',
        'a[href*="m.facebook.com"]',
        'iframe[src*="facebook.com"]',
        'script[src*="facebook.com"]'
      ];

      for (const selector of facebookSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const element = elements.eq(i);
          let fbUrl = element.attr('href') || element.attr('src');
          
          if (fbUrl) {
            const cleanUrl = this.cleanFacebookUrl(fbUrl);
            if (cleanUrl && this.isValidFacebookPageUrl(cleanUrl)) {
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

      // Check for Facebook Pixel and Open Graph tags
      const fbPixel = this.detectFacebookPixel($);
      const ogTags = this.detectOpenGraphFacebookTags($);
      
      if (fbPixel || ogTags) {
        return {
          url: fbPixel || ogTags || '',
          name: 'Facebook Page',
          confidence: 'medium',
          source: 'website_scan',
          verified: false
        };
      }

    } catch (error) {
      console.error('Enhanced website scan error:', error);
    }

    return null;
  }

  private async checkGooglePlacesForFacebook(placeId: string): Promise<FacebookPageResult | null> {
    try {
      console.log('Checking Google Places for Facebook links, placeId:', placeId);
      
      // Get raw Google Places API response to access all fields
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'name,website,formatted_phone_number,formatted_address,editorial_summary,social_media_links',
          key: process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY,
        }
      });

      if (response.data.status === 'OK') {
        const place = response.data.result;
        console.log('Google Places API raw response:', JSON.stringify(place, null, 2));
        console.log('Available fields in place:', Object.keys(place || {}));

        // Check social_media_links field first
        if (place.social_media_links && Array.isArray(place.social_media_links)) {
          console.log('Found social_media_links:', place.social_media_links);
          
          for (const link of place.social_media_links) {
            if (link.url && link.url.includes('facebook.com')) {
              const cleanUrl = this.cleanFacebookUrl(link.url);
              if (cleanUrl) {
                console.log('Found Facebook URL in social_media_links:', cleanUrl);
                return {
                  url: cleanUrl,
                  name: place.name || 'Facebook Page',
                  confidence: 'high',
                  source: 'google_places',
                  verified: true
                };
              }
            }
          }
        }

        // Check website field (fallback)
        if (place.website && place.website.includes('facebook.com')) {
          const cleanUrl = this.cleanFacebookUrl(place.website);
          if (cleanUrl) {
            console.log('Found Facebook URL in website field:', cleanUrl);
            return {
              url: cleanUrl,
              name: place.name || 'Facebook Page',
              confidence: 'high',
              source: 'google_places',
              verified: true
            };
          }
        }

        // Check editorial_summary for Facebook mentions
        if (place.editorial_summary && place.editorial_summary.overview) {
          const fbMatch = place.editorial_summary.overview.match(/facebook\.com\/[^\s]+/i);
          if (fbMatch) {
            const cleanUrl = this.cleanFacebookUrl(fbMatch[0]);
            if (cleanUrl) {
              console.log('Found Facebook URL in editorial_summary:', cleanUrl);
              return {
                url: cleanUrl,
                name: place.name || 'Facebook Page',
                confidence: 'medium',
                source: 'google_places',
                verified: true
              };
            }
          }
        }

        console.log('No Facebook links found in Google Places API response');
      } else {
        console.error('Google Places API error:', response.data.status);
      }

    } catch (error) {
      console.error('Google Places Facebook check error:', error);
    }

    return null;
  }

  private async recursiveFacebookScan(websiteUrl: string): Promise<FacebookPageResult | null> {
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
          const facebookLink = $('a[href*="facebook.com"]').first().attr('href');
          
          if (facebookLink) {
            const cleanUrl = this.cleanFacebookUrl(facebookLink);
            if (cleanUrl && this.isValidFacebookPageUrl(cleanUrl)) {
              return {
                url: cleanUrl,
                name: this.extractPageNameFromUrl(cleanUrl),
                confidence: 'medium',
                source: 'website_scan',
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
      console.error('Recursive Facebook scan error:', error);
    }

    return null;
  }

  private async searchFacebookByNameLocation(
    businessName: string,
    address: string,
    phone?: string
  ): Promise<FacebookPageResult | null> {
    try {
      // This would require Facebook Graph API or similar service
      // For now, we'll implement a heuristic approach
      const searchQuery = `${businessName} ${address}`;
      const potentialUrl = this.generatePotentialFacebookUrl(businessName);
      
      if (potentialUrl) {
        return {
          url: potentialUrl,
          name: businessName,
          confidence: 'low',
          source: 'name_search',
          verified: false
        };
      }

    } catch (error) {
      console.error('Facebook search by name/location error:', error);
    }

    return null;
  }

  private cleanFacebookUrl(url: string): string | null {
    try {
      // Remove tracking parameters and clean up URL
      const cleanUrl = url
        .replace(/\?.*$/, '') // Remove query parameters
        .replace(/#.*$/, '') // Remove fragments
        .replace(/\/$/, ''); // Remove trailing slash

      // Ensure it's a valid Facebook URL
      if (cleanUrl.includes('facebook.com') && !cleanUrl.includes('/sharer/')) {
        return cleanUrl;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private isValidFacebookPageUrl(url: string): boolean {
    // Exclude common non-page Facebook URLs
    const excludePatterns = [
      '/sharer/',
      '/plugins/',
      '/tr/',
      '/connect/',
      '/login/',
      '/share.php',
      '/dialog/'
    ];

    return !excludePatterns.some(pattern => url.includes(pattern));
  }

  private extractPageNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      return pathParts[0] || 'Facebook Page';
    } catch (error) {
      return 'Facebook Page';
    }
  }

  private detectFacebookPixel($: cheerio.CheerioAPI): string | null {
    const pixelScript = $('script').filter((_, element) => {
      const scriptContent = $(element).html();
      return scriptContent && scriptContent.includes('fbq(');
    });

    if (pixelScript.length > 0) {
      // Extract Facebook page ID from pixel if available
      const scriptContent = pixelScript.html();
      const pageIdMatch = scriptContent?.match(/fbq\('init', '(\d+)'/);
      if (pageIdMatch) {
        return `https://www.facebook.com/pages/${pageIdMatch[1]}`;
      }
    }

    return null;
  }

  private detectOpenGraphFacebookTags($: cheerio.CheerioAPI): string | null {
    const fbAppId = $('meta[property="fb:app_id"]').attr('content');
    const fbPageId = $('meta[property="fb:page_id"]').attr('content');
    
    if (fbPageId) {
      return `https://www.facebook.com/pages/${fbPageId}`;
    }

    return null;
  }

  private generatePotentialFacebookUrl(businessName: string): string | null {
    try {
      // Generate potential Facebook URL based on business name
      const slug = businessName
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 50);

      return `https://www.facebook.com/${slug}`;
    } catch (error) {
      return null;
    }
  }
}