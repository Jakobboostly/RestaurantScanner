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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScanResult } from "@shared/schema";

interface PremiumScoreDashboardProps {
  scanResult: ScanResult;
  restaurantName: string;
}

interface ScoreData {
  search: number;
  social: number;
  local: number;
  website: number;
  reviews: number;
  overall: number;
}

interface AIExplanations {
  search: string;
  social: string;
  local: string;
  website: string;
  reviews: string;
}

export function PremiumScoreDashboard({ scanResult, restaurantName }: PremiumScoreDashboardProps) {
  const [aiExplanations, setAiExplanations] = useState<AIExplanations>({
    search: 'Analyzing search performance...',
    social: 'Analyzing social presence...',
    local: 'Analyzing local SEO...',
    website: 'Analyzing website performance...',
    reviews: 'Analyzing reviews and reputation...'
  });
  
  const [activeTab, setActiveTab] = useState<'search' | 'social' | 'local' | 'website' | 'reviews'>('search');

  // Calculate authentic scores from scan data
  const calculateScores = (): ScoreData => {
    // Search Score (based on SEO + keyword performance)
    const searchScore = Math.round(((scanResult.seo || 0) + (scanResult.keywordAnalysis?.targetKeywords?.length || 0) * 2) / 1.2);
    
    // Social Score (based on social media presence)
    const socialMediaLinks = scanResult.socialMediaLinks || {};
    const socialCount = Object.keys(socialMediaLinks).filter(key => socialMediaLinks[key]).length;
    const socialScore = Math.min(socialCount * 25, 100);
    
    // Local Score (based on business profile completeness)
    const businessProfile = scanResult.businessProfile || {};
    const localScore = Math.round(
      (businessProfile.rating || 0) * 10 + 
      (businessProfile.totalReviews ? Math.min(businessProfile.totalReviews / 10, 30) : 0)
    );
    
    // Website Score (based on performance + mobile)
    const websiteScore = Math.round(((scanResult.performance || 0) + (scanResult.mobile || 0)) / 2);
    
    // Reviews Score (based on rating and review count)
    const reviewsScore = Math.round(
      (businessProfile.rating || 0) * 15 + 
      (businessProfile.totalReviews ? Math.min(businessProfile.totalReviews / 20, 25) : 0)
    );
    
    // Overall Score (average of all 5)
    const overall = Math.round((searchScore + socialScore + localScore + websiteScore + reviewsScore) / 5);
    
    return {
      search: Math.min(searchScore, 100),
      social: Math.min(socialScore, 100),
      local: Math.min(localScore, 100),
      website: Math.min(websiteScore, 100),
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
        
      case 'website':
        if (scanResult.performance < 75) {
          steps.push('⚡ Boostly SEO: Improve website speed & mobile');
          steps.push('🔧 Boostly SEO: Optimize images & code');
          steps.push('💬 Boostly Text: Direct traffic to faster pages');
        } else {
          steps.push('🎯 Boostly SEO: Maintain excellent performance');
          steps.push('📱 Boostly Social: Highlight fast website');
        }
        if (scanResult.mobile < 80) {
          steps.push('📱 Boostly Social: Drive mobile traffic campaigns');
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
              <h3 className="font-bold text-xl text-white">
                {title}
              </h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { key: 'search', title: 'Search', icon: Search, color: 'from-[#5F5FFF] to-[#7375FD]', score: scores.search },
              { key: 'social', title: 'Social', icon: Users, color: 'from-[#16A34A] to-[#4ADE80]', score: scores.social },
              { key: 'local', title: 'Local', icon: MapPin, color: 'from-[#F59E0B] to-[#FCD34D]', score: scores.local },
              { key: 'website', title: 'Website', icon: Globe, color: 'from-[#9090FD] to-[#7375FD]', score: scores.website },
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
              activeTab === 'website' ? 'from-[#9090FD] to-[#7375FD]' :
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
                {activeTab === 'website' && (
                  <>
                    <Globe className="w-5 h-5" />
                    Website Performance
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
                <div className="space-y-6">
                  {/* Where You're Going Wrong */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Where You're Going Wrong
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
                      <span className="text-sm text-gray-600">Keywords Tracked</span>
                      <span className="font-medium">{scanResult.keywordAnalysis?.targetKeywords?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SERP Features</span>
                      <span className="font-medium">{scanResult.serpFeatures?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ranking Keywords</span>
                      <span className="font-medium">{scanResult.keywords?.filter(k => k.position && k.position <= 20).length || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Tab Content */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  {/* Where You're Going Wrong */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Where You're Going Wrong
                    </h3>
                    <div className="space-y-3">
                      {/* High Priority Issues */}
                      {scores.social < 50 && (
                        <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• No active social media presence - customers can't find you</li>
                            <li>• Missing out on free marketing through social posts</li>
                            <li>• Competitors are building loyal followings while you're invisible</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Medium Priority Issues */}
                      {scores.social >= 50 && scores.social < 75 && (
                        <div className="bg-[#7375FD]/10 border border-[#7375FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#7375FD] bg-[#7375FD]/20 px-2 py-1 rounded">MEDIUM PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Limited social media activity - posts are infrequent</li>
                            <li>• Low engagement rates with followers</li>
                            <li>• Missing key platforms where your customers are active</li>
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
                          <li>• Daily posts across Instagram, Facebook, and TikTok</li>
                          <li>• Engage with customers and respond to comments professionally</li>
                          <li>• Hashtag strategy to reach local food lovers</li>
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
                      <div className="grid grid-cols-3 gap-3">
                        {scanResult.businessProfile.photos.businessPhotos.slice(0, 9).map((photoUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photoUrl}
                              alt={`${restaurantName} content ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-[#5F5FFF]/20 hover:border-[#5F5FFF]/40 transition-all duration-300 shadow-sm hover:shadow-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Share2 className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-3">
                        {scanResult.businessProfile.photos.total} total photos • Perfect for social media content
                      </p>
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
                      <span className="text-sm text-gray-600">Active Platforms</span>
                      <span className="font-bold text-lg text-[#5F5FFF]">
                        {Object.keys(scanResult.socialMediaLinks || {}).filter(key => scanResult.socialMediaLinks?.[key]).length}/4
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Facebook</span>
                      <span className={scanResult.socialMediaLinks?.facebook ? "text-[#5F5FFF]" : "text-gray-400"}>
                        {scanResult.socialMediaLinks?.facebook ? "✓ Active" : "✗ Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Instagram</span>
                      <span className={scanResult.socialMediaLinks?.instagram ? "text-[#5F5FFF]" : "text-gray-400"}>
                        {scanResult.socialMediaLinks?.instagram ? "✓ Active" : "✗ Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <span className="font-medium">
                        {scanResult.socialMediaLinks?.facebookAnalysis?.engagementRate 
                          ? `${scanResult.socialMediaLinks.facebookAnalysis.engagementRate}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Local Tab Content */}
              {activeTab === 'local' && (
                <div className="space-y-6">
                  {/* Where You're Going Wrong */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Where You're Going Wrong
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
                      <span className="text-sm text-gray-600">Profile Completeness</span>
                      <span className="font-medium">{scanResult.profileAnalysis?.completeness?.score || 0}%</span>
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

              {/* Website Tab Content */}
              {activeTab === 'website' && (
                <div className="space-y-6">
                  {/* Where You're Going Wrong */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Where You're Going Wrong
                    </h3>
                    <div className="space-y-3">
                      {/* High Priority Issues */}
                      {scores.website < 50 && (
                        <div className="bg-[#5F5FFF]/10 border border-[#5F5FFF]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#5F5FFF] bg-[#5F5FFF]/20 px-2 py-1 rounded">HIGH PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Website loads too slowly - customers are leaving</li>
                            <li>• Mobile experience is broken - 60% of orders are mobile</li>
                            <li>• Missing online ordering system</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Medium Priority Issues */}
                      {scores.website >= 50 && scores.website < 75 && (
                        <div className="bg-[#7375FD]/10 border border-[#7375FD]/30 rounded p-3">
                          <span className="text-xs font-bold text-[#7375FD] bg-[#7375FD]/20 px-2 py-1 rounded">MEDIUM PRIORITY</span>
                          <ul className="mt-2 text-sm text-gray-700 space-y-1">
                            <li>• Website performance could be faster</li>
                            <li>• Mobile layout needs optimization</li>
                            <li>• Missing key restaurant website features</li>
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
                        <h4 className="font-semibold mb-2">🚀 Boostly Website Optimization</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Lightning-fast website that loads in under 2 seconds</li>
                          <li>• Mobile-first design optimized for food ordering</li>
                          <li>• Integrated online ordering and payment system</li>
                          <li>• SEO-optimized for local restaurant searches</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#7375FD] to-[#9090FD] text-white rounded p-3">
                        <h4 className="font-semibold mb-2">📱 Boostly Text Marketing</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Drive website traffic with targeted promotions</li>
                          <li>• Abandoned cart recovery for online orders</li>
                          <li>• Direct customers to specific menu items</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Performance Score</span>
                      <span className="font-bold text-lg text-[#9090FD]">{scanResult.performance || 0}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Mobile Score</span>
                      <span className="font-medium">{scanResult.mobile || 0}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Domain Authority</span>
                      <span className="font-medium">{scanResult.domainAuthority || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Tab Content */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Where You're Going Wrong */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
                      Where You're Going Wrong
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
                      <span className="font-bold text-lg text-[#FCD34D]">{scanResult.businessProfile?.rating || 0}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Positive Sentiment</span>
                      <span className="font-medium">{scanResult.reviewsAnalysis?.sentiment?.positive || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Review Volume</span>
                      <span className="font-medium">{scanResult.businessProfile?.totalReviews || 0}</span>
                    </div>
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