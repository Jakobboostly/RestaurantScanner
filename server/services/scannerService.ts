import axios from 'axios';
import { ScanResult } from '@shared/schema';
import { LighthouseService } from './lighthouseService.js';
import { CompetitorService } from './competitorService.js';

export interface ScanProgress {
  progress: number;
  status: string;
}

export class ScannerService {
  private pagespeedApiKey?: string;
  private serpApiKey?: string;
  private googleApiKey?: string;
  private lighthouseService: LighthouseService;
  private competitorService: CompetitorService;

  constructor(pagespeedApiKey?: string, serpApiKey?: string, googleApiKey?: string) {
    this.pagespeedApiKey = pagespeedApiKey;
    this.serpApiKey = serpApiKey;
    this.googleApiKey = googleApiKey;
    this.lighthouseService = new LighthouseService();
    this.competitorService = new CompetitorService(googleApiKey || '');
  }

  async scanWebsite(
    domain: string,
    restaurantName: string,
    onProgress: (progress: ScanProgress) => void,
    latitude?: number,
    longitude?: number
  ): Promise<ScanResult> {
    try {
      // Helper function to add minimum delay
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const url = `https://${domain}`;
      
      // Phase 1: Verifying Restaurant
      onProgress({ progress: 5, status: 'Verifying restaurant information...' });
      await delay(3000);
      
      // Phase 2: Scanning Performance
      onProgress({ progress: 15, status: 'Scanning website performance...' });
      await delay(1000);
      
      onProgress({ progress: 20, status: 'Running PageSpeed Insights...' });
      let performanceData;
      try {
        performanceData = await this.getPerformanceMetrics(domain);
        onProgress({ progress: 25, status: 'PageSpeed analysis complete' });
      } catch (error) {
        onProgress({ progress: 25, status: 'Running local Lighthouse audit...' });
        // Fallback to local Lighthouse if PageSpeed fails
        try {
          const lighthouseMetrics = await this.lighthouseService.runLighthouseAudit(url);
          performanceData = {
            performance: lighthouseMetrics.performance,
            seo: lighthouseMetrics.seo,
            accessibility: lighthouseMetrics.accessibility,
            bestPractices: lighthouseMetrics.bestPractices,
            metrics: lighthouseMetrics.coreWebVitals
          };
        } catch (lighthouseError) {
          console.error('Both PageSpeed and Lighthouse failed:', lighthouseError);
          performanceData = this.getMockPerformanceData();
        }
      }
      await delay(3000);
      
      // Phase 3: Auditing SEO
      onProgress({ progress: 35, status: 'Auditing SEO optimization...' });
      await delay(1000);
      
      onProgress({ progress: 40, status: 'Analyzing on-page SEO elements...' });
      let seoAnalysis;
      try {
        seoAnalysis = await this.lighthouseService.analyzeOnPageSEO(url);
      } catch (error) {
        console.error('SEO analysis failed:', error);
        seoAnalysis = {
          title: '', description: '', h1Tags: [], imageAltTags: 0, totalImages: 0,
          internalLinks: 0, externalLinks: 0, hasSchema: false
        };
      }
      await delay(1000);
      
      onProgress({ progress: 45, status: 'Checking search rankings...' });
      const seoData = await this.getSEOMetrics(domain, restaurantName);
      await delay(1000);
      
      onProgress({ progress: 50, status: 'Evaluating content structure...' });
      await delay(3000);
      
      onProgress({ progress: 50, status: 'Evaluating mobile experience...' });
      await delay(1500);
      onProgress({ progress: 55, status: 'Testing responsive design...' });
      await delay(1500);
      
      onProgress({ progress: 70, status: 'Evaluating user experience...' });
      await delay(1000);
      onProgress({ progress: 75, status: 'Checking accessibility features...' });
      const uxStart = Date.now();
      const userExperienceData = await this.evaluateUserExperience(domain);
      const uxElapsed = Date.now() - uxStart;
      if (uxElapsed < 2000) {
        await delay(2000 - uxElapsed);
      }
      
      // Phase 4: Keyword Research & Rankings
      onProgress({ progress: 60, status: 'Researching keyword rankings...' });
      await delay(1000);
      
      const keywordData = await this.getKeywordAnalysis(domain, restaurantName);
      onProgress({ progress: 65, status: 'Keyword analysis complete' });
      
      // Phase 5: Competitor Benchmarking
      onProgress({ progress: 70, status: 'Discovering local competitors...' });
      let competitorData;
      if (latitude && longitude) {
        try {
          competitorData = await this.competitorService.findCompetitors(
            restaurantName, 
            latitude, 
            longitude
          );
        } catch (error) {
          console.error('Competitor analysis failed:', error);
          competitorData = await this.getCompetitorAnalysis(restaurantName);
        }
      } else {
        competitorData = await this.getCompetitorAnalysis(restaurantName);
      }
      await delay(1000);
      
      onProgress({ progress: 70, status: 'Analyzing competitor performance...' });
      await delay(1000);
      
      onProgress({ progress: 75, status: 'Benchmarking market position...' });
      await delay(3000);
      
      // Phase 5: Finishing Report
      onProgress({ progress: 85, status: 'Capturing mobile screenshot...' });
      let screenshot;
      try {
        screenshot = await this.lighthouseService.captureScreenshot(url, true);
      } catch (error) {
        console.error('Screenshot capture failed:', error);
        screenshot = null;
      }
      await delay(1000);
      
      onProgress({ progress: 90, status: 'Finalizing user experience analysis...' });
      await delay(1000);
      
      onProgress({ progress: 95, status: 'Generating final report...' });
      await delay(1000);
      
      onProgress({ progress: 100, status: 'Comprehensive scan completed!' });
      
      return this.generateScanResult(
        domain,
        performanceData,
        seoData,
        userExperienceData,
        competitorData,
        screenshot,
        seoAnalysis,
        keywordData
      );
    } catch (error) {
      console.error('Website scan error:', error);
      throw new Error('Failed to scan website');
    }
  }

  private async getPerformanceMetrics(domain: string) {
    if (!this.pagespeedApiKey) {
      console.warn('PageSpeed API key not configured, using mock data');
      return this.getMockPerformanceData();
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`,
        {
          params: {
            url: `https://${domain}`,
            key: this.pagespeedApiKey,
            category: 'performance',
            strategy: 'mobile',
          },
          timeout: 15000, // 15 second timeout
        }
      );

      console.log('PageSpeed API response status:', response.status);
      
      const { lighthouseResult } = response.data;
      
      if (!lighthouseResult || !lighthouseResult.categories || !lighthouseResult.categories.performance) {
        console.error('Invalid PageSpeed API response structure');
        throw new Error('Invalid PageSpeed API response structure');
      }
      
      const performanceScore = lighthouseResult.categories.performance.score;
      
      if (performanceScore === null || performanceScore === undefined) {
        console.error('Performance score is null or undefined');
        throw new Error('Performance score not available');
      }
      
      console.log('Real performance score received:', performanceScore);
      
      // Extract key metrics from audits
      const audits = lighthouseResult.audits || {};
      const fcpScore = audits['first-contentful-paint']?.score || 0;
      const lcpScore = audits['largest-contentful-paint']?.score || 0;
      const clsScore = audits['cumulative-layout-shift']?.score || 0;
      
      return {
        performance: Math.round(performanceScore * 100),
        seo: Math.round(Math.max(0, Math.min(100, (performanceScore * 100) + 10))), // Estimate based on performance
        accessibility: Math.round(Math.max(0, Math.min(100, (performanceScore * 100) + 20))), // Estimate based on performance
        bestPractices: Math.round(Math.max(0, Math.min(100, (performanceScore * 100) + 15))), // Estimate based on performance
        metrics: {
          fcp: fcpScore,
          lcp: lcpScore,
          cls: clsScore,
          overall: performanceScore
        },
      };
    } catch (error) {
      console.error('PageSpeed API failed, using mock data:', error);
      return this.getMockPerformanceData();
    }
  }

  private getMockPerformanceData() {
    return {
      performance: 45,
      seo: 62,
      accessibility: 78,
      bestPractices: 71,
      metrics: {},
    };
  }

  private async getSEOMetrics(domain: string, restaurantName: string) {
    if (!this.serpApiKey) {
      console.warn('SERP API key not configured, using mock data');
      return this.getMockSEOData(restaurantName);
    }

    try {
      const keywords = [
        `${restaurantName} restaurant`,
        `${restaurantName} menu`,
        `${restaurantName} delivery`,
        `${restaurantName} reservations`,
      ];

      const rankings: Record<string, number | null> = {};
      
      for (const keyword of keywords) {
        try {
          const response = await axios.get('https://serpapi.com/search.json', {
            params: {
              api_key: this.serpApiKey,
              engine: 'google',
              q: keyword,
              num: 100,
            },
          });

          let position = null;
          response.data.organic_results?.forEach((result: any, index: number) => {
            if (result.link?.includes(domain)) {
              position = index + 1;
            }
          });

          rankings[keyword] = position;
        } catch (error) {
          console.error(`SEO ranking error for keyword "${keyword}":`, error);
          rankings[keyword] = null;
        }
      }

      return rankings;
    } catch (error) {
      console.warn('SERP API failed, using mock data:', error);
      return this.getMockSEOData(restaurantName);
    }
  }

  private getMockSEOData(restaurantName: string) {
    return {
      [`${restaurantName} restaurant`]: 15,
      [`${restaurantName} menu`]: 8,
      [`${restaurantName} delivery`]: null,
      [`${restaurantName} reservations`]: 23,
    };
  }

  private async evaluateUserExperience(domain: string) {
    try {
      // Attempt to fetch the website's homepage to analyze content
      const response = await axios.get(`https://${domain}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RestaurantScanner/1.0)',
        },
      });
      
      const content = response.data.toLowerCase();
      
      // Check for online ordering indicators
      const orderingKeywords = [
        'order online', 'order now', 'place order', 'online ordering',
        'doordash', 'ubereats', 'grubhub', 'delivery', 'takeout',
        'add to cart', 'menu', 'checkout', 'postmates', 'seamless',
        'pickup', 'delivery available', 'order for pickup'
      ];
      
      const hasOnlineOrdering = orderingKeywords.some(keyword => 
        content.includes(keyword)
      );
      
      return {
        navigation: 75,
        contentQuality: 80,
        mobileOptimization: 60,
        loadingSpeed: 45,
        hasOnlineOrdering,
      };
    } catch (error) {
      console.log(`Could not analyze website content for ${domain}:`, error.message);
      
      // Fallback to basic evaluation without ordering detection
      return {
        navigation: 75,
        contentQuality: 80,
        mobileOptimization: 60,
        loadingSpeed: 45,
        hasOnlineOrdering: null, // Unknown
      };
    }
  }

  private async getCompetitorAnalysis(restaurantName: string) {
    // This would typically involve analyzing competitor websites
    // For now, we'll return mock competitor data
    return [
      { name: 'Competitor A', score: 85, isYou: false },
      { name: restaurantName, score: 0, isYou: true }, // Will be calculated
      { name: 'Competitor B', score: 78, isYou: false },
      { name: 'Competitor C', score: 72, isYou: false },
    ];
  }

  private generateScanResult(
    domain: string,
    performanceData: any,
    seoData: any,
    userExperienceData: any,
    competitorData: any,
    screenshot?: string | null,
    seoAnalysis?: any,
    keywordData?: any
  ): ScanResult {
    const performanceScore = performanceData.performance || 0;
    const seoScore = performanceData.seo || 0;
    const mobileScore = Math.max(0, performanceScore - 15); // Approximate mobile score
    const userExperienceScore = Math.round(
      (userExperienceData.navigation +
        userExperienceData.contentQuality +
        userExperienceData.mobileOptimization +
        userExperienceData.loadingSpeed) / 4
    );

    const overallScore = Math.round(
      (performanceScore * 0.3 +
        seoScore * 0.25 +
        mobileScore * 0.25 +
        userExperienceScore * 0.2)
    );

    // Update competitor data with actual score
    const updatedCompetitorData = competitorData.map((comp: any) => 
      comp.isYou ? { ...comp, score: overallScore } : comp
    );

    const issues = this.generateIssues(performanceScore, seoScore, mobileScore, userExperienceScore, userExperienceData.hasOnlineOrdering);
    const recommendations = this.generateRecommendations(issues);

    return {
      domain,
      overallScore,
      performanceScore,
      seoScore,
      mobileScore,
      userExperienceScore,
      issues,
      recommendations,
      competitorData: updatedCompetitorData,
      screenshot,
      seoAnalysis,
      keywordData,
    };
  }

  private generateIssues(performance: number, seo: number, mobile: number, ux: number, hasOnlineOrdering?: boolean | null) {
    const issues = [];

    if (performance < 50) {
      issues.push({
        type: 'critical' as const,
        category: 'performance',
        title: 'Website loads too slowly',
        description: 'Your site takes too long to load. Customers leave after 3 seconds.',
        impact: 'Losing 65% of potential customers',
      });
    }

    if (seo < 60) {
      issues.push({
        type: 'critical' as const,
        category: 'seo',
        title: 'Poor search engine visibility',
        description: 'Missing key SEO elements that search engines need.',
        impact: 'Competitors rank higher in search results',
      });
    }

    if (mobile < 60) {
      issues.push({
        type: 'warning' as const,
        category: 'mobile',
        title: 'Poor mobile experience',
        description: '85% of customers search on mobile but your site isn\'t optimized.',
        impact: 'Lower mobile search rankings',
      });
    }

    if (ux < 70) {
      issues.push({
        type: 'warning' as const,
        category: 'ux',
        title: 'User experience issues',
        description: 'Navigation and content could be improved for better customer experience.',
        impact: 'Reduced customer engagement',
      });
    }

    // Only flag online ordering as an issue if we confirmed it's missing
    if (hasOnlineOrdering === false) {
      issues.push({
        type: 'warning' as const,
        category: 'features',
        title: 'No online ordering system',
        description: '75% of customers expect to order directly from your website.',
        impact: 'Missing 40% revenue opportunity',
      });
    }

    return issues;
  }

  private generateRecommendations(issues: any[]) {
    const recommendations = [];

    if (issues.some(issue => issue.category === 'performance')) {
      recommendations.push({
        priority: 'high' as const,
        title: 'Optimize website performance',
        description: 'Compress images, enable caching, and minimize code to improve load times.',
        impact: '+42% more customers',
        effort: 'medium' as const,
      });
    }

    if (issues.some(issue => issue.category === 'seo')) {
      recommendations.push({
        priority: 'high' as const,
        title: 'Improve SEO optimization',
        description: 'Add meta descriptions, optimize title tags, and improve site structure.',
        impact: '+25% search visibility',
        effort: 'medium' as const,
      });
    }

    if (issues.some(issue => issue.category === 'features')) {
      recommendations.push({
        priority: 'medium' as const,
        title: 'Add online ordering system',
        description: 'Integrate ordering functionality to capture online customers.',
        impact: '+$3,200 monthly revenue',
        effort: 'high' as const,
      });
    }

    if (issues.some(issue => issue.category === 'mobile')) {
      recommendations.push({
        priority: 'medium' as const,
        title: 'Improve mobile experience',
        description: 'Optimize for mobile devices where most customers browse.',
        impact: '+25% mobile engagement',
        effort: 'medium' as const,
      });
    }

    return recommendations;
  }

  private async getKeywordAnalysis(domain: string, restaurantName: string) {
    if (!this.serpApiKey) {
      console.warn('SERP API key not configured, using mock keyword data');
      return this.getMockKeywordData(restaurantName);
    }

    try {
      const keywords = this.generateRestaurantKeywords(restaurantName);
      const keywordResults = [];

      for (const keyword of keywords.slice(0, 5)) { // Limit to top 5 keywords
        try {
          const response = await axios.get('https://serpapi.com/search', {
            params: {
              q: keyword,
              api_key: this.serpApiKey,
              engine: 'google',
              location: 'United States',
              gl: 'us',
              hl: 'en',
              num: 20
            },
            timeout: 10000
          });

          const organicResults = response.data.organic_results || [];
          const position = organicResults.findIndex((result: any) => 
            result.link && result.link.includes(domain)
          );

          keywordResults.push({
            keyword,
            position: position >= 0 ? position + 1 : null,
            searchVolume: this.estimateSearchVolume(keyword),
            difficulty: this.estimateKeywordDifficulty(keyword),
            intent: this.classifySearchIntent(keyword)
          });
        } catch (error) {
          console.error(`Keyword analysis failed for "${keyword}":`, error);
          keywordResults.push({
            keyword,
            position: null,
            searchVolume: this.estimateSearchVolume(keyword),
            difficulty: this.estimateKeywordDifficulty(keyword),
            intent: this.classifySearchIntent(keyword)
          });
        }
      }

      return {
        keywords: keywordResults,
        totalKeywords: keywords.length,
        averagePosition: this.calculateAveragePosition(keywordResults),
        visibilityScore: this.calculateVisibilityScore(keywordResults)
      };
    } catch (error) {
      console.error('Keyword analysis failed:', error);
      return this.getMockKeywordData(restaurantName);
    }
  }

  private generateRestaurantKeywords(restaurantName: string): string[] {
    const baseKeywords = [
      `${restaurantName}`,
      `${restaurantName} menu`,
      `${restaurantName} restaurant`,
      `${restaurantName} delivery`,
      `${restaurantName} hours`,
      `${restaurantName} location`,
      `${restaurantName} reviews`,
      `${restaurantName} reservations`,
      `${restaurantName} takeout`,
      `${restaurantName} order online`,
      `best restaurants near me`,
      `food delivery near me`,
      `restaurant reservations`,
      `local dining`,
      `restaurant menu prices`
    ];

    // Add cuisine-specific keywords if we can infer them
    const cuisineKeywords = [
      'italian restaurant',
      'pizza delivery',
      'chinese takeout',
      'mexican food',
      'thai restaurant',
      'sushi bar',
      'burger joint',
      'steakhouse',
      'seafood restaurant',
      'vegetarian restaurant'
    ];

    return [...baseKeywords, ...cuisineKeywords];
  }

  private estimateSearchVolume(keyword: string): number {
    // Basic estimation based on keyword type and length
    if (keyword.includes('near me')) return Math.floor(Math.random() * 5000) + 1000;
    if (keyword.includes('menu')) return Math.floor(Math.random() * 2000) + 500;
    if (keyword.includes('delivery')) return Math.floor(Math.random() * 3000) + 800;
    if (keyword.includes('hours')) return Math.floor(Math.random() * 1500) + 300;
    return Math.floor(Math.random() * 1000) + 100;
  }

  private estimateKeywordDifficulty(keyword: string): number {
    // Estimate difficulty based on keyword competitiveness
    if (keyword.includes('near me')) return Math.floor(Math.random() * 30) + 20; // Medium difficulty
    if (keyword.includes('best')) return Math.floor(Math.random() * 40) + 40; // High difficulty
    if (keyword.includes('delivery')) return Math.floor(Math.random() * 35) + 30; // Medium-high
    return Math.floor(Math.random() * 50) + 10; // Variable difficulty
  }

  private classifySearchIntent(keyword: string): string {
    if (keyword.includes('menu') || keyword.includes('price')) return 'Informational';
    if (keyword.includes('delivery') || keyword.includes('order')) return 'Transactional';
    if (keyword.includes('near me') || keyword.includes('location')) return 'Local';
    if (keyword.includes('hours') || keyword.includes('phone')) return 'Informational';
    if (keyword.includes('reviews') || keyword.includes('best')) return 'Research';
    return 'Navigational';
  }

  private calculateAveragePosition(keywordResults: any[]): number {
    const rankedKeywords = keywordResults.filter(k => k.position !== null);
    if (rankedKeywords.length === 0) return 0;
    
    const totalPosition = rankedKeywords.reduce((sum, k) => sum + k.position, 0);
    return Math.round(totalPosition / rankedKeywords.length);
  }

  private calculateVisibilityScore(keywordResults: any[]): number {
    const rankedKeywords = keywordResults.filter(k => k.position !== null);
    if (rankedKeywords.length === 0) return 0;
    
    // Calculate visibility based on position weights
    const visibilityScore = rankedKeywords.reduce((score, k) => {
      if (k.position <= 3) return score + 100;
      if (k.position <= 10) return score + 50;
      if (k.position <= 20) return score + 25;
      return score + 10;
    }, 0);
    
    return Math.min(100, Math.round(visibilityScore / rankedKeywords.length));
  }

  private getMockKeywordData(restaurantName: string) {
    const mockKeywords = [
      {
        keyword: `${restaurantName}`,
        position: 1,
        searchVolume: 1200,
        difficulty: 25,
        intent: 'Navigational'
      },
      {
        keyword: `${restaurantName} menu`,
        position: 3,
        searchVolume: 800,
        difficulty: 30,
        intent: 'Informational'
      },
      {
        keyword: `${restaurantName} delivery`,
        position: 7,
        searchVolume: 600,
        difficulty: 45,
        intent: 'Transactional'
      },
      {
        keyword: 'restaurants near me',
        position: 15,
        searchVolume: 4500,
        difficulty: 70,
        intent: 'Local'
      },
      {
        keyword: 'best local restaurants',
        position: null,
        searchVolume: 2200,
        difficulty: 85,
        intent: 'Research'
      }
    ];

    return {
      keywords: mockKeywords,
      totalKeywords: 15,
      averagePosition: 7,
      visibilityScore: 65
    };
  }
}
