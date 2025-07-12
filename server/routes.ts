import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RestaurantService } from "./services/restaurantService";
import { AdvancedScannerService } from "./services/advancedScannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { JsonSanitizer } from "./utils/jsonSanitizer";
import { EnhancedDataForSeoService } from "./services/enhancedDataForSeoService";
import { z } from "zod";



export async function registerRoutes(app: Express): Promise<Server> {
  // API credentials with fallback priority
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  const DATAFOREO_LOGIN = process.env.DATAFORSEO_LOGIN || process.env.DATAFOREO_LOGIN;
  const DATAFOREO_PASSWORD = process.env.DATAFORSEO_PASSWORD || process.env.DATAFOREO_PASSWORD;
  const ZEMBRATECH_API_KEY = process.env.ZEMBRA_API || process.env.ZEMBRATECH_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.warn("GOOGLE_API_KEY not configured - restaurant search may not work");
  }

  if (!DATAFOREO_LOGIN || !DATAFOREO_PASSWORD) {
    console.warn("DataForSEO credentials not configured - advanced analysis may not work");
    console.warn("Expected: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables");
  }

  const restaurantService = new RestaurantService(GOOGLE_API_KEY || "");
  
  // DataForSEO scanner with Google Places for restaurant search and Zembratech for reviews
  let dataForSeoScannerService: AdvancedScannerService | null = null;
  if (GOOGLE_API_KEY && DATAFOREO_LOGIN && DATAFOREO_PASSWORD) {
    dataForSeoScannerService = new AdvancedScannerService(
      GOOGLE_API_KEY,
      "", // No PageSpeed API needed - using DataForSEO
      "", // No SERP API needed - using DataForSEO
      DATAFOREO_LOGIN,
      DATAFOREO_PASSWORD,
      ZEMBRATECH_API_KEY
    );
    console.log("DataForSEO scanner enabled with Google Places (restaurant search), DataForSEO (performance, keywords, SERP), and Zembratech (reviews)");
  } else {
    console.log("DataForSEO scanner disabled - requires GOOGLE_API_KEY, DATAFORSEO_LOGIN, and DATAFORSEO_PASSWORD");
  }

  // Google Business Profile scanner service
  const { GoogleBusinessService } = await import('./services/googleBusinessService.js');
  const googleBusinessService = new GoogleBusinessService(GOOGLE_API_KEY || "");

  // Restaurant search endpoint
  app.get("/api/restaurants/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      if (!GOOGLE_API_KEY) {
        return res.status(500).json({ 
          error: "Google Places API key not configured. Please configure API key to search restaurants." 
        });
      }

      const apiResults = await restaurantService.searchRestaurants(query);
      const results = apiResults.map(result => ({
        id: result.place_id,
        name: result.name,
        address: result.formatted_address,
        rating: result.rating,
        totalRatings: result.user_ratings_total,
        priceLevel: result.price_level,
        placeId: result.place_id,
        domain: result.website ? new URL(result.website).hostname : null,
        location: result.geometry?.location ? {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        } : null,
      }));

      res.json(results);
    } catch (error) {
      console.error("Restaurant search error:", error);
      res.status(500).json({ error: "Failed to search restaurants" });
    }
  });

  // Restaurant details endpoint
  app.get("/api/restaurants/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      
      if (!GOOGLE_API_KEY) {
        return res.status(500).json({ error: "Google API key not configured" });
      }

      const details = await restaurantService.getRestaurantDetails(placeId);
      res.json(details);
    } catch (error) {
      console.error("Restaurant details error:", error);
      res.status(500).json({ error: "Failed to get restaurant details" });
    }
  });

  // Legacy scan endpoint (disabled)
  app.post("/api/scan", async (req, res) => {
    return res.status(503).json({ 
      error: "Legacy scanning endpoint has been migrated to /api/scan/professional" 
    });
  });

  // Get scan history
  app.get("/api/scans/:domain", async (req, res) => {
    try {
      const { domain } = req.params;
      const scans = await storage.getScansByDomain(domain);
      res.json(scans);
    } catch (error) {
      console.error("Scan history error:", error);
      res.status(500).json({ error: "Failed to get scan history" });
    }
  });

  // Technical SEO audit endpoint
  app.post("/api/audit/technical", async (req, res) => {
    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      if (!DATAFOREO_LOGIN || !DATAFOREO_PASSWORD) {
        return res.status(500).json({ 
          error: "DataForSEO credentials not configured. Please configure API credentials for technical SEO audit." 
        });
      }

      const dataForSeoService = new EnhancedDataForSeoService(
        DATAFOREO_LOGIN,
        DATAFOREO_PASSWORD
      );

      const auditResult = await dataForSeoService.getTechnicalSeoAudit(domain);
      res.json(auditResult);
    } catch (error) {
      console.error("Technical SEO audit error:", error);
      res.status(500).json({ error: "Technical SEO audit failed" });
    }
  });

  // DataForSEO scan endpoint (Google Places, DataForSEO, Zembratech)
  app.post("/api/scan/professional", async (req, res) => {
    if (!dataForSeoScannerService) {
      return res.status(503).json({ 
        error: "DataForSEO scanning not available. Missing GOOGLE_API_KEY, DATAFOREO_LOGIN, or DATAFOREO_PASSWORD" 
      });
    }

    try {
      const { domain, restaurantName, placeId, latitude, longitude } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      // Set up Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      const scanResult = await dataForSeoScannerService.scanRestaurantAdvanced(
        placeId || '',
        domain,
        restaurantName || 'Unknown Restaurant',
        latitude || 0,
        longitude || 0,
        (progress) => {
          const progressJson = JsonSanitizer.safeStringify(progress);
          res.write(`data: ${progressJson}\n\n`);
        }
      );

      // Send completion message with debugging
      const completionEvent = {
        type: 'complete',
        result: scanResult
      };
      
      console.log('Scan result keywords length:', scanResult.keywords?.length || 0);
      console.log('Scan result structure:', Object.keys(scanResult));
      
      const completionMessage = JsonSanitizer.safeStringify(completionEvent);
      console.log('Completion message length:', completionMessage.length);
      console.log('Completion message valid:', JsonSanitizer.isValidJson(completionMessage));
      
      res.write(`data: ${completionMessage}\n\n`);
      res.end();
    } catch (error) {
      console.error("Professional scan error:", error);
      const errorMessage = JsonSanitizer.safeStringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Scan failed'
      });
      res.write(`data: ${errorMessage}\n\n`);
      res.end();
    }
  });

  // Google Business Profile scan endpoint
  app.post("/api/scan/google-business-profile", async (req, res) => {
    try {
      const { placeId } = req.body;
      
      if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
      }

      if (!GOOGLE_API_KEY) {
        return res.status(500).json({ 
          error: "Google Places API key not configured. Please configure API key to scan Google Business Profiles." 
        });
      }

      console.log('Starting Google Business Profile scan for place ID:', placeId);
      
      // Get comprehensive Google Business Profile data
      const businessProfile = await googleBusinessService.getBusinessProfile(placeId);
      
      // Enhanced profile analysis
      const profileAnalysis = {
        completeness: calculateProfileCompleteness(businessProfile),
        optimization: analyzeProfileOptimization(businessProfile),
        competitiveness: calculateCompetitiveScore(businessProfile),
        recommendations: generateProfileRecommendations(businessProfile),
        strengths: identifyProfileStrengths(businessProfile),
        weaknesses: identifyProfileWeaknesses(businessProfile)
      };

      const result = {
        profile: businessProfile,
        analysis: profileAnalysis,
        scanDate: new Date().toISOString(),
        scanType: 'google-business-profile'
      };

      return res.json(result);
      
    } catch (error) {
      console.error("Google Business Profile scan error:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Google Business Profile scan failed' 
      });
    }
  });

  // Legacy advanced scan endpoint (disabled)
  app.post("/api/scan/advanced", async (req, res) => {
    return res.status(503).json({ 
      error: "Advanced scanning endpoint has been migrated to /api/scan/professional" 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for Google Business Profile analysis
function calculateProfileCompleteness(profile: any): { score: number; missingElements: string[] } {
  const elements = [
    { key: 'name', weight: 10, present: !!profile.name },
    { key: 'phone', weight: 15, present: !!profile.phone },
    { key: 'website', weight: 20, present: !!profile.website },
    { key: 'photos', weight: 25, present: profile.photos?.total > 0 },
    { key: 'reviews', weight: 20, present: profile.totalReviews > 0 },
    { key: 'rating', weight: 10, present: profile.rating > 0 }
  ];

  const totalWeight = elements.reduce((sum, el) => sum + el.weight, 0);
  const completedWeight = elements.filter(el => el.present).reduce((sum, el) => sum + el.weight, 0);
  
  const score = Math.round((completedWeight / totalWeight) * 100);
  const missingElements = elements.filter(el => !el.present).map(el => el.key);

  return { score, missingElements };
}

function analyzeProfileOptimization(profile: any): { score: number; issues: string[] } {
  const issues = [];
  let score = 100;

  // Check photo quality and quantity
  if (profile.photos?.total < 5) {
    issues.push('Need more photos (minimum 5 recommended)');
    score -= 15;
  }

  // Note: Response rate data not available from Google Places API
  // This would need to be manually tracked or obtained from other sources

  // Check rating
  if (profile.rating < 4.0) {
    issues.push('Rating below 4.0 stars');
    score -= 25;
  }

  // Check review volume
  if (profile.totalReviews < 50) {
    issues.push('Low number of reviews');
    score -= 15;
  }

  return { score: Math.max(0, score), issues };
}

function calculateCompetitiveScore(profile: any): number {
  let score = 0;
  
  // Rating contribution (40%)
  score += (profile.rating / 5) * 40;
  
  // Review volume contribution (30%)
  const reviewScore = Math.min(profile.totalReviews / 100, 1) * 30;
  score += reviewScore;
  
  // Photo quality contribution (20%)
  const photoScore = Math.min(profile.photos?.total / 20, 1) * 20;
  score += photoScore;
  
  // Note: Response rate data not available from Google Places API
  // Skip response rate contribution to competitive score
  
  return Math.round(score);
}

function generateProfileRecommendations(profile: any): string[] {
  const recommendations = [];
  
  if (profile.photos?.total < 10) {
    recommendations.push('Add more high-quality photos of your food, interior, and exterior');
  }
  
  // Note: Response rate data not available from Google Places API
  // Consider adding review response tracking through other means
  
  if (profile.rating < 4.5) {
    recommendations.push('Focus on improving customer experience to boost ratings');
  }
  
  if (profile.totalReviews < 50) {
    recommendations.push('Encourage satisfied customers to leave reviews');
  }
  
  if (!profile.website) {
    recommendations.push('Add a website link to your business profile');
  }
  
  return recommendations;
}

function identifyProfileStrengths(profile: any): string[] {
  const strengths = [];
  
  if (profile.rating >= 4.5) {
    strengths.push('Excellent customer rating');
  }
  
  if (profile.totalReviews >= 100) {
    strengths.push('Strong review volume');
  }
  
  if (profile.photos?.total >= 15) {
    strengths.push('Good photo collection');
  }
  
  // Note: Response rate data not available from Google Places API
  
  if (profile.isVerified) {
    strengths.push('Verified business profile');
  }
  
  return strengths;
}

function identifyProfileWeaknesses(profile: any): string[] {
  const weaknesses = [];
  
  if (profile.rating < 4.0) {
    weaknesses.push('Low customer rating');
  }
  
  if (profile.totalReviews < 25) {
    weaknesses.push('Insufficient review volume');
  }
  
  if (profile.photos?.total < 5) {
    weaknesses.push('Limited photo content');
  }
  
  // Note: Response rate data not available from Google Places API
  
  if (!profile.website) {
    weaknesses.push('Missing website link');
  }
  
  return weaknesses;
}
