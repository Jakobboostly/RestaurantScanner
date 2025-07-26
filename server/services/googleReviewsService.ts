import axios from 'axios';

export class GoogleReviewsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getReviews(placeId: string) {
    if (!placeId || !this.apiKey) {
      console.log('❌ Missing placeId or API key for Google reviews');
      return { reviews: [], averageRating: 0 };
    }

    try {
      console.log('🔍 Fetching Google Place details for reviews:', placeId);
      
      const url = 'https://maps.googleapis.com/maps/api/place/details/json';
      const params = {
        place_id: placeId,
        fields: 'reviews,rating,user_ratings_total',
        key: this.apiKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK') {
        console.error('❌ Google Places API error:', response.data.status);
        return { reviews: [], averageRating: 0 };
      }

      const place = response.data.result;
      const reviews = place.reviews || [];
      
      console.log('✅ Google reviews fetched:', reviews.length, 'reviews');
      
      // Transform Google reviews to our format
      const transformedReviews = reviews.map((review: any) => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        date: new Date(review.time * 1000).toISOString(),
        platform: 'Google Places'
      }));

      return {
        reviews: transformedReviews,
        averageRating: place.rating || 0,
        totalReviews: place.user_ratings_total || reviews.length
      };

    } catch (error) {
      console.error('❌ Error fetching Google reviews:', error);
      return { reviews: [], averageRating: 0 };
    }
  }
}