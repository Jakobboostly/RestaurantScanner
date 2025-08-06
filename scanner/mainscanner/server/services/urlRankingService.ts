import { UnifiedKeywordService } from './unifiedKeywordService';
import { 
  calculateOpportunityScore, 
  classifyKeywordIntent, 
  extractDomain,
  generateLocalKeywords
} from '../utils/keywordUtils';

export class UrlRankingService {
  private login: string;
  private password: string;
  private googleApiKey: string;
  private unifiedService: UnifiedKeywordService;

  constructor(login: string, password: string, googleApiKey?: string) {
    this.login = login;
    this.password = password;
    this.googleApiKey = googleApiKey || '';
    this.unifiedService = new UnifiedKeywordService(login, password);
  }

  async getUrlRankingsForKeywordsWithBusinessName(
    targetUrl: string,
    cuisine: string,
    city: string,
    state: string,
    businessName: string,
    locationName: string = 'United States',
    languageCode: string = 'en'
  ): Promise<any[]> {
    console.log(`🚀 OPTIMIZED URL RANKING: Using unified service for ${targetUrl}`);

    try {
      // Use unified service for batch processing
      const results = await this.unifiedService.analyzeKeywordsBatch({
        businessName: businessName,
        cuisine: cuisine,
        city: city,
        state: state,
        targetDomain: targetUrl,
        locationName: locationName,
        languageCode: languageCode
      });

      // Convert unified results to expected format
      const urlRankings = results.organicRankings.map(ranking => ({
        keyword: ranking.keyword,
        position: ranking.position || 0,
        url: ranking.url,
        title: ranking.title,
        description: null, // Not provided by unified service
        searchVolume: ranking.searchVolume,
        difficulty: ranking.difficulty,
        cpc: ranking.cpc,
        competition: ranking.competition,
        opportunity: ranking.opportunity,
        intent: ranking.intent
      }));

      console.log(`✅ OPTIMIZED URL RANKING: Found ${urlRankings.filter(r => r.position > 0).length}/${urlRankings.length} actual rankings`);
      return urlRankings;

    } catch (error) {
      console.error('Optimized URL ranking failed:', error);
      return [];
    }
  }

  async getUrlRankingsForKeywords(
    targetUrl: string,
    cuisine: string,
    city: string,
    state: string,
    locationName: string = 'United States',
    languageCode: string = 'en'
  ): Promise<any[]> {
    console.log(`🚀 OPTIMIZED URL RANKING: Using unified service for ${targetUrl}`);

    try {
      // Extract business name from URL
      const businessName = this.extractBusinessNameFromUrl(targetUrl);

      // Use unified service for batch processing
      const results = await this.unifiedService.analyzeKeywordsBatch({
        businessName: businessName,
        cuisine: cuisine,
        city: city,
        state: state,
        targetDomain: targetUrl,
        locationName: locationName,
        languageCode: languageCode
      });

      // Convert unified results to expected format with additional fields
      const urlRankings = results.organicRankings.map(ranking => ({
        keyword: ranking.keyword,
        position: ranking.position || 0,
        url: ranking.url,
        title: ranking.title,
        description: null,
        searchVolume: ranking.searchVolume,
        difficulty: ranking.difficulty,
        cpc: ranking.cpc,
        competition: ranking.competition,
        opportunity: ranking.opportunity,
        intent: 'local',
        isNew: null,
        isLost: null,
        positionChange: null,
        previousPosition: null
      })).sort((a, b) => b.opportunity - a.opportunity);

      console.log(`✅ OPTIMIZED URL RANKING: Completed ${urlRankings.length} keywords in batch`);
      return urlRankings;

    } catch (error) {
      console.error('Optimized URL ranking failed:', error);
      return [];
    }
  }

  // Utility methods now use shared functions from keywordUtils

  // DEPRECATED: Search volume now handled by unified service
  async getSearchVolumeData(keyword: string, locationName: string, languageCode: string): Promise<{searchVolume: number, difficulty: number, cpc: number, competition: number}> {
    console.log('⚠️ Using deprecated getSearchVolumeData - handled by unified service now');
    return { searchVolume: 0, difficulty: 0, cpc: 0, competition: 0 };
  }

  // DEPRECATED: Keyword intent now handled by shared utility
  private getKeywordIntent(keyword: string): string {
    return classifyKeywordIntent(keyword);
  }

  /**
   * Get enhanced location data using Google Places API
   */
  private async getEnhancedLocationData(targetUrl: string, city: string, state: string, businessName?: string): Promise<any> {
    if (!this.googleApiKey) return null;

    try {
      // Clean URL for search
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      
      // Try business name search first if available
      if (businessName) {
        console.log(`🔍 Searching for business: "${businessName}" to get coordinates`);
        const businessSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
          `query=${encodeURIComponent(businessName + ' ' + city + ' ' + state)}` +
          `&key=${this.googleApiKey}`;
        
        const businessResponse = await fetch(businessSearchUrl);
        const businessData = await businessResponse.json();
        
        if (businessData.results && businessData.results.length > 0) {
          const businessResult = businessData.results[0];
          console.log(`✅ Found business coordinates for "${businessName}"`);
          return {
            latitude: businessResult.geometry.location.lat,
            longitude: businessResult.geometry.location.lng,
            city: city,
            state: state,
            country: 'United States',
            formattedAddress: businessResult.formatted_address,
            businessName: businessName
          };
        }
      }
      
      // Search for business by domain as fallback
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${encodeURIComponent(domain)}` +
        `&key=${this.googleApiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Find result matching the website
        for (const result of data.results) {
          const placeId = result.place_id;
          
          // Get details to verify website
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
            `place_id=${placeId}` +
            `&fields=website,name,formatted_address,geometry,address_components` +
            `&key=${this.googleApiKey}`;
          
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.result?.website?.includes(domain)) {
            return this.parseLocationData(detailsData.result);
          }
        }
      }
      
      // Fallback: search by location
      const locationSearchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
        `input=${encodeURIComponent(`${city} ${state}`)}` +
        `&inputtype=textquery` +
        `&fields=place_id,name,formatted_address,geometry` +
        `&key=${this.googleApiKey}`;
      
      const locationResponse = await fetch(locationSearchUrl);
      const locationData = await locationResponse.json();
      
      if (locationData.candidates && locationData.candidates.length > 0) {
        const candidate = locationData.candidates[0];
        return {
          latitude: candidate.geometry.location.lat,
          longitude: candidate.geometry.location.lng,
          city: city,
          state: state,
          country: 'United States',
          formattedAddress: candidate.formatted_address
        };
      }
      
    } catch (error) {
      console.log(`⚠️ Error getting enhanced location data: ${(error as Error).message}`);
    }
    
    return null;
  }

  /**
   * Parse location data from Google Places response
   */
  private parseLocationData(place: any): any {
    let city = '';
    let state = '';
    let stateAbbr = '';
    let country = '';
    let zipCode = '';
    
    for (const component of place.address_components || []) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
        stateAbbr = component.short_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    }
    
    return {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      city,
      state,
      stateAbbr,
      country,
      formattedAddress: place.formatted_address,
      zipCode,
      businessName: place.name,
      website: place.website
    };
  }

  /**
   * Extract potential business name from URL domain
   */
  private extractBusinessNameFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const parts = domain.split('.');
      if (parts.length > 0) {
        // Convert domain to potential business name
        let name = parts[0];
        // Handle common patterns like "pier49pizza" -> "Pier 49 Pizza"
        name = name.replace(/(\d+)/, ' $1 ');
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        return name.split(/[\s-_]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    } catch (error) {
      console.log(`Could not extract business name from URL: ${url}`);
    }
    return '';
  }

  /**
   * Get comprehensive keyword data for a restaurant's domain using DataForSEO Google Ads API
   * This discovers actual keywords the restaurant/competitors are ranking for
   */
  async getKeywordsForSite(
    domain: string, 
    city: string, 
    state: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      console.log(`🔍 Keywords for Site API: Discovering actual keywords for ${domain}`);
      
      const locationName = `${city}, ${state}, United States`;
      
      const requestBody = [{
        target: domain,
        target_type: "site", // Get keywords for entire site
        location_name: locationName,
        language_code: "en",
        search_partners: true,
        sort_by: "search_volume" // Show highest volume keywords first
      }];

      const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.log(`❌ Keywords for Site API failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const keywords = data.tasks?.[0]?.result || [];
      
      console.log(`✅ Keywords for Site API: Found ${keywords.length} keywords for ${domain}`);
      
      // Process and enhance keywords with opportunity scoring
      const processedKeywords = keywords
        .slice(0, limit) // Limit results
        .map((keyword: any) => ({
          keyword: keyword.keyword,
          searchVolume: keyword.search_volume || 0,
          competition: keyword.competition || 'UNKNOWN',
          competitionIndex: keyword.competition_index || 0,
          cpc: keyword.cpc || 0,
          lowTopBid: keyword.low_top_of_page_bid || 0,
          highTopBid: keyword.high_top_of_page_bid || 0,
          monthlySearches: keyword.monthly_searches || [],
          opportunityScore: this.calculateKeywordOpportunityScore(
            keyword.search_volume || 0,
            keyword.competition_index || 100,
            keyword.cpc || 10
          ),
          intent: this.classifyKeywordIntent(keyword.keyword),
          isLocal: this.isLocalKeyword(keyword.keyword, city, state),
          trends: this.analyzeTrends(keyword.monthly_searches || [])
        }))
        .sort((a: any, b: any) => b.opportunityScore - a.opportunityScore); // Sort by opportunity

      return processedKeywords;

    } catch (error) {
      console.log(`❌ Keywords for Site API error: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Calculate keyword opportunity score based on search volume, competition, and cost
   * Higher score = Better opportunity (high volume, low competition, reasonable cost)
   */
  private calculateKeywordOpportunityScore(
    searchVolume: number, 
    competitionIndex: number, 
    cpc: number
  ): number {
    if (searchVolume === 0) return 0;
    
    // Normalize competition (0-100 scale, lower is better)
    const competitionScore = Math.max(0, 100 - competitionIndex);
    
    // Normalize CPC (cap at $20, lower is better for opportunity)
    const costScore = Math.max(0, 100 - Math.min(cpc * 5, 100));
    
    // Weight: 50% search volume, 30% competition, 20% cost
    const volumeWeight = Math.min(searchVolume / 1000, 100); // Cap volume impact
    
    const opportunityScore = (
      (volumeWeight * 0.5) + 
      (competitionScore * 0.3) + 
      (costScore * 0.2)
    );
    
    return Math.round(opportunityScore);
  }

  /**
   * Classify keyword intent for better categorization
   */
  private classifyKeywordIntent(keyword: string): string {
    const kw = keyword.toLowerCase();
    
    if (kw.includes('buy') || kw.includes('order') || kw.includes('delivery') || kw.includes('menu')) {
      return 'transactional';
    }
    if (kw.includes('near me') || kw.includes('location') || kw.includes('hours') || kw.includes('phone')) {
      return 'local';
    }
    if (kw.includes('best') || kw.includes('review') || kw.includes('vs') || kw.includes('compare')) {
      return 'commercial';
    }
    if (kw.includes('what is') || kw.includes('how to') || kw.includes('recipe') || kw.includes('nutrition')) {
      return 'informational';
    }
    
    return 'navigational';
  }

  /**
   * Check if keyword is location-specific
   */
  private isLocalKeyword(keyword: string, city: string, state: string): boolean {
    const kw = keyword.toLowerCase();
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();
    
    return (
      kw.includes(cityLower) || 
      kw.includes(stateLower) ||
      kw.includes('near me') ||
      kw.includes('local') ||
      kw.includes('delivery') ||
      kw.includes('takeout')
    );
  }

  /**
   * Analyze search volume trends from monthly data
   */
  private analyzeTrends(monthlySearches: any[]): any {
    if (!monthlySearches || monthlySearches.length === 0) {
      return { trend: 'stable', change: 0 };
    }

    // Get last 3 months vs previous 3 months
    const recent = monthlySearches.slice(-3);
    const previous = monthlySearches.slice(-6, -3);
    
    if (recent.length === 0 || previous.length === 0) {
      return { trend: 'stable', change: 0 };
    }

    const recentAvg = recent.reduce((sum, month) => sum + (month.search_volume || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, month) => sum + (month.search_volume || 0), 0) / previous.length;
    
    if (previousAvg === 0) return { trend: 'stable', change: 0 };
    
    const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    let trend = 'stable';
    if (percentChange > 15) trend = 'rising';
    else if (percentChange < -15) trend = 'declining';
    
    return {
      trend,
      change: Math.round(percentChange),
      recentAvg: Math.round(recentAvg),
      previousAvg: Math.round(previousAvg)
    };
  }

  /**
   * Get competitive keyword gaps - keywords competitors rank for but target doesn't
   */
  async getCompetitiveKeywordGaps(
    targetDomain: string,
    competitorDomains: string[],
    city: string,
    state: string
  ): Promise<any[]> {
    try {
      console.log(`🔍 Analyzing competitive keyword gaps for ${targetDomain} vs competitors`);
      
      // Get target's keywords
      const targetKeywords = await this.getKeywordsForSite(targetDomain, city, state, 100);
      const targetKeywordSet = new Set(targetKeywords.map(k => k.keyword.toLowerCase()));
      
      const gaps: any[] = [];
      
      // Check each competitor
      for (const competitorDomain of competitorDomains.slice(0, 3)) { // Limit to 3 competitors
        console.log(`🔍 Checking competitor: ${competitorDomain}`);
        
        const competitorKeywords = await this.getKeywordsForSite(competitorDomain, city, state, 50);
        
        // Find keywords competitor has that target doesn't
        const competitorGaps = competitorKeywords.filter(compKeyword => 
          !targetKeywordSet.has(compKeyword.keyword.toLowerCase()) &&
          compKeyword.searchVolume > 100 && // Minimum search volume
          compKeyword.isLocal // Focus on local keywords
        );
        
        gaps.push(...competitorGaps.map(gap => ({
          ...gap,
          competitorDomain,
          gapType: 'missing_keyword'
        })));
        
        // Rate limiting between competitor checks
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Sort gaps by opportunity score and remove duplicates
      const uniqueGaps = gaps
        .filter((gap, index, self) => 
          index === self.findIndex(g => g.keyword.toLowerCase() === gap.keyword.toLowerCase())
        )
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 20); // Top 20 opportunities
      
      console.log(`✅ Found ${uniqueGaps.length} keyword gap opportunities`);
      return uniqueGaps;
      
    } catch (error) {
      console.log(`❌ Competitive gap analysis error: ${(error as Error).message}`);
      return [];
    }
  }
}