import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ScreenshotResult {
  success: boolean;
  screenshotBase64?: string;
  screenshotPath?: string;
  error?: string;
  timestamp: string;
}

export function RestaurantSearchScreenshot() {
  const [isLoading, setIsLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<ScreenshotResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('restaurants near me');
  const [location, setLocation] = useState('');
  const [cuisineType, setCuisineType] = useState('');

  const captureScreenshot = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/screenshot/restaurant-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery,
          location: location.trim() || undefined,
          cuisineType: cuisineType.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ScreenshotResult = await response.json();
      setScreenshot(result);

      if (result.success) {
        toast({
          title: "Screenshot captured!",
          description: "Google restaurant search results captured successfully.",
        });
      } else {
        toast({
          title: "Screenshot failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        title: "Network error",
        description: "Failed to communicate with the server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadScreenshot = () => {
    if (screenshot?.screenshotBase64) {
      const link = document.createElement('a');
      link.href = screenshot.screenshotBase64;
      link.download = `restaurant-search-${screenshot.timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Restaurant Search Screenshot
          </CardTitle>
          <CardDescription>
            Capture screenshots of Google search results for restaurant searches using Selenium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchQuery">Search Query</Label>
              <Input
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., restaurants near me"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New York, Chicago"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cuisineType">Cuisine Type (optional)</Label>
              <Input
                id="cuisineType"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                placeholder="e.g., Italian, Mexican, Pizza"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={captureScreenshot} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {isLoading ? 'Capturing...' : 'Capture Screenshot'}
            </Button>
            
            {screenshot?.success && (
              <Button 
                variant="outline"
                onClick={downloadScreenshot}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Display */}
      {screenshot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {screenshot.success ? 'Screenshot Result' : 'Error'}
            </CardTitle>
            <CardDescription>
              Captured at: {new Date(screenshot.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {screenshot.success && screenshot.screenshotBase64 ? (
              <div className="space-y-4">
                <img
                  src={screenshot.screenshotBase64}
                  alt="Restaurant search results"
                  className="w-full h-auto rounded-lg border border-gray-200 shadow-lg"
                />
                <div className="text-sm text-gray-600">
                  <p>Search performed: "{searchQuery}"</p>
                  {location && <p>Location: {location}</p>}
                  {cuisineType && <p>Cuisine: {cuisineType}</p>}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-red-600">
                <p className="font-medium">Screenshot capture failed</p>
                <p className="text-sm mt-1">{screenshot.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}