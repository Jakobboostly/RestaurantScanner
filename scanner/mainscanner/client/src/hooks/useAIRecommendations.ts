import { useState, useEffect } from 'react';

// Simple cache for AI recommendations
const recommendationsCache = new Map<string, { data: AIRecommendation; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export interface AIRecommendation {
  recommendations: string[];
  context: string;
  urgency: 'critical' | 'important' | 'optimize';
}

interface UseAIRecommendationsProps {
  category: 'search' | 'social' | 'reviews' | 'local';
  priority: 'high' | 'medium' | 'low';
  score: number;
  restaurantName: string;
  cuisine?: string;
  location?: string;
  specificData?: Record<string, any>;
  enabled?: boolean;
}

export function useAIRecommendations({
  category,
  priority,
  score,
  restaurantName,
  cuisine,
  location,
  specificData,
  enabled = true
}: UseAIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !restaurantName) {
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      // Create cache key from request parameters
      const cacheKey = JSON.stringify({ category, priority, score, restaurantName, cuisine, location });
      
      // Check cache first
      const cached = recommendationsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Using cached AI recommendations for ${category}`);
        setRecommendations(cached.data);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category,
            priority,
            score,
            restaurantName,
            cuisine,
            location,
            specificData
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`);
        }

        const data = await response.json();
        
        // Cache the successful result
        recommendationsCache.set(cacheKey, { data, timestamp: Date.now() });
        
        setRecommendations(data);
      } catch (err) {
        console.error('Error fetching AI recommendations:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Set fallback recommendations
        setRecommendations({
          recommendations: [
            `Improve ${category} performance with targeted optimization`,
            `Focus on local market presence and customer engagement`,
            `Implement consistent marketing strategies across all channels`
          ],
          context: `${priority} priority improvements needed for better ${category} performance.`,
          urgency: priority === 'high' ? 'critical' : priority === 'medium' ? 'important' : 'optimize'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [category, priority, score, restaurantName, cuisine, location, specificData, enabled]);

  return { recommendations, loading, error };
}