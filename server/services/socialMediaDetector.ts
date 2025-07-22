import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export interface FacebookPageData {
  id: string;
  name: string;
  username?: string;
  likes?: number;
  followers?: number;
  checkins?: number;
  posts?: number;
  engagement_rate?: number;
  verified?: boolean;
  category?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  cover_photo?: string;
  profile_picture?: string;
}

export interface SocialMediaLinks {
  facebook?: string;
  facebookId?: string;
  facebookData?: FacebookPageData;
}

export class SocialMediaDetector {
  private timeout = 5000; // 5 seconds for faster scanning

  constructor() {
    // No external API dependencies - pure web scraping approach
  }

  async detectSocialMediaLinks(websiteUrl: string): Promise<SocialMediaLinks> {
    const cacheKey = `social_${websiteUrl}`;
    const cached = cache.get<SocialMediaLinks>(cacheKey);
    
    if (cached) {
      console.log('Using cached social media links for:', websiteUrl);
      // Still log if we found Facebook in cache
      if (cached.facebook) {
        console.log('Cached Facebook link:', cached.facebook);
        console.log('Cached Facebook ID:', cached.facebookId);
      }
      return cached;
    }

    try {
      // Ensure URL has protocol
      const formattedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      console.log('Analyzing website for social media links:', formattedUrl);
      
      // Fetch website content
      const response = await axios.get(formattedUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const socialLinks: SocialMediaLinks = {};

      // Method 1: JSON-LD schema detection
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || '{}');
          if (jsonData.sameAs && Array.isArray(jsonData.sameAs)) {
            for (const url of jsonData.sameAs) {
              if (this.isValidFacebookUrl(url)) {
                socialLinks.facebook = this.cleanUrl(url);
                console.log('Facebook link found via JSON-LD schema:', socialLinks.facebook);
                return false;
              }
            }
          }
        } catch (e) {
          // Skip malformed JSON
        }
      });

      // Method 2: Direct Facebook link detection
      if (!socialLinks.facebook) {
        $('a[href*="facebook.com"], a[href*="fb.com"], a[href*="m.facebook.com"]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && this.isValidFacebookUrl(href)) {
            socialLinks.facebook = this.cleanUrl(href);
            console.log('Facebook link found via direct detection:', socialLinks.facebook);
            return false; // Break after first match
          }
        });
      }

      // Method 3: Facebook icon-based detection (including SVG icons)
      if (!socialLinks.facebook) {
        // Check for CSS class-based icons
        const facebookIcon = $('a[class*="facebook"], a[class*="fb"], i[class*="facebook"], i[class*="fb"]').closest('a');
        if (facebookIcon.length > 0) {
          const href = facebookIcon.attr('href');
          if (href && this.isValidFacebookUrl(href)) {
            socialLinks.facebook = this.cleanUrl(href);
          }
        }
        
        // Check for SVG icons with xlink:href
        if (!socialLinks.facebook) {
          const svgFacebookIcons = $('use[xlink\\:href*="facebook"], use[href*="facebook"]').closest('a');
          if (svgFacebookIcons.length > 0) {
            const href = svgFacebookIcons.attr('href');
            if (href && this.isValidFacebookUrl(href)) {
              socialLinks.facebook = this.cleanUrl(href);
            }
          }
        }
        
        // Check for SVG symbols and their parent links
        if (!socialLinks.facebook) {
          const svgElements = $('svg use[xlink\\:href="#facebook-icon"], svg use[href="#facebook-icon"], svg use[xlink\\:href*="facebook"], svg use[href*="facebook"]');
          svgElements.each((_, element) => {
            const parentLink = $(element).closest('a');
            if (parentLink.length > 0) {
              const href = parentLink.attr('href');
              if (href && this.isValidFacebookUrl(href)) {
                socialLinks.facebook = this.cleanUrl(href);
                return false; // Break the loop
              }
            }
          });
        }
      }

      // Method 4: Facebook data attribute detection
      $('[data-social], [data-platform]').each((_, element) => {
        const href = $(element).attr('href');
        const platform = $(element).attr('data-social') || $(element).attr('data-platform');
        
        if (href && platform && platform.toLowerCase() === 'facebook') {
          if (this.isValidFacebookUrl(href)) {
            socialLinks.facebook = this.cleanUrl(href);
          }
        }
      });

      // Method 5: Facebook text content analysis
      const textContent = $('body').text();
      if (!socialLinks.facebook) {
        const fbMatch = textContent.match(/facebook\.com\/([a-zA-Z0-9._-]+)/i);
        if (fbMatch) {
          socialLinks.facebook = `https://facebook.com/${fbMatch[1]}`;
        }
      }

      // Extract Facebook ID only (no external verification)
      if (socialLinks.facebook) {
        const facebookId = this.extractFacebookId(socialLinks.facebook);
        if (facebookId) {
          socialLinks.facebookId = facebookId;
          console.log('Extracted Facebook ID:', facebookId);
          console.log('Facebook page URL:', socialLinks.facebook);
          
          // Note: Facebook data will be scraped externally using the page ID
          socialLinks.facebookData = {
            id: facebookId,
            name: 'Facebook Page',
            verified: false,
            category: 'Restaurant',
            description: 'Restaurant Facebook Page'
          };
        }
      }

      console.log('Detected social media links:', socialLinks);
      
      // Cache the result
      cache.set(cacheKey, socialLinks);
      
      return socialLinks;

    } catch (error: any) {
      console.error('Social media detection error:', error?.message || 'Unknown error');
      return {};
    }
  }

  private isValidFacebookUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    return /^https?:\/\/(www\.)?(facebook\.com|fb\.com|m\.facebook\.com)\/[a-zA-Z0-9._-]+/i.test(cleanUrl) &&
           !cleanUrl.includes('/sharer/') &&
           !cleanUrl.includes('/share.php') &&
           !cleanUrl.includes('/plugins/');
  }

  private extractFacebookId(facebookUrl: string): string | null {
    try {
      const cleanUrl = this.cleanUrl(facebookUrl);
      console.log('Extracting Facebook ID from:', cleanUrl);
      
      // Match different Facebook URL patterns (in order of specificity)
      const patterns = [
        // Profile with ID parameter
        /facebook\.com\/profile\.php\?id=(\d+)/i,
        // Pages with numeric ID
        /facebook\.com\/pages\/[^\/]+\/(\d+)/i,
        // Direct numeric ID
        /facebook\.com\/(\d+)(?:\/|$)/i,
        // Username or page name
        /facebook\.com\/([a-zA-Z0-9._-]+)(?:\/|$)/i,
        // Short URLs
        /fb\.com\/([a-zA-Z0-9._-]+)(?:\/|$)/i,
        // Mobile URLs
        /m\.facebook\.com\/([a-zA-Z0-9._-]+)(?:\/|$)/i
      ];

      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1]) {
          // Filter out common non-ID paths
          const excludePatterns = ['pages', 'people', 'groups', 'events', 'photos', 'videos', 'posts', 'home', 'login', 'help', 'search'];
          if (!excludePatterns.includes(match[1].toLowerCase())) {
            console.log('Extracted Facebook ID:', match[1]);
            return match[1];
          }
        }
      }
      
      console.log('No Facebook ID found in URL');
      return null;
    } catch (error) {
      console.error('Error extracting Facebook ID:', error);
      return null;
    }
  }

  private async fetchFacebookPageData(facebookId: string): Promise<FacebookPageData | null> {
    // Note: External Facebook API data fetching removed
    // Facebook page detection is limited to URL extraction only
    console.log(`Facebook ID detected: ${facebookId} (external data fetching disabled)`);
    return null;
  }

  private cleanUrl(url: string): string {
    // Remove tracking parameters and clean up URL
    let cleanUrl = url.trim();
    
    // Remove common tracking parameters
    cleanUrl = cleanUrl.replace(/[?&](utm_|fbclid|gclid|ref=|source=)[^&]*/g, '');
    
    // Remove trailing ? or & if they exist
    cleanUrl = cleanUrl.replace(/[?&]$/, '');
    
    // Ensure https protocol
    if (cleanUrl.startsWith('//')) {
      cleanUrl = 'https:' + cleanUrl;
    } else if (cleanUrl.startsWith('/')) {
      // Relative URL, skip
      return cleanUrl;
    }
    
    return cleanUrl;
  }
}