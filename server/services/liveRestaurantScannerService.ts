import { DataForSeoLiveService } from './dataForSeoLiveService.js';
import { AIRecommendationService } from './aiRecommendationService.js';
import { ScanResult } from '@shared/schema';

export interface LiveScanProgress {
  progress: number;
  status: string;
}

export interface LiveScanInput {
  restaurantName: string;
  location: string;
  website?: string;
  ownerEmail?: string;
}

export class LiveRestaurantScannerService {
  private dataForSeoLive: DataForSeoLiveService;
  private aiRecommendationService: AIRecommendationService;

  constructor(dataForSeoLogin: string, dataForSeoPassword: string) {
    this.dataForSeoLive = new DataForSeoLiveService(dataForSeoLogin, dataForSeoPassword);
    this.aiRecommendationService = new AIRecommendationService();
  }

  async scanRestaurant(
    input: LiveScanInput,
    onProgress: (progress: LiveScanProgress) => void
  ): Promise<ScanResult> {
    const { restaurantName, location, website } = input;
    
    try {
      // Phase 1: Restaurant Discovery (5 seconds)
      onProgress({ progress: 10, status: 'Discovering restaurant information...' });
      const restaurants = await this.dataForSeoLive.discoverRestaurant(restaurantName, location);
      const restaurant = restaurants[0];
      
      if (!restaurant) {
        throw new Error('Restaurant not found in business listings');
      }

      const targetDomain = website || restaurant.website || `${restaurantName.toLowerCase().replace(/\s+/g, '')}.com`;
      
      // Phase 2: Parallel Live Analysis (15-30 seconds)
      onProgress({ progress: 25, status: 'Analyzing business profile and website performance...' });
      
      const [
        gmbData,
        performanceData,
        keywordData,
        competitorData,
        localSearchData,
        domainAnalytics
      ] = await Promise.all([
        this.dataForSeoLive.getGMBData(restaurantName, location),
        this.dataForSeoLive.getLighthouseAudit(targetDomain),
        this.dataForSeoLive.getKeywordsForSite(targetDomain, location),
        this.dataForSeoLive.getCompetitorAnalysis(targetDomain, location),
        this.dataForSeoLive.getLocalSearchPerformance('restaurant', location),
        this.dataForSeoLive.getDomainAnalytics(targetDomain, location)
      ]);

      onProgress({ progress: 60, status: 'Processing competitive intelligence...' });

      // Phase 3: AI Analysis & Scoring (10 seconds)
      onProgress({ progress: 75, status: 'Generating AI-powered insights...' });
      
      const scores = this.calculatePerformanceScores(
        performanceData,
        gmbData,
        keywordData,
        competitorData,
        domainAnalytics
      );

      const issues = this.generateIssues(scores, performanceData, gmbData, keywordData);
      const recommendations = await this.generateRecommendations(
        restaurantName,
        scores,
        issues,
        competitorData,
        keywordData
      );

      onProgress({ progress: 90, status: 'Finalizing comprehensive report...' });

      // Phase 4: Report Generation (5 seconds)
      const scanResult: ScanResult = {
        domain: targetDomain,
        restaurantName,
        overallScore: Math.round((scores.seo + scores.performance + scores.mobile + scores.local) / 4),
        performance: scores.performance,
        seo: scores.seo,
        mobile: scores.mobile,
        userExperience: scores.userExperience,
        issues,
        recommendations,
        keywords: keywordData.slice(0, 10).map(k => ({
          keyword: k.keyword,
          position: k.position,
          searchVolume: k.searchVolume,
          difficulty: k.difficulty,
          intent: k.intent
        })),
        competitors: competitorData.slice(0, 5).map(c => ({
          name: c.name,
          domain: c.domain,
          performance: Math.round(c.domainRank / 10),
          seo: Math.round(c.organicTraffic / 1000),
          accessibility: 75, // Placeholder - would need additional API call
          bestPractices: 70, // Placeholder - would need additional API call
          overallScore: Math.round((c.domainRank + c.organicTraffic/1000) / 2),
          isYou: c.domain === targetDomain
        })),
        screenshot: null, // Live API doesn't provide screenshots
        seoAnalysis: {
          title: gmbData?.name || restaurantName,
          metaDescription: `${restaurantName} - ${restaurant.address}`,
          h1Tags: [restaurantName],
          imageCount: gmbData?.photos.total || 0,
          internalLinks: 10, // Placeholder - would need on-page analysis
          externalLinks: 5, // Placeholder - would need on-page analysis
          schemaMarkup: false // Placeholder - would need technical audit
        },
        metrics: {
          fcp: performanceData?.firstContentfulPaint || 0,
          lcp: performanceData?.largestContentfulPaint || 0,
          cls: performanceData?.cumulativeLayoutShift || 0,
          fid: 0 // Not available in current data
        },
        domainAuthority: domainAnalytics?.domainRank || 0,
        backlinks: domainAnalytics?.backlinks || 0,
        organicTraffic: domainAnalytics?.organicTraffic || 0,
        scanDate: new Date().toISOString(),
        businessProfile: gmbData ? {
          name: gmbData.name,
          rating: gmbData.rating,
          totalReviews: gmbData.reviewCount,
          photos: {
            total: gmbData.photos.total,
            quality: gmbData.photos.total > 10 ? 'excellent' : 
                     gmbData.photos.total > 5 ? 'good' : 
                     gmbData.photos.total > 0 ? 'fair' : 'poor',
            categories: {
              food: Math.round(gmbData.photos.total * 0.4),
              interior: Math.round(gmbData.photos.total * 0.3),
              exterior: Math.round(gmbData.photos.total * 0.2),
              menu: Math.round(gmbData.photos.total * 0.1),
              other: 0
            }
          },
          reviews: {
            sentiment: gmbData.reviews.sentiment,
            score: gmbData.rating * 20,
            recent: gmbData.reviews.recent.slice(0, 5)
          },
          isVerified: gmbData.isVerified,
          responseRate: gmbData.reviews.responseRate,
          averageResponseTime: gmbData.reviews.responseRate > 50 ? '1-2 days' : '3-5 days'
        } : undefined,
        mobileExperience: performanceData ? {
          score: performanceData.mobileScore,
          loadTime: performanceData.speedIndex,
          isResponsive: performanceData.mobileScore > 60,
          touchFriendly: performanceData.mobileScore > 70,
          textReadable: performanceData.mobileScore > 65,
          navigationEasy: performanceData.mobileScore > 75,
          issues: performanceData.technicalIssues,
          recommendations: this.generateMobileRecommendations(performanceData)
        } : undefined,
        reviewsAnalysis: gmbData ? {
          overallScore: gmbData.rating * 20,
          totalReviews: gmbData.reviewCount,
          averageRating: gmbData.rating,
          sentimentBreakdown: {
            positive: gmbData.reviews.sentiment === 'positive' ? 70 : 
                      gmbData.reviews.sentiment === 'neutral' ? 50 : 30,
            neutral: gmbData.reviews.sentiment === 'neutral' ? 50 : 30,
            negative: gmbData.reviews.sentiment === 'negative' ? 40 : 20
          },
          reviewSources: [
            {
              platform: 'Google',
              count: gmbData.reviewCount,
              averageRating: gmbData.rating
            }
          ],
          recentTrends: {
            ratingTrend: gmbData.rating > 4.0 ? 'improving' : 
                         gmbData.rating > 3.0 ? 'stable' : 'declining',
            volumeTrend: gmbData.reviewCount > 50 ? 'increasing' : 'stable',
            responseRate: gmbData.reviews.responseRate,
            averageResponseTime: gmbData.reviews.responseRate > 50 ? '1-2 days' : '3-5 days'
          },
          topKeywords: keywordData.slice(0, 5).map(k => k.keyword),
          competitorComparison: competitorData.slice(0, 3).map(c => ({
            name: c.name,
            rating: 4.0, // Placeholder - would need competitor GMB data
            reviewCount: 100, // Placeholder
            responseRate: 30 // Placeholder
          })),
          actionableInsights: [
            'Increase review response rate to improve customer engagement',
            'Encourage satisfied customers to leave more positive reviews',
            'Address negative feedback patterns to improve overall rating'
          ]
        } : undefined
      };

      onProgress({ progress: 100, status: 'Analysis complete!' });
      return scanResult;

    } catch (error) {
      console.error('Live restaurant scan failed:', error);
      throw error;
    }
  }

  private calculatePerformanceScores(
    performanceData: any,
    gmbData: any,
    keywordData: any[],
    competitorData: any[],
    domainAnalytics: any
  ) {
    return {
      performance: performanceData?.lighthouseScore || 0,
      seo: performanceData?.seoScore || 0,
      mobile: performanceData?.mobileScore || 0,
      userExperience: Math.round(((gmbData?.rating || 0) / 5) * 100),
      local: Math.round(((gmbData?.rating || 0) / 5) * 100)
    };
  }

  private generateIssues(scores: any, performanceData: any, gmbData: any, keywordData: any[]) {
    const issues = [];

    if (scores.performance < 60) {
      issues.push({
        type: 'performance',
        severity: 'high' as const,
        title: '🚀 Website Speed Crisis',
        description: `Performance score of ${scores.performance}/100 is causing customer abandonment. Page load time affects conversion rates.`,
        impact: 'high' as const,
        effort: 'medium' as const
      });
    }

    if (scores.seo < 70) {
      issues.push({
        type: 'seo',
        severity: 'medium' as const,
        title: '🔍 SEO Optimization Needed',
        description: `SEO score of ${scores.seo}/100 limits search visibility. Missing optimization opportunities.`,
        impact: 'medium' as const,
        effort: 'medium' as const
      });
    }

    if (scores.mobile < 65) {
      issues.push({
        type: 'mobile',
        severity: 'high' as const,
        title: '📱 Mobile Experience Issues',
        description: `Mobile score of ${scores.mobile}/100 hurts mobile customers. Most restaurant searches happen on mobile.`,
        impact: 'high' as const,
        effort: 'medium' as const
      });
    }

    if (gmbData && gmbData.rating < 4.0) {
      issues.push({
        type: 'reviews',
        severity: 'medium' as const,
        title: '⭐ Review Management Needed',
        description: `Rating of ${gmbData.rating}/5 is below industry average. Customer perception needs improvement.`,
        impact: 'medium' as const,
        effort: 'high' as const
      });
    }

    if (keywordData.length < 10) {
      issues.push({
        type: 'keywords',
        severity: 'medium' as const,
        title: '🎯 Limited Keyword Presence',
        description: `Only ranking for ${keywordData.length} keywords. Missing opportunities for local search visibility.`,
        impact: 'medium' as const,
        effort: 'medium' as const
      });
    }

    return issues;
  }

  private async generateRecommendations(
    restaurantName: string,
    scores: any,
    issues: any[],
    competitorData: any[],
    keywordData: any[]
  ) {
    const context = {
      name: restaurantName,
      rating: scores.userExperience / 20,
      totalReviews: 100, // Placeholder
      domain: `${restaurantName.toLowerCase().replace(/\s+/g, '')}.com`,
      performanceScore: scores.performance,
      seoScore: scores.seo,
      mobileScore: scores.mobile,
      competitors: competitorData,
      keywordData,
      issues
    };

    try {
      return await this.aiRecommendationService.generateRecommendations(context);
    } catch (error) {
      console.error('AI recommendations failed:', error);
      return this.getFallbackRecommendations(scores, issues);
    }
  }

  private getFallbackRecommendations(scores: any, issues: any[]) {
    const recommendations = [];

    if (scores.performance < 60) {
      recommendations.push({
        title: 'Optimize Website Speed',
        description: 'Improve page load times by compressing images, minifying code, and using a content delivery network.',
        impact: 'high' as const,
        effort: 'medium' as const,
        category: 'performance'
      });
    }

    if (scores.seo < 70) {
      recommendations.push({
        title: 'Enhance SEO Foundation',
        description: 'Add proper meta tags, improve content structure, and optimize for local search terms.',
        impact: 'medium' as const,
        effort: 'medium' as const,
        category: 'seo'
      });
    }

    if (scores.mobile < 65) {
      recommendations.push({
        title: 'Improve Mobile Experience',
        description: 'Ensure responsive design, optimize touch targets, and improve mobile page speed.',
        impact: 'high' as const,
        effort: 'medium' as const,
        category: 'mobile'
      });
    }

    return recommendations;
  }

  private generateMobileRecommendations(performanceData: any): string[] {
    const recommendations = [];

    if (performanceData.mobileScore < 60) {
      recommendations.push('Optimize images for mobile devices');
      recommendations.push('Implement responsive design principles');
      recommendations.push('Minimize JavaScript and CSS');
    }

    if (performanceData.technicalIssues.length > 0) {
      recommendations.push('Address technical performance issues');
      recommendations.push('Optimize Core Web Vitals metrics');
    }

    return recommendations;
  }
}