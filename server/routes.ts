import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RestaurantService } from "./services/restaurantService";
import { ScannerService } from "./services/scannerService";
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
  // Get API keys from environment variables
  const googlePlacesApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  const pagespeedApiKey = process.env.PAGESPEED_API_KEY;
  const serpApiKey = process.env.SERP_API_KEY;

  if (!googlePlacesApiKey) {
    console.warn("GOOGLE_API_KEY not configured - restaurant search may not work");
  }

  const restaurantService = new RestaurantService(googlePlacesApiKey || "");
  const scannerService = new ScannerService(pagespeedApiKey, serpApiKey, googlePlacesApiKey);

  // Restaurant search endpoint
  app.get("/api/restaurants/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      let results;
      
      // Try Google Places API first, fallback to mock data if it fails
      if (googlePlacesApiKey) {
        try {
          const apiResults = await restaurantService.searchRestaurants(query);
          results = apiResults.map(result => ({
            id: result.place_id,
            name: result.name,
            address: result.formatted_address,
            rating: result.rating,
            totalRatings: result.user_ratings_total,
            priceLevel: result.price_level,
            placeId: result.place_id,
          }));
        } catch (apiError) {
          console.warn("Google Places API failed, using mock data:", apiError);
          results = getMockRestaurants(query);
        }
      } else {
        results = getMockRestaurants(query);
      }

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
