import { chromium } from 'playwright';

async function findSmallText() {
  console.log('🔍 Finding all text smaller than 16px...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const smallTextElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const results: any[] = [];
      
      allElements.forEach((el, index) => {
        const computedStyle = window.getComputedStyle(el);
        const fontSize = parseFloat(computedStyle.fontSize);
        const textContent = el.textContent?.trim() || '';
        
        // Only check elements with direct text content (not just inherited)
        const hasDirectText = Array.from(el.childNodes).some(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
        );
        
        if (fontSize < 16 && hasDirectText && textContent.length > 5) {
          results.push({
            tag: el.tagName,
            fontSize: fontSize,
            text: textContent.substring(0, 50),
            className: el.className,
            id: el.id || `element-${index}`,
            innerHTML: el.innerHTML.substring(0, 100)
          });
        }
      });
      
      // Remove duplicates and sort by font size
      const unique = results.filter((item, index, arr) => 
        arr.findIndex(other => other.text === item.text && other.fontSize === item.fontSize) === index
      );
      
      return unique.sort((a, b) => a.fontSize - b.fontSize);
    });

    console.log(`Found ${smallTextElements.length} elements with text smaller than 16px:\n`);
    
    smallTextElements.forEach((element, index) => {
      console.log(`${index + 1}. ${element.tag} (${element.fontSize}px)`);
      console.log(`   Text: "${element.text}${element.text.length >= 50 ? '...' : ''}"`);
      console.log(`   Class: ${element.className || 'none'}`);
      console.log(`   ID: ${element.id}`);
      console.log('');
    });

    // Also check for specific Tailwind classes that might be causing small text
    const tailwindClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="text-"]');
      const classes: string[] = [];
      
      elements.forEach(el => {
        const classList = Array.from(el.classList);
        classList.forEach(cls => {
          if (cls.startsWith('text-') && (cls.includes('xs') || cls.includes('sm'))) {
            if (!classes.includes(cls)) {
              classes.push(cls);
            }
          }
        });
      });
      
      return classes;
    });

    console.log('Tailwind text classes that might be too small:');
    tailwindClasses.forEach(cls => console.log(`- ${cls}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

findSmallText().catch(console.error);