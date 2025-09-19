import { chromium } from 'playwright';

async function testMobileOptimization() {
  console.log('🚀 Running Quick Mobile Optimization Check\n');
  
  const browser = await chromium.launch({ headless: false });
  
  // Test on iPhone 14 viewport size
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing on iPhone 14 viewport (390x844)...\n');
    
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for content to load
    await page.waitForTimeout(2000);

    // 1. Check viewport meta tag
    const viewportMeta = await page.$('meta[name="viewport"]');
    const viewportContent = viewportMeta ? await viewportMeta.getAttribute('content') : null;
    console.log(`✅ Viewport Meta Tag: ${viewportContent || 'Missing'}`);

    // 2. Check for horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`${hasHorizontalScroll ? '❌' : '✅'} Horizontal Scroll: ${hasHorizontalScroll ? 'Present (Bad)' : 'None (Good)'}`);

    // 3. Check if search box is visible without scrolling
    const searchBoxVisible = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder*="restaurant"]');
      if (!searchInput) return false;
      
      const rect = searchInput.getBoundingClientRect();
      return rect.top >= 0 && rect.top <= window.innerHeight;
    });
    console.log(`${searchBoxVisible ? '✅' : '❌'} Search Box Above Fold: ${searchBoxVisible ? 'Visible' : 'Hidden'}`);

    // 4. Check text sizes
    const textSizes = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, p, span, button, a');
      const sizes: number[] = [];
      const smallText: string[] = [];
      
      elements.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize) {
          sizes.push(fontSize);
          if (fontSize < 16 && el.textContent && el.textContent.trim().length > 10) {
            smallText.push(`${fontSize}px: "${el.textContent.substring(0, 30)}..."`);
          }
        }
      });
      
      return {
        min: Math.min(...sizes),
        avg: sizes.reduce((a, b) => a + b, 0) / sizes.length,
        smallTextExamples: smallText.slice(0, 3)
      };
    });
    
    console.log(`${textSizes.min >= 16 ? '✅' : '⚠️'} Text Readability: Min ${textSizes.min.toFixed(1)}px, Avg ${textSizes.avg.toFixed(1)}px`);
    if (textSizes.smallTextExamples.length > 0) {
      console.log('   Small text found:');
      textSizes.smallTextExamples.forEach(example => console.log(`   - ${example}`));
    }

    // 5. Check touch target sizes
    const touchTargets = await page.evaluate(() => {
      const clickables = document.querySelectorAll('button, a, input, select');
      const smallTargets: any[] = [];
      
      clickables.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          smallTargets.push({
            tag: el.tagName,
            text: (el as HTMLElement).textContent?.substring(0, 20) || '',
            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
          });
        }
      });
      
      return smallTargets.slice(0, 5);
    });
    
    console.log(`${touchTargets.length === 0 ? '✅' : '⚠️'} Touch Targets: ${touchTargets.length} too small (should be 44x44px+)`);
    touchTargets.forEach(target => {
      console.log(`   - ${target.tag} (${target.size}px): "${target.text}"`);
    });

    // 6. Take screenshot
    await page.screenshot({ 
      path: 'mobile-screenshots/mobile-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: mobile-screenshots/mobile-test.png');

    // 7. Check overall mobile score
    const issues = [
      !viewportContent?.includes('width=device-width'),
      hasHorizontalScroll,
      !searchBoxVisible,
      textSizes.min < 16,
      touchTargets.length > 0
    ];
    
    const issueCount = issues.filter(Boolean).length;
    const score = Math.round(((5 - issueCount) / 5) * 100);
    
    console.log(`\n📱 Mobile Optimization Score: ${score}%`);
    
    if (score === 100) {
      console.log('🎉 Excellent! Your app is well-optimized for mobile.');
    } else if (score >= 80) {
      console.log('✅ Good mobile optimization with minor improvements needed.');
    } else if (score >= 60) {
      console.log('⚠️ Fair mobile optimization. Some important issues to fix.');
    } else {
      console.log('❌ Poor mobile optimization. Multiple critical issues found.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMobileOptimization().catch(console.error);