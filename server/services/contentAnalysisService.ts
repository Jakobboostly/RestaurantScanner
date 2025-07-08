import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

const limit = pLimit(5); // Limit concurrent requests

export interface ContentAnalysis {
  title: string;
  metaDescription: string;
  hasSchemaMarkup: boolean;
  h1Tags: string[];
  imageCount: number;
  internalLinks: number;
  externalLinks: number;
  loadTime: number;
  success: boolean;
  error?: string;
}

export class ContentAnalysisService {
  private timeout: number = 10000; // 10 second timeout

  async analyzeContent(url: string): Promise<ContentAnalysis> {
    return limit(async () => {
      const startTime = Date.now();
      
      try {
        // Ensure URL has protocol
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        
        const response = await axios.get(targetUrl, {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          maxRedirects: 3
        });

        const loadTime = Date.now() - startTime;
        const $ = cheerio.load(response.data);

        // Extract and sanitize content
        const title = this.sanitizeText($('title').text());
        const metaDescription = this.sanitizeText($('meta[name="description"]').attr('content') || '');
        const hasSchemaMarkup = $('script[type="application/ld+json"]').length > 0;
        const h1Tags = $('h1').map((_, el) => this.sanitizeText($(el).text())).get();
        const imageCount = $('img').length;
        
        // Count internal and external links
        const hostname = new URL(targetUrl).hostname;
        let internalLinks = 0;
        let externalLinks = 0;
        
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (href) {
            if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
              internalLinks++;
            } else if (href.startsWith('http')) {
              if (href.includes(hostname)) {
                internalLinks++;
              } else {
                externalLinks++;
              }
            }
          }
        });

        return {
          title,
          metaDescription,
          hasSchemaMarkup,
          h1Tags,
          imageCount,
          internalLinks,
          externalLinks,
          loadTime,
          success: true
        };

      } catch (error) {
        console.error('Content analysis failed:', error);
        return {
          title: '',
          metaDescription: '',
          hasSchemaMarkup: false,
          h1Tags: [],
          imageCount: 0,
          internalLinks: 0,
          externalLinks: 0,
          loadTime: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[\x00-\x1f\x7f-\x9f"'\\]/g, '') // Remove control characters and quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 500); // Limit length
  }
}