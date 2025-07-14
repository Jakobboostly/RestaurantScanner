import React from 'react';
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
  MessageCircle
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

export function PremiumScoreDashboard({ scanResult, restaurantName }: PremiumScoreDashboardProps) {
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
              <h3 className={`font-bold text-gray-900 ${isLarge ? 'text-xl' : 'text-lg'}`}>
                {title}
              </h3>
              {isLarge && <p className="text-sm text-gray-600">vs. Industry Average ({averageScore}%)</p>}
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
                  percentage >= 90 ? '#10B981, #34D399' :
                  percentage >= 75 ? '#F59E0B, #FBBF24' :
                  percentage >= 50 ? '#EF4444, #F87171' :
                  '#6B7280, #9CA3AF'
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
                <span className="text-sm font-medium text-orange-600">
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
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {restaurantName} Performance Report
            </h1>
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-lg text-gray-600">Professional Marketing Intelligence Dashboard</p>
        </motion.div>

        {/* Overall Score - Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-0">
              <PremiumMeter 
                score={scores.overall}
                title="Overall Performance"
                icon={Award}
                color="from-yellow-400 to-orange-500"
                size="large"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Individual Scores Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white">
            <CardContent className="p-0">
              <PremiumMeter 
                score={scores.search}
                title="Search"
                icon={Search}
                color="from-blue-500 to-blue-600"
                size="medium"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white">
            <CardContent className="p-0">
              <PremiumMeter 
                score={scores.social}
                title="Social"
                icon={Users}
                color="from-pink-500 to-pink-600"
                size="medium"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white">
            <CardContent className="p-0">
              <PremiumMeter 
                score={scores.local}
                title="Local"
                icon={MapPin}
                color="from-green-500 to-green-600"
                size="medium"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white">
            <CardContent className="p-0">
              <PremiumMeter 
                score={scores.website}
                title="Website"
                icon={Globe}
                color="from-purple-500 to-purple-600"
                size="medium"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white">
            <CardContent className="p-0">
              <PremiumMeter 
                score={scores.reviews}
                title="Reviews"
                icon={Star}
                color="from-yellow-500 to-yellow-600"
                size="medium"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Breakdown Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {/* Search Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Search Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SEO Score</span>
                <span className="font-medium">{scanResult.seo || 0}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Keywords Tracked</span>
                <span className="font-medium">{scanResult.keywordAnalysis?.targetKeywords?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SERP Features</span>
                <span className="font-medium">{scanResult.serpFeatures?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Social Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                Social Presence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Social Platforms</span>
                <span className="font-medium">
                  {Object.keys(scanResult.socialMediaLinks || {}).filter(key => scanResult.socialMediaLinks?.[key]).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Facebook</span>
                <span className="font-medium">{scanResult.socialMediaLinks?.facebook ? "✓" : "✗"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Instagram</span>
                <span className="font-medium">{scanResult.socialMediaLinks?.instagram ? "✓" : "✗"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Local Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Local Presence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Google Rating</span>
                <span className="font-medium">{scanResult.businessProfile?.rating || 0}/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Reviews</span>
                <span className="font-medium">{scanResult.businessProfile?.totalReviews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verified</span>
                <span className="font-medium">{scanResult.businessProfile?.isVerified ? "✓" : "✗"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Website Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Website Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Performance</span>
                <span className="font-medium">{scanResult.performance || 0}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mobile Score</span>
                <span className="font-medium">{scanResult.mobile || 0}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Domain Authority</span>
                <span className="font-medium">{scanResult.domainAuthority || 0}/100</span>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Reviews & Reputation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Rating</span>
                <span className="font-medium">{scanResult.businessProfile?.rating || 0}/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Review Count</span>
                <span className="font-medium">{scanResult.businessProfile?.totalReviews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sentiment</span>
                <span className="font-medium">
                  {scanResult.reviewsAnalysis?.sentiment?.positive > 70 ? "Positive" : 
                   scanResult.reviewsAnalysis?.sentiment?.positive > 40 ? "Mixed" : "Negative"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}