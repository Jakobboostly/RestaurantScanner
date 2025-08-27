/**
 * Revenue loss calculation utilities based on SEO/Local Pack statistics
 * Data sourced from restaurant industry benchmarks
 */

// CTR by Local Pack position (positions 1-3 shown in pack) - Restaurant-specific boost (+5%)
export const LOCAL_PACK_CTR: Record<number, number> = {
  1: 0.38,  // 38% CTR (was 33%)
  2: 0.27,  // 27% CTR (was 22%)
  3: 0.18,  // 18% CTR (was 13%)
};

// CTR for organic search positions - Restaurant-specific boost (+5%)
export const ORGANIC_CTR: Record<number, number> = {
  1: 0.23,   // 23% CTR (was 18%)
  2: 0.12,   // 12% CTR (was 7%)
  3: 0.08,   // 8% CTR (was 3%)
  4: 0.07,   // 7% CTR (was 2%)
  5: 0.065,  // 6.5% CTR (was 1.5%)
  6: 0.06,   // 6% CTR (was 1%)
  7: 0.06,   // 6% CTR (was 1%)
  8: 0.058,  // 5.8% CTR (was 0.8%)
  9: 0.056,  // 5.6% CTR (was 0.6%)
  10: 0.055, // 5.5% CTR (was 0.5%)
};

// Industry constants
export const CONVERSION_RATE = 0.05; // 5% of website visitors become customers
export const DEFAULT_AVERAGE_TICKET = 35; // Default $35 average ticket
export const DAYS_PER_MONTH = 30;

export interface RevenueCalculationInput {
  searchVolume: number;
  currentPosition: number | null;
  isLocalPack?: boolean;
  averageTicket?: number;
}

export interface RevenueLossResult {
  currentRevenue: number;
  potentialRevenue: number;
  lostRevenue: number;
  lostRevenueAnnual: number;
  improvementPosition: number;
  improvementCTR: number;
}

/**
 * Calculate revenue loss for a keyword based on position
 */
export function calculateRevenueLoss(input: RevenueCalculationInput): RevenueLossResult {
  const { 
    searchVolume, 
    currentPosition, 
    isLocalPack = true, 
    averageTicket = DEFAULT_AVERAGE_TICKET 
  } = input;

  // Determine target position and CTR
  const targetPosition = 1;
  const targetCTR = isLocalPack ? LOCAL_PACK_CTR[targetPosition] : ORGANIC_CTR[targetPosition];

  // Calculate current CTR based on position
  let currentCTR = 0;
  if (currentPosition && currentPosition <= 10) {
    if (isLocalPack && currentPosition <= 3) {
      currentCTR = LOCAL_PACK_CTR[currentPosition];
    } else if (!isLocalPack) {
      currentCTR = ORGANIC_CTR[currentPosition] || 0;
    }
  }

  // Calculate monthly revenues
  const potentialMonthlyClicks = searchVolume * targetCTR;
  const currentMonthlyClicks = searchVolume * currentCTR;
  const lostMonthlyClicks = potentialMonthlyClicks - currentMonthlyClicks;

  const potentialRevenue = potentialMonthlyClicks * CONVERSION_RATE * averageTicket;
  const currentRevenue = currentMonthlyClicks * CONVERSION_RATE * averageTicket;
  const lostRevenue = lostMonthlyClicks * CONVERSION_RATE * averageTicket;
  const lostRevenueAnnual = lostRevenue * 12;

  return {
    currentRevenue,
    potentialRevenue,
    lostRevenue,
    lostRevenueAnnual,
    improvementPosition: targetPosition,
    improvementCTR: targetCTR * 100, // Return as percentage
  };
}

/**
 * Calculate total revenue loss across multiple keywords
 */
export function calculateTotalRevenueLoss(
  keywords: Array<{ searchVolume: number; position: number | null; isLocalPack?: boolean }>
): {
  totalLostRevenue: number;
  totalLostRevenueAnnual: number;
  totalPotentialRevenue: number;
} {
  const results = keywords.map(kw => 
    calculateRevenueLoss({
      searchVolume: kw.searchVolume,
      currentPosition: kw.position,
      isLocalPack: kw.isLocalPack ?? true,
    })
  );

  return {
    totalLostRevenue: results.reduce((sum, r) => sum + r.lostRevenue, 0),
    totalLostRevenueAnnual: results.reduce((sum, r) => sum + r.lostRevenueAnnual, 0),
    totalPotentialRevenue: results.reduce((sum, r) => sum + r.potentialRevenue, 0),
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, includeDecimals = false): string {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  };
  
  return new Intl.NumberFormat('en-US', options).format(amount);
}

/**
 * Get highest opportunity keywords (highest revenue potential)
 */
export function getHighestOpportunityKeywords<T extends { searchVolume: number; position: number | null }>(
  keywords: T[],
  limit = 3
): Array<T & RevenueLossResult> {
  const keywordsWithLoss = keywords.map(kw => ({
    ...kw,
    ...calculateRevenueLoss({
      searchVolume: kw.searchVolume,
      currentPosition: kw.position,
      isLocalPack: true,
    }),
  }));

  // Sort by revenue opportunity (highest first)
  return keywordsWithLoss
    .sort((a, b) => b.lostRevenue - a.lostRevenue)
    .slice(0, limit);
}

// Legacy alias for backward compatibility
export const getWorstPerformingKeywords = getHighestOpportunityKeywords;