import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import EnhancedResultsDashboard from '@/components/enhanced-results-dashboard';
import { ScanResult } from '../../../shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ScanViewPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScanData = async () => {
      if (!placeId) {
        setError('Place ID is required');
        setLoading(false);
        return;
      }

      try {
        // First try to load from cache
        const response = await fetch(`/api/scan/cached/${placeId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Scan results not found. Please run a new scan for this restaurant.');
          } else {
            setError('Failed to load scan results');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setScanData(data);
        
        // Track access in database
        await fetch(`/api/urls/track-access/${placeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'full_scan' })
        });
      } catch (err) {
        setError('Failed to load scan results');
        console.error('Failed to load scan data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadScanData();
  }, [placeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-lg font-medium">Loading scan results...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No scan data available for this restaurant.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {scanData.restaurantName} - Full Scan Results
          </h1>
          <p className="text-gray-600 mt-2">
            Complete SEO and competitive analysis report
          </p>
        </div>
        
        <EnhancedResultsDashboard 
          scanResult={scanData}
          onNewScan={() => window.location.href = '/'}
        />
      </div>
    </div>
  );
}