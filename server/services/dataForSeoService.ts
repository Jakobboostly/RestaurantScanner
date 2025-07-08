import axios, { AxiosInstance } from 'axios';

export class DataForSeoService {
  private client: AxiosInstance;

  constructor(login: string, password: string) {
    this.client = axios.create({
      baseURL: "https://api.dataforseo.com/v3",
      auth: { username: login, password: password },
      headers: { "Content-Type": "application/json" },
    });
  }

  /* ── 1. Restaurant search ───────────────────────────────────────────── */
  async searchRestaurants({
    query,
    lat,
    lng,
    radiusMeters = 5000,
    limit = 10,
  }: {
    query: string;
    lat?: number;
    lng?: number;
    radiusMeters?: number;
    limit?: number;
  }) {
    const task = {
      keyword: query,
      location_coordinates: lat && lng ? `${lat},${lng}` : undefined,
      radius: radiusMeters,
      limit,
    };
    
    const { data } = await this.client.post(
      "/business_data/business_listings/search/live",
      [task],
    );
    
    return data.tasks[0]?.result || [];
  }

  /* ── 2. Restaurant details (GMB profile) ────────────────────────────── */
  async getRestaurantDetails(cid: string) {
    const { data } = await this.client.post(
      "/business_data/google/my_business_info/live",
      [{ id: cid }],
    );
    
    return data.tasks[0]?.result || null;
  }

  /* ── 3. Core Web Vitals via Lighthouse ──────────────────────────────── */
  async auditPerformance(url: string) {
    const { data } = await this.client.post(
      "/on_page/lighthouse/live/json",
      [{ url, tag: "live-audit" }],
    );
    
    return data.tasks[0]?.result || null;
  }

  /* ── 4. Keyword rank check ──────────────────────────────────────────── */
  async trackKeyword({
    keyword,
    domain,
    location_name = "United States",
  }: {
    keyword: string;
    domain: string;
    location_name?: string;
  }) {
    const task = {
      keyword,
      target: domain,
      location_name,
      language_code: "en",
    };
    
    const { data } = await this.client.post(
      "/serp/google/organic/live/advanced",
      [task],
    );
    
    return data.tasks[0]?.result || null;
  }

  /* ── 5. Nearby competitors (reuse search) ───────────────────────────── */
  async findCompetitors({
    lat,
    lng,
    radiusMeters = 3000,
    limit = 10,
  }: {
    lat: number;
    lng: number;
    radiusMeters?: number;
    limit?: number;
  }) {
    return this.searchRestaurants({ 
      query: "restaurant", 
      lat, 
      lng, 
      radiusMeters, 
      limit 
    });
  }

  /* ── 6. SEO Analysis ──────────────────────────────────────────────── */
  async getOnPageSEO(url: string) {
    const { data } = await this.client.post(
      "/on_page/page_screenshot/live",
      [{ url, tag: "seo-audit" }],
    );
    
    return data.tasks[0]?.result || null;
  }

  /* ── 7. Domain Analytics ──────────────────────────────────────────── */
  async getDomainAnalytics(domain: string) {
    const { data } = await this.client.post(
      "/dataforseo_labs/google/domain_rank_overview/live",
      [{ target: domain }],
    );
    
    return data.tasks[0]?.result || null;
  }

  /* ── 8. Keyword Research ──────────────────────────────────────────── */
  async getKeywordResearch(keyword: string, location_name = "United States") {
    const { data } = await this.client.post(
      "/dataforseo_labs/google/keyword_suggestions/live",
      [{ keyword, location_name, language_code: "en" }],
    );
    
    return data.tasks[0]?.result || null;
  }

  /* ── 9. SERP Features ──────────────────────────────────────────────── */
  async getSerpFeatures(keyword: string, location_name = "United States") {
    const { data } = await this.client.post(
      "/serp/google/organic/live/advanced",
      [{ keyword, location_name, language_code: "en" }],
    );
    
    return data.tasks[0]?.result || null;
  }

  /* ── 10. Backlink Analysis ──────────────────────────────────────────── */
  async getBacklinkData(domain: string) {
    const { data } = await this.client.post(
      "/backlinks/summary/live",
      [{ target: domain }],
    );
    
    return data.tasks[0]?.result || null;
  }
}