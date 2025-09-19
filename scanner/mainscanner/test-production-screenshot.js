import { chromium } from 'playwright';

async function takeProductionScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  try {
    console.log('Taking screenshot of production Boostly demo...');
    const page = await context.newPage();

    // Navigate to the page
    console.log('Navigating to https://www.boostly.com/demo...');
    await page.goto('https://www.boostly.com/demo', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Page loaded, waiting for content...');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: 'production-demo-screenshot.png',
      fullPage: true
    });
    console.log('Production screenshot saved successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeProductionScreenshot();