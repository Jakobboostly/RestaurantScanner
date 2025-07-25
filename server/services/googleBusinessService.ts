export class GoogleBusinessService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getBusinessProfile(placeId: string) {
    // Stub implementation with realistic restaurant data including proper location
    return {
      name: "Slab Pizza",
      address: "123 Main St, Kinston, NC 28501",
      rating: 4.5,
      reviewCount: 100,
      phoneNumber: "(252) 555-0123",
      website: "https://slabpizza.com",
      formatted_address: "123 Main St, Kinston, NC 28501, USA"
    };
  }

  async getBusinessPhotos(placeId: string) {
    // Minimal implementation to prevent errors
    return [];
  }

  async findCompetitors(businessName: string, location: string, businessType: string) {
    // Minimal implementation to prevent errors
    return [];
  }

  async searchBusinesses(query: string, location: string) {
    // Minimal implementation to prevent errors
    return [];
  }
}