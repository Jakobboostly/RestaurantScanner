import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import fs from 'fs/promises';
import path from 'path';

export interface RestaurantSearchScreenshotResult {
  success: boolean;
  screenshotBase64?: string;
  screenshotPath?: string;
  error?: string;
  timestamp: string;
}

export class RestaurantSearchScreenshotService {
  private screenshotDir: string;

  constructor() {
    this.screenshotDir = path.join(process.cwd(), 'screenshots');
    this.ensureScreenshotDir();
  }

  private async ensureScreenshotDir(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
      console.log('Screenshots directory ensured');
    } catch (error) {
      console.error('Failed to create screenshot directory:', error);
    }
  }

  async searchRestaurantsAndScreenshot(searchQuery: string = 'restaurants near me'): Promise<RestaurantSearchScreenshotResult> {
    let driver: WebDriver | null = null;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
      console.log('🚀 Starting restaurant search script...');
      console.log('🔍 Opening Google...');

      // Configure Chrome options for headless mode
      const chromeOptions = new chrome.Options();
      chromeOptions.addArguments('--headless'); // Run in headless mode
      chromeOptions.addArguments('--no-sandbox');
      chromeOptions.addArguments('--disable-dev-shm-usage');
      chromeOptions.addArguments('--disable-gpu');
      chromeOptions.addArguments('--window-size=1366,768'); // Set window size
      chromeOptions.addArguments('--disable-web-security');
      chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
      chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Use correct Chrome binary for Replit Nix environment
      const chromeBinary = '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium-browser';
      chromeOptions.setChromeBinaryPath(chromeBinary);
      console.log(`Using Chrome binary: ${chromeBinary}`);

      // Create WebDriver
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      // Navigate to Google
      await driver.get('https://www.google.com');
      console.log('✅ Google opened successfully');

      console.log(`🔍 Searching for: ${searchQuery}`);

      // Find search box and perform search
      const searchBox = await driver.wait(
        until.elementLocated(By.name('q')),
        10000
      );

      await searchBox.sendKeys(searchQuery);
      await searchBox.sendKeys(Key.RETURN);
      console.log('✅ Search query submitted');

      // Wait for search results to load - try multiple selectors
      try {
        await driver.wait(
          until.elementLocated(By.css('#search, .g, [data-ved], #rso')),
          10000
        );
      } catch {
        // Fallback: just wait for page to be ready
        await driver.wait(
          until.elementLocated(By.css('body')),
          5000
        );
      }

      // Wait a bit more for dynamic content to load
      await driver.sleep(3000);
      console.log('✅ Search results loaded');

      // Set window size for consistent screenshots
      await driver.manage().window().maximize();

      // Take initial screenshot
      const filename = `restaurants_search_${timestamp}.png`;
      const screenshotPath = path.join(this.screenshotDir, filename);
      
      const screenshotBuffer = await driver.takeScreenshot();
      await fs.writeFile(screenshotPath, screenshotBuffer, 'base64');
      console.log(`📸 Screenshot saved: ${screenshotPath}`);

      // Scroll down to capture more results
      await driver.executeScript('window.scrollTo(0, document.body.scrollHeight/2);');
      await driver.sleep(1000);

      // Take scrolled screenshot
      const scrolledFilename = `restaurants_search_${timestamp}_scrolled.png`;
      const scrolledScreenshotPath = path.join(this.screenshotDir, scrolledFilename);
      
      const scrolledScreenshotBuffer = await driver.takeScreenshot();
      await fs.writeFile(scrolledScreenshotPath, scrolledScreenshotBuffer, 'base64');
      console.log(`📸 Scrolled screenshot saved: ${scrolledScreenshotPath}`);

      // Return the scrolled screenshot as it shows more results
      const screenshotBase64 = `data:image/png;base64,${scrolledScreenshotBuffer}`;

      console.log('✅ Restaurant search script completed successfully!');

      return {
        success: true,
        screenshotBase64,
        screenshotPath: scrolledScreenshotPath,
        timestamp
      };

    } catch (error) {
      console.error('❌ An error occurred during restaurant search:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp
      };

    } finally {
      if (driver) {
        console.log('🔄 Closing browser...');
        await driver.quit();
        console.log('✅ Browser closed');
      }
    }
  }

  async searchWithCustomLocation(location: string): Promise<RestaurantSearchScreenshotResult> {
    const searchQuery = `restaurants near ${location}`;
    return this.searchRestaurantsAndScreenshot(searchQuery);
  }

  async searchWithCuisineType(cuisineType: string, location?: string): Promise<RestaurantSearchScreenshotResult> {
    const locationPart = location ? ` near ${location}` : ' near me';
    const searchQuery = `${cuisineType} restaurants${locationPart}`;
    return this.searchRestaurantsAndScreenshot(searchQuery);
  }
}