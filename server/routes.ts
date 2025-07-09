import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RestaurantService } from "./services/restaurantService";
import { AdvancedScannerService } from "./services/advancedScannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { JsonSanitizer } from "./utils/jsonSanitizer";
import { z } from "zod";



export async function registerRoutes(app: Express): Promise<Server> {
  // API credentials
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  const DATAFOREO_LOGIN = process.env.DATAFOREO_LOGIN;
  const DATAFOREO_PASSWORD = process.env.DATAFOREO_PASSWORD;
  const ZEMBRATECH_API_KEY = process.env.ZEMBRATECH_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.warn("GOOGLE_API_KEY not configured - restaurant search may not work");
  }

  if (!DATAFOREO_LOGIN || !DATAFOREO_PASSWORD) {
    console.warn("DataForSEO credentials not configured - advanced analysis may not work");
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
    console.log("DataForSEO scanner disabled - requires GOOGLE_API_KEY, DATAFOREO_LOGIN, and DATAFOREO_PASSWORD");
  }

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

      // Send completion message
      const completionMessage = JsonSanitizer.safeStringify({
        type: 'complete',
        result: scanResult
      });
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

  // Legacy advanced scan endpoint (disabled)
  app.post("/api/scan/advanced", async (req, res) => {
    return res.status(503).json({ 
      error: "Advanced scanning endpoint has been migrated to /api/scan/professional" 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
