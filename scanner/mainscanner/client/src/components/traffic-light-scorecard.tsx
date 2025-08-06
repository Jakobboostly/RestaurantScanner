import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Users, 
  Globe, 
  Smartphone,
  Search,
  MessageSquare,
  Award,
  Target,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface TrafficLightMetric {
  name: string;
  value: number;
  target: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  recommendation?: string;
}

interface TrafficLightScorecardProps {
  scanResult: any;
}

export function TrafficLightScorecard({ scanResult }: TrafficLightScorecardProps) {
  // Calculate marketing health metrics from scan result
  const metrics: TrafficLightMetric[] = [
    {
      name: 'SEO Performance',
      value: scanResult.seo || 0,
      target: 80,
      status: (scanResult.seo || 0) >= 80 ? 'healthy' : (scanResult.seo || 0) >= 60 ? 'warning' : 'critical',
      trend: 'stable',
      icon: Search,
      description: 'Search engine optimization score',
      recommendation: (scanResult.seo || 0) < 80 ? 'Optimize meta tags and content structure' : undefined
    },
    {
      name: 'Mobile Experience',
      value: scanResult.mobile || 0,
      target: 85,
      status: (scanResult.mobile || 0) >= 85 ? 'healthy' : (scanResult.mobile || 0) >= 70 ? 'warning' : 'critical',
      trend: 'stable',
      icon: Smartphone,
      description: 'Mobile user experience quality',
      recommendation: (scanResult.mobile || 0) < 85 ? 'Improve mobile site speed and usability' : undefined
    },
    {
      name: 'Website Performance',
      value: scanResult.performance || 0,
      target: 90,
      status: (scanResult.performance || 0) >= 90 ? 'healthy' : (scanResult.performance || 0) >= 75 ? 'warning' : 'critical',
      trend: 'up',
      icon: Globe,
      description: 'Overall website loading speed',
      recommendation: (scanResult.performance || 0) < 90 ? 'Optimize images and enable caching' : undefined
    },
    {
      name: 'Online Reputation',
      value: Math.round((scanResult.businessProfile?.rating || 0) * 20),
      target: 80,
      status: (scanResult.businessProfile?.rating || 0) >= 4.0 ? 'healthy' : (scanResult.businessProfile?.rating || 0) >= 3.5 ? 'warning' : 'critical',
      trend: 'stable',
      icon: Star,
      description: 'Customer review ratings',
      recommendation: (scanResult.businessProfile?.rating || 0) < 4.0 ? 'Focus on customer service improvements' : undefined
    },
    {
      name: 'Review Volume',
      value: Math.min(100, Math.round((scanResult.businessProfile?.totalReviews || 0) / 10)),
      target: 50,
      status: (scanResult.businessProfile?.totalReviews || 0) >= 50 ? 'healthy' : (scanResult.businessProfile?.totalReviews || 0) >= 20 ? 'warning' : 'critical',
      trend: 'up',
      icon: MessageSquare,
      description: 'Total number of customer reviews',
      recommendation: (scanResult.businessProfile?.totalReviews || 0) < 50 ? 'Encourage more customer reviews' : undefined
    },
    {
      name: 'Local Visibility',
      value: Math.round((scanResult.profileAnalysis?.completeness || 0)),
      target: 90,
      status: (scanResult.profileAnalysis?.completeness || 0) >= 90 ? 'healthy' : (scanResult.profileAnalysis?.completeness || 0) >= 75 ? 'warning' : 'critical',
      trend: 'stable',
      icon: Target,
      description: 'Google Business Profile completeness',
      recommendation: (scanResult.profileAnalysis?.completeness || 0) < 90 ? 'Complete missing business profile fields' : undefined
    },
    {
      name: 'Keyword Rankings',
      value: Math.round(((scanResult.keywords || []).filter((k: any) => k.position && k.position <= 10).length / Math.max((scanResult.keywords || []).length, 1)) * 100),
      target: 30,
      status: ((scanResult.keywords || []).filter((k: any) => k.position && k.position <= 10).length / Math.max((scanResult.keywords || []).length, 1)) >= 0.3 ? 'healthy' : ((scanResult.keywords || []).filter((k: any) => k.position && k.position <= 10).length / Math.max((scanResult.keywords || []).length, 1)) >= 0.15 ? 'warning' : 'critical',
      trend: 'down',
      icon: TrendingUp,
      description: 'Keywords ranking in top 10',
      recommendation: ((scanResult.keywords || []).filter((k: any) => k.position && k.position <= 10).length / Math.max((scanResult.keywords || []).length, 1)) < 0.3 ? 'Improve content for target keywords' : undefined
    },
    {
      name: 'Competitive Position',
      value: scanResult.overallScore || 0,
      target: 75,
      status: (scanResult.overallScore || 0) >= 75 ? 'healthy' : (scanResult.overallScore || 0) >= 60 ? 'warning' : 'critical',
      trend: 'stable',
      icon: Award,
      description: 'Overall competitive strength',
      recommendation: (scanResult.overallScore || 0) < 75 ? 'Focus on top priority improvements' : undefined
    }
  ];

  // Calculate overall health score
  const overallHealth = Math.round(metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length);
  const healthyCount = metrics.filter(m => m.status === 'healthy').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;
  const criticalCount = metrics.filter(m => m.status === 'critical').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Health</p>
                <p className="text-2xl font-bold">{overallHealth}/100</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Healthy</p>
                <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Traffic Light Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {metrics.map((metric, index) => {
          const StatusIcon = getStatusIcon(metric.status);
          const TrendIcon = getTrendIcon(metric.trend);
          const MetricIcon = metric.icon;

          return (
            <Card key={metric.name} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Status Light */}
              <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(metric.status)}`} />
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      metric.status === 'healthy' ? 'bg-green-100' : 
                      metric.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <MetricIcon className={`w-4 h-4 ${
                        metric.status === 'healthy' ? 'text-green-600' : 
                        metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusIcon className={`w-4 h-4 ${
                      metric.status === 'healthy' ? 'text-green-600' : 
                      metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                    {TrendIcon && (
                      <TrendIcon className={`w-3 h-3 ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <Badge variant={metric.status === 'healthy' ? 'default' : 'secondary'}>
                      Target: {metric.target}
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={Math.min(100, (metric.value / metric.target) * 100)} 
                    className="h-2"
                  />
                  
                  <p className="text-xs text-gray-600">{metric.description}</p>
                  
                  {metric.recommendation && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                      <strong>Recommendation:</strong> {metric.recommendation}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Priority Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics
                .filter(m => m.status === 'critical')
                .slice(0, 3)
                .map((metric, index) => (
                  <div key={metric.name} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-800">{metric.name}</p>
                      <p className="text-sm text-red-600">{metric.recommendation}</p>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                ))}
              
              {metrics
                .filter(m => m.status === 'warning')
                .slice(0, 2)
                .map((metric, index) => (
                  <div key={metric.name} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800">{metric.name}</p>
                      <p className="text-sm text-yellow-600">{metric.recommendation}</p>
                    </div>
                    <Badge variant="secondary">Warning</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}