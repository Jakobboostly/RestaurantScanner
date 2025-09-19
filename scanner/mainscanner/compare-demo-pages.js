import { chromium } from 'playwright';
import path from 'path';

async function comparePages() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    // Take screenshot of production Boostly demo
    console.log('Taking screenshot of production Boostly demo...');
    const prodPage = await context.newPage();
    await prodPage.goto('https://www.boostly.com/demo', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await prodPage.waitForTimeout(5000); // Wait for any animations/loading
    await prodPage.screenshot({
      path: 'production-demo-screenshot.png',
      fullPage: true
    });
    console.log('Production screenshot saved as production-demo-screenshot.png');

    // Take screenshot of local demo
    console.log('Taking screenshot of local demo...');
    const localPage = await context.newPage();
    await localPage.goto('http://localhost:3000/demo', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await localPage.waitForTimeout(3000); // Wait for any animations/loading
    await localPage.screenshot({
      path: 'local-demo-screenshot.png',
      fullPage: true
    });
    console.log('Local screenshot saved as local-demo-screenshot.png');

    // Also take a viewport-only screenshot for easier comparison
    await prodPage.screenshot({
      path: 'production-demo-viewport.png',
      fullPage: false
    });

    await localPage.screenshot({
      path: 'local-demo-viewport.png',
      fullPage: false
    });

    console.log('Screenshots completed! Files saved:');
    console.log('- production-demo-screenshot.png (full page)');
    console.log('- local-demo-screenshot.png (full page)');
    console.log('- production-demo-viewport.png (viewport only)');
    console.log('- local-demo-viewport.png (viewport only)');

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

comparePages();