import { ApifyClient } from 'apify-client';

export class ApifyReviewsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getGoogleReviews(placeId: string) {
    if (!placeId || !this.apiKey) {
      console.log('❌ Missing placeId or Apify API key for reviews');
      return { 
        success: false, 
        error: 'Missing placeId or API key',
        data: [], 
        metadata: { totalReviews: 0, averageRating: 0 } 
      };
    }

    try {
      console.log('🔍 Starting Apify Google reviews scraping for placeId:', placeId);
      
      // Use the Apify Google Places scraper actor
      const input = {
        placeIds: [placeId],
        reviewsCount: 100, // Get up to 100 reviews
        language: 'en',
        includeReviews: true,
        includeOpeningHours: false,
        includePhotos: false,
        includeImageUrls: false,
        includePeopleAlsoSearch: false,
        maxReviews: 100,
        onlyDataFromSearchPage: false,
        reviewsSort: 'newest'
      };

      console.log('📝 Apify input configuration:', JSON.stringify(input, null, 2));

      // Initialize Apify client
      const client = new ApifyClient({
        token: this.apiKey,
      });

      // Run the actor
      const run = await client.actor('compass/crawler-google-places').call(input);
      console.log('✅ Apify actor run completed, fetching results...');

      // Get the results
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      console.log('📊 Apify results retrieved:', items.length, 'items');

      if (!items || items.length === 0) {
        console.log('❌ No results from Apify Google Places scraper');
        return { 
          success: false, 
          error: 'No results from scraper',
          data: [], 
          metadata: { totalReviews: 0, averageRating: 0 } 
        };
      }

      const place = items[0] as any;
      console.log('🏪 Place data keys:', Object.keys(place));
      console.log('📝 Reviews found:', place.reviews?.length || 0);
      
      if (!place.reviews || !Array.isArray(place.reviews) || place.reviews.length === 0) {
        console.log('❌ No reviews found in place data');
        return { 
          success: false, 
          error: 'No reviews found',
          data: [], 
          metadata: { 
            totalReviews: place.totalScore || 0, 
            averageRating: place.avgRating || 0 
          } 
        };
      }

      // Transform reviews to our format
      const transformedReviews = place.reviews.map((review: any) => ({
        author: review.name || 'Anonymous',
        rating: review.stars || 0,
        text: review.text || '',
        date: review.publishedAtDate || new Date().toISOString(),
        platform: 'Google Places (Apify)',
        likesCount: review.likesCount || 0,
        reviewId: review.reviewId || '',
        responseFromOwner: review.responseFromOwner || null,
        reviewerPhotoUrl: review.reviewerPhotoUrl || null,
        reviewerUrl: review.reviewerUrl || null,
        reviewerNumberOfReviews: review.reviewerNumberOfReviews || 0
      }));

      console.log('✅ Apify Google reviews processed:', transformedReviews.length, 'reviews');
      console.log('📊 Sample review:', transformedReviews[0] ? {
        author: transformedReviews[0].author,
        rating: transformedReviews[0].rating,
        textLength: transformedReviews[0].text.length
      } : 'No reviews');

      return {
        success: true,
        data: transformedReviews,
        metadata: {
          totalReviews: place.totalScore || transformedReviews.length,
          averageRating: place.avgRating || 0,
          placeId: place.placeId,
          title: place.title,
          address: place.address,
          phone: place.phone,
          website: place.website
        },
        socialMedia: {
          facebook: place.facebook || null,
          instagram: place.instagram || null,
          twitter: place.twitter || null
        },
        contacts: {
          phone: place.phone,
          website: place.website
        }
      };

    } catch (error) {
      console.error('❌ Apify Google reviews scraping failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [], 
        metadata: { totalReviews: 0, averageRating: 0 } 
      };
    }
  }

  async getRestaurantReviews(placeId: string) {
    // Alias to getGoogleReviews for backward compatibility
    return this.getGoogleReviews(placeId);
  }
}