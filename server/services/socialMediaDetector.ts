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

      // Method 1: Direct Facebook link detection
      $('a[href*="facebook.com"], a[href*="fb.com"], a[href*="m.facebook.com"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidFacebookUrl(href)) {
          socialLinks.facebook = this.cleanUrl(href);
          console.log('Facebook link found via direct detection:', socialLinks.facebook);
          return false; // Break after first match
        }
      });

      // Method 2: Facebook icon-based detection (including SVG icons)
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
      console.log(`Fetching Facebook page posts for ID: ${facebookId}`);
      
      const response = await axios.get(`https://api.zembra.io/social/facebook/page/${facebookId}/posts`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.zembraApiKey}`
        },
        timeout: 15000
      });

      if (response.data) {
        const data = response.data;
        
        // Calculate engagement metrics from posts data
        const posts = data.posts || data.data || [];
        const totalPosts = posts.length;
        const totalLikes = posts.reduce((sum: number, post: any) => sum + (post.likes_count || post.like_count || 0), 0);
        const totalComments = posts.reduce((sum: number, post: any) => sum + (post.comments_count || post.comment_count || 0), 0);
        const totalShares = posts.reduce((sum: number, post: any) => sum + (post.shares_count || post.share_count || 0), 0);
        const totalEngagement = totalLikes + totalComments + totalShares;
        
        // Calculate engagement rate (engagement per post)
        const engagementRate = totalPosts > 0 ? (totalEngagement / totalPosts) : 0;
        
        // Extract page info from posts response or use data directly
        const pageInfo = data.page || data;
        
        // Map Zembra API response to our interface
        const facebookData: FacebookPageData = {
          id: pageInfo.id || facebookId,
          name: pageInfo.name || pageInfo.page_name || '',
          username: pageInfo.username || pageInfo.handle || '',
          likes: pageInfo.likes || pageInfo.fan_count || totalLikes,
          followers: pageInfo.followers || pageInfo.follower_count || 0,
          checkins: pageInfo.checkins || pageInfo.were_here_count || 0,
          posts: totalPosts || pageInfo.posts_count || 0,
          engagement_rate: engagementRate > 0 ? engagementRate : (pageInfo.engagement_rate || 0),
          verified: pageInfo.verified || pageInfo.is_verified || false,
          category: pageInfo.category || pageInfo.category_list?.[0]?.name || '',
          description: pageInfo.description || pageInfo.about || '',
          website: pageInfo.website || pageInfo.link || '',
          phone: pageInfo.phone || '',
          address: pageInfo.address || pageInfo.location?.street || '',
          cover_photo: pageInfo.cover_photo?.source || pageInfo.cover?.source || '',
          profile_picture: pageInfo.profile_picture?.url || pageInfo.picture?.data?.url || ''
        };

        console.log(`Facebook data extracted: ${facebookData.name}, ${facebookData.posts} posts, ${facebookData.engagement_rate} engagement rate`);
        
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