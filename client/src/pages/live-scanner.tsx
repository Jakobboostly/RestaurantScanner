import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Database, CheckCircle, AlertCircle } from 'lucide-react';
import ResultsDashboard from '@/components/results-dashboard';

interface ScanProgress {
  progress: number;
  status: string;
}

export default function LiveScanner() {
  const [restaurantName, setRestaurantName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({ progress: 0, status: '' });
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  const handleLiveScan = async () => {
    if (!restaurantName || !location) {
      setError('Restaurant name and location are required');
      return;
    }

    setIsScanning(true);
    setError('');
    setProgress({ progress: 0, status: 'Initializing...' });
    setScanResult(null);

    try {
      const response = await fetch('/api/scan/live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantName,
          location,
          website: website || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'complete') {
                setScanResult(data.result);
                setProgress({ progress: 100, status: 'Analysis complete!' });
                setIsScanning(false);
              } else if (data.type === 'error') {
                setError(data.error);
                setIsScanning(false);
              } else if (data.progress !== undefined) {
                setProgress(data);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Live scan error:', error);
      setError(error instanceof Error ? error.message : 'Live scan failed');
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DataForSEO Live API Scanner
          </h1>
          <p className="text-gray-600">
            Streamlined restaurant analysis using DataForSEO Business Listings and Live API endpoints
          </p>
        </div>

        {/* Live API Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">30-45 seconds</h3>
                  <p className="text-sm text-gray-600">vs 3 minutes with polling</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Database className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Single API Provider</h3>
                  <p className="text-sm text-gray-600">DataForSEO Business Listings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">No Polling</h3>
                  <p className="text-sm text-gray-600">Live endpoints only</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Live Restaurant Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="restaurant-name">Restaurant Name *</Label>
                <Input
                  id="restaurant-name"
                  placeholder="e.g., Joe's Pizza"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                placeholder="e.g., joespizza.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button 
              onClick={handleLiveScan}
              disabled={isScanning || !restaurantName || !location}
              className="w-full"
            >
              {isScanning ? 'Scanning...' : 'Start Live Analysis'}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Display */}
        {(isScanning || progress.progress > 0) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Live Analysis Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{progress.status}</span>
                  <Badge variant="outline">
                    {progress.progress}%
                  </Badge>
                </div>
                <Progress value={progress.progress} className="h-2" />
                
                {progress.progress === 100 && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Analysis completed successfully!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {scanResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>DataForSEO Live API Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{scanResult.performance || 0}</div>
                    <div className="text-sm text-gray-600">Performance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{scanResult.seo || 0}</div>
                    <div className="text-sm text-gray-600">SEO Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{scanResult.mobile || 0}</div>
                    <div className="text-sm text-gray-600">Mobile</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{scanResult.keywords?.length || 0}</div>
                    <div className="text-sm text-gray-600">Keywords</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ResultsDashboard scanResult={scanResult} restaurantName={restaurantName} />
          </div>
        )}
      </div>
    </div>
  );
}