import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface TooltipRequest {
  context: string;
  element: string;
  data?: any;
}

interface PlayfulTooltipsResponse {
  tooltips: string[];
}

export function usePlayfulTooltips(requests: TooltipRequest[], enabled = true) {
  const [tooltips, setTooltips] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<PlayfulTooltipsResponse>({
    queryKey: ['playful-tooltips', requests],
    queryFn: async () => {
      const response = await fetch('/api/playful-tooltips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch playful tooltips');
      }
      
      return response.json();
    },
    enabled: enabled && requests.length > 0,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });

  useEffect(() => {
    if (data?.tooltips) {
      const tooltipMap: Record<string, string> = {};
      requests.forEach((req, index) => {
        const key = `${req.context}-${req.element}`;
        tooltipMap[key] = data.tooltips[index] || "Here's some helpful info! ✨";
      });
      setTooltips(tooltipMap);
    }
  }, [data, requests]);

  const getTooltip = (context: string, element: string): string => {
    const key = `${context}-${element}`;
    return tooltips[key] || "Here's some helpful info! ✨";
  };

  return {
    getTooltip,
    tooltips,
    isLoading,
    error,
  };
}

export function usePlayfulTooltip(context: string, element: string, data?: any, enabled = true) {
  const { data: response, isLoading, error } = useQuery<{ tooltip: string }>({
    queryKey: ['playful-tooltip', context, element, data],
    queryFn: async () => {
      const response = await fetch('/api/playful-tooltip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context, element, data }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch playful tooltip');
      }
      
      return response.json();
    },
    enabled: enabled && !!context && !!element,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });

  return {
    tooltip: response?.tooltip || "Here's some helpful info! ✨",
    isLoading,
    error,
  };
}