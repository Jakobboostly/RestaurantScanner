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

  /* ── Removed business data endpoints - using Google Places API instead ── */
  /* ── Removed Lighthouse endpoint - using Google PageSpeed Insights API instead ── */

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

  /* ── Removed competitors search - using Google Places API instead ── */

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

  /* ── Removed keyword research - using Google Keyword Planner API instead ── */

  /* ── 9. SERP Features ──────────────────────────────────────────────── */
  async getSerpFeatures(keyword: string, location_name = "United States") {
    const { data } = await this.client.post(
      "/serp/google/organic/live/advanced",
      [{ keyword, location_name, language_code: "en" }],
    );
    
    return data.tasks[0]?.result || null;
  }


}