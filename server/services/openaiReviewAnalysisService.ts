export class OpenAIReviewAnalysisService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async analyzeCustomerMood(reviews: any[]) {
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

    return {
      overallMood,
      sentimentSummary: this.generateSentimentSummary(overallMood, avgRating, reviews.length),
      sentimentDistribution,
      keyMoodIndicators: thematicAnalysis.topThemes,
      emotionalBreakdown: thematicAnalysis.emotions,
      businessInsights: {
        strengthsPerceived: this.extractStrengths(reviews),
        improvementOpportunities: this.extractImprovements(reviews)
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

    return {
      ecstatic: Math.round((ecstatic / total) * 100),
      delighted: Math.round((delighted / total) * 100),
      satisfied: Math.round((satisfied / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      frustrated: Math.round((frustrated / total) * 100),
      disappointed: Math.round((disappointed / total) * 100),
      angry: Math.round((angry / total) * 100)
    };
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
      delighted: `Customers are genuinely thrilled with their experience. With an average ${rating.toFixed(1)}/5 rating across ${reviewCount} reviews, your restaurant consistently exceeds expectations.`,
      satisfied: `Customers have positive experiences overall. Your ${rating.toFixed(1)}/5 rating from ${reviewCount} reviews shows solid satisfaction with room for growth.`,
      mixed: `Customer opinions are divided. The ${rating.toFixed(1)}/5 rating from ${reviewCount} reviews suggests some great experiences mixed with areas needing attention.`,
      frustrated: `Customers are expressing concerns. The ${rating.toFixed(1)}/5 rating from ${reviewCount} reviews indicates significant opportunities for improvement.`,
      disappointed: `Customers are having poor experiences. The ${rating.toFixed(1)}/5 rating from ${reviewCount} reviews requires immediate attention to core service issues.`
    };

    return templates[mood as keyof typeof templates] || templates.satisfied;
  }

  private extractStrengths(reviews: any[]): string[] {
    const strengths = [];
    const allText = reviews.map(r => r.text || '').join(' ').toLowerCase();
    
    if (allText.includes('food') && (allText.includes('great') || allText.includes('delicious'))) {
      strengths.push('Customers consistently praise the food quality');
    }
    if (allText.includes('service') && (allText.includes('good') || allText.includes('friendly'))) {
      strengths.push('Service staff receives positive feedback');
    }
    if (allText.includes('atmosphere') || allText.includes('ambiance')) {
      strengths.push('Restaurant atmosphere creates positive dining experience');
    }
    
    return strengths.slice(0, 3);
  }

  private extractImprovements(reviews: any[]): string[] {
    const improvements = [];
    const allText = reviews.map(r => r.text || '').join(' ').toLowerCase();
    
    if (allText.includes('slow') || allText.includes('wait')) {
      improvements.push('Service speed could be improved during busy periods');
    }
    if (allText.includes('expensive') || allText.includes('price')) {
      improvements.push('Value perception could be enhanced with portion sizes or pricing');
    }
    if (allText.includes('dirty') || allText.includes('clean')) {
      improvements.push('Cleanliness standards need attention in dining areas');
    }
    
    return improvements.slice(0, 3);
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