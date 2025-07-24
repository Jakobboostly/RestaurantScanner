import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

async function testChrome() {
  console.log('Testing Chrome/Selenium setup...');
  
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('--headless');
  chromeOptions.addArguments('--no-sandbox');
  chromeOptions.addArguments('--disable-dev-shm-usage');
  chromeOptions.addArguments('--disable-gpu');
  chromeOptions.addArguments('--window-size=1366,768');
  
  // Test different Chrome binary paths
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/nix/store/*/bin/google-chrome-stable',
    '/nix/store/*/bin/chromium'
  ];
  
  for (const path of possiblePaths) {
    try {
      console.log(`Testing Chrome binary: ${path}`);
      chromeOptions.setChromeBinaryPath(path);
      
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
        
      await driver.get('https://www.google.com');
      console.log(`✅ Chrome working with path: ${path}`);
      await driver.quit();
      break;
      
    } catch (error) {
      console.log(`❌ Failed with ${path}: ${error.message}`);
    }
  }
}

testChrome().catch(console.error);