import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, TrendingDown, Minus, MessageSquare, Clock } from "lucide-react";

interface ReviewsAnalysisProps {
  reviewsAnalysis: {
    overallScore: number;
    totalReviews: number;
    averageRating: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    reviewSources: Array<{
      platform: string;
      count: number;
      averageRating: number;
    }>;
    keyThemes: Array<{
      theme: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      mentions: number;
      examples: string[];
    }>;
    recentReviews: Array<{
      author: string;
      rating: number;
      text: string;
      platform: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      date: string;
    }>;
    trends: {
      ratingTrend: 'improving' | 'stable' | 'declining';
      volumeTrend: 'increasing' | 'stable' | 'decreasing';
      responseRate: number;
      averageResponseTime: string;
    };
    recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      impact: string;
    }>;
  };
}

export default function ReviewsAnalysis({ reviewsAnalysis }: ReviewsAnalysisProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500';
      case 'neutral': return 'bg-yellow-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Reviews Analysis</h2>
        <p className="text-gray-600">Comprehensive analysis of customer feedback and sentiment</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{reviewsAnalysis.overallScore}</div>
              <div className="text-sm text-gray-500">Overall Score</div>
              <div className="flex justify-center mt-2">
                {renderStars(Math.round(reviewsAnalysis.averageRating))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{reviewsAnalysis.totalReviews}</div>
              <div className="text-sm text-gray-500">Total Reviews</div>
              <div className="flex justify-center mt-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{reviewsAnalysis.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Average Rating</div>
              <div className="flex justify-center mt-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{reviewsAnalysis.trends.responseRate}%</div>
              <div className="text-sm text-gray-500">Response Rate</div>
              <div className="flex justify-center mt-2">
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Positive</span>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={reviewsAnalysis.sentimentBreakdown.positive} 
                  className="w-24 h-2"
                />
                <span className="text-sm text-gray-600">{reviewsAnalysis.sentimentBreakdown.positive}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Neutral</span>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={reviewsAnalysis.sentimentBreakdown.neutral} 
                  className="w-24 h-2"
                />
                <span className="text-sm text-gray-600">{reviewsAnalysis.sentimentBreakdown.neutral}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Negative</span>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={reviewsAnalysis.sentimentBreakdown.negative} 
                  className="w-24 h-2"
                />
                <span className="text-sm text-gray-600">{reviewsAnalysis.sentimentBreakdown.negative}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Review Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsAnalysis.reviewSources.map((source, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{source.platform}</span>
                  <div className="flex items-center space-x-1">
                    {renderStars(Math.round(source.averageRating))}
                    <span className="text-sm text-gray-600">({source.averageRating.toFixed(1)})</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">{source.count} reviews</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Key Themes in Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsAnalysis.keyThemes.map((theme, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{theme.theme}</span>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getSentimentColor(theme.sentiment)} text-white`}>
                      {theme.sentiment}
                    </Badge>
                    <span className="text-sm text-gray-600">{theme.mentions} mentions</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {theme.examples.slice(0, 1).map((example, i) => (
                    <p key={i}>"{example}"</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Review Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rating Trend</span>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(reviewsAnalysis.trends.ratingTrend)}
                  <span className="text-sm capitalize">{reviewsAnalysis.trends.ratingTrend}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volume Trend</span>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(reviewsAnalysis.trends.volumeTrend)}
                  <span className="text-sm capitalize">{reviewsAnalysis.trends.volumeTrend}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm">{reviewsAnalysis.trends.responseRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                <span className="text-sm">{reviewsAnalysis.trends.averageResponseTime}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewsAnalysis.recentReviews.slice(0, 5).map((review, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{review.author}</span>
                    <Badge variant="outline">{review.platform}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <Badge className={`${getSentimentColor(review.sentiment)} text-white`}>
                      {review.sentiment}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{review.text}</p>
                <div className="text-xs text-gray-400">
                  {new Date(review.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Review Management Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewsAnalysis.recommendations.map((recommendation, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{recommendation.title}</span>
                  <Badge className={getPriorityColor(recommendation.priority)}>
                    {recommendation.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Impact:</span> {recommendation.impact}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}