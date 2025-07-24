const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs/promises');
const path = require('path');

async function testSeleniumScreenshot() {
  let driver;

  try {
    console.log('🔍 Testing Selenium screenshot for "pizza Philadelphia"...');
    
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1366,768');
    options.setChromeBinaryPath('/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    const searchUrl = 'https://www.google.com/search?q=pizza%20philadelphia';
    console.log('📍 Navigating to:', searchUrl);
    
    await driver.get(searchUrl);
    await driver.sleep(3000);

    console.log('📸 Taking screenshot...');
    const screenshotBase64 = await driver.takeScreenshot();
    
    // Save screenshot
    const filename = `test_pizza_philadelphia_${Date.now()}.png`;
    const screenshotPath = path.join(process.cwd(), 'screenshots', filename);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await fs.writeFile(screenshotPath, screenshotBase64, 'base64');
    
    console.log(`✅ Screenshot saved successfully: ${screenshotPath}`);
    console.log(`📏 Screenshot size: ${Math.round(screenshotBase64.length * 0.75 / 1024)} KB`);
    
    return true;
  } catch (error) {
    console.error('❌ Selenium test failed:', error.message);
    return false;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

testSeleniumScreenshot();