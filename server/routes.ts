import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RestaurantService } from "./services/restaurantService";
import { DataForSeoScannerService } from "./services/dataForSeoScannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { z } from "zod";



export async function registerRoutes(app: Express): Promise<Server> {
  // API credentials
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  const DATAFORSEO_LOGIN = "jakob@boostly.com";
  const DATAFORSEO_PASSWORD = "eba05fd94be85e56";

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("GOOGLE_PLACES_API_KEY not configured - restaurant search may not work");
  }

  const restaurantService = new RestaurantService(GOOGLE_PLACES_API_KEY || "");
  const scannerService = new DataForSeoScannerService(DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD);

  // Restaurant search endpoint
  app.get("/api/restaurants/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      if (!GOOGLE_PLACES_API_KEY) {
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
      
      if (!GOOGLE_PLACES_API_KEY) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      const details = await restaurantService.getRestaurantDetails(placeId);
      res.json(details);
    } catch (error) {
      console.error("Restaurant details error:", error);
      res.status(500).json({ error: "Failed to get restaurant details" });
    }
  });

  // Website scan endpoint
  app.post("/api/scan", async (req, res) => {
    try {
      const { domain, restaurantName, placeId, latitude, longitude } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      if (!restaurantName) {
        return res.status(400).json({ error: "Restaurant name is required" });
      }

      // Set up SSE for progress updates
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const scanResult = await scannerService.scanWebsite(
        domain,
        restaurantName,
        (progress) => {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        },
        latitude,
        longitude
      );

      // Send final result
      res.write(`data: ${JSON.stringify({ type: 'complete', result: scanResult })}\n\n`);
      res.end();

      // Store scan result in database
      if (placeId) {
        let restaurant = await storage.getRestaurantByPlaceId(placeId);
        if (!restaurant) {
          restaurant = await storage.createRestaurant({
            name: restaurantName,
            address: "",
            placeId,
            domain,
            rating: null,
            totalRatings: null,
            priceLevel: null,
          });
        }

        await storage.createScan({
          restaurantId: restaurant.id,
          domain: scanResult.domain,
          overallScore: scanResult.overallScore,
          performanceScore: scanResult.performanceScore,
          seoScore: scanResult.seoScore,
          mobileScore: scanResult.mobileScore,
          userExperienceScore: scanResult.userExperienceScore,
          issues: scanResult.issues,
          recommendations: scanResult.recommendations,
          competitorData: scanResult.competitorData,
        });
      }
    } catch (error) {
      console.error("Website scan error:", error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to scan website' })}\n\n`);
      res.end();
    }
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

  const httpServer = createServer(app);
  return httpServer;
}
