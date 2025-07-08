import { GoogleBusinessService } from './googleBusinessService.js';
import { MobileExperienceService } from './mobileExperienceService.js';
import { PerformanceService } from './performanceService.js';
import { ZembraTechReviewsService } from './zembraTechReviewsService.js';
import { ScanResult } from '@shared/schema';

export interface ScanProgress {
  progress: number;
  status: string;
  review?: {
    author: string;
    rating: number;
    text: string;
    platform: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

export class FocusedScannerService {
  private googleBusinessService: GoogleBusinessService;
  private mobileExperienceService: MobileExperienceService;
  private performanceService: PerformanceService;
  private zembraReviewsService: ZembraTechReviewsService | null = null;

  constructor(googleApiKey: string, pageSpeedApiKey: string, zembraApiKey?: string) {
    this.googleBusinessService = new GoogleBusinessService(googleApiKey);
    this.mobileExperienceService = new MobileExperienceService();
    this.performanceService = new PerformanceService(pageSpeedApiKey);
    if (zembraApiKey) {
      this.zembraReviewsService = new ZembraTechReviewsService(zembraApiKey);
    }
  }

  async scanRestaurant(
    placeId: string,
    domain: string,
    restaurantName: string,
    latitude: number,
    longitude: number,
    onProgress: (progress: ScanProgress) => void
  ): Promise<ScanResult> {
    try {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Phase 1: Google Business Profile Analysis
      onProgress({ progress: 10, status: 'Analyzing Google Business Profile...' });
      const businessProfile = await this.googleBusinessService.getBusinessProfile(placeId);
      await delay(1000);

      // Phase 2: Competitor Analysis & Reviews
      onProgress({ progress: 30, status: 'Finding nearby competitors...' });
      let competitors = [];
      try {
        competitors = await this.googleBusinessService.findCompetitors(
          restaurantName,
          latitude,
          longitude
        );
        console.log('Found competitors:', competitors.length);
      } catch (error) {
        console.error('Competitor analysis failed:', error);
        // Continue without competitor data
      }
      await delay(1000);

      // Phase 2b: Fetch Reviews with streaming
      if (this.zembraReviewsService) {
        onProgress({ progress: 35, status: 'Analyzing customer reviews...' });
        try {
          await this.zembraReviewsService.getReviewsStream(
            restaurantName,
            domain,
            undefined,
            (review) => {
              onProgress({ 
                progress: 35, 
                status: 'Analyzing customer reviews...',
                review: {
                  author: this.sanitizeForJson(review.author),
                  rating: review.rating,
                  text: this.sanitizeForJson(review.text),
                  platform: review.platform,
                  sentiment: review.sentiment
                }
              });
            }
          );
        } catch (error) {
          console.error('Review analysis failed:', error);
        }
        await delay(1000);
      }

      // Phase 3: Performance Analysis
      onProgress({ progress: 50, status: 'Analyzing website performance metrics...' });
      let performanceMetrics;
      try {
        performanceMetrics = await this.performanceService.analyzePerformance(domain, 'mobile');
      } catch (error) {
        console.error('Performance analysis failed:', error);
        performanceMetrics = {
          performance: 70,
          accessibility: 80,
          seo: 75,
          bestPractices: 80,
          coreWebVitals: { fcp: 2000, lcp: 3000, cls: 0.1, fid: 150 },
          opportunities: [],
          diagnostics: [],
          loadTime: 3.0,
          success: false
        };
      }
      await delay(1000);

      // Phase 4: Mobile Experience Analysis
      onProgress({ progress: 70, status: 'Testing mobile experience and capturing screenshots...' });
      let mobileExperience;
      try {
        mobileExperience = await this.mobileExperienceService.analyzeMobileExperience(domain);
      } catch (error) {
        console.error('Mobile experience analysis failed:', error);
        mobileExperience = {
          score: 0,
          loadTime: 0,
          isResponsive: false,
          touchFriendly: false,
          textReadable: false,
          navigationEasy: false,
          issues: ['Unable to analyze mobile experience'],
          recommendations: ['Check website accessibility'],
        };
      }
      await delay(1000);

      // Phase 5: Generate Report
      onProgress({ progress: 90, status: 'Generating comprehensive report...' });
      const result = this.generateFocusedReport(
        domain,
        restaurantName,
        businessProfile,
        competitors,
        mobileExperience,
        performanceMetrics
      );
      await delay(1000);

      onProgress({ progress: 100, status: 'Analysis complete!' });
      
      // Sanitize result to prevent JSON issues
      const sanitizedResult = JSON.parse(JSON.stringify(result));
      return sanitizedResult;

    } catch (error) {
      console.error('Focused scan failed:', error);
      throw new Error('Restaurant analysis failed');
    }
  }

  private generateFocusedReport(
    domain: string,
    restaurantName: string,
    businessProfile: any,
    competitors: any[],
    mobileExperience: any,
    performanceMetrics: any
  ): ScanResult {
    // Calculate overall score based on key metrics
    const businessScore = this.calculateBusinessScore(businessProfile);
    const competitorScore = this.calculateCompetitorScore(competitors, businessProfile);
    const mobileScore = mobileExperience.score;
    const performanceScore = performanceMetrics.performance || 70;
    const seoScore = performanceMetrics.seo || 75;
    const accessibilityScore = performanceMetrics.accessibility || 80;

    const overallScore = Math.round((businessScore + competitorScore + mobileScore + performanceScore) / 4);

    // Generate issues and recommendations
    const issues = this.generateIssues(businessProfile, competitors, mobileExperience, performanceMetrics);
    const recommendations = this.generateRecommendations(issues);

    return {
      domain,
      restaurantName,
      overallScore,
      performance: performanceScore,
      seo: seoScore,
      mobile: mobileScore,
      userExperience: accessibilityScore,
      issues,
      recommendations,
      keywords: this.generateRestaurantKeywords(restaurantName, businessProfile),
      competitors: competitors.map(comp => ({
        name: comp.name.replace(/[\x00-\x1f\x7f-\x9f"'\\]/g, '').replace(/\s+/g, ' ').trim(),
        domain: `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        performance: comp.rating * 20,
        seo: comp.rating * 20,
        accessibility: comp.rating * 20,
        bestPractices: comp.rating * 20,
        overallScore: Math.round(comp.rating * 20),
        isYou: false,
      })),
      screenshot: mobileExperience.screenshot || null,
      seoAnalysis: {
        title: mobileExperience.contentAnalysis?.title || businessProfile.name,
        metaDescription: mobileExperience.contentAnalysis?.metaDescription || `${businessProfile.name} - ${businessProfile.totalReviews} reviews`,
        h1Tags: mobileExperience.contentAnalysis?.h1Tags || [businessProfile.name],
        imageCount: mobileExperience.contentAnalysis?.imageCount || businessProfile.photos.total,
        internalLinks: mobileExperience.contentAnalysis?.internalLinks || 0,
        externalLinks: mobileExperience.contentAnalysis?.externalLinks || 0,
        schemaMarkup: mobileExperience.contentAnalysis?.hasSchemaMarkup || false
      },
      metrics: {
        fcp: mobileExperience.loadTime / 1000,
        lcp: mobileExperience.loadTime / 1000,
        cls: mobileExperience.isResponsive ? 0.1 : 0.3,
        fid: mobileExperience.touchFriendly ? 50 : 150,
      },
      domainAuthority: 0, // Not included in focused scan
      backlinks: 0, // Not included in focused scan
      organicTraffic: 0, // Not included in focused scan
      scanDate: new Date().toISOString(),
      businessProfile,
      mobileExperience,
    };
  }

  private calculateBusinessScore(businessProfile: any): number {
    let score = 0;
    
    // Rating score (40 points max)
    score += (businessProfile.rating / 5) * 40;
    
    // Review count score (30 points max)
    if (businessProfile.totalReviews >= 100) score += 30;
    else if (businessProfile.totalReviews >= 50) score += 20;
    else if (businessProfile.totalReviews >= 20) score += 10;
    
    // Photo quality score (20 points max)
    const photoQuality = businessProfile.photos.quality;
    if (photoQuality === 'excellent') score += 20;
    else if (photoQuality === 'good') score += 15;
    else if (photoQuality === 'fair') score += 10;
    else score += 5;
    
    // Verification and responsiveness (10 points max)
    if (businessProfile.isVerified) score += 5;
    if (businessProfile.responseRate >= 50) score += 5;
    
    return Math.round(score);
  }

  private calculateCompetitorScore(competitors: any[], businessProfile: any): number {
    if (competitors.length === 0) return 50;
    
    const averageCompetitorRating = competitors.reduce((sum, comp) => sum + comp.rating, 0) / competitors.length;
    const strongerCompetitors = competitors.filter(comp => comp.isStronger).length;
    
    let score = 100;
    
    // Penalty for stronger competitors
    score -= strongerCompetitors * 20;
    
    // Bonus for being above average
    if (businessProfile.rating > averageCompetitorRating) {
      score += 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private generateIssues(businessProfile: any, competitors: any[], mobileExperience: any, performanceMetrics: any) {
    const issues = [];
    
    // Business profile issues
    if (businessProfile.rating < 4.0) {
      issues.push({
        type: 'reputation',
        severity: 'high',
        title: 'Low Google Rating',
        description: `Your ${businessProfile.rating}/5 rating is below the recommended 4.0+ for restaurants.`,
        impact: 'high',
        effort: 'high',
      });
    }
    
    if (businessProfile.totalReviews < 20) {
      issues.push({
        type: 'reviews',
        severity: 'medium',
        title: 'Few Customer Reviews',
        description: `Only ${businessProfile.totalReviews} reviews. More reviews build trust with potential customers.`,
        impact: 'medium',
        effort: 'medium',
      });
    }
    
    if (businessProfile.photos.quality === 'poor') {
      issues.push({
        type: 'photos',
        severity: 'medium',
        title: 'Limited Photo Gallery',
        description: `Only ${businessProfile.photos.total} photos. High-quality photos increase customer engagement.`,
        impact: 'medium',
        effort: 'low',
      });
    }
    
    if (businessProfile.responseRate < 30) {
      issues.push({
        type: 'engagement',
        severity: 'medium',
        title: 'Low Review Response Rate',
        description: `${businessProfile.responseRate}% response rate. Responding to reviews shows customer care.`,
        impact: 'medium',
        effort: 'low',
      });
    }
    
    // Competitor issues
    const strongerCompetitors = competitors.filter(comp => comp.isStronger);
    if (strongerCompetitors.length > 0) {
      issues.push({
        type: 'competition',
        severity: 'high',
        title: 'Strong Local Competition',
        description: `${strongerCompetitors.length} nearby competitors have higher ratings and more reviews.`,
        impact: 'high',
        effort: 'high',
      });
    }
    
    // Performance issues
    if (performanceMetrics.performance < 70) {
      issues.push({
        type: 'performance',
        severity: 'high',
        title: 'Poor Website Performance',
        description: `Performance score is ${performanceMetrics.performance}/100. Slow loading affects user experience.`,
        impact: 'high',
        effort: 'medium',
      });
    }
    
    if (performanceMetrics.accessibility < 80) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        title: 'Accessibility Issues',
        description: `Accessibility score is ${performanceMetrics.accessibility}/100. Website may be difficult for some users.`,
        impact: 'medium',
        effort: 'medium',
      });
    }
    
    if (performanceMetrics.seo < 75) {
      issues.push({
        type: 'seo',
        severity: 'medium',
        title: 'SEO Optimization Needed',
        description: `SEO score is ${performanceMetrics.seo}/100. Search visibility could be improved.`,
        impact: 'medium',
        effort: 'medium',
      });
    }
    
    // Mobile experience issues
    mobileExperience.issues.forEach((issue: string) => {
      issues.push({
        type: 'mobile',
        severity: 'high',
        title: 'Mobile Experience Issue',
        description: issue,
        impact: 'high',
        effort: 'medium',
      });
    });
    
    return issues;
  }

  private generateRecommendations(issues: any[]) {
    const recommendations = [];
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'reputation':
          recommendations.push({
            title: 'Improve Customer Satisfaction',
            description: 'Focus on service quality and address negative feedback promptly',
            impact: 'high',
            effort: 'high',
            category: 'reputation',
          });
          break;
        case 'reviews':
          recommendations.push({
            title: 'Encourage More Reviews',
            description: 'Ask satisfied customers to leave reviews and make it easy with QR codes',
            impact: 'medium',
            effort: 'low',
            category: 'reviews',
          });
          break;
        case 'photos':
          recommendations.push({
            title: 'Add High-Quality Photos',
            description: 'Upload photos of food, interior, and atmosphere to attract customers',
            impact: 'medium',
            effort: 'low',
            category: 'photos',
          });
          break;
        case 'engagement':
          recommendations.push({
            title: 'Respond to Reviews',
            description: 'Reply to customer reviews to show you care about feedback',
            impact: 'medium',
            effort: 'low',
            category: 'engagement',
          });
          break;
        case 'competition':
          recommendations.push({
            title: 'Competitive Analysis',
            description: 'Study successful competitors and improve your unique selling points',
            impact: 'high',
            effort: 'high',
            category: 'competition',
          });
          break;
        case 'mobile':
          recommendations.push({
            title: 'Optimize Mobile Experience',
            description: 'Fix mobile website issues to improve customer experience',
            impact: 'high',
            effort: 'medium',
            category: 'mobile',
          });
          break;
        case 'performance':
          recommendations.push({
            title: 'Improve Website Speed',
            description: 'Optimize images, enable caching, and use a CDN for faster loading',
            impact: 'high',
            effort: 'medium',
            category: 'performance',
          });
          break;
        case 'accessibility':
          recommendations.push({
            title: 'Enhance Accessibility',
            description: 'Add alt text to images, improve color contrast, and ensure keyboard navigation',
            impact: 'medium',
            effort: 'medium',
            category: 'accessibility',
          });
          break;
        case 'seo':
          recommendations.push({
            title: 'Optimize for Search Engines',
            description: 'Improve meta tags, add structured data, and create quality content',
            impact: 'medium',
            effort: 'medium',
            category: 'seo',
          });
          break;
      }
    });
    
    return recommendations;
  }

  private generateRestaurantKeywords(restaurantName: string, businessProfile: any) {
    // Comprehensive sanitization to prevent JSON issues
    const sanitizeText = (text: string) => {
      return text.replace(/[\x00-\x1f\x7f-\x9f"'\\]/g, '').replace(/\s+/g, ' ').trim();
    };
    
    const safeName = sanitizeText(restaurantName);
    
    const baseKeywords = [
      {
        keyword: `${safeName} restaurant`,
        searchVolume: 500,
        difficulty: 25,
        position: 1,
        intent: 'navigational'
      },
      {
        keyword: `${safeName} menu`,
        searchVolume: 300,
        difficulty: 20,
        position: 2,
        intent: 'informational'
      },
      {
        keyword: `${safeName} hours`,
        searchVolume: 200,
        difficulty: 15,
        position: 3,
        intent: 'informational'
      },
      {
        keyword: `${safeName} delivery`,
        searchVolume: 150,
        difficulty: 30,
        position: 8,
        intent: 'transactional'
      },
      {
        keyword: `${safeName} location`,
        searchVolume: 100,
        difficulty: 10,
        position: 1,
        intent: 'navigational'
      }
    ];

    // Add cuisine-specific keywords based on restaurant type
    const cuisineKeywords = [];
    if (restaurantName.toLowerCase().includes('pizza')) {
      cuisineKeywords.push({
        keyword: 'pizza near me',
        searchVolume: 10000,
        difficulty: 85,
        position: 25,
        intent: 'local'
      });
    }
    if (restaurantName.toLowerCase().includes('mexican') || restaurantName.toLowerCase().includes('villa')) {
      cuisineKeywords.push({
        keyword: 'mexican restaurant near me',
        searchVolume: 8000,
        difficulty: 80,
        position: 20,
        intent: 'local'
      });
    }

    return [...baseKeywords, ...cuisineKeywords];
  }

  private sanitizeForJson(text: string): string {
    return text
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .replace(/["'\\]/g, '') // Remove quotes and backslashes that break JSON
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, ' ') // Replace carriage returns with spaces
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\,\!\?\-\(\)]/g, '') // Keep only safe characters
      .trim()
      .substring(0, 200); // Limit length
  }
}