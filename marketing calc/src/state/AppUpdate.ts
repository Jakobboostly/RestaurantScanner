import { AppState, RestaurantData, createDefaultRestaurantData } from './AppModel';
import { AppMsg } from './AppMsg';
import { calculateUnifiedRevenue } from '../services/revenueCalculations';
import { placesAPI } from '../services/placesAPI';
import { socialLinkFinder } from '../services/socialLinkFinder';

// Pure functional update - Elm pattern
// Takes current state and message, returns new state and optional side effects
export type UpdateResult = {
  state: AppState;
  cmd?: Cmd;
};

// Command type for side effects
export type Cmd = 
  | { type: 'FetchPlaceDetails'; placeId: string }
  | { type: 'DetectSocialProfiles'; placeId: string }
  | { type: 'FetchInstagramMetrics'; url: string }
  | { type: 'FetchFacebookMetrics'; url: string }
  | { type: 'PlaySound'; soundId: string }
  | { type: 'StartAnimation'; animationId: string }
  | { type: 'None' };

// Main update function - pure, no side effects
export const update = (state: AppState, msg: AppMsg): UpdateResult => {
  switch (msg.type) {
    // Navigation
    case 'NavigateToStep':
      if (state.type === 'DataEntry' || state.type === 'Analysis') {
        switch (msg.step) {
          case 1:
            return { state: { type: 'RestaurantSearch' } };
          case 2:
            return { state: { type: 'DataEntry', data: state.type === 'Analysis' ? state.data : state.data } };
          case 3:
            return { state: { type: 'DataEntry', data: state.type === 'Analysis' ? state.data : state.data } };
          case 4:
            if (state.type === 'DataEntry') {
              return { 
                state: { 
                  type: 'Analysis', 
                  data: state.data, 
                  results: calculateAnalysisResults(state.data) 
                },
                cmd: { type: 'StartAnimation', animationId: 'revenueReveal' }
              };
            }
        }
      }
      return { state };

    case 'SkipRestaurantSearch':
      return { 
        state: { 
          type: 'DataEntry', 
          data: createDefaultRestaurantData() 
        } 
      };

    case 'SelectRestaurant':
      return {
        state: { type: 'SocialDetection', restaurant: msg.restaurant },
        cmd: { type: 'DetectSocialProfiles', placeId: msg.restaurant.placeDetails.place_id }
      };

    case 'SocialDetectionSuccess':
      if (state.type === 'SocialDetection') {
        const data = createDefaultRestaurantData();
        const enhanced = {
          ...data,
          placeId: state.restaurant.placeDetails.place_id,
          placeName: state.restaurant.placeDetails.name,
          placeAddress: state.restaurant.placeDetails.formatted_address,
          placeRating: state.restaurant.placeDetails.rating,
          placeReviewCount: state.restaurant.placeDetails.user_ratings_total,
          website: state.restaurant.placeDetails.website,
          isDataAutoDetected: true,
          monthlyRevenue: state.restaurant.estimatedMonthlyRevenue,
          avgTicket: state.restaurant.estimatedAvgTicket,
          monthlyTransactions: state.restaurant.estimatedMonthlyTransactions,
          socialLinksDetected: msg.profiles
        };
        return { 
          state: { type: 'DataEntry', data: enhanced },
          cmd: { type: 'PlaySound', soundId: 'success' }
        };
      }
      return { state };

    case 'UpdateMonthlyRevenue':
      if (state.type === 'DataEntry' || state.type === 'Analysis') {
        const updatedData = { ...state.data, monthlyRevenue: msg.value };
        return { 
          state: state.type === 'DataEntry' 
            ? { ...state, data: updatedData }
            : { ...state, data: updatedData, results: calculateAnalysisResults(updatedData) }
        };
      }
      return { state };

    case 'UpdateAvgTicket':
      if (state.type === 'DataEntry' || state.type === 'Analysis') {
        const updatedData = { ...state.data, avgTicket: msg.value };
        return { 
          state: state.type === 'DataEntry'
            ? { ...state, data: updatedData }
            : { ...state, data: updatedData, results: calculateAnalysisResults(updatedData) }
        };
      }
      return { state };

    case 'ToggleLever':
      if (state.type === 'Analysis') {
        const newLeverStates = {
          ...state.results.leverStates,
          [msg.leverId]: !state.results.leverStates[msg.leverId]
        };
        return {
          state: {
            ...state,
            results: {
              ...state.results,
              leverStates: newLeverStates
            }
          },
          cmd: { type: 'PlaySound', soundId: 'leverToggle' }
        };
      }
      return { state };

    case 'AddKeyword':
      if (state.type === 'DataEntry' || state.type === 'Analysis') {
        const updatedData = {
          ...state.data,
          keywords: [...state.data.keywords, msg.keyword]
        };
        return {
          state: state.type === 'DataEntry'
            ? { ...state, data: updatedData }
            : { ...state, data: updatedData, results: calculateAnalysisResults(updatedData) }
        };
      }
      return { state };

    case 'ShowError':
      return {
        state: { type: 'Error', message: msg.message, previousState: state }
      };

    case 'ClearError':
      if (state.type === 'Error' && state.previousState) {
        return { state: state.previousState };
      }
      return { state };

    case 'AudioToggle':
      // This would be handled by a global audio manager
      return { 
        state,
        cmd: { type: 'PlaySound', soundId: msg.enabled ? 'audioOn' : 'audioOff' }
      };

    default:
      return { state };
  }
};

// Helper function to calculate analysis results
function calculateAnalysisResults(data: RestaurantData): any {
  const restaurantDataForCalc = {
    monthlyRevenue: data.monthlyRevenue,
    avgTicket: data.avgTicket,
    monthlyTransactions: Math.round(data.monthlyRevenue / data.avgTicket),
    keywords: data.keywords,
    currentLocalPackPosition: data.currentLocalPackPosition,
    currentOrganicPosition: data.currentOrganicPosition,
    socialFollowersInstagram: data.socialFollowersInstagram,
    socialFollowersFacebook: data.socialFollowersFacebook,
    emailListSize: data.emailListSize,
    smsListSize: data.smsListSize,
    localPackKeywords: data.localPackKeywords,
    organicKeywords: data.organicKeywords
  };

  const unifiedCalcs = calculateUnifiedRevenue(restaurantDataForCalc);
  
  const channelGaps = [
    {
      channel: 'SEO & Local Search',
      currentRevenue: unifiedCalcs.seo.currentRevenue,
      potentialRevenue: unifiedCalcs.seo.potentialRevenue,
      gap: unifiedCalcs.seo.additionalRevenue,
      confidence: 'High' as const,
      serviceOffered: true,
      color: '#4CAF50'
    },
    {
      channel: 'Social Media Marketing',
      currentRevenue: unifiedCalcs.social.currentRevenue,
      potentialRevenue: unifiedCalcs.social.potentialRevenue,
      gap: unifiedCalcs.social.additionalRevenue,
      confidence: 'High' as const,
      serviceOffered: true,
      color: '#E91E63'
    },
    {
      channel: 'SMS Marketing',
      currentRevenue: unifiedCalcs.sms.currentRevenue,
      potentialRevenue: unifiedCalcs.sms.potentialRevenue,
      gap: unifiedCalcs.sms.additionalRevenue,
      confidence: 'High' as const,
      serviceOffered: true,
      color: '#2196F3'
    }
  ];

  const totalGap = channelGaps.filter(g => g.serviceOffered).reduce((sum, gap) => sum + gap.gap, 0);
  const totalPotential = channelGaps.reduce((sum, gap) => sum + gap.potentialRevenue, 0);

  return {
    gaps: channelGaps,
    seoROI: 0,
    seoBreakdown: null,
    totalGap,
    totalPotential,
    leverStates: {}
  };
}