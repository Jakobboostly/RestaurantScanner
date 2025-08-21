import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';

// Utility function to remove markdown bold formatting
const stripMarkdownBold = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};

interface AIMissingIngredientsProps {
  category: 'search' | 'social' | 'reviews' | 'local';
  score: number;
  restaurantName: string;
  cuisine?: string;
  location?: string;
  specificData?: Record<string, any>;
  title?: string;
}

export function AIMissingIngredients({
  category,
  score,
  restaurantName,
  cuisine,
  location,
  specificData,
  title = "Missing Ingredients"
}: AIMissingIngredientsProps) {
  
  // Determine priority based on score
  const priority = score < 50 ? 'high' : score < 75 ? 'medium' : 'low';
  
  const { recommendations, loading, error } = useAIRecommendations({
    category,
    priority,
    score,
    restaurantName,
    cuisine,
    location,
    specificData,
    enabled: true
  });

  // Priority colors
  const priorityConfig = {
    high: {
      color: 'text-[#5F5FFF]',
      bg: 'bg-[#5F5FFF]/10',
      border: 'border-[#5F5FFF]/30',
      badgeBg: 'bg-[#5F5FFF]/20',
      label: 'HIGH PRIORITY'
    },
    medium: {
      color: 'text-[#7375FD]',
      bg: 'bg-[#7375FD]/10',
      border: 'border-[#7375FD]/30',
      badgeBg: 'bg-[#7375FD]/20',
      label: 'MEDIUM PRIORITY'
    },
    low: {
      color: 'text-[#9090FD]',
      bg: 'bg-[#9090FD]/10',
      border: 'border-[#9090FD]/30',
      badgeBg: 'bg-[#9090FD]/20',
      label: 'LOW PRIORITY'
    }
  };

  const config = priorityConfig[priority];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-[#5F5FFF]" />
        {title}
      </h3>
      
      <div className="space-y-3">
        {loading ? (
          <div className="bg-gray-100 border border-gray-200 rounded p-3">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">ERROR</span>
            <p className="mt-2 text-sm text-gray-700">
              Unable to load personalized recommendations. Please try again later.
            </p>
          </div>
        ) : recommendations && recommendations.recommendations.length > 0 ? (
          <div className={`${config.bg} ${config.border} rounded p-3`}>
            <span className={`text-xs font-bold ${config.color} ${config.badgeBg} px-2 py-1 rounded`}>
              {config.label}
            </span>
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              {recommendations.recommendations.map((recommendation, index) => (
                <li key={index}>• {stripMarkdownBold(recommendation)}</li>
              ))}
            </ul>
            {recommendations.context && (
              <p className="mt-3 text-xs text-gray-600 italic border-t border-gray-200 pt-2">
                {recommendations.context}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">WELL OPTIMIZED</span>
            <p className="mt-2 text-sm text-gray-700">
              Your {category} performance is strong! Continue monitoring and maintaining your current strategies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}