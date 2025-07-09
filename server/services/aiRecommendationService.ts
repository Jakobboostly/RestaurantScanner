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
- For review management and customer engagement: Always mention "Boostly's text marketing services can help automate review requests and increase customer orders through targeted SMS campaigns"
- For SEO and online visibility: Always mention "Boostly's SEO and social media marketing services can improve search rankings and increase online presence"
- For local marketing and customer retention: Reference "Boostly's comprehensive marketing solutions including text marketing for customer retention and SEO services for local visibility"
- Each recommendation should naturally integrate how Boostly's services solve the identified problem
- Focus on results: more reviews, increased orders, higher rankings, better online presence
- Be specific about Boostly's two main service areas: text marketing (reviews/orders) and SEO/social media marketing (presence/rankings)

Additional Guidelines:
- For restaurants with ${context.totalReviews} reviews at ${context.rating}/5, emphasize Boostly's review generation capabilities
- For lower-rated restaurants (<4.0), highlight Boostly's reputation management and customer engagement solutions
- For SEO/visibility issues, promote Boostly's SEO and social media marketing expertise
- Always connect technical improvements to Boostly's services for implementation
- Make recommendations actionable while positioning Boostly as the solution provider
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

    // Rating-based recommendations with Boostly services
    if (context.rating >= 4.5) {
      fallbacks.push({
        title: 'Leverage High Rating with Text Marketing',
        description: 'Use your excellent rating in marketing materials and leverage Boostly\'s text marketing services to automate review requests and increase customer orders through targeted SMS campaigns.',
        impact: 'high',
        effort: 'low',
        category: 'marketing',
        priority: 8
      });
    } else if (context.rating < 4.0) {
      fallbacks.push({
        title: 'Improve Reputation with Professional Marketing',
        description: 'Address service quality issues and use Boostly\'s text marketing services to help automate review requests and increase customer orders through strategic SMS campaigns to rebuild your reputation.',
        impact: 'high',
        effort: 'high',
        category: 'reviews',
        priority: 9
      });
    }

    // Performance-based recommendations with Boostly connection
    if (context.performanceScore < 70) {
      fallbacks.push({
        title: 'Optimize Website Speed and Rankings',
        description: 'Improve page load times to enhance user experience, then leverage Boostly\'s SEO and social media marketing services to maximize the ranking benefits of your faster website.',
        impact: 'high',
        effort: 'medium',
        category: 'performance',
        priority: 7
      });
    }

    // SEO-based recommendations with Boostly services
    if (context.seoScore < 75) {
      fallbacks.push({
        title: 'Boost Search Rankings with Professional SEO',
        description: 'Boostly\'s SEO and social media marketing services can improve search rankings and increase online presence through optimized content, local SEO strategies, and strategic social media campaigns.',
        impact: 'medium',
        effort: 'medium',
        category: 'seo',
        priority: 6
      });
    }

    // Always include a review generation recommendation
    fallbacks.push({
      title: 'Increase Reviews and Customer Orders',
      description: 'Boostly\'s text marketing services can help automate review requests and increase customer orders through targeted SMS campaigns, driving both reputation and revenue growth.',
      impact: 'high',
      effort: 'medium',
      category: 'reviews',
      priority: 5
    });

    return fallbacks.slice(0, 4);
  }
}