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
      console.log(`Fetching details for place ID: ${placeId}`);
      console.log(`API Key present: ${!!this.googlePlacesApiKey}`);
      
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

      console.log(`API Response status: ${response.data.status}`);
      console.log(`API Response:`, response.data);

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.result;
    } catch (error) {
      console.error('Restaurant details error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw new Error('Failed to get restaurant details');
    }
  }

  async searchRestaurantByWebsite(domain: string): Promise<GooglePlacesResult[]> {
    try {
      // Search for restaurants with the domain in their details
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: `restaurant site:${domain}`,
            key: this.googlePlacesApiKey,
            fields: 'place_id,name,formatted_address,rating,user_ratings_total,price_level,types,website',
          },
        }
      );

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        // Fallback: Try searching with just the domain name
        const domainName = domain.split('.')[0];
        const fallbackResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/place/textsearch/json`,
          {
            params: {
              query: `${domainName} restaurant`,
              key: this.googlePlacesApiKey,
              fields: 'place_id,name,formatted_address,rating,user_ratings_total,price_level,types,website',
            },
          }
        );
        
        if (fallbackResponse.data.status === 'OK') {
          // Filter results to find ones that match the domain
          const filteredResults = [];
          for (const place of fallbackResponse.data.results.slice(0, 5)) {
            const details = await this.getPlaceDetails(place.place_id);
            if (details.website && details.website.includes(domain)) {
              filteredResults.push({
                ...place,
                website: details.website
              });
            }
          }
          return filteredResults.length > 0 ? filteredResults : fallbackResponse.data.results.slice(0, 1);
        }
      }

      return response.data.results.slice(0, 10);
    } catch (error) {
      console.error('Restaurant search by website error:', error);
      throw new Error('Failed to search restaurant by website');
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,website,formatted_phone_number',
            key: this.googlePlacesApiKey,
          },
        }
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.result;
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to get place details');
    }
  }
}
