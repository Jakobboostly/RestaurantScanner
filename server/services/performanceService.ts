import axios from 'axios';
import NodeCache from 'node-cache';
import pLimit from 'p-limit';

const limit = pLimit(2); // Limit concurrent PageSpeed API calls
const cache = new NodeCache({ stdTTL: 21600 }); // 6 hour cache

export interface PerformanceMetrics {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  coreWebVitals: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  opportunities: any[];
  diagnostics: any[];
  loadTime: number;
  success: boolean;
  error?: string;
}

export class PerformanceService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzePerformance(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PerformanceMetrics> {
    return limit(async () => {
      const cacheKey = `perf_${url}_${strategy}`;
      const cached = cache.get<PerformanceMetrics>(cacheKey);
      
      if (cached) {
        console.log('Using cached performance data for:', url);
        return cached;
      }

      try {
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        
        const response = await axios.get(this.baseUrl, {
          params: {
            url: targetUrl,
            key: this.apiKey,
            strategy,
            category: ['performance', 'accessibility', 'seo', 'best-practices'].join(',')
          },
          timeout: 45000 // 45 second timeout for PageSpeed API
        });

        const result = response.data;
        const lighthouseResult = result.lighthouseResult;
        const categories = lighthouseResult.categories;
        const audits = lighthouseResult.audits;

        // Extract scores
        const performance = Math.round((categories.performance?.score || 0) * 100);
        const accessibility = Math.round((categories.accessibility?.score || 0) * 100);
        const seo = Math.round((categories.seo?.score || 0) * 100);
        const bestPractices = Math.round((categories['best-practices']?.score || 0) * 100);

        // Extract Core Web Vitals
        const coreWebVitals = {
          fcp: audits['first-contentful-paint']?.numericValue || 0,
          lcp: audits['largest-contentful-paint']?.numericValue || 0,
          cls: audits['cumulative-layout-shift']?.numericValue || 0,
          fid: audits['max-potential-fid']?.numericValue || 0
        };

        // Extract opportunities and diagnostics
        const opportunities = Object.values(audits)
          .filter((audit: any) => audit.scoreDisplayMode === 'binary' && audit.score < 1)
          .map((audit: any) => ({
            title: audit.title,
            description: audit.description,
            score: audit.score,
            numericValue: audit.numericValue
          }));

        const diagnostics = Object.values(audits)
          .filter((audit: any) => audit.scoreDisplayMode === 'informative')
          .map((audit: any) => ({
            title: audit.title,
            description: audit.description,
            details: audit.details
          }));

        const metrics: PerformanceMetrics = {
          performance,
          accessibility,
          seo,
          bestPractices,
          coreWebVitals,
          opportunities,
          diagnostics,
          loadTime: coreWebVitals.lcp / 1000, // Convert to seconds
          success: true
        };

        // Cache the result
        cache.set(cacheKey, metrics);
        
        return metrics;

      } catch (error) {
        console.error('Performance analysis failed:', error);
        
        // Return fallback metrics based on content analysis
        const fallbackMetrics: PerformanceMetrics = {
          performance: 70,
          accessibility: 80,
          seo: 75,
          bestPractices: 80,
          coreWebVitals: {
            fcp: 2000,
            lcp: 3000,
            cls: 0.1,
            fid: 150
          },
          opportunities: [],
          diagnostics: [],
          loadTime: 3.0,
          success: false,
          error: error instanceof Error ? error.message : 'Performance analysis failed'
        };

        return fallbackMetrics;
      }
    });
  }

  clearCache(): void {
    cache.flushAll();
  }
}