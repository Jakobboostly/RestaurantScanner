// Boostly Blog Scraper & Social Media Converter
// Scrapes https://www.boostly.com/blog and converts posts to social media content

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class BoostlyBlogScraper {
  constructor() {
    this.blogUrl = 'https://www.boostly.com/blog';
    this.dataFile = './previous_posts.json';
    this.socialPlatforms = {
      facebook: { maxLength: 2000, style: 'conversational' },
      instagram: { maxLength: 2200, style: 'visual', hashtags: true },
      linkedin: { maxLength: 1300, style: 'professional' }
    };
  }

  // Scrape blog post list from main blog page
  async scrapeBlogList() {
    const browser = await puppeteer.launch({ 
      headless: false, // Set to true for production
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    try {
      console.log('Loading blog page...');
      await page.goto(this.blogUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract blog posts from the page
      const posts = await page.evaluate(() => {
        // Look for blog post containers - adjust selectors based on actual HTML structure
        const postElements = document.querySelectorAll('a[href*="/blog/"]');
        
        return Array.from(postElements).map(element => {
          const url = element.href;
          
          // Try to find title - could be in various elements within the link
          const titleElement = element.querySelector('h1, h2, h3, h4, h5, h6') || 
                              element.querySelector('[class*="title"]') ||
                              element.querySelector('[class*="heading"]') ||
                              element;
          
          const title = titleElement ? titleElement.textContent.trim() : 'No title found';
          
          // Try to find date if available
          const dateElement = element.querySelector('[class*="date"]') ||
                             element.querySelector('time') ||
                             element.querySelector('[class*="published"]');
          
          const dateText = dateElement ? dateElement.textContent.trim() : null;
          
          // Try to find excerpt/preview
          const excerptElement = element.querySelector('p') ||
                               element.querySelector('[class*="excerpt"]') ||
                               element.querySelector('[class*="preview"]');
          
          const excerpt = excerptElement ? excerptElement.textContent.trim() : '';

          return {
            title,
            url,
            dateText,
            excerpt,
            id: url.split('/').pop() || url // Use URL slug as ID
          };
        }).filter(post => 
          post.url.includes('/blog/') && 
          post.title !== 'No title found' &&
          post.url !== this.blogUrl // Exclude the main blog page link
        );
      });

      await browser.close();
      
      console.log(`Found ${posts.length} blog posts`);
      posts.forEach(post => {
        console.log(`- ${post.title} (${post.url})`);
      });
      
      return posts;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // Scrape full content of a specific blog post
  async scrapePostContent(postUrl) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
      console.log(`Scraping post: ${postUrl}`);
      await page.goto(postUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const content = await page.evaluate(() => {
        // Extract main content - adjust these selectors for your Framer structure
        const titleElement = document.querySelector('h1, [class*="title"], [class*="heading"]');
        const title = titleElement ? titleElement.textContent.trim() : '';

        // Look for main content area
        const contentElement = document.querySelector('main, article, [class*="content"], [class*="post"]') ||
                              document.querySelector('body');
        
        // Get all text content
        const fullText = contentElement ? contentElement.textContent.trim() : '';
        
        // Try to get just paragraphs for cleaner content
        const paragraphs = Array.from(contentElement.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(text => text.length > 20); // Filter out short/empty paragraphs

        // Look for images
        const images = Array.from(document.querySelectorAll('img'))
          .map(img => ({
            src: img.src,
            alt: img.alt || ''
          }))
          .filter(img => img.src && !img.src.includes('icon')); // Filter out icons

        return {
          title,
          fullText: fullText.substring(0, 5000), // Limit length
          paragraphs: paragraphs.slice(0, 10), // First 10 paragraphs
          images: images.slice(0, 5), // First 5 images
          wordCount: fullText.split(' ').length
        };
      });

      await browser.close();
      return content;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // Load previously scraped posts
  async loadPreviousPosts() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return []; // No previous data
    }
  }

  // Save current posts
  async savePosts(posts) {
    await fs.writeFile(this.dataFile, JSON.stringify(posts, null, 2));
  }

  // Find new posts by comparing with previous scan
  findNewPosts(currentPosts, previousPosts) {
    const previousIds = new Set(previousPosts.map(p => p.id));
    return currentPosts.filter(post => !previousIds.has(post.id));
  }

  // Convert blog content to social media posts
  convertToSocialPosts(postContent, postMeta) {
    const socialPosts = {};

    // Facebook version
    socialPosts.facebook = this.createFacebookPost(postContent, postMeta);
    
    // Instagram version
    socialPosts.instagram = this.createInstagramPost(postContent, postMeta);
    
    // LinkedIn version
    socialPosts.linkedin = this.createLinkedInPost(postContent, postMeta);

    return socialPosts;
  }

  createFacebookPost(content, meta) {
    const maxLength = this.socialPlatforms.facebook.maxLength;
    
    let post = `📖 New blog post: ${content.title}\n\n`;
    
    // Add first paragraph or excerpt
    if (content.paragraphs.length > 0) {
      post += content.paragraphs[0].substring(0, maxLength - post.length - 100) + '\n\n';
    }
    
    post += `Read more: ${meta.url}`;
    
    return post.substring(0, maxLength);
  }

  createInstagramPost(content, meta) {
    const maxLength = this.socialPlatforms.instagram.maxLength;
    
    let post = `✨ ${content.title}\n\n`;
    
    // Add shorter excerpt for Instagram
    if (content.paragraphs.length > 0) {
      const excerpt = content.paragraphs[0].substring(0, 300);
      post += excerpt + '...\n\n';
    }
    
    // Add hashtags
    post += '#Boostly #ShortTermRental #PropertyManagement #AirbnbTips #Blog';
    
    post += `\n\nLink in bio 👆`;
    
    return post.substring(0, maxLength);
  }

  createLinkedInPost(content, meta) {
    const maxLength = this.socialPlatforms.linkedin.maxLength;
    
    let post = `${content.title}\n\n`;
    
    // Professional tone introduction
    post += `I've just published a new article that explores `;
    
    if (content.paragraphs.length > 0) {
      post += content.paragraphs[0].substring(0, maxLength - post.length - 200) + '\n\n';
    }
    
    post += `What are your thoughts on this topic?\n\n`;
    post += `Read the full article: ${meta.url}`;
    
    return post.substring(0, maxLength);
  }

  // Main function to check for new posts and generate social content
  async checkForNewPosts() {
    try {
      console.log('🔍 Checking for new blog posts...');
      
      // Get current posts
      const currentPosts = await this.scrapeBlogList();
      
      // Load previous posts
      const previousPosts = await this.loadPreviousPosts();
      
      // Find new posts
      const newPosts = this.findNewPosts(currentPosts, previousPosts);
      
      if (newPosts.length === 0) {
        console.log('✅ No new posts found');
        return;
      }
      
      console.log(`🆕 Found ${newPosts.length} new posts!`);
      
      // Process each new post
      for (const post of newPosts) {
        console.log(`\n📝 Processing: ${post.title}`);
        
        try {
          // Scrape full content
          const content = await this.scrapePostContent(post.url);
          
          // Generate social media posts
          const socialPosts = this.convertToSocialPosts(content, post);
          
          // Output results
          console.log('\n=== SOCIAL MEDIA POSTS ===');
          console.log('\n--- FACEBOOK ---');
          console.log(socialPosts.facebook);
          console.log('\n--- INSTAGRAM ---');
          console.log(socialPosts.instagram);
          console.log('\n--- LINKEDIN ---');
          console.log(socialPosts.linkedin);
          console.log('\n========================\n');
          
          // Optional: Save to files
          const postDir = `./social_posts/${post.id}`;
          await fs.mkdir(postDir, { recursive: true });
          
          await fs.writeFile(`${postDir}/facebook.txt`, socialPosts.facebook);
          await fs.writeFile(`${postDir}/instagram.txt`, socialPosts.instagram);
          await fs.writeFile(`${postDir}/linkedin.txt`, socialPosts.linkedin);
          await fs.writeFile(`${postDir}/metadata.json`, JSON.stringify({
            ...post,
            content,
            scrapedAt: new Date().toISOString()
          }, null, 2));
          
        } catch (error) {
          console.error(`❌ Error processing ${post.title}:`, error.message);
        }
      }
      
      // Save updated post list
      await this.savePosts(currentPosts);
      console.log('💾 Updated post database');
      
    } catch (error) {
      console.error('❌ Error checking for posts:', error);
    }
  }
}

// Usage
async function main() {
  const scraper = new BoostlyBlogScraper();
  await scraper.checkForNewPosts();
}

// Run immediately
main().catch(console.error);

// Or set up periodic checking (every 6 hours)
// setInterval(() => {
//   main().catch(console.error);
// }, 6 * 60 * 60 * 1000);

module.exports = BoostlyBlogScraper;