import puppeteer from 'puppeteer';

export interface MobileExperience {
  score: number;
  loadTime: number;
  isResponsive: boolean;
  touchFriendly: boolean;
  textReadable: boolean;
  navigationEasy: boolean;
  issues: string[];
  recommendations: string[];
  screenshot?: string;
  contentAnalysis?: {
    title: string;
    metaDescription: string;
    hasSchemaMarkup: boolean;
    h1Tags: string[];
    imageCount: number;
    internalLinks: number;
    externalLinks: number;
  };
}

export class MobileExperienceService {
  async analyzeMobileExperience(url: string): Promise<MobileExperience> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const page = await browser.newPage();
      
      // Set mobile viewport
      await page.setViewport({
        width: 375,
        height: 667,
        isMobile: true,
        hasTouch: true
      });

      // Set mobile user agent
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');

      const startTime = Date.now();
      await page.goto(url.startsWith('http') ? url : `https://${url}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      const loadTime = Date.now() - startTime;

      // Capture mobile screenshot
      console.log('Capturing mobile screenshot...');
      const screenshot = await page.screenshot({ 
        encoding: 'base64',
        fullPage: false,
        type: 'png'
      });
      console.log('Screenshot captured, size:', screenshot.length);

      // Analyze page content
      console.log('Analyzing page content...');
      const contentAnalysis = await page.evaluate(() => {
        const sanitizeText = (text) => {
          return text.replace(/[\x00-\x1f\x7f-\x9f"'\\]/g, '').replace(/\s+/g, ' ').trim();
        };
        
        const title = sanitizeText(document.querySelector('title')?.textContent || '');
        const metaDescription = sanitizeText(document.querySelector('meta[name="description"]')?.getAttribute('content') || '');
        const hasSchemaMarkup = document.querySelector('script[type="application/ld+json"]') !== null;
        const h1Tags = Array.from(document.querySelectorAll('h1')).map(h1 => sanitizeText(h1.textContent || ''));
        const imageCount = document.querySelectorAll('img').length;
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').length;
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])').length;
        
        return {
          title,
          metaDescription,
          hasSchemaMarkup,
          h1Tags,
          imageCount,
          internalLinks,
          externalLinks
        };
      });
      console.log('Content analysis result:', contentAnalysis);

      // Analyze mobile experience
      const analysis = await page.evaluate(() => {
        const issues = [];
        const recommendations = [];

        // Check viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
          issues.push('Missing viewport meta tag');
          recommendations.push('Add viewport meta tag for mobile optimization');
        }

        // Check text size
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        let smallTextCount = 0;
        textElements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          if (fontSize < 14) smallTextCount++;
        });
        
        const textReadable = smallTextCount < textElements.length * 0.3;
        if (!textReadable) {
          issues.push('Text too small for mobile reading');
          recommendations.push('Increase font size to at least 14px for better readability');
        }

        // Check touch targets
        const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
        let smallTouchTargets = 0;
        buttons.forEach(btn => {
          const rect = btn.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) smallTouchTargets++;
        });

        const touchFriendly = smallTouchTargets < buttons.length * 0.2;
        if (!touchFriendly) {
          issues.push('Touch targets too small');
          recommendations.push('Make buttons and links at least 44px for easy tapping');
        }

        // Check navigation
        const nav = document.querySelector('nav') || document.querySelector('.menu') || document.querySelector('.navigation');
        const navigationEasy = nav !== null;
        if (!navigationEasy) {
          issues.push('Navigation not easily accessible');
          recommendations.push('Add clear navigation menu for mobile users');
        }

        // Check horizontal scrolling
        const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
        if (hasHorizontalScroll) {
          issues.push('Horizontal scrolling required');
          recommendations.push('Ensure content fits within mobile screen width');
        }

        return {
          textReadable,
          touchFriendly,
          navigationEasy,
          issues,
          recommendations,
          isResponsive: !hasHorizontalScroll && viewportMeta !== null
        };
      });

      // Calculate overall score
      let score = 100;
      score -= analysis.issues.length * 15;
      score = Math.max(0, Math.min(100, score));

      return {
        score,
        loadTime,
        isResponsive: analysis.isResponsive,
        touchFriendly: analysis.touchFriendly,
        textReadable: analysis.textReadable,
        navigationEasy: analysis.navigationEasy,
        issues: analysis.issues,
        recommendations: analysis.recommendations,
        screenshot: `data:image/png;base64,${screenshot}`,
        contentAnalysis
      };

    } catch (error) {
      console.error('Mobile experience analysis error:', error);
      throw new Error('Failed to analyze mobile experience');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}