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
  private timeout = 10000; // 10 seconds
  private zembraApiKey: string;

  constructor(zembraApiKey?: string) {
    this.zembraApiKey = zembraApiKey || process.env.ZEMBRA_API || '';
  }

  async detectSocialMediaLinks(websiteUrl: string): Promise<SocialMediaLinks> {
    const cacheKey = `social_${websiteUrl}`;
    const cached = cache.get<SocialMediaLinks>(cacheKey);
    
    if (cached) {
      console.log('Using cached social media links for:', websiteUrl);
      return cached;
    }

    try {
      console.log('Analyzing website for social media links:', websiteUrl);
      
      // Fetch website content
      const response = await axios.get(websiteUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const socialLinks: SocialMediaLinks = {};

      // Method 1: Direct Facebook link detection
      $('a[href*="facebook.com"], a[href*="fb.com"], a[href*="m.facebook.com"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidFacebookUrl(href)) {
          socialLinks.facebook = this.cleanUrl(href);
          return false; // Break after first match
        }
      });

      // Method 2: Facebook icon-based detection
      if (!socialLinks.facebook) {
        const facebookIcon = $('a[class*="facebook"], a[class*="fb"], i[class*="facebook"], i[class*="fb"]').closest('a');
        if (facebookIcon.length > 0) {
          const href = facebookIcon.attr('href');
          if (href && this.isValidFacebookUrl(href)) {
            socialLinks.facebook = this.cleanUrl(href);
          }
        }
      }

      // Method 3: Facebook data attribute detection
      $('[data-social], [data-platform]').each((_, element) => {
        const href = $(element).attr('href');
        const platform = $(element).attr('data-social') || $(element).attr('data-platform');
        
        if (href && platform && platform.toLowerCase() === 'facebook') {
          if (this.isValidFacebookUrl(href)) {
            socialLinks.facebook = this.cleanUrl(href);
          }
        }
      });

      // Method 4: Facebook text content analysis
      const textContent = $('body').text();
      if (!socialLinks.facebook) {
        const fbMatch = textContent.match(/facebook\.com\/([a-zA-Z0-9._-]+)/i);
        if (fbMatch) {
          socialLinks.facebook = `https://facebook.com/${fbMatch[1]}`;
        }
      }

      // Extract Facebook ID and fetch data from Zembra API
      if (socialLinks.facebook) {
        const facebookId = this.extractFacebookId(socialLinks.facebook);
        if (facebookId) {
          socialLinks.facebookId = facebookId;
          console.log('Extracted Facebook ID:', facebookId);
          
          // Fetch Facebook page data using Zembra API
          if (this.zembraApiKey) {
            try {
              const facebookData = await this.fetchFacebookPageData(facebookId);
              if (facebookData) {
                socialLinks.facebookData = facebookData;
                console.log('Fetched Facebook page data:', facebookData);
              }
            } catch (error) {
              console.error('Failed to fetch Facebook page data:', error);
            }
          }
        }
      }

      console.log('Detected social media links:', socialLinks);
      
      // Cache the result
      cache.set(cacheKey, socialLinks);
      
      return socialLinks;

    } catch (error) {
      console.error('Social media detection error:', error);
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
      
      // Match different Facebook URL patterns
      const patterns = [
        /facebook\.com\/([a-zA-Z0-9._-]+)(?:\/|$)/i,
        /facebook\.com\/pages\/[^\/]+\/(\d+)/i,
        /facebook\.com\/profile\.php\?id=(\d+)/i,
        /fb\.com\/([a-zA-Z0-9._-]+)(?:\/|$)/i,
        /m\.facebook\.com\/([a-zA-Z0-9._-]+)(?:\/|$)/i
      ];

      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1]) {
          // Filter out common non-ID paths
          const excludePatterns = ['pages', 'people', 'groups', 'events', 'photos', 'videos', 'posts'];
          if (!excludePatterns.includes(match[1].toLowerCase())) {
            return match[1];
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting Facebook ID:', error);
      return null;
    }
  }

  private async fetchFacebookPageData(facebookId: string): Promise<FacebookPageData | null> {
    try {
      console.log(`Fetching Facebook page data for ID: ${facebookId}`);
      
      const response = await axios.get(`https://api.zembra.io/social/facebook/page/${facebookId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.zembraApiKey}`
        },
        timeout: 15000
      });

      if (response.data) {
        const data = response.data;
        
        // Map Zembra API response to our interface
        const facebookData: FacebookPageData = {
          id: data.id || facebookId,
          name: data.name || '',
          username: data.username || data.handle || '',
          likes: data.likes || data.fan_count || 0,
          followers: data.followers || data.follower_count || 0,
          checkins: data.checkins || data.were_here_count || 0,
          posts: data.posts || data.posts_count || 0,
          engagement_rate: data.engagement_rate || 0,
          verified: data.verified || data.is_verified || false,
          category: data.category || data.category_list?.[0]?.name || '',
          description: data.description || data.about || '',
          website: data.website || data.link || '',
          phone: data.phone || '',
          address: data.address || data.location?.street || '',
          cover_photo: data.cover_photo?.source || data.cover?.source || '',
          profile_picture: data.profile_picture?.url || data.picture?.data?.url || ''
        };

        return facebookData;
      }
      
      return null;
    } catch (error) {
      console.error('Zembra API error:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      return null;
    }
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