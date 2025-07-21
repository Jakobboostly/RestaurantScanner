import { chromium } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SerpScreenshotResult {
  keyword: string;
  location: string;
  screenshotBase64: string;
  restaurantRanking: {
    position: number;
    found: boolean;
    title: string;
    url: string;
    snippet: string;
  } | null;
  totalResults: number;
  searchUrl: string;
  localPackPresent: boolean;
  localPackResults: Array<{
    name: string;
    rating: number;
    reviews: number;
    position: number;
  }>;
}

export class SerpScreenshotService {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private requestCounter = 0;
  
  async captureSearchResults(
    keyword: string,
    restaurantName: string,
    restaurantDomain: string,
    location: string = 'United States'
  ): Promise<SerpScreenshotResult> {
    let browser;
    
    try {
      console.log('Launching Playwright browser for SERP screenshot...');
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-first-run',
          '--disable-gpu',
          '--single-process',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      console.log('Playwright browser launched successfully');
      
      const page = await browser.newPage();
      
      // Randomize user agent slightly to avoid detection
      this.requestCounter++;
      const randomizedUserAgent = this.userAgent.replace('120.0.0.0', `120.${this.requestCounter % 10}.0.${this.requestCounter % 100}`);
      await page.setUserAgent(randomizedUserAgent);
      
      // Set additional headers to appear more human-like
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });
      
      // Set viewport to standard desktop size
      await page.setViewportSize({
        width: 1366,
        height: 768
      });
      
      // Add random delay to appear more human-like
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      // Use the keyword as-is since it already contains location info
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=20`;
      
      console.log(`Capturing SERP screenshot for: ${keyword}`);
      console.log(`Screenshot service URL: ${searchUrl}`);
      
      // Navigate to Google search results
      console.log('Navigating to search URL...');
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 12000 
      });
      
      console.log('Page loaded successfully, waiting for search results...');
      
      // Wait for the search results container to load (as you suggested)
      try {
        await page.waitForSelector('#search', { timeout: 8000 });
        console.log('Search results container found successfully!');
      } catch (error) {
        console.log('Search results container not found, checking for captcha...');
        
        // Check for captcha or bot detection
        const pageContent = await page.content();
        const isCaptcha = pageContent.includes('recaptcha') || 
                         pageContent.includes('captcha') || 
                         pageContent.includes('verify you are human') ||
                         pageContent.includes('unusual traffic') ||
                         pageContent.includes('robot') ||
                         pageContent.includes('automated queries');
        
        if (isCaptcha) {
          console.log('CAPTCHA detected! Google is blocking automated access.');
          console.log('Page title:', await page.title());
          throw new Error('CAPTCHA blocking screenshot capture - Google detected automated access');
        }
        
        // If no captcha, continue anyway
        console.log('No captcha detected, proceeding with screenshot...');
      }
      
      // Remove cookie banners, ads, and other distractions
      await page.evaluate(() => {
        // Remove cookie consent banners
        const cookieElements = document.querySelectorAll('[id*="cookie"], [class*="cookie"], [id*="consent"], [class*="consent"]');
        cookieElements.forEach(el => el.remove());
        
        // Remove ads
        const adElements = document.querySelectorAll('[data-text-ad], .ads-ad, .commercial-unit-desktop-top, .commercial-unit-desktop-rhs');
        adElements.forEach(el => el.remove());
        
        // Remove "People also ask" section to focus on organic results
        const paaElements = document.querySelectorAll('[data-initq], .related-question-pair');
        paaElements.forEach(el => el.remove());
        
        // Remove captcha elements if any
        const captchaElements = document.querySelectorAll('[id*="captcha"], [class*="captcha"], [id*="recaptcha"], [class*="recaptcha"]');
        captchaElements.forEach(el => el.remove());
      });
      
      // Capture screenshot of search results (using Playwright syntax)
      console.log('Capturing screenshot...');
      const screenshotBuffer = await page.screenshot({
        fullPage: true  // Use full page as you suggested
      });
      console.log('Screenshot captured, size:', screenshotBuffer.length, 'bytes');
      
      // Analyze the search results
      const finalPageContent = await page.content();
      const analysisResult = await this.analyzeSearchResults(
        finalPageContent,
        restaurantName,
        restaurantDomain,
        keyword,
        location
      );
      
      const screenshotBase64 = screenshotBuffer.toString('base64');
      
      return {
        keyword,
        location,
        screenshotBase64,
        restaurantRanking: analysisResult.restaurantRanking,
        totalResults: analysisResult.totalResults,
        searchUrl,
        localPackPresent: analysisResult.localPackPresent,
        localPackResults: analysisResult.localPackResults
      };
      
    } catch (error) {
      console.error('Error capturing SERP screenshot:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('Browser closed successfully');
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  }
  
  private async analyzeSearchResults(
    pageContent: string,
    restaurantName: string,
    restaurantDomain: string,
    keyword: string,
    location: string
  ) {
    const $ = cheerio.load(pageContent);
    
    // Find total results count
    const resultsStats = $('#result-stats').text();
    const totalResultsMatch = resultsStats.match(/About ([\d,]+) results/);
    const totalResults = totalResultsMatch ? parseInt(totalResultsMatch[1].replace(/,/g, '')) : 0;
    
    // Check for local pack presence
    const localPackPresent = $('.cu-container').length > 0 || $('[data-attrid="kc:/location/location:local_3_pack"]').length > 0;
    
    // Extract local pack results
    const localPackResults = [];
    if (localPackPresent) {
      $('.cu-container .VkpGBb, [data-attrid="kc:/location/location:local_3_pack"] .VkpGBb').each((index, element) => {
        const nameEl = $(element).find('.OSrXXb');
        const ratingEl = $(element).find('.yi40Hd');
        const reviewsEl = $(element).find('.RDApEe');
        
        if (nameEl.length > 0) {
          const name = nameEl.text().trim();
          const rating = parseFloat(ratingEl.text().trim()) || 0;
          const reviewsText = reviewsEl.text().trim();
          const reviewsMatch = reviewsText.match(/\((\d+)\)/);
          const reviews = reviewsMatch ? parseInt(reviewsMatch[1]) : 0;
          
          localPackResults.push({
            name,
            rating,
            reviews,
            position: index + 1
          });
        }
      });
    }
    
    // Find restaurant ranking in organic results - use more flexible selectors
    let restaurantRanking = null;
    const organicResults = $('div[data-ved], .g, .tF2Cxc, .yuRUbf').slice(0, 20);
    
    organicResults.each((index, element) => {
      const linkEl = $(element).find('h3').parent();
      const titleEl = $(element).find('h3');
      const snippetEl = $(element).find('.VwiC3b, .s');
      
      if (linkEl.length > 0 && titleEl.length > 0) {
        const url = linkEl.attr('href') || '';
        const title = titleEl.text().trim();
        const snippet = snippetEl.text().trim();
        
        // Check if this result matches the restaurant
        const matchesDomain = url.includes(restaurantDomain.replace(/^https?:\/\//, ''));
        const matchesName = title.toLowerCase().includes(restaurantName.toLowerCase());
        const matchesKeyword = title.toLowerCase().includes(keyword.toLowerCase()) || 
                               snippet.toLowerCase().includes(keyword.toLowerCase());
        
        if ((matchesDomain || matchesName) && matchesKeyword) {
          restaurantRanking = {
            position: index + 1,
            found: true,
            title,
            url,
            snippet
          };
          return false; // Break the loop
        }
      }
    });
    
    return {
      restaurantRanking,
      totalResults,
      localPackPresent,
      localPackResults
    };
  }
  
  async captureMultipleKeywords(
    keywords: string[],
    restaurantName: string,
    restaurantDomain: string,
    location: string = 'United States'
  ): Promise<SerpScreenshotResult[]> {
    const results = [];
    
    for (const keyword of keywords.slice(0, 3)) { // Limit to 3 keywords to avoid rate limiting
      try {
        const result = await this.captureSearchResults(keyword, restaurantName, restaurantDomain, location);
        results.push(result);
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to capture screenshot for keyword: ${keyword}`, error);
        // Continue with other keywords even if one fails
      }
    }
    
    return results;
  }
}