export class ApifyReviewsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getRestaurantReviews(placeId: string) {
    return { reviews: [], totalReviews: 0 };
  }
}