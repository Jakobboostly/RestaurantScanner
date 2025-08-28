import { RestaurantIntelligence } from '../services/placesAPI';
import { KeywordData } from '../services/revenueCalculations';

// Elm-inspired message pattern - all possible actions in the app
export type AppMsg =
  // Navigation & Flow
  | { type: 'NavigateToStep'; step: 1 | 2 | 3 | 4 }
  | { type: 'SkipRestaurantSearch' }
  | { type: 'StartOver' }
  
  // Restaurant Search
  | { type: 'SearchRestaurant'; query: string }
  | { type: 'SelectRestaurant'; restaurant: RestaurantIntelligence }
  | { type: 'RestaurantSearchComplete'; data: RestaurantIntelligence }
  
  // Social Media Detection
  | { type: 'StartSocialDetection'; placeId: string }
  | { type: 'SocialDetectionSuccess'; profiles: any }
  | { type: 'SocialDetectionFailed'; error: string }
  | { type: 'InstagramMetricsFetched'; metrics: any }
  | { type: 'FacebookMetricsFetched'; metrics: any }
  
  // Data Entry & Updates
  | { type: 'UpdateMonthlyRevenue'; value: number }
  | { type: 'UpdateAvgTicket'; value: number }
  | { type: 'UpdateSocialFollowers'; platform: 'instagram' | 'facebook'; count: number }
  | { type: 'UpdateEmailListSize'; size: number }
  | { type: 'UpdateSMSListSize'; size: number }
  | { type: 'UpdatePostsPerWeek'; count: number }
  
  // Keywords Management
  | { type: 'AddKeyword'; keyword: KeywordData }
  | { type: 'UpdateKeyword'; index: number; keyword: KeywordData }
  | { type: 'RemoveKeyword'; index: number }
  
  // Revenue Lever System
  | { type: 'ToggleLever'; leverId: string }
  | { type: 'ResetAllLevers' }
  
  // SEO Calculator
  | { type: 'UpdateSEOROI'; roi: number; breakdown: any }
  
  // Channel Analysis
  | { type: 'CalculateChannelGaps' }
  | { type: 'UpdateChannelGaps'; gaps: any[] }
  
  // Creative Events (new for creative coding)
  | { type: 'AnimationComplete'; animationId: string }
  | { type: 'AudioToggle'; enabled: boolean }
  | { type: 'StartDemoMode' }
  | { type: 'StopDemoMode' }
  | { type: 'Bubble3DInteraction'; bubbleId: number; action: 'hover' | 'click' | 'release' }
  | { type: 'GlobeRotation'; rotation: { x: number; y: number; z: number } }
  
  // Error Handling
  | { type: 'ShowError'; message: string }
  | { type: 'ClearError' };