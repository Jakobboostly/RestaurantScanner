/**
 * Shared score calculation logic used by both frontend and CSV service
 * This ensures consistent scoring across all parts of the application
 */

export interface ScoreData {
  search: number;
  social: number;
  local: number;
  reviews: number;
  overall: number;
}

export interface ScanData {
  seo?: number;
  keywordAnalysis?: {
    targetKeywords?: any[];
  };
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
  };
  businessProfile?: {
    rating?: number;
    totalReviews?: number;
    photoCount?: number;
    website?: string;
    phoneNumber?: string;
    formatted_address?: string;
  };
  localPackReport?: {
    summary?: {
      visibility_score?: number;
    };
  };
  reviewsAnalysis?: {
    averageRating?: number;
    totalReviews?: number;
    recentReviews?: any[];
    trends?: {
      responseRate?: number;
    };
  };
  competitiveOpportunityKeywords?: Array<{
    position: number;
  }>;
}

/**
 * Calculate scores from scan data using EXACT frontend logic from premium-score-dashboard.tsx
 */
export function calculateScores(scanData: ScanData): ScoreData {
  // Search Score (based on SEO + keyword performance) - EXACT frontend logic
  const searchScore = Math.round(((scanData.seo || 0) + (scanData.keywordAnalysis?.targetKeywords?.length || 0) * 2) / 1.2);

  // Social Score (based on Facebook and Instagram presence only) - EXACT frontend logic
  const socialMediaLinks = scanData.socialMediaLinks || {};
  const facebookPresent = !!socialMediaLinks.facebook;
  const instagramPresent = !!socialMediaLinks.instagram;
  const socialScore = (facebookPresent ? 50 : 0) + (instagramPresent ? 50 : 0); // 50 points each for Facebook and Instagram

  // Local Score (comprehensive local search performance - out of 100) - EXACT frontend logic
  const businessProfile = scanData.businessProfile;
  let localScore = 0;

  // 1. Google Business Profile Quality (30 points)
  if (businessProfile) {
    // Rating quality (20 points max)
    const rating = businessProfile.rating || 0;
    if (rating >= 4.5) localScore += 20;
    else if (rating >= 4.0) localScore += 15;
    else if (rating >= 3.5) localScore += 10;
    else if (rating >= 3.0) localScore += 5;

    // Review volume (10 points max) - Use reviewCount from businessProfile
    const reviewCount = businessProfile.totalReviews || businessProfile.reviewCount || 0;
    if (reviewCount >= 100) localScore += 10;
    else if (reviewCount >= 50) localScore += 8;
    else if (reviewCount >= 25) localScore += 6;
    else if (reviewCount >= 10) localScore += 4;
    else if (reviewCount >= 5) localScore += 2;
  }

  // 2. Local Pack Visibility (35 points max)
  const localPackReport = scanData.localPackReport;
  if (localPackReport && localPackReport.summary) {
    const visibilityScore = localPackReport.summary.visibility_score || 0;
    localScore += Math.round((visibilityScore / 100) * 35);
  }

  // 3. Review Engagement (20 points max)
  const reviewsAnalysis = scanData.reviewsAnalysis;
  if (reviewsAnalysis) {
    // Recent review activity (10 points)
    const recentReviews = reviewsAnalysis.recentReviews?.length || 0;
    if (recentReviews >= 5) localScore += 10;
    else if (recentReviews >= 3) localScore += 7;
    else if (recentReviews >= 1) localScore += 4;

    // Response rate (10 points)
    const responseRate = reviewsAnalysis.trends?.responseRate || 0;
    if (responseRate >= 80) localScore += 10;
    else if (responseRate >= 60) localScore += 7;
    else if (responseRate >= 40) localScore += 5;
    else if (responseRate >= 20) localScore += 3;
  }

  // 4. Local SEO Factors (15 points max)
  // Business profile completeness (5 points)
  if (businessProfile?.website) localScore += 2;
  if (businessProfile?.phoneNumber) localScore += 2;
  if (businessProfile?.formatted_address) localScore += 1;

  // Photo presence (5 points)
  const photoCount = businessProfile?.photoCount || 0;
  if (photoCount >= 20) localScore += 5;
  else if (photoCount >= 10) localScore += 3;
  else if (photoCount >= 5) localScore += 2;
  else if (photoCount >= 1) localScore += 1;

  // Local keyword performance (5 points)
  const competitiveKeywords = scanData.competitiveOpportunityKeywords || [];
  const rankedKeywords = competitiveKeywords.filter(k => k.position > 0 && k.position <= 10);
  const keywordScore = Math.min(rankedKeywords.length, 5);
  localScore += keywordScore;

  localScore = Math.round(localScore);

  // Reviews Score (based on rating and review count from reviewsAnalysis) - EXACT frontend logic
  const reviewsScore = Math.round(
    (reviewsAnalysis?.averageRating || businessProfile?.rating || 0) * 15 +
    (reviewsAnalysis?.totalReviews || businessProfile?.totalReviews || businessProfile?.reviewCount ? Math.min((reviewsAnalysis?.totalReviews || businessProfile?.totalReviews || businessProfile?.reviewCount || 0) / 20, 25) : 0)
  );

  // Overall Score (average of all 4 categories) - EXACT frontend logic
  const overall = Math.round((searchScore + socialScore + localScore + reviewsScore) / 4);

  return {
    search: Math.min(searchScore, 100),
    social: Math.min(socialScore, 100),
    local: Math.min(localScore, 100),
    reviews: Math.min(reviewsScore, 100),
    overall: Math.min(overall, 100)
  };
}