export class OpenAIReviewAnalysisService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async analyzeCustomerMood(reviews: any[], restaurantContext?: { name?: string; type?: 'QSR' | 'FSR'; locationCount?: number }) {
    // For now, provide realistic analysis based on review data
    if (!reviews || reviews.length === 0) {
      return this.getDefaultAnalysis();
    }

    console.log('🧠 Analyzing customer mood from', reviews.length, 'reviews');

    // Calculate detailed sentiment distribution
    const sentimentDistribution = this.calculateSentimentDistribution(reviews);
    const ratings = reviews.map(r => r.rating || 0).filter(r => r > 0);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    let overallMood = 'satisfied';
    if (avgRating >= 4.5) overallMood = 'delighted';
    else if (avgRating >= 4.0) overallMood = 'satisfied'; 
    else if (avgRating >= 3.0) overallMood = 'mixed';
    else if (avgRating >= 2.0) overallMood = 'frustrated';
    else overallMood = 'disappointed';

    // Extract themes from review text with more detail
    const thematicAnalysis = this.performThematicAnalysis(reviews);

    // Generate AI-powered business insights with restaurant context
    const [strengthsPerceived, improvementOpportunities] = await Promise.all([
      this.extractStrengths(reviews, restaurantContext),
      this.extractImprovements(reviews, restaurantContext)
    ]);

    return {
      overallMood,
      sentimentSummary: this.generateSentimentSummary(overallMood, avgRating, reviews.length),
      sentimentDistribution,
      keyMoodIndicators: thematicAnalysis.topThemes,
      emotionalBreakdown: thematicAnalysis.emotions,
      businessInsights: {
        strengthsPerceived,
        improvementOpportunities
      },
      detailedMetrics: {
        totalReviews: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingDistribution: this.calculateRatingDistribution(reviews),
        sentimentTrends: this.analyzeSentimentTrends(reviews)
      }
    };
  }

  private calculateSentimentDistribution(reviews: any[]) {
    const total = reviews.length;
    if (total === 0) return { ecstatic: 0, delighted: 0, satisfied: 0, neutral: 0, frustrated: 0, disappointed: 0, angry: 0 };

    let ecstatic = 0, delighted = 0, satisfied = 0, neutral = 0, frustrated = 0, disappointed = 0, angry = 0;

    reviews.forEach(review => {
      const rating = review.rating || 0;
      const text = (review.text || '').toLowerCase();
      
      // Enhanced sentiment detection based on rating + text analysis
      if (rating === 5) {
        if (text.includes('amazing') || text.includes('incredible') || text.includes('outstanding') || text.includes('perfect')) {
          ecstatic++;
        } else {
          delighted++;
        }
      } else if (rating === 4) {
        if (text.includes('great') || text.includes('excellent') || text.includes('wonderful')) {
          delighted++;
        } else {
          satisfied++;
        }
      } else if (rating === 3) {
        if (text.includes('okay') || text.includes('decent') || text.includes('average')) {
          neutral++;
        } else {
          satisfied++;
        }
      } else if (rating === 2) {
        if (text.includes('disappointing') || text.includes('poor') || text.includes('bad')) {
          disappointed++;
        } else {
          frustrated++;
        }
      } else if (rating === 1) {
        if (text.includes('terrible') || text.includes('awful') || text.includes('worst') || text.includes('horrible')) {
          angry++;
        } else {
          disappointed++;
        }
      } else {
        neutral++; // No rating provided
      }
    });

    // Debug logging to track the categorization
    console.log('🔍 SENTIMENT DEBUG:', {
      totalReviews: total,
      rawCounts: { ecstatic, delighted, satisfied, neutral, frustrated, disappointed, angry },
      sumOfCounts: ecstatic + delighted + satisfied + neutral + frustrated + disappointed + angry
    });

    // Calculate exact percentages first
    const exactPercentages = {
      ecstatic: (ecstatic / total) * 100,
      delighted: (delighted / total) * 100,
      satisfied: (satisfied / total) * 100,
      neutral: (neutral / total) * 100,
      frustrated: (frustrated / total) * 100,
      disappointed: (disappointed / total) * 100,
      angry: (angry / total) * 100
    };

    // Round percentages and ensure they add up to 100%
    const roundedPercentages = {
      ecstatic: Math.round(exactPercentages.ecstatic),
      delighted: Math.round(exactPercentages.delighted),
      satisfied: Math.round(exactPercentages.satisfied),
      neutral: Math.round(exactPercentages.neutral),
      frustrated: Math.round(exactPercentages.frustrated),
      disappointed: Math.round(exactPercentages.disappointed),
      angry: Math.round(exactPercentages.angry)
    };

    // Fix rounding errors to ensure total = 100%
    const currentSum = Object.values(roundedPercentages).reduce((sum, val) => sum + val, 0);
    const difference = 100 - currentSum;
    
    if (difference !== 0) {
      // Find the category with the largest remainder to adjust
      const remainders = Object.entries(exactPercentages).map(([key, value]) => ({
        key,
        remainder: Math.abs(value - Math.round(value))
      }));
      
      remainders.sort((a, b) => b.remainder - a.remainder);
      const adjustKey = remainders[0].key as keyof typeof roundedPercentages;
      roundedPercentages[adjustKey] += difference;
    }

    const finalSum = Object.values(roundedPercentages).reduce((sum, val) => sum + val, 0);
    console.log('🔍 PERCENTAGE DEBUG:', {
      exactPercentages,
      roundedPercentages,
      finalSum,
      shouldEqual100: finalSum === 100
    });

    return roundedPercentages;
  }

  private performThematicAnalysis(reviews: any[]) {
    const allText = reviews.map(r => r.text || '').join(' ').toLowerCase();
    
    // Comprehensive theme detection
    const themes = {
      'food quality': (allText.match(/(delicious|tasty|flavor|fresh|quality|good food|great food)/g) || []).length,
      'service excellence': (allText.match(/(friendly|helpful|attentive|professional|polite|kind)/g) || []).length,
      'atmosphere': (allText.match(/(cozy|ambiance|atmosphere|beautiful|comfortable|nice place)/g) || []).length,
      'value for money': (allText.match(/(reasonable|affordable|worth it|good value|fair price)/g) || []).length,
      'speed of service': (allText.match(/(quick|fast|prompt|timely|efficient)/g) || []).length,
      'cleanliness': (allText.match(/(clean|spotless|hygienic|tidy|well-maintained)/g) || []).length,
      'slow service': (allText.match(/(slow|wait|waiting|took forever|long time)/g) || []).length,
      'poor service': (allText.match(/(rude|unprofessional|bad service|terrible service|poor service)/g) || []).length,
      'overpriced': (allText.match(/(expensive|overpriced|too much|costly|pricey)/g) || []).length,
      'food issues': (allText.match(/(cold|burnt|undercooked|stale|bad taste|terrible food)/g) || []).length
    };

    // Get top themes (positive and negative)
    const sortedThemes = Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .filter(([,count]) => count > 0)
      .map(([theme, count]) => ({ theme, mentions: count }));

    // Emotional analysis
    const emotions = {
      joy: (allText.match(/(love|amazing|fantastic|wonderful|excited|happy|thrilled)/g) || []).length,
      satisfaction: (allText.match(/(satisfied|pleased|good|great|nice|enjoyed)/g) || []).length,
      disappointment: (allText.match(/(disappointed|expected better|not impressed|mediocre)/g) || []).length,
      frustration: (allText.match(/(frustrating|annoying|irritating|upset|bothered)/g) || []).length,
      anger: (allText.match(/(angry|furious|outraged|terrible|awful|disgusted)/g) || []).length
    };

    return {
      topThemes: sortedThemes,
      emotions
    };
  }

  private calculateRatingDistribution(reviews: any[]) {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = reviews.length;

    reviews.forEach(review => {
      const rating = review.rating || 0;
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });

    // Convert to percentages
    Object.keys(distribution).forEach(key => {
      const numKey = parseInt(key) as keyof typeof distribution;
      distribution[numKey] = Math.round((distribution[numKey] / total) * 100);
    });

    return distribution;
  }

  private analyzeSentimentTrends(reviews: any[]) {
    // Sort reviews by date if available, or use most recent
    const sortedReviews = reviews.sort((a, b) => {
      const dateA = new Date(a.time || a.date || 0).getTime();
      const dateB = new Date(b.time || b.date || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    const recentReviews = sortedReviews.slice(0, Math.min(10, reviews.length));
    const olderReviews = sortedReviews.slice(10);

    const recentAvg = recentReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / recentReviews.length;
    const olderAvg = olderReviews.length > 0 ? olderReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / olderReviews.length : recentAvg;

    let trend = 'stable';
    if (recentAvg > olderAvg + 0.3) trend = 'improving';
    else if (recentAvg < olderAvg - 0.3) trend = 'declining';

    return {
      trend,
      recentAverageRating: Math.round(recentAvg * 10) / 10,
      previousAverageRating: Math.round(olderAvg * 10) / 10,
      recentReviewsCount: recentReviews.length
    };
  }

  private generateSentimentSummary(mood: string, rating: number, reviewCount: number): string {
    const templates = {
      delighted: `Customers are genuinely thrilled with their experience. With an average ${rating.toFixed(1)}/5 rating across ${reviewCount} recent reviews, your restaurant consistently exceeds expectations.`,
      satisfied: `Customers have positive experiences overall. Your ${rating.toFixed(1)}/5 rating from ${reviewCount} recent reviews shows solid satisfaction with room for growth.`,
      mixed: `Customer opinions are divided. The ${rating.toFixed(1)}/5 rating from ${reviewCount} recent reviews suggests some great experiences mixed with areas needing attention.`,
      frustrated: `Customers are expressing concerns. The ${rating.toFixed(1)}/5 rating from ${reviewCount} recent reviews indicates significant opportunities for improvement.`,
      disappointed: `Customers are having poor experiences. The ${rating.toFixed(1)}/5 rating from ${reviewCount} recent reviews requires immediate attention to core service issues.`
    };

    return templates[mood as keyof typeof templates] || templates.satisfied;
  }

  private async extractStrengths(reviews: any[], restaurantContext?: { name?: string; type?: 'QSR' | 'FSR'; locationCount?: number }): Promise<string[]> {
    if (!this.apiKey) {
      return ['Google Business Profile established', 'Customer reviews available', 'Local presence confirmed'];
    }

    try {
      // Get a sample of positive reviews for analysis
      const positiveReviews = reviews
        .filter(r => r.rating >= 4)
        .slice(0, 20) // Analyze up to 20 positive reviews
        .map(r => r.text || '')
        .filter(text => text.length > 10);

      if (positiveReviews.length === 0) {
        return ['Business maintains online presence', 'Customer feedback available for improvement'];
      }

      const reviewText = positiveReviews.join('\n---\n');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are analyzing customer reviews for a ${restaurantContext?.type || 'restaurant'} ${restaurantContext?.locationCount && restaurantContext.locationCount > 1 ? 'with multiple locations' : 'business'} to identify what customers specifically love. Focus on concrete, specific strengths that customers mention. Format each strength as a complete sentence that could be used to promote Boostly's marketing services (text messaging to bring customers back and build text clubs for promotions, social media management, SEO, and review management). Consider the restaurant type when suggesting services - QSR focuses on speed/convenience, FSR focuses on experience/ambiance. Limit to 3 most important strengths.`
            },
            {
              role: 'user',
              content: `Analyze these positive customer reviews and identify the top 3 specific things customers love most. Focus on concrete details, not generic praise:

${reviewText}

Return exactly 3 strengths in this format, suggesting which Boostly service could amplify each strength:
1. [Specific strength based on actual customer language] - [suggest text messaging for customer retention and text club promotions, social media, SEO, or review management to leverage this]
2. [Specific strength based on actual customer language] - [suggest text messaging for customer retention and text club promotions, social media, SEO, or review management to leverage this]
3. [Specific strength based on actual customer language] - [suggest text messaging for customer retention and text club promotions, social media, SEO, or review management to leverage this]`
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        console.log('OpenAI API error for strengths analysis:', response.status);
        return ['Positive customer feedback available', 'Restaurant maintains good reputation', 'Customer engagement opportunities exist'];
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      
      // Parse the numbered list response and extract service recommendations
      const strengthsWithServices = this.parseServiceRecommendations(content, 'strength');
      
      return strengthsWithServices.length > 0 ? strengthsWithServices : ['Customer reviews show positive experiences', 'Business maintains active online presence'];

    } catch (error) {
      console.error('Error in OpenAI strengths analysis:', error);
      return ['Restaurant has established customer base', 'Online reviews available for analysis', 'Local business presence confirmed'];
    }
  }

  private async extractImprovements(reviews: any[], restaurantContext?: { name?: string; type?: 'QSR' | 'FSR'; locationCount?: number }): Promise<string[]> {
    if (!this.apiKey) {
      return ['Respond to customer feedback promptly', 'Engage with reviews to show you care', 'Use feedback to improve operations'];
    }

    try {
      // Get critical reviews (3 stars and below) and constructive 4-star reviews
      const criticalReviews = reviews
        .filter(r => r.rating <= 3 || (r.rating === 4 && (r.text || '').length > 50))
        .slice(0, 20) // Analyze up to 20 critical reviews
        .map(r => r.text || '')
        .filter(text => text.length > 10);

      if (criticalReviews.length === 0) {
        return ['Maintain current high standards', 'Continue engaging with customer feedback', 'Monitor reviews for improvement opportunities'];
      }

      const reviewText = criticalReviews.join('\n---\n');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are analyzing customer reviews for a ${restaurantContext?.type || 'restaurant'} ${restaurantContext?.locationCount && restaurantContext.locationCount > 1 ? 'with multiple locations' : 'business'} to identify specific improvement opportunities that Boostly's marketing services can address. Boostly offers: text messaging (SMS to bring customers back and build a text club for promotions), social media management (TikTok, Instagram, Facebook ads), SEO services, and review management. Focus on concrete, actionable issues that customers mention and match them to the most appropriate Boostly service. Consider the restaurant type - QSR customers value speed/convenience, FSR customers value experience/ambiance. Limit to 3 most important opportunities.`
            },
            {
              role: 'user',
              content: `Analyze these customer reviews and identify the top 3 specific improvement opportunities that Boostly's marketing services can address. Focus on actual customer complaints and concerns:

${reviewText}

Return exactly 3 improvements in this format, matching each issue to the best Boostly service:
1. [Specific issue customers mention] - [text messaging for customer retention and text club promotions/social media/SEO/review management] can address this by [specific solution]
2. [Specific issue customers mention] - [text messaging for customer retention and text club promotions/social media/SEO/review management] can address this by [specific solution]  
3. [Specific issue customers mention] - [text messaging for customer retention and text club promotions/social media/SEO/review management] can address this by [specific solution]

Guidelines:
- Long wait times → text messaging to bring customers back during slow times and build a text club for promotions
- Poor online visibility → SEO services
- Lack of atmosphere/ambiance awareness → social media content
- Negative reviews/reputation issues → review management
- Competition/discovery issues → Facebook ads or SEO`
            }
          ],
          max_tokens: 400,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        console.log('OpenAI API error for improvements analysis:', response.status);
        return ['Respond to negative feedback quickly', 'Address customer concerns in reviews', 'Show customers you value their input'];
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      
      // Parse the numbered list response and extract service recommendations
      const improvementsWithServices = this.parseServiceRecommendations(content, 'improvement');
      
      return improvementsWithServices.length > 0 ? improvementsWithServices : ['Address customer feedback promptly', 'Show responsiveness to reviews', 'Demonstrate commitment to improvement'];

    } catch (error) {
      console.error('Error in OpenAI improvements analysis:', error);
      return ['Engage with customer reviews regularly', 'Address concerns raised in feedback', 'Show customers you listen to their input'];
    }
  }

  private parseServiceRecommendations(content: string, type: 'strength' | 'improvement'): string[] {
    const lines = content
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);

    return lines.map(line => {
      // Extract the main insight and service recommendation
      const parts = line.split(' - ');
      if (parts.length >= 2) {
        const insight = parts[0].trim();
        const serviceRecommendation = parts[1].trim().toLowerCase();
        
        // Map service recommendations to user-friendly text
        let serviceText = '';
        if (serviceRecommendation.includes('text marketing') || serviceRecommendation.includes('sms')) {
          serviceText = type === 'strength' 
            ? 'text messaging can bring happy customers back by inviting them to join your text club for exclusive promotions' 
            : 'text messaging can bring customers back to your restaurant and build a loyal text club for promotions';
        } else if (serviceRecommendation.includes('social media') || serviceRecommendation.includes('instagram') || serviceRecommendation.includes('tiktok') || serviceRecommendation.includes('facebook')) {
          serviceText = type === 'strength' 
            ? 'social media marketing can showcase this strength' 
            : 'social media marketing can improve this area';
        } else if (serviceRecommendation.includes('seo') || serviceRecommendation.includes('search')) {
          serviceText = type === 'strength' 
            ? 'SEO services can leverage this for better visibility' 
            : 'SEO services can solve this visibility issue';
        } else if (serviceRecommendation.includes('review management') || serviceRecommendation.includes('review')) {
          serviceText = type === 'strength' 
            ? 'review management can highlight this positive aspect' 
            : 'review management can address this concern';
        } else {
          // Default fallback
          serviceText = type === 'strength' 
            ? 'Boostly marketing services can amplify this' 
            : 'Boostly marketing services can improve this';
        }
        
        return `${insight} - ${serviceText}`;
      }
      
      // Fallback if parsing fails
      return line;
    });
  }

  async getDefaultAnalysis() {
    return {
      overallMood: "satisfied",
      sentimentSummary: "Customer sentiment analysis unavailable - using business profile data for insights",
      keyMoodIndicators: ["service", "food quality", "atmosphere"],
      businessInsights: {
        strengthsPerceived: ["Established local presence", "Google Business Profile active"],
        improvementOpportunities: ["Increase review engagement", "Expand online visibility"]
      }
    };
  }
}