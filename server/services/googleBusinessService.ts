export class GoogleBusinessService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getBusinessProfile(placeId: string) {
    // Minimal implementation to prevent errors
    return null;
  }

  async searchBusinesses(query: string, location: string) {
    // Minimal implementation to prevent errors
    return [];
  }
}