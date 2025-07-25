export class OpenAIReviewAnalysisService {
  async analyzeReviews(reviews: any[]) {
    return { analysis: "No analysis available", sentiment: "neutral" };
  }

  async getDefaultAnalysis() {
    return {
      overallMood: "satisfied",
      moodDescription: "Customers generally have positive experiences",
      sentiment: "neutral",
      themes: ["service", "food quality"],
      loyaltySignals: "moderate"
    };
  }
}