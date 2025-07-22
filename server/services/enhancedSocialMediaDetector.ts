import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleBusinessService } from './googleBusinessService';
import { EnhancedFacebookDetector } from './enhancedFacebookDetector';

export interface SocialMediaResult {
  url: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin';
  name: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'website_scan' | 'google_places' | 'manual_input' | 'name_search' | 'meta_tags';
  verified: boolean;
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
}

export class EnhancedSocialMediaDetector {
  private googleBusinessService: GoogleBusinessService;
  private enhancedFacebookDetector: EnhancedFacebookDetector;
  private timeout = 8000; // 8 seconds for comprehensive scanning

  constructor() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY || '';
    this.googleBusinessService = new GoogleBusinessService(apiKey);
    this.enhancedFacebookDetector = new EnhancedFacebookDetector();
  }

  async detectAllSocialMedia(
    websiteUrl: string,
    businessName: string,
    address?: string,
    phone?: string,
    placeId?: string
  ): Promise<SocialMediaLinks> {
    const results: SocialMediaLinks = {};
    
    // Step 1: Use enhanced Facebook detector with business override capability
    console.log('🔍 Running enhanced Facebook detection with business override support...');
    try {
      const facebookResult = await this.enhancedFacebookDetector.detectFacebookPage(
        websiteUrl,
        businessName,
        address,
        phone,
        placeId
      );
      
      if (facebookResult) {
        results.facebook = facebookResult.url;
        console.log('✅ Enhanced Facebook detection successful:', facebookResult.url);
      } else {
        console.log('❌ Enhanced Facebook detection found no results');
      }
    } catch (error) {
      console.error('Enhanced Facebook detection failed:', error);
    }
    
    // Step 2: Enhanced website scanning for other platforms
    const websiteLinks = await this.enhancedWebsiteScan(websiteUrl);
    // Only merge non-Facebook results to avoid overriding enhanced Facebook detection
    Object.keys(websiteLinks).forEach(platform => {
      if (platform !== 'facebook') {
        results[platform as keyof SocialMediaLinks] = websiteLinks[platform as keyof SocialMediaLinks];
      }
    });

    // Step 3: Google Places API social media fields
    if (placeId) {
      const googleLinks = await this.checkGooglePlacesForSocialMedia(placeId);
      Object.assign(results, googleLinks);
    }

    // Step 4: Meta tags and structured data
    const metaLinks = await this.scanMetaTagsAndStructuredData(websiteUrl);
    Object.assign(results, metaLinks);

    // Step 5: Recursive page scanning for social links
    const recursiveLinks = await this.recursiveSocialScan(websiteUrl);
    Object.assign(results, recursiveLinks);

    return results;
  }

  private async enhancedWebsiteScan(websiteUrl: string): Promise<SocialMediaLinks> {
    try {
      const formattedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      
      const response = await axios.get(formattedUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const socialLinks: SocialMediaLinks = {};

      // Facebook detection patterns including new business page format
      const facebookPatterns = [
        /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?facebook\.com\/pages\/([^\/]+)\/(\d+)/gi,
        /(?:https?:\/\/)?(?:www\.)?facebook\.com\/profile\.php\?id=(\d+)/gi,
        /(?:https?:\/\/)?(?:www\.)?facebook\.com\/p\/([^\/]+)\/(\d+)/gi, // New business page format
        /(?:https?:\/\/)?(?:m\.)?facebook\.com\/([a-zA-Z0-9\._-]+)/gi
      ];

      // Instagram detection patterns
      const instagramPatterns = [
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/([a-zA-Z0-9\._-]+)/gi
      ];

      // Twitter detection patterns
      const twitterPatterns = [
        /(?:https?:\/\/)?(?:www\.)?twitter\.com\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?x\.com\/([a-zA-Z0-9\._-]+)/gi
      ];

      // YouTube detection patterns
      const youtubePatterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9\._-]+)/gi
      ];

      // TikTok detection patterns
      const tiktokPatterns = [
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/discover\/([a-zA-Z0-9\._-]+)/gi
      ];

      // LinkedIn detection patterns
      const linkedinPatterns = [
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9\._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\._-]+)/gi
      ];

      // Enhanced detection: Look for clickable social media icons with href attributes
      console.log('🔍 Enhanced social media detection: Looking for clickable social icons...');

      // Check for Facebook icons with clickable links
      if (!socialLinks.facebook) {
        const facebookSelectors = [
          'a[href*="facebook.com"]',
          'a i.fab.fa-facebook, a i.fab.fa-facebook-f',
          'a[class*="facebook"]',
          'a svg[data-icon="facebook"]',
          'a use[href*="facebook"]',
          'a use[*|href*="facebook"]'
        ];

        for (const selector of facebookSelectors) {
          const $link = $(selector).first();
          if ($link.length) {
            const href = $link.attr('href');
            if (href && href.includes('facebook.com')) {
              const cleanUrl = this.cleanSocialUrl(href, 'facebook');
              if (cleanUrl && this.isValidFacebookUrl(cleanUrl)) {
                socialLinks.facebook = cleanUrl;
                console.log('✅ Facebook URL extracted from clickable icon:', cleanUrl);
                break;
              }
            }
          }
        }

        // Also check for clickable elements containing Facebook icons
        const facebookIconElements = $('i.fab.fa-facebook, i.fab.fa-facebook-f, svg use[*|href*="facebook"], use[href*="facebook"]');
        facebookIconElements.each((_, element) => {
          const $parent = $(element).closest('a[href]');
          if ($parent.length) {
            const href = $parent.attr('href');
            if (href && href.includes('facebook.com')) {
              const cleanUrl = this.cleanSocialUrl(href, 'facebook');
              if (cleanUrl && this.isValidFacebookUrl(cleanUrl)) {
                socialLinks.facebook = cleanUrl;
                console.log('✅ Facebook URL found from parent link of icon:', cleanUrl);
                return false; // Break out of each loop
              }
            }
          }
        });
      }

      // Check for Instagram icons with clickable links (enhanced detection)
      if (!socialLinks.instagram) {
        const instagramSelectors = [
          'a[href*="instagram.com"]',
          'a i.fab.fa-instagram',
          'a[class*="instagram"]',
          'a svg[data-icon="instagram"]',
          'a use[href*="instagram"]',
          'a use[*|href*="instagram"]',
          'a[data-testid="social-link"][href*="instagram.com"]', // Specific pattern from your example
          'a img[alt*="Instagram"]',
          'a img[src*="instagram"]'
        ];

        for (const selector of instagramSelectors) {
          const $link = $(selector).first();
          if ($link.length) {
            const href = $link.attr('href');
            if (href && href.includes('instagram.com')) {
              const cleanUrl = this.cleanSocialUrl(href, 'instagram');
              if (cleanUrl && this.isValidInstagramUrl(cleanUrl)) {
                socialLinks.instagram = cleanUrl;
                console.log('✅ Instagram URL extracted from clickable icon:', cleanUrl);
                break;
              }
            }
          }
        }

        // Also check for clickable elements containing Instagram icons
        const instagramIconElements = $('i.fab.fa-instagram, svg use[*|href*="instagram"], use[href*="instagram"]');
        instagramIconElements.each((_, element) => {
          const $parent = $(element).closest('a[href]');
          if ($parent.length) {
            const href = $parent.attr('href');
            if (href && href.includes('instagram.com')) {
              const cleanUrl = this.cleanSocialUrl(href, 'instagram');
              if (cleanUrl && this.isValidInstagramUrl(cleanUrl)) {
                socialLinks.instagram = cleanUrl;
                console.log('✅ Instagram URL found from parent link of icon:', cleanUrl);
                return false; // Break out of each loop
              }
            }
          }
        });
      }

      // Search through all text content for additional patterns
      const pageText = response.data;
      const htmlText = $.html();

      // Search for Facebook links in text content
      if (!socialLinks.facebook) {
        for (const pattern of facebookPatterns) {
          const matches = [...pageText.matchAll(pattern)];
          for (const match of matches) {
            const url = this.cleanSocialUrl(match[0], 'facebook');
            if (url && this.isValidFacebookUrl(url)) {
              socialLinks.facebook = url;
              console.log('Facebook detected via text pattern:', url);
              break;
            }
          }
          if (socialLinks.facebook) break;
        }
      }

      // Search for Instagram links in text content
      if (!socialLinks.instagram) {
        for (const pattern of instagramPatterns) {
          const matches = [...pageText.matchAll(pattern)];
          for (const match of matches) {
            const url = this.cleanSocialUrl(match[0], 'instagram');
            if (url && this.isValidInstagramUrl(url)) {
              socialLinks.instagram = url;
              console.log('Instagram detected via text pattern:', url);
              break;
            }
          }
          if (socialLinks.instagram) break;
        }
      }

      // Search for Twitter links
      for (const pattern of twitterPatterns) {
        const matches = [...pageText.matchAll(pattern)];
        for (const match of matches) {
          const url = this.cleanSocialUrl(match[0], 'twitter');
          if (url && this.isValidTwitterUrl(url)) {
            socialLinks.twitter = url;
            console.log('Twitter detected via pattern:', url);
            break;
          }
        }
        if (socialLinks.twitter) break;
      }

      // Search for YouTube links
      for (const pattern of youtubePatterns) {
        const matches = [...pageText.matchAll(pattern)];
        for (const match of matches) {
          const url = this.cleanSocialUrl(match[0], 'youtube');
          if (url && this.isValidYouTubeUrl(url)) {
            socialLinks.youtube = url;
            console.log('YouTube detected via pattern:', url);
            break;
          }
        }
        if (socialLinks.youtube) break;
      }

      // Search for TikTok links
      for (const pattern of tiktokPatterns) {
        const matches = [...pageText.matchAll(pattern)];
        for (const match of matches) {
          const url = this.cleanSocialUrl(match[0], 'tiktok');
          if (url && this.isValidTikTokUrl(url)) {
            socialLinks.tiktok = url;
            console.log('TikTok detected via pattern:', url);
            break;
          }
        }
        if (socialLinks.tiktok) break;
      }

      // Search for LinkedIn links
      for (const pattern of linkedinPatterns) {
        const matches = [...pageText.matchAll(pattern)];
        for (const match of matches) {
          const url = this.cleanSocialUrl(match[0], 'linkedin');
          if (url && this.isValidLinkedInUrl(url)) {
            socialLinks.linkedin = url;
            console.log('LinkedIn detected via pattern:', url);
            break;
          }
        }
        if (socialLinks.linkedin) break;
      }

      // Also search through HTML attributes and link tags
      $('a[href*="facebook.com"]').each((_, element) => {
        if (!socialLinks.facebook) {
          const href = $(element).attr('href');
          if (href && this.isValidFacebookUrl(href)) {
            socialLinks.facebook = this.cleanSocialUrl(href, 'facebook');
            console.log('Facebook detected via HTML link:', socialLinks.facebook);
          }
        }
      });

      $('a[href*="instagram.com"]').each((_, element) => {
        if (!socialLinks.instagram) {
          const href = $(element).attr('href');
          if (href && this.isValidInstagramUrl(href)) {
            socialLinks.instagram = this.cleanSocialUrl(href, 'instagram');
            console.log('Instagram detected via HTML link:', socialLinks.instagram);
          }
        }
      });

      $('a[href*="twitter.com"], a[href*="x.com"]').each((_, element) => {
        if (!socialLinks.twitter) {
          const href = $(element).attr('href');
          if (href && this.isValidTwitterUrl(href)) {
            socialLinks.twitter = this.cleanSocialUrl(href, 'twitter');
            console.log('Twitter detected via HTML link:', socialLinks.twitter);
          }
        }
      });

      $('a[href*="youtube.com"]').each((_, element) => {
        if (!socialLinks.youtube) {
          const href = $(element).attr('href');
          if (href && this.isValidYouTubeUrl(href)) {
            socialLinks.youtube = this.cleanSocialUrl(href, 'youtube');
            console.log('YouTube detected via HTML link:', socialLinks.youtube);
          }
        }
      });

      $('a[href*="tiktok.com"]').each((_, element) => {
        if (!socialLinks.tiktok) {
          const href = $(element).attr('href');
          if (href && this.isValidTikTokUrl(href)) {
            socialLinks.tiktok = this.cleanSocialUrl(href, 'tiktok');
            console.log('TikTok detected via HTML link:', socialLinks.tiktok);
          }
        }
      });

      $('a[href*="linkedin.com"]').each((_, element) => {
        if (!socialLinks.linkedin) {
          const href = $(element).attr('href');
          if (href && this.isValidLinkedInUrl(href)) {
            socialLinks.linkedin = this.cleanSocialUrl(href, 'linkedin');
            console.log('LinkedIn detected via HTML link:', socialLinks.linkedin);
          }
        }
      });

      return socialLinks;

    } catch (error) {
      console.error('Error scanning website for social media:', error);
      return {};
    }
  }

  private async checkGooglePlacesForSocialMedia(placeId: string): Promise<SocialMediaLinks> {
    try {
      // Use enhanced Google Places API call to get all available fields including social media
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'name,website,url,editorial_summary,reviews',
          key: process.env.GOOGLE_PLACES_API_KEY,
          reviews_no_translations: true
        }
      });

      console.log('Google Places social media check - Status:', response.data.status);
      
      if (response.data.status !== 'OK') {
        console.log('Google Places API unavailable for social media check');
        return {};
      }

      const place = response.data.result;
      const socialLinks: SocialMediaLinks = {};

      // Check if the website field contains social media URLs
      if (place?.website) {
        const websiteUrl = place.website;
        console.log('Checking Google Places website field for social media:', websiteUrl);
        
        if (websiteUrl.includes('facebook.com') && this.isValidFacebookUrl(websiteUrl)) {
          socialLinks.facebook = this.cleanSocialUrl(websiteUrl, 'facebook');
          console.log('Facebook found in Google Places website field:', socialLinks.facebook);
        } else if (websiteUrl.includes('instagram.com') && this.isValidInstagramUrl(websiteUrl)) {
          socialLinks.instagram = this.cleanSocialUrl(websiteUrl, 'instagram');
          console.log('Instagram found in Google Places website field:', socialLinks.instagram);
        } else if ((websiteUrl.includes('twitter.com') || websiteUrl.includes('x.com')) && this.isValidTwitterUrl(websiteUrl)) {
          socialLinks.twitter = this.cleanSocialUrl(websiteUrl, 'twitter');
          console.log('Twitter found in Google Places website field:', socialLinks.twitter);
        }
      }

      // Check editorial summary for social media mentions
      if (place?.editorial_summary?.overview) {
        const overview = place.editorial_summary.overview;
        console.log('Checking Google Places editorial summary for social media mentions');
        
        // Look for social media URLs in the editorial summary
        const facebookMatch = overview.match(/facebook\.com\/[^\s\)]+/);
        if (facebookMatch && this.isValidFacebookUrl(`https://${facebookMatch[0]}`)) {
          socialLinks.facebook = this.cleanSocialUrl(`https://${facebookMatch[0]}`, 'facebook');
          console.log('Facebook found in editorial summary:', socialLinks.facebook);
        }
        
        const instagramMatch = overview.match(/instagram\.com\/[^\s\)]+/);
        if (instagramMatch && this.isValidInstagramUrl(`https://${instagramMatch[0]}`)) {
          socialLinks.instagram = this.cleanSocialUrl(`https://${instagramMatch[0]}`, 'instagram');
          console.log('Instagram found in editorial summary:', socialLinks.instagram);
        }
      }

      // Check recent reviews for social media mentions
      if (place?.reviews && Array.isArray(place.reviews)) {
        console.log('Checking Google Places reviews for social media mentions');
        for (const review of place.reviews.slice(0, 3)) { // Check first 3 reviews
          if (review.text) {
            const facebookMatch = review.text.match(/facebook\.com\/[^\s\)]+/);
            if (facebookMatch && !socialLinks.facebook && this.isValidFacebookUrl(`https://${facebookMatch[0]}`)) {
              socialLinks.facebook = this.cleanSocialUrl(`https://${facebookMatch[0]}`, 'facebook');
              console.log('Facebook found in review text:', socialLinks.facebook);
            }
            
            const instagramMatch = review.text.match(/instagram\.com\/[^\s\)]+/);
            if (instagramMatch && !socialLinks.instagram && this.isValidInstagramUrl(`https://${instagramMatch[0]}`)) {
              socialLinks.instagram = this.cleanSocialUrl(`https://${instagramMatch[0]}`, 'instagram');
              console.log('Instagram found in review text:', socialLinks.instagram);
            }
          }
        }
      }

      console.log('Google Places social media detection results:', socialLinks);
      return socialLinks;
    } catch (error) {
      console.error('Error checking Google Places for social media:', error);
      return {};
    }
  }

  private async scanMetaTagsAndStructuredData(websiteUrl: string): Promise<SocialMediaLinks> {
    try {
      const formattedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      
      const response = await axios.get(formattedUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const socialLinks: SocialMediaLinks = {};

      // Check JSON-LD structured data
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || '{}');
          if (jsonData.sameAs && Array.isArray(jsonData.sameAs)) {
            for (const url of jsonData.sameAs) {
              if (url.includes('facebook.com') && this.isValidFacebookUrl(url)) {
                socialLinks.facebook = this.cleanSocialUrl(url, 'facebook');
              } else if (url.includes('instagram.com') && this.isValidInstagramUrl(url)) {
                socialLinks.instagram = this.cleanSocialUrl(url, 'instagram');
              } else if ((url.includes('twitter.com') || url.includes('x.com')) && this.isValidTwitterUrl(url)) {
                socialLinks.twitter = this.cleanSocialUrl(url, 'twitter');
              } else if (url.includes('youtube.com') && this.isValidYouTubeUrl(url)) {
                socialLinks.youtube = this.cleanSocialUrl(url, 'youtube');
              } else if (url.includes('tiktok.com') && this.isValidTikTokUrl(url)) {
                socialLinks.tiktok = this.cleanSocialUrl(url, 'tiktok');
              } else if (url.includes('linkedin.com') && this.isValidLinkedInUrl(url)) {
                socialLinks.linkedin = this.cleanSocialUrl(url, 'linkedin');
              }
            }
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      });

      // Check Open Graph and meta tags
      const metaTags = [
        'og:url', 'twitter:url', 'fb:page_id', 'twitter:site', 'twitter:creator'
      ];

      for (const tag of metaTags) {
        const content = $(`meta[property="${tag}"], meta[name="${tag}"]`).attr('content');
        if (content) {
          if (content.includes('facebook.com') && this.isValidFacebookUrl(content)) {
            socialLinks.facebook = this.cleanSocialUrl(content, 'facebook');
          } else if (content.includes('instagram.com') && this.isValidInstagramUrl(content)) {
            socialLinks.instagram = this.cleanSocialUrl(content, 'instagram');
          } else if ((content.includes('twitter.com') || content.includes('x.com')) && this.isValidTwitterUrl(content)) {
            socialLinks.twitter = this.cleanSocialUrl(content, 'twitter');
          }
        }
      }

      return socialLinks;
    } catch (error) {
      console.error('Error scanning meta tags:', error);
      return {};
    }
  }

  private async recursiveSocialScan(websiteUrl: string): Promise<SocialMediaLinks> {
    const socialLinks: SocialMediaLinks = {};
    
    try {
      const baseUrl = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      
      // Common pages that might contain social media links
      const pagesToScan = [
        '/contact',
        '/about',
        '/social',
        '/follow',
        '/connect',
        '/footer'
      ];

      for (const page of pagesToScan) {
        try {
          const pageUrl = new URL(page, baseUrl).toString();
          const pageResponse = await axios.get(pageUrl, {
            timeout: 3000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const $ = cheerio.load(pageResponse.data);
          
          // Quick scan for social media links on this page
          const pageText = pageResponse.data;
          
          if (!socialLinks.facebook && pageText.includes('facebook.com')) {
            const fbMatch = pageText.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9\._-]+)/);
            if (fbMatch && this.isValidFacebookUrl(fbMatch[0])) {
              socialLinks.facebook = this.cleanSocialUrl(fbMatch[0], 'facebook');
            }
          }

          if (!socialLinks.instagram && pageText.includes('instagram.com')) {
            const igMatch = pageText.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9\._-]+)/);
            if (igMatch && this.isValidInstagramUrl(igMatch[0])) {
              socialLinks.instagram = this.cleanSocialUrl(igMatch[0], 'instagram');
            }
          }

          // Stop if we found both Facebook and Instagram
          if (socialLinks.facebook && socialLinks.instagram) {
            break;
          }

        } catch (pageError) {
          // Page doesn't exist or is inaccessible, continue to next page
          continue;
        }
      }

    } catch (error) {
      console.error('Error in recursive social scan:', error);
    }

    return socialLinks;
  }

  private cleanSocialUrl(url: string, platform: string): string {
    // Remove tracking parameters and clean URL
    let cleanUrl = url;
    
    // Add https if missing
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Remove common tracking parameters
    const urlObj = new URL(cleanUrl);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'src'];
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // Platform-specific cleaning
    if (platform === 'facebook') {
      // Remove Facebook-specific parameters
      ['fref', 'ref', 'hc_location', 'pnref'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
    } else if (platform === 'instagram') {
      // Remove Instagram-specific parameters
      ['igshid', 'hl'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
    } else if (platform === 'twitter') {
      // Remove Twitter-specific parameters
      ['ref_src', 'ref_url', 's'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
    }

    return urlObj.toString();
  }

  private isValidFacebookUrl(url: string): boolean {
    const facebookPatterns = [
      /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9\._-]+\/?$/,
      /^https?:\/\/(www\.)?facebook\.com\/pages\/[^\/]+\/\d+\/?$/,
      /^https?:\/\/(www\.)?facebook\.com\/profile\.php\?id=\d+$/,
      /^https?:\/\/(m\.)?facebook\.com\/[a-zA-Z0-9\._-]+\/?$/
    ];

    // Exclude common Facebook system URLs and API endpoints
    const excludePatterns = [
      /facebook\.com\/plugins/,
      /facebook\.com\/tr\?/,
      /facebook\.com\/sharer/,
      /facebook\.com\/share/,
      /facebook\.com\/login/,
      /facebook\.com\/v\d+/,
      /facebook\.com\/dialog/,
      /facebook\.com\/connect/,
      /facebook\.com\/oauth/,
      /facebook\.com\/security/,
      /facebook\.com\/privacy/,
      /facebook\.com\/help/,
      /facebook\.com\/support/,
      /facebook\.com\/policy/,
      /facebook\.com\/terms/,
      /facebook\.com\/about/,
      /facebook\.com\/business/,
      /facebook\.com\/developers/,
      /facebook\.com\/ads/,
      /facebook\.com\/api/,
      /facebook\.com\/ajax/,
      /facebook\.com\/rsrc/,
      /facebook\.com\/l\.php/,
      /facebook\.com\/r\.php/,
      /facebook\.com\/n\.php/,
      /facebook\.com\/posts/,
      /facebook\.com\/photos/,
      /facebook\.com\/videos/,
      /facebook\.com\/groups/,
      /facebook\.com\/events/,
      /facebook\.com\/marketplace/,
      /facebook\.com\/gaming/,
      /facebook\.com\/watch/,
      /facebook\.com\/stories/,
      /facebook\.com\/reels/,
      /facebook\.com\/live/,
      /facebook\.com\/photo/,
      /facebook\.com\/video/,
      /facebook\.com\/comment/,
      /facebook\.com\/like/,
      /facebook\.com\/reaction/,
      /facebook\.com\/tag/,
      /facebook\.com\/checkpoint/,
      /facebook\.com\/recover/,
      /facebook\.com\/reset/,
      /facebook\.com\/confirm/,
      /facebook\.com\/verify/,
      /facebook\.com\/reg/,
      /facebook\.com\/logout/,
      /facebook\.com\/home/,
      /facebook\.com\/feed/,
      /facebook\.com\/timeline/,
      /facebook\.com\/profile/,
      /facebook\.com\/friends/,
      /facebook\.com\/messages/,
      /facebook\.com\/notifications/,
      /facebook\.com\/settings/,
      /facebook\.com\/saved/,
      /facebook\.com\/bookmarks/,
      /facebook\.com\/search/,
      /facebook\.com\/find-friends/,
      /facebook\.com\/dating/,
      /facebook\.com\/jobs/,
      /facebook\.com\/fundraisers/,
      /facebook\.com\/donate/,
      /facebook\.com\/weather/,
      /facebook\.com\/news/,
      /facebook\.com\/memories/,
      /facebook\.com\/external/,
      /facebook\.com\/common/,
      /facebook\.com\/intern/,
      /facebook\.com\/desktop/,
      /facebook\.com\/mobile/,
      /facebook\.com\/touch/,
      /facebook\.com\/lite/,
      /facebook\.com\/zero/,
      /facebook\.com\/basic/
    ];

    // Check if URL matches any exclude pattern
    for (const pattern of excludePatterns) {
      if (pattern.test(url)) {
        console.log(`Facebook URL excluded (${pattern.toString()}):`, url);
        return false;
      }
    }

    const isValidPattern = facebookPatterns.some(pattern => pattern.test(url));
    if (isValidPattern) {
      console.log('Valid Facebook URL found:', url);
    }
    
    return isValidPattern;
  }

  private isValidInstagramUrl(url: string): boolean {
    const instagramPatterns = [
      /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9\._-]+\/?$/,
      /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9\._-]+\/$/
    ];

    return instagramPatterns.some(pattern => pattern.test(url)) && 
           !url.includes('/p/') && 
           !url.includes('/reel/') && 
           !url.includes('/tv/') &&
           !url.includes('/stories/');
  }

  private isValidTwitterUrl(url: string): boolean {
    const twitterPatterns = [
      /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9\._-]+\/?$/
    ];

    return twitterPatterns.some(pattern => pattern.test(url)) && 
           !url.includes('/status/') && 
           !url.includes('/tweet/');
  }

  private isValidYouTubeUrl(url: string): boolean {
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/channel\/[a-zA-Z0-9\._-]+\/?$/,
      /^https?:\/\/(www\.)?youtube\.com\/c\/[a-zA-Z0-9\._-]+\/?$/,
      /^https?:\/\/(www\.)?youtube\.com\/user\/[a-zA-Z0-9\._-]+\/?$/,
      /^https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9\._-]+\/?$/
    ];

    return youtubePatterns.some(pattern => pattern.test(url));
  }

  private isValidTikTokUrl(url: string): boolean {
    const tiktokPatterns = [
      /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9\._-]+\/?$/
    ];

    return tiktokPatterns.some(pattern => pattern.test(url));
  }

  private isValidLinkedInUrl(url: string): boolean {
    const linkedinPatterns = [
      /^https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9\._-]+\/?$/,
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\._-]+\/?$/
    ];

    return linkedinPatterns.some(pattern => pattern.test(url));
  }
}