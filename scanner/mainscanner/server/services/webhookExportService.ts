import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface WebhookConfig {
  url: string;
  secret?: string;
  timeout?: number;
  retryAttempts?: number;
  enableFileBackup?: boolean;
}

export class WebhookExportService {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      enableFileBackup: false,
      ...config
    };
  }

  /**
   * Prepare complete export data with all scan information
   */
  async prepareCompleteExport(scanResult: any): Promise<any> {
    const timestamp = new Date().toISOString();
    const scanId = `scan_${Date.now()}`;

    return {
      event: 'scan_completed_full_export',
      version: '2.0.0',
      timestamp,
      scanId,
      scanDuration: scanResult.scanDuration || 0,
      
      // Restaurant core data
      restaurant: {
        name: scanResult.restaurantName,
        domain: scanResult.domain,
        placeId: scanResult.placeId,
        location: this.extractLocationData(scanResult.businessProfile),
        categories: scanResult.businessProfile?.categories || [],
        priceLevel: scanResult.businessProfile?.priceLevel || null,
        cuisine: this.detectCuisine(scanResult.businessProfile),
        restaurantType: this.detectRestaurantType(scanResult.restaurantName, scanResult.businessProfile)
      },
      
      // All scores and metrics
      scores: {
        overall: scanResult.overallScore || 0,
        seo: scanResult.seo || 0,
        performance: scanResult.performance || 0,
        mobile: scanResult.mobile || 0,
        userExperience: scanResult.userExperience || 0,
        accessibility: scanResult.accessibility || 0,
        bestPractices: scanResult.bestPractices || 0,
        local: this.calculateLocalScore(scanResult),
        social: this.calculateSocialScore(scanResult.socialMediaLinks),
        reviews: this.calculateReviewsScore(scanResult.reviewsAnalysis),
        website: scanResult.performance || 0,
        domainAuthority: scanResult.domainAuthority || 0
      },
      
      // Complete business profile
      businessProfile: {
        ...scanResult.businessProfile,
        responseRate: scanResult.businessProfile?.responseRate || this.estimateResponseRate(scanResult.businessProfile),
        averageResponseTime: scanResult.businessProfile?.averageResponseTime || this.estimateResponseTime(scanResult.businessProfile)
      },
      
      // Profile analysis
      profileAnalysis: scanResult.profileAnalysis || this.generateProfileAnalysis(scanResult.businessProfile),
      
      // All keywords data
      keywords: {
        trackedKeywords: scanResult.keywords || [],
        competitiveOpportunityKeywords: scanResult.competitiveOpportunityKeywords || [],
        enhancedKeywordDiscovery: scanResult.enhancedKeywordDiscovery || [],
        domainRankedKeywords: scanResult.domainRankedKeywords || [],
        competitiveGaps: scanResult.competitiveGaps || [],
        keywordAnalysis: scanResult.keywordAnalysis || null
      },
      
      // Local pack and competitor data
      localCompetitorData: scanResult.localCompetitorData || [],
      localPackReport: scanResult.localPackReport || null,
      
      // Complete review analysis
      reviewsAnalysis: {
        ...scanResult.reviewsAnalysis,
        overallScore: this.calculateReviewsScore(scanResult.reviewsAnalysis),
        totalReviews: scanResult.businessProfile?.totalReviews || 0,
        averageRating: scanResult.businessProfile?.rating || 0
      },
      
      // Competitor analysis
      competitors: scanResult.competitors || [],
      competitorIntelligence: scanResult.competitorIntelligence || {},
      
      // SERP features and analysis
      serpFeatures: scanResult.serpFeatures || {},
      serpAnalysis: scanResult.serpAnalysis || [],
      
      // Website technical data
      seoAnalysis: scanResult.seoAnalysis || {},
      mobileExperience: scanResult.mobileExperience || {},
      performanceMetrics: scanResult.metrics ? {
        performance: scanResult.performance,
        accessibility: scanResult.userExperience,
        bestPractices: scanResult.bestPractices || 65,
        seo: scanResult.seo,
        coreWebVitals: {
          fcp: scanResult.metrics.fcp || 0,
          lcp: scanResult.metrics.lcp || 0,
          cls: scanResult.metrics.cls || 0,
          fid: scanResult.metrics.fid || 0,
          ttfb: scanResult.metrics.ttfb || 0,
          tti: scanResult.metrics.tti || 0,
          tbt: scanResult.metrics.tbt || 0,
          si: scanResult.metrics.si || 0
        }
      } : null,
      
      // Social media data
      socialMediaLinks: scanResult.socialMediaLinks || {},
      socialMediaAnalysis: this.analyzeSocialMedia(scanResult.socialMediaLinks),
      
      // Issues and recommendations
      issues: scanResult.issues || [],
      recommendations: scanResult.recommendations || [],
      
      // Metadata
      metadata: {
        scanId,
        scanDate: timestamp,
        scanDuration: scanResult.scanDuration || 0,
        scanType: 'professional',
        dataCompleteness: this.calculateDataCompleteness(scanResult),
        apiVersions: {
          scanner: '2.0.0',
          dataforseo: '3.0',
          googlePlaces: 'v1',
          apify: '2.0',
          openai: 'gpt-4o'
        },
        servicesUsed: this.getServicesUsed(scanResult),
        errors: [],
        warnings: this.collectWarnings(scanResult)
      }
    };
  }

  /**
   * Send webhook with retry logic
   */
  async sendWebhook(scanResult: any): Promise<boolean> {
    try {
      const payload = await this.prepareCompleteExport(scanResult);
      
      for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
        try {
          console.log(`🪝 Sending webhook (attempt ${attempt}/${this.config.retryAttempts}) to:`, this.config.url);
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Boostly-Timestamp': Date.now().toString(),
            'User-Agent': 'Boostly-Scanner/2.0.0'
          };
          
          // Add HMAC signature if secret provided
          if (this.config.secret) {
            headers['X-Boostly-Signature'] = this.generateHMAC(payload, this.config.secret);
          }
          
          // Try POST first, fallback to GET if 404 (wrong method)
          let response: Response;
          
          // First attempt: POST request
          response = await fetch(this.config.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(this.config.timeout!)
          });
          
          // If POST returns 404 (wrong method), try GET
          if (response.status === 404) {
            console.log('POST returned 404, trying GET method...');
            const encodedData = encodeURIComponent(JSON.stringify(payload));
            const urlWithData = `${this.config.url}?data=${encodedData}`;
            
            response = await fetch(urlWithData, {
              method: 'GET',
              headers: {
                'User-Agent': 'Boostly-Scanner/2.0.0',
                'X-Boostly-Timestamp': Date.now().toString()
              },
              signal: AbortSignal.timeout(this.config.timeout!)
            });
          }
          
          if (response.ok) {
            console.log('✅ Webhook sent successfully:', {
              status: response.status,
              url: this.config.url,
              dataSize: JSON.stringify(payload).length
            });
            return true;
          } else {
            console.error('❌ Webhook failed:', {
              status: response.status,
              statusText: response.statusText,
              url: this.config.url
            });
          }
          
        } catch (error) {
          console.error(`Webhook attempt ${attempt} failed:`, error);
          
          // Exponential backoff
          if (attempt < this.config.retryAttempts!) {
            const delay = 1000 * Math.pow(2, attempt);
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // All attempts failed - backup to file if enabled
      if (this.config.enableFileBackup) {
        await this.saveFailedWebhook(payload);
      }
      
      return false;
      
    } catch (error) {
      console.error('Fatal webhook error:', error);
      return false;
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateHMAC(payload: any, secret: string): string {
    const body = JSON.stringify(payload);
    return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  /**
   * Save failed webhook to file for manual processing
   */
  private async saveFailedWebhook(payload: any): Promise<void> {
    try {
      const exportDir = path.join(process.cwd(), 'exports');
      await fs.mkdir(exportDir, { recursive: true });
      
      const filename = `failed_webhook_${Date.now()}.json`;
      const filepath = path.join(exportDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(payload, null, 2));
      console.log(`💾 Webhook data saved to file: ${filepath}`);
    } catch (error) {
      console.error('Failed to save webhook backup:', error);
    }
  }

  // Helper methods for data processing
  private extractLocationData(businessProfile: any) {
    if (!businessProfile?.address) return null;
    
    const address = businessProfile.address;
    const parts = address.split(',').map((p: string) => p.trim());
    
    return {
      address,
      city: parts[parts.length - 3] || '',
      state: parts[parts.length - 2]?.split(' ')[0] || '',
      country: 'United States',
      latitude: businessProfile.geometry?.location?.lat || null,
      longitude: businessProfile.geometry?.location?.lng || null
    };
  }

  private detectCuisine(businessProfile: any): string {
    const categories = businessProfile?.categories || [];
    const name = businessProfile?.name || '';
    
    // Simple cuisine detection logic
    if (categories.some((c: string) => c.toLowerCase().includes('pizza'))) return 'Pizza';
    if (categories.some((c: string) => c.toLowerCase().includes('italian'))) return 'Italian';
    if (categories.some((c: string) => c.toLowerCase().includes('chinese'))) return 'Chinese';
    if (categories.some((c: string) => c.toLowerCase().includes('mexican'))) return 'Mexican';
    if (name.toLowerCase().includes('pizza')) return 'Pizza';
    
    return 'American';
  }

  private detectRestaurantType(name: string, businessProfile: any): string {
    const fastCasualKeywords = ['pizza', 'burger', 'sandwich', 'sub', 'taco', 'chicken'];
    const nameLower = name.toLowerCase();
    
    if (fastCasualKeywords.some(keyword => nameLower.includes(keyword))) {
      return 'QSR'; // Quick Service Restaurant
    }
    
    return 'FSR'; // Full Service Restaurant
  }

  private calculateLocalScore(scanResult: any): number {
    const rating = scanResult.businessProfile?.rating || 0;
    const reviews = scanResult.businessProfile?.totalReviews || 0;
    const isVerified = scanResult.businessProfile?.isVerified || false;
    
    let score = rating * 15; // Base score from rating
    if (reviews > 100) score += 20;
    else if (reviews > 50) score += 10;
    if (isVerified) score += 15;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private calculateSocialScore(socialMediaLinks: any): number {
    if (!socialMediaLinks) return 0;
    
    const platforms = Object.values(socialMediaLinks).filter(Boolean);
    return Math.min(100, platforms.length * 20);
  }

  private calculateReviewsScore(reviewsAnalysis: any): number {
    if (!reviewsAnalysis) return 0;
    
    const sentiment = reviewsAnalysis.sentiment?.positive || 0;
    const rating = reviewsAnalysis.averageRating || 0;
    
    return Math.round((sentiment * 0.6) + (rating * 15));
  }

  private estimateResponseRate(businessProfile: any): number {
    let rate = 50;
    if (businessProfile?.isVerified) rate += 20;
    if (businessProfile?.rating >= 4.5) rate += 15;
    return Math.min(100, rate);
  }

  private estimateResponseTime(businessProfile: any): string {
    if (businessProfile?.rating >= 4.5) return '1 day';
    if (businessProfile?.rating >= 4.0) return '2 days';
    return '3 days';
  }

  private generateProfileAnalysis(businessProfile: any) {
    // Generate basic profile analysis if not provided
    return {
      completeness: { score: 75, missingElements: [] },
      optimization: { score: 70, issues: [] },
      competitiveness: 65,
      recommendations: [],
      strengths: [],
      weaknesses: []
    };
  }

  private analyzeSocialMedia(socialMediaLinks: any) {
    if (!socialMediaLinks) return { activePlatforms: 0, missingPlatforms: [] };
    
    const activePlatforms = Object.values(socialMediaLinks).filter(Boolean).length;
    const allPlatforms = ['facebook', 'instagram', 'twitter', 'youtube', 'tiktok'];
    const missingPlatforms = allPlatforms.filter(platform => !socialMediaLinks[platform]);
    
    return {
      activePlatforms,
      missingPlatforms,
      recommendations: missingPlatforms.map(platform => `Add ${platform} presence`)
    };
  }

  private calculateDataCompleteness(scanResult: any): number {
    const fields = [
      'businessProfile', 'keywords', 'reviewsAnalysis', 'competitors',
      'seoAnalysis', 'socialMediaLinks', 'issues', 'recommendations'
    ];
    
    const completedFields = fields.filter(field => scanResult[field]).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  private getServicesUsed(scanResult: any): string[] {
    const services = ['GooglePlacesAPI'];
    
    if (scanResult.keywords?.length > 0) services.push('DataForSEO');
    if (scanResult.reviewsAnalysis?.googleReviews) services.push('ApifyReviews');
    if (scanResult.reviewsAnalysis?.customerMoodAnalysis) services.push('OpenAIAnalysis');
    if (scanResult.localCompetitorData?.length > 0) services.push('LocalCompetitorService');
    
    return services;
  }

  private collectWarnings(scanResult: any): string[] {
    const warnings = [];
    
    if (!scanResult.socialMediaLinks?.facebook) warnings.push('Facebook link not found');
    if (!scanResult.businessProfile?.website) warnings.push('Business website not available');
    if ((scanResult.keywords || []).length === 0) warnings.push('Keyword data incomplete');
    
    return warnings;
  }
}