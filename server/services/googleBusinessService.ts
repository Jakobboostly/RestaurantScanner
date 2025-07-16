import axios from 'axios';

export interface GoogleBusinessProfile {
  name: string;
  rating: number;
  totalReviews: number;
  website?: string;
  phone?: string;
  address?: string;
  photos: {
    total: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    categories: {
      food: number;
      interior: number;
      exterior: number;
      menu: number;
      other: number;
    };
    businessPhotos: string[];
  };
  reviews: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    recent: any[];
    examples: {
      positive: any[];
      neutral: any[];
      negative: any[];
    };
  };
  isVerified: boolean;
  responseRate: number;
  averageResponseTime: string;
}

export interface CompetitorProfile {
  name: string;
  rating: number;
  totalReviews: number;
  distance: number;
  priceLevel: number;
  isStronger: boolean;
}

export class GoogleBusinessService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getBusinessProfile(placeId: string): Promise<GoogleBusinessProfile> {
    try {
      console.log('Fetching business profile for place ID:', placeId);
      
      // Get detailed place information including social media fields
      const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'name,rating,user_ratings_total,photos,reviews,business_status,website,formatted_phone_number,formatted_address,url,editorial_summary,vicinity,plus_code,geometry,opening_hours,types,price_level,secondary_phone_number,international_phone_number,utc_offset,adr_address,place_id,reference,scope,alt_ids,permanently_closed',
          key: this.apiKey,
          reviews_no_translations: true
        }
      });

      console.log('Google API Response Status:', detailsResponse.data.status);
      
      if (detailsResponse.data.status !== 'OK') {
        console.error('Google Places API Error:', detailsResponse.data);
        throw new Error(`Google Places API error: ${detailsResponse.data.status}`);
      }

      const place = detailsResponse.data.result;
      console.log('Raw place data keys:', Object.keys(place || {}));
      console.log('Raw formatted_address:', place?.formatted_address);
      
      if (!place) {
        console.error('Google Places API Response:', detailsResponse.data);
        throw new Error('No place data found');
      }
      
      console.log('Place data received:', {
        name: place.name,
        rating: place.rating,
        totalReviews: place.user_ratings_total,
        website: place.website ? 'Available' : 'Not available',
        phone: place.formatted_phone_number ? 'Available' : 'Not available',
        address: place.formatted_address ? place.formatted_address : 'Not available',
        hasPhotos: !!place.photos,
        photoCount: place.photos ? place.photos.length : 0,
        hasReviews: !!place.reviews,
        reviewCount: place.reviews ? place.reviews.length : 0
      });
      
      // Analyze photos and get business photo URLs
      const photoAnalysis = await this.analyzePhotos(place.photos || []);
      
      // Analyze reviews for sentiment and categorize examples
      const reviewAnalysis = await this.analyzeReviews(place.reviews || []);

      return {
        name: place.name || 'Unknown Restaurant',
        rating: place.rating || 0,
        totalReviews: place.user_ratings_total || 0,
        website: place.website || undefined,
        phone: place.formatted_phone_number || undefined,
        address: place.formatted_address || undefined,
        photos: photoAnalysis,
        reviews: reviewAnalysis,
        isVerified: place.business_status === 'OPERATIONAL',
        responseRate: this.calculateResponseRate(place.reviews || []),
        averageResponseTime: this.calculateResponseTime(place.reviews || []),
      };
    } catch (error) {
      console.error('Google Business API error:', error);
      throw error; // Re-throw the original error for better handling
    }
  }

  async findCompetitors(
    restaurantName: string,
    latitude: number,
    longitude: number,
    radius: number = 2000
  ): Promise<CompetitorProfile[]> {
    try {
      console.log(`Finding competitors for ${restaurantName} at ${latitude},${longitude}`);
      
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${latitude},${longitude}`,
          radius,
          type: 'restaurant',
          key: this.apiKey
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        console.log('No nearby restaurants found');
        return [];
      }

      const competitors = response.data.results
        .filter((place: any) => place.name !== restaurantName)
        .slice(0, 3)
        .map((place: any) => ({
          name: place.name,
          rating: place.rating || 0,
          totalReviews: place.user_ratings_total || 0,
          distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng),
          priceLevel: place.price_level || 2,
          isStronger: (place.rating || 0) > 4.0 && (place.user_ratings_total || 0) > 50,
          placeId: place.place_id, // Add missing placeId field
        }));

      console.log(`Processed ${competitors.length} competitors:`, competitors.map(c => c.name));
      return competitors;
    } catch (error) {
      console.error('Competitor search error:', error);
      return [];
    }
  }

  private async analyzePhotos(photos: any[]) {
    const photoCount = photos.length;
    
    // Get actual photo URLs from Google Places API
    const businessPhotos = photos.slice(0, 6).map(photo => {
      const photoReference = photo.photo_reference;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${this.apiKey}`;
    });
    
    // Analyze photo quality based on metadata and count
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (photoCount >= 20) quality = 'excellent';
    else if (photoCount >= 10) quality = 'good';
    else if (photoCount >= 5) quality = 'fair';

    // Categorize photos (simplified - would need image analysis for accuracy)
    const categories = {
      food: Math.floor(photoCount * 0.4),
      interior: Math.floor(photoCount * 0.3),
      exterior: Math.floor(photoCount * 0.15),
      menu: Math.floor(photoCount * 0.1),
      other: Math.floor(photoCount * 0.05),
    };

    return {
      total: photoCount,
      quality,
      categories,
      businessPhotos
    };
  }

  private async analyzeReviews(reviews: any[]) {
    if (reviews.length === 0) {
      return {
        sentiment: 'neutral' as const,
        score: 0,
        recent: [],
        examples: {
          positive: [],
          neutral: [],
          negative: []
        }
      };
    }

    // Analyze sentiment based on ratings
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (averageRating >= 4) sentiment = 'positive';
    else if (averageRating <= 2.5) sentiment = 'negative';

    // Get recent reviews (all available reviews from Google Places API)
    const recentReviews = reviews
      .sort((a, b) => b.time - a.time) // Sort by most recent first
      .slice(0, 10) // Take up to 10 reviews
      .map(review => ({
        author_name: review.author_name || 'Anonymous',
        rating: review.rating || 5,
        text: review.text || 'Great experience!',
        time: review.time,
        relative_time_description: review.relative_time_description || 'Recently'
      }));

    // Categorize reviews by sentiment for examples
    const positiveReviews = reviews.filter(r => r.rating >= 4).slice(0, 3);
    const neutralReviews = reviews.filter(r => r.rating === 3).slice(0, 2);
    const negativeReviews = reviews.filter(r => r.rating <= 2).slice(0, 2);

    const examples = {
      positive: positiveReviews.map(review => ({
        author: review.author_name || 'Anonymous',
        rating: review.rating,
        text: review.text || 'Great experience!',
        date: review.relative_time_description || 'Recently',
        platform: 'Google'
      })),
      neutral: neutralReviews.map(review => ({
        author: review.author_name || 'Anonymous', 
        rating: review.rating,
        text: review.text || 'Average experience',
        date: review.relative_time_description || 'Recently',
        platform: 'Google'
      })),
      negative: negativeReviews.map(review => ({
        author: review.author_name || 'Anonymous',
        rating: review.rating,
        text: review.text || 'Could be better',
        date: review.relative_time_description || 'Recently',
        platform: 'Google'
      }))
    };

    return {
      sentiment,
      score: Math.round(averageRating * 20), // Convert to 0-100 scale
      recent: recentReviews,
      examples
    };
  }

  private calculateResponseRate(reviews: any[]): number {
    // Google Places API doesn't provide business owner response data
    // This would need to be manually tracked or obtained from other sources
    return 0; // Return 0 to indicate data unavailable
  }

  private calculateResponseTime(reviews: any[]): string {
    // Google Places API doesn't provide business owner response time data
    // This would need to be manually tracked or obtained from other sources
    return 'Data not available';
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1000); // Distance in meters
  }
}