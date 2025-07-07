import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RestaurantService } from "./services/restaurantService";
import { ScannerService } from "./services/scannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get API keys from environment variables
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const pagespeedApiKey = process.env.PAGESPEED_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;

  if (!googlePlacesApiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not configured - restaurant search may not work");
  }

  const restaurantService = new RestaurantService(googlePlacesApiKey || "");
  const scannerService = new ScannerService(pagespeedApiKey, serpApiKey);

  // Restaurant search endpoint
  app.get("/api/restaurants/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      if (!googlePlacesApiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      const results = await restaurantService.searchRestaurants(query);
      
      const formattedResults = results.map(result => ({
        id: result.place_id,
        name: result.name,
        address: result.formatted_address,
        rating: result.rating,
        totalRatings: result.user_ratings_total,
        priceLevel: result.price_level,
        placeId: result.place_id,
      }));

      res.json(formattedResults);
    } catch (error) {
      console.error("Restaurant search error:", error);
      res.status(500).json({ error: "Failed to search restaurants" });
    }
  });

  // Restaurant details endpoint
  app.get("/api/restaurants/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      
      if (!googlePlacesApiKey) {
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
      const { domain, restaurantName, placeId } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      if (!restaurantName) {
        return res.status(400).json({ error: "Restaurant name is required" });
      }

      if (!pagespeedApiKey) {
        return res.status(500).json({ error: "PageSpeed API key not configured" });
      }

      if (!serpApiKey) {
        return res.status(500).json({ error: "SERP API key not configured" });
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
        }
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
