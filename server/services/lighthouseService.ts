import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import puppeteer from 'puppeteer';

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  coreWebVitals: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  screenshot?: string;
}

export class LighthouseService {
  async runLighthouseAudit(url: string, mobile: boolean = true): Promise<LighthouseMetrics> {
    let chrome;
    try {
      // Launch Chrome with headless mode
      chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
      });

      const options = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
        port: chrome.port,
        formFactor: mobile ? 'mobile' : 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: mobile ? {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false,
        } : {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        }
      };

      const runnerResult = await lighthouse(url, options);

      if (!runnerResult || !runnerResult.lhr) {
        throw new Error('Lighthouse audit failed');
      }

      const { categories, audits } = runnerResult.lhr;

      return {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        coreWebVitals: {
          fcp: audits['first-contentful-paint']?.score || 0,
          lcp: audits['largest-contentful-paint']?.score || 0,
          cls: audits['cumulative-layout-shift']?.score || 0,
          fid: audits['max-potential-fid']?.score || 0,
        }
      };
    } catch (error) {
      console.error('Lighthouse audit failed:', error);
      throw error;
    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }
  }

  async captureScreenshot(url: string, mobile: boolean = true): Promise<string | null> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      if (mobile) {
        await page.setViewport({ width: 375, height: 667 });
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
      } else {
        await page.setViewport({ width: 1350, height: 940 });
      }

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for any dynamic content to load
      await page.waitForTimeout(2000);

      const screenshot = await page.screenshot({
        encoding: 'base64',
        fullPage: false
      });

      return `data:image/png;base64,${screenshot}`;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async analyzeOnPageSEO(url: string): Promise<{
    title: string;
    description: string;
    h1Tags: string[];
    imageAltTags: number;
    totalImages: number;
    internalLinks: number;
    externalLinks: number;
    hasSchema: boolean;
  }> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const seoData = await page.evaluate(() => {
        const title = document.querySelector('title')?.textContent || '';
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        
        const h1Elements = Array.from(document.querySelectorAll('h1'));
        const h1Tags = h1Elements.map(h1 => h1.textContent || '').filter(text => text.length > 0);
        
        const images = Array.from(document.querySelectorAll('img'));
        const totalImages = images.length;
        const imageAltTags = images.filter(img => img.getAttribute('alt')).length;
        
        const links = Array.from(document.querySelectorAll('a[href]'));
        const currentDomain = window.location.hostname;
        let internalLinks = 0;
        let externalLinks = 0;
        
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            if (href.startsWith('http') && !href.includes(currentDomain)) {
              externalLinks++;
            } else if (href.startsWith('/') || href.includes(currentDomain)) {
              internalLinks++;
            }
          }
        });

        const hasSchema = !!document.querySelector('script[type="application/ld+json"]');

        return {
          title,
          description,
          h1Tags,
          imageAltTags,
          totalImages,
          internalLinks,
          externalLinks,
          hasSchema
        };
      });

      return seoData;
    } catch (error) {
      console.error('On-page SEO analysis failed:', error);
      return {
        title: '',
        description: '',
        h1Tags: [],
        imageAltTags: 0,
        totalImages: 0,
        internalLinks: 0,
        externalLinks: 0,
        hasSchema: false
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}