import { RestaurantIntelligence } from '../services/placesAPI';
import { KeywordData } from '../services/revenueCalculations';

// Discriminated union for app states - Elm-inspired pattern
export type AppState = 
  | { type: 'Loading'; message?: string }
  | { type: 'RestaurantSearch' }
  | { type: 'SocialDetection'; restaurant: RestaurantIntelligence }
  | { type: 'DataEntry'; data: RestaurantData }
  | { type: 'Analysis'; data: RestaurantData; results: AnalysisResults }
  | { type: 'Error'; message: string; previousState?: AppState };

export interface RestaurantData {
  // Google Places integration
  placeId?: string;
  placeName?: string;
  placeAddress?: string;
  placeRating?: number;
  placeReviewCount?: number;
  placePhotoUrl?: string;
  isDataAutoDetected: boolean;
  
  // Core business metrics
  monthlyRevenue: number;
  avgTicket: number;
  monthlyTransactions: number;
  
  // Current marketing channels
  hasWebsite: boolean;
  website?: string;
  socialFollowersInstagram: number;
  socialFollowersFacebook: number;
  socialLinksDetected: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  
  // Instagram metrics from API
  instagramMetrics?: {
    followersCount: number;
    postsCount: number;
    totalLikes: number;
    username?: string;
    profilePicUrl?: string;
  };
  
  // Facebook metrics from API
  facebookMetrics?: {
    followers: number;
    likes: number;
    isRunningAds: boolean;
    isActivePage: boolean;
    pageName?: string;
    error?: string;
  };
  
  postsPerWeek: number;
  emailListSize: number;
  smsListSize: number;
  currentLocalPackPosition: number;
  currentOrganicPosition: number;
  
  // Individual keyword data
  keywords: KeywordData[];
  keywordsAutoDetected: boolean;
  
  // Legacy keyword data
  localPackKeywords: {
    position1: number;
    position2: number;
    position3: number;
  };
  organicKeywords: {
    position1: number;
    position2: number;
    position3: number;
    position4: number;
    position5: number;
  };
  
  usesDirectMail: boolean;
  mailerFrequency: number;
  usesThirdPartyDelivery: boolean;
  thirdPartyPercentage: number;
  thirdPartyOrdersPerMonth: number;
}

export interface AnalysisResults {
  gaps: ChannelGap[];
  seoROI: number;
  seoBreakdown: any;
  totalGap: number;
  totalPotential: number;
  leverStates: { [key: string]: boolean };
}

export interface ChannelGap {
  channel: string;
  currentRevenue: number;
  potentialRevenue: number;
  gap: number;
  confidence: 'High' | 'Medium' | 'Low';
  serviceOffered: boolean;
  color: string;
}

// Initial state factory
export const createInitialState = (): AppState => ({
  type: 'RestaurantSearch'
});

// Default restaurant data factory
export const createDefaultRestaurantData = (): RestaurantData => ({
  isDataAutoDetected: false,
  monthlyRevenue: 75000,
  avgTicket: 25,
  monthlyTransactions: 3000,
  hasWebsite: true,
  website: undefined,
  socialFollowersInstagram: 0,
  socialFollowersFacebook: 0,
  socialLinksDetected: {},
  postsPerWeek: 0,
  emailListSize: 0,
  smsListSize: 0,
  currentLocalPackPosition: 4,
  currentOrganicPosition: 8,
  keywords: [
    { keyword: "pizza delivery near me", searchVolume: 2000, currentPosition: 4, targetPosition: 1, isLocalPack: true },
    { keyword: "best pizza [city]", searchVolume: 800, currentPosition: 6, targetPosition: 2, isLocalPack: true },
    { keyword: "pizza restaurant", searchVolume: 1200, currentPosition: 8, targetPosition: 3, isLocalPack: false }
  ],
  keywordsAutoDetected: false,
  localPackKeywords: {
    position1: 0,
    position2: 0,
    position3: 0
  },
  organicKeywords: {
    position1: 0,
    position2: 0,
    position3: 0,
    position4: 0,
    position5: 0
  },
  usesDirectMail: false,
  mailerFrequency: 0,
  usesThirdPartyDelivery: false,
  thirdPartyPercentage: 0,
  thirdPartyOrdersPerMonth: 0
});