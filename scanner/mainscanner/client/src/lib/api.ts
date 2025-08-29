import { RestaurantSearchResult, ScanResult } from "@shared/schema";

export async function searchRestaurants(query: string): Promise<RestaurantSearchResult[]> {
  const response = await fetch(`/api/restaurants/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search restaurants');
  }
  return response.json();
}

export async function getRestaurantDetails(placeId: string) {
  const response = await fetch(`/api/restaurants/${placeId}`);
  if (!response.ok) {
    throw new Error('Failed to get restaurant details');
  }
  return response.json();
}

export interface ScanProgress {
  progress: number;
  status: string;
  review?: {
    author: string;
    rating: number;
    text: string;
    platform: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

export async function scanWebsite(
  domain: string,
  restaurantName: string,
  placeId?: string,
  onProgress?: (progress: ScanProgress) => void,
  latitude?: number,
  longitude?: number,
  forceRefresh: boolean = false
): Promise<ScanResult> {
  // Use professional scanner for comprehensive analysis
  const response = await fetch('/api/scan/professional', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain, restaurantName, placeId, latitude, longitude, forceRefresh }),
  });

  if (!response.ok) {
    throw new Error('Failed to start website scan');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let scanResult: ScanResult | null = null;
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // Process complete lines from buffer
      const lines = buffer.split('\n');
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line.length > 6) {
          try {
            const jsonData = line.slice(6).trim();
            if (jsonData) {
              const data = JSON.parse(jsonData);
              
              if (data.type === 'complete') {
                scanResult = data.result;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              } else if (onProgress) {
                onProgress(data);
              }
            }
          } catch (parseError) {
            console.error('Failed to parse SSE message:', parseError);
          }
        }
      }
    }
    
    // Process any remaining data in buffer
    if (buffer.startsWith('data: ') && buffer.length > 6) {
      try {
        const jsonData = buffer.slice(6).trim();
        if (jsonData) {
          const data = JSON.parse(jsonData);
          
          if (data.type === 'complete') {
            scanResult = data.result;
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        }
      } catch (parseError) {
        console.error('Failed to parse final SSE message:', parseError);
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!scanResult) {
    throw new Error('No scan result received');
  }

  return scanResult;
}

export async function getScanHistory(domain: string) {
  const response = await fetch(`/api/scans/${domain}`);
  if (!response.ok) {
    throw new Error('Failed to get scan history');
  }
  return response.json();
}

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
}
