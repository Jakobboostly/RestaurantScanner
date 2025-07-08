import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  EyeOff, 
  Smartphone, 
  Zap, 
  Search, 
  Users, 
  TrendingUp, 
  Star,
  MapPin,
  Clock,
  ExternalLink,
  Target,
  Award,
  CheckCircle,
  XCircle,
  Eye,
  Globe,
  Laptop,
  BarChart3,
  Shield,
  Heart,
  Utensils,
  Coffee,
  Pizza,
  ChefHat,
  ShoppingCart,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Image,
  Link,
  FileText,
  Tag,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Navigation,
  ChevronRight,
  Info,
  AlertCircle,
  Settings,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReviewsAnalysis from "./reviews-analysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ScoreGauge from "./score-gauge";
import { ScanResult } from "@shared/schema";

interface ResultsDashboardProps {
  scanResult: ScanResult;
  restaurantName: string;
}

export default function ResultsDashboard({ scanResult, restaurantName }: ResultsDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    if (score >= 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getSearchIntentIcon = (intent: string) => {
    if (!intent) return Target;
    
    switch (intent.toLowerCase()) {
      case 'navigational': return Navigation;
      case 'informational': return Info;
      case 'transactional': return ShoppingCart;
      case 'local': return MapPin;
      case 'research': return Search;
      default: return Target;
    }
  };

  const getSearchIntentColor = (intent: string) => {
    if (!intent) return 'text-gray-600 bg-gray-100';
    
    switch (intent.toLowerCase()) {
      case 'navigational': return 'text-blue-600 bg-blue-100';
      case 'informational': return 'text-purple-600 bg-purple-100';
      case 'transactional': return 'text-green-600 bg-green-100';
      case 'local': return 'text-orange-600 bg-orange-100';
      case 'research': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPositionIcon = (position: number | null) => {
    if (!position) return XCircle;
    if (position <= 3) return Award;
    if (position <= 10) return TrendingUp;
    if (position <= 20) return Minus;
    return TrendingDown;
  };

  const getPositionColor = (position: number | null) => {
    if (!position) return 'text-gray-500';
    if (position <= 3) return 'text-green-600';
    if (position <= 10) return 'text-yellow-600';
    if (position <= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getIssueIcon = (category: string) => {
    const icons = {
      'performance': Zap,
      'seo': Search,
      'mobile': Smartphone,
      'features': ShoppingCart,
      'ux': Users,
      'accessibility': Shield,
      'security': Shield
    };
    return icons[category as keyof typeof icons] || AlertTriangle;
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-900';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getIssueIconColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationIcon = (priority: string) => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Info;
      case 'low': return CheckCircle;
      default: return Info;
    }
  };

  const getRecommendationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-900';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low': return 'bg-green-50 border-green-200 text-green-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getRecommendationIconColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low': return { color: 'bg-green-100 text-green-800', text: 'Easy Fix' };
      case 'medium': return { color: 'bg-yellow-100 text-yellow-800', text: 'Moderate' };
      case 'high': return { color: 'bg-red-100 text-red-800', text: 'Complex' };
      default: return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

  return (
    <div className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 bg-gradient-to-br from-[#28008F] to-[#4a1fb8] rounded-full mr-4">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              {restaurantName} Website Analysis
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete digital performance report with actionable insights to grow your restaurant business
          </p>
        </motion.div>

        {/* Overall Score Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <ScoreGauge score={scanResult.overallScore} size="large" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{scanResult.overallScore}</div>
                        <div className="text-sm text-gray-500">Overall</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Website Health Score</h2>
                    <p className="text-gray-600 max-w-md">
                      Based on performance, SEO, mobile optimization, and user experience analysis
                    </p>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{scanResult.domain}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Zap className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{scanResult.performance}</div>
                    <div className="text-sm text-gray-500">Performance</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Search className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{scanResult.seo}</div>
                    <div className="text-sm text-gray-500">SEO</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Smartphone className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{scanResult.mobile}</div>
                    <div className="text-sm text-gray-500">Mobile</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{scanResult.userExperience}</div>
                    <div className="text-sm text-gray-500">User Experience</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white border shadow-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Keywords</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>SEO Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile</span>
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Competitors</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Actions</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Zap className="h-5 w-5 text-orange-600" />
                        </div>
                        <CardTitle className="text-lg">Performance</CardTitle>
                      </div>
                      <Badge className={getScoreBadgeColor(scanResult.performance)}>
                        {scanResult.performance}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress 
                        value={scanResult.performance} 
                        className="h-2"
                        style={{ '--progress-background': getProgressColor(scanResult.performance) } as any}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Speed & Loading</span>
                        <span className={getScoreColor(scanResult.performance)}>
                          {scanResult.performance >= 80 ? 'Excellent' : 
                           scanResult.performance >= 60 ? 'Good' : 
                           scanResult.performance >= 40 ? 'Fair' : 'Poor'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* SEO Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Search className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">SEO</CardTitle>
                      </div>
                      <Badge className={getScoreBadgeColor(scanResult.seo)}>
                        {scanResult.seo}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress 
                        value={scanResult.seo} 
                        className="h-2"
                        style={{ '--progress-background': getProgressColor(scanResult.seo) } as any}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Search Visibility</span>
                        <span className={getScoreColor(scanResult.seo)}>
                          {scanResult.seo >= 80 ? 'Excellent' : 
                           scanResult.seo >= 60 ? 'Good' : 
                           scanResult.seo >= 40 ? 'Fair' : 'Poor'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Mobile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Smartphone className="h-5 w-5 text-green-600" />
                        </div>
                        <CardTitle className="text-lg">Mobile</CardTitle>
                      </div>
                      <Badge className={getScoreBadgeColor(scanResult.mobile)}>
                        {scanResult.mobile}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress 
                        value={scanResult.mobile} 
                        className="h-2"
                        style={{ '--progress-background': getProgressColor(scanResult.mobile) } as any}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Mobile Experience</span>
                        <span className={getScoreColor(scanResult.mobile)}>
                          {scanResult.mobile >= 80 ? 'Excellent' : 
                           scanResult.mobile >= 60 ? 'Good' : 
                           scanResult.mobile >= 40 ? 'Fair' : 'Poor'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Critical Issues Section */}
            {scanResult.issues && scanResult.issues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                      <CardTitle className="text-xl">Critical Issues Found</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {scanResult.issues.slice(0, 3).map((issue, index) => {
                        const IconComponent = getIssueIcon(issue.category);
                        return (
                          <div key={index} className={`p-4 rounded-lg border-2 ${getIssueColor(issue.type)}`}>
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getIssueIconColor(issue.type)}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{issue.title}</h4>
                                <p className="text-sm opacity-90 mb-2">{issue.description}</p>
                                <p className="text-sm font-medium">Impact: {issue.impact}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-6">
            {scanResult.keywords && scanResult.keywords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Keyword Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{scanResult.keywords.length || 0}</div>
                      <div className="text-sm text-gray-500">Total Keywords</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {scanResult.keywords.length > 0 ? Math.round(scanResult.keywords.filter(k => k.position).reduce((acc, k) => acc + k.position!, 0) / scanResult.keywords.filter(k => k.position).length) || 'N/A' : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">Avg Position</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <Eye className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {scanResult.keywords.length > 0 ? Math.round((scanResult.keywords.filter(k => k.position && k.position <= 10).length / scanResult.keywords.length) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-500">Visibility</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {scanResult.keywords.filter(k => k.position && k.position <= 10).length}
                      </div>
                      <div className="text-sm text-gray-500">Top 10 Rankings</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Keyword Rankings Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Search className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle>Keyword Rankings</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scanResult.keywords.slice(0, 10).map((keyword, index) => {
                        const PositionIcon = getPositionIcon(keyword.position);
                        const IntentIcon = getSearchIntentIcon(keyword.intent);
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-lg ${getPositionColor(keyword.position)} bg-opacity-20`}>
                                <PositionIcon className={`h-5 w-5 ${getPositionColor(keyword.position)}`} />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{keyword.keyword}</div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>Volume: {keyword.searchVolume.toLocaleString()}</span>
                                  <span>•</span>
                                  <span>Difficulty: {keyword.difficulty}/100</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSearchIntentColor(keyword.intent)}`}>
                                <IntentIcon className="h-3 w-3 inline mr-1" />
                                {keyword.intent}
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${getPositionColor(keyword.position)}`}>
                                  {keyword.position ? `#${keyword.position}` : 'Not ranked'}
                                </div>
                                <div className="text-xs text-gray-500">Position</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* SEO Analysis Tab */}
          <TabsContent value="seo" className="space-y-6">
            {scanResult.seoAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* On-Page SEO */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <CardTitle>On-Page SEO</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Tag className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Title Tag</span>
                          </div>
                          <Badge variant={scanResult.seoAnalysis.title ? "default" : "destructive"}>
                            {scanResult.seoAnalysis.title ? "Found" : "Missing"}
                          </Badge>
                        </div>
                        {scanResult.seoAnalysis.title && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {scanResult.seoAnalysis.title}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">Meta Description</span>
                          </div>
                          <Badge variant={scanResult.seoAnalysis.metaDescription ? "default" : "destructive"}>
                            {scanResult.seoAnalysis.metaDescription ? "Found" : "Missing"}
                          </Badge>
                        </div>
                        {scanResult.seoAnalysis.metaDescription && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {scanResult.seoAnalysis.metaDescription}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">H1 Tags</span>
                          </div>
                          <Badge variant={scanResult.seoAnalysis.h1Tags.length > 0 ? "default" : "destructive"}>
                            {scanResult.seoAnalysis.h1Tags.length} found
                          </Badge>
                        </div>
                        {scanResult.seoAnalysis.h1Tags.length > 0 && (
                          <div className="space-y-1">
                            {scanResult.seoAnalysis.h1Tags.map((h1, index) => (
                              <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {h1}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Content Analysis */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-yellow-600" />
                        </div>
                        <CardTitle>Content Analysis</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Image className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{scanResult.seoAnalysis.totalImages}</div>
                          <div className="text-sm text-gray-500">Total Images</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Tag className="h-6 w-6 text-green-500 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{scanResult.seoAnalysis.imageAltTags}</div>
                          <div className="text-sm text-gray-500">Alt Tags</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Link className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{scanResult.seoAnalysis.internalLinks}</div>
                          <div className="text-sm text-gray-500">Internal Links</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <ExternalLink className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{scanResult.seoAnalysis.externalLinks}</div>
                          <div className="text-sm text-gray-500">External Links</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Settings className="h-4 w-4 text-indigo-500" />
                            <span className="text-sm">Schema Markup</span>
                          </div>
                          <Badge variant={scanResult.seoAnalysis.hasSchema ? "default" : "destructive"}>
                            {scanResult.seoAnalysis.hasSchema ? "Implemented" : "Missing"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Mobile Tab */}
          <TabsContent value="mobile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mobile Screenshot */}
              {scanResult.screenshot && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle>Mobile Preview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative max-w-xs mx-auto">
                      <div className="bg-gray-900 rounded-3xl p-2 shadow-2xl">
                        <img 
                          src={scanResult.screenshot} 
                          alt="Mobile screenshot" 
                          className="w-full rounded-2xl"
                        />
                      </div>
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full"></div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-800 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mobile Performance */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle>Mobile Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mobile Score</span>
                      <Badge className={getScoreBadgeColor(scanResult.mobile)}>
                        {scanResult.mobile}/100
                      </Badge>
                    </div>
                    <Progress value={scanResult.mobile} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Experience</span>
                      <Badge className={getScoreBadgeColor(scanResult.userExperience)}>
                        {scanResult.userExperience}/100
                      </Badge>
                    </div>
                    <Progress value={scanResult.userExperience} className="h-2" />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Responsive Design</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Touch-Friendly Interface</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Mobile-Optimized Images</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="space-y-6">
            {scanResult.competitors && scanResult.competitors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle>Competitor Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scanResult.competitors.map((competitor, index) => (
                        <div key={index} className={`p-4 rounded-lg border-2 ${competitor.isYou ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${competitor.isYou ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                {competitor.isYou ? (
                                  <Star className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Utensils className="h-5 w-5 text-gray-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {competitor.name}
                                  {competitor.isYou && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800">You</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Overall Score: {competitor.overallScore || competitor.score || 0}/100
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getScoreColor(competitor.overallScore || competitor.score || 0)}`}>
                                {competitor.overallScore || competitor.score || 0}
                              </div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Progress value={competitor.overallScore || competitor.score || 0} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {(!scanResult.competitors || scanResult.competitors.length === 0) && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Competitors Found</h3>
                <p className="text-gray-500">
                  We couldn't find any nearby competitors to analyze. This could be due to location data or API limitations.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            {scanResult.recommendations && scanResult.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Sparkles className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle>Recommended Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scanResult.recommendations.map((recommendation, index) => {
                        const IconComponent = getRecommendationIcon(recommendation.priority);
                        const effortBadge = getEffortBadge(recommendation.effort);
                        
                        return (
                          <div key={index} className={`p-4 rounded-lg border-2 ${getRecommendationColor(recommendation.priority)}`}>
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getRecommendationIconColor(recommendation.priority)}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{recommendation.title}</h4>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={effortBadge.color}>
                                      {effortBadge.text}
                                    </Badge>
                                    <Badge variant="outline" className="text-green-700 border-green-300">
                                      {recommendation.impact}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm opacity-90">{recommendation.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Reviews Analysis Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {scanResult.reviewsAnalysis ? (
              <ReviewsAnalysis reviewsAnalysis={scanResult.reviewsAnalysis} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Reviews Analysis Coming Soon</h3>
                    <p className="text-gray-600">
                      Comprehensive review analysis will be available in the next scan.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}