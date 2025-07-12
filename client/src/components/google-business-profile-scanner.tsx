import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Star, Phone, Globe, Camera, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface GoogleBusinessProfileResult {
  profile: {
    name: string;
    rating: number;
    totalReviews: number;
    website?: string;
    phone?: string;
    photos: {
      total: number;
      quality: string;
      categories: {
        food: number;
        interior: number;
        exterior: number;
        menu: number;
        other: number;
      };
    };
    reviews: {
      sentiment: string;
      score: number;
      recent: any[];
    };
    isVerified: boolean;
    responseRate: number;
    averageResponseTime: string;
  };
  analysis: {
    completeness: { score: number; missingElements: string[] };
    optimization: { score: number; issues: string[] };
    competitiveness: number;
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
  };
  scanDate: string;
  scanType: string;
}

interface GoogleBusinessProfileScannerProps {
  placeId: string;
  restaurantName: string;
}

export function GoogleBusinessProfileScanner({ placeId, restaurantName }: GoogleBusinessProfileScannerProps) {
  const [scanResult, setScanResult] = useState<GoogleBusinessProfileResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await apiRequest<GoogleBusinessProfileResult>('/api/scan/google-business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId }),
      });

      setScanResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Business Profile scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const renderProfileOverview = (profile: GoogleBusinessProfileResult['profile']) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Profile Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{profile.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{profile.rating}</span>
              </div>
              <span className="text-muted-foreground">({profile.totalReviews} reviews)</span>
            </div>
          </div>
          {profile.isVerified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Verified
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{profile.phone || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>{profile.website ? 'Website available' : 'No website'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span>{profile.photos.total} photos</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span>{profile.responseRate}% response rate</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalysis = (analysis: GoogleBusinessProfileResult['analysis']) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completeness Score</span>
              <span className="text-sm font-bold">{analysis.completeness.score}%</span>
            </div>
            <Progress value={analysis.completeness.score} className="h-2" />
            {analysis.completeness.missingElements.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Missing: {analysis.completeness.missingElements.join(', ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Optimization Score</span>
              <span className="text-sm font-bold">{analysis.optimization.score}%</span>
            </div>
            <Progress value={analysis.optimization.score} className="h-2" />
            {analysis.optimization.issues.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-red-600">Issues:</div>
                {analysis.optimization.issues.map((issue, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competitive Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Competitive Score</span>
              <span className="text-sm font-bold">{analysis.competitiveness}%</span>
            </div>
            <Progress value={analysis.competitiveness} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecommendations = (analysis: GoogleBusinessProfileResult['analysis']) => (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analysis.strengths.length > 0 && (
            <div>
              <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.weaknesses.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Action Items</h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Google Business Profile Analysis</h2>
          <p className="text-muted-foreground">Analyze your Google Business Profile for optimization opportunities</p>
        </div>
        <Button onClick={handleScan} disabled={isScanning || !placeId}>
          {isScanning ? 'Analyzing...' : 'Analyze Profile'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {scanResult && (
        <div className="space-y-6">
          {renderProfileOverview(scanResult.profile)}
          
          <Separator />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {renderAnalysis(scanResult.analysis)}
            </div>
            <div>
              {renderRecommendations(scanResult.analysis)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}