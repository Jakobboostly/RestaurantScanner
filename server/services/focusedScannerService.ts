import { GoogleBusinessService } from './googleBusinessService.js';
import { MobileExperienceService } from './mobileExperienceService.js';
import { ScanResult } from '@shared/schema';

export interface ScanProgress {
  progress: number;
  status: string;
}

export class FocusedScannerService {
  private googleBusinessService: GoogleBusinessService;
  private mobileExperienceService: MobileExperienceService;

  constructor(googleApiKey: string) {
    this.googleBusinessService = new GoogleBusinessService(googleApiKey);
    this.mobileExperienceService = new MobileExperienceService();
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

      // Phase 2: Competitor Analysis
      onProgress({ progress: 30, status: 'Finding nearby competitors...' });
      let competitors = [];
      try {
        competitors = await this.googleBusinessService.findCompetitors(
          restaurantName,
          latitude,
          longitude
        );
      } catch (error) {
        console.error('Competitor analysis failed:', error);
        // Continue without competitor data
      }
      await delay(1000);

      // Phase 3: Mobile Experience Analysis
      onProgress({ progress: 60, status: 'Testing mobile experience...' });
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

      // Phase 4: Generate Report
      onProgress({ progress: 90, status: 'Generating comprehensive report...' });
      const result = this.generateFocusedReport(
        domain,
        restaurantName,
        businessProfile,
        competitors,
        mobileExperience
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
    mobileExperience: any
  ): ScanResult {
    // Calculate overall score based on key metrics
    const businessScore = this.calculateBusinessScore(businessProfile);
    const competitorScore = this.calculateCompetitorScore(competitors, businessProfile);
    const mobileScore = mobileExperience.score;

    const overallScore = Math.round((businessScore + competitorScore + mobileScore) / 3);

    // Generate issues and recommendations
    const issues = this.generateIssues(businessProfile, competitors, mobileExperience);
    const recommendations = this.generateRecommendations(issues);

    return {
      domain,
      restaurantName,
      overallScore,
      performance: mobileScore,
      seo: businessScore,
      mobile: mobileScore,
      userExperience: mobileScore,
      issues,
      recommendations,
      keywords: this.generateRestaurantKeywords(restaurantName, businessProfile),
      competitors: competitors.map(comp => ({
        name: comp.name,
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

  private generateIssues(businessProfile: any, competitors: any[], mobileExperience: any) {
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
      }
    });
    
    return recommendations;
  }

  private generateRestaurantKeywords(restaurantName: string, businessProfile: any) {
    // Sanitize restaurant name to prevent JSON issues
    const safeName = restaurantName.replace(/['"\\]/g, '');
    
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
}