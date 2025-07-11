import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { SiFacebook } from "react-icons/si";

interface FacebookPageData {
  id: string;
  name: string;
  username?: string;
  likes?: number;
  followers?: number;
  checkins?: number;
  posts?: number;
  engagement_rate?: number;
  verified?: boolean;
  category?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  cover_photo?: string;
  profile_picture?: string;
}

interface SocialMediaLinks {
  facebook?: string;
  facebookId?: string;
  facebookData?: FacebookPageData;
}

interface SocialMediaDisplayProps {
  socialMediaLinks: SocialMediaLinks;
}

export default function SocialMediaDisplay({ socialMediaLinks }: SocialMediaDisplayProps) {
  const facebookData = socialMediaLinks.facebookData;
  const hasFacebook = socialMediaLinks.facebook;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <SiFacebook className="w-5 h-5 text-blue-600" />
            Facebook Analysis
          </CardTitle>
          <Badge variant={hasFacebook ? "default" : "secondary"} className="text-xs">
            {hasFacebook ? "Connected" : "Not Found"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasFacebook && facebookData ? (
          <div className="space-y-4">
            {/* Facebook Page Overview */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <SiFacebook className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">{facebookData.name}</h4>
                  <p className="text-sm text-blue-700">
                    {facebookData.username ? `@${facebookData.username}` : 'Facebook Page'}
                    {facebookData.verified && (
                      <span className="ml-2 text-blue-600">✓ Verified</span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => window.open(socialMediaLinks.facebook, '_blank')}
              >
                View Page <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Facebook Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {facebookData.likes?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {facebookData.followers?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {facebookData.checkins?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Check-ins</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {facebookData.engagement_rate ? `${facebookData.engagement_rate.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Engagement</div>
              </div>
            </div>

            {/* Facebook Details */}
            {(facebookData.category || facebookData.description) && (
              <div className="space-y-2">
                {facebookData.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Category:</span>
                    <Badge variant="outline" className="text-xs">{facebookData.category}</Badge>
                  </div>
                )}
                {facebookData.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">About:</span>
                    <p className="text-sm text-gray-600 mt-1">{facebookData.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : hasFacebook ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <SiFacebook className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Facebook Page Found</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => window.open(socialMediaLinks.facebook, '_blank')}
              >
                View Page <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Facebook page detected but detailed analytics unavailable.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <SiFacebook className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-600">Facebook Page</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Not Found
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              No Facebook page detected on the website. Consider adding a Facebook presence to engage with customers and build your online community.
            </p>
          </div>
        )}

        {/* Facebook ID Info */}
        {socialMediaLinks.facebookId && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Facebook ID: {socialMediaLinks.facebookId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}