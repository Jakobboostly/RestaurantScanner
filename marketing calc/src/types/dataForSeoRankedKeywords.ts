/**
 * TypeScript interfaces for DataForSEO Ranked Keywords API
 */

export interface RankedKeywordRequest {
  target: string;
  language_name: string;
  location_code: number;
  limit: number;
}

export interface SerpItem {
  title: string;
  visible_url: string;
  relative_url: string;
  displayed_snippet: string;
  position_on_page: number;
}

export interface RankedSerpElement {
  serp_item: SerpItem;
}

export interface DataForSeoRankedKeyword {
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: number;
  position: number;
  previous_position?: number;
  url: string;
  relative_url: string;
  estimated_traffic: number;
  traffic_share: number;
  language_name: string;
  location_code: number;
  last_seen: string;
  serp_features: string[];
  ranked_serp_element: RankedSerpElement;
}

export interface DataForSeoTask {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: {
    api: string;
    function: string;
    target: string;
    language_name: string;
    location_code: number;
    limit: number;
  };
  result: [{
    total_count: number;
    items_count: number;
    items: DataForSeoRankedKeyword[];
  }];
}

export interface DataForSeoRankedKeywordsResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSeoTask[];
}

export interface KeywordFetchResult {
  success: boolean;
  keywords: DataForSeoRankedKeyword[];
  error?: string;
  domain?: string;
  total_count?: number;
}