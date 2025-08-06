import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface WebsiteEmbedProps {
  url: string;
  restaurantName: string;
  className?: string;
}

export function WebsiteEmbed({ url, restaurantName, className = '' }: WebsiteEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState(url);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    // Ensure HTTPS for better embedding compatibility
    let finalUrl = url;
    if (url.startsWith('http://')) {
      finalUrl = url.replace('http://', 'https://');
      setEmbedUrl(finalUrl);
    }
  }, [url]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openInNewTab = () => {
    window.open(embedUrl, '_blank', 'noopener,noreferrer');
  };

  const retryEmbed = () => {
    setIsLoading(true);
    setHasError(false);
    // Try the original HTTP version if HTTPS failed
    const retryUrl = embedUrl.startsWith('https://') ? url : embedUrl.replace('http://', 'https://');
    setEmbedUrl(retryUrl);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {restaurantName} Website
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={retryEmbed}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="flex flex-col items-center space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-sm text-gray-600">Loading website...</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="flex flex-col items-center space-y-3 text-center p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Cannot embed website</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This website cannot be displayed in an iframe due to security restrictions.
                  </p>
                </div>
                <Button onClick={openInNewTab} className="mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in new tab
                </Button>
              </div>
            </div>
          )}

          <iframe
            src={embedUrl}
            width="100%"
            height="400"
            frameBorder="0"
            className="rounded-lg"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={`${restaurantName} Website`}
            style={{ 
              display: hasError ? 'none' : 'block',
              minHeight: '400px'
            }}
          />
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          URL: {embedUrl}
        </div>
      </CardContent>
    </Card>
  );
}