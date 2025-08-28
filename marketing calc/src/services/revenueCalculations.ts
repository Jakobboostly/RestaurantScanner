import { channelROICalculators, restaurantBenchmarks } from '../data/restaurantStats';

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  currentPosition: number;
  targetPosition: number;
  isLocalPack: boolean; // true for Local Pack, false for Organic
}

export interface RevenueCalculationInputs {
  monthlyRevenue: number;
  avgTicket: number;
  monthlyTransactions: number;
  
  // Individual keyword data (preferred method)
  keywords?: KeywordData[];
  
  // Fallback: Current positions (used if keywords array not provided)
  currentLocalPackPosition?: number;
  currentOrganicPosition?: number;
  
  // Current marketing assets
  socialFollowersInstagram: number;
  socialFollowersFacebook: number;
  emailListSize: number;
  smsListSize: number;
  
  // Legacy optional inputs (kept for backwards compatibility)
  localPackKeywords?: {
    position1: number;
    position2: number;
    position3: number;
  };
  organicKeywords?: {
    position1: number;
    position2: number;
    position3: number;
    position4: number;
    position5: number;
  };
  
  // Enhanced social media metrics from API scraping
  instagramMetrics?: {
    followersCount: number;
    postsCount: number;
    totalLikes: number;
    username?: string;
    profilePicUrl?: string;
  };
  facebookMetrics?: {
    followers: number;
    likes: number;
    isRunningAds: boolean;
    isActivePage: boolean;
    pageName?: string;
  };
}

export interface ServiceRevenue {
  currentRevenue: number;
  potentialRevenue: number;
  additionalRevenue: number;
}

export interface RevenueCalculationResult {
  seo: ServiceRevenue;
  social: ServiceRevenue;
  sms: ServiceRevenue;
  totalAdditionalRevenue: number;
}

function calculateKeywordSEORevenue(keywords: KeywordData[], avgTicket: number): { current: number; potential: number } {
  let currentRevenue = 0;
  let potentialRevenue = 0;
  
  keywords.forEach(keyword => {
    // Get CTR based on position and type (Local Pack vs Organic)
    const getCurrentCTR = (position: number, isLocalPack: boolean): number => {
      if (isLocalPack) {
        const localPackCTR = restaurantBenchmarks.seo.localPackCTR.find(p => p.position === position);
        return localPackCTR ? localPackCTR.ctr : (position <= 3 ? 5 : 0);
      } else {
        const organicCTR = restaurantBenchmarks.seo.organicCTR.find(p => p.position === position);
        return organicCTR ? organicCTR.ctr : (position <= 10 ? Math.max(1.5 - (position * 0.2), 0.1) : 0.1);
      }
    };
    
    const currentCTR = getCurrentCTR(keyword.currentPosition, keyword.isLocalPack);
    const targetCTR = getCurrentCTR(keyword.targetPosition, keyword.isLocalPack);
    
    const conversionRate = restaurantBenchmarks.seo.conversionRate / 100; // 5%
    
    // Calculate current revenue from this keyword
    const currentClicks = (keyword.searchVolume * currentCTR) / 100;
    const currentConversions = currentClicks * conversionRate;
    const currentKeywordRevenue = currentConversions * avgTicket;
    
    // Calculate potential revenue from this keyword at target position
    const potentialClicks = (keyword.searchVolume * targetCTR) / 100;
    const potentialConversions = potentialClicks * conversionRate;
    const potentialKeywordRevenue = potentialConversions * avgTicket;
    
    currentRevenue += currentKeywordRevenue;
    potentialRevenue += potentialKeywordRevenue;
  });
  
  return { current: currentRevenue, potential: potentialRevenue };
}

export function calculateUnifiedRevenue(inputs: RevenueCalculationInputs): RevenueCalculationResult {
  const {
    monthlyRevenue,
    avgTicket,
    monthlyTransactions,
    keywords,
    currentLocalPackPosition,
    currentOrganicPosition,
    socialFollowersInstagram,
    socialFollowersFacebook,
    emailListSize,
    smsListSize,
    instagramMetrics,
    facebookMetrics
  } = inputs;

  // SEO Calculations
  let seoCurrentRevenue: number;
  let seoPotentialRevenue: number;
  
  if (keywords && keywords.length > 0) {
    // Use individual keyword data for accurate calculations
    const seoCalcs = calculateKeywordSEORevenue(keywords, avgTicket);
    seoCurrentRevenue = seoCalcs.current;
    seoPotentialRevenue = seoCalcs.potential;
  } else {
    // Fallback to old method if no keyword data provided
    // Estimate search volume based on transaction volume (industry standard multiplier)
    const estimatedMonthlySearches = monthlyTransactions * 2.5;
    
    // Calculate current SEO contribution (estimated at 10-15% of revenue for most restaurants)
    seoCurrentRevenue = monthlyRevenue * 0.1;
    
    // Calculate potential SEO revenue using the calculator
    const seoPotentialIncrease = channelROICalculators.calculateSEOROI(
      estimatedMonthlySearches,
      (currentLocalPackPosition && currentLocalPackPosition > 3) ? 5 : (currentLocalPackPosition || 3), // If not in top 3, assume position 5
      1, // Target position
      avgTicket
    );
    
    seoPotentialRevenue = seoCurrentRevenue + seoPotentialIncrease;
  }

  // Enhanced Social Media Calculations using API data and restaurant-stats-markdown.md
  let socialCurrentRevenue, socialPotentialRevenue;
  
  // Use enhanced metrics if available, otherwise fallback to basic calculations
  if (instagramMetrics || facebookMetrics) {
    // INSTAGRAM CALCULATIONS (Based on restaurant-stats-markdown.md: 3.1% engagement rate)
    let instagramCurrentRevenue = 0;
    let instagramPotentialRevenue = 0;
    
    if (instagramMetrics) {
      // Calculate engagement rate from actual data (likes per post)
      const avgLikesPerPost = instagramMetrics.postsCount > 0 
        ? instagramMetrics.totalLikes / Math.min(instagramMetrics.postsCount, 10) // Last 10 posts
        : 0;
      const engagementRate = instagramMetrics.followersCount > 0 
        ? avgLikesPerPost / instagramMetrics.followersCount 
        : 0.031; // Default to industry average 3.1%
      
      // Current: Conservative 0.5% follower-to-customer conversion monthly
      instagramCurrentRevenue = instagramMetrics.followersCount * 0.005 * avgTicket;
      
      // Potential: 89% of consumers buy from brands they follow (from stats)
      // With proper content strategy: 1.8% monthly conversion rate for high-engagement accounts
      const potentialConversionRate = engagementRate > 0.025 ? 0.018 : 0.012; // Higher rate for engaged audiences
      instagramPotentialRevenue = instagramMetrics.followersCount * potentialConversionRate * avgTicket;
    }
    
    // FACEBOOK CALCULATIONS (Based on restaurant-stats-markdown.md: 1.3% engagement rate)  
    let facebookCurrentRevenue = 0;
    let facebookPotentialRevenue = 0;
    
    if (facebookMetrics) {
      // Current: Basic organic reach (very limited without ads)
      facebookCurrentRevenue = facebookMetrics.followers * 0.002 * avgTicket;
      
      // Potential: Factor in ads if they're running them, page activity, and better strategy
      let potentialMultiplier = 0.008; // Base conversion rate
      
      if (facebookMetrics.isRunningAds) {
        potentialMultiplier *= 2.5; // Ads significantly boost reach and conversions
      }
      
      if (!facebookMetrics.isActivePage) {
        potentialMultiplier *= 0.5; // Inactive pages perform poorly
      }
      
      // Add page likes bonus (page likes indicate brand affinity)
      const pageLikesBonus = facebookMetrics.likes > facebookMetrics.followers 
        ? (facebookMetrics.likes - facebookMetrics.followers) * 0.001 * avgTicket
        : 0;
      
      facebookPotentialRevenue = (facebookMetrics.followers * potentialMultiplier * avgTicket) + pageLikesBonus;
    }
    
    socialCurrentRevenue = instagramCurrentRevenue + facebookCurrentRevenue;
    
    // Add cross-platform synergy boost (10% when both platforms are active)
    const synergyBoost = (instagramMetrics && facebookMetrics) 
      ? (instagramPotentialRevenue + facebookPotentialRevenue) * 0.1 
      : 0;
      
    socialPotentialRevenue = instagramPotentialRevenue + facebookPotentialRevenue + synergyBoost;
    
  } else {
    // Fallback to basic calculations when detailed metrics aren't available
    const totalSocialFollowers = socialFollowersInstagram + socialFollowersFacebook;
    
    // Current social revenue (estimated at 3% of revenue for most restaurants)
    socialCurrentRevenue = monthlyRevenue * 0.03;
    
    // Basic potential calculations
    const instagramMonthlyRevenue = socialFollowersInstagram * 0.015 * avgTicket; 
    const facebookMonthlyRevenue = socialFollowersFacebook * 0.005 * avgTicket;
    const improvedContentBoost = (instagramMonthlyRevenue + facebookMonthlyRevenue) * 0.25;
    
    socialPotentialRevenue = socialCurrentRevenue + instagramMonthlyRevenue + facebookMonthlyRevenue + improvedContentBoost;
  }

  // SMS Marketing Calculations
  // Most restaurants have zero SMS marketing
  const smsCurrentRevenue = smsListSize > 0 
    ? channelROICalculators.calculateSMSROI(smsListSize, 4, avgTicket)
    : 0;
  
  // Potential SMS list is 30% of monthly customers opting in
  const potentialSMSListSize = monthlyTransactions * 0.3;
  const smsPotentialRevenue = channelROICalculators.calculateSMSROI(
    potentialSMSListSize,
    4, // 4 campaigns per month
    avgTicket
  );

  return {
    seo: {
      currentRevenue: seoCurrentRevenue,
      potentialRevenue: seoPotentialRevenue,
      additionalRevenue: seoPotentialRevenue - seoCurrentRevenue
    },
    social: {
      currentRevenue: socialCurrentRevenue,
      potentialRevenue: socialPotentialRevenue,
      additionalRevenue: socialPotentialRevenue - socialCurrentRevenue
    },
    sms: {
      currentRevenue: smsCurrentRevenue,
      potentialRevenue: smsPotentialRevenue,
      additionalRevenue: smsPotentialRevenue - smsCurrentRevenue
    },
    totalAdditionalRevenue: 
      (seoPotentialRevenue - seoCurrentRevenue) +
      (socialPotentialRevenue - socialCurrentRevenue) +
      (smsPotentialRevenue - smsCurrentRevenue)
  };
}