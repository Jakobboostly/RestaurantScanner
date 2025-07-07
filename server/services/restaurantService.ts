import axios from 'axios';

export interface GooglePlacesResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  website?: string;
}

export class RestaurantService {
  private googlePlacesApiKey: string;

  constructor(apiKey: string) {
    this.googlePlacesApiKey = apiKey;
  }

  async searchRestaurants(query: string): Promise<GooglePlacesResult[]> {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: `${query} restaurant`,
            key: this.googlePlacesApiKey,
            fields: 'place_id,name,formatted_address,rating,user_ratings_total,price_level,types',
          },
        }
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results.slice(0, 10);
    } catch (error) {
      console.error('Restaurant search error:', error);
      throw new Error('Failed to search restaurants');
    }
  }

  async getRestaurantDetails(placeId: string): Promise<{ website?: string; phone?: string }> {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'website,formatted_phone_number',
            key: this.googlePlacesApiKey,
          },
        }
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.result;
    } catch (error) {
      console.error('Restaurant details error:', error);
      throw new Error('Failed to get restaurant details');
    }
  }
}
