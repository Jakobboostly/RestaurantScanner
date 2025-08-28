import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { restaurantBenchmarks } from '../data/restaurantStats';
import { calculateUnifiedRevenue, KeywordData } from '../services/revenueCalculations';
import { RestaurantIntelligence } from '../services/placesAPI';
import { socialLinkFinder, SocialDetectionResult } from '../services/socialLinkFinder';
import { fetchInstagramMetrics } from '../services/instagramScraper';
import { fetchFacebookMetrics } from '../services/facebookScraper';
import EnhancedFloatingBubbles from './EnhancedFloatingBubbles';
import RevenueLeverSystem from './RevenueLeverSystem';
import RevenueAttribution from './RevenueAttribution';
import DualRevenueVisualization from './DualRevenueVisualization';
import ComprehensiveMetrics from './ComprehensiveMetrics';
import RestaurantSearch from './RestaurantSearch';

interface RestaurantData {
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
  
  // Individual keyword data (preferred method)
  keywords: KeywordData[];
  keywordsAutoDetected: boolean;
  keywordsFetchError?: string;
  
  // Legacy: Keyword rankings by position (kept for backwards compatibility)
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
  mailerFrequency: number; // per month
  usesThirdPartyDelivery: boolean;
  thirdPartyPercentage: number; // percentage of total revenue
  thirdPartyOrdersPerMonth: number; // alternative to percentage
}

interface ChannelGap {
  channel: string;
  currentRevenue: number;
  potentialRevenue: number;
  gap: number;
  confidence: 'High' | 'Medium' | 'Low';
  serviceOffered: boolean;
  color: string;
}

const SalesDemoTool: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isLoadingDetection, setIsLoadingDetection] = useState(false);

  // Revenue calculation function with industry CTR rates
  const calculateKeywordRevenueImpact = (keyword: KeywordData, avgTicket: number) => {
    const currentPosition = keyword.currentPosition;
    const targetPosition = Math.max(1, currentPosition - 2); // Always improve by 2 positions
    const searchVolume = keyword.searchVolume || 0;
    const isLocalPack = keyword.isLocalPack;
    
    // Industry-standard CTR rates
    const getCTR = (position: number, isLocal: boolean) => {
      if (isLocal) {
        // Local Pack CTR rates
        switch (position) {
          case 1: return 0.33;  // 33%
          case 2: return 0.22;  // 22%
          case 3: return 0.13;  // 13%
          case 4: return 0.08;  // 8%
          case 5: return 0.05;  // 5%
          case 6: return 0.03;  // 3%
          case 7: return 0.02;  // 2%
          default: return Math.max(0.01, 0.05 / position); // Diminishing returns
        }
      } else {
        // Organic CTR rates
        switch (position) {
          case 1: return 0.18;  // 18%
          case 2: return 0.07;  // 7%
          case 3: return 0.03;  // 3%
          case 4: return 0.02;  // 2%
          case 5: return 0.015; // 1.5%
          case 6: return 0.01;  // 1%
          case 7: return 0.008; // 0.8%
          default: return Math.max(0.005, 0.02 / position); // Diminishing returns
        }
      }
    };

    const currentCTR = getCTR(currentPosition, isLocalPack);
    const targetCTR = getCTR(targetPosition, isLocalPack);
    const ctrImprovement = targetCTR - currentCTR;
    
    // Revenue calculation: Additional traffic × conversion rate × average ticket
    const additionalTraffic = searchVolume * ctrImprovement;
    const conversionRate = 0.05; // 5% standard restaurant conversion rate
    const monthlyRevenueIncrease = additionalTraffic * conversionRate * avgTicket;
    
    return {
      currentPosition,
      targetPosition,
      currentCTR,
      targetCTR,
      additionalTraffic: Math.round(additionalTraffic),
      monthlyRevenueIncrease: Math.round(monthlyRevenueIncrease)
    };
  };
  
  const [data, setData] = useState<RestaurantData>({
    // Google Places integration
    placeId: undefined,
    placeName: undefined,
    placeAddress: undefined,
    placeRating: undefined,
    placeReviewCount: undefined,
    placePhotoUrl: undefined,
    isDataAutoDetected: false,
    
    // Core business metrics (start with defaults for demo)
    monthlyRevenue: 75000,
    avgTicket: 25,
    monthlyTransactions: 3000,
    
    // Current marketing channels
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
    
    // Individual keyword data
    keywords: [
      // Pre-populate with some example keywords (will be replaced with real data)
      { keyword: "pizza delivery near me", searchVolume: 2000, currentPosition: 4, targetPosition: 1, isLocalPack: true },
      { keyword: "best pizza [city]", searchVolume: 800, currentPosition: 6, targetPosition: 2, isLocalPack: true },
      { keyword: "pizza restaurant", searchVolume: 1200, currentPosition: 8, targetPosition: 3, isLocalPack: false }
    ],
    keywordsAutoDetected: false,
    
    // Legacy keyword data
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

  const [gaps, setGaps] = useState<ChannelGap[]>([]);
  const [seoROI, setSeoROI] = useState(0);
  const [seoBreakdown, setSeoBreakdown] = useState<any>(null);
  const [socialDetectionStatus, setSocialDetectionStatus] = useState<'idle' | 'detecting' | 'completed' | 'failed'>('idle');
  const [profileDetected, setProfileDetected] = useState<Record<string, boolean>>({});
  const [metricsFetched, setMetricsFetched] = useState<Record<string, boolean>>({});

  // Handle restaurant selection from Places API
  const handleRestaurantSelected = async (intelligence: RestaurantIntelligence) => {
    const placeDetails = intelligence.placeDetails;
    
    // First, set the basic restaurant data
    setData(prevData => ({
      ...prevData,
      // Google Places data
      placeId: placeDetails.place_id,
      placeName: placeDetails.name,
      placeAddress: placeDetails.formatted_address,
      placeRating: placeDetails.rating,
      placeReviewCount: placeDetails.user_ratings_total,
      placePhotoUrl: placeDetails.photos?.[0]?.photo_reference,
      website: placeDetails.website,
      isDataAutoDetected: true,
      
      // Auto-populated business metrics
      monthlyRevenue: intelligence.estimatedMonthlyRevenue,
      avgTicket: intelligence.estimatedAvgTicket,
      monthlyTransactions: intelligence.estimatedMonthlyTransactions,
      
      // Initialize social media detection
      socialLinksDetected: {},
      
      // Initialize with keywords from intelligence (auto-detected or default)
      keywords: intelligence.keywords || [],
      keywordsAutoDetected: !!(intelligence.keywords && intelligence.keywords.length > 0),
      keywordsFetchError: intelligence.keywordsFetchError
    }));
    
    // Reset scan indicators and show a polished blocking scan while we detect
    setIsLoadingDetection(true);
    setSocialDetectionStatus('detecting');
    setProfileDetected({});
    setMetricsFetched({});
    
    try {
      console.log('Starting social media detection for:', placeDetails.place_id);
      const socialResult = await socialLinkFinder.detectSocialProfiles(placeDetails.place_id);
      
      if (socialResult.success && Object.keys(socialResult.profiles).length > 0) {
        console.log('Social profiles detected:', socialResult.profiles);
        // Update profile detection ticks
        const pd: Record<string, boolean> = {
          instagram: !!socialResult.profiles.instagram,
          facebook: !!socialResult.profiles.facebook
        };
        setProfileDetected(pd);
        
        // Update data with detected social profiles
        setData(prevData => ({
          ...prevData,
          socialLinksDetected: socialResult.profiles,
          socialFollowersInstagram: socialResult.profiles.instagram ? 0 : prevData.socialFollowersInstagram,
          socialFollowersFacebook: socialResult.profiles.facebook ? 0 : prevData.socialFollowersFacebook
        }));
        
        // Fetch social media metrics in parallel
        const socialPromises = [];
        
        if (socialResult.profiles.instagram) {
          console.log('Fetching Instagram metrics for:', socialResult.profiles.instagram);
          socialPromises.push(
            fetchInstagramMetrics(socialResult.profiles.instagram)
              .then(instagramData => {
                if (!instagramData.error) {
                  console.log('Instagram metrics fetched:', instagramData);
                  setData(prevData => ({
                    ...prevData,
                    instagramMetrics: instagramData,
                    socialFollowersInstagram: instagramData.followersCount
                  }));
                  setMetricsFetched(prev => ({ ...prev, instagram: true }));
                } else {
                  console.error('Failed to fetch Instagram metrics:', instagramData.error);
                }
              })
              .catch(err => console.error('Error calling Instagram API:', err))
          );
        }

        if (socialResult.profiles.facebook) {
          console.log('Fetching Facebook metrics for:', socialResult.profiles.facebook);
          socialPromises.push(
            fetchFacebookMetrics(socialResult.profiles.facebook)
              .then(facebookData => {
                if (!facebookData.error) {
                  console.log('Facebook metrics fetched:', facebookData);
                  setData(prevData => ({
                    ...prevData,
                    facebookMetrics: facebookData,
                    socialFollowersFacebook: facebookData.followers
                  }));
                  setMetricsFetched(prev => ({ ...prev, facebook: true }));
                } else {
                  console.error('Failed to fetch Facebook metrics:', facebookData.error);
                }
              })
              .catch(err => console.error('Error calling Facebook API:', err))
          );
        }
        
        // Wait for all social media metrics to be fetched
        if (socialPromises.length > 0) {
          await Promise.allSettled(socialPromises);
        }
        
        setSocialDetectionStatus('completed');
      } else {
        console.log('No social profiles detected or error occurred:', socialResult.error);
        setSocialDetectionStatus('failed');
      }

      // If we didn't get keywords from the API, add some defaults for the user to edit
      console.log('DEBUG: intelligence.keywords:', intelligence.keywords);
      console.log('DEBUG: intelligence.keywords.length:', intelligence.keywords?.length);
      
      if (!intelligence.keywords || intelligence.keywords.length === 0) {
        const defaultKeywords: KeywordData[] = [
          { keyword: "restaurants near me", searchVolume: 2400, currentPosition: 8, targetPosition: 2, isLocalPack: true },
          { keyword: `${placeDetails.name} restaurant`, searchVolume: 890, currentPosition: 5, targetPosition: 1, isLocalPack: false },
          { keyword: "best restaurants [city]", searchVolume: 1200, currentPosition: 12, targetPosition: 3, isLocalPack: true }
        ];

        setData(prevData => ({
          ...prevData,
          keywords: defaultKeywords,
          keywordsAutoDetected: false
        }));
        console.log('DEBUG: Set default keywords for manual editing');
      } else {
        console.log(`DEBUG: Got ${intelligence.keywords.length} keywords from API, keeping them`);
      }
      
      // Detection finished
      setIsLoadingDetection(false);
      setStep(2);
    } catch (error) {
      console.error('Restaurant data processing failed:', error);
      setSocialDetectionStatus('failed');
      // Detection failed
      setIsLoadingDetection(false);
      setStep(2);
    }
  };

  // Handle skip functionality
  const handleSkipRestaurantSearch = () => {
    console.log('Skipping restaurant search, proceeding with demo data');
    setStep(2);
  };

  // Handle restaurant selection from Places API
  const handleRestaurantSkipped = () => {
    console.log('Restaurant search skipped, using demo data');
    // Keep the existing demo data and proceed
    setStep(2);
  };

  const handleSEOCalculation = (roi: number, breakdown: any) => {
    setSeoROI(roi);
    setSeoBreakdown(breakdown);
  };

  const calculateChannelGaps = () => {
    // Use unified revenue calculations
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
    
    // Email calculations (not part of main 3 services)
    const potentialSMSList = Math.round(data.monthlyRevenue / data.avgTicket) * 0.3;
    const emailPotential = potentialSMSList * (restaurantBenchmarks.email.openRate / 100) * (restaurantBenchmarks.email.clickRate / 100) * (restaurantBenchmarks.email.conversionRate / 100) * data.avgTicket * 8;
    const currentEmailRevenue = data.emailListSize * (restaurantBenchmarks.email.openRate / 100) * (restaurantBenchmarks.email.clickRate / 100) * (restaurantBenchmarks.email.conversionRate / 100) * data.avgTicket * 8;

    const channelGaps: ChannelGap[] = [
      {
        channel: 'SEO & Local Search',
        currentRevenue: unifiedCalcs.seo.currentRevenue,
        potentialRevenue: unifiedCalcs.seo.potentialRevenue,
        gap: unifiedCalcs.seo.additionalRevenue,
        confidence: 'High',
        serviceOffered: true,
        color: '#4CAF50'
      },
      {
        channel: 'Social Media Marketing',
        currentRevenue: unifiedCalcs.social.currentRevenue,
        potentialRevenue: unifiedCalcs.social.potentialRevenue,
        gap: unifiedCalcs.social.additionalRevenue,
        confidence: 'High',
        serviceOffered: true,
        color: '#E91E63'
      },
      {
        channel: 'SMS Marketing',
        currentRevenue: unifiedCalcs.sms.currentRevenue,
        potentialRevenue: unifiedCalcs.sms.potentialRevenue,
        gap: unifiedCalcs.sms.additionalRevenue,
        confidence: 'High',
        serviceOffered: true,
        color: '#2196F3'
      },
      {
        channel: 'Email Marketing',
        currentRevenue: currentEmailRevenue,
        potentialRevenue: emailPotential,
        gap: emailPotential - currentEmailRevenue,
        confidence: 'Medium',
        serviceOffered: false,
        color: '#FF9800'
      },
      {
        channel: 'Word of Mouth',
        currentRevenue: data.monthlyRevenue * 0.4, // Assuming 40% is word of mouth
        potentialRevenue: data.monthlyRevenue * 0.4,
        gap: 0,
        confidence: 'Low',
        serviceOffered: false,
        color: '#9E9E9E'
      }
    ];

    setGaps(channelGaps);
  };

  useEffect(() => {
    calculateChannelGaps();
  }, [data, seoROI]);

  const totalGap = gaps.filter(g => g.serviceOffered).reduce((sum, gap) => sum + gap.gap, 0);
  const totalPotential = gaps.reduce((sum, gap) => sum + gap.potentialRevenue, 0);

  // Premium blocking loading screen during social media detection
  if (isLoadingDetection) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Decorative blobs */}
        <div aria-hidden="true" style={{ position: 'absolute', top: '-120px', right: '-120px', width: 360, height: 360, background: 'conic-gradient(from 180deg at 50% 50%, rgba(139,156,244,0.45), rgba(169,127,196,0.45), rgba(16,185,129,0.12))', filter: 'blur(60px)', opacity: 0.8, borderRadius: '50%' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: '-140px', left: '-140px', width: 380, height: 380, background: 'radial-gradient(closest-side, rgba(2,132,199,0.25), rgba(2,132,199,0))', filter: 'blur(50px)', opacity: 0.9, borderRadius: '50%' }} />

        <div style={{
          width: '100%',
          maxWidth: 820,
          background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
          borderRadius: 28,
          padding: '36px 36px 28px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.22)',
          border: '1px solid rgba(255,255,255,0.7)',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3',
              padding: '6px 12px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 700
            }}>
              <span style={{ width: 12, height: 12, border: '2px solid #c7d2fe', borderTopColor: '#6366f1', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
              Preparing your analysis
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>~10 seconds</div>
          </div>

          {/* Restaurant summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', border: '1px solid #e5e7eb', borderRadius: 16, background: 'white', marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8b9cf4, #a97fc4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {data.placeName ? data.placeName.charAt(0).toUpperCase() : '🍽️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#111827' }}>{data.placeName || 'Selected Restaurant'}</div>
              <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{data.placeAddress || 'Address loading…'}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: '0.85rem' }}>
                {data.placeRating && <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>⭐ {data.placeRating}</span>}
                {data.placeReviewCount && <span style={{ color: '#9ca3af' }}>{data.placeReviewCount.toLocaleString()} reviews</span>}
                {data.website && <span style={{ background: '#ecfeff', color: '#155e75', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Website</span>}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #8b9cf4, #a97fc4)', borderRadius: 9999, animation: 'indet 1.6s ease-in-out infinite' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#475569', fontSize: '0.85rem' }}>
              <span>Detecting social profiles</span>
              <span>Fetching metrics</span>
              <span>Finalizing</span>
            </div>
          </div>

          {/* Step list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
            {[{label:'Profiles',desc:'Instagram, Facebook'},{label:'Metrics',desc:'Followers, activity, signals'},{label:'Sync',desc:'Apply results to analysis'}].map((s, i) => (
              <div key={i} style={{ background:'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', alignItems:'center', gap:8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a5b4fc', boxShadow: '0 0 0 0 rgba(165,180,252,0.7)', animation: 'pulseDot 1.6s ease-in-out infinite' }} />
                  <div style={{ fontWeight: 700, color:'#111827' }}>{s.label}</div>
                </div>
                <div style={{ color:'#64748b', fontSize:'0.85rem' }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Network status ticks */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {[
              { key: 'instagram', label: 'Instagram', icon: '📸' },
              { key: 'facebook',  label: 'Facebook',  icon: '📘' }
            ].map(net => {
              const detected = !!profileDetected[net.key];
              const metricsEnabled = net.key === 'instagram' || net.key === 'facebook';
              const fetched = !!metricsFetched[net.key];
              const bg = detected ? (fetched ? '#ecfdf5' : '#eff6ff') : '#f8fafc';
              const border = detected ? (fetched ? '#34d399' : '#93c5fd') : '#e5e7eb';
              const color = detected ? (fetched ? '#065f46' : '#1e3a8a') : '#64748b';
              return (
                <div key={net.key} style={{
                  display:'inline-flex', alignItems:'center', gap: 8,
                  background: bg, border: `1px solid ${border}`, color,
                  padding: '6px 10px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 600
                }}>
                  <span style={{ fontSize: '1rem' }}>{net.icon}</span>
                  <span>{net.label}</span>
                  {detected ? (
                    metricsEnabled ? (
                      fetched ? (
                        <span style={{ color: '#059669' }}>✓</span>
                      ) : (
                        <span style={{ width: 12, height: 12, border: '2px solid #bfdbfe', borderTopColor: '#60a5fa', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                      )
                    ) : (
                      <span style={{ color: '#059669' }}>✓</span>
                    )
                  ) : (
                    <span style={{ opacity: 0.7 }}>…</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 18 }}>
            <div style={{ color:'#64748b', fontSize:'0.85rem' }}>You can skip if you’re in a hurry.</div>
            <button onClick={() => { setIsLoadingDetection(false); setStep(2); }}
              style={{ background:'transparent', color:'#4f46e5', border:'1px solid #c7d2fe', padding:'8px 12px', borderRadius: 8, fontWeight:700, cursor:'pointer' }}
              onMouseEnter={(e)=>{ e.currentTarget.style.background='#eef2ff'; }}
              onMouseLeave={(e)=>{ e.currentTarget.style.background='transparent'; }}
            >
              Skip for now →
            </button>
          </div>

          <style>
            {`
              @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
              @keyframes indet {
                0% { transform: translateX(-60%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
              }
              @keyframes pulseDot { 0%,100%{ box-shadow: 0 0 0 0 rgba(165,180,252,0.7);} 50%{ box-shadow: 0 0 0 6px rgba(165,180,252,0); } }
            `}
          </style>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        <RestaurantSearch 
          onRestaurantSelected={handleRestaurantSelected}
          onSkip={handleSkipRestaurantSearch}
        />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Enhanced Floating Bubbles */}
        <EnhancedFloatingBubbles 
          revenueMultiplier={data.monthlyRevenue / 50000}
        />
        
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '30px',
            padding: '60px 50px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(139, 156, 244, 0.1)',
            border: '2px solid rgba(139, 156, 244, 0.3)',
            borderRadius: '8px',
            padding: '8px 20px',
            marginBottom: '40px',
            color: '#8b9cf4',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            ● LIVE • ENTERPRISE REVENUE INTELLIGENCE
          </div>

            {isLoadingDetection && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                color: '#1e293b',
                padding: '8px 12px',
                borderRadius: '9999px',
                marginBottom: '20px'
              }}>
                <span style={{
                  width: '14px', height: '14px', border: '2px solid #c7d2fe', borderTopColor: '#6366f1',
                  borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Fetching social profiles in background…</span>
              </div>
            )}

            <h1 style={{
              fontSize: '3.2rem',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '25px',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}>
              Revenue Gap Analysis
            </h1>
            
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              marginBottom: '50px',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 50px auto',
              fontWeight: '400'
            }}>
              Comprehensive marketing channel assessment with <strong>quantified opportunity identification</strong> and competitive benchmarking
            </p>

            {/* Enterprise Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              marginBottom: '50px'
            }}>
              <div style={{
                background: 'white',
                border: '2px solid #f0f0f0',
                color: '#333',
                padding: '25px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', color: '#e74c3c' }}>98%</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>SMS Open Rate</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Industry benchmark</div>
              </div>

              <div style={{
                background: 'white',
                border: '2px solid #f0f0f0',
                color: '#333',
                padding: '25px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', color: '#27ae60' }}>33%</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Local Pack Position #1 CTR</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>vs 18% Organic Position #1</div>
              </div>

              <div style={{
                background: 'white',
                border: '2px solid #f0f0f0',
                color: '#333',
                padding: '25px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', color: '#8b9cf4' }}>$15K</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Avg. Monthly Opportunity</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Per location analyzed</div>
              </div>
            </div>

            {/* Input Section with Better Design */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '30px',
              marginBottom: '40px',
              textAlign: 'left'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Monthly Revenue
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#666',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    $
                  </span>
                  <input
                    type="text"
                    value={data.monthlyRevenue || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setData({...data, monthlyRevenue: Number(value) || 0});
                    }}
                    style={{
                      width: '100%',
                      padding: '18px 24px 18px 45px',
                      border: '3px solid #f0f0f0',
                      borderRadius: '15px',
                      fontSize: '20px',
                      fontWeight: '700',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b9cf4';
                      e.target.style.background = 'white';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#f0f0f0';
                      e.target.style.background = '#fafafa';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Average Ticket Size
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#666',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    $
                  </span>
                  <input
                    type="text"
                    value={data.avgTicket || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setData({...data, avgTicket: Number(value) || 0});
                    }}
                    style={{
                      width: '100%',
                      padding: '18px 24px 18px 45px',
                      border: '3px solid #f0f0f0',
                      borderRadius: '15px',
                      fontSize: '20px',
                      fontWeight: '700',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b9cf4';
                      e.target.style.background = 'white';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#f0f0f0';
                      e.target.style.background = '#fafafa';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Calculated Transaction Display */}
            <div style={{ 
              background: '#f8f9fa',
              border: '2px solid #e9ecef',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '40px'
            }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#666',
                marginBottom: '10px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Calculated Monthly Volume
              </p>
              <p style={{
                fontSize: '2.8rem',
                fontWeight: '800',
                color: '#1a1a1a',
                margin: '0 0 5px 0'
              }}>
                {Math.round(data.monthlyRevenue / data.avgTicket).toLocaleString()}
              </p>
              <p style={{ 
                fontSize: '16px', 
                color: '#666',
                margin: '0',
                fontWeight: '500'
              }}>
                transactions per month
              </p>
            </div>

            <button
              onClick={() => setStep(3)}
              style={{
                background: '#1a1a1a',
                color: 'white',
                border: '2px solid #1a1a1a',
                padding: '18px 50px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#1a1a1a';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Begin Analysis →
            </button>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '30px',
              marginTop: '25px',
              fontSize: '12px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span>• Enterprise Grade</span>
              <span>• Real-Time Data</span>
              <span>• 500+ Locations Analyzed</span>
            </div>
          </div>
        </div>

        <style>
          {`
            @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
          `}
        </style>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
            borderRadius: '30px',
            padding: '60px',
            boxShadow: '0 30px 100px -20px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.02)',
            border: '1px solid rgba(255,255,255,0.8)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(139,156,244,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              textAlign: 'center',
              marginBottom: '50px'
            }}>
              <h2 style={{
                fontSize: '2.8rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '15px',
                letterSpacing: '-0.02em'
              }}>
                Current Marketing Assessment
              </h2>
              
              <p style={{
                fontSize: '1.3rem',
                color: '#64748b',
                marginBottom: '0',
                fontWeight: '400',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Help us understand your current marketing channels
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', position: 'relative', zIndex: 1 }}>
              <div>
                <h3 style={{ 
                  color: '#1e293b', 
                  marginBottom: '30px', 
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    borderRadius: '12px',
                    fontSize: '20px'
                  }}>📱</span>
                  Social Media
                  {socialDetectionStatus === 'detecting' && (
                    <span style={{
                      marginLeft: '12px',
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '600',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      🔍 Detecting...
                    </span>
                  )}
                  {socialDetectionStatus === 'completed' && data.socialLinksDetected && Object.keys(data.socialLinksDetected).length > 0 && (
                    <span style={{
                      marginLeft: '12px',
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '600'
                    }}>
                      ✓ Auto-detected
                    </span>
                  )}
                  {socialDetectionStatus === 'failed' && (
                    <span style={{
                      marginLeft: '12px',
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '600'
                    }}>
                      ⚠ Detection failed
                    </span>
                  )}
                </h3>


                {/* Auto-detected social profiles display */}
                {data.socialLinksDetected && Object.keys(data.socialLinksDetected).length > 0 && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '30px'
                  }}>
                    <h4 style={{
                      color: '#059669',
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🎯 Detected Social Profiles
                    </h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {data.socialLinksDetected.instagram && (
                        <a 
                          href={data.socialLinksDetected.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#059669',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            padding: '8px 12px',
                            background: 'white',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          📷 Instagram
                        </a>
                      )}
                      {data.socialLinksDetected.facebook && (
                        <a 
                          href={data.socialLinksDetected.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#059669',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            padding: '8px 12px',
                            background: 'white',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          👥 Facebook
                        </a>
                      )}
                      {data.socialLinksDetected.youtube && (
                        <a 
                          href={data.socialLinksDetected.youtube} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#059669',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            padding: '8px 12px',
                            background: 'white',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          🎥 YouTube
                        </a>
                      )}
                      {data.socialLinksDetected.tiktok && (
                        <a 
                          href={data.socialLinksDetected.tiktok} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#059669',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            padding: '8px 12px',
                            background: 'white',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          🎵 TikTok: {data.socialLinksDetected.tiktok}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#555' 
                  }}>
                    Instagram Followers
                    {data.socialLinksDetected?.instagram && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#10b981',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        Profile Found
                      </span>
                    )}
                    {data.instagramMetrics && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        Data Fetched
                      </span>
                    )}
                  </label>
                  {data.instagramMetrics && (
                    <div style={{
                      padding: '10px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Posts:</span>
                        <strong>{data.instagramMetrics.postsCount.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Likes (last 10 posts):</span>
                        <strong>{data.instagramMetrics.totalLikes.toLocaleString()}</strong>
                      </div>
                      {data.instagramMetrics.username && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Username:</span>
                          <strong>@{data.instagramMetrics.username}</strong>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="number"
                    value={data.socialFollowersInstagram || ''}
                    onChange={(e) => setData({...data, socialFollowersInstagram: Number(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: data.socialLinksDetected?.instagram ? '2px solid #10b981' : '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      background: data.socialLinksDetected?.instagram ? '#f0fdf4' : 'white'
                    }}
                    placeholder={data.instagramMetrics 
                      ? `Auto-detected: ${data.instagramMetrics.followersCount.toLocaleString()} followers` 
                      : data.socialLinksDetected?.instagram 
                        ? 'Enter follower count for detected profile' 
                        : 'Enter follower count'}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#555' 
                  }}>
                    Facebook Followers
                    {data.socialLinksDetected?.facebook && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#10b981',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        Profile Found
                      </span>
                    )}
                    {data.facebookMetrics && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        Data Fetched
                      </span>
                    )}
                    {data.facebookMetrics?.isRunningAds && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#f59e0b',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        Running Ads
                      </span>
                    )}
                    {data.facebookMetrics?.error && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#ef4444',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        Access Limited
                      </span>
                    )}
                  </label>
                  {data.facebookMetrics && !data.facebookMetrics.error && (
                    <div style={{
                      padding: '10px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Page Likes:</span>
                        <strong>{data.facebookMetrics.likes.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Page Status:</span>
                        <strong style={{ color: data.facebookMetrics.isActivePage ? '#10b981' : '#ef4444' }}>
                          {data.facebookMetrics.isActivePage ? 'Active' : 'Inactive'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Advertising:</span>
                        <strong style={{ color: data.facebookMetrics.isRunningAds ? '#f59e0b' : '#64748b' }}>
                          {data.facebookMetrics.isRunningAds ? 'Active Ads' : 'No Ads'}
                        </strong>
                      </div>
                      {data.facebookMetrics.pageName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Page Name:</span>
                          <strong>{data.facebookMetrics.pageName}</strong>
                        </div>
                      )}
                    </div>
                  )}
                  {data.facebookMetrics?.error && (
                    <div style={{
                      padding: '12px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      fontSize: '14px',
                      color: '#991b1b'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        ⚠️ Facebook Page Optimization Needed
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                        Your Facebook page appears to be private or restricted. This limits customer discovery and engagement. 
                        We can help optimize your page settings and GBP link for maximum visibility.
                      </div>
                    </div>
                  )}
                  <input
                    type="number"
                    value={data.socialFollowersFacebook || ''}
                    onChange={(e) => setData({...data, socialFollowersFacebook: Number(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: data.socialLinksDetected?.facebook ? '2px solid #10b981' : '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      background: data.socialLinksDetected?.facebook ? '#f0fdf4' : 'white'
                    }}
                    placeholder={data.facebookMetrics 
                      ? `Auto-detected: ${data.facebookMetrics.followers.toLocaleString()} followers` 
                      : data.socialLinksDetected?.facebook 
                        ? 'Enter follower count for detected profile' 
                        : 'Enter follower count'}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Posts Per Week
                  </label>
                  <input
                    type="number"
                    value={data.postsPerWeek || ''}
                    onChange={(e) => setData({...data, postsPerWeek: Number(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <h3 style={{ 
                  color: '#1e293b', 
                  marginBottom: '30px', 
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '12px',
                    fontSize: '20px'
                  }}>📊</span>
                  Other Channels
                </h3>
                
                {/* Keyword Data Section */}
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ 
                    color: '#1e293b', 
                    marginBottom: '12px', 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      background: data.keywordsAutoDetected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                      borderRadius: '8px',
                      fontSize: '18px',
                      color: data.keywordsAutoDetected ? 'white' : '#64748b',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      {data.keywordsAutoDetected ? '🎯' : '🔍'}
                    </span>
                    {data.keywordsAutoDetected ? 'Your Keywords (Auto-Detected)' : 'Your Keywords'}
                  </h4>
                  
                  {data.keywordsAutoDetected ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: '8px',
                      border: '1px solid #10b981'
                    }}>
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                        ✨ Powered by DataForSEO • {data.keywords.length} keywords found • Mobile rankings
                      </span>
                      {data.website && (
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#10b981',
                          background: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          {(() => {
                            try {
                              return new URL(data.website.startsWith('http') ? data.website : `https://${data.website}`).hostname.replace(/^www\./, '');
                            } catch {
                              return data.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                            }
                          })()}
                        </span>
                      )}
                    </div>
                  ) : data.keywordsFetchError ? (
                    <div style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      borderRadius: '8px',
                      border: '1px solid #ef4444',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>
                        ❌ {data.keywordsFetchError} • Using default keywords for analysis
                      </span>
                    </div>
                  ) : !data.website ? (
                    <div style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                        ⚠️ No website detected • Using default restaurant keywords for analysis
                      </span>
                    </div>
                  ) : false ? (
                    <div style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
                      borderRadius: '8px',
                      border: '1px solid #0ea5e9',
                      marginBottom: '12px'
                    }}>
                      <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>
                        🔍 Analyzing website keywords...
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                      Real keyword data from your website rankings.
                    </p>
                  )}
                  
                  {/* Column Headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.3fr 70px 60px 60px 60px 100px 32px',
                    gap: '8px',
                    alignItems: 'center',
                    marginBottom: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    <div>Keyword</div>
                    <div style={{ textAlign: 'center' }}>Volume</div>
                    <div style={{ textAlign: 'center' }}>Current</div>
                    <div style={{ textAlign: 'center' }}>Target</div>
                    <div style={{ textAlign: 'center' }}>Type</div>
                    <div style={{ textAlign: 'center' }}>Revenue Impact</div>
                    <div></div>
                  </div>
                  
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Email List Size
                  </label>
                  <input
                    type="number"
                    value={data.emailListSize || ''}
                    onChange={(e) => setData({...data, emailListSize: Number(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    SMS List Size
                  </label>
                  <input
                    type="number"
                    value={data.smsListSize || ''}
                    onChange={(e) => setData({...data, smsListSize: Number(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Direct Mail Frequency (per month)
                  </label>
                  <input
                    type="number"
                    value={data.mailerFrequency || ''}
                    onChange={(e) => setData({...data, mailerFrequency: Number(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: '600', color: '#555' }}>
                    <input
                      type="checkbox"
                      checked={data.usesThirdPartyDelivery}
                      onChange={(e) => setData({...data, usesThirdPartyDelivery: e.target.checked, thirdPartyPercentage: e.target.checked ? 20 : 0, thirdPartyOrdersPerMonth: e.target.checked ? 300 : 0})}
                      style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                    />
                    Uses Third-Party Delivery (DoorDash, Uber Eats, etc.)
                  </label>
                </div>

                {data.usesThirdPartyDelivery && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                      Third-Party Delivery Orders per Month
                    </label>
                    <input
                      type="number"
                      value={data.thirdPartyOrdersPerMonth || ''}
                      onChange={(e) => {
                        const orders = Number(e.target.value) || 0;
                        const revenue = orders * data.avgTicket;
                        const percentage = (revenue / data.monthlyRevenue) * 100;
                        setData({...data, thirdPartyOrdersPerMonth: orders, thirdPartyPercentage: Math.min(100, percentage)});
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                      min="0"
                      placeholder="e.g. 300"
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Industry average: 4.6 orders per user/month. Consider your app downloads/active users.
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={() => {
                  console.log('Revenue opportunities button clicked, setting step to 4');
                  setStep(4);
                }}
                style={{
                  background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '18px 50px',
                  borderRadius: '50px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(139, 156, 244, 0.4)',
                  transition: 'transform 0.3s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Show My Revenue Opportunities →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Revenue Dashboard - Enhanced with Dual Visualization
  if (step === 4) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Main Dual Revenue Visualization */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            <DualRevenueVisualization
              monthlyRevenue={data.monthlyRevenue}
              avgTicket={data.avgTicket}
              monthlyTransactions={Math.round(data.monthlyRevenue / data.avgTicket)}
              localPackPosition={data.currentLocalPackPosition}
              organicPosition={data.currentOrganicPosition}
              localPackKeywords={data.localPackKeywords}
              organicKeywords={data.organicKeywords}
              hasLoyaltyProgram={false}
              smsListSize={data.smsListSize}
              emailListSize={data.emailListSize}
              socialFollowers={data.socialFollowersInstagram + data.socialFollowersFacebook}
              thirdPartyPercentage={data.usesThirdPartyDelivery ? data.thirdPartyPercentage : 0}
              currentSEORevenue={((data.keywords && Array.isArray(data.keywords)) ? data.keywords.reduce((total, keyword) => {
                if (!keyword || typeof keyword !== 'object') return total;
                
                const currentPosition = Number(keyword.currentPosition) || 5;
                const searchVolume = Number(keyword.searchVolume) || 0;
                const avgTicketCalc = Number(data.avgTicket) || 45;
                
                if (searchVolume <= 0) return total;
                
                const getCTR = (position: number) => {
                  const ctrRates = { 1: 0.25, 2: 0.18, 3: 0.12, 4: 0.08, 5: 0.05, 6: 0.03, 7: 0.02, 8: 0.01, 9: 0.01, 10: 0.01 };
                  return ctrRates[position as keyof typeof ctrRates] || 0.005;
                };
                
                const conversionRate = 0.25;
                const currentRevenue = Math.floor(searchVolume * getCTR(currentPosition) * conversionRate * avgTicketCalc) || 0;
                return total + currentRevenue;
              }, 0) : 0)}
              restaurantData={{
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
                instagramMetrics: data.instagramMetrics,
                facebookMetrics: data.facebookMetrics,
                organicKeywords: data.organicKeywords
              }}
            />
          </div>

          {/* What Top Performers Know */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              🚀 What Top Performers Know
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#666',
              textAlign: 'center',
              marginBottom: '25px'
            }}>
              Industry secrets that separate winners from everyone else.
            </p>
            <ComprehensiveMetrics />
          </div>

          {/* CTA */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '20px'
            }}>
              Ready to Capture This Revenue?
            </h3>
            
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              marginBottom: '30px'
            }}>
              We specialize in SEO, Social Media Marketing, and SMS campaigns that deliver these exact results.
            </p>

            <button
              onClick={() => setStep(2)}
              style={{
                background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
                color: 'white',
                border: 'none',
                padding: '20px 60px',
                borderRadius: '50px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                marginRight: '20px',
                outline: 'none'
              }}
            >
              Schedule Strategy Call
            </button>

            <button
              onClick={() => setStep(2)}
              style={{
                background: 'transparent',
                color: '#8b9cf4',
                border: '2px solid #8b9cf4',
                padding: '20px 60px',
                borderRadius: '50px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              Analyze Another Restaurant
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other steps
  return <div>Step not found: {step}</div>;
};

export default SalesDemoTool;
