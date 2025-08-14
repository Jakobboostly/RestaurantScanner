import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { SiFacebook, SiInstagram } from "react-icons/si";

interface SocialMediaLinks {
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  facebookVerified?: boolean;
  facebookConfidence?: 'low' | 'high';
  facebookSource?: 'none' | 'manual_override' | 'website_scan';
  facebookAnalysis?: {
    totalPosts: number;
    averageEngagement: number;
    engagementRate: number;
    postingFrequency: string;
    recentPosts: any[];
    topPerformingPost: any;
  };
}

interface SocialMediaDisplayProps {
  socialMediaLinks: SocialMediaLinks;
}

export default function SocialMediaDisplay({ socialMediaLinks }: SocialMediaDisplayProps) {
  const hasFacebook = socialMediaLinks.facebook;
  const hasInstagram = socialMediaLinks.instagram;
  const hasAnySocial = hasFacebook || hasInstagram;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <SiFacebook className="w-5 h-5 text-blue-600" />
            Social Media Analysis
          </CardTitle>
          <Badge variant={hasAnySocial ? "default" : "secondary"} className="text-xs">
            {hasAnySocial ? "Connected" : "Not Found"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAnySocial ? (
          <div className="space-y-4">
            {/* Social Media Overview */}
            <div className="grid gap-4">
              {hasFacebook && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <SiFacebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Facebook</h4>
                      <p className="text-sm text-blue-700">Page detected</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => socialMediaLinks.facebook && window.open(socialMediaLinks.facebook, '_blank')}
                  >
                    View Page <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
              
              {hasInstagram && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-pink-50 border border-pink-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <SiInstagram className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-pink-900">Instagram</h4>
                      <p className="text-sm text-pink-700">Account detected</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => socialMediaLinks.instagram && window.open(socialMediaLinks.instagram, '_blank')}
                  >
                    View Profile <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Source Info */}
            {socialMediaLinks.facebookSource && socialMediaLinks.facebookSource !== 'none' && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Detection: {socialMediaLinks.facebookSource.replace('_', ' ')} • Confidence: {socialMediaLinks.facebookConfidence}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SiFacebook className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Social Media Found</h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              No Facebook or Instagram pages detected on the website. Consider adding social media presence to engage with customers and build your online community.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}