import { ApifyClient } from 'apify-client';

export interface ApifyReview {
  reviewId: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  reviewerNumberOfReviews?: number;
  isLocalGuide?: boolean;
  rating: number;
  text: string;
  publishedAtDate: string;
  likesCount?: number;
  responseFromOwner?: {
    text: string;
    publishedAtDate: string;
  };
}

export interface ApifyReviewsResponse {
  success: boolean;
  data?: ApifyReview[];
  error?: string;
  metadata?: {
    totalReviews: number;
    placeName: string;
    placeId: string;
    averageRating?: number;
  };
}

export class ApifyReviewsService {
  private client: ApifyClient;
  private actorId = 'compass/google-maps-scraper';

  constructor(apiToken: string) {
    this.client = new ApifyClient({
      token: apiToken,
    });
  }

  async getGoogleReviews(placeId: string): Promise<ApifyReviewsResponse> {
    try {
      console.log(`Starting Apify Google Maps scraper for place ID: ${placeId}`);
      
      // Start the actor run
      const run = await this.client.actor(this.actorId).call({
        placeIds: [placeId],
        maxReviews: 100,
        reviewsSort: "newest",
        scrapeReviewsPersonalData: true,
        language: "en"
      });

      console.log(`Apify run started with ID: ${run.id}`);

      // Wait for the run to finish and get results
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        return {
          success: false,
          error: 'No data returned from Apify scraper',
          metadata: {
            totalReviews: 0,
            placeName: 'Unknown',
            placeId
          }
        };
      }

      const placeData = items[0] as any;
      const reviewsArray = Array.isArray(placeData.reviews) ? placeData.reviews : [];
      console.log(`Apify scraper completed. Found ${reviewsArray.length} reviews for ${placeData.title || 'Unknown Place'}`);

      // Process and structure the reviews
      const processedReviews: ApifyReview[] = reviewsArray.map((review: any) => ({
        reviewId: review.reviewId || `${placeId}_${review.publishedAtDate}`,
        reviewerName: review.reviewerName || 'Anonymous',
        reviewerPhotoUrl: review.reviewerPhotoUrl,
        reviewerNumberOfReviews: review.reviewerNumberOfReviews,
        isLocalGuide: review.isLocalGuide || false,
        rating: review.stars || review.rating || 5,
        text: review.text || '',
        publishedAtDate: review.publishedAtDate || new Date().toISOString(),
        likesCount: review.likesCount || 0,
        responseFromOwner: review.responseFromOwner ? {
          text: review.responseFromOwner.text,
          publishedAtDate: review.responseFromOwner.publishedAtDate
        } : undefined
      }));

      return {
        success: true,
        data: processedReviews,
        metadata: {
          totalReviews: processedReviews.length,
          placeName: String(placeData.title || 'Unknown Place'),
          placeId,
          averageRating: Number(placeData.totalScore || placeData.averageRating || 0)
        }
      };

    } catch (error: any) {
      console.error('Apify Google Maps scraper error:', error);
      
      // Handle specific Apify errors
      let errorMessage = 'Unknown error occurred';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.statusCode) {
        errorMessage = `HTTP ${error.statusCode}: ${error.message || 'Request failed'}`;
      }

      return {
        success: false,
        error: errorMessage,
        metadata: {
          totalReviews: 0,
          placeName: 'Unknown',
          placeId
        }
      };
    }
  }

  async getMultiplePlaceReviews(placeIds: string[]): Promise<ApifyReviewsResponse[]> {
    try {
      console.log(`Starting Apify scraper for ${placeIds.length} places`);
      
      const run = await this.client.actor(this.actorId).call({
        placeIds,
        maxReviews: 100,
        reviewsSort: "newest",
        scrapeReviewsPersonalData: true,
        language: "en"
      });

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      return placeIds.map(placeId => {
        const placeData = items.find((item: any) => item.placeId === placeId);
        
        if (!placeData) {
          return {
            success: false,
            error: 'No data found for place',
            metadata: {
              totalReviews: 0,
              placeName: 'Unknown',
              placeId
            }
          };
        }

        const reviewsArray = Array.isArray(placeData.reviews) ? placeData.reviews : [];
        const processedReviews: ApifyReview[] = reviewsArray.map((review: any) => ({
          reviewId: review.reviewId || `${placeId}_${review.publishedAtDate}`,
          reviewerName: review.reviewerName || 'Anonymous',
          reviewerPhotoUrl: review.reviewerPhotoUrl,
          reviewerNumberOfReviews: review.reviewerNumberOfReviews,
          isLocalGuide: review.isLocalGuide || false,
          rating: review.stars || review.rating || 5,
          text: review.text || '',
          publishedAtDate: review.publishedAtDate || new Date().toISOString(),
          likesCount: review.likesCount || 0,
          responseFromOwner: review.responseFromOwner ? {
            text: review.responseFromOwner.text,
            publishedAtDate: review.responseFromOwner.publishedAtDate
          } : undefined
        }));

        return {
          success: true,
          data: processedReviews,
          metadata: {
            totalReviews: processedReviews.length,
            placeName: String(placeData.title || 'Unknown Place'),
            placeId,
            averageRating: Number(placeData.totalScore || placeData.averageRating || 0)
          }
        };
      });

    } catch (error: any) {
      console.error('Apify multiple places scraper error:', error);
      
      return placeIds.map(placeId => ({
        success: false,
        error: error.message || 'Scraping failed',
        metadata: {
          totalReviews: 0,
          placeName: 'Unknown',
          placeId
        }
      }));
    }
  }
}