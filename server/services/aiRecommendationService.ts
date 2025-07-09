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
            content: "You are a digital marketing expert specializing in restaurant SEO and online presence optimization. Provide actionable, specific recommendations based on the restaurant's actual performance data."
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
Analyze this restaurant's performance data and provide 3-5 specific, actionable recommendations:

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
      "description": "Detailed description of what to do",
      "impact": "high/medium/low",
      "effort": "high/medium/low", 
      "category": "seo/performance/reviews/local/marketing/technical",
      "priority": 1-10
    }
  ]
}

Guidelines:
- For high-rated restaurants (4.5+), focus on maintaining excellence and leveraging strengths
- For lower-rated restaurants (<4.0), prioritize reputation management
- Consider actual performance scores when recommending technical improvements
- Be specific about implementation steps
- Prioritize recommendations by potential impact and effort required
- Don't recommend generic advice - make it specific to this restaurant's situation
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

    // Rating-based recommendations
    if (context.rating >= 4.5) {
      fallbacks.push({
        title: 'Leverage High Rating for Marketing',
        description: 'Use your excellent rating in marketing materials and encourage customer testimonials',
        impact: 'high',
        effort: 'low',
        category: 'marketing',
        priority: 8
      });
    } else if (context.rating < 4.0) {
      fallbacks.push({
        title: 'Focus on Customer Service Improvements',
        description: 'Address service quality issues to improve customer satisfaction and ratings',
        impact: 'high',
        effort: 'high',
        category: 'reviews',
        priority: 9
      });
    }

    // Performance-based recommendations
    if (context.performanceScore < 70) {
      fallbacks.push({
        title: 'Optimize Website Speed',
        description: 'Improve page load times to enhance user experience and search rankings',
        impact: 'high',
        effort: 'medium',
        category: 'performance',
        priority: 7
      });
    }

    // SEO-based recommendations
    if (context.seoScore < 75) {
      fallbacks.push({
        title: 'Enhance SEO Strategy',
        description: 'Improve on-page SEO elements like meta descriptions and keyword optimization',
        impact: 'medium',
        effort: 'medium',
        category: 'seo',
        priority: 6
      });
    }

    return fallbacks.slice(0, 3);
  }
}