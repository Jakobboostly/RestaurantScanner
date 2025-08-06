import { UnifiedKeywordService } from './unifiedKeywordService';
import { generateLocalKeywords } from '../utils/keywordUtils';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  stateAbbr: string;
  country: string;
  formattedAddress: string;
  zipCode: string;
  businessName: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
}

export class LocalSEOAnalyzer {
  private googleApiKey: string;
  private dataforseoLogin: string;
  private dataforseoPassword: string;
  private unifiedService: UnifiedKeywordService;
  
  constructor(googleApiKey: string, dataforseoLogin: string, dataforseoPassword: string) {
    this.googleApiKey = googleApiKey;
    this.dataforseoLogin = dataforseoLogin;
    this.dataforseoPassword = dataforseoPassword;
    this.unifiedService = new UnifiedKeywordService(dataforseoLogin, dataforseoPassword);
  }
  
  /**
   * Main method to analyze local SEO rankings
   * Now uses unified service for batch processing
   */
  async analyzeLocalSEO(
    businessNameOrUrl: string,
    cuisine: string,
    approximateLocation?: string
  ) {
    console.log(`🚀 OPTIMIZED LOCAL SEO ANALYSIS: Starting analysis for ${businessNameOrUrl}`);
    
    // Step 1: Get location data from Google Places
    const locationData = await this.getBusinessLocation(businessNameOrUrl, approximateLocation);
    
    if (!locationData) {
      throw new Error('Could not find business location');
    }
    
    console.log(`📍 Found location: ${locationData.formattedAddress}`);
    console.log(`   Coordinates: ${locationData.latitude}, ${locationData.longitude}`);
    
    // Step 2: Use unified service for batch keyword analysis
    const unifiedResults = await this.unifiedService.analyzeKeywordsBatch({
      businessName: locationData.businessName,
      cuisine: cuisine,
      city: locationData.city,
      state: locationData.state,
      websiteUrl: locationData.website,
      targetDomain: businessNameOrUrl.startsWith('http') ? businessNameOrUrl : undefined,
      locationName: `${locationData.city}, ${locationData.state}, ${locationData.country}`
    });
    
    // Convert unified results to local SEO format
    const rankings = unifiedResults.localRankings.map(ranking => ({
      keyword: ranking.keyword,
      position: ranking.position,
      searchVolume: ranking.searchVolume
    }));
    
    console.log(`✅ OPTIMIZED LOCAL SEO ANALYSIS: Processed ${rankings.length} keywords in batch`);
    
    // Step 3: Generate report
    return this.generateReport(businessNameOrUrl, locationData, rankings);
  }
  
  /**
   * Get business location from Google Places
   */
  private async getBusinessLocation(
    businessNameOrUrl: string,
    approximateLocation?: string
  ): Promise<LocationData | null> {
    // Check if it's a URL or business name
    const isUrl = businessNameOrUrl.startsWith('http');
    
    if (isUrl) {
      // Try to find by website first
      const byWebsite = await this.findPlaceByWebsite(businessNameOrUrl);
      if (byWebsite) return byWebsite;
    }
    
    // Search by name
    const searchQuery = approximateLocation 
      ? `${businessNameOrUrl} ${approximateLocation}`
      : businessNameOrUrl;
    
    // Find place from text
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
      `input=${encodeURIComponent(searchQuery)}` +
      `&inputtype=textquery` +
      `&fields=place_id,name,formatted_address,geometry` +
      `&key=${this.googleApiKey}`;
    
    const response = await fetch(findPlaceUrl);
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const placeId = data.candidates[0].place_id;
      
      // Get detailed information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}` +
        `&fields=name,formatted_address,geometry,address_components,website,rating,user_ratings_total` +
        `&key=${this.googleApiKey}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.result) {
        return this.parseLocationData(detailsData.result);
      }
    }
    
    return null;
  }
  
  /**
   * Find place by website URL
   */
  private async findPlaceByWebsite(websiteUrl: string): Promise<LocationData | null> {
    // Clean URL for search
    const domain = new URL(websiteUrl).hostname.replace('www.', '');
    
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
    
    return null;
  }
  
  /**
   * Parse location data from Google Places response
   */
  private parseLocationData(place: any): LocationData {
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
      website: place.website,
      rating: place.rating,
      reviewCount: place.user_ratings_total
    };
  }
  
  /**
   * Check local rankings using DataForSEO
   * DEPRECATED: Now handled by unified service, kept for backwards compatibility
   */
  private async checkLocalRankings(
    targetUrl: string,
    cuisine: string,
    location: LocationData
  ): Promise<any[]> {
    console.log('⚠️ Using deprecated checkLocalRankings - should use unified service instead');
    
    // This method is now deprecated in favor of the unified service
    // Returning empty array to avoid redundant API calls
    return [];
  }
  
  /**
   * Get search volume for a keyword
   * DEPRECATED: Now handled by unified service
   */
  private async getSearchVolume(keyword: string, location: LocationData): Promise<number> {
    console.log('⚠️ Using deprecated getSearchVolume - handled by unified service now');
    return 0;
  }
  
  /**
   * Generate analysis report
   */
  private generateReport(businessName: string, location: LocationData, rankings: any[]) {
    const ranked = rankings.filter(r => r.position > 0);
    const notRanked = rankings.filter(r => r.position === 0);
    
    return {
      business: businessName,
      location: {
        address: location.formattedAddress,
        coordinates: {
          lat: location.latitude,
          lng: location.longitude
        },
        city: location.city,
        state: location.state,
        country: location.country
      },
      summary: {
        totalKeywords: rankings.length,
        rankedKeywords: ranked.length,
        notRankedKeywords: notRanked.length,
        averagePosition: ranked.length > 0 
          ? ranked.reduce((sum, r) => sum + r.position, 0) / ranked.length 
          : 0
      },
      rankings: {
        ranked: ranked.sort((a, b) => a.position - b.position),
        notRanked: notRanked.sort((a, b) => b.searchVolume - a.searchVolume)
      },
      recommendations: this.generateRecommendations(rankings)
    };
  }
  
  /**
   * Generate SEO recommendations
   */
  private generateRecommendations(rankings: any[]): string[] {
    const recommendations = [];
    
    const nearMeNotRanked = rankings.filter(r => 
      r.keyword.includes('near me') && r.position === 0
    );
    
    if (nearMeNotRanked.length > 0) {
      recommendations.push(
        'Focus on Google My Business optimization - you\'re not ranking for "near me" searches',
        'Ensure NAP (Name, Address, Phone) consistency across all directories',
        'Build local citations and backlinks from local websites'
      );
    }
    
    const poorRankings = rankings.filter(r => r.position > 10 && r.position !== 0);
    if (poorRankings.length > 0) {
      recommendations.push(
        'Create location-specific landing pages for better local relevance',
        'Add more local content and keywords to your website',
        'Encourage more Google reviews to improve local authority'
      );
    }
    
    return recommendations;
  }
}