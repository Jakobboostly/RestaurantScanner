import puppeteer, { Browser, Page } from 'puppeteer';
import pLimit from 'p-limit';

const limit = pLimit(3); // Limit concurrent screenshots

export interface ScreenshotResult {
  screenshot: string | null;
  success: boolean;
  error?: string;
}

export class ScreenshotService {
  private browser: Browser | null = null;
  private executablePath = '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: this.executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      this.isInitialized = true;
      console.log('Screenshot service initialized');
    } catch (error) {
      console.error('Failed to initialize screenshot service:', error);
      throw error;
    }
  }

  async captureScreenshot(url: string): Promise<ScreenshotResult> {
    return limit(async () => {
      if (!this.browser) {
        await this.initialize();
      }

      let page: Page | null = null;
      
      try {
        if (!this.browser) {
          throw new Error('Browser not initialized');
        }

        page = await this.browser.newPage();
        
        // Set mobile viewport
        await page.setViewport({
          width: 375,
          height: 667,
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 2
        });

        // Set mobile user agent
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');

        // Navigate to URL
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        await page.goto(targetUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait a bit for dynamic content
        await page.waitForTimeout(1000);

        // Capture screenshot
        const screenshot = await page.screenshot({
          encoding: 'base64',
          fullPage: false,
          type: 'png'
        });

        return {
          screenshot: `data:image/png;base64,${screenshot}`,
          success: true
        };

      } catch (error) {
        console.error('Screenshot capture failed:', error);
        return {
          screenshot: null,
          success: false,
          error: error instanceof Error ? error.message : 'Screenshot capture failed'
        };
      } finally {
        if (page) {
          await page.close();
        }
      }
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('Screenshot service closed');
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.browser) {
        await this.initialize();
      }
      return this.browser !== null && this.browser.isConnected();
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const screenshotService = new ScreenshotService();

// Graceful shutdown
process.on('SIGINT', async () => {
  await screenshotService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await screenshotService.close();
  process.exit(0);
});