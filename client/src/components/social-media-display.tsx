import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import { SiFacebook, SiInstagram, SiTwitter, SiYoutube, SiTiktok, SiLinkedin } from "react-icons/si";

interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
}

interface SocialMediaDisplayProps {
  socialMediaLinks: SocialMediaLinks;
}

export default function SocialMediaDisplay({ socialMediaLinks }: SocialMediaDisplayProps) {
  const socialPlatforms = [
    {
      key: 'facebook',
      name: 'Facebook',
      icon: SiFacebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      url: socialMediaLinks.facebook
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: SiInstagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      url: socialMediaLinks.instagram
    },
    {
      key: 'twitter',
      name: 'Twitter',
      icon: SiTwitter,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      url: socialMediaLinks.twitter
    },
    {
      key: 'youtube',
      name: 'YouTube',
      icon: SiYoutube,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      url: socialMediaLinks.youtube
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      icon: SiTiktok,
      color: 'text-black',
      bgColor: 'bg-gray-50',
      url: socialMediaLinks.tiktok
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: SiLinkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      url: socialMediaLinks.linkedin
    }
  ];

  const activePlatforms = socialPlatforms.filter(platform => platform.url);
  const inactivePlatforms = socialPlatforms.filter(platform => !platform.url);

  if (activePlatforms.length === 0 && inactivePlatforms.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Social Media Presence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Social Media Links */}
          {activePlatforms.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                Found Social Media Links ({activePlatforms.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activePlatforms.map((platform) => {
                  const IconComponent = platform.icon;
                  return (
                    <div
                      key={platform.key}
                      className={`flex items-center justify-between p-3 rounded-lg border ${platform.bgColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`w-5 h-5 ${platform.color}`} />
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-gray-600 truncate max-w-32">
                            {platform.url?.replace(/^https?:\/\//, '')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(platform.url, '_blank')}
                        className="shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing Social Media Platforms */}
          {inactivePlatforms.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                Missing Social Media Presence ({inactivePlatforms.length})
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {inactivePlatforms.map((platform) => {
                  const IconComponent = platform.icon;
                  return (
                    <div
                      key={platform.key}
                      className="flex flex-col items-center p-3 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <IconComponent className="w-5 h-5 text-gray-400 mb-1" />
                      <div className="text-xs text-gray-500 text-center">
                        {platform.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-sm text-gray-600">
              Social Media Coverage
            </div>
            <Badge variant={activePlatforms.length >= 3 ? 'default' : activePlatforms.length >= 1 ? 'secondary' : 'destructive'}>
              {activePlatforms.length} of {socialPlatforms.length} platforms
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}