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

    // Build a clean, focused webhook payload with essential data
    const webhookPayload = {
      event: 'scan_completed',
      version: '2.0.0',
      timestamp,
      scanId,
      
      // Restaurant identification
      restaurant: {
        name: scanResult.restaurantName || 'Unknown',
        domain: scanResult.domain || '',
        placeId: scanResult.placeId || '',
        address: scanResult.businessProfile?.address || '',
        city: scanResult.businessProfile?.city || '',
        state: scanResult.businessProfile?.state || '',
        phone: scanResult.businessProfile?.phoneNumber || '',
        website: scanResult.businessProfile?.website || '',
        cuisine: this.detectCuisine(scanResult.businessProfile),
        priceLevel: scanResult.businessProfile?.priceLevel || null
      },
      
      // Core performance scores
      scores: {
        overall: scanResult.overallScore || 0,
        seo: scanResult.seo || 0,
        performance: scanResult.performance || 0,
        mobile: scanResult.mobile || 0,
        userExperience: scanResult.userExperience || 0,
        reviews: scanResult.reviewsAnalysis?.overallScore || 0,
        social: this.calculateSocialScore(scanResult.socialMediaLinks)
      },
      
      // Business metrics
      businessMetrics: {
        rating: scanResult.businessProfile?.rating || 0,
        totalReviews: scanResult.businessProfile?.reviewCount || 0,
        photoCount: scanResult.businessProfile?.photoCount || 0,
        isVerified: scanResult.businessProfile?.isVerified || false,
        responseRate: scanResult.businessProfile?.responseRate || 0,
        businessStatus: scanResult.businessProfile?.business_status || 'OPERATIONAL'
      },
      
      // Social media presence
      socialMedia: {
        facebook: scanResult.socialMediaLinks?.facebook || null,
        instagram: scanResult.socialMediaLinks?.instagram || null,
        twitter: scanResult.socialMediaLinks?.twitter || null,
        hasAny: !!(scanResult.socialMediaLinks?.facebook || scanResult.socialMediaLinks?.instagram)
      },
      
      // Review sentiment
      reviewAnalysis: {
        totalReviews: scanResult.reviewsAnalysis?.totalReviews || 0,
        averageRating: scanResult.reviewsAnalysis?.averageRating || 0,
        overallMood: scanResult.reviewsAnalysis?.customerMoodAnalysis?.overallMood || 'neutral',
        sentimentBreakdown: scanResult.reviewsAnalysis?.sentimentBreakdown || {},
        keyThemes: scanResult.reviewsAnalysis?.keyThemes || []
      },
      
      // SEO visibility
      seoVisibility: {
        rankedKeywords: scanResult.keywords?.length || 0,
        competitiveKeywords: scanResult.competitiveOpportunityKeywords?.length || 0,
        localPackVisibility: scanResult.localPackReport?.visibilityScore || 0,
        topRankingKeywords: (scanResult.keywords || [])
          .filter((k: any) => k.position && k.position <= 10)
          .slice(0, 5)
          .map((k: any) => ({
            keyword: k.keyword,
            position: k.position,
            searchVolume: k.searchVolume || 0
          })),
        // Three worst ranking keywords (highest positions or not ranking)
        worstRankingKeywords: this.getWorstRankingKeywords(
          scanResult.competitiveOpportunityKeywords || []
        ),
        // Keywords missing from top 3 (for your script)
        missingFromTop3: this.getMissingTop3Keywords(
          scanResult.competitiveOpportunityKeywords || [],
          scanResult.businessProfile?.city || '',
          this.detectCuisine(scanResult.businessProfile)
        ),
        notRankingTop3Count: (scanResult.competitiveOpportunityKeywords || [])
          .filter((k: any) => !k.position || k.position > 3).length
      },
      
      // Email script data - SIMPLE
      emailScript: {
        restaurantName: scanResult.restaurantName || scanResult.businessProfile?.name || 'your restaurant',
        totalScore: scanResult.overallScore || 0,
        notRankingKeywords: this.getNotRankingKeywords(scanResult.competitiveOpportunityKeywords || [])
      },
      
      // Top competitors
      competitors: (scanResult.localCompetitorData || [])
        .slice(0, 5)
        .map((c: any) => ({
          name: c.name,
          domain: c.domain,
          rating: c.rating || 0,
          reviews: c.reviews || 0
        })),
      
      // Key issues (top 5)
      topIssues: (scanResult.issues || [])
        .slice(0, 5)
        .map((issue: any) => ({
          title: issue.title,
          severity: issue.severity,
          category: issue.type || 'general'
        })),
      
      // Key recommendations (top 5)
      topRecommendations: (scanResult.recommendations || [])
        .slice(0, 5)
        .map((rec: any) => ({
          title: rec.title,
          impact: rec.impact,
          category: rec.category || 'general'
        })),
      
      // Scan metadata
      metadata: {
        scanDuration: scanResult.scanDuration || 0,
        scanType: 'professional',
        dataCompleteness: this.calculateDataCompleteness(scanResult),
        servicesUsed: this.getServicesUsed(scanResult)
      }
    };
    
    return webhookPayload;
  }

  /**
   * Send webhook with retry logic
   */
  async sendWebhook(scanResult: any): Promise<boolean> {
    try {
      const payload = await this.prepareCompleteExport(scanResult);
      
      // Debug: Log the payload structure
      console.log('🔍 Webhook payload structure:', Object.keys(payload));
      console.log('🔍 Webhook payload sample:', {
        event: payload.event,
        restaurant: payload.restaurant?.name,
        scores: payload.scores?.overall,
        hasBusinessMetrics: !!payload.businessMetrics,
        hasSocialMedia: !!payload.socialMedia,
        hasReviews: !!payload.reviewAnalysis,
        recommendationsCount: payload.topRecommendations?.length || 0
      });
      
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
          
          // Don't try GET fallback for large payloads
          if (response.status === 404) {
            console.log('❌ Webhook endpoint not found (404). Check webhook URL configuration.');
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
        } catch (error: any) {
          console.error(`Webhook attempt ${attempt} failed:`, error.message || error);
          
          // Don't retry on client errors (4xx)
          if (error.response?.status >= 400 && error.response?.status < 500) {
            console.error('Client error - not retrying');
            return false;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < this.config.retryAttempts!) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      console.error('❌ Webhook failed after all retry attempts');
      return false;
    } catch (error) {
      console.error('Webhook service error:', error);
      return false;
    }
  }

  /**
   * Generate HMAC signature for webhook security
   */
  private generateHMAC(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Extract location data from business profile
   */
  private extractLocationData(businessProfile: any) {
    if (!businessProfile) return {};
    
    return {
      address: businessProfile.address || '',
      city: businessProfile.city || '',
      state: businessProfile.state || '',
      zip: businessProfile.zip || '',
      country: businessProfile.country || 'USA',
      coordinates: {
        lat: businessProfile.latitude || 0,
        lng: businessProfile.longitude || 0
      }
    };
  }

  /**
   * Calculate local SEO score
   */
  private calculateLocalScore(scanResult: any): number {
    // Simple calculation based on local pack visibility
    const visibility = scanResult.localPackReport?.visibilityScore || 0;
    const hasGoogleProfile = !!scanResult.businessProfile;
    const hasReviews = (scanResult.businessProfile?.reviewCount || 0) > 0;
    
    let score = visibility;
    if (hasGoogleProfile) score += 30;
    if (hasReviews) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Calculate social media score
   */
  private calculateSocialScore(socialMediaLinks: any): number {
    if (!socialMediaLinks) return 0;
    
    let score = 0;
    if (socialMediaLinks.facebook) score += 50;
    if (socialMediaLinks.instagram) score += 30;
    if (socialMediaLinks.twitter) score += 10;
    if (socialMediaLinks.youtube) score += 10;
    
    return score;
  }

  /**
   * Calculate reviews score
   */
  private calculateReviewsScore(reviewsAnalysis: any): number {
    if (!reviewsAnalysis) return 0;
    
    const rating = reviewsAnalysis.averageRating || 0;
    const reviewCount = reviewsAnalysis.totalReviews || 0;
    
    // Score based on rating (0-60 points)
    let score = (rating / 5) * 60;
    
    // Bonus for review volume (0-40 points)
    if (reviewCount >= 100) score += 40;
    else if (reviewCount >= 50) score += 30;
    else if (reviewCount >= 20) score += 20;
    else if (reviewCount >= 10) score += 10;
    
    return Math.min(100, Math.round(score));
  }

  /**
   * Detect cuisine type
   */
  private detectCuisine(businessProfile: any): string {
    if (!businessProfile) return 'restaurant';
    
    const name = businessProfile.name?.toLowerCase() || '';
    const types = businessProfile.types || [];
    
    // Simple pattern matching
    if (name.includes('pizza') || name.includes('pizzeria')) return 'pizza';
    if (name.includes('burger')) return 'burger';
    if (name.includes('sushi') || name.includes('japanese')) return 'japanese';
    if (name.includes('mexican') || name.includes('taco')) return 'mexican';
    if (name.includes('chinese')) return 'chinese';
    if (name.includes('italian')) return 'italian';
    if (name.includes('thai')) return 'thai';
    if (name.includes('indian')) return 'indian';
    
    return 'restaurant';
  }

  /**
   * Detect restaurant type
   */
  private detectRestaurantType(name: string, businessProfile: any): string {
    const nameLower = name?.toLowerCase() || '';
    const priceLevel = businessProfile?.priceLevel || 2;
    
    // Quick service detection
    const qsrKeywords = ['mcdonald', 'subway', 'burger king', 'wendy', 'taco bell', 'kfc', 'chipotle'];
    if (qsrKeywords.some(kw => nameLower.includes(kw))) return 'qsr';
    
    // Price-based detection
    if (priceLevel === 1) return 'fast-food';
    if (priceLevel === 2) return 'casual-dining';
    if (priceLevel >= 3) return 'fine-dining';
    
    return 'restaurant';
  }

  /**
   * Generate profile analysis
   */
  private generateProfileAnalysis(businessProfile: any): any {
    if (!businessProfile) return null;
    
    return {
      completeness: this.calculateProfileCompleteness(businessProfile),
      strengths: [],
      weaknesses: [],
      opportunities: []
    };
  }

  /**
   * Calculate profile completeness
   */
  private calculateProfileCompleteness(profile: any): number {
    if (!profile) return 0;
    
    let score = 0;
    const fields = ['name', 'address', 'phone', 'website', 'hours', 'photos', 'description'];
    
    fields.forEach(field => {
      if (profile[field]) score += (100 / fields.length);
    });
    
    return Math.round(score);
  }

  /**
   * Estimate response rate
   */
  private estimateResponseRate(businessProfile: any): number {
    // Placeholder - would need actual Google My Business API data
    return businessProfile?.reviewCount > 50 ? 75 : 50;
  }

  /**
   * Estimate response time
   */
  private estimateResponseTime(businessProfile: any): string {
    // Placeholder - would need actual Google My Business API data
    return 'Within 24 hours';
  }

  /**
   * Analyze social media
   */
  private analyzeSocialMedia(socialMediaLinks: any): any {
    if (!socialMediaLinks) return null;
    
    return {
      platforms: Object.keys(socialMediaLinks).filter(key => socialMediaLinks[key]),
      score: this.calculateSocialScore(socialMediaLinks)
    };
  }

  /**
   * Calculate data completeness
   */
  private calculateDataCompleteness(scanResult: any): number {
    let score = 0;
    const checks = [
      scanResult.businessProfile,
      scanResult.keywords?.length > 0,
      scanResult.reviewsAnalysis,
      scanResult.socialMediaLinks,
      scanResult.competitors?.length > 0
    ];
    
    checks.forEach(check => {
      if (check) score += 20;
    });
    
    return score;
  }

  /**
   * Get services used
   */
  private getServicesUsed(scanResult: any): string[] {
    const services = ['GooglePlacesAPI'];
    
    if (scanResult.keywords?.length > 0) services.push('DataForSEO');
    if (scanResult.reviewsAnalysis?.googleReviews) services.push('GoogleReviews');
    if (scanResult.reviewsAnalysis?.customerMoodAnalysis) services.push('OpenAI');
    
    return services;
  }

  /**
   * Collect warnings
   */
  private collectWarnings(scanResult: any): string[] {
    const warnings = [];
    
    if (!scanResult.businessProfile) warnings.push('Business profile incomplete');
    if (!scanResult.keywords || scanResult.keywords.length === 0) warnings.push('No keyword data available');
    if (!scanResult.socialMediaLinks?.facebook && !scanResult.socialMediaLinks?.instagram) {
      warnings.push('No social media presence detected');
    }
    
    return warnings;
  }

  /**
   * Get example keywords missing from top 3 for email script
   */
  private getMissingTop3Keywords(keywords: any[], city: string, cuisine: string): string[] {
    // Start with actual keywords that aren't ranking top 3
    const missingKeywords = keywords
      .filter((k: any) => !k.position || k.position > 3)
      .slice(0, 3)
      .map((k: any) => k.keyword);
    
    // If we don't have enough, generate example keywords based on cuisine and city
    if (missingKeywords.length < 3 && city && cuisine) {
      const examples = [
        `best ${cuisine} ${city}`,
        `${cuisine} places ${city}`,
        `top ${cuisine} near me`
      ];
      
      // Add examples that aren't already in the list
      examples.forEach(ex => {
        if (missingKeywords.length < 3 && !missingKeywords.includes(ex)) {
          missingKeywords.push(ex);
        }
      });
    }
    
    return missingKeywords.slice(0, 3); // Return top 3 examples
  }

  /**
   * Get specific keyword examples for email script
   */
  private getEmailKeywordExamples(city: string, cuisine: string): string[] {
    if (!city || city === 'Unknown') city = 'your area';
    if (!cuisine || cuisine === 'restaurant') cuisine = 'restaurant';
    
    // Generate specific examples that match the email template format
    return [
      `best ${cuisine} ${city}`,
      `${cuisine} places ${city}`,
      `top ${cuisine} near me`
    ];
  }

  /**
   * Determine the biggest area for improvement
   */
  private getBiggestImprovementArea(scores: {
    seo: number;
    social: number;
    reviews: number;
    localSearch: number;
  }): string {
    const areas = [
      { name: 'SEO', score: scores.seo },
      { name: 'Social Media', score: scores.social },
      { name: 'Reviews', score: scores.reviews },
      { name: 'Local Search', score: scores.localSearch }
    ];
    
    // Find the area with the lowest score
    const worstArea = areas.reduce((worst, current) => 
      current.score < worst.score ? current : worst
    );
    
    return worstArea.name;
  }

  /**
   * Get actual keywords they don't rank for (from real scan data)
   */
  private getActualMissingKeywords(competitiveKeywords: any[]): string[] {
    // Get keywords where they don't rank in top 3 (position > 3 or no position)
    const missingKeywords = competitiveKeywords
      .filter((k: any) => !k.position || k.position > 3)
      .slice(0, 3)
      .map((k: any) => k.keyword);
    
    console.log('🔍 WEBHOOK DEBUG - Missing keywords:', missingKeywords);
    console.log('🔍 WEBHOOK DEBUG - Sample competitive keyword:', competitiveKeywords[0]);
    
    // If we don't have enough real keywords, return what we have
    return missingKeywords;
  }

  /**
   * Get quantitative data for email personalization
   */
  private getQuantitativeEmailData(competitiveKeywords: any[], rankedKeywords: any[]) {
    console.log('🔍 WEBHOOK DEBUG - Total competitive keywords:', competitiveKeywords.length);
    console.log('🔍 WEBHOOK DEBUG - First 3 competitive keywords with volumes:');
    competitiveKeywords.slice(0, 3).forEach((k, i) => {
      console.log(`   ${i+1}. "${k.keyword}" - Position: ${k.position || 'Not ranking'} - Volume: ${k.searchVolume || 0}`);
    });
    
    const totalKeywordsAnalyzed = competitiveKeywords.length;
    const keywordsNotInTop3 = competitiveKeywords.filter((k: any) => !k.position || k.position > 3).length;
    const keywordsInTop3 = competitiveKeywords.filter((k: any) => k.position && k.position <= 3).length;
    const keywordsInTop10 = competitiveKeywords.filter((k: any) => k.position && k.position <= 10).length;
    
    // Calculate percentage not ranking in top 3
    const percentageNotInTop3 = totalKeywordsAnalyzed > 0 
      ? Math.round((keywordsNotInTop3 / totalKeywordsAnalyzed) * 100)
      : 0;

    // Get actual search volume data for missing keywords
    // If search volumes are 0, generate realistic estimates based on keyword type
    const missingKeywordsWithVolume = competitiveKeywords
      .filter((k: any) => !k.position || k.position > 3)
      .slice(0, 3)
      .map((k: any) => {
        let searchVolume = k.searchVolume || 0;
        
        // If no search volume data, generate realistic estimates
        if (searchVolume === 0) {
          const keyword = k.keyword.toLowerCase();
          if (keyword.includes('near me')) {
            searchVolume = Math.floor(Math.random() * 500) + 1000; // 1000-1500
          } else if (keyword.includes('delivery')) {
            searchVolume = Math.floor(Math.random() * 400) + 1100; // 1100-1500
          } else if (keyword.includes('open now')) {
            searchVolume = Math.floor(Math.random() * 600) + 1200; // 1200-1800
          } else if (keyword.includes('best')) {
            searchVolume = Math.floor(Math.random() * 400) + 800; // 800-1200
          } else {
            searchVolume = Math.floor(Math.random() * 300) + 600; // 600-900
          }
        }
        
        return {
          keyword: k.keyword,
          searchVolume,
          currentPosition: k.position || 'Not ranking',
          opportunity: k.opportunity || 0
        };
      });

    console.log('🔍 WEBHOOK DEBUG - Missing keywords with volumes:', missingKeywordsWithVolume);

    return {
      totalKeywordsAnalyzed,
      keywordsNotInTop3,
      keywordsInTop3,
      keywordsInTop10,
      percentageNotInTop3,
      missingKeywordsWithVolume,
      // Total potential monthly searches they're missing
      totalMissedSearchVolume: missingKeywordsWithVolume.reduce((sum, k) => sum + (k.searchVolume || 0), 0)
    };
  }

  /**
   * Get keywords they're not ranking for - SIMPLE
   */
  private getNotRankingKeywords(competitiveKeywords: any[]): string[] {
    // Get keywords where they don't rank (position 0 or not ranking)
    return competitiveKeywords
      .filter((k: any) => !k.position || k.position === 0)
      .slice(0, 3)
      .map((k: any) => k.keyword);
  }

  private getWorstRankingKeywords(competitiveKeywords: any[]): Array<{keyword: string, position: number | null, searchVolume?: number}> {
    // Sort keywords by worst position (treat null/0 as position 999 for sorting)
    const sortedKeywords = competitiveKeywords
      .map((k: any) => ({
        keyword: k.keyword,
        position: k.position || null,
        searchVolume: k.searchVolume || 0,
        sortPosition: k.position && k.position > 0 ? k.position : 999
      }))
      .sort((a: any, b: any) => b.sortPosition - a.sortPosition) // Worst positions first
      .slice(0, 3)
      .map(({keyword, position, searchVolume}: any) => ({
        keyword,
        position,
        searchVolume
      }));

    return sortedKeywords;
  }
}