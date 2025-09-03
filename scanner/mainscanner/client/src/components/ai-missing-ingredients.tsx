import React, { useState } from 'react';
import { AlertCircle, ChevronRight, Sparkles, Target, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { motion, AnimatePresence } from 'framer-motion';

// Utility function to remove markdown bold formatting
const stripMarkdownBold = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};

// Extract concise card title from recommendation text
const extractCardTitle = (recommendation: string): string => {
  const cleaned = stripMarkdownBold(recommendation);
  
  // Pattern 1: Text before colon - limit to reasonable length
  if (cleaned.includes(':')) {
    const beforeColon = cleaned.split(':')[0].trim();
    // If the title before colon is too long, truncate it
    const words = beforeColon.split(' ');
    if (words.length > 3) {
      return words.slice(0, 3).join(' ');
    }
    return beforeColon;
  }
  
  // Pattern 2: First sentence up to first period
  if (cleaned.includes('.')) {
    const firstSentence = cleaned.split('.')[0].trim();
    const words = firstSentence.split(' ');
    return words.slice(0, 3).join(' ');
  }
  
  // Pattern 3: Just take first 3 words
  const words = cleaned.split(' ');
  return words.slice(0, 3).join(' ');
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
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());

  // Icons for different types of recommendations
  const getIconForRecommendation = (text: string, index: number) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('keyword') || lowerText.includes('search')) return Target;
    if (lowerText.includes('social') || lowerText.includes('facebook') || lowerText.includes('instagram')) return Users;
    if (lowerText.includes('growth') || lowerText.includes('increase')) return TrendingUp;
    if (lowerText.includes('optimize') || lowerText.includes('improve')) return Sparkles;
    // Default rotating icons
    const icons = [Target, Users, TrendingUp, Sparkles];
    return icons[index % icons.length];
  };

  const handleCardClick = (index: number) => {
    if (completedCards.has(index)) {
      // Unmark as completed
      setCompletedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    } else {
      setExpandedCard(expandedCard === index ? null : index);
    }
  };

  const markAsComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedCards(prev => new Set(prev).add(index));
    setExpandedCard(null);
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-[#5F5FFF] to-[#9090FD] rounded-lg">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg">{title}</span>
        {priority === 'high' && (
          <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
            ACTION NEEDED
          </span>
        )}
      </h3>
      
      <div className="space-y-3">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error Loading Recommendations</span>
            </div>
            <p className="text-sm text-gray-700">
              Unable to load personalized recommendations. Please try again later.
            </p>
          </motion.div>
        ) : recommendations && recommendations.recommendations.length > 0 ? (
          <>
            {/* Priority Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`${config.badgeBg} ${config.color} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                <Sparkles className="w-3 h-3" />
                {config.label}
              </div>
              <span className="text-xs text-gray-500">
                Flip cards to see details • Mark complete when done
              </span>
            </div>

            {/* Flip Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.recommendations.map((recommendation, index) => {
                const Icon = getIconForRecommendation(recommendation, index);
                const isFlipped = expandedCard === index;
                const isCompleted = completedCards.has(index);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-48 w-full [perspective:1000px] cursor-pointer"
                    onClick={() => handleCardClick(index)}
                  >
                    <motion.div
                      className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Front of Card */}
                      <div className={`
                        absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-xl shadow-lg border-2 transition-all
                        ${isCompleted 
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-[#5F5FFF]/50'
                        }
                      `}>
                        <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                          {/* Icon */}
                          <div className={`
                            p-3 rounded-full mb-3 transition-all
                            ${isCompleted 
                              ? 'bg-green-200' 
                              : 'bg-gradient-to-br from-[#5F5FFF]/10 to-[#9090FD]/10 hover:from-[#5F5FFF]/20 hover:to-[#9090FD]/20'
                            }
                          `}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <Icon className="w-6 h-6 text-[#5F5FFF]" />
                            )}
                          </div>
                          
                          {/* Title */}
                          <h4 className={`
                            text-sm font-semibold mb-2 transition-colors text-center px-2
                            line-clamp-2 max-w-full break-words overflow-hidden
                            ${isCompleted ? 'text-green-700 line-through' : 'text-gray-800'}
                          `}>
                            {extractCardTitle(recommendation)}
                          </h4>
                          
                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              ✓ Completed
                            </span>
                          ) : (
                            <span className="text-xs bg-[#5F5FFF]/10 text-[#5F5FFF] px-3 py-1 rounded-full font-medium">
                              Tap to flip
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Back of Card */}
                      <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl shadow-lg">
                        <div className="bg-gradient-to-br from-[#5F5FFF] to-[#9090FD] h-full rounded-xl p-6 text-white">
                          <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className="w-5 h-5" />
                              <span className="text-xs font-bold uppercase tracking-wide opacity-90">
                                {category} improvement
                              </span>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed mb-4 opacity-95">
                                {stripMarkdownBold(recommendation)}
                              </p>
                              
                              <div className="bg-white/10 rounded-lg p-3 mb-4 backdrop-blur-sm">
                                <p className="text-xs opacity-90">
                                  💡 <strong>Impact:</strong> This improvement can boost your {category} visibility by 15-20%
                                </p>
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            {!isCompleted && (
                              <button
                                onClick={(e) => markAsComplete(index, e)}
                                className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all border border-white/20 backdrop-blur-sm"
                              >
                                Mark as Complete ✓
                              </button>
                            )}
                            
                            {isCompleted && (
                              <div className="w-full bg-green-400/20 text-green-100 text-sm font-medium py-2 px-4 rounded-lg text-center border border-green-400/30">
                                ✅ Completed!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm font-bold">💡</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    How to use these study cards:
                  </p>
                  <p className="text-xs text-blue-700">
                    Click any card to flip it over and see detailed action steps. Complete tasks to track your progress!
                  </p>
                  {recommendations.context && (
                    <p className="text-xs text-blue-600 mt-2 italic">
                      <strong>Pro Tip:</strong> {recommendations.context}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            {completedCards.size > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">
                    {completedCards.size} of {recommendations.recommendations.length} completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCards.size / recommendations.recommendations.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">WELL OPTIMIZED</span>
            <p className="mt-3 text-sm text-gray-700">
              Your {category} performance is strong! Continue monitoring and maintaining your current strategies.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}