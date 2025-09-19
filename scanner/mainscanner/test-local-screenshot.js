import { chromium } from 'playwright';

async function takeLocalScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    console.log('Taking screenshot of local demo...');
    const page = await context.newPage();
    await page.goto('http://localhost:3000/demo', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: 'local-demo-screenshot.png',
      fullPage: true
    });
    console.log('Local screenshot saved successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeLocalScreenshot();