import axios from 'axios';

export class GoogleBusinessService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getBusinessProfile(placeId: string) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,address_components,rating,user_ratings_total,formatted_phone_number,website,types,reviews,photos,opening_hours,price_level,business_status,editorial_summary',
            key: this.apiKey
          }
        }
      );

      if (response.data?.result) {
        const result = response.data.result;
        
        // Extract state and city from address components
        let state = '';
        let city = '';
        if (result.address_components) {
          for (const component of result.address_components) {
            if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
          }
        }
        
        return {
          name: result.name || 'Unknown Restaurant',
          address: result.formatted_address || 'Address not available',
          rating: result.rating || 0,
          reviewCount: result.user_ratings_total || 0,
          phoneNumber: result.formatted_phone_number || null,
          website: result.website || null,
          formatted_address: result.formatted_address || 'Address not available',
          address_components: result.address_components || [],
          state: state,
          city: city,
          place_id: placeId,
          business_status: result.business_status || 'UNKNOWN',
          types: result.types || [],
          reviews: result.reviews || [],
          photos: result.photos || [],
          photoCount: (result.photos || []).length,
          opening_hours: result.opening_hours || null,
          price_level: result.price_level || null,
          editorial_summary: result.editorial_summary || null
        };
      }

      throw new Error('No business data found');
    } catch (error: any) {
      console.error('Google Places API error:', error);
      
      // Check if it's a NOT_FOUND error (invalid placeId)
      if (error.response?.data?.status === 'NOT_FOUND') {
        console.log('⚠️ PlaceId not found - using domain-only analysis mode');
        throw new Error('PLACE_ID_NOT_FOUND');
      }
      
      // For any other error (API issues, etc.), throw PLACE_ID_NOT_FOUND to trigger domain fallback
      throw new Error('PLACE_ID_NOT_FOUND');
    }
  }

  async getBusinessPhotos(placeId: string) {
    try {
      const profile = await this.getBusinessProfile(placeId);
      const photos = profile.photos || [];
      
      console.log(`📸 Found ${photos.length} photos for place ID: ${placeId}`);
      
      // Convert photo references to actual photo URLs
      const photoUrls = photos.slice(0, 10).map((photo: any) => {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${this.apiKey}`;
        console.log(`📸 Generated photo URL: ${photoUrl}`);
        return photoUrl;
      });
      
      console.log(`📸 Returning ${photoUrls.length} photo URLs`);
      
      return {
        businessPhotos: photoUrls,
        photoDetails: photos.slice(0, 10).map((photo: any) => ({
          photo_reference: photo.photo_reference,
          height: photo.height,
          width: photo.width,
          html_attributions: photo.html_attributions || []
        }))
      };
    } catch (error) {
      console.error('Error fetching business photos:', error);
      return {
        businessPhotos: [],
        photoDetails: []
      };
    }
  }

  async findCompetitors(businessName: string, location: string, businessType: string) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: `${businessType} restaurants near ${location}`,
            key: this.apiKey,
            type: 'restaurant'
          }
        }
      );

      if (response.data?.results) {
        return response.data.results
          .filter((place: any) => place.name !== businessName)
          .slice(0, 5)
          .map((place: any) => ({
            name: place.name,
            place_id: place.place_id,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            formatted_address: place.formatted_address || 'Address not available',
            types: place.types || []
          }));
      }

      return [];
    } catch (error) {
      console.error('Error finding competitors:', error);
      return [];
    }
  }

  async searchBusinesses(query: string, location: string) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json`,
        {
          params: {
            query: `${query} ${location}`,
            key: this.apiKey,
            type: 'restaurant'
          }
        }
      );

      if (response.data?.results) {
        return response.data.results.map((place: any) => ({
          name: place.name,
          place_id: place.place_id,
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          formatted_address: place.formatted_address || 'Address not available',
          types: place.types || []
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching businesses:', error);
      return [];
    }
  }
}