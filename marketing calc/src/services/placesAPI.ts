// Note: Direct REST API calls from browser are blocked by CORS
// We'll use Google Maps JavaScript API instead
import { config } from '../config/api';
import { RestaurantCache } from '../utils/cache';
import { dataForSeoRankedKeywordsAPI } from './dataForSeoRankedKeywords';
import { KeywordData } from './revenueCalculations';

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  business_status?: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface RestaurantIntelligence {
  placeDetails: PlaceDetails;
  estimatedMonthlyRevenue: number;
  estimatedAvgTicket: number;
  estimatedMonthlyTransactions: number;
  socialMediaLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  keywords?: KeywordData[];
  keywordsFetchError?: string;
}

// Global type declarations for Google Maps API
declare global {
  interface Window {
    google: any;
    googleMapsLoaded: boolean;
  }
}

class PlacesAPIService {
  private service: any = null;
  private map: any = null;

  constructor() {
    // Initialize when Google Maps is loaded
    if (window.googleMapsLoaded) {
      this.initializeService();
    } else {
      window.addEventListener('googleMapsLoaded', () => {
        this.initializeService();
      });
    }
  }

  private initializeService() {
    try {
      // Create a hidden map element for the Places service
      const mapDiv = document.createElement('div');
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);
      
      this.map = new window.google.maps.Map(mapDiv, {
        center: { lat: 40.7128, lng: -74.0060 }, // NYC
        zoom: 13
      });
      
      this.service = new window.google.maps.places.PlacesService(this.map);
    } catch (error) {
      console.error('Failed to initialize Google Places service:', error);
    }
  }

  /**
   * Search for restaurants using Google Places Text Search
   */
  async searchRestaurants(query: string): Promise<PlaceSearchResult[]> {
    return new Promise((resolve) => {
      if (!this.service) {
        console.error('Google Places service not initialized');
        resolve([]);
        return;
      }

      const request = {
        query: `${query} restaurant`,
        type: 'restaurant'
      };

      this.service.textSearch(request, (results: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults: PlaceSearchResult[] = results.slice(0, 5).map((place: any) => ({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address || '',
            business_status: place.business_status,
            types: place.types || [],
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            price_level: place.price_level
          }));
          resolve(formattedResults);
        } else {
          console.error('Places search failed:', status);
          resolve([]);
        }
      });
    });
  }

  /**
   * Get detailed information about a specific place (with caching)
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    // Check cache first
    const cachedDetails = RestaurantCache.getCachedPlaceDetails(placeId);
    if (cachedDetails) {
      return cachedDetails;
    }

    return new Promise((resolve) => {
      if (!this.service) {
        console.error('Google Places service not initialized');
        resolve(null);
        return;
      }

      const request = {
        placeId: placeId,
        fields: [
          'place_id',
          'name', 
          'formatted_address',
          'formatted_phone_number',
          'website',
          'rating',
          'user_ratings_total',
          'price_level',
          'opening_hours',
          'photos',
          'reviews',
          'types',
          'geometry'
        ]
      };

      this.service.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const placeDetails: PlaceDetails = {
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address || '',
            formatted_phone_number: place.formatted_phone_number,
            website: place.website,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            price_level: place.price_level,
            opening_hours: place.opening_hours ? {
              open_now: place.opening_hours.open_now,
              weekday_text: place.opening_hours.weekday_text || []
            } : undefined,
            photos: place.photos ? place.photos.map((photo: any) => ({
              photo_reference: photo.getUrl ? photo.getUrl({ maxWidth: 400 }) : '',
              height: photo.height || 400,
              width: photo.width || 400
            })) : undefined,
            reviews: place.reviews ? place.reviews.map((review: any) => ({
              author_name: review.author_name,
              rating: review.rating,
              text: review.text,
              time: review.time
            })) : undefined,
            types: place.types || [],
            geometry: {
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              }
            }
          };
          
          // Cache the result for 7 days
          RestaurantCache.cachePlaceDetails(placeId, placeDetails);
          resolve(placeDetails);
        } else {
          console.error('Places details failed:', status);
          resolve(null);
        }
      });
    });
  }

  /**
   * Estimate restaurant metrics based on Google Places data (with caching)
   */
  estimateRestaurantMetrics(placeDetails: PlaceDetails): RestaurantIntelligence {
    // Check cache first
    const cachedIntelligence = RestaurantCache.getCachedRestaurantIntelligence(placeDetails.place_id);
    if (cachedIntelligence) {
      return cachedIntelligence;
    }

    // Base estimates on price level and review count
    let avgTicket = 25; // default
    let monthlyTransactions = 1000; // default

    // Estimate average ticket based on price level
    if (placeDetails.price_level) {
      switch (placeDetails.price_level) {
        case 1: avgTicket = 15; break; // Inexpensive
        case 2: avgTicket = 25; break; // Moderate
        case 3: avgTicket = 40; break; // Expensive
        case 4: avgTicket = 70; break; // Very Expensive
      }
    }

    // Estimate transaction volume based on rating and review count
    if (placeDetails.user_ratings_total && placeDetails.rating) {
      const reviewCount = placeDetails.user_ratings_total;
      const rating = placeDetails.rating;
      
      // Higher rated places with more reviews likely have higher volume
      const volumeMultiplier = Math.min((rating - 3) * 0.5 + 1, 2); // 3.0 rating = 1x, 5.0 rating = 2x
      const reviewMultiplier = Math.min(reviewCount / 100, 3); // More reviews = more volume
      
      monthlyTransactions = Math.round(1000 * volumeMultiplier * reviewMultiplier);
    }

    const monthlyRevenue = monthlyTransactions * avgTicket;

    // Extract potential social media links from website (simplified approach)
    const socialMediaLinks: RestaurantIntelligence['socialMediaLinks'] = {};
    // In a real implementation, you'd use your social media detection API here

    const intelligence: RestaurantIntelligence = {
      placeDetails,
      estimatedMonthlyRevenue: monthlyRevenue,
      estimatedAvgTicket: avgTicket,
      estimatedMonthlyTransactions: monthlyTransactions,
      socialMediaLinks
    };

    // Cache the result for 7 days
    RestaurantCache.cacheRestaurantIntelligence(placeDetails.place_id, intelligence);

    return intelligence;
  }

  /**
   * Get comprehensive restaurant intelligence including keywords
   */
  async getRestaurantIntelligenceWithKeywords(placeId: string): Promise<RestaurantIntelligence> {
    // Get basic place details
    const placeDetails = await this.getPlaceDetails(placeId);
    if (!placeDetails) {
      throw new Error(`Could not fetch place details for place ID: ${placeId}`);
    }

    // Get basic restaurant intelligence (estimates, etc.)
    const baseIntelligence = this.estimateRestaurantMetrics(placeDetails);

    // If no website, return basic intelligence
    if (!placeDetails.website) {
      return {
        ...baseIntelligence,
        keywordsFetchError: 'No website found for keyword analysis'
      };
    }

    // Fetch keywords for the website
    try {
      console.log(`Fetching keywords for website: ${placeDetails.website}`);
      const keywordResult = await dataForSeoRankedKeywordsAPI.fetchKeywordsAsKeywordData(placeDetails.website);
      
      if (keywordResult.success) {
        return {
          ...baseIntelligence,
          keywords: keywordResult.keywords
        };
      } else {
        return {
          ...baseIntelligence,
          keywordsFetchError: keywordResult.error || 'Failed to fetch keywords'
        };
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
      return {
        ...baseIntelligence,
        keywordsFetchError: error instanceof Error ? error.message : 'Unknown error fetching keywords'
      };
    }
  }

  /**
   * Get restaurant photo URL (photos are handled directly by getDetails now)
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    // This method is no longer needed since photos URLs are generated directly
    return photoReference;
  }
}

export const placesAPI = new PlacesAPIService();