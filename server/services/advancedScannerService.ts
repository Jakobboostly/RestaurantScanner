import { GoogleBusinessService } from './googleBusinessService.js';
import { MobileExperienceService } from './mobileExperienceService.js';
import { PerformanceService } from './performanceService.js';
import { SerpApiService } from './serpApiService.js';
import { EnhancedDataForSeoService } from './enhancedDataForSeoService.js';
import { ScanResult } from '@shared/schema';

export interface ScanProgress {
  progress: number;
  status: string;
}

export interface EnhancedScanResult extends ScanResult {
  keywordAnalysis: {
    targetKeywords: any[];
    rankingPositions: any[];
    searchVolumes: { [key: string]: number };
    opportunities: string[];
  };
  competitorIntelligence: {
    organicCompetitors: any[];
    keywordGaps: string[];
    trafficEstimates: any[];
  };
  serpFeatures: string[];
  domainAuthority: number;
}

export class AdvancedScannerService {
  private googleBusinessService: GoogleBusinessService;
  private mobileExperienceService: MobileExperienceService;
  private performanceService: PerformanceService;
  private serpApiService: SerpApiService;
  private dataForSeoService: EnhancedDataForSeoService;

  constructor(
    googleApiKey: string,
    pageSpeedApiKey: string,
    serpApiKey: string,
    dataForSeoLogin: string,
    dataForSeoPassword: string
  ) {
    this.googleBusinessService = new GoogleBusinessService(googleApiKey);
    this.mobileExperienceService = new MobileExperienceService();
    this.performanceService = new PerformanceService(pageSpeedApiKey);
    this.serpApiService = new SerpApiService(serpApiKey);
    this.dataForSeoService = new EnhancedDataForSeoService(dataForSeoLogin, dataForSeoPassword);
  }

  async scanRestaurantAdvanced(
    placeId: string,
    domain: string,
    restaurantName: string,
    latitude: number,
    longitude: number,
    onProgress: (progress: ScanProgress) => void
  ): Promise<EnhancedScanResult> {
    try {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Phase 1: Google Business Profile Analysis
      onProgress({ progress: 10, status: 'Analyzing Google Business Profile...' });
      const businessProfile = await this.googleBusinessService.getBusinessProfile(placeId);
      await delay(1000);

      // Phase 2: Competitor Analysis
      onProgress({ progress: 20, status: 'Finding nearby competitors...' });
      let competitors = [];
      try {
        competitors = await this.googleBusinessService.findCompetitors(
          restaurantName,
          latitude,
          longitude
        );
      } catch (error) {
        console.error('Competitor analysis failed:', error);
      }
      await delay(1000);

      // Phase 3: Performance Analysis
      onProgress({ progress: 35, status: 'Analyzing website performance metrics...' });
      let performanceMetrics;
      try {
        performanceMetrics = await this.performanceService.analyzePerformance(domain, 'mobile');
      } catch (error) {
        console.error('Performance analysis failed:', error);
        performanceMetrics = this.getFallbackPerformanceMetrics();
      }
      await delay(1000);

      // Phase 4: Mobile Experience Analysis
      onProgress({ progress: 50, status: 'Testing mobile experience and capturing screenshots...' });
      let mobileExperience;
      try {
        mobileExperience = await this.mobileExperienceService.analyzeMobileExperience(domain);
      } catch (error) {
        console.error('Mobile experience analysis failed:', error);
        mobileExperience = this.getFallbackMobileExperience();
      }
      await delay(1000);

      // Phase 5: Advanced Keyword Research
      onProgress({ progress: 65, status: 'Conducting advanced keyword research...' });
      let keywordData = [];
      try {
        keywordData = await this.dataForSeoService.getRestaurantKeywordSuggestions(
          restaurantName,
          `${latitude},${longitude}`,
          this.extractCuisineType(businessProfile)
        );
      } catch (error) {
        console.error('Keyword research failed:', error);
      }
      await delay(1000);

      // Phase 6: SERP Analysis
      onProgress({ progress: 75, status: 'Analyzing search engine rankings...' });
      let serpAnalysis = [];
      try {
        const primaryKeywords = this.generatePrimaryKeywords(restaurantName, businessProfile);
        const serpPromises = primaryKeywords.map(keyword => 
          this.serpApiService.analyzeKeywordRankings(domain, [keyword])
        );
        const serpResults = await Promise.allSettled(serpPromises);
        
        serpResults.forEach(result => {
          if (result.status === 'fulfilled') {
            serpAnalysis.push(...result.value);
          }
        });
      } catch (error) {
        console.error('SERP analysis failed:', error);
      }
      await delay(1000);

      // Phase 7: Competitor Intelligence
      onProgress({ progress: 85, status: 'Gathering competitive intelligence...' });
      let competitorInsights = [];
      try {
        const primaryKeywords = this.generatePrimaryKeywords(restaurantName, businessProfile);
        competitorInsights = await this.dataForSeoService.analyzeCompetitors(
          domain,
          primaryKeywords
        );
      } catch (error) {
        console.error('Competitor intelligence failed:', error);
      }
      await delay(1000);

      // Phase 8: Generate Enhanced Report
      onProgress({ progress: 95, status: 'Generating comprehensive intelligence report...' });
      const enhancedResult = this.generateEnhancedReport(
        domain,
        restaurantName,
        businessProfile,
        competitors,
        mobileExperience,
        performanceMetrics,
        keywordData,
        serpAnalysis,
        competitorInsights
      );
      await delay(1000);

      onProgress({ progress: 100, status: 'Analysis complete!' });
      return enhancedResult;

    } catch (error) {
      console.error('Advanced scan failed:', error);
      throw new Error('Advanced restaurant analysis failed');
    }
  }

  private generateEnhancedReport(
    domain: string,
    restaurantName: string,
    businessProfile: any,
    competitors: any[],
    mobileExperience: any,
    performanceMetrics: any,
    keywordData: any[],
    serpAnalysis: any[],
    competitorInsights: any[]
  ): EnhancedScanResult {
    // Calculate enhanced scores
    const businessScore = this.calculateBusinessScore(businessProfile);
    const competitorScore = this.calculateCompetitorScore(competitors, businessProfile);
    const mobileScore = mobileExperience.score;
    const performanceScore = performanceMetrics.performance || 70;
    const seoScore = performanceMetrics.seo || 75;
    const accessibilityScore = performanceMetrics.accessibility || 80;

    // Enhanced SEO scoring based on keyword data
    const enhancedSeoScore = this.calculateEnhancedSeoScore(
      seoScore,
      keywordData,
      serpAnalysis
    );

    const overallScore = Math.round(
      (businessScore + competitorScore + mobileScore + performanceScore + enhancedSeoScore) / 5
    );

    // Generate enhanced issues and recommendations
    const issues = this.generateEnhancedIssues(
      businessProfile,
      competitors,
      mobileExperience,
      performanceMetrics,
      keywordData,
      serpAnalysis
    );
    const recommendations = this.generateEnhancedRecommendations(issues, keywordData);

    // Process keyword analysis
    const keywordAnalysis = {
      targetKeywords: keywordData.slice(0, 10),
      rankingPositions: serpAnalysis.map(s => ({
        keyword: s.keyword,
        position: s.currentPosition,
        difficulty: s.difficulty
      })),
      searchVolumes: keywordData.reduce((acc, k) => {
        acc[k.keyword] = k.searchVolume;
        return acc;
      }, {} as { [key: string]: number }),
      opportunities: this.generateKeywordOpportunities(keywordData, serpAnalysis)
    };

    // Process competitor intelligence
    const competitorIntelligence = {
      organicCompetitors: competitorInsights.slice(0, 5),
      keywordGaps: this.identifyKeywordGaps(keywordData, serpAnalysis),
      trafficEstimates: competitorInsights.map(c => ({
        domain: c.domain,
        organicTraffic: c.organicTraffic,
        organicKeywords: c.organicKeywords
      }))
    };

    // Extract SERP features
    const serpFeatures = this.extractSerpFeatures(serpAnalysis);

    // Calculate domain authority estimate
    const domainAuthority = this.estimateDomainAuthority(
      performanceScore,
      enhancedSeoScore,
      competitorInsights
    );

    return {
      domain,
      restaurantName,
      overallScore,
      performance: performanceScore,
      seo: enhancedSeoScore,
      mobile: mobileScore,
      userExperience: accessibilityScore,
      issues,
      recommendations,
      keywords: keywordData.slice(0, 6).map(k => k.keyword),
      competitors: competitors.map(comp => ({
        name: comp.name.replace(/[\x00-\x1f\x7f-\x9f"'\\]/g, '').replace(/\s+/g, ' ').trim(),
        domain: `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        performance: comp.rating * 20,
        seo: comp.rating * 18,
        mobile: comp.rating * 19,
        accessibility: comp.rating * 17,
        overallScore: Math.round(comp.rating * 18.5),
        isYou: false
      })),
      scanDate: new Date().toISOString(),
      businessProfile,
      mobileExperience,
      keywordAnalysis,
      competitorIntelligence,
      serpFeatures,
      domainAuthority
    };
  }

  private calculateEnhancedSeoScore(
    baseSeoScore: number,
    keywordData: any[],
    serpAnalysis: any[]
  ): number {
    let enhancedScore = baseSeoScore;

    // Boost for high-volume keywords
    const highVolumeKeywords = keywordData.filter(k => k.searchVolume > 1000);
    enhancedScore += highVolumeKeywords.length * 2;

    // Boost for current rankings
    const rankedKeywords = serpAnalysis.filter(s => s.currentPosition && s.currentPosition <= 20);
    enhancedScore += rankedKeywords.length * 3;

    // Penalty for no rankings
    if (serpAnalysis.length > 0 && rankedKeywords.length === 0) {
      enhancedScore -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(enhancedScore)));
  }

  private generateEnhancedIssues(
    businessProfile: any,
    competitors: any[],
    mobileExperience: any,
    performanceMetrics: any,
    keywordData: any[],
    serpAnalysis: any[]
  ): any[] {
    const issues = [];

    // Existing issues from original scanner
    if (businessProfile.rating < 4.0) {
      issues.push({
        type: 'reputation',
        severity: 'high',
        title: 'Low Google Rating',
        description: `Your ${businessProfile.rating}/5 rating is below the recommended 4.0+ for restaurants.`,
        impact: 'high',
        effort: 'high'
      });
    }

    // SEO keyword issues
    if (keywordData.length === 0) {
      issues.push({
        type: 'seo',
        severity: 'high',
        title: 'No Keyword Strategy',
        description: 'Missing keyword optimization strategy for restaurant visibility.',
        impact: 'high',
        effort: 'medium'
      });
    }

    // SERP ranking issues
    const unrankedKeywords = serpAnalysis.filter(s => !s.currentPosition);
    if (unrankedKeywords.length > 0) {
      issues.push({
        type: 'seo',
        severity: 'medium',
        title: 'Missing Search Rankings',
        description: `Not ranking for ${unrankedKeywords.length} important keywords.`,
        impact: 'medium',
        effort: 'medium'
      });
    }

    // Performance issues
    if (performanceMetrics.performance < 70) {
      issues.push({
        type: 'performance',
        severity: 'high',
        title: 'Poor Website Performance',
        description: `Performance score is ${performanceMetrics.performance}/100.`,
        impact: 'high',
        effort: 'medium'
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
        effort: 'medium'
      });
    });

    return issues;
  }

  private generateEnhancedRecommendations(issues: any[], keywordData: any[]): any[] {
    const recommendations = [];

    // Keyword-specific recommendations
    if (keywordData.length > 0) {
      const highVolumeKeywords = keywordData.filter(k => k.searchVolume > 1000);
      
      if (highVolumeKeywords.length > 0) {
        recommendations.push({
          title: 'Target High-Volume Keywords',
          description: `Focus on optimizing for keywords with 1000+ monthly searches: ${highVolumeKeywords.slice(0, 3).map(k => k.keyword).join(', ')}`,
          impact: 'high',
          effort: 'medium',
          category: 'seo'
        });
      }

      const localKeywords = keywordData.filter(k => k.keyword.includes('near me'));
      if (localKeywords.length > 0) {
        recommendations.push({
          title: 'Optimize for Local Search',
          description: 'Enhance Google Business Profile and local SEO for "near me" searches',
          impact: 'high',
          effort: 'low',
          category: 'local'
        });
      }
    }

    // Standard recommendations based on issues
    issues.forEach(issue => {
      switch (issue.type) {
        case 'reputation':
          recommendations.push({
            title: 'Improve Customer Satisfaction',
            description: 'Focus on service quality and address negative feedback promptly',
            impact: 'high',
            effort: 'high',
            category: 'reputation'
          });
          break;
        case 'seo':
          recommendations.push({
            title: 'Develop SEO Strategy',
            description: 'Create content targeting high-value restaurant keywords',
            impact: 'high',
            effort: 'medium',
            category: 'seo'
          });
          break;
        case 'performance':
          recommendations.push({
            title: 'Optimize Website Speed',
            description: 'Improve loading times with image optimization and caching',
            impact: 'high',
            effort: 'medium',
            category: 'performance'
          });
          break;
      }
    });

    return recommendations;
  }

  private generateKeywordOpportunities(keywordData: any[], serpAnalysis: any[]): string[] {
    const opportunities = [];

    // High-volume, low-competition opportunities
    const easyWins = keywordData.filter(k => k.searchVolume > 500 && k.difficulty < 40);
    if (easyWins.length > 0) {
      opportunities.push(`Target ${easyWins.length} low-competition keywords for quick wins`);
    }

    // Local search opportunities
    const localKeywords = keywordData.filter(k => k.intent === 'local');
    if (localKeywords.length > 0) {
      opportunities.push(`Optimize for ${localKeywords.length} local search opportunities`);
    }

    // Ranking improvement opportunities
    const improvableRankings = serpAnalysis.filter(s => s.currentPosition && s.currentPosition > 10);
    if (improvableRankings.length > 0) {
      opportunities.push(`Improve ${improvableRankings.length} keywords from page 2+ to page 1`);
    }

    return opportunities;
  }

  private identifyKeywordGaps(keywordData: any[], serpAnalysis: any[]): string[] {
    const gaps = [];
    
    // Keywords with search volume but no rankings
    const rankedKeywords = new Set(serpAnalysis.map(s => s.keyword));
    const unrankedHighVolume = keywordData.filter(k => 
      k.searchVolume > 500 && !rankedKeywords.has(k.keyword)
    );

    return unrankedHighVolume.slice(0, 5).map(k => k.keyword);
  }

  private extractSerpFeatures(serpAnalysis: any[]): string[] {
    const features = new Set<string>();
    
    serpAnalysis.forEach(s => {
      s.opportunities?.forEach((opp: string) => {
        if (opp.includes('local')) features.add('Local Pack');
        if (opp.includes('featured')) features.add('Featured Snippets');
        if (opp.includes('image')) features.add('Image Pack');
      });
    });

    return Array.from(features);
  }

  private estimateDomainAuthority(
    performanceScore: number,
    seoScore: number,
    competitorInsights: any[]
  ): number {
    // Simplified domain authority calculation
    let authority = Math.round((performanceScore + seoScore) / 2);
    
    // Adjust based on competitor data
    if (competitorInsights.length > 0) {
      const avgCompetitorRank = competitorInsights.reduce((sum, c) => sum + c.domainRank, 0) / competitorInsights.length;
      if (avgCompetitorRank > 50) authority -= 10;
      if (avgCompetitorRank < 30) authority += 10;
    }

    return Math.max(1, Math.min(100, authority));
  }

  private generatePrimaryKeywords(restaurantName: string, businessProfile: any): string[] {
    return [
      restaurantName,
      `${restaurantName} menu`,
      `${restaurantName} near me`,
      `${restaurantName} delivery`,
      `${restaurantName} reviews`
    ];
  }

  private extractCuisineType(businessProfile: any): string {
    // Extract cuisine type from business profile if available
    return 'restaurant'; // Simplified for now
  }

  private calculateBusinessScore(businessProfile: any): number {
    // Existing business score calculation
    let score = 0;
    score += (businessProfile.rating / 5) * 40;
    if (businessProfile.totalReviews >= 100) score += 30;
    else if (businessProfile.totalReviews >= 50) score += 20;
    else if (businessProfile.totalReviews >= 20) score += 10;
    
    return Math.round(score);
  }

  private calculateCompetitorScore(competitors: any[], businessProfile: any): number {
    // Existing competitor score calculation
    if (competitors.length === 0) return 50;
    
    const averageCompetitorRating = competitors.reduce((sum, comp) => sum + comp.rating, 0) / competitors.length;
    const strongerCompetitors = competitors.filter(comp => comp.isStronger).length;
    
    let score = 100;
    score -= strongerCompetitors * 20;
    
    if (businessProfile.rating < averageCompetitorRating) {
      score -= 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getFallbackPerformanceMetrics(): any {
    return {
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

  private getFallbackMobileExperience(): any {
    return {
      score: 70,
      loadTime: 3.0,
      isResponsive: true,
      touchFriendly: true,
      textReadable: true,
      navigationEasy: true,
      issues: ['Unable to analyze mobile experience'],
      recommendations: ['Check website accessibility and mobile optimization']
    };
  }
}