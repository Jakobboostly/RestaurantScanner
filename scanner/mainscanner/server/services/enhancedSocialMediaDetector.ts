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
        console.log('✅ Using Apify social media data:', JSON.stringify(apifySocialData, null, 2));
        
        // Handle both possible data structures
        if (apifySocialData.facebook) {
          result.facebook = apifySocialData.facebook;
          console.log('📘 Facebook from Apify:', result.facebook);
        } else if (apifySocialData.facebooks?.length > 0) {
          result.facebook = apifySocialData.facebooks[0];
          console.log('📘 Facebook from Apify (array):', result.facebook);
        }
        
        if (apifySocialData.instagram) {
          result.instagram = apifySocialData.instagram;
          console.log('📷 Instagram from Apify:', result.instagram);
        } else if (apifySocialData.instagrams?.length > 0) {
          result.instagram = apifySocialData.instagrams[0];
          console.log('📷 Instagram from Apify (array):', result.instagram);
        }
        
        if (apifySocialData.twitter) {
          result.twitter = apifySocialData.twitter;
          console.log('🐦 Twitter from Apify:', result.twitter);
        }
        
        // If we found social media from Apify, return early
        if (result.facebook || result.instagram || result.twitter) {
          console.log('✅ Social media found via Apify - skipping website scan');
          return result;
        }
      }

      // Step 2: Website scanning for social media links
      try {
        console.log('🔍 Scanning website for social media links...');
        console.log('🔍 Target domain:', domain);
        
        // Ensure domain has protocol
        const targetUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        console.log('🔍 Normalized URL:', targetUrl);
        
        const response = await axios.get(targetUrl, {
          timeout: 15000, // Increased timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          maxRedirects: 5
        });
        
        console.log(`🔍 Website loaded successfully (${response.data.length} characters)`);
        console.log(`🔍 Response status: ${response.status}`);
        console.log(`🔍 Content preview: ${response.data.substring(0, 200)}...`);

        const $ = cheerio.load(response.data);
        
        // Enhanced Facebook detection patterns
        const facebookSelectors = [
          'a[href*="facebook.com/"]:not([href*="/sharer/"]):not([href*="/share.php"]):not([href*="/tr?"]):not([href*="/plugins/"])',
          'a[href*="fb.com/"]',
          'a[href*="fb.me/"]',
          'div[data-href*="facebook.com/"]',
          'iframe[src*="facebook.com/"]',
          '[class*="facebook"] a[href*="facebook.com/"]',
          '[class*="fb"] a[href*="facebook.com/"]',
          '[id*="facebook"] a[href*="facebook.com/"]',
          'a[title*="facebook" i]',
          'a[alt*="facebook" i]',
          'a[class*="facebook" i]',
          'a[data-social*="facebook" i]',
          'a[href*="m.facebook.com/"]'
        ];

        // Enhanced Instagram detection patterns  
        const instagramSelectors = [
          'a[href*="instagram.com/"]:not([href*="/share"]):not([href*="/embed"])',
          'a[href*="instagr.am/"]',
          'div[data-href*="instagram.com/"]',
          '[class*="instagram"] a[href*="instagram.com/"]',
          '[class*="insta"] a[href*="instagram.com/"]',
          '[id*="instagram"] a[href*="instagram.com/"]',
          'a[title*="instagram" i]',
          'a[alt*="instagram" i]',
          'a[class*="instagram" i]',
          'a[data-social*="instagram" i]',
          'a[href*="ig.me/"]'
        ];


        // Twitter detection patterns
        const twitterSelectors = [
          'a[href*="twitter.com/"]:not([href*="/share"]):not([href*="/intent/"])',
          'a[href*="x.com/"]:not([href*="/share"]):not([href*="/intent/"])',
          'a[href*="t.co/"]',
          '[class*="twitter"] a',
          'a[title*="twitter" i]',
          'a[class*="twitter" i]',
          'a[data-social*="twitter" i]'
        ];

        // Enhanced Facebook detection
        if (!result.facebook) {
          console.log('🔍 Searching for Facebook links...');
          
          // Try CSS selectors first
          for (const selector of facebookSelectors) {
            console.log(`   Trying selector: ${selector}`);
            const links = $(selector);
            console.log(`   Found ${links.length} potential matches`);
            
            links.each((i, element) => {
              const href = $(element).attr('href') || $(element).attr('data-href') || $(element).attr('src');
              console.log(`   Checking href: ${href}`);
              if (href && this.isValidFacebookUrl(href)) {
                result.facebook = this.cleanSocialUrl(href);
                console.log('📘 Facebook found via CSS selector:', result.facebook);
                return false; // Break out of each loop
              }
            });
            if (result.facebook) break;
          }
          
          // Try comprehensive text search if selectors failed
          if (!result.facebook) {
            console.log('🔍 No Facebook found with selectors, trying comprehensive text search...');
            const facebookPatterns = [
              /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
              /https?:\/\/(?:www\.)?fb\.com\/[a-zA-Z0-9._-]+/gi,
              /https?:\/\/m\.facebook\.com\/[a-zA-Z0-9._-]+/gi,
              /(?:facebook\.com\/|fb\.com\/|@)[a-zA-Z0-9._-]+/gi
            ];
            
            for (const pattern of facebookPatterns) {
              const matches = response.data.match(pattern);
              if (matches) {
                for (let match of matches) {
                  // Ensure proper URL format
                  if (!match.startsWith('http')) {
                    match = match.replace(/^(?:facebook\.com\/|fb\.com\/|@)/, 'https://facebook.com/');
                  }
                  if (this.isValidFacebookUrl(match)) {
                    result.facebook = this.cleanSocialUrl(match);
                    console.log('📘 Facebook found via text pattern:', result.facebook);
                    break;
                  }
                }
                if (result.facebook) break;
              }
            }
          }
        }

        // Enhanced Instagram detection
        if (!result.instagram) {
          console.log('🔍 Searching for Instagram links...');
          
          // Try CSS selectors first
          for (const selector of instagramSelectors) {
            console.log(`   Trying selector: ${selector}`);
            const links = $(selector);
            console.log(`   Found ${links.length} potential matches`);
            
            links.each((i, element) => {
              const href = $(element).attr('href') || $(element).attr('data-href') || $(element).attr('src');
              console.log(`   Checking href: ${href}`);
              if (href && this.isValidInstagramUrl(href)) {
                result.instagram = this.cleanSocialUrl(href);
                console.log('📷 Instagram found via CSS selector:', result.instagram);
                return false; // Break out of each loop
              }
            });
            if (result.instagram) break;
          }
          
          // Try comprehensive text search if selectors failed
          if (!result.instagram) {
            console.log('🔍 No Instagram found with selectors, trying comprehensive text search...');
            const instagramPatterns = [
              /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/gi,
              /https?:\/\/(?:www\.)?instagr\.am\/[a-zA-Z0-9._-]+/gi,
              /(?:instagram\.com\/|instagr\.am\/|@)[a-zA-Z0-9._-]+/gi
            ];
            
            for (const pattern of instagramPatterns) {
              const matches = response.data.match(pattern);
              if (matches) {
                for (let match of matches) {
                  // Ensure proper URL format
                  if (!match.startsWith('http')) {
                    match = match.replace(/^(?:instagram\.com\/|instagr\.am\/|@)/, 'https://instagram.com/');
                  }
                  if (this.isValidInstagramUrl(match)) {
                    result.instagram = this.cleanSocialUrl(match);
                    console.log('📷 Instagram found via text pattern:', result.instagram);
                    break;
                  }
                }
                if (result.instagram) break;
              }
            }
          }
        }

        // Enhanced Twitter/X detection
        if (!result.twitter) {
          console.log('🔍 Searching for Twitter/X links...');
          
          // Try CSS selectors first
          for (const selector of twitterSelectors) {
            console.log(`   Trying selector: ${selector}`);
            const links = $(selector);
            console.log(`   Found ${links.length} potential matches`);
            
            links.each((i, element) => {
              const href = $(element).attr('href') || $(element).attr('data-href');
              console.log(`   Checking href: ${href}`);
              if (href && this.isValidTwitterUrl(href)) {
                result.twitter = this.cleanSocialUrl(href);
                console.log('🐦 Twitter found via CSS selector:', result.twitter);
                return false; // Break out of each loop
              }
            });
            if (result.twitter) break;
          }
          
          // Try comprehensive text search if selectors failed
          if (!result.twitter) {
            console.log('🔍 No Twitter found with selectors, trying comprehensive text search...');
            const twitterPatterns = [
              /https?:\/\/(?:www\.)?twitter\.com\/[a-zA-Z0-9._-]+/gi,
              /https?:\/\/(?:www\.)?x\.com\/[a-zA-Z0-9._-]+/gi,
              /(?:twitter\.com\/|x\.com\/|@)[a-zA-Z0-9._-]+/gi
            ];
            
            for (const pattern of twitterPatterns) {
              const matches = response.data.match(pattern);
              if (matches) {
                for (let match of matches) {
                  // Ensure proper URL format
                  if (!match.startsWith('http')) {
                    match = match.replace(/^(?:twitter\.com\/|x\.com\/|@)/, 'https://twitter.com/');
                  }
                  if (this.isValidTwitterUrl(match)) {
                    result.twitter = this.cleanSocialUrl(match);
                    console.log('🐦 Twitter found via text pattern:', result.twitter);
                    break;
                  }
                }
                if (result.twitter) break;
              }
            }
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

  private isValidTwitterUrl(url: string): boolean {
    if (!url) return false;
    
    const cleanUrl = url.toLowerCase().trim();
    
    // Must contain twitter.com or x.com
    if (!cleanUrl.includes('twitter.com') && !cleanUrl.includes('x.com')) {
      return false;
    }

    // Exclude Twitter system URLs and share links
    const excludePatterns = [
      '/share', '/intent/', '/oauth/', '/api/', '/i/web/', '/home'
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