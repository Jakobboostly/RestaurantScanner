import axios from 'axios';

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  key_phrases: string[];
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  rating: number;
  user_ratings_total: number;
}

export class GoogleReviewsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getReviews(placeId: string): Promise<GoogleReviewsResponse> {
    try {
      console.log('Fetching Google reviews for place ID:', placeId);
      
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'reviews,rating,user_ratings_total',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      const result = response.data.result;
      const reviews = result.reviews || [];
      
      // Process and enhance reviews with sentiment analysis
      const processedReviews: GoogleReview[] = reviews.slice(0, 5).map((review: any) => ({
        author_name: review.author_name,
        author_url: review.author_url,
        language: review.language,
        profile_photo_url: review.profile_photo_url,
        rating: review.rating,
        relative_time_description: review.relative_time_description,
        text: review.text,
        time: review.time,
        sentiment: this.analyzeSentiment(review.text, review.rating),
        key_phrases: this.extractKeyPhrases(review.text)
      }));

      return {
        reviews: processedReviews,
        rating: result.rating || 0,
        user_ratings_total: result.user_ratings_total || 0
      };

    } catch (error) {
      console.error('Google Reviews API failed:', error);
      return {
        reviews: [],
        rating: 0,
        user_ratings_total: 0
      };
    }
  }

  private analyzeSentiment(text: string, rating: number): 'positive' | 'neutral' | 'negative' {
    // Primary sentiment based on rating
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    
    // Secondary sentiment analysis based on text content
    const positiveWords = ['excellent', 'amazing', 'great', 'fantastic', 'wonderful', 'outstanding', 'perfect', 'love', 'best', 'delicious', 'awesome', 'incredible', 'superb'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'bad', 'disappointing', 'disgusting', 'rude', 'slow', 'cold', 'overpriced', 'dirty'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractKeyPhrases(text: string): string[] {
    // Extract key phrases from review text
    const phrases = [];
    const lowerText = text.toLowerCase();
    
    // Food-related phrases
    if (lowerText.includes('food') || lowerText.includes('meal') || lowerText.includes('dish')) {
      phrases.push('food quality');
    }
    
    // Service-related phrases
    if (lowerText.includes('service') || lowerText.includes('staff') || lowerText.includes('waiter') || lowerText.includes('server')) {
      phrases.push('service');
    }
    
    // Atmosphere-related phrases
    if (lowerText.includes('atmosphere') || lowerText.includes('ambiance') || lowerText.includes('decor')) {
      phrases.push('atmosphere');
    }
    
    // Value-related phrases
    if (lowerText.includes('price') || lowerText.includes('value') || lowerText.includes('expensive') || lowerText.includes('cheap')) {
      phrases.push('value');
    }
    
    // Location-related phrases
    if (lowerText.includes('location') || lowerText.includes('parking') || lowerText.includes('convenient')) {
      phrases.push('location');
    }
    
    // Wait time phrases
    if (lowerText.includes('wait') || lowerText.includes('fast') || lowerText.includes('slow') || lowerText.includes('quick')) {
      phrases.push('wait time');
    }
    
    return phrases.slice(0, 3); // Return top 3 key phrases
  }
}