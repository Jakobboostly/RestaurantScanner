import { ApifyClient } from 'apify-client';

export interface FacebookPost {
  postId: string;
  text: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments: number;
  postUrl: string;
  mediaUrls: string[];
  postType: 'photo' | 'video' | 'text' | 'link' | 'other';
}

export interface FacebookPageAnalysis {
  pageUrl: string;
  recentPosts: FacebookPost[];
  totalPosts: number;
  averageEngagement: number;
  postingFrequency: string;
  engagementRate: number;
  topPerformingPost: FacebookPost | null;
  contentTypes: {
    photo: number;
    video: number;
    text: number;
    link: number;
    other: number;
  };
  postingPatterns: {
    averagePostsPerWeek: number;
    lastPostDate: string;
    mostActiveDay: string;
    mostActiveHour: string;
  };
}

export class FacebookPostsScraperService {
  private client: ApifyClient;

  constructor(apiToken: string) {
    this.client = new ApifyClient({
      token: apiToken,
    });
  }

  async analyzeFacebookPage(facebookUrl: string): Promise<FacebookPageAnalysis | null> {
    try {
      console.log('Starting Facebook posts analysis for:', facebookUrl);

      // First, try the full scraper approach
      try {
        const runResponse = await this.startFacebookScraper(facebookUrl);
        if (runResponse && runResponse.items && runResponse.items.length > 0) {
          const analysis = await this.analyzePostsData(runResponse.items, facebookUrl);
          console.log('Facebook posts analysis completed via scraper:', {
            totalPosts: analysis.totalPosts,
            averageEngagement: analysis.averageEngagement,
            postingFrequency: analysis.postingFrequency
          });
          return analysis;
        }
      } catch (scraperError: any) {
        console.log('Facebook scraper failed, using fallback analysis:', scraperError.message);
      }

      // Fallback: Basic Facebook page analysis
      console.log('Using basic Facebook analysis for:', facebookUrl);
      return this.createBasicFacebookAnalysis(facebookUrl);

    } catch (error) {
      console.error('Facebook posts analysis failed:', error);
      return null;
    }
  }

  private createBasicFacebookAnalysis(facebookUrl: string): FacebookPageAnalysis {
    // Create a basic analysis structure when scraper isn't available
    const basicAnalysis: FacebookPageAnalysis = {
      pageUrl: facebookUrl,
      recentPosts: [],
      totalPosts: 0,
      averageEngagement: 0,
      postingFrequency: 'Unable to determine - requires Facebook scraper subscription',
      engagementRate: 0,
      topPerformingPost: null,
      contentTypes: {
        photo: 0,
        video: 0,
        text: 0,
        link: 0,
        other: 0
      },
      postingPatterns: {
        averagePostsPerWeek: 0,
        lastPostDate: 'Unable to determine',
        mostActiveDay: 'Unable to determine',
        mostActiveHour: 'Unable to determine'
      }
    };

    console.log('Created basic Facebook analysis for:', facebookUrl);
    return basicAnalysis;
  }

  private async startFacebookScraper(facebookUrl: string): Promise<any> {
    try {
      // Extract business name from Facebook URL for the actor
      const businessName = this.extractBusinessNameFromUrl(facebookUrl);
      
      const input = {
        categories: ["Restaurant", "Pub", "Bar", "Food"],
        locations: [],
        resultsLimit: 20,
        searchQuery: businessName
      };

      console.log(`Starting Facebook business scraper for: ${businessName}`);
      
      // Run the Actor and wait for it to finish
      const run = await this.client.actor("Us34x9p7VgjCz99H6").call(input);
      
      // Fetch results from the run's dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      console.log('Facebook scraper completed, found items:', items.length);
      return { id: run.id, items };

    } catch (error) {
      console.error('Failed to start Facebook scraper:', error);
      return null;
    }
  }

  private extractBusinessNameFromUrl(facebookUrl: string): string {
    try {
      // Extract business name from Facebook URL patterns
      const url = new URL(facebookUrl);
      const pathname = url.pathname;
      
      // Handle different Facebook URL formats
      if (pathname.includes('/pages/')) {
        // Format: /pages/Business-Name/123456789
        const parts = pathname.split('/');
        const nameIndex = parts.findIndex(part => part === 'pages') + 1;
        if (nameIndex > 0 && nameIndex < parts.length) {
          return parts[nameIndex].replace(/-/g, ' ');
        }
      } else if (pathname.startsWith('/')) {
        // Format: /BusinessName or /Business-Name
        const name = pathname.substring(1).split('/')[0];
        // Remove numbers and clean up the name
        return name.replace(/-/g, ' ').replace(/\./g, ' ').replace(/\d+/g, '').trim();
      }
      
      return 'Restaurant'; // Fallback
    } catch (error) {
      console.error('Error extracting business name:', error);
      return 'Restaurant'; // Fallback
    }
  }

  // This method is no longer needed since client.actor().call() waits for completion

  private async analyzePostsData(posts: any[], pageUrl: string): Promise<FacebookPageAnalysis> {
    const processedPosts: FacebookPost[] = posts.map(post => ({
      postId: post.id || post.postId || 'unknown',
      text: post.text || post.caption || '',
      timestamp: post.timestamp || post.createdTime || new Date().toISOString(),
      likes: post.likes || post.likesCount || 0,
      shares: post.shares || post.sharesCount || 0,
      comments: post.comments || post.commentsCount || 0,
      postUrl: post.url || post.postUrl || '',
      mediaUrls: post.mediaUrls || post.images || [],
      postType: this.determinePostType(post)
    }));

    // Calculate analytics
    const totalEngagement = processedPosts.reduce((sum, post) => 
      sum + post.likes + post.shares + post.comments, 0
    );

    const averageEngagement = processedPosts.length > 0 
      ? Math.round(totalEngagement / processedPosts.length) 
      : 0;

    const engagementRate = this.calculateEngagementRate(processedPosts);
    const topPerformingPost = this.findTopPerformingPost(processedPosts);
    const contentTypes = this.analyzeContentTypes(processedPosts);
    const postingPatterns = this.analyzePostingPatterns(processedPosts);

    return {
      pageUrl,
      recentPosts: processedPosts,
      totalPosts: processedPosts.length,
      averageEngagement,
      postingFrequency: this.calculatePostingFrequency(processedPosts),
      engagementRate,
      topPerformingPost,
      contentTypes,
      postingPatterns
    };
  }

  private determinePostType(post: any): 'photo' | 'video' | 'text' | 'link' | 'other' {
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      const hasVideo = post.mediaUrls.some((url: string) => 
        url.includes('video') || url.includes('.mp4') || url.includes('.mov')
      );
      return hasVideo ? 'video' : 'photo';
    }
    
    if (post.text && post.text.includes('http')) {
      return 'link';
    }
    
    if (post.text && post.text.length > 0) {
      return 'text';
    }
    
    return 'other';
  }

  private calculateEngagementRate(posts: FacebookPost[]): number {
    if (posts.length === 0) return 0;
    
    const totalEngagement = posts.reduce((sum, post) => 
      sum + post.likes + post.shares + post.comments, 0
    );
    
    // Estimate reach based on engagement (typical Facebook reach is 5-10% of followers)
    const estimatedReach = totalEngagement * 10; // Conservative estimate
    
    return estimatedReach > 0 ? Math.round((totalEngagement / estimatedReach) * 100) : 0;
  }

  private findTopPerformingPost(posts: FacebookPost[]): FacebookPost | null {
    if (posts.length === 0) return null;
    
    return posts.reduce((top, post) => {
      const postEngagement = post.likes + post.shares + post.comments;
      const topEngagement = top.likes + top.shares + top.comments;
      
      return postEngagement > topEngagement ? post : top;
    });
  }

  private analyzeContentTypes(posts: FacebookPost[]): {
    photo: number;
    video: number;
    text: number;
    link: number;
    other: number;
  } {
    const types = { photo: 0, video: 0, text: 0, link: 0, other: 0 };
    
    posts.forEach(post => {
      types[post.postType]++;
    });
    
    return types;
  }

  private analyzePostingPatterns(posts: FacebookPost[]): {
    averagePostsPerWeek: number;
    lastPostDate: string;
    mostActiveDay: string;
    mostActiveHour: string;
  } {
    if (posts.length === 0) {
      return {
        averagePostsPerWeek: 0,
        lastPostDate: 'No posts found',
        mostActiveDay: 'Unknown',
        mostActiveHour: 'Unknown'
      };
    }

    // Sort posts by timestamp
    const sortedPosts = posts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const lastPostDate = sortedPosts[0].timestamp;
    const firstPostDate = sortedPosts[sortedPosts.length - 1].timestamp;

    // Calculate average posts per week
    const daysDiff = Math.max(1, 
      (new Date(lastPostDate).getTime() - new Date(firstPostDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const averagePostsPerWeek = Math.round((posts.length / daysDiff) * 7);

    // Find most active day and hour
    const dayCount: { [key: string]: number } = {};
    const hourCount: { [key: string]: number } = {};

    posts.forEach(post => {
      const date = new Date(post.timestamp);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();

      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });

    const mostActiveDay = Object.keys(dayCount).reduce((a, b) => 
      dayCount[a] > dayCount[b] ? a : b
    );

    const mostActiveHour = Object.keys(hourCount).reduce((a, b) => 
      hourCount[a] > hourCount[b] ? a : b
    );

    return {
      averagePostsPerWeek,
      lastPostDate: new Date(lastPostDate).toLocaleDateString(),
      mostActiveDay,
      mostActiveHour: `${mostActiveHour}:00`
    };
  }

  private calculatePostingFrequency(posts: FacebookPost[]): string {
    if (posts.length === 0) return 'No posts found';
    
    const sortedPosts = posts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const lastPostDate = new Date(sortedPosts[0].timestamp);
    const firstPostDate = new Date(sortedPosts[sortedPosts.length - 1].timestamp);

    const daysDiff = Math.max(1, 
      (lastPostDate.getTime() - firstPostDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const postsPerWeek = (posts.length / daysDiff) * 7;

    if (postsPerWeek >= 7) {
      return `${Math.round(postsPerWeek / 7)} posts/day`;
    } else if (postsPerWeek >= 1) {
      return `${Math.round(postsPerWeek)} posts/week`;
    } else {
      const postsPerMonth = postsPerWeek * 4.33;
      return `${Math.round(postsPerMonth)} posts/month`;
    }
  }
}