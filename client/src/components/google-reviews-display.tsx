import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Clock, MessageCircle } from "lucide-react";

interface GoogleReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  key_phrases: string[];
}

interface GoogleReviewsProps {
  reviews: GoogleReview[];
  rating: number;
  totalReviews: number;
}

const GoogleReviewsDisplay: React.FC<GoogleReviewsProps> = ({ reviews, rating, totalReviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Google Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No reviews available</p>
        </CardContent>
      </Card>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Google Reviews
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            {renderStars(Math.round(rating))}
            <span className="font-medium ml-1">{rating.toFixed(1)}</span>
          </div>
          <span>•</span>
          <span>{totalReviews.toLocaleString()} reviews</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {review.profile_photo_url ? (
                    <img 
                      src={review.profile_photo_url} 
                      alt={review.author_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">{review.author_name}</h4>
                    <Badge className={`text-xs px-2 py-1 ${getSentimentColor(review.sentiment)}`}>
                      {getSentimentIcon(review.sentiment)} {review.sentiment}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {review.relative_time_description}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    {review.text}
                  </p>
                  
                  {review.key_phrases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {review.key_phrases.map((phrase, phraseIndex) => (
                        <Badge key={phraseIndex} variant="outline" className="text-xs">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-500 text-center">
            Showing {reviews.length} of {totalReviews} reviews from Google
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleReviewsDisplay;