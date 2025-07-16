import puppeteer from 'puppeteer';
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
  
  async captureSearchResults(
    keyword: string,
    restaurantName: string,
    restaurantDomain: string,
    location: string = 'United States'
  ): Promise<SerpScreenshotResult> {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      await page.setUserAgent(this.userAgent);
      
      // Set viewport to standard desktop size
      await page.setViewport({
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
      });
      
      // Construct Google search URL with location
      const searchQuery = `${keyword} ${location}`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=20`;
      
      console.log(`Capturing SERP screenshot for: ${searchQuery}`);
      
      // Navigate to Google search results
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for search results to load
      await page.waitForSelector('#search', { timeout: 10000 });
      
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
      });
      
      // Capture screenshot of search results
      const screenshotBuffer = await page.screenshot({
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: 1366,
          height: 768
        }
      });
      
      // Analyze the search results
      const pageContent = await page.content();
      const analysisResult = await this.analyzeSearchResults(
        pageContent,
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
      throw error;
    } finally {
      if (browser) {
        await browser.close();
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
    
    // Find restaurant ranking in organic results
    let restaurantRanking = null;
    const organicResults = $('[data-sokoban-container] .g, .g').slice(0, 20);
    
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