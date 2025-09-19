import { chromium } from 'playwright';

async function deepTextInvestigation() {
  console.log('🔍 Deep investigation of all text elements...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait longer for all content

    // Get all text elements with computed font sizes
    const allTextElements = await page.evaluate(() => {
      const results: any[] = [];
      
      // Get all elements
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((element, index) => {
        // Get computed style
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        // Get direct text content (not from children)
        const directText = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim())
          .filter(text => text && text.length > 0)
          .join(' ');
        
        // Only include elements with meaningful text and size < 16px
        if (directText && directText.length > 0 && fontSize < 16) {
          results.push({
            tagName: element.tagName.toLowerCase(),
            fontSize: Math.round(fontSize * 10) / 10,
            text: directText.substring(0, 80),
            className: element.className,
            id: element.id || `element-${index}`,
            xpath: getXPath(element),
            rect: element.getBoundingClientRect(),
            visible: isVisible(element)
          });
        }
      });
      
      // Helper function to get XPath
      function getXPath(element: Element): string {
        if (element.id) return `//*[@id="${element.id}"]`;
        
        const parts = [];
        let current = element;
        
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          let part = current.tagName.toLowerCase();
          const parent = current.parentNode as Element;
          
          if (parent) {
            const siblings = Array.from(parent.children).filter(child => 
              child.tagName === current.tagName
            );
            
            if (siblings.length > 1) {
              const index = siblings.indexOf(current) + 1;
              part += `[${index}]`;
            }
          }
          
          parts.unshift(part);
          current = parent;
        }
        
        return '/' + parts.join('/');
      }
      
      // Helper function to check if element is visible
      function isVisible(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return rect.width > 0 && 
               rect.height > 0 && 
               style.visibility !== 'hidden' && 
               style.display !== 'none' &&
               rect.top < window.innerHeight &&
               rect.bottom > 0;
      }
      
      return results.sort((a, b) => a.fontSize - b.fontSize);
    });

    console.log(`Found ${allTextElements.length} text elements with font size < 16px:\n`);
    
    // Group by font size
    const grouped = allTextElements.reduce((acc: any, item) => {
      const size = item.fontSize;
      if (!acc[size]) acc[size] = [];
      acc[size].push(item);
      return acc;
    }, {});

    Object.keys(grouped).forEach(size => {
      const elements = grouped[size];
      console.log(`\n📏 ${size}px (${elements.length} elements):`);
      
      elements.forEach((element: any, index: number) => {
        console.log(`  ${index + 1}. ${element.tagName.toUpperCase()}`);
        console.log(`     Text: "${element.text}${element.text.length >= 80 ? '...' : ''}"`);
        console.log(`     Class: ${element.className || 'none'}`);
        console.log(`     Visible: ${element.visible}`);
        console.log(`     XPath: ${element.xpath}`);
        if (!element.visible) {
          console.log(`     📍 Position: ${Math.round(element.rect.top)}px from top`);
        }
        console.log('');
      });
    });

    // Check if any elements are being rendered by CSS frameworks or have inheritance issues
    const inheritanceIssues = await page.evaluate(() => {
      const issues: any[] = [];
      
      document.querySelectorAll('*').forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        if (fontSize < 16) {
          const classes = Array.from(element.classList);
          const hasTextClass = classes.some(cls => cls.startsWith('text-'));
          const parentSize = element.parentElement ? 
            parseFloat(window.getComputedStyle(element.parentElement).fontSize) : 16;
          
          if (!hasTextClass || parentSize < 16) {
            issues.push({
              element: element.tagName,
              classes: classes.join(' '),
              fontSize: fontSize,
              parentFontSize: parentSize,
              hasTextClass,
              id: element.id || `element-${index}`
            });
          }
        }
      });
      
      return issues.slice(0, 10); // Limit output
    });

    if (inheritanceIssues.length > 0) {
      console.log('\n🔧 Potential inheritance or CSS framework issues:');
      inheritanceIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.element} (${issue.fontSize}px)`);
        console.log(`   Classes: ${issue.classes || 'none'}`);
        console.log(`   Parent size: ${issue.parentFontSize}px`);
        console.log(`   Has text class: ${issue.hasTextClass}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

deepTextInvestigation().catch(console.error);