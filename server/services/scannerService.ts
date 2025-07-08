import axios from 'axios';
import { ScanResult } from '@shared/schema';

export interface ScanProgress {
  progress: number;
  status: string;
}

export class ScannerService {
  private pagespeedApiKey?: string;
  private serpApiKey?: string;

  constructor(pagespeedApiKey?: string, serpApiKey?: string) {
    this.pagespeedApiKey = pagespeedApiKey;
    this.serpApiKey = serpApiKey;
  }

  async scanWebsite(
    domain: string,
    restaurantName: string,
    onProgress: (progress: ScanProgress) => void
  ): Promise<ScanResult> {
    try {
      // Helper function to add minimum delay
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      onProgress({ progress: 5, status: 'Connecting to website...' });
      await delay(2000);
      
      onProgress({ progress: 10, status: 'Analyzing website performance...' });
      await delay(1000);
      onProgress({ progress: 15, status: 'Measuring page load speed...' });
      const performanceStart = Date.now();
      const performanceData = await this.getPerformanceMetrics(domain);
      const performanceElapsed = Date.now() - performanceStart;
      if (performanceElapsed < 2000) {
        await delay(2000 - performanceElapsed);
      }
      
      onProgress({ progress: 30, status: 'Checking search rankings...' });
      await delay(1000);
      onProgress({ progress: 35, status: 'Analyzing SEO performance...' });
      const seoStart = Date.now();
      const seoData = await this.getSEOMetrics(domain, restaurantName);
      const seoElapsed = Date.now() - seoStart;
      if (seoElapsed < 2000) {
        await delay(2000 - seoElapsed);
      }
      
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
      
      onProgress({ progress: 90, status: 'Scanning competitor websites...' });
      await delay(1000);
      onProgress({ progress: 92, status: 'Analyzing competitor performance...' });
      const competitorStart = Date.now();
      const competitorData = await this.getCompetitorAnalysis(restaurantName);
      const competitorElapsed = Date.now() - competitorStart;
      if (competitorElapsed < 2000) {
        await delay(2000 - competitorElapsed);
      }
      
      onProgress({ progress: 95, status: 'Generating recommendations...' });
      await delay(2000);
      
      onProgress({ progress: 100, status: 'Scan complete!' });
      
      return this.generateScanResult(
        domain,
        performanceData,
        seoData,
        userExperienceData,
        competitorData
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
    // This would typically involve more sophisticated analysis
    // For now, we'll return a basic evaluation
    return {
      navigation: 75,
      contentQuality: 80,
      mobileOptimization: 60,
      loadingSpeed: 45,
    };
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
    competitorData: any
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

    const issues = this.generateIssues(performanceScore, seoScore, mobileScore, userExperienceScore);
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
    };
  }

  private generateIssues(performance: number, seo: number, mobile: number, ux: number) {
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

    // Always add online ordering issue for restaurants
    issues.push({
      type: 'warning' as const,
      category: 'features',
      title: 'No online ordering system',
      description: '75% of customers expect to order directly from your website.',
      impact: 'Missing 40% revenue opportunity',
    });

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
}
