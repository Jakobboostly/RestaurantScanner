import { motion } from "framer-motion";
import { AlertTriangle, EyeOff, Smartphone, Zap, Search, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const getIssueIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return Zap;
      case 'seo':
        return Search;
      case 'mobile':
        return Smartphone;
      case 'features':
        return EyeOff;
      default:
        return AlertTriangle;
    }
  };

  const getIssueColorClass = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getIssueIconColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getIssueTextColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      default:
        return 'text-blue-900';
    }
  };

  const getIssueDescriptionColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-blue-700';
    }
  };

  const getIssueImpactColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Restaurant Website Analysis
            </h2>
            <p className="text-gray-600">
              Here's what we found about {restaurantName}'s online presence
            </p>
          </div>

          {/* Overall Score */}
          <Card className="mb-8" style={{ backgroundColor: '#F6F3FE' }}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Overall Score</h3>
                  <p className="text-gray-600">
                    Based on performance, SEO, and customer experience
                  </p>
                </div>
                <div className="text-center">
                  <ScoreGauge score={scanResult.overallScore} size="large" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Performance</h3>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {scanResult.performanceScore}
                </div>
                <p className={`text-sm ${getScoreColor(scanResult.performanceScore)}`}>
                  {scanResult.performanceScore < 50 ? 'Critical - Site loads slowly' : 
                   scanResult.performanceScore < 70 ? 'Needs improvement' : 'Good performance'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">SEO</h3>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {scanResult.seoScore}
                </div>
                <p className={`text-sm ${getScoreColor(scanResult.seoScore)}`}>
                  {scanResult.seoScore < 50 ? 'Critical - Poor SEO' : 
                   scanResult.seoScore < 70 ? 'Needs optimization' : 'Good SEO'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Mobile</h3>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {scanResult.mobileScore}
                </div>
                <p className={`text-sm ${getScoreColor(scanResult.mobileScore)}`}>
                  {scanResult.mobileScore < 50 ? 'Poor - Mobile issues' : 
                   scanResult.mobileScore < 70 ? 'Needs mobile optimization' : 'Mobile-friendly'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">User Experience</h3>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {scanResult.userExperienceScore}
                </div>
                <p className={`text-sm ${getScoreColor(scanResult.userExperienceScore)}`}>
                  {scanResult.userExperienceScore < 50 ? 'Poor UX' : 
                   scanResult.userExperienceScore < 70 ? 'Good UX' : 'Excellent UX'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Issues */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Issues Found</h3>
              <div className="space-y-4">
                {scanResult.issues.map((issue, index) => {
                  const Icon = getIssueIcon(issue.category);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-start space-x-4 p-4 rounded-lg border ${getIssueColorClass(issue.type)}`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getIssueIconColor(issue.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <h4 className={`font-medium ${getIssueTextColor(issue.type)}`}>
                          {issue.title}
                        </h4>
                        <p className={`text-sm mt-1 ${getIssueDescriptionColor(issue.type)}`}>
                          {issue.description}
                        </p>
                        <p className={`text-sm font-medium mt-2 ${getIssueImpactColor(issue.type)}`}>
                          Impact: {issue.impact}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Competitor Analysis */}
          {scanResult.competitorData && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  How You Compare to Local Competitors
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Restaurant</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Overall Score</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Performance</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">SEO</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Mobile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.competitorData.map((competitor, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {competitor.isYou && (
                                <div className="w-2 h-2 bg-[#28008F] rounded-full"></div>
                              )}
                              <span className={competitor.isYou ? 'font-medium' : ''}>
                                {competitor.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getScoreBadgeColor(competitor.score)}>
                              {competitor.score}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getScoreBadgeColor(competitor.isYou ? scanResult.performanceScore : competitor.score - 5)}>
                              {competitor.isYou ? scanResult.performanceScore : competitor.score - 5}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getScoreBadgeColor(competitor.isYou ? scanResult.seoScore : competitor.score + 2)}>
                              {competitor.isYou ? scanResult.seoScore : competitor.score + 2}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getScoreBadgeColor(competitor.isYou ? scanResult.mobileScore : competitor.score - 3)}>
                              {competitor.isYou ? scanResult.mobileScore : competitor.score - 3}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Website Screenshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Desktop View</h3>
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                  alt="Website analytics dashboard showing performance metrics"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mobile View</h3>
                <img
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"
                  alt="Mobile phone displaying restaurant website interface"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card style={{ backgroundColor: '#F6F3FE' }}>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Priority Recommendations</h3>
              <div className="space-y-4">
                {scanResult.recommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#28008F] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                      <p className="text-sm text-green-600 mt-2">
                        ⚡ Potential impact: {recommendation.impact}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
