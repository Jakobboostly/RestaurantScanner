/**
 * Shared keyword utility functions for DataForSEO services
 * Consolidates duplicate business logic across all keyword services
 */

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: string;
  position?: number;
  opportunity?: number;
}

export interface LocalKeywordConfig {
  cuisine: string;
  city: string;
  state: string;
  businessName?: string;
}

/**
 * Generate the standard 8 local keywords used across all services
 */
export function generateLocalKeywords(config: LocalKeywordConfig): string[] {
  const { cuisine, city, state } = config;
  
  return [
    `${cuisine} near me`,
    `${cuisine} delivery ${city}`,
    `best ${cuisine} ${city}`,
    `${city} ${cuisine}`,
    `${cuisine} places near me`,
    `${cuisine} ${city} ${state}`,
    `${cuisine} delivery near me`,
    `${cuisine} open now`
  ];
}

/**
 * Unified keyword relevance checker combining all previous implementations
 */
export function isRestaurantRelevant(keyword: string, cuisine: string, city: string): boolean {
  const keywordLower = keyword.toLowerCase();
  const cuisineLower = cuisine.toLowerCase();
  const cityLower = city.toLowerCase();
  
  // Restaurant-related terms
  const restaurantTerms = [
    'restaurant', 'food', 'menu', 'delivery', 'takeout', 'order', 'dining',
    'eat', 'meal', 'lunch', 'dinner', 'breakfast', 'brunch', 'catering',
    'reservations', 'hours', 'location', 'near me', 'best', 'review'
  ];
  
  // Location relevance
  const hasLocation = keywordLower.includes(cityLower) || 
                     keywordLower.includes('near me') || 
                     keywordLower.includes('near');
  
  // Cuisine relevance
  const hasCuisine = keywordLower.includes(cuisineLower);
  
  // Restaurant context
  const hasRestaurantContext = restaurantTerms.some(term => keywordLower.includes(term));
  
  // Exclude irrelevant terms
  const excludeTerms = [
    'recipe', 'ingredients', 'how to make', 'homemade', 'cooking',
    'nutrition facts', 'calories', 'weight loss', 'diet', 'healthy',
    'job', 'career', 'hiring', 'employment', 'salary'
  ];
  
  const hasExcludedTerms = excludeTerms.some(term => keywordLower.includes(term));
  
  if (hasExcludedTerms) {
    return false;
  }
  
  // Must have at least one relevant aspect
  return hasLocation || hasCuisine || hasRestaurantContext;
}

/**
 * Check if keyword is commercial or local intent (not informational)
 */
export function isCommercialOrLocalKeyword(keyword: string): boolean {
  const keywordStr = String(keyword || '').toLowerCase();
  
  // Exclude informational keywords
  const informationalPatterns = [
    'menu', 'hours', 'phone', 'contact', 'address', 'reviews', 'review',
    'about', 'history', 'story', 'location', 'directions', 'info',
    'what is', 'how to', 'when', 'where', 'why', 'who'
  ];
  
  for (const pattern of informationalPatterns) {
    if (keywordStr.includes(pattern)) {
      return false;
    }
  }
  
  // Include commercial and local keywords
  const commercialLocalPatterns = [
    'near me', 'delivery', 'takeout', 'order', 'best', 'buy',
    'restaurant', 'food', 'catering', 'online', 'booking',
    'reservation', 'table', 'dine', 'eat'
  ];
  
  for (const pattern of commercialLocalPatterns) {
    if (keywordStr.includes(pattern)) {
      return true;
    }
  }
  
  // Default to excluding if unclear
  return false;
}

/**
 * Classify search intent for keywords
 */
export function classifyKeywordIntent(keyword: string): string {
  const kw = keyword.toLowerCase();
  
  if (kw.includes('buy') || kw.includes('order') || kw.includes('delivery') || kw.includes('menu')) {
    return 'transactional';
  }
  if (kw.includes('near me') || kw.includes('location') || kw.includes('hours') || kw.includes('phone')) {
    return 'local';
  }
  if (kw.includes('best') || kw.includes('review') || kw.includes('vs') || kw.includes('compare')) {
    return 'commercial';
  }
  if (kw.includes('what is') || kw.includes('how to') || kw.includes('recipe') || kw.includes('nutrition')) {
    return 'informational';
  }
  
  return 'navigational';
}

/**
 * Unified opportunity score calculation
 */
export function calculateOpportunityScore(
  position: number, 
  searchVolume: number, 
  competitionIndex?: number, 
  cpc?: number
): number {
  if (position === 0) return 75; // Not ranked = opportunity
  if (position <= 3) return 0; // Top 3 = no opportunity
  if (position <= 10) return 25; // Top 10 = small opportunity
  
  // Enhanced scoring when competition data available
  if (competitionIndex !== undefined && cpc !== undefined && searchVolume > 0) {
    // Normalize competition (0-100 scale, lower is better)
    const competitionScore = Math.max(0, 100 - competitionIndex);
    
    // Normalize CPC (cap at $20, lower is better for opportunity)
    const costScore = Math.max(0, 100 - Math.min(cpc * 5, 100));
    
    // Weight: 50% search volume, 30% competition, 20% cost
    const volumeWeight = Math.min(searchVolume / 1000, 100);
    
    const opportunityScore = (
      (volumeWeight * 0.5) + 
      (competitionScore * 0.3) + 
      (costScore * 0.2)
    );
    
    return Math.round(opportunityScore);
  }
  
  return 50; // Beyond top 10 = good opportunity (default)
}

/**
 * Check if keyword is location-specific
 */
export function isLocalKeyword(keyword: string, city: string, state: string): boolean {
  const kw = keyword.toLowerCase();
  const cityLower = city.toLowerCase();
  const stateLower = state.toLowerCase();
  
  return (
    kw.includes(cityLower) || 
    kw.includes(stateLower) ||
    kw.includes('near me') ||
    kw.includes('local') ||
    kw.includes('delivery') ||
    kw.includes('takeout')
  );
}

/**
 * Analyze search volume trends from monthly data
 */
export function analyzeTrends(monthlySearches: any[]): any {
  if (!monthlySearches || monthlySearches.length === 0) {
    return { trend: 'stable', change: 0 };
  }

  // Get last 3 months vs previous 3 months
  const recent = monthlySearches.slice(-3);
  const previous = monthlySearches.slice(-6, -3);
  
  if (recent.length === 0 || previous.length === 0) {
    return { trend: 'stable', change: 0 };
  }

  const recentAvg = recent.reduce((sum, month) => sum + (month.search_volume || 0), 0) / recent.length;
  const previousAvg = previous.reduce((sum, month) => sum + (month.search_volume || 0), 0) / previous.length;
  
  if (previousAvg === 0) return { trend: 'stable', change: 0 };
  
  const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;
  
  let trend = 'stable';
  if (percentChange > 15) trend = 'rising';
  else if (percentChange < -15) trend = 'declining';
  
  return {
    trend,
    change: Math.round(percentChange),
    recentAvg: Math.round(recentAvg),
    previousAvg: Math.round(previousAvg)
  };
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

/**
 * Normalize text for matching (removes punctuation, extra spaces)
 */
export function normalizeText(text: string): string {
  return text.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Enhanced business name matching for local search results
 */
export function matchBusinessName(
  itemTitle: string, 
  businessName: string, 
  itemDomain?: string
): { isMatch: boolean; matchType: string; confidence: number } {
  const normalizedTitle = normalizeText(itemTitle.toLowerCase());
  const normalizedSearch = normalizeText(businessName.toLowerCase());
  
  // Enhanced matching strategies
  const titleWords = normalizedTitle.split(/\s+/).filter(word => word.length > 2);
  const nameWords = normalizedSearch.split(/\s+/).filter(word => word.length > 2);
  
  // 1. Exact match (normalized)
  const isExactMatch = normalizedTitle === normalizedSearch || 
                      normalizedTitle.includes(normalizedSearch) || 
                      normalizedSearch.includes(normalizedTitle);
  
  if (isExactMatch) {
    return { isMatch: true, matchType: 'exact', confidence: 0.95 };
  }
  
  // 2. Domain-based matching
  const normalizedDomain = itemDomain ? itemDomain.toLowerCase().replace(/^www\./, '') : '';
  const searchDomain = normalizedSearch.replace(/\s+/g, '').toLowerCase();
  const domainMatch = normalizedDomain && (
    normalizedDomain.includes(searchDomain) ||
    searchDomain.includes(normalizedDomain.replace(/\.(com|net|org)$/, '')) ||
    normalizedDomain.includes(searchDomain.replace(/\s+/g, ''))
  );
  
  if (domainMatch) {
    return { isMatch: true, matchType: 'domain', confidence: 0.9 };
  }
  
  // 3. First word match (restaurant names often start the same)
  const firstWordMatch = titleWords.length > 0 && nameWords.length > 0 && 
    titleWords[0] === nameWords[0] && titleWords[0].length >= 3;
  
  if (firstWordMatch) {
    return { isMatch: true, matchType: 'first-word', confidence: 0.8 };
  }
  
  // 4. Word overlap matching (at least 40% of words)
  const matchingWords = titleWords.filter(titleWord => 
    nameWords.some(nameWord => 
      titleWord.includes(nameWord) || nameWord.includes(titleWord) ||
      titleWord === nameWord
    )
  );
  const wordOverlapRatio = matchingWords.length / Math.max(nameWords.length, 1);
  const hasGoodOverlap = wordOverlapRatio >= 0.4 && matchingWords.length >= 1;
  
  if (hasGoodOverlap) {
    return { 
      isMatch: true, 
      matchType: 'word-overlap', 
      confidence: Math.round(wordOverlapRatio * 100) / 100 
    };
  }
  
  return { isMatch: false, matchType: 'none', confidence: 0 };
}