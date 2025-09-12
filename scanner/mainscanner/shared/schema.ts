import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  placeId: text("place_id").unique(),
  domain: text("domain"),
  rating: integer("rating"),
  totalRatings: integer("total_ratings"),
  priceLevel: integer("price_level"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  domain: text("domain").notNull(),
  overallScore: integer("overall_score").notNull(),
  performanceScore: integer("performance_score").notNull(),
  seoScore: integer("seo_score").notNull(),
  mobileScore: integer("mobile_score").notNull(),
  userExperienceScore: integer("user_experience_score").notNull(),
  issues: jsonb("issues").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  competitorData: jsonb("competitor_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Full scan results table for revenue gate functionality
export const fullScanResults = pgTable("full_scan_results", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").unique().notNull(), // Use place_id as unique identifier
  restaurantName: text("restaurant_name").notNull(),
  domain: text("domain"),
  scanData: jsonb("scan_data").notNull(), // Complete ScanResult JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity tracking table for live feed
export const scanActivities = pgTable("scan_activities", {
  id: serial("id").primaryKey(),
  restaurantName: text("restaurant_name").notNull(),
  location: text("location"), // City, State format
  placeId: text("place_id"),
  domain: text("domain"),
  action: text("action").notNull().default("analyzed"), // "analyzed", "scanned", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue gate URLs table for tracking shareable revenue analysis links
export const revenueGateUrls = pgTable("revenue_gate_urls", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  shareableUrl: text("shareable_url").notNull(),
  fullScanUrl: text("full_scan_url"),
  hubspotContactId: text("hubspot_contact_id"),
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue gate screenshots table for storing revenue analysis screenshots
export const revenueGateScreenshots = pgTable("revenue_gate_screenshots", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  domain: text("domain"), // Website domain for HubSpot company matching
  screenshotData: text("screenshot_data").notNull(), // Base64 encoded PNG
  screenshotUrl: text("screenshot_url"), // Optional URL if hosted elsewhere
  metadata: jsonb("metadata"), // Additional data like dimensions, file size
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  createdAt: true,
});

export const insertFullScanResultSchema = createInsertSchema(fullScanResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueGateUrlSchema = createInsertSchema(revenueGateUrls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueGateScreenshotSchema = createInsertSchema(revenueGateScreenshots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;
export type InsertFullScanResult = z.infer<typeof insertFullScanResultSchema>;
export type FullScanResult = typeof fullScanResults.$inferSelect;
export type InsertRevenueGateUrl = z.infer<typeof insertRevenueGateUrlSchema>;
export type RevenueGateUrl = typeof revenueGateUrls.$inferSelect;
export type InsertRevenueGateScreenshot = z.infer<typeof insertRevenueGateScreenshotSchema>;
export type RevenueGateScreenshot = typeof revenueGateScreenshots.$inferSelect;

// Screenshots table for storing SERP screenshot images
export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  location: text("location").notNull(),
  searchUrl: text("search_url").notNull(),
  imageData: text("image_data").notNull(), // base64 encoded PNG
  fileSize: integer("file_size"), // size in bytes
  restaurantName: text("restaurant_name"),
  restaurantDomain: text("restaurant_domain"),
  restaurantRanking: jsonb("restaurant_ranking"),
  captureDate: timestamp("capture_date").defaultNow().notNull(),
  localPackPresent: boolean("local_pack_present").default(false),
  localPackResults: jsonb("local_pack_results"),
  totalResults: integer("total_results").default(0)
});

export const insertScreenshotSchema = createInsertSchema(screenshots).omit({
  id: true,
  captureDate: true,
});

export type InsertScreenshot = z.infer<typeof insertScreenshotSchema>;
export type Screenshot = typeof screenshots.$inferSelect;

// API Response Types
export const restaurantSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  rating: z.number().optional(),
  totalRatings: z.number().optional(),
  priceLevel: z.number().optional(),
  placeId: z.string().optional(),
  domain: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
});

export const scanResultSchema = z.object({
  domain: z.string(),
  restaurantName: z.string(),
  placeId: z.string().optional(),
  overallScore: z.number(),
  performance: z.number(),
  seo: z.number(),
  mobile: z.number(),
  userExperience: z.number(),
  issues: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    effort: z.enum(['low', 'medium', 'high']),
  })),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    effort: z.enum(['low', 'medium', 'high']),
    category: z.string(),
  })),
  keywords: z.array(z.object({
    keyword: z.string(),
    position: z.number().nullable(),
    searchVolume: z.number(),
    difficulty: z.number(),
    intent: z.string(),
    cpc: z.number().optional(),
    competition: z.number().optional(),
  })),
  competitiveOpportunityKeywords: z.array(z.object({
    keyword: z.string(),
    position: z.number(),
    searchVolume: z.number(),
    difficulty: z.number(),
    intent: z.string(),
    cpc: z.number().optional(),
    competition: z.number().optional(),
    opportunity: z.number().optional(),
    url: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    isNew: z.boolean().optional(),
    isLost: z.boolean().optional(),
    positionChange: z.number().optional(),
    previousPosition: z.number().optional(),
  })).optional(),
  enhancedKeywordDiscovery: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    competition: z.string(),
    competitionIndex: z.number(),
    cpc: z.number(),
    lowTopBid: z.number(),
    highTopBid: z.number(),
    opportunityScore: z.number(),
    intent: z.string(),
    isLocal: z.boolean(),
    trends: z.object({
      trend: z.string(),
      change: z.number(),
      recentAvg: z.number().optional(),
      previousAvg: z.number().optional(),
    })
  })).optional(),
  competitiveGaps: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    competition: z.string(),
    competitionIndex: z.number(),
    cpc: z.number(),
    opportunityScore: z.number(),
    intent: z.string(),
    isLocal: z.boolean(),
    competitorDomain: z.string(),
    gapType: z.string(),
  })).optional(),
  keywordAnalysis: z.object({
    targetKeywords: z.array(z.object({
      keyword: z.string(),
      position: z.number().nullable(),
      searchVolume: z.number(),
      difficulty: z.number(),
      intent: z.string(),
      cpc: z.number().optional(),
      competition: z.number().optional(),
    })),
    rankingPositions: z.array(z.object({
      keyword: z.string(),
      position: z.number().nullable(),
      difficulty: z.number(),
    })),
    searchVolumes: z.record(z.string(), z.number()),
    opportunities: z.array(z.string()),
  }),
  competitors: z.array(z.object({
    name: z.string(),
    domain: z.string(),
    performance: z.number(),
    seo: z.number(),
    accessibility: z.number(),
    bestPractices: z.number(),
    overallScore: z.number(),
    isYou: z.boolean(),
    traffic: z.number().optional(),
    keywords: z.number().optional(),
    domainAuthority: z.number().optional(),
    trafficAdvantage: z.string().optional(),
    keywordLead: z.string().optional(),
    authorityGap: z.number().optional(),
  })),
  competitorIntelligence: z.object({
    organicCompetitors: z.array(z.any()),
    keywordGaps: z.array(z.string()),
    trafficEstimates: z.array(z.object({
      domain: z.string(),
      organicTraffic: z.number(),
      organicKeywords: z.number(),
    })),
  }),
  localCompetitorData: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    yourPosition: z.number(),
    topCompetitors: z.array(z.object({
      name: z.string(),
      position: z.number(),
      rating: z.number(),
      reviewCount: z.number(),
      address: z.string(),
      domain: z.string().optional(),
      priceLevel: z.string().optional(),
      category: z.string().optional(),
      phone: z.string().optional(),
    })),
  })).optional(),
  localPackReport: z.object({
    summary: z.object({
      visibility_score: z.number(),
      keywords_appeared: z.number(),
      total_keywords: z.number(),
      average_position: z.number(),
      best_position: z.number(),
    }),
    keyword_results: z.array(z.object({
      keyword: z.string(),
      found: z.boolean(),
      position: z.number().optional(),
      confidence: z.number(),
      matched_fields: z.array(z.string()),
      local_pack_data: z.object({
        name: z.string(),
        address: z.string(),
        website: z.string().optional(),
        phone: z.string().optional(),
        rating: z.number().optional(),
        reviews: z.number().optional(),
      }).optional(),
      competitors: z.array(z.object({
        position: z.number(),
        name: z.string(),
        address: z.string(),
        website: z.string().optional(),
        rating: z.number().optional(),
        reviews: z.number().optional(),
      })).optional(),
    })),
    recommendations: z.array(z.string()),
    scan_metadata: z.object({
      location: z.string(),
      timestamp: z.string(),
      total_scan_time_ms: z.number(),
    }),
  }).optional(),
  serpFeatures: z.array(z.string()),
  domainAuthority: z.number(),
  domainRankedKeywords: z.array(z.object({
    absolute_position: z.number().nullable(),
    keyword: z.string(),
    competition: z.number().nullable(),
    search_volume: z.number().nullable(),
  })).optional(),
  backlinks: z.number(),
  organicTraffic: z.number(),
  scanDate: z.string(),
  screenshot: z.string().nullable(),
  seoAnalysis: z.object({
    title: z.string(),
    metaDescription: z.string(),
    h1Tags: z.array(z.string()),
    imageCount: z.number(),
    internalLinks: z.number(),
    externalLinks: z.number(),
    schemaMarkup: z.boolean(),
  }),
  metrics: z.object({
    fcp: z.number(),
    lcp: z.number(),
    cls: z.number(),
    fid: z.number(),
  }),
  businessProfile: z.object({
    name: z.string(),
    rating: z.number(),
    totalReviews: z.number(),
    address: z.string().optional(),
    website: z.string().optional(),
    photos: z.object({
      total: z.number(),
      quality: z.enum(['excellent', 'good', 'fair', 'poor']),
      businessPhotos: z.array(z.string()).optional(),
      categories: z.object({
        food: z.number(),
        interior: z.number(),
        exterior: z.number(),
        menu: z.number(),
        other: z.number(),
      }),
    }),
    reviews: z.object({
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      score: z.number(),
      recent: z.array(z.any()),
    }),
    isVerified: z.boolean(),
    responseRate: z.number(),
    averageResponseTime: z.string(),
  }).optional(),
  businessPhotos: z.array(z.string()).optional(),
  profileAnalysis: z.object({
    completenessScore: z.number(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendations: z.array(z.object({
      category: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      title: z.string(),
      description: z.string(),
      impact: z.string(),
    })),
    competitivePosition: z.string(),
    optimization: z.object({
      photoOptimization: z.string(),
      infoCompleteness: z.string(),
      engagementLevel: z.string(),
    }),
  }).optional(),
  mobileExperience: z.object({
    score: z.number(),
    loadTime: z.number(),
    isResponsive: z.boolean(),
    touchFriendly: z.boolean(),
    textReadable: z.boolean(),
    navigationEasy: z.boolean(),
    issues: z.array(z.string()),
    recommendations: z.array(z.string()),
  }).optional(),
  reviewsAnalysis: z.object({
    overallScore: z.number(),
    totalReviews: z.number(),
    averageRating: z.number(),
    sentimentBreakdown: z.object({
      positive: z.number(),
      neutral: z.number(),
      negative: z.number(),
    }),
    reviewSources: z.array(z.object({
      platform: z.string(),
      count: z.number(),
      averageRating: z.number(),
    })),
    keyThemes: z.array(z.object({
      theme: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      mentions: z.number(),
      examples: z.array(z.string()),
    })),
    recentReviews: z.array(z.object({
      author: z.string(),
      rating: z.number(),
      text: z.string(),
      platform: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      date: z.string(),
    })),
    detailedReviews: z.array(z.object({
      reviewId: z.string(),
      reviewerName: z.string(),
      reviewerPhotoUrl: z.string().optional(),
      reviewerNumberOfReviews: z.number().optional(),
      isLocalGuide: z.boolean().optional(),
      rating: z.number(),
      text: z.string(),
      publishedAtDate: z.string(),
      likesCount: z.number().optional(),
      responseFromOwner: z.object({
        text: z.string(),
        publishedAtDate: z.string(),
      }).optional(),
      platform: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
    })).optional(),
    trends: z.object({
      ratingTrend: z.enum(['improving', 'stable', 'declining']),
      volumeTrend: z.enum(['increasing', 'stable', 'decreasing']),
      responseRate: z.number(),
      averageResponseTime: z.string(),
    }),
    recommendations: z.array(z.object({
      category: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      title: z.string(),
      description: z.string(),
      impact: z.string(),
    })),
    customerMoodAnalysis: z.object({
      overallMood: z.enum(['delighted', 'satisfied', 'mixed', 'frustrated', 'disappointed']),
      sentimentSummary: z.string(),
      keyMoodIndicators: z.array(z.string()),
      commonFeelings: z.object({
        positive: z.array(z.string()),
        negative: z.array(z.string()),
        neutral: z.array(z.string()),
      }),
      customerPatterns: z.object({
        frequentPraise: z.array(z.string()),
        commonComplaints: z.array(z.string()),
        surprisingInsights: z.array(z.string()),
      }),
      emotionalThemes: z.array(z.object({
        theme: z.string(),
        emotion: z.string(),
        frequency: z.number(),
        impact: z.enum(['high', 'medium', 'low']),
      })),
      businessInsights: z.object({
        strengthsPerceived: z.array(z.string()),
        improvementOpportunities: z.array(z.string()),
        customerExpectations: z.array(z.string()),
      }),
      recommendationConfidence: z.number(),
      loyaltySignals: z.object({
        repeatCustomerMentions: z.number(),
        recommendationLanguage: z.array(z.string()),
        disappointmentPatterns: z.array(z.string()),
      }),
    }).optional(),
  }).optional(),
  socialMediaLinks: z.object({
    facebook: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    twitter: z.string().nullable().optional(),
    youtube: z.string().nullable().optional(),
    tiktok: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    facebookVerified: z.boolean().optional(),
    facebookConfidence: z.enum(['low', 'high']).optional(),
    facebookSource: z.enum(['none', 'manual_override', 'website_scan']).optional(),
    facebookAnalysis: z.object({
      totalPosts: z.number(),
      averageEngagement: z.number(),
      engagementRate: z.number(),
      postingFrequency: z.string(),
      recentPosts: z.array(z.object({
        postId: z.string(),
        text: z.string(),
        timestamp: z.string(),
        likes: z.number(),
        shares: z.number(),
        comments: z.number(),
        postUrl: z.string(),
        mediaUrls: z.array(z.string()),
        postType: z.enum(['photo', 'video', 'text', 'link', 'other']),
      })),
      topPerformingPost: z.object({
        postId: z.string(),
        text: z.string(),
        timestamp: z.string(),
        likes: z.number(),
        shares: z.number(),
        comments: z.number(),
        postUrl: z.string(),
        mediaUrls: z.array(z.string()),
        postType: z.enum(['photo', 'video', 'text', 'link', 'other']),
      }).nullable(),
      contentTypes: z.object({
        photo: z.number(),
        video: z.number(),
        text: z.number(),
        link: z.number(),
        other: z.number(),
      }),
      postingPatterns: z.object({
        averagePostsPerWeek: z.number(),
        lastPostDate: z.string(),
        mostActiveDay: z.string(),
        mostActiveHour: z.string(),
      }),
    }).optional(),
  }).optional(),
  serpScreenshots: z.array(z.object({
    keyword: z.string(),
    location: z.string(),
    screenshotUrl: z.string(),
    restaurantRanking: z.object({
      position: z.number(),
      found: z.boolean(),
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    }).nullable(),
    totalResults: z.number(),
    searchUrl: z.string(),
    localPackPresent: z.boolean(),
    localPackResults: z.array(z.object({
      name: z.string(),
      rating: z.number(),
      reviews: z.number(),
      position: z.number(),
    })),
  })).optional(),
  restaurantSearchScreenshot: z.object({
    searchQuery: z.string(),
    screenshotBase64: z.string(),
    timestamp: z.string(),
    success: z.boolean(),
  }).nullable(),
});

// Activity schema
export const scanActivitySchema = z.object({
  id: z.number(),
  restaurantName: z.string(),
  location: z.string().nullable(),
  placeId: z.string().nullable(),
  domain: z.string().nullable(),
  action: z.string(),
  createdAt: z.string(),
});

export type RestaurantSearchResult = z.infer<typeof restaurantSearchResultSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;
export type ScanActivity = z.infer<typeof scanActivitySchema>;
