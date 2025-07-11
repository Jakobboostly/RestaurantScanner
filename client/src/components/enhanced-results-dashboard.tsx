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
import { ScanResult } from "@shared/schema";

interface EnhancedResultsDashboardProps {
  scanResult: ScanResult;
  restaurantName: string;
}

function EnhancedResultsDashboard({ scanResult, restaurantName }: EnhancedResultsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("keywords");
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

  // Technical issues processing
  const technicalIssues = useMemo(() => {
    const issues = scanResult.issues || [];
    const categorized = {
      critical: issues.filter((issue: any) => issue.severity === 'critical'),
      warning: issues.filter((issue: any) => issue.severity === 'medium' || issue.severity === 'warning'),
      optimization: issues.filter((issue: any) => issue.severity === 'low' || issue.severity === 'info')
    };

    return {
      ...categorized,
      total: issues.length,
      severityData: [
        { name: 'Critical', value: categorized.critical.length, color: COLORS.danger },
        { name: 'Warning', value: categorized.warning.length, color: COLORS.warning },
        { name: 'Optimization', value: categorized.optimization.length, color: COLORS.success }
      ]
    };
  }, [scanResult.issues]);

  // Core Web Vitals data
  const coreWebVitals = useMemo(() => {
    const metrics = scanResult.metrics || {};
    return [
      { name: 'FCP', value: metrics.fcp || 0, benchmark: 1.8, good: (metrics.fcp || 0) <= 1.8 },
      { name: 'LCP', value: metrics.lcp || 0, benchmark: 2.5, good: (metrics.lcp || 0) <= 2.5 },
      { name: 'CLS', value: metrics.cls || 0, benchmark: 0.1, good: (metrics.cls || 0) <= 0.1 },
      { name: 'FID', value: metrics.fid || 0, benchmark: 100, good: (metrics.fid || 0) <= 100 }
    ];
  }, [scanResult.metrics]);

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
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="technical" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Technical
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Local SEO
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ROI Impact
            </TabsTrigger>
          </TabsList>

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

            {/* Keyword Gap Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Keyword Gap Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scanResult.competitorIntelligence?.keywordGaps?.slice(0, 5).map((gap: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{gap}</span>
                      </div>
                      <Badge variant="destructive">Competitors rank, you don't</Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No keyword gaps detected or competitor data unavailable</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Competitive Intelligence Hub */}
          <TabsContent value="competitors" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Traffic Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Traffic Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={competitorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="domain" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Traffic']} />
                      <Bar dataKey="traffic" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Domain Authority Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Domain Authority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={competitorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="domain" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="domainAuthority" fill={COLORS.success} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Competitor Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>How Your Competitors Are Outperforming You</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competitor</TableHead>
                      <TableHead>Traffic Advantage</TableHead>
                      <TableHead>Keyword Lead</TableHead>
                      <TableHead>Authority Gap</TableHead>
                      <TableHead>Performance Summary</TableHead>
                      <TableHead>Key Advantage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitorData.map((competitor, index) => {
                      const yourTraffic = scanResult.estimatedTraffic || 100;
                      const yourKeywords = keywordData.length || 10;
                      const yourAuthority = scanResult.domainAuthority || 20;
                      
                      const trafficMultiplier = Math.round(competitor.traffic / yourTraffic);
                      const keywordLead = competitor.keywords - yourKeywords;
                      const authorityGap = competitor.domainAuthority - yourAuthority;
                      
                      const keyAdvantage = (() => {
                        if (trafficMultiplier > 10) return 'Massive SEO presence';
                        if (competitor.domainAuthority > 70) return 'Strong domain authority';
                        if (competitor.keywords > 1000) return 'Broad keyword coverage';
                        if (competitor.backlinks > 500) return 'Link building success';
                        return 'Better optimization';
                      })();
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{competitor.domain}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ArrowUp className="w-4 h-4 text-red-500" />
                              <span className="text-red-600 font-semibold">
                                {trafficMultiplier}x more traffic
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {keywordLead > 0 ? (
                                <>
                                  <ArrowUp className="w-4 h-4 text-red-500" />
                                  <span className="text-red-600">+{keywordLead.toLocaleString()} keywords</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600">You lead by {Math.abs(keywordLead)}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {authorityGap > 0 ? (
                                <>
                                  <ArrowUp className="w-4 h-4 text-red-500" />
                                  <span className="text-red-600">+{authorityGap} points higher</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600">You lead by {Math.abs(authorityGap)}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={trafficMultiplier > 5 ? 'destructive' : trafficMultiplier > 2 ? 'secondary' : 'default'}>
                              {trafficMultiplier > 5 ? 'Dominating' : trafficMultiplier > 2 ? 'Leading' : 'Competitive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {keyAdvantage}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {competitorData.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
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

            {/* Keyword Position Tracking Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Current Keyword Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={keywordData.filter(k => k.position !== null && k.position > 0).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="keyword" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                    />
                    <YAxis 
                      domain={[0, 50]} 
                      tickFormatter={(value) => `#${value}`}
                      reversed
                    />
                    <Tooltip 
                      formatter={(value) => [`Position #${value}`, 'Ranking']}
                      labelFormatter={(label) => `Keyword: ${label}`}
                    />
                    <Bar dataKey="position" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Technical Health Center */}
          <TabsContent value="technical" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Issue Severity Heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Issue Severity Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={technicalIssues.severityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {technicalIssues.severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center">
                    <div className="text-2xl font-bold">{technicalIssues.total}</div>
                    <div className="text-sm text-gray-600">Total Issues Found</div>
                  </div>
                </CardContent>
              </Card>

              {/* Core Web Vitals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Core Web Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coreWebVitals.map((vital, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{vital.name}</span>
                          <Badge variant={vital.good ? 'default' : 'destructive'}>
                            {vital.good ? 'Good' : 'Needs Work'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${vital.good ? 'text-green-600' : 'text-red-600'}`}>
                            {vital.name === 'CLS' ? vital.value.toFixed(3) : vital.value.toFixed(1)}
                            {vital.name === 'FID' ? 'ms' : vital.name === 'CLS' ? '' : 's'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Target: {vital.name === 'CLS' ? vital.benchmark.toFixed(1) : vital.benchmark}
                            {vital.name === 'FID' ? 'ms' : vital.name === 'CLS' ? '' : 's'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mobile vs Desktop Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Mobile vs Desktop Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <Monitor className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{scanResult.performance || 0}</div>
                    <div className="text-sm text-gray-600">Desktop Score</div>
                  </div>
                  <div className="text-center">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{scanResult.mobile || 0}</div>
                    <div className="text-sm text-gray-600">Mobile Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Local SEO Command Center */}
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
                    <MapPin className="w-5 h-5" />
                    Business Profile Completeness
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
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center">
                        <Star className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                        <div className="font-bold">{localSeoMetrics.rating}/5</div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                      <div className="text-center">
                        <Users className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                        <div className="font-bold">{localSeoMetrics.reviews}</div>
                        <div className="text-xs text-gray-600">Reviews</div>
                      </div>
                      <div className="text-center">
                        <Image className="w-6 h-6 mx-auto mb-1 text-green-500" />
                        <div className="font-bold">{localSeoMetrics.photos}</div>
                        <div className="text-xs text-gray-600">Photos</div>
                      </div>
                      <div className="text-center">
                        <CheckCircle className={`w-6 h-6 mx-auto mb-1 ${localSeoMetrics.verified ? 'text-green-500' : 'text-gray-400'}`} />
                        <div className="font-bold">{localSeoMetrics.verified ? 'Yes' : 'No'}</div>
                        <div className="text-xs text-gray-600">Verified</div>
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

            {/* Local Keyword Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Local Keyword Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {keywordData
                    .filter(keyword => keyword.intent === 'local')
                    .slice(0, 8)
                    .map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{keyword.keyword}</span>
                          <Badge variant="outline">{keyword.searchVolume.toLocaleString()}/mo</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {keyword.position ? (
                            <Badge variant={keyword.position <= 3 ? 'default' : keyword.position <= 10 ? 'secondary' : 'destructive'}>
                              #{keyword.position}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Not ranking</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  {keywordData.filter(keyword => keyword.intent === 'local').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No local keywords found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                      .filter(keyword => keyword.searchVolume > 500 && keyword.difficulty < 40)
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
                    {keywordData.filter(keyword => keyword.searchVolume > 500 && keyword.difficulty < 40).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No quick win opportunities identified</p>
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
                    Traffic Potential Estimator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {keywordData.reduce((sum, keyword) => sum + (keyword.searchVolume * 0.3), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Potential Monthly Visitors</div>
                      <div className="text-xs text-gray-500 mt-1">Estimated at 30% CTR improvement</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-bold text-green-600">
                          ${Math.round(keywordData.reduce((sum, keyword) => sum + (keyword.cpc * keyword.searchVolume * 0.1), 0)).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Est. Ad Value Saved</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="font-bold text-purple-600">
                          {Math.round(keywordData.reduce((sum, keyword) => sum + keyword.searchVolume, 0) / 1000)}K
                        </div>
                        <div className="text-xs text-gray-600">Total Search Volume</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ROI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  ROI-Focused Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(scanResult.recommendations || []).slice(0, 6).map((rec: any, index: number) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium mb-1">{rec.title}</div>
                        <div className="text-sm text-gray-600 mb-2">{rec.description}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.impact === 'high' ? 'default' : rec.impact === 'medium' ? 'secondary' : 'outline'}>
                            {rec.impact} impact
                          </Badge>
                          <Badge variant={rec.effort === 'low' ? 'default' : rec.effort === 'medium' ? 'secondary' : 'outline'}>
                            {rec.effort} effort
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">
                          Priority: {rec.priority || index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!scanResult.recommendations || scanResult.recommendations.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recommendations available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EnhancedResultsDashboard;