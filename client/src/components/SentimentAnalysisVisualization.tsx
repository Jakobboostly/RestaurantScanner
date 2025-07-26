import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  BarChart3,
  PieChart,
  TrendingUp,
  ThumbsUp,
  Target,
  Star
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie } from 'recharts';

interface SentimentAnalysisProps {
  moodAnalysis: any;
  scanResult: any;
}

export function SentimentAnalysisVisualization({ moodAnalysis, scanResult }: SentimentAnalysisProps) {
  if (!moodAnalysis) return null;

  // Calculate total review count for context
  const totalReviews = moodAnalysis.detailedMetrics?.totalReviews || scanResult.reviewsAnalysis?.reviewsFound || 0;

  // Prepare sentiment distribution data for pie chart (already in percentages from backend)
  const sentimentData = moodAnalysis.sentimentDistribution ? [
    { name: 'Ecstatic', value: moodAnalysis.sentimentDistribution.ecstatic, color: '#10B981', icon: '🤩' },
    { name: 'Delighted', value: moodAnalysis.sentimentDistribution.delighted, color: '#22C55E', icon: '😍' },
    { name: 'Satisfied', value: moodAnalysis.sentimentDistribution.satisfied, color: '#3B82F6', icon: '😊' },
    { name: 'Neutral', value: moodAnalysis.sentimentDistribution.neutral, color: '#64748B', icon: '😐' },
    { name: 'Frustrated', value: moodAnalysis.sentimentDistribution.frustrated, color: '#F59E0B', icon: '😤' },
    { name: 'Disappointed', value: moodAnalysis.sentimentDistribution.disappointed, color: '#EF4444', icon: '😞' },
    { name: 'Angry', value: moodAnalysis.sentimentDistribution.angry, color: '#DC2626', icon: '😡' }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Overall Sentiment */}
      <motion.div 
        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">AI Customer Sentiment Analysis</h4>
            <p className="text-sm text-gray-600">
              Based on {totalReviews} customer reviews • Results shown as percentages
            </p>
          </div>
        </div>
        
        {/* Overall Sentiment Summary */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${
              moodAnalysis.overallMood === 'delighted' ? 'bg-green-100 text-green-800' :
              moodAnalysis.overallMood === 'satisfied' ? 'bg-blue-100 text-blue-800' :
              moodAnalysis.overallMood === 'mixed' ? 'bg-yellow-100 text-yellow-800' :
              moodAnalysis.overallMood === 'frustrated' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            } capitalize text-sm font-medium`}>
              Overall Mood: {moodAnalysis.overallMood}
            </Badge>
            {moodAnalysis.detailedMetrics?.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{moodAnalysis.detailedMetrics.averageRating}/5</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">{moodAnalysis.sentimentSummary}</p>
        </div>
      </motion.div>

      {/* Sentiment Distribution Visualization */}
      {sentimentData.length > 0 && (
        <motion.div 
          className="bg-white rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-600" />
            <h5 className="font-semibold text-gray-800">Sentiment Distribution</h5>
            <span className="text-xs text-gray-500 ml-2">(% of {totalReviews} reviews)</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    data={sentimentData}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Sentiment Breakdown */}
            <div className="space-y-3">
              {sentimentData.map((sentiment) => (
                <motion.div 
                  key={sentiment.name} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{sentiment.icon}</span>
                    <span className="font-medium text-gray-700">{sentiment.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <motion.div 
                        className="h-2 rounded-full" 
                        style={{ backgroundColor: sentiment.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${sentiment.value}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8">{sentiment.value}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}



      {/* Business Insights Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            <h5 className="font-semibold text-green-800">Where customers love you</h5>
          </div>
          <ul className="space-y-2">
            {(moodAnalysis.businessInsights?.strengthsPerceived || []).map((strength: string, index: number) => (
              <motion.li 
                key={index} 
                className="text-sm text-green-700 flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <span className="text-green-500 mt-1 font-bold">✓</span>
                {strength}
              </motion.li>
            ))}
          </ul>
        </div>
        
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-orange-600" />
            <h5 className="font-semibold text-orange-800">Where your customers want you to improve</h5>
          </div>
          <ul className="space-y-2">
            {(moodAnalysis.businessInsights?.improvementOpportunities || []).map((opportunity: string, index: number) => (
              <motion.li 
                key={index} 
                className="text-sm text-orange-700 flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <span className="text-orange-500 mt-1 font-bold">→</span>
                {opportunity}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Sentiment Trends */}
      {moodAnalysis.detailedMetrics?.sentimentTrends && (
        <motion.div 
          className="bg-white rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h5 className="font-semibold text-gray-800">Sentiment Trends</h5>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              className="text-center p-4 bg-gray-50 rounded-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-gray-800">
                {moodAnalysis.detailedMetrics.sentimentTrends.trend === 'improving' ? '📈' :
                 moodAnalysis.detailedMetrics.sentimentTrends.trend === 'declining' ? '📉' : '➡️'}
              </div>
              <div className="text-sm font-medium text-gray-600 mt-2">Trend</div>
              <div className="text-lg font-semibold text-gray-800 capitalize">
                {moodAnalysis.detailedMetrics.sentimentTrends.trend}
              </div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 bg-gray-50 rounded-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-blue-600">
                {moodAnalysis.detailedMetrics.sentimentTrends.recentAverageRating}
              </div>
              <div className="text-sm font-medium text-gray-600 mt-2">Recent Rating</div>
              <div className="text-xs text-gray-500">
                Last {moodAnalysis.detailedMetrics.sentimentTrends.recentReviewsCount} reviews
              </div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 bg-gray-50 rounded-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-gray-600">
                {moodAnalysis.detailedMetrics.sentimentTrends.previousAverageRating}
              </div>
              <div className="text-sm font-medium text-gray-600 mt-2">Previous Rating</div>
              <div className="text-xs text-gray-500">Historical average</div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Emotional Breakdown */}
      {moodAnalysis.emotionalBreakdown && Object.keys(moodAnalysis.emotionalBreakdown).length > 0 && (
        <motion.div 
          className="bg-white rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h5 className="font-semibold text-gray-800">Emotional Breakdown</h5>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(moodAnalysis.emotionalBreakdown).map(([emotion, count]: [string, any], index) => (
              <motion.div 
                key={emotion}
                className="text-center p-4 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl font-bold text-purple-600">{count}</div>
                <div className="text-sm font-medium text-gray-600 mt-2 capitalize">{emotion}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}