export class UrlRankingService {
  private login: string;
  private password: string;
  private googleApiKey: string;

  constructor(login: string, password: string, googleApiKey?: string) {
    this.login = login;
    this.password = password;
    this.googleApiKey = googleApiKey || '';
  }

  async getUrlRankingsForKeywords(
    targetUrl: string,
    cuisine: string,
    city: string,
    state: string,
    locationName: string = 'United States',
    languageCode: string = 'en'
  ): Promise<any[]> {
    
    // Try to get enhanced location data if Google API key is available
    let enhancedLocation = null;
    if (this.googleApiKey) {
      try {
        enhancedLocation = await this.getEnhancedLocationData(targetUrl, city, state);
        console.log(`📍 Enhanced location data: ${enhancedLocation?.formattedAddress}`);
        console.log(`   Coordinates: ${enhancedLocation?.latitude}, ${enhancedLocation?.longitude}`);
      } catch (error) {
        console.log(`⚠️ Could not get enhanced location data, using standard approach`);
      }
    }

    // Generate the 8 keyword patterns
    const keywordPatterns = [
      `${cuisine} near me`,
      `${cuisine} delivery ${city}`,
      `best ${cuisine} ${city}`,
      `${city} ${cuisine}`,
      `${cuisine} places near me`,
      `${cuisine} ${city} ${state}`,
      `${cuisine} delivery near me`,
      `${cuisine} open now`
    ];

    const results: any[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Extract domain for matching
    const targetDomain = this.extractDomain(targetUrl);
    
    console.log(`🔍 Checking where ${targetUrl} ranks for 8 local keywords...`);

    for (const keyword of keywordPatterns) {
      try {
        console.log(`  📊 Checking: "${keyword}"`);
        
        await delay(1000); // Rate limiting
        
        // Use enhanced location data if available
        const requestBody: any = {
          keyword: keyword,
          language_code: languageCode,
          depth: 50, // Check top 50 positions
          max_crawl_pages: 1
        };

        // Use coordinates for more precise local targeting if available
        if (enhancedLocation?.latitude && enhancedLocation?.longitude) {
          requestBody.location_coordinate = `${enhancedLocation.latitude},${enhancedLocation.longitude},10`; // 10km radius
          requestBody.location_name = `${enhancedLocation.city}, ${enhancedLocation.state}, ${enhancedLocation.country}`;
        } else {
          requestBody.location_name = locationName;
        }

        // Use regular SERP API to see where the URL ranks
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([requestBody])
        });

        const data = await response.json();
        const result = data.tasks?.[0]?.result?.[0];
        const items = result?.items || [];
        
        // Find where YOUR URL ranks
        let position = 0;
        let matchedItem = null;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.type === 'organic') {
            // Check for exact URL match or domain match
            const itemUrl = item.url || '';
            const itemDomain = item.domain || '';
            
            if (itemUrl === targetUrl || 
                itemUrl.includes(targetUrl.replace(/^https?:\/\//, '')) ||
                itemDomain === targetDomain) {
              
              position = item.rank_absolute || (i + 1);
              matchedItem = item;
              console.log(`    ✅ Found ${targetDomain} at position ${position}`);
              break;
            }
          }
        }

        // Get search volume data
        let searchVolume = 0;
        let difficulty = 0;
        let cpc = 0;
        let competition = 0;

        try {
          const volumeResponse = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${this.login}:${this.password}`).toString('base64')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
              keywords: [keyword],
              location_name: locationName,
              language_code: languageCode
            }])
          });
          
          const volumeData = await volumeResponse.json();
          const keywordData = volumeData.tasks?.[0]?.result?.[0]?.items?.[0];
          
          if (keywordData) {
            searchVolume = keywordData.keyword_info?.search_volume || 0;
            difficulty = keywordData.keyword_info?.keyword_difficulty || 0;
            cpc = keywordData.keyword_info?.cpc || 0;
            competition = keywordData.keyword_info?.competition || 0;
          }
        } catch (volumeError) {
          console.log(`    ⚠️ Could not get volume data for "${keyword}"`);
        }

        // Apply minimum search volume rule
        if (searchVolume < 500) {
          searchVolume = 1000;
        }

        // Add to results (show all keywords with their positions)
        results.push({
          keyword: keyword,
          position: position,
          url: matchedItem?.url || null,
          title: matchedItem?.title || null,
          description: null,
          searchVolume: searchVolume,
          difficulty: difficulty,
          cpc: cpc,
          competition: competition,
          opportunity: this.calculateOpportunityScore(position, searchVolume),
          intent: 'local',
          isNew: null,
          isLost: null,
          positionChange: null,
          previousPosition: null
        });
        
        if (position > 0) {
          console.log(`    ✅ Found at position ${position}`);
        } else {
          console.log(`    ❌ Not found in top 50`);
        }

      } catch (error) {
        console.error(`    ❌ Error checking "${keyword}":`, (error as Error).message);
        
        // Add failed keyword with 0 position
        results.push({
          keyword: keyword,
          position: 0,
          url: null,
          title: null,
          description: null,
          searchVolume: 1000,
          difficulty: 0,
          cpc: 0,
          competition: 0,
          opportunity: 0,
          intent: 'local',
          isNew: null,
          isLost: null,
          positionChange: null,
          previousPosition: null
        });
      }
    }

    console.log(`✅ URL ranking check completed for ${results.length} keywords`);
    return results.sort((a, b) => b.opportunity - a.opportunity);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  private calculateOpportunityScore(position: number, searchVolume: number): number {
    if (position === 0) return 0;
    // Higher score for higher volume keywords where you rank poorly
    const positionScore = Math.max(0, 21 - position); // Higher score for worse positions
    const volumeScore = Math.log10(searchVolume + 1) * 10;
    return Math.round(positionScore * volumeScore);
  }

  /**
   * Get enhanced location data using Google Places API
   */
  private async getEnhancedLocationData(targetUrl: string, city: string, state: string): Promise<any> {
    if (!this.googleApiKey) return null;

    try {
      // Clean URL for search
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      
      // Search for business by domain
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
}