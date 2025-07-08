import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import pLimit from 'p-limit';

const limit = pLimit(1); // Limit concurrent lighthouse instances

export interface LighthouseScreenshotResult {
  screenshot: string | null;
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  success: boolean;
  error?: string;
}

export class LighthouseScreenshotService {
  private executablePath = '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';

  async captureScreenshotWithMetrics(url: string): Promise<LighthouseScreenshotResult> {
    return limit(async () => {
      let chrome;
      
      try {
        // Launch Chrome
        chrome = await chromeLauncher.launch({
          chromeFlags: [
            '--headless',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
          chromePath: this.executablePath
        });

        // Configure Lighthouse options
        const options = {
          logLevel: 'info',
          output: 'json',
          onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
          port: chrome.port,
          emulatedFormFactor: 'mobile',
          throttling: {
            rttMs: 40,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0
          },
          screenEmulation: {
            mobile: true,
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            disabled: false
          }
        };

        // Ensure URL has protocol
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;

        // Run Lighthouse
        const runnerResult = await lighthouse(targetUrl, options);
        
        if (!runnerResult) {
          throw new Error('Lighthouse analysis failed');
        }

        // Extract screenshot
        const screenshotAudit = runnerResult.lhr.audits['final-screenshot'];
        const screenshot = screenshotAudit?.details?.data || null;

        // Extract scores
        const categories = runnerResult.lhr.categories;
        const performance = Math.round((categories.performance?.score || 0) * 100);
        const accessibility = Math.round((categories.accessibility?.score || 0) * 100);
        const seo = Math.round((categories.seo?.score || 0) * 100);
        const bestPractices = Math.round((categories['best-practices']?.score || 0) * 100);

        console.log(`Lighthouse analysis completed: Performance: ${performance}, SEO: ${seo}, Mobile screenshot: ${screenshot ? 'captured' : 'failed'}`);

        return {
          screenshot,
          performance,
          accessibility,
          seo,
          bestPractices,
          success: true
        };

      } catch (error) {
        console.error('Lighthouse screenshot capture failed:', error);
        
        return {
          screenshot: null,
          performance: 70,
          accessibility: 80,
          seo: 75,
          bestPractices: 80,
          success: false,
          error: error instanceof Error ? error.message : 'Lighthouse analysis failed'
        };
      } finally {
        if (chrome) {
          await chrome.kill();
        }
      }
    });
  }
}

export const lighthouseScreenshotService = new LighthouseScreenshotService();