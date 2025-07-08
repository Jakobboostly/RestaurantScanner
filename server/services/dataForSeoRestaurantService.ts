import { DataForSeoService } from './dataForSeoService.js';

export interface DataForSeoRestaurantResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  types: string[];
  domain?: string;
  placeId: string;
  location?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  website?: string;
  hours?: any;
  cid?: string;
}

export class DataForSeoRestaurantService {
  private dataForSeo: DataForSeoService;

  constructor(login: string, password: string) {
    this.dataForSeo = new DataForSeoService(login, password);
  }

  async searchRestaurants(query: string): Promise<DataForSeoRestaurantResult[]> {
    try {
      const results = await this.dataForSeo.searchRestaurants({
        query: `${query} restaurant`,
        limit: 10,
      });

      if (!results || !results.items) {
        return [];
      }

      return results.items.map((item: any) => ({
        id: item.cid || item.place_id || `${item.title}-${Date.now()}`,
        name: item.title || item.name || 'Unknown Restaurant',
        address: item.address || item.location_info?.address || 'Address not available',
        rating: item.rating?.rating_value || item.rating || undefined,
        totalRatings: item.rating?.rating_count || item.reviews_count || undefined,
        priceLevel: item.price_level || undefined,
        types: item.category ? [item.category] : ['restaurant'],
        domain: item.domain || (item.website ? new URL(item.website).hostname : undefined),
        placeId: item.place_id || item.cid || item.id,
        location: item.location_info ? {
          lat: item.location_info.latitude,
          lng: item.location_info.longitude,
        } : undefined,
        phone: item.phone || undefined,
        website: item.website || undefined,
        hours: item.work_hours || undefined,
        cid: item.cid || undefined,
      }));
    } catch (error) {
      console.error('DataForSEO restaurant search error:', error);
      throw new Error('Failed to search restaurants');
    }
  }

  async getRestaurantDetails(placeId: string): Promise<{ website?: string; phone?: string; hours?: any; location?: any }> {
    try {
      const result = await this.dataForSeo.getRestaurantDetails(placeId);
      
      if (!result) {
        return {};
      }

      return {
        website: result.website || undefined,
        phone: result.phone || undefined,
        hours: result.work_hours || undefined,
        location: result.location_info ? {
          lat: result.location_info.latitude,
          lng: result.location_info.longitude,
        } : undefined,
      };
    } catch (error) {
      console.error('DataForSEO restaurant details error:', error);
      return {};
    }
  }
}