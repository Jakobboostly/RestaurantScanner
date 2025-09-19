import { test, expect, devices } from '@playwright/test';

// Test mobile optimization of the scanner application
test.describe('Mobile Optimization Tests', () => {
  // Test on iPhone 13 Pro viewport
  test('Mobile responsiveness on iPhone 13 Pro', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13 Pro'],
      // Override to ensure we test the exact mobile experience
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });

    const page = await context.newPage();

    // Navigate to the scanner
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the initial mobile view
    await page.screenshot({
      path: 'mobile-screenshots/iphone-home.png',
      fullPage: true
    });

    // Test: Check if viewport meta tag is properly set
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
    expect(viewportMeta).toContain('initial-scale=1');

    // Test: Verify main elements are visible and properly sized
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    // Check if search input is touch-friendly (minimum 44px height)
    const searchInputBox = await searchInput.boundingBox();
    expect(searchInputBox.height).toBeGreaterThanOrEqual(44);

    // Test: Search functionality works on mobile
    await searchInput.fill('Pizza Palace');
    await page.keyboard.press('Enter');

    // Wait for search results to appear
    await page.waitForSelector('[data-testid="search-results"], .restaurant-card, [class*="restaurant"]', { timeout: 10000 });

    // Take screenshot of search results
    await page.screenshot({
      path: 'mobile-screenshots/iphone-search-results.png',
      fullPage: true
    });

    // Test: Check if results are displayed properly on mobile
    const restaurantCards = page.locator('[data-testid="restaurant-card"], .restaurant-card, [class*="restaurant"]');
    await expect(restaurantCards.first()).toBeVisible();

    // Test: Click on first restaurant result
    await restaurantCards.first().click();

    // Wait for scan to start
    await page.waitForSelector('[data-testid="scan-progress"], .scan-progress, [class*="progress"]', { timeout: 5000 });

    // Take screenshot of scanning progress
    await page.screenshot({
      path: 'mobile-screenshots/iphone-scanning.png',
      fullPage: true
    });

    await context.close();
  });

  // Test on Samsung Galaxy S21 viewport
  test('Mobile responsiveness on Samsung Galaxy S21', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Galaxy S21'],
      viewport: { width: 384, height: 854 },
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    });

    const page = await context.newPage();

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take screenshot of Android view
    await page.screenshot({
      path: 'mobile-screenshots/android-home.png',
      fullPage: true
    });

    // Test: Check responsive navigation
    const navElements = page.locator('nav, header, [role="navigation"]');
    if (await navElements.count() > 0) {
      await expect(navElements.first()).toBeVisible();

      // Check if navigation is mobile-friendly
      const navBox = await navElements.first().boundingBox();
      expect(navBox.width).toBeLessThanOrEqual(384); // Should fit within viewport
    }

    // Test: Check button sizes are touch-friendly
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        expect(buttonBox.height).toBeGreaterThanOrEqual(44); // Minimum touch target
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      }
    }

    await context.close();
  });

  // Test landscape orientation
  test('Landscape orientation support', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 }, // iPhone landscape
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });

    const page = await context.newPage();

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take screenshot of landscape view
    await page.screenshot({
      path: 'mobile-screenshots/landscape-view.png',
      fullPage: true
    });

    // Test: Ensure content doesn't overflow in landscape
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox.width).toBeLessThanOrEqual(844);

    await context.close();
  });

  // Test touch gestures and interactions
  test('Touch interaction tests', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13 Pro'],
      hasTouch: true
    });

    const page = await context.newPage();

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Test: Tap interaction on search input
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.tap();
    await expect(searchInput).toBeFocused();

    // Test: Scroll behavior
    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    await context.close();
  });

  // Performance test on mobile
  test('Mobile performance check', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13 Pro']
    });

    const page = await context.newPage();

    // Start performance monitoring
    const startTime = Date.now();

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time on mobile
    expect(loadTime).toBeLessThan(5000); // 5 seconds max

    // Check if critical resources loaded
    const title = await page.title();
    expect(title).toContain('Restaurant Scanner');

    await context.close();
  });
});