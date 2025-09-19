import { chromium } from 'playwright';

async function simpleTextCheck() {
  console.log('🔍 Simple text size check...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check all text elements that are visible and have significant text
    const smallTextResults = await page.evaluate(() => {
      const results: any[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let textNode;
      while (textNode = walker.nextNode()) {
        const text = textNode.textContent?.trim();
        if (text && text.length > 5) {
          const parent = textNode.parentElement;
          if (parent) {
            const style = window.getComputedStyle(parent);
            const fontSize = parseFloat(style.fontSize);
            const rect = parent.getBoundingClientRect();
            
            // Only check visible elements
            if (fontSize < 16 && rect.height > 0 && rect.width > 0) {
              results.push({
                text: text.substring(0, 50),
                fontSize: fontSize,
                tagName: parent.tagName,
                className: parent.className,
                visible: rect.top < window.innerHeight && rect.bottom > 0
              });
            }
          }
        }
      }
      
      return results.filter(r => r.visible);
    });

    console.log(`Found ${smallTextResults.length} visible text elements < 16px:\n`);
    
    smallTextResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.tagName} (${result.fontSize}px)`);
      console.log(`   Text: "${result.text}${result.text.length >= 50 ? '...' : ''}"`);
      console.log(`   Classes: ${result.className || 'none'}`);
      console.log('');
    });

    // Also check if there are any CSS rules that might be overriding our changes
    const cssOverrides = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="text-sm"]');
      const results: any[] = [];
      
      elements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const text = el.textContent?.trim();
        
        if (text && text.length > 5) {
          results.push({
            tag: el.tagName,
            classes: el.className,
            fontSize: fontSize,
            text: text.substring(0, 40),
            id: el.id || `element-${index}`
          });
        }
      });
      
      return results;
    });

    if (cssOverrides.length > 0) {
      console.log('\nElements with text-sm classes:');
      cssOverrides.forEach((result, index) => {
        console.log(`${index + 1}. ${result.tag} (${result.fontSize}px)`);
        console.log(`   Classes: ${result.classes}`);
        console.log(`   Text: "${result.text}..."`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

simpleTextCheck().catch(console.error);