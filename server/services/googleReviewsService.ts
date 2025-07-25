export class GoogleReviewsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getReviews(placeId: string) {
    return { reviews: [], averageRating: 0 };
  }
}