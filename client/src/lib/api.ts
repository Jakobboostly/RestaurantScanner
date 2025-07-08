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
}

export async function scanWebsite(
  domain: string,
  restaurantName: string,
  placeId?: string,
  onProgress?: (progress: ScanProgress) => void,
  latitude?: number,
  longitude?: number
): Promise<ScanResult> {
  // Use professional scanner for comprehensive analysis
  const response = await fetch('/api/scan/professional', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain, restaurantName, placeId, latitude, longitude }),
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

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line.length > 6) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log('SSE message received:', data);
            
            if (data.type === 'complete') {
              scanResult = data.result;
              console.log('Scan complete, result received');
            } else if (data.type === 'error') {
              throw new Error(data.error);
            } else if (onProgress) {
              onProgress(data);
            }
          } catch (parseError) {
            console.error('Failed to parse SSE message:', line, parseError);
          }
        }
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
