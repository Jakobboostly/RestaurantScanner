import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  MapPin, 
  Globe, 
  Star,
  TrendingUp,
  Award,
  Target,
  Eye,
  Heart,
  Zap,
  Shield,
  Crown,
  Sparkles,
  ChevronRight,
  Phone,
  Mail,
  Clock,
  ThumbsUp,
  Share2,
  Navigation,
  Wifi,
  Smartphone,
  Monitor,
  MessageCircle,
  Brain,
  Lightbulb,
  AlertCircle,
  X,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScanResult } from "@shared/schema";

interface RestaurantSearchScreenshot {
  searchQuery: string;
  screenshotBase64: string;
  timestamp: string;
  success: boolean;
  screenshotSize?: string;
}

interface PremiumScoreDashboardProps {
  scanResult: ScanResult;
  restaurantName: string;
}

interface ScoreData {
  search: number;
  social: number;
  local: number;
  reviews: number;
  overall: number;
}

interface AIExplanations {
  search: string;
  social: string;
  local: string;
  reviews: string;
}

export function PremiumScoreDashboard({ scanResult, restaurantName }: PremiumScoreDashboardProps) {
  const [aiExplanations, setAiExplanations] = useState<AIExplanations>({
    search: 'Analyzing search performance...',
    social: 'Analyzing social presence...',
    local: 'Analyzing local SEO...',
    reviews: 'Analyzing reviews and reputation...'
  });
  
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  const [restaurantSearchScreenshot, setRestaurantSearchScreenshot] = useState<RestaurantSearchScreenshot | null>(null);
  
  const [activeTab, setActiveTab] = useState<'search' | 'social' | 'local' | 'reviews'>('search');
  const [showEmbeddedSearch, setShowEmbeddedSearch] = useState(false);
  
  // State for mood analysis polling
  const [moodAnalysis, setMoodAnalysis] = useState<any>(scanResult.reviewsAnalysis?.customerMoodAnalysis || null);
  const [isLoadingMoodAnalysis, setIsLoadingMoodAnalysis] = useState(!scanResult.reviewsAnalysis?.customerMoodAnalysis);
  
  // Poll for mood analysis results if not available initially
  useEffect(() => {
    const currentPlaceId = scanResult.placeId;
    
    if (!moodAnalysis && currentPlaceId && isLoadingMoodAnalysis) {
      console.log('Starting mood analysis polling for placeId:', currentPlaceId);
      
      const pollMoodAnalysis = async () => {
        try {
          console.log('Polling mood analysis...');
          const response = await fetch(`/api/mood-analysis/${currentPlaceId}`);
          const result = await response.json();
          console.log('Mood analysis response:', result);
          
          if (result.status === 'complete' && result.data) {
            console.log('Mood analysis complete! Setting data:', result.data);
            setMoodAnalysis(result.data);
            setIsLoadingMoodAnalysis(false);
          } else if (result.status === 'generating') {
            console.log('Mood analysis still generating, polling again in 3 seconds...');
            // Continue polling
            setTimeout(pollMoodAnalysis, 3000); // Poll every 3 seconds
          } else {
            console.log('Unexpected mood analysis status:', result.status);
            setIsLoadingMoodAnalysis(false);
          }
        } catch (error) {
          console.error('Error polling mood analysis:', error);
          setIsLoadingMoodAnalysis(false);
        }
      };
      
      // Start polling after initial delay
      setTimeout(pollMoodAnalysis, 2000);
    }
  }, [scanResult.placeId, isLoadingMoodAnalysis]); // Use the actual placeId from scan result

  // Function to fetch restaurant search screenshot
  const fetchRestaurantSearchScreenshot = async () => {
    if (!scanResult.domain) return;
    
    setLoadingScreenshot(true);
    try {
      const response = await fetch('/api/screenshot/restaurant-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: scanResult.domain,
          restaurantName: restaurantName
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRestaurantSearchScreenshot(result);
        }
      }
    } catch (error) {
      console.error('Failed to fetch restaurant search screenshot:', error);
    } finally {
      setLoadingScreenshot(false);
    }
  };

  // Helper function to extract search terms for manual search
  const getSearchTerms = () => {
    const businessProfile = scanResult.businessProfile;
    const address = businessProfile?.address || '';
    
    // Extract city and state from address
    const addressParts = address.split(',').map(part => part.trim());
    let city = '';
    let state = '';
    
    if (addressParts.length >= 3) {
      city = addressParts[addressParts.length - 3] || '';
      const stateZip = addressParts[addressParts.length - 2] || '';
      state = stateZip.split(' ')[0] || '';
    }
    
    // Extract food type from restaurant name or use generic "restaurant"
    const restaurantLower = restaurantName.toLowerCase();
    let foodType = 'restaurant';
    
    if (restaurantLower.includes('pizza')) foodType = 'pizza';
    else if (restaurantLower.includes('italian')) foodType = 'italian restaurant';
    else if (restaurantLower.includes('greek')) foodType = 'greek restaurant';
    else if (restaurantLower.includes('mexican')) foodType = 'mexican restaurant';
    else if (restaurantLower.includes('chinese')) foodType = 'chinese restaurant';
    else if (restaurantLower.includes('thai')) foodType = 'thai restaurant';
    else if (restaurantLower.includes('indian')) foodType = 'indian restaurant';
    else if (restaurantLower.includes('sushi')) foodType = 'sushi restaurant';
    else if (restaurantLower.includes('steakhouse') || restaurantLower.includes('steak')) foodType = 'steakhouse';
    else if (restaurantLower.includes('burger')) foodType = 'burger restaurant';
    else if (restaurantLower.includes('bbq') || restaurantLower.includes('barbecue')) foodType = 'bbq restaurant';
    else if (restaurantLower.includes('seafood')) foodType = 'seafood restaurant';
    else if (restaurantLower.includes('cafe') || restaurantLower.includes('coffee')) foodType = 'cafe';
    else if (restaurantLower.includes('deli')) foodType = 'deli';
    else if (restaurantLower.includes('bakery')) foodType = 'bakery';
    else if (restaurantLower.includes('brewery') || restaurantLower.includes('brew')) foodType = 'brewery';
    else if (restaurantLower.includes('bar') || restaurantLower.includes('pub')) foodType = 'restaurant bar';
    
    return { foodType, city, state };
  };

  // Calculate authentic scores from scan data
  const calculateScores = (): ScoreData => {
    // Search Score (based on SEO + keyword performance)
    const searchScore = Math.round(((scanResult.seo || 0) + (scanResult.keywordAnalysis?.targetKeywords?.length || 0) * 2) / 1.2);
    
    // Social Score (based on Facebook and Instagram presence only)
    const socialMediaLinks = scanResult.socialMediaLinks || {};
    const facebookPresent = !!socialMediaLinks.facebook;
    const instagramPresent = !!socialMediaLinks.instagram;
    const socialScore = (facebookPresent ? 50 : 0) + (instagramPresent ? 50 : 0); // 50 points each for Facebook and Instagram
    
    // Local Score (based on business profile completeness)
    const businessProfile = scanResult.businessProfile;
    const localScore = Math.round(
      (businessProfile?.rating || 0) * 10 + 
      (businessProfile?.totalReviews ? Math.min(businessProfile.totalReviews / 10, 30) : 0)
    );
    
    // Reviews Score (based on rating and review count from reviewsAnalysis)
    const reviewsAnalysis = scanResult.reviewsAnalysis;
    const reviewsScore = Math.round(
      (reviewsAnalysis?.averageRating || businessProfile?.rating || 0) * 15 + 
      (reviewsAnalysis?.totalReviews || businessProfile?.totalReviews ? Math.min((reviewsAnalysis?.totalReviews || businessProfile?.totalReviews || 0) / 20, 25) : 0)
    );
    
    // Overall Score (average of all 4 categories)
    const overall = Math.round((searchScore + socialScore + localScore + reviewsScore) / 4);
    
    return {
      search: Math.min(searchScore, 100),
      social: Math.min(socialScore, 100),
      local: Math.min(localScore, 100),
      reviews: Math.min(reviewsScore, 100),
      overall: Math.min(overall, 100)
    };
  };

  const scores = calculateScores();
  const averageScore = 75; // Industry average benchmark

  // Fetch AI explanations on component mount
  useEffect(() => {
    const fetchAIExplanations = async () => {
      try {
        const response = await fetch('/api/ai/analyze-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanResult, restaurantName, scores })
        });
        
        if (response.ok) {
          const data = await response.json();
          setAiExplanations(data.explanations);
        }
      } catch (error) {
        console.error('Failed to fetch AI explanations:', error);
      }
    };

    fetchAIExplanations();
  }, [scanResult, restaurantName]);

  // Generate dynamic Boostly next steps for each category
  const generateBoostlyNextSteps = (category: string, score: number, scanResult: any) => {
    const steps = [];
    
    switch (category) {
      case 'search':
        if (score < 75) {
          steps.push('🔍 Boostly SEO: Optimize for local search keywords');
          steps.push('📈 Boostly SEO: Build quality backlinks & citations');
          steps.push('💬 Boostly Text: Send SEO tips to subscribers');
        } else {
          steps.push('🏆 Boostly SEO: Maintain your strong search presence');
          steps.push('📱 Boostly Social: Share SEO wins with followers');
        }
        if (scanResult.keywordAnalysis?.targetKeywords?.length < 10) {
          steps.push('💡 Boostly SEO: Target more high-value keywords');
        }
        break;
        
      case 'social':
        const activePlatforms = Object.keys(scanResult.socialMediaLinks || {}).filter(k => scanResult.socialMediaLinks[k]).length;
        if (activePlatforms < 2) {
          steps.push('📱 Boostly Social: Create Instagram & Facebook profiles');
          steps.push('📸 Boostly Social: Post daily food photos & stories');
          steps.push('💬 Boostly Text: Invite customers to follow you');
        } else {
          steps.push('🎯 Boostly Social: Increase engagement with contests');
          steps.push('📱 Boostly Social: Cross-promote on all platforms');
        }
        steps.push('💬 Boostly Text: Send exclusive social offers');
        break;
        
      case 'local':
        if (scanResult.businessProfile?.rating < 4.5) {
          steps.push('📧 Boostly Text: Send review requests after visits');
          steps.push('🎯 Boostly Social: Promote positive reviews');
          steps.push('🔍 Boostly SEO: Optimize local search listings');
        } else {
          steps.push('🏆 Boostly Text: Leverage reviews in promotions');
          steps.push('📱 Boostly Social: Showcase 5-star reviews');
        }
        if (scanResult.businessProfile?.totalReviews < 50) {
          steps.push('💬 Boostly Text: Follow up with happy customers');
        }
        break;
        

      case 'reviews':
        if (scanResult.reviewsAnalysis?.sentiment?.positive < 80) {
          steps.push('📧 Boostly Text: Send satisfaction surveys');
          steps.push('🎯 Boostly Social: Address concerns publicly');
          steps.push('🔍 Boostly SEO: Optimize review response strategy');
        } else {
          steps.push('🏆 Boostly Text: Share testimonials via SMS');
          steps.push('📱 Boostly Social: Feature happy customers');
        }
        steps.push('💬 Boostly Text: Follow up after dining experience');
        break;
    }
    
    return steps;
  };

  // Premium meter component
  const PremiumMeter = ({ score, title, icon: Icon, color, size = "large" }: {
    score: number;
    title: string;
    icon: any;
    color: string;
    size?: "large" | "medium";
  }) => {
    const isLarge = size === "large";
    const percentage = score;
    
    return (
      <div className={`relative ${isLarge ? 'p-6' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
              <Icon className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-white">
                  {title}
                </h3>
                {title === "Overall Performance" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-white/70 hover:text-white cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2 text-sm">
                          <div className="font-semibold border-b pb-1">Overall Performance Calculation:</div>
                          <div className="space-y-1">
                            <div>• Search: {scores.search} points</div>
                            <div>• Social: {scores.social} points</div>
                            <div>• Local: {scores.local} points</div>
                            <div>• Reviews: {scores.reviews} points</div>
                            <div>• Formula: Average of all 4 categories</div>
                            <div>• Total: {scores.overall}/100</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {isLarge && <p className="text-sm text-white/90">vs. Industry Average ({averageScore}%)</p>}
            </div>
          </div>
          <div className={`text-right ${isLarge ? 'text-3xl' : 'text-2xl'} font-bold`}>
            <span className={percentage >= averageScore ? 'text-green-600' : 'text-orange-600'}>
              {score}
            </span>
            <span className="text-gray-400 text-lg">/100</span>
          </div>
        </div>
        {/* Premium Progress Track */}
        <div className="relative">
          <div className={`w-full ${isLarge ? 'h-4' : 'h-3'} bg-gray-200 rounded-full overflow-hidden shadow-inner`}>
            <motion.div
              className={`h-full rounded-full relative overflow-hidden`}
              style={{
                background: `linear-gradient(90deg, ${
                  percentage >= 90 ? '#4ADE80, #16A34A' :
                  percentage >= 75 ? '#5F5FFF, #9090FD' :
                  percentage >= 50 ? '#FCD34D, #F59E0B' :
                  '#F87171, #DC2626'
                })`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            </motion.div>
          </div>
          
          {/* Industry Average Marker */}
          {isLarge && (
            <div 
              className="absolute top-0 transform -translate-x-1/2"
              style={{ left: `${averageScore}%` }}
            >
              <div className="w-0.5 h-4 bg-gray-400"></div>
              <div className="text-xs text-gray-600 mt-1 transform -translate-x-1/2">
                Avg
              </div>
            </div>
          )}
        </div>
        {/* Performance indicator */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {percentage >= averageScore ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Above Average
                </span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-white">
                  Improvement Needed
                </span>
              </>
            )}
          </div>
          <Badge variant={percentage >= averageScore ? "default" : "secondary"}>
            {percentage >= 90 ? "Excellent" :
             percentage >= 75 ? "Good" :
             percentage >= 50 ? "Fair" : "Poor"}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-[#7375FD]" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5F5FFF] to-[#9090FD] bg-clip-text text-transparent">
              {restaurantName} Performance Report
            </h1>
            <Sparkles className="w-8 h-8 text-[#9090FD]" />
          </div>
          <p className="text-lg text-gray-600">Professional Marketing Intelligence Dashboard</p>
          
          {/* Restaurant Images */}
          {scanResult.businessProfile?.photos?.businessPhotos && 
           scanResult.businessProfile.photos.businessPhotos.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-center gap-3 overflow-x-auto pb-2">
                {scanResult.businessProfile.photos.businessPhotos.slice(0, 6).map((photoUrl, index) => (
                  <img
                    key={index}
                    src={photoUrl}
                    alt={`${restaurantName} photo ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-xl border-2 border-[#5F5FFF]/20 flex-shrink-0 hover:border-[#5F5FFF]/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                {scanResult.businessProfile.photos.total} Google Photos • {scanResult.businessProfile.photos.quality} quality
              </p>
            </div>
          )}
        </motion.div>

        {/* Overall Score - Hero Section */}
        <motion.div
          key="overall-score"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-[#8B8BFF] to-[#B8B8FF] text-white">
            <CardContent className="p-0">
              <PremiumMeter 
                score={scores.overall}
                title="Overall Performance"
                icon={Award}
                color="from-[#7375FD] to-[#9090FD]"
                size="large"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabbed Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Tab Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'search', title: 'Search', icon: Search, color: 'from-[#5F5FFF] to-[#7375FD]', score: scores.search },
              { key: 'social', title: 'Social', icon: Users, color: 'from-[#16A34A] to-[#4ADE80]', score: scores.social },
              { key: 'local', title: 'Local', icon: MapPin, color: 'from-[#F59E0B] to-[#FCD34D]', score: scores.local },
              { key: 'reviews', title: 'Reviews', icon: Star, color: 'from-[#FCD34D] to-[#F59E0B]', score: scores.reviews }
            ].map((tab) => (
              <motion.div
                key={tab.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.key as any)}
                className={`cursor-pointer transition-all duration-300 ${
                  activeTab === tab.key 
                    ? 'ring-2 ring-[#5F5FFF] ring-offset-2 shadow-xl' 
                    : 'hover:shadow-lg'
                }`}
              >
                <Card className={`border-0 shadow-xl ${
                  activeTab === tab.key 
                    ? 'bg-gradient-to-br from-[#5F5FFF] to-[#7375FD] text-white' 
                    : 'bg-white hover:shadow-2xl'
                } transition-all duration-300`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          activeTab === tab.key 
                            ? 'bg-white/20' 
                            : `bg-gradient-to-br ${tab.color}`
                        }`}>
                          <tab.icon className={`w-5 h-5 ${
                            activeTab === tab.key ? 'text-white' : 'text-white'
                          }`} />
                        </div>
                        <h3 className={`font-bold text-lg ${
                          activeTab === tab.key ? 'text-white' : 'text-gray-800'
                        }`}>
                          {tab.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${
                          activeTab === tab.key 
                            ? 'text-white' 
                            : tab.score >= averageScore ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {tab.score}
                        </span>
                        <span className={`text-sm ${
                          activeTab === tab.key ? 'text-white/70' : 'text-gray-400'
                        }`}>/100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Content Area */}
        <motion.div
          key={`tab-content-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          {/* Dynamic Tab Content */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
            <CardHeader className={`bg-gradient-to-r ${
              activeTab === 'search' ? 'from-[#5F5FFF] to-[#7375FD]' :
              activeTab === 'social' ? 'from-[#16A34A] to-[#4ADE80]' :
              activeTab === 'local' ? 'from-[#F59E0B] to-[#FCD34D]' :
              'from-[#FCD34D] to-[#F59E0B]'
            } text-white`}>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'search' && (
                  <>
                    <Search className="w-5 h-5" />
                    Search Performance
                  </>
                )}
                {activeTab === 'social' && (
                  <>
                    <Users className="w-5 h-5" />
                    Social Presence
                  </>
                )}
                {activeTab === 'local' && (
                  <>
                    <MapPin className="w-5 h-5" />
                    Local SEO
                  </>
                )}
                {activeTab === 'reviews' && (
                  <>
                    <Star className="w-5 h-5" />
                    Reviews & Reputation
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Search Tab Content */}
              {activeTab === 'search' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Dropdown Summary */}
                  <div className="space-y-6">
                    {/* Missing Ingredients */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                        Missing Ingredients
                      </h3>
                      <div className="space-y-3">
                        {/* High Priority Issues */}
                        {scores.search < 50 && (
                          <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                            <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH PRIORITY</span>
                            <ul className="mt-2 text-sm text-gray-700 space-y-1">
                              <li>• Not ranking for key restaurant keywords in your area</li>
                              <li>• Missing from local search results when customers look for food</li>
                              <li>• Competitors are capturing your potential customers</li>
                            </ul>
                          </div>
                        )}
                        
                        {/* Medium Priority Issues */}
                        {scores.search >= 50 && scores.search < 75 && (
                          <div className="bg-[#7375FD]/10 border border-[#7375FD]/30 rounded p-3">
                            <span className="text-xs font-bold text-[#7375FD] bg-[#7375FD]/20 px-2 py-1 rounded">MEDIUM PRIORITY</span>
                            <ul className="mt-2 text-sm text-gray-700 space-y-1">
                              <li>• Limited visibility for high-value search terms</li>
                              <li>• Missing opportunities for delivery and takeout searches</li>
                              <li>• Inconsistent local search presence</li>
                            </ul>
                          </div>
                        )}
                        
                        {/* Low Priority Issues */}
                        {scores.search >= 75 && (
                          <div className="bg-[#9090FD]/10 border border-[#9090FD]/30 rounded p-3">
                            <span className="text-xs font-bold text-[#9090FD] bg-[#9090FD]/20 px-2 py-1 rounded">LOW PRIORITY</span>
                            <ul className="mt-2 text-sm text-gray-700 space-y-1">
                              <li>• Fine-tune keyword targeting for seasonal menu items</li>
                              <li>• Optimize for voice search queries like "Hey Google, best restaurant near me"</li>
                              <li>• Enhance content for featured snippet opportunities</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* How Boostly Can Solve It */}
                    <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                      <h3 className="font-bold text-[#5F5FFF] mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        How Boostly Can Solve It For You
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] text-white rounded p-3">
                          <h4 className="font-semibold mb-2">🎯 Boostly SEO Service</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Get your restaurant ranking #1 for "restaurant near me" searches</li>
                            <li>• Target high-value keywords like "delivery", "takeout", and your cuisine type</li>
                            <li>• Build local authority with restaurant-specific link building</li>
                            <li>• Monthly keyword rankings reports to track your progress</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gradient-to-r from-[#7375FD] to-[#9090FD] text-white rounded p-3">
                          <h4 className="font-semibold mb-2">📱 Boostly Text Marketing</h4>
                          <ul className="text-sm space-y-1">
                            <li>• Send targeted promotions to customers searching for food</li>
                            <li>• Automated "order now" messages during peak dining hours</li>
                            <li>• Drive repeat visits with personalized menu recommendations</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">SEO Score</span>
                        <span className="font-bold text-lg text-[#5F5FFF]">{scanResult.seo || 0}/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Domain Authority</span>
                        <span className="font-medium">{scanResult.domainAuthority || 0}</span>
                      </div>
                      
                      {/* Where your competition is winning */}
                      <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-3 space-y-2">
                        <h4 className="text-sm font-semibold text-[#5F5FFF] mb-2">Key Restaurant Keywords</h4>
                        <div className="space-y-1">
                          {(() => {
                            // Show actual ranked keywords from scanResult.keywords with positions
                            const rankedKeywords = scanResult.keywords?.filter(k => k.position && k.position > 0) || [];
                            const serpKeywords = scanResult.keywordAnalysis?.rankingPositions?.filter(r => r.position && r.position > 0) || [];
                            const targetedKeywords = scanResult.competitiveOpportunityKeywords || [];
                            
                            // Combine all sources for complete keyword list, prioritize ones with positions
                            const allKeywords = [...rankedKeywords, ...serpKeywords, ...targetedKeywords].filter((item, index, self) => 
                              index === self.findIndex(k => k.keyword === item.keyword)
                            );
                            
                            console.log('🔍 Frontend displaying competitive opportunity keywords:', targetedKeywords);
                            console.log('🔍 Frontend displaying ranked keywords:', rankedKeywords);
                            
                            if (allKeywords.length === 0) {
                              return (
                                <div className="text-xs text-gray-500 text-center py-2">
                                  No targeted keyword data available yet.
                                </div>
                              );
                            }
                            
                            return allKeywords
                              .sort((a, b) => (a.position || 99) - (b.position || 99))
                              .slice(0, 8).map((keyword: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-xs">
                                <span className="text-gray-700 flex-1 truncate pr-2">
                                  "{typeof keyword === 'string' ? keyword : keyword.keyword}"
                                </span>
                                <div className="flex items-center gap-2">
                                  {keyword.position && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-2 py-0 ${
                                        keyword.position <= 5
                                          ? 'bg-green-100 text-green-800 border-green-200'
                                          : keyword.position <= 10
                                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                          : keyword.position <= 20
                                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                                          : 'bg-red-100 text-red-800 border-red-200'
                                      }`}
                                    >
                                      #{keyword.position}
                                    </Badge>
                                  )}
                                  {keyword.searchVolume && (
                                    <span className="text-xs text-gray-500">
                                      {keyword.searchVolume > 1000 ? `${Math.round(keyword.searchVolume / 1000)}k` : keyword.searchVolume}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                          

                        </div>
                      </div>
                      
                      {/* Show actual ranking keywords from multiple sources */}
                      {(() => {
                        const keywordsWithRanking = scanResult.keywords?.filter(k => k.position && k.position <= 20) || [];
                        const serpWithRanking = scanResult.keywordAnalysis?.rankingPositions?.filter(r => r.position && r.position <= 20) || [];
                        const allRankedKeywords = [...keywordsWithRanking, ...serpWithRanking];
                        const uniqueRankedKeywords = allRankedKeywords.filter((item, index, self) => 
                          index === self.findIndex(k => k.keyword === item.keyword)
                        );
                        return uniqueRankedKeywords.length > 0;
                      })() && (
                        <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-3 space-y-2">
                          <h4 className="text-sm font-semibold text-[#5F5FFF] mb-2">Your Ranking Keywords</h4>
                          <div className="space-y-1">
                            {(() => {
                              // Merge ranking keywords from multiple sources
                              const keywordsWithRanking = scanResult.keywords?.filter(k => k.position && k.position <= 20) || [];
                              const serpWithRanking = scanResult.keywordAnalysis?.rankingPositions?.filter(r => r.position && r.position <= 20) || [];
                              const allRankedKeywords = [...keywordsWithRanking, ...serpWithRanking];
                              const uniqueRankedKeywords = allRankedKeywords.filter((item, index, self) => 
                                index === self.findIndex(k => k.keyword === item.keyword)
                              );
                              
                              console.log('🔍 Frontend displaying ranked keywords:', uniqueRankedKeywords);
                              
                              return uniqueRankedKeywords
                                .sort((a, b) => (a.position || 99) - (b.position || 99))
                                .slice(0, 5)
                                .map((keyword, index) => (
                                  <div key={index} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-700 flex-1 truncate pr-2">
                                      "{keyword.keyword}"
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs px-2 py-0 ${
                                          (keyword.position || 0) <= 3 
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : (keyword.position || 0) <= 10
                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            : 'bg-orange-100 text-orange-800 border-orange-200'
                                        }`}
                                      >
                                        #{keyword.position || 'N/A'}
                                      </Badge>
                                    </div>
                                  </div>
                                ));
                            })()}
                            {(() => {
                              const keywordsWithRanking = scanResult.keywords?.filter(k => k.position && k.position <= 20) || [];
                              const serpWithRanking = scanResult.keywordAnalysis?.rankingPositions?.filter(r => r.position && r.position <= 20) || [];
                              const allRankedKeywords = [...keywordsWithRanking, ...serpWithRanking];
                              const uniqueRankedKeywords = allRankedKeywords.filter((item, index, self) => 
                                index === self.findIndex(k => k.keyword === item.keyword)
                              );
                              
                              return uniqueRankedKeywords.length > 5 && (
                                <div className="text-xs text-gray-500 text-center pt-1">
                                  +{uniqueRankedKeywords.length - 5} more keywords
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Domain Authority</span>
                        <span className="font-medium">{scanResult.domainAuthority || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Where You Rank Button */}
                  <div className="space-y-4 pt-[65px] pb-[65px]">
                    {/* URGENT BOOSTLY RANKING WARNING */}
                    <div className="bg-gradient-to-r from-[#4C1D95] via-[#5B21B6] to-[#6B21A8] border-4 border-yellow-400 rounded-xl p-6 text-center text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <div>
                            <h3 className="font-black text-white tracking-wide drop-shadow-lg text-[27px]">⚠️ CRITICAL RANKING ALERT ⚠️</h3>
                            <p className="text-yellow-200 font-bold uppercase tracking-widest text-[16px]">CUSTOMERS CAN'T FIND YOU!</p>
                          </div>
                        </div>
                        
                        <div className="bg-[#5F5FFF]/30 border-2 border-yellow-300 rounded-lg p-4 mb-3 backdrop-blur-sm">
                          {(() => {
                            const competitiveKeywords = scanResult.competitiveOpportunityKeywords || [];
                            const keywordCount = competitiveKeywords.length;
                            const competitiveOpportunityCount = competitiveKeywords.filter(k => k.position > 5).length;
                            
                            return (
                              <>
                                <p className="text-white font-black text-2xl mb-2 drop-shadow-lg">
                                  Tracking {keywordCount} key restaurant keywords for your area!
                                </p>
                                {competitiveOpportunityCount > 0 && (
                                  <div className="text-yellow-200 text-sm font-bold mb-2">
                                    Keywords where competitors are beating you (positions 6+):
                                  </div>
                                )}
                                {competitiveKeywords.length > 0 && (
                                  <div className="space-y-1 text-left max-h-32 overflow-y-auto">
                                    {competitiveKeywords.slice(0, 3).map((keyword, index) => (
                                      <div key={index} className="flex justify-between items-center text-xs bg-white/10 rounded px-2 py-1">
                                        <span className="text-white truncate pr-2">
                                          "{keyword.keyword}"
                                        </span>
                                        <span className={`font-bold ${
                                          keyword.position <= 5 ? 'text-green-300' : 'text-yellow-300'
                                        }`}>
                                          #{keyword.position}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {competitiveKeywords.length === 0 && (
                                  <p className="text-yellow-200 text-base font-bold">
                                    🔍 Gathering targeted keyword data...
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="text-yellow-200 text-sm font-bold uppercase">
                          ⚡ IMMEDIATE ACTION REQUIRED
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#5F5FFF] via-[#7375FD] to-[#9090FD] rounded-lg p-8 text-center text-white shadow-lg mt-[5px] mb-[5px]">
                      
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                          <Search className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">See Where You Rank</h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          Check your restaurant's position on Google for the search terms your customers actually use
                        </p>
                      </div>
                      
                      {(() => {
                        const { foodType, city, state } = getSearchTerms();
                        const searchQuery = `${foodType} ${city} ${state}`.trim();
                        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                        
                        return (
                          <div className="space-y-4">
                            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                              <p className="text-sm text-white/80 mb-2">Your customers search for:</p>
                              <p className="text-lg font-semibold text-white">"{searchQuery}"</p>
                            </div>
                            
                            <button 
                              onClick={() => setShowEmbeddedSearch(true)}
                              className="inline-flex items-center justify-center w-full bg-white text-[#5F5FFF] font-bold py-4 px-6 rounded-lg hover:bg-white/95 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                            >
                              <span className="mr-3">Where You Rank</span>
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                            
                            <p className="text-xs text-white/70 leading-relaxed">
                              This opens a live Google search. Look for your restaurant in the results to see where you rank compared to competitors.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Social Tab Content */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  {/* Missing Ingredients */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Missing Ingredients
                    </h3>
                    <div className="space-y-3">
                      {/* High Priority Issues */}
                      {scores.social < 50 && (
                        <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• No active Facebook or Instagram presence - customers can't find you</li>
                            <li>• Missing out on visual marketing through Instagram and Facebook posts</li>
                            <li>• Competitors are building loyal followings while you're invisible</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Medium Priority Issues */}
                      {scores.social >= 50 && scores.social < 75 && (
                        <div className="bg-[#7375FD]/10 border border-[#7375FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#7375FD] bg-[#7375FD]/20 px-2 py-1 rounded">MEDIUM PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Limited Facebook and Instagram activity - posts are infrequent</li>
                            <li>• Low engagement rates with followers on visual platforms</li>
                            <li>• Missing either Facebook or Instagram where your customers are active</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Low Priority Issues */}
                      {scores.social >= 75 && (
                        <div className="bg-[#9090FD]/10 border border-[#9090FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#9090FD] bg-[#9090FD]/20 px-2 py-1 rounded">LOW PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Expand to additional social platforms like TikTok or YouTube</li>
                            <li>• Implement Instagram Stories and Facebook Live for real-time engagement</li>
                            <li>• Create user-generated content campaigns and hashtag strategies</li>
                          </ul>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* How Boostly Can Solve It */}
                  <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                    <h3 className="font-bold text-[#5F5FFF] mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      How Boostly Can Solve It For You
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] text-white rounded p-3">
                        <h4 className="font-semibold mb-2">📲 Boostly Social Media Service</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Professional content creation with mouth-watering food photography</li>
                          <li>• Daily posts across Instagram and Facebook</li>
                          <li>• Engage with customers and respond to comments professionally</li>
                          <li>• Hashtag strategy to reach local food lovers on both platforms</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#7375FD] to-[#9090FD] text-white rounded p-3">
                        <h4 className="font-semibold mb-2">📱 Boostly Text Marketing</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Convert social media followers into loyal customers</li>
                          <li>• Send exclusive deals to customers who follow you</li>
                          <li>• Automated birthday and anniversary specials</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Business Photo Gallery */}
                  {scanResult.businessProfile?.photos?.businessPhotos && 
                   scanResult.businessProfile.photos.businessPhotos.length > 0 && (
                    <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                      <h3 className="font-bold text-[#5F5FFF] mb-3 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Content Library from Google Business
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {scanResult.businessProfile.photos.businessPhotos.map((photoUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photoUrl}
                              alt={`${restaurantName} content ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-[#5F5FFF]/20 hover:border-[#5F5FFF]/40 transition-all duration-300 shadow-sm hover:shadow-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Share2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-sm text-gray-600">
                          Showing {scanResult.businessProfile.photos.businessPhotos.length} of {scanResult.businessProfile.photos.total} total photos
                        </p>
                        <p className="text-sm text-[#5F5FFF] font-medium">
                          Perfect for social media content
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Facebook Posts Analysis */}
                  {scanResult.socialMediaLinks?.facebookAnalysis && (
                    <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                      <h3 className="font-bold text-[#5F5FFF] mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Facebook Activity Analysis
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/70 rounded-lg p-3">
                          <div className="text-sm text-gray-600">Total Posts</div>
                          <div className="text-2xl font-bold text-[#5F5FFF]">
                            {scanResult.socialMediaLinks.facebookAnalysis.totalPosts}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <div className="text-sm text-gray-600">Avg. Engagement</div>
                          <div className="text-2xl font-bold text-[#5F5FFF]">
                            {scanResult.socialMediaLinks.facebookAnalysis.averageEngagement}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <div className="text-sm text-gray-600">Post Frequency</div>
                          <div className="text-sm font-medium text-[#5F5FFF]">
                            {scanResult.socialMediaLinks.facebookAnalysis.postingFrequency}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <div className="text-sm text-gray-600">Most Active</div>
                          <div className="text-sm font-medium text-[#5F5FFF]">
                            {scanResult.socialMediaLinks.facebookAnalysis.postingPatterns?.mostActiveDay || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Recent Posts Preview */}
                      {scanResult.socialMediaLinks.facebookAnalysis.recentPosts && 
                       scanResult.socialMediaLinks.facebookAnalysis.recentPosts.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-800">Recent Posts</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {scanResult.socialMediaLinks.facebookAnalysis.recentPosts.slice(0, 3).map((post, index) => (
                              <div key={index} className="bg-white/70 rounded-lg p-3 text-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="text-xs text-gray-500">
                                    {new Date(post.timestamp).toLocaleDateString()}
                                  </div>
                                  <div className="flex gap-2 text-xs text-gray-500">
                                    <span>👍 {post.likes}</span>
                                    <span>💬 {post.comments}</span>
                                    <span>📤 {post.shares}</span>
                                  </div>
                                </div>
                                <div className="text-gray-700 line-clamp-2">
                                  {post.text || 'Visual content post'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Type Breakdown */}
                      {scanResult.socialMediaLinks.facebookAnalysis.contentTypes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">Content Mix</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span>📸 Photos</span>
                              <span className="font-medium">{scanResult.socialMediaLinks.facebookAnalysis.contentTypes.photo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>🎥 Videos</span>
                              <span className="font-medium">{scanResult.socialMediaLinks.facebookAnalysis.contentTypes.video}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>📝 Text</span>
                              <span className="font-medium">{scanResult.socialMediaLinks.facebookAnalysis.contentTypes.text}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>🔗 Links</span>
                              <span className="font-medium">{scanResult.socialMediaLinks.facebookAnalysis.contentTypes.link}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Key Platforms</span>
                      <span className="font-bold text-lg text-[#5F5FFF]">
                        {((scanResult.socialMediaLinks?.facebook ? 1 : 0) + 
                          (scanResult.socialMediaLinks?.instagram ? 1 : 0) +
                          (scanResult.businessProfile?.website ? 1 : 0))}/3
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Website URL</span>
                      <div className="flex items-center gap-2">
                        <span className={scanResult.businessProfile?.website ? "text-[#5F5FFF]" : "text-gray-400"}>
                          {scanResult.businessProfile?.website ? "✓ Active" : "✗ Missing"}
                        </span>
                        {scanResult.businessProfile?.website && (
                          <a 
                            href={scanResult.businessProfile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Facebook</span>
                      <div className="flex items-center gap-2">

                        <span className={scanResult.socialMediaLinks?.facebook ? "text-[#5F5FFF]" : "text-gray-400"}>
                          {scanResult.socialMediaLinks?.facebook ? "✓ Active" : "✗ Missing"}
                        </span>
                        {scanResult.socialMediaLinks?.facebook && (
                          <a 
                            href={scanResult.socialMediaLinks.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Instagram</span>
                      <div className="flex items-center gap-2">
                        <span className={scanResult.socialMediaLinks?.instagram ? "text-[#5F5FFF]" : "text-gray-400"}>
                          {scanResult.socialMediaLinks?.instagram ? "✓ Active" : "✗ Missing"}
                        </span>
                        {scanResult.socialMediaLinks?.instagram && (
                          <a 
                            href={scanResult.socialMediaLinks.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>


                  </div>
                </div>
              )}

              {/* Local Tab Content */}
              {activeTab === 'local' && (
                <div className="space-y-6">
                  {/* Missing Ingredients */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Missing Ingredients
                    </h3>
                    <div className="space-y-3">
                      {/* High Priority Issues */}
                      {scores.local < 50 && (
                        <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Google Business Profile incomplete or not optimized</li>
                            <li>• Missing from local "near me" searches</li>
                            <li>• Competitors dominate local map results</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Medium Priority Issues */}
                      {scores.local >= 50 && scores.local < 75 && (
                        <div className="bg-[#7375FD]/10 border border-[#7375FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#7375FD] bg-[#7375FD]/20 px-2 py-1 rounded">MEDIUM PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Inconsistent business information across platforms</li>
                            <li>• Limited local reviews and ratings</li>
                            <li>• Not responding to customer reviews regularly</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Low Priority Issues */}
                      {scores.local >= 75 && (
                        <div className="bg-[#9090FD]/10 border border-[#9090FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#9090FD] bg-[#9090FD]/20 px-2 py-1 rounded">LOW PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Optimize Google Business Profile with additional categories</li>
                            <li>• Add more business photos and keep them updated seasonally</li>
                            <li>• Create Google Posts for special events and promotions</li>
                          </ul>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* How Boostly Can Solve It */}
                  <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                    <h3 className="font-bold text-[#5F5FFF] mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      How Boostly Can Solve It For You
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] text-white rounded p-3">
                        <h4 className="font-semibold mb-2">📍 Boostly Local SEO Service</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Optimize your Google Business Profile for maximum visibility</li>
                          <li>• Get you ranking #1 in local map results</li>
                          <li>• Manage and respond to reviews professionally</li>
                          <li>• Consistent business listings across 50+ directories</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#7375FD] to-[#9090FD] text-white rounded p-3">
                        <h4 className="font-semibold mb-2">📱 Boostly Text Marketing</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Send review requests to satisfied customers automatically</li>
                          <li>• Promote local events and specials to nearby customers</li>
                          <li>• Build a local customer loyalty program</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Google Rating</span>
                      <span className="font-bold text-lg text-[#F59E0B]">{scanResult.businessProfile?.rating || 0}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Reviews</span>
                      <span className="font-medium">{scanResult.businessProfile?.totalReviews || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Profile Completeness</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-2 text-sm">
                                <div className="font-semibold border-b pb-1">Profile Completeness Scoring:</div>
                                <div className="space-y-1">
                                  <div>• Business Name: 10 points</div>
                                  <div>• Phone Number: 15 points</div>
                                  <div>• Website: 20 points</div>
                                  <div>• Photos: 25 points (0.5 per photo, max 50)</div>
                                  <div>• Reviews: 20 points (1 per 15 reviews, max 20)</div>
                                  <div>• Rating: 10 points (4.0+ = full, 3.6-3.9 = 7pts, 3.3-3.5 = 5pts, 3.0-3.2 = 2pts)</div>
                                </div>
                                <div className="text-xs text-gray-500 pt-1 border-t">
                                  Total: 100 points maximum
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="font-medium">{scanResult.profileAnalysis?.completenessScore || 0}%</span>
                    </div>
                    {scanResult.businessProfile?.photos && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Business Photos</span>
                        <span className="font-medium">
                          {scanResult.businessProfile.photos.total} ({scanResult.businessProfile.photos.quality})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Reviews Tab Content */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Missing Ingredients */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Missing Ingredients
                    </h3>
                    <div className="space-y-3">
                      {/* High Priority Issues */}
                      {scores.reviews < 50 && (
                        <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Low rating is driving customers away</li>
                            <li>• Not enough reviews to build trust</li>
                            <li>• Negative reviews left unanswered</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Medium Priority Issues */}
                      {scores.reviews >= 50 && scores.reviews < 75 && (
                        <div className="bg-[#7375FD]/10 border border-[#7375FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#7375FD] bg-[#7375FD]/20 px-2 py-1 rounded">MEDIUM PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Need more positive reviews to stand out</li>
                            <li>• Inconsistent review response strategy</li>
                            <li>• Missing opportunities to get more reviews</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Low Priority Issues */}
                      {scores.reviews >= 75 && (
                        <div className="bg-[#9090FD]/10 border border-[#9090FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#9090FD] bg-[#9090FD]/20 px-2 py-1 rounded">LOW PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Implement review sentiment analysis to identify improvement areas</li>
                            <li>• Create a systematic approach to generate more reviews from satisfied customers</li>
                            <li>• Develop template responses for common review themes</li>
                          </ul>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* How Boostly Can Solve It */}
                  <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                    <h3 className="font-bold text-[#5F5FFF] mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      How Boostly Can Solve It For You
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] text-white rounded p-3">
                        <h4 className="font-semibold mb-2">⭐ Boostly Review Management</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Automated review requests sent to happy customers</li>
                          <li>• Professional responses to all reviews (positive and negative)</li>
                          <li>• Review monitoring and alerts for immediate response</li>
                          <li>• Reputation recovery for restaurants with low ratings</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#7375FD] to-[#9090FD] text-white rounded p-3">
                        <h4 className="font-semibold mb-2">📱 Boostly Text Marketing</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Send review requests immediately after positive dining experiences</li>
                          <li>• Follow up with customers to address any issues before they review</li>
                          <li>• Reward customers for leaving positive reviews</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Overall Rating</span>
                      <span className="font-bold text-lg text-[#FCD34D]">
                        {scanResult.reviewsAnalysis?.averageRating || scanResult.businessProfile?.rating || 0}/5
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Review Volume</span>
                      <span className="font-medium">
                        {scanResult.reviewsAnalysis?.totalReviews || scanResult.businessProfile?.totalReviews || 0}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Customer Mood Insights with Sexy Design */}
                  <div className="bg-gradient-to-br from-[#5F5FFF]/10 via-[#7375FD]/5 to-[#9090FD]/10 border border-[#5F5FFF]/30 rounded-xl p-6 mt-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] bg-clip-text text-transparent">Customer Sentiment AI Report</h3>
                        <p className="text-sm text-gray-600">AI analysis of 100+ authentic reviews summarized in what you're doing great at, and what needs to change. </p>
                      </div>
                    </div>
                    
                    {moodAnalysis ? (
                      <div className="space-y-6">
                        {/* Overall Mood with Dynamic Background */}
                        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border border-white/50 shadow-lg">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#5F5FFF]/5 to-[#7375FD]/5"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">Customer Emotional State</span>
                              <div className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg transform transition-all duration-300 hover:scale-105 ${
                                moodAnalysis.overallMood === 'delighted' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                                moodAnalysis.overallMood === 'satisfied' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                                moodAnalysis.overallMood === 'mixed' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                                moodAnalysis.overallMood === 'frustrated' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                                'bg-gradient-to-r from-red-400 to-red-600 text-white'
                              }`}>
                                {moodAnalysis.overallMood === 'delighted' ? '😍 DELIGHTED' :
                                 moodAnalysis.overallMood === 'satisfied' ? '😊 SATISFIED' :
                                 moodAnalysis.overallMood === 'mixed' ? '😐 MIXED FEELINGS' :
                                 moodAnalysis.overallMood === 'frustrated' ? '😤 FRUSTRATED' :
                                 '😞 DISAPPOINTED'}
                              </div>
                            </div>
                            
                            <div className="bg-white/90 rounded-lg p-4 border border-gray-200/50 shadow-sm">
                              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                {moodAnalysis.sentimentSummary}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Emotional Indicators Cloud */}
                        {moodAnalysis.keyMoodIndicators && moodAnalysis.keyMoodIndicators.length > 0 && (
                          <div className="bg-white/50 rounded-xl p-5 border border-gray-200/50 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] rounded-full"></div>
                              Emotional Keywords Found in Reviews
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {moodAnalysis.keyMoodIndicators.slice(0, 6).map((indicator: string, index: number) => (
                                <span 
                                  key={index}
                                  className={`px-3 py-2 rounded-full text-xs font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                                    index % 3 === 0 ? 'bg-gradient-to-r from-[#5F5FFF]/20 to-[#7375FD]/20 text-[#5F5FFF] border border-[#5F5FFF]/30' :
                                    index % 3 === 1 ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200' :
                                    'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border border-indigo-200'
                                  }`}
                                >
                                  {indicator}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Business Intelligence Cards */}
                        {moodAnalysis.businessInsights && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Customer Praise Card */}
                            {moodAnalysis.businessInsights.strengthsPerceived && 
                             moodAnalysis.businessInsights.strengthsPerceived.length > 0 && (
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200/50 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <div className="text-white text-sm font-bold">❤️</div>
                                  </div>
                                  <h5 className="font-bold text-green-800 text-sm">What Customers Love About You</h5>
                                </div>
                                <div className="space-y-2">
                                  {moodAnalysis.businessInsights.strengthsPerceived.slice(0, 3).map((strength: string, index: number) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="text-xs text-green-800 font-medium leading-relaxed">{strength}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Improvement Opportunities Card */}
                            {moodAnalysis.businessInsights.improvementOpportunities && 
                             moodAnalysis.businessInsights.improvementOpportunities.length > 0 && (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200/50 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <div className="text-white text-sm font-bold">⚡</div>
                                  </div>
                                  <h5 className="font-bold text-amber-800 text-sm">Where Customers want you to Grow</h5>
                                </div>
                                <div className="space-y-2">
                                  {moodAnalysis.businessInsights.improvementOpportunities.slice(0, 3).map((opportunity: string, index: number) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                      <p className="text-xs text-amber-800 font-medium leading-relaxed">{opportunity}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Additional Emotional Themes */}
                        {moodAnalysis.emotionalThemes && moodAnalysis.emotionalThemes.length > 0 && (
                          <div className="bg-gradient-to-r from-white/70 to-gray-50/70 rounded-xl p-5 border border-gray-200/50 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-[#5F5FFF] to-[#7375FD] rounded-lg flex items-center justify-center">
                                <div className="text-white text-xs">📊</div>
                              </div>
                              Top Emotional Themes in Customer Reviews
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {moodAnalysis.emotionalThemes.slice(0, 4).map((theme: any, index: number) => (
                                <div key={index} className="bg-white/80 rounded-lg p-3 border border-gray-100 shadow-sm">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold text-gray-700 capitalize">{theme.theme}</span>
                                    <span className="text-xs text-gray-500">{theme.frequency}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className={`h-1.5 rounded-full transition-all duration-500 ${
                                        theme.emotion === 'excitement' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                        theme.emotion === 'satisfaction' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                        theme.emotion === 'frustration' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                                        'bg-gradient-to-r from-[#5F5FFF] to-[#7375FD]'
                                      }`}
                                      style={{ width: `${theme.frequency}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-xs font-medium capitalize ${
                                    theme.emotion === 'excitement' ? 'text-green-600' :
                                    theme.emotion === 'satisfaction' ? 'text-blue-600' :
                                    theme.emotion === 'frustration' ? 'text-red-600' :
                                    'text-[#5F5FFF]'
                                  }`}>
                                    {theme.emotion}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : isLoadingMoodAnalysis ? (
                      // Enhanced Loading state
                      (<div className="bg-gradient-to-r from-white/80 to-gray-50/80 rounded-xl p-8 text-center border border-gray-200/50 shadow-sm">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="relative">
                            <div className="w-8 h-8 border-4 border-[#5F5FFF]/20 border-t-[#5F5FFF] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-[#7375FD] rounded-full animate-ping"></div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-base font-semibold text-gray-700">AI Analyzing Customer Psychology...</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <div className="w-1 h-1 bg-[#5F5FFF] rounded-full animate-pulse"></div>
                              <span>Processing 100+ authentic reviews with OpenAI GPT-4o</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/60 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <div className="w-2 h-2 bg-[#5F5FFF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-[#7375FD] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[#9090FD] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <span className="ml-2">Generating emotional insights...</span>
                          </div>
                        </div>
                      </div>)
                    ) : (
                      // Enhanced Error state
                      (<div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <div className="text-gray-400 text-lg">📊</div>
                        </div>
                        <h4 className="font-semibold text-gray-700 mb-2">Customer Mood Analysis Unavailable</h4>
                        <p className="text-sm text-gray-500">The AI analysis couldn't be completed at this time. This usually happens when there aren't enough reviews to analyze or the service is temporarily unavailable.</p>
                      </div>)
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Embedded Google Search Modal */}
      {showEmbeddedSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5F5FFF] rounded-lg">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Where You Rank on Google</h3>
                  <p className="text-sm text-gray-600">
                    Live Google search results for "{(() => {
                      const { foodType, city, state } = getSearchTerms();
                      return `${foodType} ${city} ${state}`.trim();
                    })()}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmbeddedSearch(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Google Search Results */}
            <div className="flex-1 p-4 bg-gray-50">
              <div className="bg-white rounded-lg p-6 h-full flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#5F5FFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[#5F5FFF]" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Search Results Would Appear Here</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    In a live environment, this would show Google search results for "{(() => {
                      const { foodType, city, state } = getSearchTerms();
                      return `${foodType} ${city} ${state}`.trim();
                    })()}"
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Google restricts embedding search results for security reasons. 
                      In production, this would use alternative search visualization or open in a new tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Look for <span className="font-semibold text-[#5F5FFF]">{restaurantName}</span> in the search results to see your ranking
                </div>
                <button
                  onClick={() => setShowEmbeddedSearch(false)}
                  className="px-4 py-2 bg-[#5F5FFF] text-white rounded-lg hover:bg-[#4F4FEF] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}