import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
}

export class SocialMediaDetector {
  private timeout = 10000; // 10 seconds

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

      // Method 1: Direct link detection
      $('a[href*="facebook.com"], a[href*="fb.com"], a[href*="m.facebook.com"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidFacebookUrl(href)) {
          socialLinks.facebook = this.cleanUrl(href);
          return false; // Break after first match
        }
      });

      $('a[href*="instagram.com"], a[href*="instagr.am"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidInstagramUrl(href)) {
          socialLinks.instagram = this.cleanUrl(href);
          return false;
        }
      });

      $('a[href*="twitter.com"], a[href*="x.com"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidTwitterUrl(href)) {
          socialLinks.twitter = this.cleanUrl(href);
          return false;
        }
      });

      $('a[href*="youtube.com"], a[href*="youtu.be"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidYouTubeUrl(href)) {
          socialLinks.youtube = this.cleanUrl(href);
          return false;
        }
      });

      $('a[href*="tiktok.com"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidTikTokUrl(href)) {
          socialLinks.tiktok = this.cleanUrl(href);
          return false;
        }
      });

      $('a[href*="linkedin.com"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidLinkedInUrl(href)) {
          socialLinks.linkedin = this.cleanUrl(href);
          return false;
        }
      });

      // Method 2: Icon-based detection (look for social media icons)
      if (!socialLinks.facebook) {
        const facebookIcon = $('a[class*="facebook"], a[class*="fb"], i[class*="facebook"], i[class*="fb"]').closest('a');
        if (facebookIcon.length > 0) {
          const href = facebookIcon.attr('href');
          if (href && this.isValidFacebookUrl(href)) {
            socialLinks.facebook = this.cleanUrl(href);
          }
        }
      }

      if (!socialLinks.instagram) {
        const instagramIcon = $('a[class*="instagram"], a[class*="insta"], i[class*="instagram"], i[class*="insta"]').closest('a');
        if (instagramIcon.length > 0) {
          const href = instagramIcon.attr('href');
          if (href && this.isValidInstagramUrl(href)) {
            socialLinks.instagram = this.cleanUrl(href);
          }
        }
      }

      // Method 3: Data attribute detection
      $('[data-social], [data-platform]').each((_, element) => {
        const href = $(element).attr('href');
        const platform = $(element).attr('data-social') || $(element).attr('data-platform');
        
        if (href && platform) {
          switch (platform.toLowerCase()) {
            case 'facebook':
              if (this.isValidFacebookUrl(href)) socialLinks.facebook = this.cleanUrl(href);
              break;
            case 'instagram':
              if (this.isValidInstagramUrl(href)) socialLinks.instagram = this.cleanUrl(href);
              break;
            case 'twitter':
              if (this.isValidTwitterUrl(href)) socialLinks.twitter = this.cleanUrl(href);
              break;
          }
        }
      });

      // Method 4: Text content analysis for social handles
      const textContent = $('body').text();
      if (!socialLinks.facebook) {
        const fbMatch = textContent.match(/facebook\.com\/([a-zA-Z0-9._-]+)/i);
        if (fbMatch) {
          socialLinks.facebook = `https://facebook.com/${fbMatch[1]}`;
        }
      }

      if (!socialLinks.instagram) {
        const instaMatch = textContent.match(/instagram\.com\/([a-zA-Z0-9._-]+)/i);
        if (instaMatch) {
          socialLinks.instagram = `https://instagram.com/${instaMatch[1]}`;
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

  private isValidInstagramUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    return /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/[a-zA-Z0-9._-]+/i.test(cleanUrl) &&
           !cleanUrl.includes('/share/') &&
           !cleanUrl.includes('/embed/');
  }

  private isValidTwitterUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9._-]+/i.test(cleanUrl) &&
           !cleanUrl.includes('/share') &&
           !cleanUrl.includes('/intent/');
  }

  private isValidYouTubeUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    return /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)|youtu\.be\/)/i.test(cleanUrl);
  }

  private isValidTikTokUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    return /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/i.test(cleanUrl);
  }

  private isValidLinkedInUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    return /^https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[a-zA-Z0-9._-]+/i.test(cleanUrl);
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