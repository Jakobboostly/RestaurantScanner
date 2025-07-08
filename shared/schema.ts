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
});

export const scanResultSchema = z.object({
  domain: z.string(),
  overallScore: z.number(),
  performanceScore: z.number(),
  seoScore: z.number(),
  mobileScore: z.number(),
  userExperienceScore: z.number(),
  issues: z.array(z.object({
    type: z.enum(['critical', 'warning', 'info']),
    category: z.string(),
    title: z.string(),
    description: z.string(),
    impact: z.string(),
  })),
  recommendations: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    title: z.string(),
    description: z.string(),
    impact: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
  })),
  competitorData: z.array(z.object({
    name: z.string(),
    score: z.number(),
    isYou: z.boolean().optional(),
  })).optional(),
  screenshot: z.string().optional(),
  seoAnalysis: z.object({
    title: z.string(),
    description: z.string(),
    h1Tags: z.array(z.string()),
    imageAltTags: z.number(),
    totalImages: z.number(),
    internalLinks: z.number(),
    externalLinks: z.number(),
    hasSchema: z.boolean(),
  }).optional(),
});

export type RestaurantSearchResult = z.infer<typeof restaurantSearchResultSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;
