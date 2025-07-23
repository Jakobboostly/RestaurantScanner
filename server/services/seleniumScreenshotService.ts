import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { screenshots, type InsertScreenshot } from '@shared/schema';

export interface SeleniumScreenshotResult {
  keyword: string;
  location: string;
  screenshotPath: string;
  screenshotBase64: string;
  restaurantRanking: any;
  totalResults: number;
  searchUrl: string;
  localPackPresent: boolean;
  localPackResults: any[];
}

export class SeleniumScreenshotService {
  private screenshotDir: string;

  constructor() {
    this.screenshotDir = path.join(process.cwd(), 'screenshots');
    this.ensureScreenshotDir();
  }

  private async ensureScreenshotDir(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create screenshot directory:', error);
    }
  }

  async captureGoogleSearch(
    cuisineType: string,
    city: string,
    restaurantName: string,
    restaurantDomain: string
  ): Promise<SeleniumScreenshotResult> {
    let driver: WebDriver | null = null;

    try {
      // Build search query in "food type + city" format
      const keyword = `${cuisineType} ${city}`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
      
      console.log(`🔍 Capturing SERP screenshot via Selenium for: "${keyword}"`);
      console.log(`📍 Search URL: ${searchUrl}`);

      // Configure Chrome options for headless operation
      const options = new chrome.Options();
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--window-size=1366,768');
      options.addArguments('--disable-extensions');
      options.addArguments('--disable-web-security');
      options.addArguments('--allow-running-insecure-content');

      // Configure Chrome binary path for different environments
      const possibleChromePaths = [
        process.env.CHROME_BIN, // Cloud Run environment variable
        '/usr/bin/google-chrome-stable', // Standard Linux
        '/usr/bin/google-chrome', // Alternative Linux
        '/usr/bin/chromium-browser', // Chromium on Ubuntu
        '/usr/bin/chromium', // Alternative Chromium
        '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium', // Replit Nix
        '/opt/google/chrome/google-chrome' // Cloud Run
      ].filter(Boolean);

      let chromeBinary = null;
      for (const path of possibleChromePaths) {
        try {
          const { execSync } = await import('child_process');
          execSync(`test -f "${path}"`, { stdio: 'ignore' });
          chromeBinary = path;
          break;
        } catch {
          continue;
        }
      }

      if (chromeBinary) {
        options.setChromeBinaryPath(chromeBinary);
        console.log(`Using Chrome binary: ${chromeBinary}`);
      } else {
        console.log('Using default Chrome binary (system PATH)');
      }

      // Create WebDriver instance
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      // Navigate to Google search
      console.log('🚀 Navigating to Google search...');
      await driver.get(searchUrl);

      // Wait for search results to load
      console.log('⏳ Waiting for search results...');
      await driver.sleep(3000);

      // Take screenshot
      const timestamp = Date.now();
      const filename = `${cuisineType}_${city}_${timestamp}.png`;
      const screenshotPath = path.join(this.screenshotDir, filename);
      
      console.log('📸 Taking screenshot...');
      const screenshotBase64 = await driver.takeScreenshot();
      
      // Save screenshot to file (for backup)
      await fs.writeFile(screenshotPath, screenshotBase64, 'base64');
      
      // Save screenshot to database
      const screenshotRecord: InsertScreenshot = {
        keyword,
        location: city,
        searchUrl,
        imageData: screenshotBase64,
        fileSize: Math.round(screenshotBase64.length * 0.75), // approximate size in bytes
        restaurantName,
        restaurantDomain,
        restaurantRanking: null,
        localPackPresent: true,
        localPackResults: [],
        totalResults: 0
      };

      const [dbResult] = await db.insert(screenshots).values(screenshotRecord).returning();
      console.log(`✅ Screenshot saved to database: ID ${dbResult.id}, Size: ${Math.round(screenshotBase64.length * 0.75 / 1024)} KB`);

      // Basic restaurant ranking analysis
      let restaurantRanking = null;
      try {
        // Look for restaurant in search results
        const searchResults = await driver.findElements(By.css('div[data-hveid] h3'));
        for (let i = 0; i < Math.min(searchResults.length, 10); i++) {
          const result = searchResults[i];
          const text = await result.getText();
          if (text.toLowerCase().includes(restaurantName.toLowerCase())) {
            restaurantRanking = {
              position: i + 1,
              found: true,
              title: text,
              url: restaurantDomain || '',
              snippet: `Found at position ${i + 1}`
            };
            break;
          }
        }
      } catch (rankingError) {
        console.log('⚠️ Could not analyze ranking:', rankingError);
      }

      return {
        keyword,
        location: city,
        screenshotPath,
        screenshotBase64,
        restaurantRanking,
        totalResults: 0, // Would need additional parsing to get this
        searchUrl,
        localPackPresent: true, // Assume local pack is present for restaurant searches
        localPackResults: []
      };

    } catch (error) {
      console.error('❌ Selenium screenshot capture failed:', error);
      
      // Return fallback result
      const keyword = `${cuisineType} ${city}`;
      return {
        keyword,
        location: city,
        screenshotPath: '',
        screenshotBase64: '',
        restaurantRanking: null,
        totalResults: 0,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
        localPackPresent: false,
        localPackResults: []
      };
    } finally {
      // Always quit the driver
      if (driver) {
        try {
          await driver.quit();
          console.log('🔚 WebDriver session closed');
        } catch (quitError) {
          console.error('Error closing WebDriver:', quitError);
        }
      }
    }
  }

  // Helper method to extract cuisine type from restaurant name/business info
  extractCuisineType(restaurantName: string, businessTypes?: string[]): string {
    const name = restaurantName.toLowerCase();
    const types = businessTypes?.join(' ').toLowerCase() || '';
    const combined = `${name} ${types}`;

    // Enhanced cuisine type detection with 15+ categories
    if (combined.includes('pizza')) return 'pizza';
    if (combined.includes('brewery') || combined.includes('beer') || combined.includes('ale')) return 'brewery';
    if (combined.includes('pub') || combined.includes('bar') || combined.includes('tavern')) return 'pub';
    if (combined.includes('coffee') || combined.includes('cafe') || combined.includes('espresso')) return 'coffee shop';
    if (combined.includes('bakery') || combined.includes('bread') || combined.includes('pastry')) return 'bakery';
    if (combined.includes('chicken') || combined.includes('fried chicken')) return 'chicken restaurant';
    if (combined.includes('burger') || combined.includes('hamburger')) return 'burger restaurant';
    if (combined.includes('mexican') || combined.includes('taco') || combined.includes('burrito')) return 'mexican food';
    if (combined.includes('chinese') || combined.includes('asian')) return 'chinese restaurant';
    if (combined.includes('italian') || combined.includes('pasta')) return 'italian restaurant';
    if (combined.includes('french')) return 'french restaurant';
    if (combined.includes('mediterranean') || combined.includes('greek')) return 'mediterranean restaurant';
    if (combined.includes('indian') || combined.includes('curry')) return 'indian restaurant';
    if (combined.includes('thai')) return 'thai restaurant';
    if (combined.includes('sushi') || combined.includes('japanese')) return 'sushi restaurant';
    if (combined.includes('diner') || combined.includes('american')) return 'american diner';
    
    // Default fallback
    return 'restaurant';
  }

  // Helper method to extract city from Google Places formatted address
  extractCityState(formattedAddress: string): { city: string; state: string } {
    try {
      // Format: "Street Address, City, State ZIP, Country"
      const parts = formattedAddress.split(', ');
      if (parts.length >= 3) {
        const city = parts[1].trim();
        const stateZip = parts[2].trim();
        const state = stateZip.split(' ')[0].trim();
        
        return { city, state };
      }
    } catch (error) {
      console.error('Error extracting city/state:', error);
    }
    
    return { city: 'Unknown', state: 'Unknown' };
  }
}