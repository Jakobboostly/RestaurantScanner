import OpenAI from 'openai';

export interface RecommendationRequest {
  category: 'search' | 'social' | 'reviews' | 'local';
  priority: 'high' | 'medium' | 'low';
  score: number;
  restaurantName: string;
  cuisine?: string;
  location?: string;
  specificData?: {
    // Search-specific data
    missingKeywords?: string[];
    currentRankings?: { keyword: string; position: number | null }[];
    competitors?: string[];
    localPackVisibility?: number;
    
    // Social-specific data
    activePlatforms?: string[];
    followerCounts?: { platform: string; count: number }[];
    postFrequency?: string;
    
    // Review-specific data
    totalReviews?: number;
    averageRating?: number;
    recentReviews?: number;
    responseRate?: number;
    
    // Local-specific data
    googleBusinessClaimed?: boolean;
    businessHours?: boolean;
    photos?: number;
    verificationStatus?: string;
  };
}

export interface RecommendationResponse {
  recommendations: string[];
  context: string;
  urgency: 'critical' | 'important' | 'optimize';
}

export class AIRecommendationEngine {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Expert restaurant marketing consultant. Provide 3-4 specific, actionable recommendations focused on revenue impact. Consider cuisine type, location, and performance data.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseResponse(content, request.priority);

    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  private buildPrompt(request: RecommendationRequest): string {
    const { category, priority, score, restaurantName, cuisine, location, specificData } = request;
    
    let prompt = `Generate ${priority} priority recommendations for ${restaurantName}`;
    if (cuisine) prompt += `, a ${cuisine} restaurant`;
    if (location) prompt += ` in ${location}`;
    
    prompt += `.\n\nCategory: ${category.toUpperCase()}\nCurrent Score: ${score}/100\nPriority Level: ${priority.toUpperCase()}\n\n`;

    // Add category-specific context
    switch (category) {
      case 'search':
        prompt += `SEARCH & LOCAL SEO CONTEXT:\n`;
        if (specificData?.localPackVisibility !== undefined) {
          prompt += `- Local pack visibility: ${specificData.localPackVisibility}%\n`;
        }
        if (specificData?.missingKeywords?.length) {
          prompt += `- Missing important keywords: ${specificData.missingKeywords.slice(0, 5).join(', ')}\n`;
        }
        if (specificData?.currentRankings?.length) {
          const poorRankings = specificData.currentRankings.filter(r => !r.position || r.position > 10);
          if (poorRankings.length > 0) {
            prompt += `- Poor rankings for: ${poorRankings.slice(0, 3).map(r => `"${r.keyword}" (${r.position ? `#${r.position}` : 'not ranking'})`).join(', ')}\n`;
          }
        }
        if (specificData?.competitors?.length) {
          prompt += `- Main competitors: ${specificData.competitors.slice(0, 3).join(', ')}\n`;
        }
        break;

      case 'social':
        prompt += `SOCIAL MEDIA CONTEXT:\n`;
        if (specificData?.activePlatforms?.length) {
          prompt += `- Active platforms: ${specificData.activePlatforms.join(', ')}\n`;
        } else {
          prompt += `- No active social media presence detected\n`;
        }
        if (specificData?.followerCounts?.length) {
          prompt += `- Follower counts: ${specificData.followerCounts.map(f => `${f.platform}: ${f.count}`).join(', ')}\n`;
        }
        if (specificData?.postFrequency) {
          prompt += `- Posting frequency: ${specificData.postFrequency}\n`;
        }
        break;

      case 'reviews':
        prompt += `REVIEW MANAGEMENT CONTEXT:\n`;
        if (specificData?.totalReviews !== undefined) {
          prompt += `- Total reviews: ${specificData.totalReviews}\n`;
        }
        if (specificData?.averageRating !== undefined) {
          prompt += `- Average rating: ${specificData.averageRating}/5 stars\n`;
        }
        if (specificData?.responseRate !== undefined) {
          prompt += `- Owner response rate: ${specificData.responseRate}%\n`;
        }
        if (specificData?.recentReviews !== undefined) {
          prompt += `- Recent reviews (last 30 days): ${specificData.recentReviews}\n`;
        }
        break;

      case 'local':
        prompt += `LOCAL BUSINESS PRESENCE CONTEXT:\n`;
        if (specificData?.googleBusinessClaimed !== undefined) {
          prompt += `- Google Business Profile claimed: ${specificData.googleBusinessClaimed ? 'Yes' : 'No'}\n`;
        }
        if (specificData?.verificationStatus) {
          prompt += `- Verification status: ${specificData.verificationStatus}\n`;
        }
        if (specificData?.photos !== undefined) {
          prompt += `- Business photos: ${specificData.photos}\n`;
        }
        if (specificData?.businessHours !== undefined) {
          prompt += `- Business hours updated: ${specificData.businessHours ? 'Yes' : 'No'}\n`;
        }
        break;
    }

    prompt += `\nProvide 3-4 actionable recommendations for ${category} performance. Format:
RECOMMENDATIONS:
• [recommendation 1]
• [recommendation 2] 
• [recommendation 3]
CONTEXT: [why these are critical now]`;

    return prompt;
  }

  private parseResponse(content: string, priority: string): RecommendationResponse {
    const lines = content.split('\n').filter(line => line.trim());
    
    let recommendations: string[] = [];
    let context = '';
    let inRecommendations = false;
    let inContext = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('recommendations:')) {
        inRecommendations = true;
        inContext = false;
        continue;
      }
      
      if (trimmed.toLowerCase().includes('context:')) {
        inRecommendations = false;
        inContext = true;
        continue;
      }
      
      if (inRecommendations && trimmed.startsWith('•')) {
        recommendations.push(trimmed.substring(1).trim());
      }
      
      if (inContext && trimmed) {
        context += trimmed + ' ';
      }
    }

    // Fallback parsing if structured format not found
    if (recommendations.length === 0) {
      const bulletPoints = content.split('\n').filter(line => 
        line.trim().startsWith('•') || 
        line.trim().startsWith('-') || 
        line.trim().match(/^\d+\./)
      );
      
      recommendations = bulletPoints.map(point => 
        point.replace(/^[•\-\d\.]\s*/, '').trim()
      ).filter(rec => rec.length > 10);
    }

    // Extract urgency based on priority
    let urgency: 'critical' | 'important' | 'optimize';
    switch (priority) {
      case 'high': urgency = 'critical'; break;
      case 'medium': urgency = 'important'; break;
      default: urgency = 'optimize'; break;
    }

    return {
      recommendations: recommendations.slice(0, 4), // Max 4 recommendations
      context: context.trim() || `${priority.charAt(0).toUpperCase() + priority.slice(1)} priority improvements needed for better performance.`,
      urgency
    };
  }

  private getFallbackRecommendations(request: RecommendationRequest): RecommendationResponse {
    const { category, priority } = request;
    
    const fallbacks = {
      search: {
        high: [
          "Optimize Google Business Profile with complete information",
          "Target local keywords like '[cuisine] near me' in content",
          "Build citations on local directory sites",
          "Create location-specific landing pages"
        ],
        medium: [
          "Improve website loading speed for better rankings",
          "Add schema markup for restaurant information",
          "Create content around seasonal menu items",
          "Optimize for voice search queries"
        ],
        low: [
          "Monitor and track keyword performance monthly",
          "Create blog content about local food culture",
          "Optimize images with descriptive alt text",
          "Build relationships with local food bloggers"
        ]
      },
      social: {
        high: [
          "Create Instagram and Facebook business profiles",
          "Post high-quality food photos daily",
          "Engage with customer comments and messages",
          "Run targeted ads to local food lovers"
        ],
        medium: [
          "Increase posting frequency to 3-5 times per week",
          "Use Instagram Stories for behind-the-scenes content",
          "Partner with local food influencers",
          "Create user-generated content campaigns"
        ],
        low: [
          "Experiment with Instagram Reels and TikTok",
          "Share customer testimonials and reviews",
          "Post about staff and restaurant culture",
          "Use trending hashtags relevant to your cuisine"
        ]
      },
      reviews: {
        high: [
          "Respond to all reviews within 24 hours",
          "Ask satisfied customers to leave reviews",
          "Address negative feedback professionally",
          "Implement review management system"
        ],
        medium: [
          "Create follow-up system for recent customers",
          "Train staff on review importance",
          "Use review feedback to improve operations",
          "Showcase positive reviews on social media"
        ],
        low: [
          "Monitor review sentiment trends monthly",
          "Create templates for common review responses",
          "Encourage photo reviews with incentives",
          "Share reviews in email newsletters"
        ]
      },
      local: {
        high: [
          "Claim and verify Google Business Profile",
          "Add accurate business hours and contact info",
          "Upload high-quality interior and food photos",
          "Ensure NAP consistency across all platforms"
        ],
        medium: [
          "Add special attributes (delivery, outdoor seating, etc.)",
          "Create Google Posts for events and specials",
          "Optimize for local directories and review sites",
          "Update business information seasonally"
        ],
        low: [
          "Monitor local search performance monthly",
          "Encourage customers to add photos",
          "Create virtual tours or 360° photos",
          "Optimize for 'near me' search queries"
        ]
      }
    };

    return {
      recommendations: fallbacks[category]?.[priority] || fallbacks[category]?.medium || [],
      context: `${priority.charAt(0).toUpperCase() + priority.slice(1)} priority improvements needed for better ${category} performance.`,
      urgency: priority === 'high' ? 'critical' : priority === 'medium' ? 'important' : 'optimize'
    };
  }
}