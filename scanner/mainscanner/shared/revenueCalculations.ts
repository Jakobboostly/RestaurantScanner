/**
 * Revenue loss calculation utilities based on SEO/Local Pack statistics
 * Data sourced from restaurant industry benchmarks
 */

// CTR by Local Pack position (positions 1-3 shown in pack)
export const LOCAL_PACK_CTR: Record<number, number> = {
  1: 0.33,  // 33% CTR
  2: 0.22,  // 22% CTR  
  3: 0.13,  // 13% CTR
};

// CTR for organic search positions
export const ORGANIC_CTR: Record<number, number> = {
  1: 0.18,
  2: 0.07,
  3: 0.03,
  4: 0.02,
  5: 0.015,
  6: 0.01,
  7: 0.01,
  8: 0.008,
  9: 0.006,
  10: 0.005,
};

// Industry constants
export const CONVERSION_RATE = 0.05; // 5% of website visitors become customers
export const DEFAULT_AVERAGE_TICKET = 30; // Default $30 average ticket
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
 * Get worst performing keywords (highest revenue loss)
 */
export function getWorstPerformingKeywords<T extends { searchVolume: number; position: number | null }>(
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

  // Sort by lost revenue (highest first)
  return keywordsWithLoss
    .sort((a, b) => b.lostRevenue - a.lostRevenue)
    .slice(0, limit);
}