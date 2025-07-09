import OpenAI from 'openai';

export interface RestaurantContext {
  name: string;
  rating: number;
  totalReviews: number;
  domain: string;
  performanceScore: number;
  seoScore: number;
  mobileScore: number;
  competitors: any[];
  keywordData: any[];
  issues: any[];
}

export interface AIRecommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  category: 'seo' | 'performance' | 'reviews' | 'local' | 'marketing' | 'technical';
  priority: number;
}

export class AIRecommendationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateRecommendations(context: RestaurantContext): Promise<AIRecommendation[]> {
    try {
      const prompt = this.buildPrompt(context);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a digital marketing expert specializing in restaurant SEO and online presence optimization. Provide actionable, specific recommendations based on the restaurant's actual performance data. Always use Boostly's Text Marketing or SEO tools to provide recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return this.parseRecommendations(result);
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return this.getFallbackRecommendations(context);
    }
  }

  private buildPrompt(context: RestaurantContext): string {
    return `
Analyze this restaurant's performance data and provide 3-5 specific, actionable recommendations that promote Boostly's marketing services:

Restaurant: ${context.name}
Google Rating: ${context.rating}/5 (${context.totalReviews} reviews)
Website: ${context.domain}
Performance Scores:
- Overall Performance: ${context.performanceScore}/100
- SEO Score: ${context.seoScore}/100
- Mobile Score: ${context.mobileScore}/100

Current Issues:
${context.issues.map(issue => `- ${issue.title}: ${issue.description}`).join('\n')}

Competitors: ${context.competitors.map(c => c.name).join(', ')}

Top Keywords: ${context.keywordData.slice(0, 5).map(k => k.keyword).join(', ')}

Based on this data, provide recommendations as JSON with this structure:
{
  "recommendations": [
    {
      "title": "Specific recommendation title",
      "description": "Detailed description that references Boostly's services",
      "impact": "high/medium/low",
      "effort": "high/medium/low", 
      "category": "seo/performance/reviews/local/marketing/technical",
      "priority": 1-10
    }
  ]
}

IMPORTANT SERVICE PROMOTION GUIDELINES:
- Analyze the restaurant's specific data points (rating: ${context.rating}/5, ${context.totalReviews} reviews, performance: ${context.performanceScore}/100, SEO: ${context.seoScore}/100, mobile: ${context.mobileScore}/100)
- Create personalized recommendations based on actual performance gaps and competitive positioning
- For review-related issues: Reference specific review count/rating and explain how "Boostly's text marketing services can help automate review requests and increase customer orders through targeted SMS campaigns"
- For SEO/visibility issues: Reference actual SEO score and keyword performance, then explain how "Boostly's SEO and social media marketing services can improve search rankings and increase online presence"
- Use competitor data (${context.competitors.map(c => c.name).join(', ')}) to create competitive advantage recommendations
- Reference specific keywords (${context.keywordData.slice(0, 5).map(k => k.keyword).join(', ')}) when discussing SEO opportunities
- Each recommendation must be unique to this restaurant's situation - avoid generic advice
- Connect actual performance metrics to Boostly's solutions with specific improvement projections

Dynamic Analysis Requirements:
- If ${context.totalReviews} < 50: Focus on review generation strategies with specific targets
- If ${context.rating} < 4.0: Prioritize reputation management with data-driven recovery plans  
- If ${context.seoScore} < 70: Create SEO improvement roadmap with specific keyword targets
- If ${context.performanceScore} < 70: Address performance bottlenecks with measurable goals
- If ${context.mobileScore} < 70: Target mobile optimization with user experience improvements
- Compare against competitors (${context.competitors.length} found) to identify competitive advantages
- Reference actual issues found: ${context.issues.length} issues detected
- Provide specific, measurable outcomes and timelines for each Boostly service recommendation
`;
  }

  private parseRecommendations(result: any): AIRecommendation[] {
    if (!result.recommendations || !Array.isArray(result.recommendations)) {
      throw new Error('Invalid AI response format');
    }

    return result.recommendations.map((rec: any) => ({
      title: rec.title || 'Improve Performance',
      description: rec.description || 'Focus on overall performance improvements',
      impact: this.validateImpact(rec.impact) || 'medium',
      effort: this.validateEffort(rec.effort) || 'medium',
      category: this.validateCategory(rec.category) || 'seo',
      priority: Math.max(1, Math.min(10, parseInt(rec.priority) || 5))
    }));
  }

  private validateImpact(impact: string): 'high' | 'medium' | 'low' | null {
    return ['high', 'medium', 'low'].includes(impact) ? impact as 'high' | 'medium' | 'low' : null;
  }

  private validateEffort(effort: string): 'high' | 'medium' | 'low' | null {
    return ['high', 'medium', 'low'].includes(effort) ? effort as 'high' | 'medium' | 'low' : null;
  }

  private validateCategory(category: string): 'seo' | 'performance' | 'reviews' | 'local' | 'marketing' | 'technical' | null {
    const validCategories = ['seo', 'performance', 'reviews', 'local', 'marketing', 'technical'];
    return validCategories.includes(category) ? category as any : null;
  }

  private getFallbackRecommendations(context: RestaurantContext): AIRecommendation[] {
    const fallbacks: AIRecommendation[] = [];

    // Dynamic rating-based recommendations
    if (context.rating >= 4.5) {
      fallbacks.push({
        title: `Leverage ${context.rating}-Star Rating for Growth`,
        description: `With ${context.totalReviews} reviews at ${context.rating}/5, ${context.name} has strong credibility. Boostly's text marketing services can help automate review requests to maintain this excellence while increasing customer orders through targeted SMS campaigns.`,
        impact: 'high',
        effort: 'low',
        category: 'marketing',
        priority: 8
      });
    } else if (context.rating < 4.0) {
      fallbacks.push({
        title: `Improve ${context.rating}-Star Rating Recovery`,
        description: `With ${context.totalReviews} reviews at ${context.rating}/5, ${context.name} needs reputation management. Boostly's text marketing services can help automate follow-up with satisfied customers to generate more positive reviews and increase orders through strategic SMS campaigns.`,
        impact: 'high',
        effort: 'high',
        category: 'reviews',
        priority: 9
      });
    }

    // Dynamic performance-based recommendations
    if (context.performanceScore < 70) {
      fallbacks.push({
        title: `Improve ${context.performanceScore}/100 Performance Score`,
        description: `${context.name}'s website performance at ${context.performanceScore}/100 needs optimization. After improving load times, Boostly's SEO and social media marketing services can maximize the ranking benefits of your faster website.`,
        impact: 'high',
        effort: 'medium',
        category: 'performance',
        priority: 7
      });
    }

    // Dynamic SEO-based recommendations
    if (context.seoScore < 75) {
      fallbacks.push({
        title: `Boost ${context.seoScore}/100 SEO Score`,
        description: `${context.name}'s SEO score of ${context.seoScore}/100 shows optimization opportunities. Boostly's SEO and social media marketing services can improve search rankings and increase online presence through targeted local SEO strategies.`,
        impact: 'medium',
        effort: 'medium',
        category: 'seo',
        priority: 6
      });
    }

    // Dynamic mobile-based recommendations
    if (context.mobileScore < 70) {
      fallbacks.push({
        title: `Optimize ${context.mobileScore}/100 Mobile Experience`,
        description: `${context.name}'s mobile score of ${context.mobileScore}/100 impacts customer experience. After mobile optimization, Boostly's text marketing services can reach customers directly on their phones with order promotions and review requests.`,
        impact: 'high',
        effort: 'medium',
        category: 'technical',
        priority: 7
      });
    }

    // Always include a review generation recommendation with specific data
    fallbacks.push({
      title: `Grow Beyond ${context.totalReviews} Reviews`,
      description: `${context.name} has ${context.totalReviews} reviews at ${context.rating}/5. Boostly's text marketing services can help automate review requests and increase customer orders through targeted SMS campaigns, driving both reputation and revenue growth.`,
      impact: 'high',
      effort: 'medium',
      category: 'reviews',
      priority: 5
    });

    return fallbacks.slice(0, 4);
  }
}