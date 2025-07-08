import axios from 'axios';
import NodeCache from 'node-cache';
import pLimit from 'p-limit';

const limit = pLimit(3); // Limit concurrent requests
const cache = new NodeCache({ stdTTL: 1800 }); // 30 minute cache

export interface ZembraReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  platform: string;
  helpful: boolean;
  verified: boolean;
}

export interface ReviewAnalysis {
  averageRating: number;
  totalReviews: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recentReviews: ZembraReview[];
  keyThemes: string[];
  responseRate: number;
  recommendationScore: number;
}

export class ZembraTechReviewsService {
  private apiKey: string;
  private baseUrl = 'https://api.zembratech.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getRestaurantReviews(
    restaurantName: string,
    domain?: string,
    location?: string
  ): Promise<ReviewAnalysis> {
    return limit(async () => {
      const cacheKey = `reviews_${restaurantName}_${domain}_${location}`;
      const cached = cache.get<ReviewAnalysis>(cacheKey);
      
      if (cached) {
        console.log('Using cached reviews for:', restaurantName);
        return cached;
      }

      try {
        // Search for restaurant reviews
        const searchParams = {
          query: restaurantName,
          domain: domain || null,
          location: location || null,
          limit: 50,
          platforms: ['google', 'yelp', 'tripadvisor', 'facebook'],
          sort: 'recent'
        };

        const response = await axios.get(`${this.baseUrl}/reviews/search`, {
          params: searchParams,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        const reviewsData = response.data.reviews || [];
        
        // Process reviews
        const processedReviews: ZembraReview[] = reviewsData.map((review: any) => ({
          id: review.id || Math.random().toString(36),
          author: this.sanitizeText(review.author_name || review.author || 'Anonymous'),
          rating: review.rating || 5,
          title: this.sanitizeText(review.title || ''),
          text: this.sanitizeText(review.text || review.review_text || ''),
          date: review.date || review.created_at || new Date().toISOString(),
          sentiment: this.analyzeSentiment(review.text || review.review_text || ''),
          platform: review.platform || review.source || 'unknown',
          helpful: review.helpful_count > 0 || false,
          verified: review.verified || false
        }));

        // Calculate analytics
        const totalReviews = processedReviews.length;
        const averageRating = totalReviews > 0 
          ? processedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
          : 0;

        const sentimentDistribution = {
          positive: processedReviews.filter(r => r.sentiment === 'positive').length,
          neutral: processedReviews.filter(r => r.sentiment === 'neutral').length,
          negative: processedReviews.filter(r => r.sentiment === 'negative').length
        };

        const recentReviews = processedReviews
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        const keyThemes = this.extractKeyThemes(processedReviews);
        const responseRate = this.calculateResponseRate(processedReviews);
        const recommendationScore = this.calculateRecommendationScore(processedReviews);

        const analysis: ReviewAnalysis = {
          averageRating,
          totalReviews,
          sentimentDistribution,
          recentReviews,
          keyThemes,
          responseRate,
          recommendationScore
        };

        // Cache the result
        cache.set(cacheKey, analysis);
        
        return analysis;

      } catch (error) {
        console.error('Zembratech reviews fetch failed:', error);
        
        // Return empty data structure when API fails
        return {
          averageRating: 0,
          totalReviews: 0,
          sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
          recentReviews: [],
          keyThemes: [],
          responseRate: 0,
          recommendationScore: 0
        };
      }
    });
  }

  async getReviewsStream(
    restaurantName: string,
    domain?: string,
    location?: string,
    onReview?: (review: ZembraReview) => void
  ): Promise<ZembraReview[]> {
    return limit(async () => {
      try {
        // Attempt to get authentic reviews from the API
        const analysis = await this.getRestaurantReviews(restaurantName, domain, location);
        
        // Stream authentic reviews with delay for real-time effect
        const reviews = analysis.recentReviews;
        
        if (onReview && reviews.length > 0) {
          for (const review of reviews) {
            onReview(review);
            // 2-second delay between reviews for streaming effect
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        return reviews;
      } catch (error) {
        console.error('Review streaming failed:', error);
        return [];
      }
    });
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .replace(/["'\\]/g, '') // Remove quotes and backslashes that break JSON
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\,\!\?\-\(\)]/g, '') // Keep only safe characters
      .trim()
      .substring(0, 300); // Limit length
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'perfect', 'outstanding', 'delicious', 'love', 'best', 'awesome', 'incredible', 'superb'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'disgusting', 'worst', 'bad', 'poor', 'disappointing', 'hate', 'nasty', 'rude', 'slow', 'cold'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractKeyThemes(reviews: ZembraReview[]): string[] {
    const themes: { [key: string]: number } = {};
    const commonThemes = [
      'food quality', 'service', 'atmosphere', 'price', 'cleanliness',
      'staff', 'wait time', 'portion size', 'taste', 'freshness',
      'ambiance', 'location', 'parking', 'value', 'presentation'
    ];

    reviews.forEach(review => {
      const text = review.text.toLowerCase();
      commonThemes.forEach(theme => {
        if (text.includes(theme) || text.includes(theme.replace(' ', ''))) {
          themes[theme] = (themes[theme] || 0) + 1;
        }
      });
    });

    return Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private calculateResponseRate(reviews: ZembraReview[]): number {
    const reviewsWithResponses = reviews.filter(r => r.helpful).length;
    return reviews.length > 0 ? (reviewsWithResponses / reviews.length) * 100 : 0;
  }

  private calculateRecommendationScore(reviews: ZembraReview[]): number {
    const positiveReviews = reviews.filter(r => r.sentiment === 'positive').length;
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) return 0;
    
    const baseScore = (positiveReviews / totalReviews) * 100;
    const verifiedBonus = reviews.filter(r => r.verified).length * 2;
    
    return Math.min(100, Math.round(baseScore + verifiedBonus));
  }

  clearCache(): void {
    cache.flushAll();
  }
}