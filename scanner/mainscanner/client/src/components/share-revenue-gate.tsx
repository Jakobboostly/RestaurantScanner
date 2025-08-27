import React, { useState } from 'react';
import { Share2, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

interface ShareRevenueGateProps {
  placeId: string;
  restaurantName: string;
}

export function ShareRevenueGate({ placeId, restaurantName }: ShareRevenueGateProps) {
  const [copied, setCopied] = useState(false);
  
  const shareableLink = `${window.location.origin}/revenue-gate/${placeId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenLink = () => {
    window.open(shareableLink, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-purple-600" />
            Share Revenue Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Share this revenue opportunity report with {restaurantName}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={shareableLink} 
              readOnly 
              className="flex-1 text-sm bg-white border-gray-300"
            />
            <Button 
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="px-3"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="default"
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              onClick={handleOpenLink}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            This link will show the revenue opportunity analysis and lead capture form
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}