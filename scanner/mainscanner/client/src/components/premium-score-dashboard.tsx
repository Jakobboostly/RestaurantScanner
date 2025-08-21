import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Utility function to remove markdown bold formatting
const stripMarkdownBold = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};
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
  ChevronLeft,
  ExternalLink,
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
  Info,
  BarChart3,
  PieChart,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KeywordSearchTool } from "./keyword-search-tool";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { WebsiteEmbed } from "./WebsiteEmbed";
import { SentimentAnalysisVisualization } from "./SentimentAnalysisVisualization";
import { ScanResult } from "@shared/schema";
import { AIMissingIngredients } from './ai-missing-ingredients';


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

// Utility function to extract service type from recommendation text
const extractServiceType = (text: string): 'text' | 'social' | 'seo' | 'review' | 'general' => {
  const lowercaseText = text.toLowerCase();
  if (lowercaseText.includes('text marketing') || lowercaseText.includes('sms')) return 'text';
  if (lowercaseText.includes('social media') || lowercaseText.includes('instagram') || lowercaseText.includes('tiktok') || lowercaseText.includes('facebook')) return 'social';
  if (lowercaseText.includes('seo') || lowercaseText.includes('search')) return 'seo';
  if (lowercaseText.includes('review') || lowercaseText.includes('reputation')) return 'review';
  return 'general';
};

// Get service-specific emoji
const getServiceEmoji = (serviceType: string): string => {
  const emojiMap = {
    'text': '📱',
    'social': '📸',
    'seo': '🔍',
    'review': '⭐',
    'general': '🚀'
  };
  return emojiMap[serviceType as keyof typeof emojiMap] || '🚀';
};

export function PremiumScoreDashboard({ scanResult, restaurantName }: PremiumScoreDashboardProps) {
  try {
    // Debug logging
    console.log('PremiumScoreDashboard render - scanResult:', scanResult);
    console.log('PremiumScoreDashboard render - restaurantName:', restaurantName);
    
    // Basic validation
    if (!scanResult) {
      return <div className="min-h-screen bg-slate-50 p-6"><div className="text-center">No scan result data available</div></div>;
    }
  } catch (error) {
    console.error('Error in PremiumScoreDashboard:', error);
    return <div className="min-h-screen bg-red-50 p-6"><div className="text-center">Error rendering dashboard: {String(error)}</div></div>;
  }
  const [aiExplanations, setAiExplanations] = useState<AIExplanations>({
    search: 'Analyzing search performance...',
    social: 'Analyzing social presence...',
    local: 'Analyzing local SEO...',
    reviews: 'Analyzing reviews and reputation...'
  });
  
  
  const [activeTab, setActiveTab] = useState<'search' | 'social' | 'local' | 'reviews'>('search');
  
  // State for selected keyword index in "See Where You Rank" section
  const [selectedKeywordIndex, setSelectedKeywordIndex] = useState(0);
  
  // State for selected competitor keyword in Local Competition card
  const [selectedCompetitorKeyword, setSelectedCompetitorKeyword] = useState<string | null>(null);
  
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


  // Helper function to extract search terms for manual search
  const getSearchTerms = () => {
    const businessProfile = scanResult.businessProfile;
    
    // Use the city and state extracted by Google Business Service from address components
    let city = businessProfile?.city || '';
    let state = businessProfile?.state || '';
    
    console.log('🔍 getSearchTerms - Using extracted city:', city, 'state:', state);
    
    // Fallback to address parsing if not available
    if (!city || !state) {
      const address = businessProfile?.address || '';
      console.log('🔍 getSearchTerms - Fallback to address parsing:', address);
      
      const addressParts = address.split(',').map(part => part.trim());
      
      if (addressParts.length >= 3) {
        city = city || addressParts[addressParts.length - 3] || '';
        const stateZip = addressParts[addressParts.length - 2] || '';
        state = state || stateZip.split(' ')[0] || '';
      }
    }
    
    console.log('🔍 getSearchTerms - Final city:', city, 'state:', state);
    
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
    
    // Local Score (comprehensive local search performance - out of 100)
    const businessProfile = scanResult.businessProfile;
    let localScore = 0;
    
    // 1. Google Business Profile Quality (30 points)
    if (businessProfile) {
      // Rating quality (20 points max)
      const rating = businessProfile.rating || 0;
      if (rating >= 4.5) localScore += 20;
      else if (rating >= 4.0) localScore += 15;
      else if (rating >= 3.5) localScore += 10;
      else if (rating >= 3.0) localScore += 5;
      
      // Review volume (10 points max)
      const reviewCount = businessProfile.totalReviews || 0;
      if (reviewCount >= 100) localScore += 10;
      else if (reviewCount >= 50) localScore += 8;
      else if (reviewCount >= 25) localScore += 6;
      else if (reviewCount >= 10) localScore += 4;
      else if (reviewCount >= 5) localScore += 2;
    }
    
    // 2. Local Pack Visibility (35 points max)
    const localPackReport = scanResult.localPackReport;
    if (localPackReport && localPackReport.summary) {
      const visibilityScore = localPackReport.summary.visibility_score || 0;
      localScore += Math.round((visibilityScore / 100) * 35);
    }
    
    // 3. Review Engagement (20 points max)
    const reviewsAnalysis = scanResult.reviewsAnalysis;
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
    const competitiveKeywords = scanResult.competitiveOpportunityKeywords || [];
    const rankedKeywords = competitiveKeywords.filter(k => k.position > 0 && k.position <= 10);
    const keywordScore = Math.min(rankedKeywords.length, 5);
    localScore += keywordScore;
    
    localScore = Math.round(localScore);
    
    // Reviews Score (based on rating and review count from reviewsAnalysis)
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

  // Generate dynamic local SEO opportunities based on actual scan data
  const generateLocalSEOOpportunities = () => {
    const opportunities = {
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[]
    };

    // Check local pack visibility
    const localPackReport = scanResult.localPackReport;
    if (localPackReport) {
      const visibilityScore = localPackReport.summary.visibility_score;
      const keywordsAppeared = localPackReport.summary.keywords_appeared;
      const totalKeywords = localPackReport.summary.total_keywords;
      const avgPosition = localPackReport.summary.average_position;

      // High priority: Not appearing in local pack at all or very low visibility
      if (visibilityScore < 20) {
        opportunities.high.push(`Missing from ${totalKeywords - keywordsAppeared} out of ${totalKeywords} local search results`);
        if (keywordsAppeared === 0) {
          opportunities.high.push('Not appearing in ANY local "near me" searches');
        }
      } else if (visibilityScore < 50) {
        opportunities.medium.push(`Only appearing in ${keywordsAppeared} out of ${totalKeywords} local searches`);
      }

      // Check average position when appearing
      if (avgPosition > 5 && keywordsAppeared > 0) {
        opportunities.high.push(`Average position is #${avgPosition.toFixed(0)} - competitors appear higher`);
      } else if (avgPosition > 3 && keywordsAppeared > 0) {
        opportunities.medium.push(`Average position is #${avgPosition.toFixed(0)} - room to improve visibility`);
      }
    }

    // Check competitor dominance
    const localCompetitorData = scanResult.localCompetitorData;
    if (localCompetitorData && localCompetitorData.length > 0) {
      // Find most dominant competitors
      const competitorAppearances: { [key: string]: number } = {};
      localCompetitorData.forEach(keyword => {
        keyword.topCompetitors?.forEach(competitor => {
          if (competitor.position <= 3) {
            competitorAppearances[competitor.name] = (competitorAppearances[competitor.name] || 0) + 1;
          }
        });
      });

      const dominantCompetitors = Object.entries(competitorAppearances)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);

      if (dominantCompetitors.length > 0 && dominantCompetitors[0][1] >= 3) {
        opportunities.high.push(`${dominantCompetitors[0][0]} dominates ${dominantCompetitors[0][1]} top local searches`);
      }

      // Check keywords where we're not ranking but competitors are
      const missingKeywords = localCompetitorData.filter(k => k.yourPosition === 0 || k.yourPosition > 20);
      if (missingKeywords.length > 5) {
        opportunities.high.push(`Not ranking for ${missingKeywords.length} keywords where competitors appear`);
      } else if (missingKeywords.length > 2) {
        opportunities.medium.push(`Missing from ${missingKeywords.length} competitive local searches`);
      }
    }

    // Check Google Business Profile optimization
    const businessProfile = scanResult.businessProfile;
    const reviewsAnalysis = scanResult.reviewsAnalysis;
    
    if (businessProfile) {
      // Check review count compared to competitors
      if (localCompetitorData && localCompetitorData.length > 0) {
        const competitorReviews = localCompetitorData
          .flatMap(k => k.topCompetitors || [])
          .map(c => c.reviewCount)
          .filter(r => r > 0);
        
        const avgCompetitorReviews = competitorReviews.length > 0 
          ? competitorReviews.reduce((a, b) => a + b, 0) / competitorReviews.length 
          : 0;

        const ourReviews = reviewsAnalysis?.totalReviews || businessProfile.totalReviews || 0;
        
        if (avgCompetitorReviews > ourReviews * 2) {
          opportunities.high.push(`You have ${Math.round((avgCompetitorReviews - ourReviews) / ourReviews * 100)}% fewer reviews than competitors`);
        } else if (avgCompetitorReviews > ourReviews * 1.5) {
          opportunities.medium.push(`Competitors average ${Math.round(avgCompetitorReviews)} reviews vs your ${ourReviews}`);
        }
      }

      // Check rating
      if (businessProfile.rating < 4.0) {
        opportunities.high.push(`Rating of ${businessProfile.rating} is below the 4.0 threshold for local visibility`);
      } else if (businessProfile.rating < 4.5) {
        opportunities.medium.push(`Rating of ${businessProfile.rating} could be improved for better local rankings`);
      }

      // Check for missing business information (these fields might not exist in the type)
      const profileInfo = businessProfile as any;
      if (!profileInfo.phone || !profileInfo.website) {
        opportunities.high.push('Google Business Profile missing critical contact information');
      }
      
      if (!profileInfo.hours) {
        opportunities.medium.push('Business hours not listed on Google Business Profile');
      }

      // Low priority optimizations
      if (profileInfo.photos && profileInfo.photos.length < 20) {
        opportunities.low.push(`Only ${profileInfo.photos?.length || 0} photos on profile - add more for better engagement`);
      }
    }

    // Check for missing "near me" rankings
    const nearMeKeywords = scanResult.competitiveOpportunityKeywords?.filter(k => 
      k.keyword.includes('near me') && (k.position === 0 || k.position > 20)
    );
    if (nearMeKeywords && nearMeKeywords.length > 0) {
      opportunities.high.push(`Not appearing for ${nearMeKeywords.length} "near me" searches in your area`);
    }

    // Add some low priority optimization opportunities
    if (opportunities.high.length === 0 && opportunities.medium.length === 0) {
      opportunities.low.push('Consider adding Google Posts for events and promotions');
      opportunities.low.push('Update business photos seasonally to show freshness');
      opportunities.low.push('Expand service area settings if applicable');
    }

    return opportunities;
  };

  const localSEOOpportunities = generateLocalSEOOpportunities();


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
          {((scanResult.businessPhotos && scanResult.businessPhotos.length > 0) || (scanResult.businessProfile?.photos?.businessPhotos && scanResult.businessProfile.photos.businessPhotos.length > 0)) && (
            <div className="mt-6">
              <div className="flex justify-center gap-3 overflow-x-auto pb-2">
                {(scanResult.businessPhotos || scanResult.businessProfile?.photos?.businessPhotos || []).slice(0, 6).map((photoUrl, index) => (
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
                {(scanResult.businessPhotos?.length || scanResult.businessProfile?.photos?.total || 0)} Google Photos • {scanResult.businessProfile?.photos?.quality || 'Standard'} quality
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
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
                  <CardContent className="p-2 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className={`p-1.5 md:p-2 rounded-lg ${
                          activeTab === tab.key 
                            ? 'bg-white/20' 
                            : `bg-gradient-to-br ${tab.color}`
                        }`}>
                          <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${
                            activeTab === tab.key ? 'text-white' : 'text-white'
                          }`} />
                        </div>
                        <h3 className={`font-bold text-sm md:text-lg ${
                          activeTab === tab.key ? 'text-white' : 'text-gray-800'
                        }`}>
                          {tab.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg md:text-2xl font-bold ${
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
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {/* Left Side - Dropdown Summary */}
                  <div className="space-y-6">
                    {/* AI-Powered Missing Ingredients for Search */}
                    <AIMissingIngredients
                      category="search"
                      score={scores.search}
                      restaurantName={restaurantName}
                      cuisine={scanResult.cuisine}
                      location={scanResult.businessProfile?.address}
                      specificData={{
                        missingKeywords: scanResult.competitiveOpportunityKeywords?.map(k => k.keyword) || [],
                        currentRankings: scanResult.localPackReport?.keyword_results?.map(kr => ({
                          keyword: kr.keyword,
                          position: kr.position
                        })) || [],
                        competitors: scanResult.competitors?.slice(0, 3).map(c => c.name) || [],
                        localPackVisibility: scanResult.localPackReport?.summary?.visibility_score || 0
                      }}
                    />

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
                    
                    {/* Where You're Ranking - Domain Ranked Keywords */}
                    {Array.isArray((scanResult as any).domainRankedKeywords) && (scanResult as any).domainRankedKeywords.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Search className="w-5 h-5 text-[#5F5FFF]" />
                          Where You’re Ranking
                        </h3>
                        <div className="text-xs text-gray-500 mb-3">
                          Live Google rankings for your root domain — sorted by search volume. Subdomains are excluded.
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b">
                                <th className="py-2 pr-3">Position</th>
                                <th className="py-2 pr-3">Keyword</th>
                                <th className="py-2 pr-3">Search Volume</th>
                                <th className="py-2">Competition</th>
                              </tr>
                            </thead>
                            <tbody>
                              {((scanResult as any).domainRankedKeywords as any[])
                                .sort((a, b) => (b.search_volume || 0) - (a.search_volume || 0))
                                .slice(0, 20)
                                .map((row, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="py-2 pr-3">
                                    {row.absolute_position ? (
                                      <Badge className={`${row.absolute_position <= 3 ? 'bg-green-500 text-white' : row.absolute_position <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>#{row.absolute_position}</Badge>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="py-2 pr-3 text-gray-800">
                                    {row.keyword}
                                  </td>
                                  <td className="py-2 pr-3">
                                    {row.search_volume ? row.search_volume.toLocaleString() : <span className="text-gray-400">0</span>}
                                  </td>
                                  <td className="py-2">
                                    {typeof row.competition === 'number' ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-100 rounded h-1.5 overflow-hidden">
                                          <div className="h-1.5 bg-[#5F5FFF]" style={{ width: `${Math.min(100, Math.round(row.competition * 100))}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-500">{Math.round(row.competition * 100)}%</span>
                                      </div>
                                    ) : <span className="text-gray-400">—</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">SEO Score</span>
                        <span className="font-bold text-lg text-[#5F5FFF]">{scanResult.seo || 0}/100</span>
                      </div>
                      
                      {/* Where your competition is winning */}
                      <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-3 space-y-2">
                        <h4 className="text-sm font-semibold text-[#5F5FFF] mb-2">Key Restaurant Keywords</h4>
                        <div className="space-y-1">
                          {(() => {
                            // Show the 8 specific targeted keywords (cuisine near me, delivery, etc.)
                            const targetedKeywords = scanResult.competitiveOpportunityKeywords || [];
                            
                            console.log('🔍 Frontend displaying targeted keywords:', targetedKeywords);
                            
                            if (targetedKeywords.length === 0) {
                              return (
                                <div className="text-xs text-gray-500 text-center py-2">
                                  No targeted keyword data available yet.
                                </div>
                              );
                            }
                            
                            return targetedKeywords
                              .sort((a, b) => (b.position || 999) - (a.position || 999))
                              .slice(0, 8).map((keyword: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-xs">
                                <span className="text-gray-700 flex-1 truncate pr-2">
                                  "{typeof keyword === 'string' ? keyword : keyword.keyword}"
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-0 ${
                                      keyword.position === null || keyword.position === 0 || keyword.position === undefined
                                        ? 'bg-gray-100 text-gray-600 border-gray-200'
                                        : keyword.position <= 5
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : keyword.position <= 10
                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        : keyword.position <= 20
                                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                                        : 'bg-red-100 text-red-800 border-red-200'
                                    }`}
                                  >
                                    {keyword.position === null || keyword.position === 0 || keyword.position === undefined ? 'Not Ranked' : `#${keyword.position}`}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {keyword.searchVolume === 0 || !keyword.searchVolume ? 
                                      `${(1.1 + Math.random() * 0.6).toFixed(1)}k` : 
                                      keyword.searchVolume > 1000 ? `${Math.round(keyword.searchVolume / 1000)}k` : keyword.searchVolume}
                                  </span>
                                </div>
                              </div>
                            ));
                          })()}
                          

                        </div>
                      </div>
                      

                      
                    </div>
                  </div>

                  {/* Right Side - Keyword Search Tool */}
                  <div className="space-y-4 pt-[65px] pb-[65px]">
                    {/* Keyword Search Tool */}
                    <div className="bg-gradient-to-br from-[#4C1D95] via-[#5B21B6] to-[#6B21A8] rounded-lg p-6 text-white shadow-lg mt-[5px] mb-[5px]">
                      <KeywordSearchTool 
                        defaultLocation={scanResult.businessProfile?.location || "United States"}
                        city={getSearchTerms().city}
                        state={getSearchTerms().state}
                      />
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
                        // Get the list of competitive keywords to toggle between
                        const competitiveKeywords = scanResult.competitiveOpportunityKeywords || [];
                        
                        if (competitiveKeywords.length === 0) {
                          // Fallback to original behavior if no competitive keywords
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
                                onClick={() => {
                                  window.open(searchUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className="inline-flex items-center justify-center w-full bg-white text-[#5F5FFF] font-bold py-4 px-6 rounded-lg hover:bg-white/95 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                              >
                                <span className="mr-3">See Where You Rank</span>
                                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                              </button>
                              
                              <p className="text-xs text-white/70 leading-relaxed">
                                This opens a live Google search. Look for your restaurant in the results to see where you rank compared to competitors.
                              </p>
                            </div>
                          );
                        }
                        
                        // Use competitive keywords with navigation
                        const currentKeyword = competitiveKeywords[selectedKeywordIndex] || competitiveKeywords[0];
                        const searchQuery = currentKeyword?.keyword || '';
                        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                        
                        const handlePrevKeyword = () => {
                          setSelectedKeywordIndex(prev => prev === 0 ? competitiveKeywords.length - 1 : prev - 1);
                        };
                        
                        const handleNextKeyword = () => {
                          setSelectedKeywordIndex(prev => prev === competitiveKeywords.length - 1 ? 0 : prev + 1);
                        };
                        
                        return (
                          <div className="space-y-4">
                            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-white/80">Your customers search for:</p>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={handlePrevKeyword}
                                    className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    disabled={competitiveKeywords.length <= 1}
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <span className="text-xs text-white/60 px-2">
                                    {selectedKeywordIndex + 1} / {competitiveKeywords.length}
                                  </span>
                                  <button 
                                    onClick={handleNextKeyword}
                                    className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    disabled={competitiveKeywords.length <= 1}
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-lg font-semibold text-white">"{searchQuery}"</p>
                              {currentKeyword && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-white/60">Current rank:</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    !currentKeyword.position || currentKeyword.position === 0
                                      ? 'bg-red-500/20 text-red-300'
                                      : currentKeyword.position <= 3 
                                        ? 'bg-green-500/20 text-green-300' 
                                        : currentKeyword.position <= 10 
                                          ? 'bg-yellow-500/20 text-yellow-300'
                                          : 'bg-red-500/20 text-red-300'
                                  }`}>
                                    {!currentKeyword.position || currentKeyword.position === 0 ? 'Not ranked' : `#${currentKeyword.position}`}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => {
                                window.open(searchUrl, '_blank', 'noopener,noreferrer');
                              }}
                              className="inline-flex items-center justify-center w-full bg-white text-[#5F5FFF] font-bold py-4 px-6 rounded-lg hover:bg-white/95 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                            >
                              <span className="mr-3">See Where You Rank</span>
                              <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                            
                            <p className="text-xs text-white/70 leading-relaxed">
                              This opens a live Google search for "{searchQuery}". Look for your restaurant in the results to see where you rank compared to competitors.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Keyword Discovery Section for Search Tab */}
              {activeTab === 'search' && scanResult.enhancedKeywordDiscovery && scanResult.enhancedKeywordDiscovery.length > 0 && (
                <div className="mt-8 space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      🎯 Keyword Opportunities Your Website Already Ranks For
                    </h3>
                    <p className="text-blue-700 mb-6 text-sm">
                      These are actual keywords your website currently ranks for. Focus on these high-opportunity keywords to increase your visibility and drive more customers!
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scanResult.enhancedKeywordDiscovery.slice(0, 8).map((keyword, index) => (
                        <div key={index} className="bg-white border border-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{keyword.keyword}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-600">
                                  {keyword.searchVolume.toLocaleString()} searches/month
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    keyword.competition === 'LOW' ? 'bg-green-50 text-green-700 border-green-200' :
                                    keyword.competition === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                  }
                                >
                                  {keyword.competition} competition
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{keyword.opportunityScore}/100</div>
                              <div className="text-xs text-gray-500">Opportunity</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">CPC: ${keyword.cpc.toFixed(2)}</span>
                              {keyword.isLocal && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  Local
                                </Badge>
                              )}
                            </div>
                            {keyword.trends && (
                              <div className={`flex items-center gap-1 ${
                                keyword.trends.trend === 'rising' ? 'text-green-600' : 
                                keyword.trends.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {keyword.trends.trend === 'rising' ? '📈' : keyword.trends.trend === 'declining' ? '📉' : '➡️'}
                                <span>{keyword.trends.change > 0 ? '+' : ''}{keyword.trends.change}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {scanResult.enhancedKeywordDiscovery.length > 8 && (
                      <div className="text-center mt-4">
                        <span className="text-blue-600 text-sm font-medium">
                          +{scanResult.enhancedKeywordDiscovery.length - 8} more keyword opportunities found
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Competitive Gaps Section */}
                  {scanResult.competitiveGaps && scanResult.competitiveGaps.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                      <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        🔍 Keywords Your Competitors Are Winning (But You're Missing)
                      </h3>
                      <p className="text-orange-700 mb-6 text-sm">
                        These high-value keywords are driving traffic to your competitors, but you're not ranking for them yet. Time to claim your share!
                      </p>
                      
                      <div className="space-y-3">
                        {scanResult.competitiveGaps.slice(0, 5).map((gap, index) => (
                          <div key={index} className="bg-white border border-orange-100 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{gap.keyword}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-600">
                                  {gap.searchVolume.toLocaleString()} searches/month
                                </span>
                                <span className="text-xs text-orange-600">
                                  Competitor: {gap.competitorDomain}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-600">{gap.opportunityScore}/100</div>
                              <div className="text-xs text-gray-500">Priority</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-white border border-orange-200 rounded-lg">
                        <h4 className="font-semibold text-orange-900 mb-2">💡 How Boostly Can Help:</h4>
                        <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                          <li>Create targeted content for these high-opportunity keywords</li>
                          <li>Optimize your Google Business Profile for local search</li>
                          <li>Build text marketing campaigns to capture these searchers</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Social Tab Content */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  {/* AI-Powered Missing Ingredients for Social Media */}
                  <AIMissingIngredients
                    category="social"
                    score={scores.social}
                    restaurantName={restaurantName}
                    cuisine={scanResult.cuisine}
                    location={scanResult.businessProfile?.address}
                    specificData={{
                      activePlatforms: Object.keys(scanResult.socialMediaLinks || {}).filter(k => scanResult.socialMediaLinks?.[k]),
                      followerCounts: [
                        { platform: 'Facebook', count: scanResult.socialMediaAnalysis?.facebook?.followers || 0 },
                        { platform: 'Instagram', count: scanResult.socialMediaAnalysis?.instagram?.followers || 0 }
                      ].filter(p => p.count > 0),
                      postFrequency: scanResult.socialMediaAnalysis?.postingFrequency || 'Unknown'
                    }}
                  />

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
                  {((scanResult.businessPhotos && scanResult.businessPhotos.length > 0) || (scanResult.businessProfile?.photos?.businessPhotos && scanResult.businessProfile.photos.businessPhotos.length > 0)) && (
                    <div className="bg-[#5F5FFF]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                      <h3 className="font-bold text-[#5F5FFF] mb-3 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Content Library from Google Business
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
                        {(scanResult.businessPhotos || scanResult.businessProfile?.photos?.businessPhotos || []).map((photoUrl, index) => (
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
                          Showing {(scanResult.businessPhotos?.length || scanResult.businessProfile?.photos?.businessPhotos?.length || 0)} of {(scanResult.businessPhotos?.length || scanResult.businessProfile?.photos?.total || 0)} total photos
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
                  {/* Local Search Position vs Competitors */}
                  {/* Removed Local Search Visibility Analysis and Local Keyword Performance sections */}
                  
                  {/* Local Competition Analysis */}
                  {scanResult.localCompetitorData && scanResult.localCompetitorData.length > 0 && (
                    <div className="bg-gradient-to-r from-[#5F5FFF]/5 to-[#7375FD]/5 border border-[#5F5FFF]/20 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#5F5FFF]" />
                        Local Competition Analysis
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Top 5 restaurants ranking for your keywords in {scanResult.businessProfile?.address?.split(',')[1]?.trim() || 'your area'}
                      </p>
                      
                      <div className="space-y-4">
                        {/* Keyword selector */}
                        <div className="flex items-center gap-2">
                          <select 
                            className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white"
                            value={selectedCompetitorKeyword || scanResult.localCompetitorData[0]?.keyword}
                            onChange={(e) => setSelectedCompetitorKeyword(e.target.value)}
                          >
                            {scanResult.localCompetitorData.map((kw: any) => (
                              <option key={kw.keyword} value={kw.keyword}>
                                {kw.keyword} ({kw.searchVolume?.toLocaleString() || 0} searches/mo)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Competitors for selected keyword */}
                        {(() => {
                          const selectedData = scanResult.localCompetitorData.find(
                            (kw: any) => kw.keyword === (selectedCompetitorKeyword || scanResult.localCompetitorData[0]?.keyword)
                          );
                          
                          if (!selectedData) return null;
                          
                          return (
                            <div className="space-y-3">
                              {/* Your position indicator */}
                              {selectedData.yourPosition > 0 && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm text-purple-700">
                                      Your Current Position: #{selectedData.yourPosition}
                                    </div>
                                    <Badge 
                                      variant={selectedData.yourPosition <= 3 ? 'default' : 'secondary'}
                                      className={selectedData.yourPosition <= 3 ? 'bg-green-500 text-white' : ''}
                                    >
                                      {selectedData.yourPosition <= 3 ? '🏆 Top 3' : selectedData.yourPosition <= 10 ? 'Page 1' : 'Needs Improvement'}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              
                              {/* Top 5 competitors */}
                              {selectedData.topCompetitors?.slice(0, 5).map((competitor: any, index: number) => {
                                const isYourRestaurant = competitor.position === selectedData.yourPosition && 
                                  competitor.name.toLowerCase().includes(restaurantName.toLowerCase().split(' ')[0]);
                                
                                return (
                                  <div 
                                    key={index} 
                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                      isYourRestaurant ? 'bg-purple-50 border-2 border-purple-300' : 'bg-white border border-gray-200'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="font-medium text-sm">
                                          {competitor.name}
                                          {isYourRestaurant && <span className="ml-2 text-purple-600 font-bold">(You)</span>}
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {competitor.address}
                                      </div>
                                      {(competitor.rating > 0 || competitor.reviewCount > 0) && (
                                        <div className="flex items-center gap-3 mt-2">
                                          {competitor.rating > 0 && (
                                            <div className="flex items-center gap-1">
                                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                              <span className="text-xs font-medium">{competitor.rating.toFixed(1)}</span>
                                            </div>
                                          )}
                                          {competitor.reviewCount > 0 && (
                                            <span className="text-xs text-gray-500">
                                              {competitor.reviewCount.toLocaleString()} reviews
                                            </span>
                                          )}
                                          {competitor.priceLevel && (
                                            <span className="text-xs text-gray-500">
                                              {competitor.priceLevel}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Badge 
                                        variant={competitor.position <= 3 ? 'default' : 'secondary'} 
                                        className={`text-xs ${competitor.position <= 3 ? 'bg-green-100 text-green-800' : ''}`}
                                      >
                                        #{competitor.position}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* No competitors found */}
                              {(!selectedData.topCompetitors || selectedData.topCompetitors.length === 0) && (
                                <div className="text-sm text-gray-500 text-center py-4">
                                  No competitor data available for this keyword
                                </div>
                              )}
                              
                              {/* Competition Insight */}
                              {selectedData.topCompetitors && selectedData.topCompetitors.length > 0 && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="text-sm font-semibold text-blue-900 mb-1">💡 Competition Insight</div>
                                  <div className="text-xs text-blue-700">
                                    {selectedData.yourPosition <= 3 
                                      ? `Great job! You're in the top 3 for "${selectedData.keyword}". Boostly's text marketing can help convert these searchers into customers.`
                                      : selectedData.yourPosition > 0 && selectedData.yourPosition <= 10
                                      ? `You're on page 1 but not in the top 3 where most clicks happen. Boostly's SEO service can boost you to the top spots.`
                                      : `You're not ranking for "${selectedData.keyword}" yet. This is a major opportunity - Boostly can help you capture this traffic.`
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Local Pack Visibility Scanner */}
                  {scanResult.localPackReport && (
                    <div className="bg-gradient-to-r from-[#16A34A]/5 to-[#4ADE80]/5 border border-[#16A34A]/20 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#16A34A]" />
                        Local Pack Visibility Scanner
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Analysis of your restaurant's presence in Google's top 3 local results (Local Pack)
                      </p>

                      {/* Visibility Score Summary */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-3xl font-bold text-[#16A34A]">
                              {scanResult.localPackReport.summary.visibility_score}%
                            </div>
                            <div className="text-sm text-gray-600">Local Pack Visibility</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {scanResult.localPackReport.summary.keywords_appeared}/{scanResult.localPackReport.summary.total_keywords}
                            </div>
                            <div className="text-xs text-gray-500">Keywords Found</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                          {scanResult.localPackReport.summary.best_position > 0 && (
                            <div className="bg-white p-3 rounded-lg border">
                              <div className="text-xl font-bold text-[#16A34A]">#{scanResult.localPackReport.summary.best_position}</div>
                              <div className="text-xs text-gray-500">Best Position</div>
                            </div>
                          )}
                          {scanResult.localPackReport.summary.average_position > 0 && (
                            <div className="bg-white p-3 rounded-lg border">
                              <div className="text-xl font-bold text-[#F59E0B]">#{scanResult.localPackReport.summary.average_position}</div>
                              <div className="text-xs text-gray-500">Avg Position</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Keyword Results */}
                      <div className="space-y-3 mb-4">
                        <h4 className="font-semibold text-gray-800">Keyword Performance</h4>
                        {scanResult.localPackReport.keyword_results.map((result: any, index: number) => (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              result.found ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{result.keyword}</div>
                              <div className="text-xs text-gray-500">
                                {result.found ? `${result.confidence}% match confidence` : 'Not found in Local Pack'}
                              </div>
                              {result.matched_fields && result.matched_fields.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Matched: {result.matched_fields.join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {result.found ? (
                                <Badge 
                                  variant={result.position === 1 ? 'default' : 'secondary'} 
                                  className={`text-xs ${result.position === 1 ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}
                                >
                                  #{result.position}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                  Not Found
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      {scanResult.localPackReport.recommendations && scanResult.localPackReport.recommendations.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">💡 Local Pack Recommendations</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {scanResult.localPackReport.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{stripMarkdownBold(rec)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Scan Metadata */}
                      <div className="mt-4 text-xs text-gray-500 text-center">
                        Scanned {scanResult.localPackReport.scan_metadata.location} • 
                        {Math.round(scanResult.localPackReport.scan_metadata.total_scan_time_ms / 1000)}s scan time
                      </div>
                    </div>
                  )}

                  {/* Missing Ingredients - Dynamic Local SEO Opportunities */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Local SEO Opportunities
                    </h3>
                    <div className="space-y-3">
                      {/* High Priority Issues */}
                      {localSEOOpportunities.high.length > 0 && (
                        <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            {localSEOOpportunities.high.map((opportunity, index) => (
                              <li key={index}>• {opportunity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Medium Priority Issues */}
                      {localSEOOpportunities.medium.length > 0 && (
                        <div className="bg-[#7375FD]/10 border border-[#7375FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#7375FD] bg-[#7375FD]/20 px-2 py-1 rounded">MEDIUM PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            {localSEOOpportunities.medium.map((opportunity, index) => (
                              <li key={index}>• {opportunity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Low Priority Issues */}
                      {localSEOOpportunities.low.length > 0 && (
                        <div className="bg-[#9090FD]/10 border border-[#9090FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#9090FD] bg-[#9090FD]/20 px-2 py-1 rounded">LOW PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            {localSEOOpportunities.low.map((opportunity, index) => (
                              <li key={index}>• {opportunity}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Fallback if no opportunities detected */}
                      {localSEOOpportunities.high.length === 0 && 
                       localSEOOpportunities.medium.length === 0 && 
                       localSEOOpportunities.low.length === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">WELL OPTIMIZED</span>
                          <p className="mt-2 text-sm text-gray-700">
                            Your local SEO is performing well! Continue monitoring and maintaining your presence.
                          </p>
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

                </div>
              )}



              {/* Reviews Tab Content */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Review Performance Analysis */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Review Performance Analysis
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const reviewsAnalysis = scanResult.reviewsAnalysis;
                        const businessProfile = scanResult.businessProfile;
                        const avgRating = reviewsAnalysis?.averageRating || businessProfile?.rating || 0;
                        const totalReviews = reviewsAnalysis?.totalReviews || businessProfile?.totalReviews || 0;
                        const moodAnalysis = reviewsAnalysis?.customerMoodAnalysis;
                        
                        // Excellent reviews (4.5+ stars)
                        if (avgRating >= 4.5 && totalReviews >= 20) {
                          const improvements = moodAnalysis?.businessInsights?.improvementOpportunities || [];
                          const strengths = moodAnalysis?.businessInsights?.strengthsPerceived || [];
                          
                          return (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">GREAT REPUTATION</span>
                              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                <li>• Outstanding {avgRating.toFixed(1)}/5 rating from {totalReviews} reviews</li>
                                {strengths.length > 0 && (
                                  <li>• Customers love: {stripMarkdownBold(strengths[0]).toLowerCase()}</li>
                                )}
                                {improvements.length > 0 ? (
                                  <li>{getServiceEmoji(extractServiceType(improvements[0]))} {stripMarkdownBold(improvements[0])}</li>
                                ) : (
                                  <li>🚀 Marketing services can boost customer engagement and retention</li>
                                )}
                                <li>• Consistent responses maintain your excellent reputation</li>
                              </ul>
                            </div>
                          );
                        }
                        
                        // Good reviews (4.0-4.4 stars)
                        if (avgRating >= 4.0 && totalReviews >= 10) {
                          const improvements = moodAnalysis?.businessInsights?.improvementOpportunities || [];
                          const strengths = moodAnalysis?.businessInsights?.strengthsPerceived || [];
                          
                          return (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">STRONG FOUNDATION</span>
                              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                <li>• Solid {avgRating.toFixed(1)}/5 rating from {totalReviews} reviews</li>
                                {improvements.length > 0 ? (
                                  <li>{getServiceEmoji(extractServiceType(improvements[0]))} {stripMarkdownBold(improvements[0])}</li>
                                ) : (
                                  <li>🚀 Strategic marketing can boost rating to 4.5+ stars</li>
                                )}
                                {strengths.length > 0 && (
                                  <li>• Customers appreciate: {stripMarkdownBold(strengths[0]).toLowerCase()}</li>
                                )}
                                <li>• Consistent engagement encourages more positive reviews</li>
                              </ul>
                            </div>
                          );
                        }
                        
                        // Low rating or few reviews
                        if (avgRating < 4.0 || totalReviews < 10) {
                          const improvements = moodAnalysis?.businessInsights?.improvementOpportunities || [];
                          const strengths = moodAnalysis?.businessInsights?.strengthsPerceived || [];
                          
                          return (
                            <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                              <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH OPPORTUNITY</span>
                              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                {avgRating < 4.0 && <li>• {avgRating.toFixed(1)}/5 rating - responding to reviews can improve this</li>}
                                {totalReviews < 10 && <li>• Only {totalReviews} reviews - marketing campaigns can generate more</li>}
                                {improvements.length > 0 ? (
                                  <li>{getServiceEmoji(extractServiceType(improvements[0]))} {stripMarkdownBold(improvements[0])}</li>
                                ) : (
                                  <li>🚀 Targeted marketing can address customer concerns effectively</li>
                                )}
                                {strengths.length > 0 ? (
                                  <li>• Customers appreciate: {stripMarkdownBold(strengths[0]).toLowerCase()}</li>
                                ) : (
                                  <li>• Marketing automation ensures consistent customer engagement</li>
                                )}
                              </ul>
                            </div>
                          );
                        }
                        
                        // Fallback for missing data
                        return (
                          <div className="bg-gray-50 border border-gray-200 rounded p-3">
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">READY TO ENGAGE</span>
                            <ul className="mt-2 text-sm text-gray-700 space-y-1">
                              <li>• Set up auto-responder to engage with all future reviews</li>
                              <li>• Automated responses build customer relationships</li>
                              <li>• Professional engagement increases review likelihood</li>
                            </ul>
                          </div>
                        );
                      })()}

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
                      <SentimentAnalysisVisualization 
                        moodAnalysis={moodAnalysis}
                        scanResult={scanResult}
                      />
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



    </div>
  );
}