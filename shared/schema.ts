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

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  createdAt: true,
});

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;

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
  })),
  competitors: z.array(z.object({
    name: z.string(),
    domain: z.string(),
    performance: z.number(),
    seo: z.number(),
    accessibility: z.number(),
    bestPractices: z.number(),
    overallScore: z.number(),
    isYou: z.boolean(),
  })),
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
  domainAuthority: z.number(),
  backlinks: z.number(),
  organicTraffic: z.number(),
  scanDate: z.string(),
  businessProfile: z.object({
    name: z.string(),
    rating: z.number(),
    totalReviews: z.number(),
    photos: z.object({
      total: z.number(),
      quality: z.enum(['excellent', 'good', 'fair', 'poor']),
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
});

export type RestaurantSearchResult = z.infer<typeof restaurantSearchResultSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;
