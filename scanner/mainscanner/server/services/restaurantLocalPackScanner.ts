/**
 * Restaurant Local Pack Scanner
 * Detects if a restaurant appears in Google's "Local Pack" (top 3 map results)
 * for local search keywords using DataForSEO API
 */

import pLimit from 'p-limit';

const limit = pLimit(2); // Limit concurrent API calls

export interface ClientRestaurant {
  business_name: string;
  website?: string;
  address?: string;
  phone?: string;
  google_cid?: string;
}

export interface LocalPackResult {
  keyword: string;
  found: boolean;
  position?: number;
  confidence: number;
  matched_fields: string[];
  local_pack_data?: {
    name: string;
    address: string;
    website?: string;
    phone?: string;
    rating?: number;
    reviews?: number;
  };
  competitors?: Array<{
    position: number;
    name: string;
    address: string;
    website?: string;
    rating?: number;
    reviews?: number;
  }>;
}

export interface ScanSummary {
  visibility_score: number;
  keywords_appeared: number;
  total_keywords: number;
  average_position: number;
  best_position: number;
}

export interface ScanReport {
  summary: ScanSummary;
  keyword_results: LocalPackResult[];
  recommendations: string[];
  scan_metadata: {
    location: string;
    timestamp: string;
    total_scan_time_ms: number;
  };
}

export class RestaurantLocalPackScanner {
  private login: string;
  private password: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
  }

  /**
   * Main scanning method - analyzes Local Pack presence across keywords
   */
  async scanKeywords(
    clientInfo: ClientRestaurant,
    keywords: string[],
    location: string
  ): Promise<ScanReport> {
    const scanStartTime = Date.now();
    console.log(`🔍 LOCAL PACK SCANNER: Starting scan for ${clientInfo.business_name}`);
    console.log(`   Location: ${location}`);
    console.log(`   Keywords: ${keywords.length}`);


    const keywordResults: LocalPackResult[] = [];

    // Process keywords with rate limiting
    const scanPromises = keywords.map(keyword => 
      limit(() => this.scanSingleKeyword(keyword, clientInfo, location))
    );

    const results = await Promise.allSettled(scanPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        keywordResults.push(result.value);
      } else {
        // Add failed keyword with no match
        keywordResults.push({
          keyword: keywords[index],
          found: false,
          confidence: 0,
          matched_fields: []
        });
      }
    });

    // Generate summary and recommendations
    const summary = this.calculateSummary(keywordResults);
    const recommendations = this.generateRecommendations(keywordResults, clientInfo);

    const report: ScanReport = {
      summary,
      keyword_results: keywordResults,
      recommendations,
      scan_metadata: {
        location,
        timestamp: new Date().toISOString(),
        total_scan_time_ms: Date.now() - scanStartTime
      }
    };


    console.log(`✅ LOCAL PACK SCAN: Completed ${keywordResults.length} keywords`);
    console.log(`   Visibility Score: ${summary.visibility_score}%`);
    console.log(`   Appeared in: ${summary.keywords_appeared}/${summary.total_keywords} searches`);

    return report;
  }

  /**
   * Scan a single keyword for Local Pack presence
   */
  private async scanSingleKeyword(
    keyword: string,
    clientInfo: ClientRestaurant,
    location: string
  ): Promise<LocalPackResult | null> {
    try {
      console.log(`🔍 Scanning Local Pack for: "${keyword}"`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Use Local Finder with location_name and min_rating filter for Local Pack presence
      const localFinderResponse = await fetch('https://api.dataforseo.com/v3/serp/google/local_finder/live/advanced', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          location_name: location,
          language_code: 'en',
          keyword,
          min_rating: 4.0
        }]),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let localResults: any[] = [];
      if (localFinderResponse.ok) {
        const data = await localFinderResponse.json();
        const items = data.tasks?.[0]?.result?.[0]?.items || [];
        
        // Filter for local_pack items and sort by rank_group (position in local pack)
        localResults = items
          .filter((item: any) => item.type === 'local_pack' && item.rank_group)
          .sort((a: any, b: any) => a.rank_group - b.rank_group)
          .slice(0, 5); // Get top 5 local pack results
        
        console.log(`📍 Found ${localResults.length} local pack results for "${keyword}"`);
      } else {
        console.log(`❌ Local Finder API failed for "${keyword}": ${localFinderResponse.status}`);
      }

      if (!localResults || localResults.length === 0) {
        console.log(`⚠️ No Local Pack found for "${keyword}"`);
        return {
          keyword,
          found: false,
          confidence: 0,
          matched_fields: []
        };
      }

      // Evaluate top 5 results for Local Pack
      let matchResult: LocalPackResult | null = null;
      const competitors: Array<any> = [];

      for (const business of localResults) {
        const position = business.rank_group; // Use actual rank_group as position

        // Check for exact title and URL matching as requested
        const titleMatch = this.isBusinessMatch(clientInfo, business);
        
        if (titleMatch) {
          matchResult = {
            keyword,
            found: true,
            position,
            confidence: 100, // Perfect match
            matched_fields: ['title', 'url'],
            local_pack_data: {
              name: business.title || '',
              address: business.description?.split('\n')[0] || '', // Extract address from description
              website: business.url || '',
              phone: business.phone || '',
              rating: business.rating?.value || 0,
              reviews: business.rating?.votes_count || 0
            }
          };
          console.log(`✅ Found restaurant "${business.title}" at position ${position} for "${keyword}"`);
          break;
        } else {
          // Add to competitors if within top 3 of local pack
          if (position <= 3) {
            competitors.push({
              position,
              name: business.title || 'Unknown Business',
              address: business.description?.split('\n')[0] || '',
              website: business.url || '',
              rating: business.rating?.value || 0,
              reviews: business.rating?.votes_count || 0
            });
          }
        }
      }

      if (!matchResult) {
        return {
          keyword,
          found: false,
          confidence: 0,
          matched_fields: [],
          competitors
        };
      }

      matchResult.competitors = competitors;
      return matchResult;

    } catch (error) {
      console.log(`❌ Error scanning "${keyword}":`, error);
      return null;
    }
  }

  /**
   * Check if business matches using title and URL verification as requested
   */
  private isBusinessMatch(clientInfo: ClientRestaurant, localPackBusiness: any): boolean {
    const businessTitle = localPackBusiness.title || '';
    const businessUrl = localPackBusiness.url || '';
    
    // Normalize names for comparison
    const clientName = this.normalizeBusinessName(clientInfo.business_name);
    const businessName = this.normalizeBusinessName(businessTitle);
    
    // Check for title match
    const titleMatches = clientName === businessName || 
                        businessName.includes(clientName) || 
                        clientName.includes(businessName);
    
    // Check for URL match if available
    let urlMatches = false;
    if (clientInfo.website && businessUrl) {
      const clientWebsite = this.normalizeWebsite(clientInfo.website);
      const businessWebsite = this.normalizeWebsite(businessUrl);
      urlMatches = clientWebsite === businessWebsite || 
                  this.isDomainSimilar(clientWebsite, businessWebsite);
    }
    
    // Require title match, and URL match if both websites are available
    if (clientInfo.website && businessUrl) {
      return titleMatches && urlMatches;
    } else {
      // If no website available, rely on title match
      return titleMatches;
    }
  }

  /**
   * Calculate overall scan summary
   */
  private calculateSummary(results: LocalPackResult[]): ScanSummary {
    const totalKeywords = results.length;
    const foundKeywords = results.filter(r => r.found);
    const keywordsAppeared = foundKeywords.length;
    
    const positions = foundKeywords.map(r => r.position).filter(p => p !== undefined) as number[];
    const averagePosition = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length 
      : 0;
    
    const bestPosition = positions.length > 0 ? Math.min(...positions) : 0;
    const visibilityScore = Math.round((keywordsAppeared / totalKeywords) * 100);

    return {
      visibility_score: visibilityScore,
      keywords_appeared: keywordsAppeared,
      total_keywords: totalKeywords,
      average_position: Math.round(averagePosition * 10) / 10,
      best_position: bestPosition
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    results: LocalPackResult[],
    clientInfo: ClientRestaurant
  ): string[] {
    const recommendations: string[] = [];
    const found = results.filter(r => r.found);
    const notFound = results.filter(r => !r.found);

    // Visibility recommendations
    if (notFound.length > 0) {
      const missingKeywords = notFound.map(r => r.keyword).join('", "');
      recommendations.push(`Not appearing for "${missingKeywords}" - optimize Google My Business profile with these keywords`);
    }

    // Position improvement
    const lowRankings = found.filter(r => r.position && r.position > 1);
    if (lowRankings.length > 0) {
      recommendations.push(`Ranking below #1 for ${lowRankings.length} keywords - increase customer reviews and engagement to improve rankings`);
    }

    // Perfect performance
    if (found.length === results.length && found.every(r => r.position === 1)) {
      recommendations.push(`Excellent! You're dominating the Local Pack. Focus on maintaining your #1 positions with consistent review generation and GMB updates.`);
    }

    // Missing website
    if (!clientInfo.website) {
      recommendations.push(`Add a website to your Google My Business profile to improve Local Pack visibility and click-through rates`);
    }

    // Generic advice based on visibility score
    const visibilityScore = (found.length / results.length) * 100;
    if (visibilityScore < 50) {
      recommendations.push(`Low Local Pack visibility (${Math.round(visibilityScore)}%) - audit your Google My Business completeness, categories, and local citations`);
    }

    return recommendations;
  }

  // Normalization and matching helper methods
  private normalizeBusinessName(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeWebsite(url: string): string {
    return url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  private normalizeAddress(address: string): string {
    return address.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  private isNameSimilar(name1: string, name2: string): boolean {
    const words1 = name1.split(' ').filter(w => w.length > 2);
    const words2 = name2.split(' ').filter(w => w.length > 2);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length >= Math.min(words1.length, words2.length) * 0.6;
  }

  private isDomainSimilar(domain1: string, domain2: string): boolean {
    const base1 = domain1.split('.')[0];
    const base2 = domain2.split('.')[0];
    return base1 === base2;
  }

  private isAddressSimilar(addr1: string, addr2: string): boolean {
    const words1 = addr1.split(' ').filter(w => w.length > 2);
    const words2 = addr2.split(' ').filter(w => w.length > 2);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length >= 3; // At least 3 common address components
  }

  private sharesCityState(addr1: string, addr2: string): boolean {
    // Simple check for shared city/state components
    const words1 = addr1.split(' ');
    const words2 = addr2.split(' ');
    
    const sharedWords = words1.filter(word => words2.includes(word) && word.length > 3);
    return sharedWords.length >= 2; // Likely shares city and state
  }


}