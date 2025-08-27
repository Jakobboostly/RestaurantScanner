import React, { useState } from 'react';
import { Share2, Copy, CheckCircle, ExternalLink, Eye, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DualShareLinksProps {
  placeId: string;
  restaurantName: string;
}

export function DualShareLinks({ placeId, restaurantName }: DualShareLinksProps) {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedRevenue, setCopiedRevenue] = useState(false);
  
  const fullScanLink = `${window.location.origin}/${placeId}`;
  const revenueGateLink = `${window.location.origin}/revenue-gate/${placeId}`;

  const handleCopy = async (link: string, type: 'full' | 'revenue') => {
    try {
      await navigator.clipboard.writeText(link);
      if (type === 'full') {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2000);
      } else {
        setCopiedRevenue(true);
        setTimeout(() => setCopiedRevenue(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenLink = (link: string) => {
    window.open(link, '_blank');
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
            Shareable Links for {restaurantName}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Share scan results and revenue analysis with your team or clients
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="full" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="full">
                <Eye className="h-4 w-4 mr-2" />
                Full Scan
              </TabsTrigger>
              <TabsTrigger value="revenue">
                <DollarSign className="h-4 w-4 mr-2" />
                Revenue Analysis
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="full" className="space-y-3 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Complete SEO & Competitive Analysis
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={fullScanLink}
                    readOnly
                    className="flex-1 bg-white"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="icon"
                    variant={copiedFull ? "default" : "outline"}
                    onClick={() => handleCopy(fullScanLink, 'full')}
                    className={copiedFull ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {copiedFull ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleOpenLink(fullScanLink)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Share the complete scan results including SEO, performance, and competitor analysis
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="revenue" className="space-y-3 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Revenue Loss & Opportunity Report
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={revenueGateLink}
                    readOnly
                    className="flex-1 bg-white"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="icon"
                    variant={copiedRevenue ? "default" : "outline"}
                    onClick={() => handleCopy(revenueGateLink, 'revenue')}
                    className={copiedRevenue ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {copiedRevenue ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleOpenLink(revenueGateLink)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Share the revenue opportunity analysis focused on lost revenue and growth potential
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Pro tip:</strong> Links are valid for 7 days from scan date. 
              Each link is tracked for analytics and can be linked to HubSpot contacts.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}