import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DataForSeoRestaurantService } from "./services/dataForSeoRestaurantService";
import { DataForSeoScannerService } from "./services/dataForSeoScannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { z } from "zod";

function getMockRestaurants(query: string) {
  const allRestaurants = [
    {
      id: "mock-1",
      name: "Joe's Pizza",
      address: "123 Main St, New York, NY 10001",
      rating: 4.5,
      totalRatings: 1247,
      priceLevel: 2,
      placeId: "mock-place-1",
      domain: "joespizzanyc.com"
    },
    {
      id: "mock-2", 
      name: "The French Laundry",
      address: "6640 Washington St, Yountville, CA 94599",
      rating: 4.7,
      totalRatings: 3421,
      priceLevel: 4,
      placeId: "mock-place-2",
      domain: "thomaskeller.com"
    },
    {
      id: "mock-3",
      name: "Taco Bell",
      address: "456 Broadway, Los Angeles, CA 90012",
      rating: 3.8,
      totalRatings: 892,
      priceLevel: 1,
      placeId: "mock-place-3", 
      domain: "tacobell.com"
    },
    {
      id: "mock-4",
      name: "Olive Garden",
      address: "789 Oak Ave, Chicago, IL 60601",
      rating: 4.1,
      totalRatings: 2156,
      priceLevel: 2,
      placeId: "mock-place-4",
      domain: "olivegarden.com"
    },
    {
      id: "mock-5",
      name: "McDonald's",
      address: "321 Pine St, Miami, FL 33101", 
      rating: 3.6,
      totalRatings: 1834,
      priceLevel: 1,
      placeId: "mock-place-5",
      domain: "mcdonalds.com"
    }
  ];

  return allRestaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // DataForSEO credentials
  const DATAFORSEO_LOGIN = "jakob@boostly.com";
  const DATAFORSEO_PASSWORD = "eba05fd94be85e56";

  const restaurantService = new DataForSeoRestaurantService(DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD);
  const scannerService = new DataForSeoScannerService(DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD);

  // Restaurant search endpoint
  app.get("/api/restaurants/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await restaurantService.searchRestaurants(query);
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
