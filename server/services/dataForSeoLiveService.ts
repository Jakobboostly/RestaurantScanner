import axios, { AxiosInstance } from 'axios';

export interface RestaurantDiscoveryResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  categories: string[];
  location: {
    lat: number;
    lng: number;
  };
  placeId?: string;
}

export interface LivePerformanceData {
  lighthouseScore: number;
  mobileScore: number;
  speedIndex: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  technicalIssues: string[];
  seoScore: number;
}

export interface KeywordData {
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: string;
  url?: string;
}

export interface CompetitorData {
  domain: string;
  name: string;
  position: number;
  keywords: KeywordData[];
  organicTraffic: number;
  domainRank: number;
  competingKeywords: number;
}

export interface GMBData {
  name: string;
  rating: number;
  reviewCount: number;
  photos: {
    total: number;
    recent: string[];
  };
  reviews: {
    recent: any[];
    sentiment: 'positive' | 'neutral' | 'negative';
    responseRate: number;
  };
  isVerified: boolean;
  categories: string[];
  workingHours: any;
  posts: any[];
}

export interface DomainAnalytics {
  domainRank: number;
  organicTraffic: number;
  organicKeywords: number;
  paidKeywords: number;
  backlinks: number;
  referringDomains: number;
  domainIntersection: string[];
}

export class DataForSeoLiveService {
  private client: AxiosInstance;
  private login: string;
  private password: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: this.login,
        password: this.password,
      },
    });
  }

  async discoverRestaurant(restaurantName: string, location: string): Promise<RestaurantDiscoveryResult[]> {
    try {
      const response = await this.client.post('/business_data/business_listings/search/live', [
        {
          keyword: restaurantName,
          location_name: location,
          limit: 10,
          language_name: 'English'
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result) {
        return response.data.tasks[0].result.map((item: any) => ({
          name: item.title || restaurantName,
          address: item.address || '',
          phone: item.phone || undefined,
          website: item.domain || undefined,
          rating: item.rating?.value || undefined,
          reviewCount: item.rating?.reviews_count || undefined,
          categories: item.categories || [],
          location: {
            lat: item.location?.lat || 0,
            lng: item.location?.lng || 0
          },
          placeId: item.place_id || undefined
        }));
      }

      return [];
    } catch (error) {
      console.error('Restaurant discovery failed:', error);
      return [];
    }
  }

  async getGMBData(restaurantName: string, location: string): Promise<GMBData | null> {
    try {
      const response = await this.client.post('/business_data/google/my_business_info/live', [
        {
          keyword: restaurantName,
          location_name: location,
          language_name: 'English'
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result?.[0]) {
        const result = response.data.tasks[0].result[0];
        
        return {
          name: result.title || restaurantName,
          rating: result.rating?.value || 0,
          reviewCount: result.rating?.reviews_count || 0,
          photos: {
            total: result.photos_count || 0,
            recent: result.photos || []
          },
          reviews: {
            recent: result.reviews || [],
            sentiment: this.calculateSentiment(result.rating?.value || 0),
            responseRate: this.calculateResponseRate(result.reviews || [])
          },
          isVerified: result.is_verified || false,
          categories: result.categories || [],
          workingHours: result.work_hours || {},
          posts: result.posts || []
        };
      }

      return null;
    } catch (error) {
      console.error('GMB data fetch failed:', error);
      return null;
    }
  }

  async getLighthouseAudit(url: string): Promise<LivePerformanceData | null> {
    try {
      const response = await this.client.post('/on_page/lighthouse/live/json', [
        {
          url: url,
          language_name: 'English'
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result?.[0]) {
        const result = response.data.tasks[0].result[0];
        const audits = result.audits || {};
        
        return {
          lighthouseScore: result.categories?.performance?.score * 100 || 0,
          mobileScore: result.categories?.['mobile-friendly']?.score * 100 || 0,
          speedIndex: audits['speed-index']?.numericValue || 0,
          firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
          largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
          cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
          technicalIssues: this.extractTechnicalIssues(audits),
          seoScore: result.categories?.seo?.score * 100 || 0
        };
      }

      return null;
    } catch (error) {
      console.error('Lighthouse audit failed:', error);
      return null;
    }
  }

  async getKeywordsForSite(domain: string, location: string): Promise<KeywordData[]> {
    try {
      const response = await this.client.post('/dataforseo_labs/google/keywords_for_site/live', [
        {
          target: domain,
          location_name: location,
          language_name: 'English',
          limit: 100
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result) {
        return response.data.tasks[0].result.map((item: any) => ({
          keyword: item.keyword || '',
          position: item.position || null,
          searchVolume: item.search_volume || 0,
          difficulty: item.keyword_difficulty || 0,
          cpc: item.cpc || 0,
          competition: item.competition || 0,
          intent: this.classifySearchIntent(item.keyword || ''),
          url: item.url || undefined
        }));
      }

      return [];
    } catch (error) {
      console.error('Keywords for site failed:', error);
      return [];
    }
  }

  async getCompetitorAnalysis(domain: string, location: string): Promise<CompetitorData[]> {
    try {
      const response = await this.client.post('/dataforseo_labs/google/serp_competitors/live', [
        {
          target: domain,
          location_name: location,
          language_name: 'English',
          limit: 20
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result) {
        const competitors = response.data.tasks[0].result;
        
        return await Promise.all(competitors.map(async (competitor: any) => {
          const keywords = await this.getKeywordsForSite(competitor.domain, location);
          
          return {
            domain: competitor.domain || '',
            name: this.extractDomainName(competitor.domain || ''),
            position: competitor.avg_position || 0,
            keywords: keywords.slice(0, 10),
            organicTraffic: competitor.organic_etv || 0,
            domainRank: competitor.domain_rank || 0,
            competingKeywords: competitor.intersections || 0
          };
        }));
      }

      return [];
    } catch (error) {
      console.error('Competitor analysis failed:', error);
      return [];
    }
  }

  async getLocalSearchPerformance(keyword: string, location: string): Promise<any[]> {
    try {
      const response = await this.client.post('/serp/google/maps/live/advanced', [
        {
          keyword: keyword,
          location_name: location,
          language_name: 'English'
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result) {
        return response.data.tasks[0].result;
      }

      return [];
    } catch (error) {
      console.error('Local search performance failed:', error);
      return [];
    }
  }

  async getDomainAnalytics(domain: string, location: string): Promise<DomainAnalytics | null> {
    try {
      const response = await this.client.post('/dataforseo_labs/google/domain_rank_overview/live', [
        {
          target: domain,
          location_name: location,
          language_name: 'English'
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result?.[0]) {
        const result = response.data.tasks[0].result[0];
        
        return {
          domainRank: result.domain_rank || 0,
          organicTraffic: result.organic_etv || 0,
          organicKeywords: result.organic_count || 0,
          paidKeywords: result.paid_count || 0,
          backlinks: result.backlinks || 0,
          referringDomains: result.referring_domains || 0,
          domainIntersection: result.intersection || []
        };
      }

      return null;
    } catch (error) {
      console.error('Domain analytics failed:', error);
      return null;
    }
  }

  async getAISummary(taskId: string, customPrompt: string): Promise<string> {
    try {
      const response = await this.client.post('/serp/ai_summary', [
        {
          task_id: taskId,
          prompt: customPrompt,
          include_links: true,
          fetch_content: true
        }
      ]);

      if (response.data.status_code === 20000 && response.data.tasks?.[0]?.result) {
        return response.data.tasks[0].result.summary || '';
      }

      return '';
    } catch (error) {
      console.error('AI summary failed:', error);
      return '';
    }
  }

  private calculateSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
    if (rating >= 4.0) return 'positive';
    if (rating >= 3.0) return 'neutral';
    return 'negative';
  }

  private calculateResponseRate(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const responsesCount = reviews.filter(review => review.response).length;
    return Math.round((responsesCount / reviews.length) * 100);
  }

  private extractTechnicalIssues(audits: any): string[] {
    const issues: string[] = [];
    
    if (audits['speed-index']?.score < 0.6) {
      issues.push('Slow page speed');
    }
    if (audits['largest-contentful-paint']?.score < 0.6) {
      issues.push('Large Contentful Paint issues');
    }
    if (audits['cumulative-layout-shift']?.score < 0.6) {
      issues.push('Layout shift problems');
    }
    if (audits['first-contentful-paint']?.score < 0.6) {
      issues.push('First Contentful Paint delays');
    }

    return issues;
  }

  private classifySearchIntent(keyword: string): string {
    const navigationalWords = ['website', 'site', 'home', 'contact', 'about'];
    const transactionalWords = ['buy', 'order', 'delivery', 'menu', 'book', 'reserve'];
    const informationalWords = ['how', 'what', 'why', 'when', 'guide', 'tips'];
    const localWords = ['near', 'nearby', 'location', 'hours', 'phone', 'address'];

    const lowerKeyword = keyword.toLowerCase();

    if (navigationalWords.some(word => lowerKeyword.includes(word))) {
      return 'navigational';
    }
    if (transactionalWords.some(word => lowerKeyword.includes(word))) {
      return 'transactional';
    }
    if (informationalWords.some(word => lowerKeyword.includes(word))) {
      return 'informational';
    }
    if (localWords.some(word => lowerKeyword.includes(word))) {
      return 'local';
    }

    return 'research';
  }

  private extractDomainName(domain: string): string {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const parts = cleanDomain.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
}