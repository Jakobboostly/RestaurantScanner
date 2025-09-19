import { chromium, devices } from 'playwright';

// Test configurations for different mobile devices
const MOBILE_DEVICES = [
  { name: 'iPhone 14', device: devices['iPhone 14'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 7', device: devices['Pixel 7'] },
  { name: 'Galaxy S22', device: devices['Galaxy S9+'] }, // Using S9+ as S22 might not be available
  { name: 'iPad Pro', device: devices['iPad Pro'] },
];

const BASE_URL = 'http://localhost:3000';

// Pages to test
const PAGES_TO_TEST = [
  { path: '/', name: 'Home/Search Page' },
  { path: '/results', name: 'Results Dashboard' },
];

async function testMobileOptimization() {
  console.log('🚀 Starting Mobile Optimization Tests\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down for visual inspection
  });

  const results: any[] = [];

  for (const deviceConfig of MOBILE_DEVICES) {
    console.log(`\n📱 Testing on ${deviceConfig.name}...`);
    
    const context = await browser.newContext({
      ...deviceConfig.device,
      permissions: ['geolocation'],
    });
    
    const page = await context.newPage();
    
    const deviceResults: any = {
      device: deviceConfig.name,
      viewport: deviceConfig.device.viewport,
      tests: []
    };

    for (const pageToTest of PAGES_TO_TEST) {
      console.log(`  Testing ${pageToTest.name}...`);
      
      try {
        // Navigate to page
        await page.goto(BASE_URL + pageToTest.path, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        // Wait for content to load
        await page.waitForTimeout(2000);

        const testResult: any = {
          page: pageToTest.name,
          path: pageToTest.path,
          checks: {}
        };

        // 1. Check viewport meta tag
        const viewportMeta = await page.$('meta[name="viewport"]');
        const viewportContent = viewportMeta ? await viewportMeta.getAttribute('content') : null;
        testResult.checks.viewportMeta = {
          exists: !!viewportMeta,
          content: viewportContent,
          isOptimal: viewportContent?.includes('width=device-width') && 
                     viewportContent?.includes('initial-scale=1')
        };

        // 2. Check for horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        testResult.checks.horizontalScroll = {
          hasScroll: hasHorizontalScroll,
          passed: !hasHorizontalScroll
        };

        // 3. Check text readability (font sizes)
        const textSizes = await page.evaluate(() => {
          const elements = document.querySelectorAll('p, span, div, button, a, h1, h2, h3, h4, h5, h6');
          const sizes: number[] = [];
          elements.forEach(el => {
            const fontSize = window.getComputedStyle(el).fontSize;
            if (fontSize) {
              sizes.push(parseFloat(fontSize));
            }
          });
          return {
            min: Math.min(...sizes),
            avg: sizes.reduce((a, b) => a + b, 0) / sizes.length,
            tooSmall: sizes.filter(s => s < 12).length
          };
        });
        testResult.checks.textReadability = {
          minFontSize: textSizes.min,
          avgFontSize: textSizes.avg,
          elementsWithSmallText: textSizes.tooSmall,
          passed: textSizes.min >= 12
        };

        // 4. Check touch target sizes
        const touchTargets = await page.evaluate(() => {
          const clickables = document.querySelectorAll('button, a, input, select, textarea, [onclick]');
          const smallTargets: any[] = [];
          clickables.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
              smallTargets.push({
                tag: el.tagName,
                text: (el as HTMLElement).innerText?.substring(0, 20) || '',
                width: rect.width,
                height: rect.height
              });
            }
          });
          return {
            total: clickables.length,
            tooSmall: smallTargets.length,
            examples: smallTargets.slice(0, 3)
          };
        });
        testResult.checks.touchTargets = {
          totalTargets: touchTargets.total,
          smallTargets: touchTargets.tooSmall,
          examples: touchTargets.examples,
          passed: touchTargets.tooSmall === 0
        };

        // 5. Check responsive images
        const imageIssues = await page.evaluate(() => {
          const images = document.querySelectorAll('img');
          const issues: any[] = [];
          images.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.width > window.innerWidth) {
              issues.push({
                src: img.src,
                displayWidth: rect.width,
                viewportWidth: window.innerWidth
              });
            }
          });
          return issues;
        });
        testResult.checks.responsiveImages = {
          oversizedImages: imageIssues.length,
          examples: imageIssues.slice(0, 3),
          passed: imageIssues.length === 0
        };

        // 6. Check for mobile-specific UI elements
        const mobileUI = await page.evaluate(() => {
          // Check for hamburger menu or mobile navigation
          const hasHamburger = !!document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [class*="mobile-menu"], svg[class*="menu"]');
          
          // Check if desktop navigation is hidden
          const navElements = document.querySelectorAll('nav, [role="navigation"]');
          let hasResponsiveNav = false;
          navElements.forEach(nav => {
            const display = window.getComputedStyle(nav).display;
            if (display === 'none' || display === 'block') {
              hasResponsiveNav = true;
            }
          });

          return {
            hasHamburgerMenu: hasHamburger,
            hasResponsiveNavigation: hasResponsiveNav
          };
        });
        testResult.checks.mobileUI = mobileUI;

        // 7. Test form inputs for mobile optimization
        if (pageToTest.path === '/') {
          const formOptimization = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input, select, textarea');
            const optimization: any = {
              totalInputs: inputs.length,
              withAutocomplete: 0,
              withInputMode: 0,
              examples: []
            };
            
            inputs.forEach(input => {
              if (input.hasAttribute('autocomplete')) optimization.withAutocomplete++;
              if (input.hasAttribute('inputmode')) optimization.withInputMode++;
              
              if (optimization.examples.length < 2) {
                optimization.examples.push({
                  type: input.getAttribute('type'),
                  autocomplete: input.getAttribute('autocomplete'),
                  inputmode: input.getAttribute('inputmode')
                });
              }
            });
            
            return optimization;
          });
          testResult.checks.formOptimization = formOptimization;
        }

        // Take screenshot for visual review
        const screenshotPath = `mobile-screenshots/${deviceConfig.name.replace(/\s+/g, '-')}-${pageToTest.path.replace('/', 'home')}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        testResult.screenshot = screenshotPath;

        deviceResults.tests.push(testResult);
        
      } catch (error) {
        console.error(`    ❌ Error testing ${pageToTest.name}:`, error);
        deviceResults.tests.push({
          page: pageToTest.name,
          error: error.message
        });
      }
    }

    results.push(deviceResults);
    await context.close();
  }

  await browser.close();

  // Generate report
  console.log('\n\n📊 MOBILE OPTIMIZATION REPORT\n');
  console.log('=' .repeat(60));

  for (const deviceResult of results) {
    console.log(`\n📱 ${deviceResult.device} (${deviceResult.viewport.width}x${deviceResult.viewport.height})`);
    console.log('-'.repeat(40));
    
    for (const test of deviceResult.tests) {
      console.log(`\n  📄 ${test.page}`);
      
      if (test.error) {
        console.log(`    ❌ Error: ${test.error}`);
        continue;
      }

      // Viewport meta tag
      const viewportCheck = test.checks.viewportMeta;
      console.log(`    ${viewportCheck.isOptimal ? '✅' : '⚠️'} Viewport Meta: ${viewportCheck.exists ? viewportCheck.content : 'Missing'}`);
      
      // Horizontal scroll
      console.log(`    ${test.checks.horizontalScroll.passed ? '✅' : '❌'} Horizontal Scroll: ${test.checks.horizontalScroll.hasScroll ? 'Present (Bad)' : 'None (Good)'}`);
      
      // Text readability
      const textCheck = test.checks.textReadability;
      console.log(`    ${textCheck.passed ? '✅' : '⚠️'} Text Readability: Min ${textCheck.minFontSize}px, Avg ${textCheck.avgFontSize.toFixed(1)}px`);
      if (textCheck.elementsWithSmallText > 0) {
        console.log(`      ⚠️ ${textCheck.elementsWithSmallText} elements with text < 12px`);
      }
      
      // Touch targets
      const touchCheck = test.checks.touchTargets;
      console.log(`    ${touchCheck.passed ? '✅' : '⚠️'} Touch Targets: ${touchCheck.smallTargets} of ${touchCheck.totalTargets} too small`);
      if (touchCheck.smallTargets > 0 && touchCheck.examples.length > 0) {
        touchCheck.examples.forEach((ex: any) => {
          console.log(`      - ${ex.tag}: ${ex.width}x${ex.height}px "${ex.text}"`);
        });
      }
      
      // Responsive images
      const imgCheck = test.checks.responsiveImages;
      console.log(`    ${imgCheck.passed ? '✅' : '❌'} Responsive Images: ${imgCheck.oversizedImages} oversized`);
      
      // Mobile UI
      const uiCheck = test.checks.mobileUI;
      console.log(`    ${uiCheck.hasHamburgerMenu ? '✅' : '⚠️'} Mobile Navigation: ${uiCheck.hasHamburgerMenu ? 'Has mobile menu' : 'No mobile menu detected'}`);
      
      // Form optimization (if applicable)
      if (test.checks.formOptimization) {
        const formCheck = test.checks.formOptimization;
        console.log(`    📝 Form Optimization:`);
        console.log(`      - ${formCheck.totalInputs} inputs total`);
        console.log(`      - ${formCheck.withAutocomplete} with autocomplete`);
        console.log(`      - ${formCheck.withInputMode} with inputmode`);
      }
      
      console.log(`    📸 Screenshot: ${test.screenshot}`);
    }
  }

  console.log('\n\n🎯 SUMMARY & RECOMMENDATIONS\n');
  console.log('=' .repeat(60));
  
  // Analyze overall issues
  const allIssues = {
    viewport: false,
    horizontalScroll: false,
    smallText: false,
    smallTouchTargets: false,
    oversizedImages: false,
    noMobileNav: false
  };

  results.forEach(dr => {
    dr.tests.forEach((test: any) => {
      if (test.checks) {
        if (!test.checks.viewportMeta?.isOptimal) allIssues.viewport = true;
        if (test.checks.horizontalScroll?.hasScroll) allIssues.horizontalScroll = true;
        if (!test.checks.textReadability?.passed) allIssues.smallText = true;
        if (!test.checks.touchTargets?.passed) allIssues.smallTouchTargets = true;
        if (!test.checks.responsiveImages?.passed) allIssues.oversizedImages = true;
        if (!test.checks.mobileUI?.hasHamburgerMenu) allIssues.noMobileNav = true;
      }
    });
  });

  if (allIssues.viewport) {
    console.log('\n❌ CRITICAL: Viewport meta tag needs optimization');
    console.log('   Fix: Ensure <meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  if (allIssues.horizontalScroll) {
    console.log('\n❌ CRITICAL: Horizontal scrolling detected');
    console.log('   Fix: Use responsive units (%, vw, rem) instead of fixed pixels');
    console.log('   Fix: Add max-width: 100% to containers');
  }

  if (allIssues.smallText) {
    console.log('\n⚠️ WARNING: Small text detected');
    console.log('   Fix: Minimum font size should be 16px for body text on mobile');
  }

  if (allIssues.smallTouchTargets) {
    console.log('\n⚠️ WARNING: Touch targets too small');
    console.log('   Fix: Buttons and links should be at least 44x44px');
  }

  if (allIssues.oversizedImages) {
    console.log('\n❌ CRITICAL: Images exceeding viewport width');
    console.log('   Fix: Add max-width: 100%; height: auto; to img tags');
  }

  if (allIssues.noMobileNav) {
    console.log('\n⚠️ WARNING: No mobile navigation detected');
    console.log('   Fix: Implement hamburger menu for mobile devices');
  }

  const hasIssues = Object.values(allIssues).some(v => v);
  if (!hasIssues) {
    console.log('\n✅ Excellent! Your app appears to be well-optimized for mobile devices.');
  } else {
    console.log('\n\n📱 Overall Mobile Score: ' + 
      (Object.values(allIssues).filter(v => !v).length / Object.values(allIssues).length * 100).toFixed(0) + '%');
  }

  console.log('\n✨ Test completed! Check mobile-screenshots/ folder for visual review.');
}

// Run the tests
testMobileOptimization().catch(console.error);