import { motion } from "framer-motion";
import { useState, useMemo } from 'react';
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
  Sparkles,
  PieChart,
  Monitor,
  TrendingRight,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Cell, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar, Pie } from 'recharts';
import ScoreGauge from "./score-gauge";
import GoogleReviewsDisplay from './google-reviews-display';
import SocialMediaDisplay from './social-media-display';
import { TrafficLightScorecard } from './traffic-light-scorecard';
import { ScanResult } from "@shared/schema";

interface EnhancedResultsDashboardProps {
  scanResult: ScanResult;
  restaurantName: string;
}

function EnhancedResultsDashboard({ scanResult, restaurantName }: EnhancedResultsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("health");
  const [sortColumn, setSortColumn] = useState<string>('searchVolume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Color schemes
  const COLORS = {
    primary: '#0066CC',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6'
  };

  const INTENT_COLORS = ['#0066CC', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Helper function to calculate opportunity score
  const calculateOpportunityScore = (searchVolume: number, difficulty: number): number => {
    if (difficulty === 0) return 0;
    return Math.round((searchVolume / difficulty) * 100);
  };

  // Process keyword data for visualizations
  const keywordData = useMemo(() => {
    // Try multiple possible keyword sources
    const keywords = scanResult.keywordAnalysis?.targetKeywords || 
                     scanResult.keywords || 
                     [];
    
    console.log('Frontend processing keywords:', keywords);
    console.log('SERP features from backend:', scanResult.serpFeatures);
    console.log('Ranking positions:', scanResult.keywordAnalysis?.rankingPositions);
    
    return keywords.map((keyword: any) => {
      // Handle potential DataForSEO API response objects
      let keywordString = '';
      let searchVolume = 0;
      let difficulty = 0;
      let intent = 'informational';
      let cpc = 0;
      let competition = 0;
      let position = null;
      
      if (typeof keyword === 'string') {
        keywordString = keyword;
      } else if (keyword && typeof keyword === 'object') {
        // Extract from various possible structures
        keywordString = keyword.keyword || keyword.seed_keyword || keyword.target || String(keyword).replace(/[^a-zA-Z0-9\s]/g, '');
        searchVolume = keyword.searchVolume || keyword.search_volume || 0;
        difficulty = keyword.difficulty || keyword.keyword_difficulty || 0;
        intent = keyword.intent || keyword.search_intent || 'informational';
        cpc = keyword.cpc || keyword.cost_per_click || 0;
        competition = keyword.competition || keyword.competition_level || 0;
        position = keyword.position || keyword.rank || null;
      }
      
      const opportunity = calculateOpportunityScore(searchVolume, difficulty);
      console.log(`Frontend keyword "${keywordString}": volume=${searchVolume}, difficulty=${difficulty}, opportunity=${opportunity}`);
      
      return {
        keyword: keywordString,
        searchVolume,
        difficulty,
        intent,
        cpc,
        competition,
        position,
        opportunity
      };
    }).filter(k => k.keyword && k.keyword.length > 0); // Filter out empty keywords
  }, [scanResult.keywordAnalysis?.targetKeywords, scanResult.keywords]);

  const sortedKeywords = useMemo(() => {
    return [...keywordData].sort((a, b) => {
      const aVal = a[sortColumn as keyof typeof a] || 0;
      const bVal = b[sortColumn as keyof typeof b] || 0;
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [keywordData, sortColumn, sortDirection]);

  // Intent distribution data
  const intentData = useMemo(() => {
    const intentCounts = keywordData.reduce((acc: any, keyword: any) => {
      acc[keyword.intent] = (acc[keyword.intent] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(intentCounts).map(([intent, count]) => ({
      name: intent,
      value: count,
      percentage: Math.round((count as number / keywordData.length) * 100)
    }));
  }, [keywordData]);

  // Competitor data processing
  const competitorData = useMemo(() => {
    const competitors = scanResult.competitors || [];
    return competitors.slice(0, 5).map((comp: any) => ({
      name: comp.name || 'Unknown',
      domain: comp.domain || 'unknown.com',
      traffic: comp.traffic || 0,
      keywords: comp.keywords || 0,
      domainAuthority: comp.domainAuthority || 0,
      backlinks: comp.backlinks || 0,
      trafficAdvantage: comp.trafficAdvantage || 'Similar traffic',
      keywordLead: comp.keywordLead || 'Similar keywords',
      authorityGap: comp.authorityGap || 0,
      overallScore: comp.overallScore || 0,
      isYou: comp.isYou || false
    }));
  }, [scanResult.competitors]);

  // Local SEO metrics
  const localSeoMetrics = useMemo(() => {
    const businessProfile = scanResult.businessProfile || {};
    return {
      completeness: calculateProfileCompleteness(businessProfile),
      rating: businessProfile.rating || 0,
      reviews: businessProfile.totalReviews || 0,
      photos: businessProfile.photos?.total || 0,
      verified: businessProfile.isVerified || false,
      responseRate: businessProfile.responseRate || 0
    };
  }, [scanResult.businessProfile]);

  function calculateProfileCompleteness(profile: any): number {
    const fields = ['name', 'address', 'phone', 'website', 'hours', 'description'];
    const completed = fields.filter(field => profile[field]).length;
    return Math.round((completed / fields.length) * 100);
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  }

  function getIntentIcon(intent: string) {
    switch (intent?.toLowerCase()) {
      case 'navigational': return Navigation;
      case 'informational': return Info;
      case 'transactional': return ShoppingCart;
      case 'local': return MapPin;
      default: return Target;
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-gray-900">{restaurantName} SEO Intelligence</h1>
          <p className="text-lg text-gray-600">Comprehensive analysis powered by DataForSEO & Google APIs</p>
          
          {/* Overall Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{scanResult.performance || 0}</div>
                <div className="text-sm text-gray-600">Performance</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{scanResult.seo || 0}</div>
                <div className="text-sm text-gray-600">SEO Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{scanResult.mobile || 0}</div>
                <div className="text-sm text-gray-600">Mobile</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{scanResult.overallScore || 0}</div>
                <div className="text-sm text-gray-600">Overall</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Competitors
            </TabsTrigger>
            <TabsTrigger value="serp" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              SERP
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Local SEO
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ROI Impact
            </TabsTrigger>
          </TabsList>

          {/* 0. Traffic Light Health Scorecard */}
          <TabsContent value="health" className="space-y-6">
            <TrafficLightScorecard scanResult={scanResult} />
          </TabsContent>

          {/* 1. Keyword Opportunity Dashboard */}
          <TabsContent value="keywords" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Interactive Keyword Table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Keyword Opportunities ({keywordData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('keyword')}>
                            Keyword
                            {sortColumn === 'keyword' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4 inline ml-1" /> : <SortDesc className="w-4 h-4 inline ml-1" />)}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('searchVolume')}>
                            Volume
                            {sortColumn === 'searchVolume' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4 inline ml-1" /> : <SortDesc className="w-4 h-4 inline ml-1" />)}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('difficulty')}>
                            Difficulty
                            {sortColumn === 'difficulty' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4 inline ml-1" /> : <SortDesc className="w-4 h-4 inline ml-1" />)}
                          </TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('opportunity')}>
                            Opportunity
                            {sortColumn === 'opportunity' && (sortDirection === 'asc' ? <SortAsc className="w-4 h-4 inline ml-1" /> : <SortDesc className="w-4 h-4 inline ml-1" />)}
                          </TableHead>
                          <TableHead>Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedKeywords.slice(0, 10).map((keyword, index) => {
                          const IntentIcon = getIntentIcon(keyword.intent);
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{keyword.keyword}</TableCell>
                              <TableCell>{keyword.searchVolume.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={keyword.difficulty > 70 ? 'destructive' : keyword.difficulty > 40 ? 'secondary' : 'default'}>
                                  {keyword.difficulty}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  <IntentIcon className="w-3 h-3" />
                                  {keyword.intent}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-gray-200 rounded">
                                    <div 
                                      className="h-2 bg-blue-500 rounded" 
                                      style={{ width: `${Math.min(keyword.opportunity, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm">{keyword.opportunity}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {keyword.position ? (
                                  <Badge variant={keyword.position <= 3 ? 'default' : keyword.position <= 10 ? 'secondary' : 'destructive'}>
                                    #{keyword.position}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">Not ranking</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Search Intent Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Search Intent Split
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={intentData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                      >
                        {intentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={INTENT_COLORS[index % INTENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* 2. Competitive Intelligence Hub */}
          <TabsContent value="competitors" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Competitor Comparison Table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Competitive Intelligence Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Competitor</TableHead>
                          <TableHead>Domain Authority</TableHead>
                          <TableHead>Traffic</TableHead>
                          <TableHead>Keywords</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Opportunity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {competitorData.map((competitor, index) => (
                          <TableRow key={index} className={competitor.isYou ? 'bg-blue-50' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {competitor.isYou && <Star className="w-4 h-4 text-yellow-500" />}
                                <div>
                                  <div className="font-medium">{competitor.name}</div>
                                  <div className="text-sm text-gray-500">{competitor.domain}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={competitor.domainAuthority > 50 ? 'default' : 'secondary'}>
                                {competitor.domainAuthority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {competitor.traffic > 1000 ? `${Math.round(competitor.traffic / 1000)}k` : competitor.traffic}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {competitor.keywords > 1000 ? `${Math.round(competitor.keywords / 1000)}k` : competitor.keywords}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-16 h-2 bg-gray-200 rounded">
                                <div 
                                  className="h-2 bg-green-500 rounded" 
                                  style={{ width: `${competitor.overallScore}%` }}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-gray-600">
                                {competitor.trafficAdvantage}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Gap Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Competitive Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {competitorData.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900 mb-1">Competitive Gap Analysis</h4>
                          <p className="text-red-700 text-sm">
                            Your competitors are significantly outperforming you in organic search. 
                            The average competitor has {Math.round(competitorData.reduce((sum, c) => sum + c.traffic, 0) / competitorData.length / 100)}x 
                            more traffic and stronger domain authority. Focus on content creation, link building, and local SEO optimization.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* 3. SERP Landscape Map */}
          <TabsContent value="serp" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* SERP Features Presence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    SERP Features Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(scanResult.serpFeatures && scanResult.serpFeatures.length > 0) ? (
                      scanResult.serpFeatures.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{feature}</span>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No SERP features detected</p>
                        <p className="text-sm">Your website may not appear in enhanced search results</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ranking Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Ranking Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {keywordData.filter(k => k.position === null || k.position > 10).slice(0, 5).map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <div className="font-medium">{keyword.keyword}</div>
                          <div className="text-sm text-gray-600">
                            Volume: {keyword.searchVolume.toLocaleString()} | Difficulty: {keyword.difficulty}%
                          </div>
                        </div>
                        <Badge variant={keyword.difficulty > 50 ? 'destructive' : 'secondary'}>
                          {keyword.position ? `Position #${keyword.position}` : 'Not ranking'}
                        </Badge>
                      </div>
                    ))}
                    {keywordData.filter(k => k.position === null || k.position > 10).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>All keywords are ranking well</p>
                        <p className="text-sm">Great job! Focus on maintaining current positions</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* 4. Local SEO Command Center */}
          <TabsContent value="local" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Business Profile Completeness */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Business Profile Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Profile Completeness</span>
                      <Badge variant={localSeoMetrics.completeness > 80 ? 'default' : 'secondary'}>
                        {localSeoMetrics.completeness}%
                      </Badge>
                    </div>
                    <Progress value={localSeoMetrics.completeness} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{localSeoMetrics.rating}/5</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reviews</span>
                        <span>{localSeoMetrics.reviews}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Photos</span>
                        <span>{localSeoMetrics.photos}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Verified</span>
                        <Badge variant={localSeoMetrics.verified ? 'default' : 'destructive'}>
                          {localSeoMetrics.verified ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Sentiment Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Review Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanResult.reviewsAnalysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Overall Score</span>
                        <Badge variant="default">{scanResult.reviewsAnalysis.overallScore}/100</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600">Positive</span>
                          <span>{scanResult.reviewsAnalysis.sentimentBreakdown?.positive || 0}%</span>
                        </div>
                        <Progress value={scanResult.reviewsAnalysis.sentimentBreakdown?.positive || 0} className="h-2" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-yellow-600">Neutral</span>
                          <span>{scanResult.reviewsAnalysis.sentimentBreakdown?.neutral || 0}%</span>
                        </div>
                        <Progress value={scanResult.reviewsAnalysis.sentimentBreakdown?.neutral || 0} className="h-2" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-red-600">Negative</span>
                          <span>{scanResult.reviewsAnalysis.sentimentBreakdown?.negative || 0}%</span>
                        </div>
                        <Progress value={scanResult.reviewsAnalysis.sentimentBreakdown?.negative || 0} className="h-2" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Review analysis unavailable</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Google Reviews Display */}
            {scanResult.reviewsAnalysis?.googleReviews && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GoogleReviewsDisplay 
                  reviews={scanResult.reviewsAnalysis.googleReviews.reviews || []}
                  rating={scanResult.reviewsAnalysis.googleReviews.rating || 0}
                  totalReviews={scanResult.reviewsAnalysis.googleReviews.user_ratings_total || 0}
                />
              </motion.div>
            )}

            {/* Social Media Display */}
            {scanResult.socialMediaLinks && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SocialMediaDisplay socialMediaLinks={scanResult.socialMediaLinks} />
              </motion.div>
            )}
          </TabsContent>

          {/* 5. Google Business Profile Analysis */}
          <TabsContent value="profile" className="space-y-6">
            {scanResult.profileAnalysis ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Profile Completeness Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Profile Completeness
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Completeness Score</span>
                        <Badge variant={scanResult.profileAnalysis.completeness.score > 80 ? 'default' : 'secondary'}>
                          {scanResult.profileAnalysis.completeness.score}%
                        </Badge>
                      </div>
                      <Progress value={scanResult.profileAnalysis.completeness.score} className="h-3" />
                      
                      {scanResult.profileAnalysis.completeness.missingElements.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Missing Elements:</h4>
                          <div className="flex flex-wrap gap-2">
                            {scanResult.profileAnalysis.completeness.missingElements.map((element: string) => (
                              <Badge key={element} variant="outline" className="text-xs">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Optimization Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Optimization Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Optimization Score</span>
                        <Badge variant={scanResult.profileAnalysis.optimization.score > 80 ? 'default' : 'secondary'}>
                          {scanResult.profileAnalysis.optimization.score}%
                        </Badge>
                      </div>
                      <Progress value={scanResult.profileAnalysis.optimization.score} className="h-3" />
                      
                      {scanResult.profileAnalysis.optimization.issues.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Issues:</h4>
                          <div className="space-y-1">
                            {scanResult.profileAnalysis.optimization.issues.map((issue: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                {issue}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Competitive Score Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Competitive Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Market Position</span>
                        <Badge variant={scanResult.profileAnalysis.competitiveness > 80 ? 'default' : 'secondary'}>
                          {scanResult.profileAnalysis.competitiveness}%
                        </Badge>
                      </div>
                      <Progress value={scanResult.profileAnalysis.competitiveness} className="h-3" />
                      
                      <div className="text-sm text-gray-600">
                        Based on rating, reviews, photos, and verification status
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scanResult.profileAnalysis.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Profile Analysis Unavailable</h3>
                <p className="text-gray-600">Google Business Profile analysis requires valid Google Places API configuration</p>
              </div>
            )}

            {/* Strengths and Weaknesses */}
            {scanResult.profileAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Profile Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {scanResult.profileAnalysis.strengths.map((strength: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {strength}
                        </div>
                      ))}
                      {scanResult.profileAnalysis.strengths.length === 0 && (
                        <div className="text-gray-500 text-sm">No major strengths identified</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Weaknesses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {scanResult.profileAnalysis.weaknesses.map((weakness: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-500" />
                          {weakness}
                        </div>
                      ))}
                      {scanResult.profileAnalysis.weaknesses.length === 0 && (
                        <div className="text-gray-500 text-sm">No major weaknesses identified</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* 6. ROI Impact Calculator */}
          <TabsContent value="roi" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Opportunity Scoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Quick Win Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {keywordData
                      .filter(keyword => keyword.searchVolume > 0 && keyword.difficulty < 40)
                      .slice(0, 6)
                      .map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-medium">{keyword.keyword}</div>
                            <div className="text-sm text-gray-600">
                              {keyword.searchVolume.toLocaleString()} searches, {keyword.difficulty}% difficulty
                            </div>
                          </div>
                          <Badge variant="default">
                            Score: {keyword.opportunity}
                          </Badge>
                        </div>
                      ))}
                    {keywordData.filter(keyword => keyword.searchVolume > 0 && keyword.difficulty < 40).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Focus on building keyword foundations</p>
                        <p className="text-sm">Start with local and branded terms</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Traffic Potential */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Traffic Potential
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round(keywordData.reduce((sum, k) => sum + k.searchVolume, 0) / 10)}
                      </div>
                      <div className="text-sm text-gray-600">Monthly Traffic Potential</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">High-opportunity keywords</span>
                        <Badge variant="default">
                          {keywordData.filter(k => k.opportunity > 50).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Local search potential</span>
                        <Badge variant="secondary">
                          {keywordData.filter(k => k.intent === 'local').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Commercial keywords</span>
                        <Badge variant="secondary">
                          {keywordData.filter(k => k.intent === 'transactional').length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EnhancedResultsDashboard;