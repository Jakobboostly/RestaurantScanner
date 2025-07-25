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
  
  constructor(googleApiKey: string, dataforseoLogin: string, dataforseoPassword: string) {
    this.googleApiKey = googleApiKey;
    this.dataforseoLogin = dataforseoLogin;
    this.dataforseoPassword = dataforseoPassword;
  }
  
  /**
   * Main method to analyze local SEO rankings
   */
  async analyzeLocalSEO(
    businessNameOrUrl: string,
    cuisine: string,
    approximateLocation?: string
  ) {
    console.log(`🚀 Starting Local SEO Analysis for ${businessNameOrUrl}`);
    
    // Step 1: Get location data from Google Places
    const locationData = await this.getBusinessLocation(businessNameOrUrl, approximateLocation);
    
    if (!locationData) {
      throw new Error('Could not find business location');
    }
    
    console.log(`📍 Found location: ${locationData.formattedAddress}`);
    console.log(`   Coordinates: ${locationData.latitude}, ${locationData.longitude}`);
    
    // Step 2: Analyze rankings using DataForSEO
    const rankings = await this.checkLocalRankings(
      businessNameOrUrl,
      cuisine,
      locationData
    );
    
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
   */
  private async checkLocalRankings(
    targetUrl: string,
    cuisine: string,
    location: LocationData
  ): Promise<any[]> {
    // Generate keywords
    const keywords = [
      `${cuisine} near me`,
      `${cuisine} delivery ${location.city}`,
      `best ${cuisine} ${location.city}`,
      `${location.city} ${cuisine}`,
      `${cuisine} places near me`,
      `${cuisine} ${location.city} ${location.stateAbbr}`,
      `${cuisine} delivery near me`,
      `${cuisine} open now`
    ];
    
    const results = [];
    
    for (const keyword of keywords) {
      console.log(`  🔍 Checking: "${keyword}"`);
      
      try {
        // Use both location name and coordinates for best results
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.dataforseoLogin}:${this.dataforseoPassword}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            keyword: keyword,
            location_name: `${location.city}, ${location.state}, ${location.country}`,
            location_coordinate: `${location.latitude},${location.longitude},10`, // 10km radius
            language_code: 'en',
            depth: 100,
            device: 'desktop'
          }])
        });
        
        const data = await response.json();
        const items = data.tasks?.[0]?.result?.[0]?.items || [];
        
        // Find position
        let position = 0;
        const targetDomain = new URL(targetUrl).hostname.replace('www.', '');
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type === 'organic' || item.type === 'local_pack') {
            const itemDomain = item.domain?.replace('www.', '');
            if (itemDomain === targetDomain || 
                item.url?.includes(targetUrl) ||
                item.title?.toLowerCase().includes(location.businessName?.toLowerCase())) {
              position = item.rank_absolute || (i + 1);
              break;
            }
          }
        }
        
        results.push({
          keyword,
          position,
          searchVolume: await this.getSearchVolume(keyword, location)
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error checking ${keyword}:`, error);
        results.push({
          keyword,
          position: 0,
          searchVolume: 0
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get search volume for a keyword
   */
  private async getSearchVolume(keyword: string, location: LocationData): Promise<number> {
    try {
      const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.dataforseoLogin}:${this.dataforseoPassword}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          keywords: [keyword],
          location_name: `${location.city}, ${location.state}, ${location.country}`,
          language_code: 'en'
        }])
      });
      
      const data = await response.json();
      const volume = data.tasks?.[0]?.result?.[0]?.search_volume || 0;
      
      // Apply minimum threshold for low-volume local keywords
      return volume < 500 && volume > 0 ? 1000 : volume;
      
    } catch (error) {
      console.error('Error getting search volume:', error);
      return 1000; // Default fallback
    }
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