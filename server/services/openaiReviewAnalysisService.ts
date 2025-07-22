import OpenAI from 'openai';

export interface CustomerMoodAnalysis {
  overallMood: 'delighted' | 'satisfied' | 'mixed' | 'frustrated' | 'disappointed';
  sentimentSummary: string;
  keyMoodIndicators: string[];
  commonFeelings: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  customerPatterns: {
    frequentPraise: string[];
    commonComplaints: string[];
    surprisingInsights: string[];
  };
  emotionalThemes: {
    theme: string;
    emotion: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
  }[];
  businessInsights: {
    strengthsPerceived: string[];
    improvementOpportunities: string[];
    customerExpectations: string[];
  };
  recommendationConfidence: number; // 0-100
  loyaltySignals: {
    repeatCustomerMentions: number;
    recommendationLanguage: string[];
    disappointmentPatterns: string[];
  };
}

export class OpenAIReviewAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeCustomerMood(reviews: any[]): Promise<CustomerMoodAnalysis> {
    try {
      console.log(`Analyzing customer mood from ${reviews.length} reviews with OpenAI...`);

      // Extract review texts and combine them
      const reviewTexts = reviews
        .map(review => review.text || '')
        .filter(text => text.trim().length > 0)
        .slice(0, 100); // Ensure we don't exceed token limits

      if (reviewTexts.length === 0) {
        return this.getDefaultAnalysis();
      }

      const combinedReviews = reviewTexts.join('\n---REVIEW SEPARATOR---\n');
      
      const prompt = `You are an expert customer sentiment analyst. Analyze these ${reviewTexts.length} restaurant reviews and provide a comprehensive mood and sentiment analysis.

Reviews to analyze:
${combinedReviews}

Please provide a detailed analysis in JSON format with the following structure:
{
  "overallMood": "delighted|satisfied|mixed|frustrated|disappointed",
  "sentimentSummary": "A 2-3 sentence narrative summary of overall customer feelings and attitudes",
  "keyMoodIndicators": ["specific mood words/phrases that appear frequently"],
  "commonFeelings": {
    "positive": ["specific positive emotions expressed"],
    "negative": ["specific negative emotions expressed"], 
    "neutral": ["neutral or mixed feelings expressed"]
  },
  "customerPatterns": {
    "frequentPraise": ["what customers consistently praise"],
    "commonComplaints": ["what customers consistently complain about"],
    "surprisingInsights": ["unexpected or notable patterns"]
  },
  "emotionalThemes": [
    {
      "theme": "food quality",
      "emotion": "excitement",
      "frequency": 85,
      "impact": "high"
    }
  ],
  "businessInsights": {
    "strengthsPerceived": ["what customers see as strengths"],
    "improvementOpportunities": ["areas customers want improved"],
    "customerExpectations": ["what customers expect from this business"]
  },
  "recommendationConfidence": 75,
  "loyaltySignals": {
    "repeatCustomerMentions": 12,
    "recommendationLanguage": ["phrases showing loyalty/recommendations"],
    "disappointmentPatterns": ["phrases showing disappointment/churn risk"]
  }
}

Focus on capturing the emotional undertones, mood patterns, and customer psychology rather than just positive/negative counts. Look for subtle feelings like anticipation, nostalgia, pride, anxiety, etc.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert customer sentiment analyst specializing in restaurant review mood analysis. Provide detailed, insightful analysis of customer emotions and attitudes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const analysisText = response.choices[0].message.content;
      if (!analysisText) {
        throw new Error('No analysis content received from OpenAI');
      }

      const analysis = JSON.parse(analysisText) as CustomerMoodAnalysis;
      console.log(`OpenAI mood analysis completed. Overall mood: ${analysis.overallMood}`);
      
      return analysis;

    } catch (error) {
      console.error('OpenAI mood analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  private getDefaultAnalysis(): CustomerMoodAnalysis {
    return {
      overallMood: 'mixed',
      sentimentSummary: 'Customer mood analysis unavailable - OpenAI analysis could not be completed.',
      keyMoodIndicators: [],
      commonFeelings: {
        positive: [],
        negative: [],
        neutral: []
      },
      customerPatterns: {
        frequentPraise: [],
        commonComplaints: [],
        surprisingInsights: []
      },
      emotionalThemes: [],
      businessInsights: {
        strengthsPerceived: [],
        improvementOpportunities: [],
        customerExpectations: []
      },
      recommendationConfidence: 0,
      loyaltySignals: {
        repeatCustomerMentions: 0,
        recommendationLanguage: [],
        disappointmentPatterns: []
      }
    };
  }
}