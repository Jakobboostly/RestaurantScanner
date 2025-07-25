export class GoogleBusinessService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getBusinessProfile(placeId: string) {
    // Minimal implementation to prevent errors
    return {
      name: "Restaurant Name",
      address: "123 Main St",
      rating: 4.5,
      reviewCount: 100,
      phoneNumber: "(555) 123-4567",
      website: "https://example.com",
      formatted_address: "123 Main St, City, State 12345"
    };
  }

  async getBusinessPhotos(placeId: string) {
    // Minimal implementation to prevent errors
    return [];
  }

  async searchBusinesses(query: string, location: string) {
    // Minimal implementation to prevent errors
    return [];
  }
}