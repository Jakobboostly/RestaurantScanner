export interface MarketingChannelStats {
  name: string;
  metrics: {
    [key: string]: number | string;
  };
}

export interface SEOStats {
  localPackCTR: { position: number; ctr: number }[];
  organicCTR: { position: number; ctr: number }[];
  ctrAttribution: { localPack: number; organic: number };
  conversionRate: number;
}

export interface SMSStats {
  openRate: number;
  clickRate: number;
  redemptionMultiplier: number;
  unsubscribeRate: number;
  timePreferences: { time: string; percentage: number }[];
}

export interface EmailStats {
  openRate: number;
  clickRate: number;
  conversionRate: number;
  segmentationUplift: number;
  automationOpenRate: number;
}

export interface SocialMediaStats {
  instagram: { engagement: number };
  facebook: { engagement: number };
  followerConversion: number;
  ugcEngagementBoost: number;
  influencerROI: number;
}

export interface LoyaltyStats {
  enrollmentRate: number;
  visitIncrease: number;
  checkIncrease: number;
  redemptionRate: number;
  roiIncrease: number;
  tierProgression: number;
}

export interface SeasonalFactors {
  dayOfWeek: { day: string; multiplier: number }[];
  holidays: { name: string; increase: number }[];
  seasonal: { month: string; adjustment: number }[];
}

export const restaurantBenchmarks = {
  seo: {
    localPackCTR: [
      { position: 1, ctr: 33 },
      { position: 2, ctr: 22 },
      { position: 3, ctr: 13 }
    ],
    organicCTR: [
      { position: 1, ctr: 18 },
      { position: 2, ctr: 7 },
      { position: 3, ctr: 3 },
      { position: 4, ctr: 2 },
      { position: 5, ctr: 1.5 }
    ],
    ctrAttribution: { localPack: 70, organic: 30 },
    conversionRate: 5
  } as SEOStats,

  sms: {
    openRate: 98,
    clickRate: 19.5,
    redemptionMultiplier: 10,
    unsubscribeRate: 3,
    timePreferences: [
      { time: "Evening", percentage: 45 },
      { time: "Afternoon", percentage: 25 },
      { time: "Morning", percentage: 20 },
      { time: "Night", percentage: 10 }
    ]
  } as SMSStats,

  email: {
    openRate: 28.4,
    clickRate: 4.2,
    conversionRate: 2.8,
    segmentationUplift: 14,
    automationOpenRate: 51.36
  } as EmailStats,

  socialMedia: {
    instagram: { engagement: 3.1 },
    facebook: { engagement: 1.3 },
    followerConversion: 89,
    ugcEngagementBoost: 28,
    influencerROI: 6.5
  } as SocialMediaStats,

  loyalty: {
    enrollmentRate: 81,
    visitIncrease: 20,
    checkIncrease: 20,
    redemptionRate: 50,
    roiIncrease: 15,
    tierProgression: 30
  } as LoyaltyStats,

  advertising: {
    googleAdsCPC: 2.1,
    facebookCPM: 7.9,
    searchConversion: 3.5,
    displayConversion: 0.65,
    geofencingLift: 3,
    desktopMobileRatio: 1.7
  },

  seasonal: {
    holidays: [
      { name: "Mother's Day", increase: 51 },
      { name: "Holiday Season", increase: 68 }
    ],
    dayOfWeek: [
      { day: "Friday", multiplier: 1.4 },
      { day: "Saturday", multiplier: 1.5 },
      { day: "Sunday", multiplier: 1.2 },
      { day: "Monday", multiplier: 0.8 },
      { day: "Tuesday", multiplier: 0.7 },
      { day: "Wednesday", multiplier: 0.8 },
      { day: "Thursday", multiplier: 0.9 }
    ],
    seasonal: [
      { month: "January", adjustment: -12 },
      { month: "December", adjustment: 15 }
    ]
  } as SeasonalFactors
};

export interface KeywordData {
  keyword: string;
  monthlySearchVolume: number;
  currentPosition: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  intent: 'High' | 'Medium' | 'Low'; // Commercial intent
}

export const channelROICalculators = {
  calculateAdvancedSEOROI: (keywords: KeywordData[], avgTicket: number) => {
    let totalCurrentRevenue = 0;
    let totalPotentialRevenue = 0;
    let keywordAnalysis: any[] = [];

    keywords.forEach(keyword => {
      // Get CTR based on current position
      const currentCTR = keyword.currentPosition <= 3 
        ? restaurantBenchmarks.seo.localPackCTR.find(p => p.position === keyword.currentPosition)?.ctr || 1
        : keyword.currentPosition <= 5
        ? restaurantBenchmarks.seo.organicCTR.find(p => p.position === keyword.currentPosition)?.ctr || 0.5
        : 0.3; // Beyond position 5

      // Target position (assuming we can get them to position 1-3)
      const targetPosition = keyword.difficulty === 'Easy' ? 1 : keyword.difficulty === 'Medium' ? 2 : 3;
      const targetCTR = restaurantBenchmarks.seo.localPackCTR.find(p => p.position === targetPosition)?.ctr || 33;

      // Apply intent multiplier to conversion rate
      const intentMultiplier = keyword.intent === 'High' ? 1.5 : keyword.intent === 'Medium' ? 1.0 : 0.6;
      const adjustedConversionRate = (restaurantBenchmarks.seo.conversionRate / 100) * intentMultiplier;

      // Calculate monthly revenue
      const currentVisits = keyword.monthlySearchVolume * (currentCTR / 100);
      const targetVisits = keyword.monthlySearchVolume * (targetCTR / 100);
      
      const currentConversions = currentVisits * adjustedConversionRate;
      const targetConversions = targetVisits * adjustedConversionRate;
      
      const currentRevenue = currentConversions * avgTicket;
      const potentialRevenue = targetConversions * avgTicket;

      totalCurrentRevenue += currentRevenue;
      totalPotentialRevenue += potentialRevenue;

      keywordAnalysis.push({
        keyword: keyword.keyword,
        searchVolume: keyword.monthlySearchVolume,
        currentPosition: keyword.currentPosition,
        targetPosition,
        currentRevenue,
        potentialRevenue,
        gap: potentialRevenue - currentRevenue,
        difficulty: keyword.difficulty
      });
    });

    return {
      totalGap: totalPotentialRevenue - totalCurrentRevenue,
      currentRevenue: totalCurrentRevenue,
      potentialRevenue: totalPotentialRevenue,
      keywordBreakdown: keywordAnalysis.sort((a, b) => b.gap - a.gap) // Sort by opportunity size
    };
  },

  // Simplified version for when they don't have keyword data
  calculateSEOROI: (monthlySearches: number, currentPosition: number, targetPosition: number, avgTicket: number) => {
    const currentCTR = restaurantBenchmarks.seo.localPackCTR.find(p => p.position === currentPosition)?.ctr || 1;
    const targetCTR = restaurantBenchmarks.seo.localPackCTR.find(p => p.position === targetPosition)?.ctr || 1;
    
    const currentVisits = monthlySearches * (currentCTR / 100);
    const targetVisits = monthlySearches * (targetCTR / 100);
    const additionalVisits = targetVisits - currentVisits;
    
    const conversions = additionalVisits * (restaurantBenchmarks.seo.conversionRate / 100);
    return conversions * avgTicket;
  },

  calculateSMSROI: (listSize: number, campaignsPerMonth: number, avgTicket: number, offerDiscount: number = 0) => {
    const opens = listSize * (restaurantBenchmarks.sms.openRate / 100);
    const clicks = opens * (restaurantBenchmarks.sms.clickRate / 100);
    const conversions = clicks * 0.3; // Estimated conversion rate from clicks
    const revenue = conversions * avgTicket * (1 - offerDiscount / 100);
    return revenue * campaignsPerMonth;
  },

  calculateLoyaltyROI: (currentCustomers: number, enrollmentRate: number, avgTicket: number, visitsPerMonth: number) => {
    const loyaltyMembers = currentCustomers * (enrollmentRate / 100);
    const additionalVisits = loyaltyMembers * visitsPerMonth * (restaurantBenchmarks.loyalty.visitIncrease / 100);
    const revenueIncrease = additionalVisits * avgTicket * (1 + restaurantBenchmarks.loyalty.checkIncrease / 100);
    return revenueIncrease;
  }
};