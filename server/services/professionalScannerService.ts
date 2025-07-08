import { GoogleBusinessService } from './googleBusinessService';
import { LighthouseService } from './lighthouseService';
import { SerpApiService } from './serpApiService';
import { ContentAnalysisService } from './contentAnalysisService';
import { CompetitorService } from './competitorService';
import { ZembraTechReviewsService } from './zembraTechReviewsService';
import { ScanResult } from '../../../shared/schema';

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

export interface KeywordRanking {
  keyword: string;
  position: number | null;
  searchVolume: number;
  difficulty: number;
  url: string | null;
  opportunity: string;
}

export interface CompetitorAnalysis {
  name: string;
  domain: string;
  distance: number;
  rating: number;
  totalReviews: number;
  performanceScore: number;
  seoScore: number;
  threatLevel: 'high' | 'medium' | 'low';
  advantages: string[];
}

export interface ProfessionalScanResult extends ScanResult {
  keywordRankings: KeywordRanking[];
  competitorAnalysis: CompetitorAnalysis[];
  actionPlan: {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    timeframe: string;
  }[];
  metaTags: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };
  socialLinks: {
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    yelp: string | null;
  };
}

export class ProfessionalScannerService {
  private googleBusinessService: GoogleBusinessService;
  private lighthouseService: LighthouseService;
  private serpApiService: SerpApiService;
  private contentAnalysisService: ContentAnalysisService;
  private competitorService: CompetitorService;
  private zembraReviewsService: ZembraTechReviewsService | null = null;

  constructor(
    googleApiKey: string,
    serpApiKey: string,
    pageSpeedApiKey: string,
    zembraApiKey?: string
  ) {
    this.googleBusinessService = new GoogleBusinessService(googleApiKey);
    this.lighthouseService = new LighthouseService();
    this.serpApiService = new SerpApiService(serpApiKey);
    this.contentAnalysisService = new ContentAnalysisService();
    this.competitorService = new CompetitorService(googleApiKey);
    
    if (zembraApiKey) {
      this.zembraReviewsService = new ZembraTechReviewsService(zembraApiKey);
    }
  }

  async scanRestaurantProfessional(
    domain: string,
    restaurantName: string,
    placeId: string,
    latitude: number,
    longitude: number,
    onProgress: (progress: ScanProgress) => void
  ): Promise<ProfessionalScanResult> {
    
    // Step 1: Get business profile
    onProgress({ progress: 10, status: 'Analyzing Google Business Profile...' });
    const businessProfile = await this.googleBusinessService.getBusinessProfile(placeId);
    
    // Step 2: Run Lighthouse audit
    onProgress({ progress: 25, status: 'Running comprehensive website audit...' });
    const lighthouseMetrics = await this.lighthouseService.runLighthouseAudit(`https://${domain}`, true);
    
    // Step 3: Analyze content and meta tags
    onProgress({ progress: 40, status: 'Analyzing meta tags and content...' });
    const contentAnalysis = await this.contentAnalysisService.analyzeContent(domain);
    const metaTags = await this.extractMetaTags(domain);
    const socialLinks = await this.extractSocialLinks(domain);
    
    // Step 3.5: Stream real-time reviews if available
    if (this.zembraReviewsService) {
      try {
        const reviews = await this.zembraReviewsService.getRestaurantReviews(restaurantName);
        if (reviews.recentReviews && reviews.recentReviews.length > 0) {
          for (const review of reviews.recentReviews.slice(0, 3)) {
            onProgress({ 
              progress: 42, 
              status: 'Analyzing customer reviews...',
              review: {
                author: review.author,
                rating: review.rating,
                text: review.text,
                platform: review.platform,
                sentiment: review.sentiment
              }
            });
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      } catch (error) {
        console.log('Zembratech reviews service unavailable, continuing without reviews');
      }
    }
    
    // Step 4: Keyword ranking analysis
    onProgress({ progress: 55, status: 'Analyzing keyword rankings...' });
    const keywordRankings = await this.analyzeKeywordRankings(domain, restaurantName, businessProfile);
    
    // Step 5: Competitor analysis
    onProgress({ progress: 70, status: 'Analyzing competitors...' });
    const competitorAnalysis = await this.analyzeCompetitors(restaurantName, latitude, longitude);
    
    // Step 6: Generate action plan
    onProgress({ progress: 85, status: 'Generating action plan...' });
    const actionPlan = this.generateActionPlan(lighthouseMetrics, keywordRankings, competitorAnalysis, businessProfile);
    
    // Step 7: Final report
    onProgress({ progress: 100, status: 'Analysis complete!' });
    
    return this.generateProfessionalReport({
      domain,
      restaurantName,
      businessProfile,
      lighthouseMetrics,
      contentAnalysis,
      keywordRankings,
      competitorAnalysis,
      actionPlan,
      metaTags,
      socialLinks
    });
  }

  private async analyzeKeywordRankings(
    domain: string,
    restaurantName: string,
    businessProfile: any
  ): Promise<KeywordRanking[]> {
    const keywords = this.generateRestaurantKeywords(restaurantName, businessProfile);
    const rankings: KeywordRanking[] = [];
    
    for (const keyword of keywords) {
      try {
        const serpResult = await this.serpApiService.searchGoogle(keyword);
        const position = this.findDomainPosition(serpResult, domain);
        
        rankings.push({
          keyword,
          position,
          searchVolume: this.estimateSearchVolume(keyword),
          difficulty: this.estimateKeywordDifficulty(keyword),
          url: position ? `https://${domain}` : null,
          opportunity: this.generateKeywordOpportunity(keyword, position)
        });
      } catch (error) {
        console.error(`Error analyzing keyword ${keyword}:`, error);
        rankings.push({
          keyword,
          position: null,
          searchVolume: this.estimateSearchVolume(keyword),
          difficulty: this.estimateKeywordDifficulty(keyword),
          url: null,
          opportunity: 'Keyword analysis unavailable'
        });
      }
    }
    
    return rankings;
  }

  private async analyzeCompetitors(
    restaurantName: string,
    latitude: number,
    longitude: number
  ): Promise<CompetitorAnalysis[]> {
    const competitors = await this.googleBusinessService.findCompetitors(
      restaurantName,
      latitude,
      longitude,
      5
    );
    
    const analysis: CompetitorAnalysis[] = [];
    
    for (const competitor of competitors) {
      try {
        const domain = this.extractDomainFromName(competitor.name);
        let performanceScore = 0;
        let seoScore = 0;
        
        try {
          const metrics = await this.lighthouseService.runLighthouseAudit(`https://${domain}`, true);
          performanceScore = metrics.performance;
          seoScore = metrics.seo;
        } catch (error) {
          // Use fallback scores based on rating
          performanceScore = Math.round(competitor.rating * 20);
          seoScore = Math.round(competitor.rating * 20);
        }
        
        analysis.push({
          name: competitor.name,
          domain,
          distance: competitor.distance,
          rating: competitor.rating,
          totalReviews: competitor.totalReviews,
          performanceScore,
          seoScore,
          threatLevel: this.calculateThreatLevel(competitor, performanceScore, seoScore),
          advantages: this.identifyCompetitorAdvantages(competitor, performanceScore, seoScore)
        });
      } catch (error) {
        console.error(`Error analyzing competitor ${competitor.name}:`, error);
      }
    }
    
    return analysis.slice(0, 5);
  }

  private async extractMetaTags(domain: string): Promise<any> {
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium'
      });
      
      const page = await browser.newPage();
      await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
      
      const metaTags = await page.evaluate(() => {
        const getMetaContent = (selector: string) => {
          const element = document.querySelector(selector);
          return element ? element.getAttribute('content') || '' : '';
        };
        
        return {
          title: document.title || '',
          description: getMetaContent('meta[name="description"]'),
          keywords: getMetaContent('meta[name="keywords"]'),
          ogTitle: getMetaContent('meta[property="og:title"]'),
          ogDescription: getMetaContent('meta[property="og:description"]'),
          ogImage: getMetaContent('meta[property="og:image"]')
        };
      });
      
      await browser.close();
      return metaTags;
    } catch (error) {
      console.error('Error extracting meta tags:', error);
      return {
        title: '',
        description: '',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: ''
      };
    }
  }

  private async extractSocialLinks(domain: string): Promise<any> {
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium'
      });
      
      const page = await browser.newPage();
      await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
      
      const socialLinks = await page.evaluate(() => {
        const findSocialLink = (platform: string) => {
          const selectors = [
            `a[href*="${platform}.com"]`,
            `a[href*="${platform}"]`,
            `[class*="${platform}"]`,
            `[id*="${platform}"]`
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.getAttribute('href')) {
              return element.getAttribute('href');
            }
          }
          return null;
        };
        
        return {
          facebook: findSocialLink('facebook'),
          instagram: findSocialLink('instagram'),
          twitter: findSocialLink('twitter'),
          yelp: findSocialLink('yelp')
        };
      });
      
      await browser.close();
      return socialLinks;
    } catch (error) {
      console.error('Error extracting social links:', error);
      return {
        facebook: null,
        instagram: null,
        twitter: null,
        yelp: null
      };
    }
  }

  private generateRestaurantKeywords(restaurantName: string, businessProfile: any): string[] {
    const cuisineType = this.extractCuisineType(businessProfile);
    const city = this.extractCity(businessProfile);
    
    return [
      `${restaurantName}`,
      `${restaurantName} restaurant`,
      `${restaurantName} ${city}`,
      `${cuisineType} restaurant ${city}`,
      `${cuisineType} food ${city}`,
      `best ${cuisineType} restaurant`,
      `${restaurantName} menu`,
      `${restaurantName} delivery`,
      `${restaurantName} reviews`,
      `${city} restaurants`
    ];
  }

  private generateActionPlan(
    lighthouseMetrics: any,
    keywordRankings: KeywordRanking[],
    competitors: CompetitorAnalysis[],
    businessProfile: any
  ): any[] {
    const actions = [];
    
    // Performance issues
    if (lighthouseMetrics.performance < 70) {
      actions.push({
        priority: 'high',
        title: 'Improve Website Performance',
        description: `Your website loads slowly (${lighthouseMetrics.performance}/100). This hurts user experience and search rankings.`,
        impact: 'High - Faster sites get more customers',
        timeframe: '2-4 weeks'
      });
    }
    
    // SEO issues
    if (lighthouseMetrics.seo < 80) {
      actions.push({
        priority: 'high',
        title: 'Fix SEO Issues',
        description: `Your SEO score is ${lighthouseMetrics.seo}/100. Missing meta descriptions, titles, or structured data.`,
        impact: 'High - Better search visibility',
        timeframe: '1-2 weeks'
      });
    }
    
    // Keyword opportunities
    const poorRankings = keywordRankings.filter(k => !k.position || k.position > 10);
    if (poorRankings.length > 5) {
      actions.push({
        priority: 'medium',
        title: 'Improve Keyword Rankings',
        description: `You're not ranking well for ${poorRankings.length} important keywords.`,
        impact: 'Medium - More organic traffic',
        timeframe: '3-6 months'
      });
    }
    
    // Competitor threats
    const strongCompetitors = competitors.filter(c => c.threatLevel === 'high');
    if (strongCompetitors.length > 0) {
      actions.push({
        priority: 'medium',
        title: 'Compete with Top Performers',
        description: `${strongCompetitors.length} nearby competitors are outperforming you online.`,
        impact: 'Medium - Protect market share',
        timeframe: '2-3 months'
      });
    }
    
    // Review response
    if (businessProfile.responseRate < 50) {
      actions.push({
        priority: 'low',
        title: 'Respond to More Reviews',
        description: `You're only responding to ${businessProfile.responseRate}% of reviews.`,
        impact: 'Low - Better customer relations',
        timeframe: '1 week'
      });
    }
    
    return actions.slice(0, 5);
  }

  private generateProfessionalReport(data: any): ProfessionalScanResult {
    const overallScore = Math.round(
      (data.lighthouseMetrics.performance + 
       data.lighthouseMetrics.seo + 
       data.lighthouseMetrics.accessibility + 
       data.lighthouseMetrics.bestPractices) / 4
    );
    
    return {
      domain: data.domain,
      restaurantName: data.restaurantName,
      overallScore,
      performance: data.lighthouseMetrics.performance,
      seo: data.lighthouseMetrics.seo,
      mobile: data.lighthouseMetrics.accessibility,
      userExperience: data.lighthouseMetrics.bestPractices,
      issues: this.generateIssues(data.lighthouseMetrics, data.keywordRankings),
      recommendations: this.generateRecommendations(data.actionPlan),
      keywords: data.keywordRankings.map((k: KeywordRanking) => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
        position: k.position,
        intent: this.classifySearchIntent(k.keyword)
      })),
      competitors: data.competitorAnalysis.map((c: CompetitorAnalysis) => ({
        name: c.name,
        domain: c.domain,
        performance: c.performanceScore,
        seo: c.seoScore,
        accessibility: c.performanceScore,
        bestPractices: c.seoScore,
        overallScore: Math.round((c.performanceScore + c.seoScore) / 2),
        isYou: false
      })),
      screenshot: data.lighthouseMetrics.screenshot || null,
      seoAnalysis: {
        title: data.metaTags.title,
        metaDescription: data.metaTags.description,
        h1Tags: data.contentAnalysis.h1Tags,
        imageCount: data.contentAnalysis.imageCount,
        internalLinks: data.contentAnalysis.internalLinks,
        externalLinks: data.contentAnalysis.externalLinks,
        schemaMarkup: data.contentAnalysis.hasSchemaMarkup
      },
      metrics: data.lighthouseMetrics.coreWebVitals,
      keywordRankings: data.keywordRankings,
      competitorAnalysis: data.competitorAnalysis,
      actionPlan: data.actionPlan,
      metaTags: data.metaTags,
      socialLinks: data.socialLinks,
      domainAuthority: this.estimateDomainAuthority(data.lighthouseMetrics, data.keywordRankings),
      backlinks: 0,
      organicTraffic: 0
    };
  }

  // Helper methods
  private findDomainPosition(serpResult: any, domain: string): number | null {
    if (!serpResult.organic_results) return null;
    
    for (let i = 0; i < serpResult.organic_results.length; i++) {
      const result = serpResult.organic_results[i];
      if (result.link && result.link.includes(domain)) {
        return i + 1;
      }
    }
    return null;
  }

  private estimateSearchVolume(keyword: string): number {
    const baseVolume = 1000;
    if (keyword.includes('restaurant')) return baseVolume * 2;
    if (keyword.includes('menu')) return baseVolume * 1.5;
    if (keyword.includes('delivery')) return baseVolume * 1.3;
    return baseVolume;
  }

  private estimateKeywordDifficulty(keyword: string): number {
    if (keyword.includes('best')) return 80;
    if (keyword.includes('restaurant')) return 60;
    if (keyword.includes('menu')) return 40;
    return 50;
  }

  private generateKeywordOpportunity(keyword: string, position: number | null): string {
    if (!position) return 'Not ranking - create content targeting this keyword';
    if (position > 10) return 'Page 2+ - optimize existing content';
    if (position > 3) return 'Page 1 - minor optimizations needed';
    return 'Top 3 - maintain current ranking';
  }

  private extractDomainFromName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  }

  private calculateThreatLevel(competitor: any, performanceScore: number, seoScore: number): 'high' | 'medium' | 'low' {
    const avgScore = (performanceScore + seoScore) / 2;
    if (competitor.rating > 4.5 && avgScore > 80) return 'high';
    if (competitor.rating > 4.0 && avgScore > 60) return 'medium';
    return 'low';
  }

  private identifyCompetitorAdvantages(competitor: any, performanceScore: number, seoScore: number): string[] {
    const advantages = [];
    if (competitor.rating > 4.5) advantages.push('Higher customer rating');
    if (competitor.totalReviews > 500) advantages.push('More customer reviews');
    if (performanceScore > 80) advantages.push('Better website performance');
    if (seoScore > 80) advantages.push('Better SEO optimization');
    return advantages;
  }

  private extractCuisineType(businessProfile: any): string {
    // Extract from business profile or default to 'restaurant'
    return 'restaurant';
  }

  private extractCity(businessProfile: any): string {
    // Extract from business profile or default to 'local'
    return 'local';
  }

  private generateIssues(lighthouseMetrics: any, keywordRankings: KeywordRanking[]): any[] {
    const issues = [];
    
    if (lighthouseMetrics.performance < 70) {
      issues.push({
        type: 'performance',
        severity: 'high',
        title: 'Slow Website Performance',
        description: `Your website loads slowly (${lighthouseMetrics.performance}/100)`,
        impact: 'high',
        effort: 'medium'
      });
    }
    
    const poorRankings = keywordRankings.filter(k => !k.position || k.position > 10);
    if (poorRankings.length > 3) {
      issues.push({
        type: 'seo',
        severity: 'medium',
        title: 'Poor Keyword Rankings',
        description: `Not ranking well for ${poorRankings.length} important keywords`,
        impact: 'medium',
        effort: 'high'
      });
    }
    
    return issues;
  }

  private generateRecommendations(actionPlan: any[]): any[] {
    return actionPlan.map(action => ({
      title: action.title,
      description: action.description,
      impact: action.impact,
      effort: action.timeframe,
      category: action.priority
    }));
  }

  private classifySearchIntent(keyword: string): string {
    if (keyword.includes('menu') || keyword.includes('hours')) return 'informational';
    if (keyword.includes('delivery') || keyword.includes('order')) return 'transactional';
    return 'navigational';
  }

  private estimateDomainAuthority(lighthouseMetrics: any, keywordRankings: KeywordRanking[]): number {
    const avgRanking = keywordRankings.reduce((sum, k) => sum + (k.position || 50), 0) / keywordRankings.length;
    return Math.max(0, Math.min(100, 100 - avgRanking + lighthouseMetrics.seo));
  }
}