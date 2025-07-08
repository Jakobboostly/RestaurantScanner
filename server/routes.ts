import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RestaurantService } from "./services/restaurantService";
import { FocusedScannerService } from "./services/focusedScannerService";
import { AdvancedScannerService } from "./services/advancedScannerService";
import { ProfessionalScannerService } from "./services/professionalScannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { JsonSanitizer } from "./utils/jsonSanitizer";
import { z } from "zod";



export async function registerRoutes(app: Express): Promise<Server> {
  // API credentials
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY;
  const SERP_API_KEY = process.env.SERP_API_KEY;
  const DATAFOREO_LOGIN = process.env.DATAFOREO_LOGIN;
  const DATAFOREO_PASSWORD = process.env.DATAFOREO_PASSWORD;

  if (!GOOGLE_API_KEY) {
    console.warn("GOOGLE_API_KEY not configured - restaurant search and analysis may not work");
  }

  if (!PAGESPEED_API_KEY) {
    console.warn("PAGESPEED_API_KEY not configured - performance analysis may not work");
  }

  const restaurantService = new RestaurantService(GOOGLE_API_KEY || "");
  const ZEMBRATECH_API_KEY = process.env.ZEMBRATECH_API_KEY;
  const scannerService = new FocusedScannerService(GOOGLE_API_KEY || "", PAGESPEED_API_KEY || "", ZEMBRATECH_API_KEY);
  
  // Professional scanner with Google Places, Lighthouse, SERP, and Puppeteer
  let professionalScannerService: ProfessionalScannerService | null = null;
  if (GOOGLE_API_KEY && SERP_API_KEY && PAGESPEED_API_KEY) {
    professionalScannerService = new ProfessionalScannerService(
      GOOGLE_API_KEY,
      SERP_API_KEY,
      PAGESPEED_API_KEY
    );
    console.log("Professional scanner enabled with Google Places, Lighthouse, SERP, and Puppeteer");
  } else {
    console.log("Professional scanner disabled - requires GOOGLE_API_KEY, SERP_API_KEY, and PAGESPEED_API_KEY");
  }
  
  // Advanced scanner with SEO intelligence (if credentials available)
  let advancedScannerService: AdvancedScannerService | null = null;
  if (SERP_API_KEY && DATAFOREO_LOGIN && DATAFOREO_PASSWORD) {
    advancedScannerService = new AdvancedScannerService(
      GOOGLE_API_KEY || "",
      PAGESPEED_API_KEY || "",
      SERP_API_KEY,
      DATAFOREO_LOGIN,
      DATAFOREO_PASSWORD
    );
    console.log("Advanced scanner with SEO intelligence enabled");
  } else {
    console.log("Advanced scanner disabled - requires SERP_API_KEY, DATAFOREO_LOGIN, and DATAFOREO_PASSWORD");
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

      const scanResult = await scannerService.scanRestaurant(
        placeId,
        domain,
        restaurantName,
        latitude || 0,
        longitude || 0,
        (progress) => {
          const jsonString = JsonSanitizer.safeStringify(progress);
          if (JsonSanitizer.isValidJson(jsonString)) {
            res.write(`data: ${jsonString}\n\n`);
          } else {
            console.error('Invalid JSON in progress update:', jsonString);
            res.write(`data: ${JsonSanitizer.safeStringify({ progress: 0, status: 'Processing...' })}\n\n`);
          }
        }
      );

      // Send final result with robust JSON sanitization
      const finalResult = { type: 'complete', result: scanResult };
      const jsonString = JsonSanitizer.safeStringify(finalResult);
      if (JsonSanitizer.isValidJson(jsonString)) {
        res.write(`data: ${jsonString}\n\n`);
      } else {
        console.error('Failed to serialize final scan result');
        res.write(`data: ${JsonSanitizer.safeStringify({ type: 'error', error: 'Failed to serialize scan result' })}\n\n`);
      }
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
      const errorMsg = JsonSanitizer.safeStringify({ type: 'error', error: 'Failed to scan website' });
      res.write(`data: ${errorMsg}\n\n`);
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

  // Professional scan endpoint (Google Places, Lighthouse, SERP, Puppeteer)
  app.post("/api/scan/professional", async (req, res) => {
    if (!professionalScannerService) {
      return res.status(503).json({ 
        error: "Professional scanning not available. Missing GOOGLE_API_KEY, SERP_API_KEY, or PAGESPEED_API_KEY" 
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

      const scanResult = await professionalScannerService.scanRestaurantProfessional(
        domain,
        restaurantName || 'Unknown Restaurant',
        placeId || '',
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

  // Advanced scan endpoint with SEO intelligence
  app.post("/api/scan/advanced", async (req, res) => {
    if (!advancedScannerService) {
      return res.status(503).json({ 
        error: "Advanced scanning not available - requires SERP_API_KEY and DataForSEO credentials" 
      });
    }

    try {
      const { domain, restaurantName, placeId, latitude, longitude } = req.body;
      
      if (!domain || !restaurantName) {
        return res.status(400).json({ error: "Domain and restaurant name are required" });
      }

      // Set up SSE response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send initial progress
      res.write(`data: ${JSON.stringify({ type: 'progress', progress: 0, status: 'Starting advanced analysis...' })}\n\n`);

      // Run advanced scan
      const scanResult = await advancedScannerService.scanRestaurantAdvanced(
        placeId,
        domain,
        restaurantName,
        latitude || 0,
        longitude || 0,
        (progress) => {
          const jsonString = JsonSanitizer.safeStringify(progress);
          if (JsonSanitizer.isValidJson(jsonString)) {
            res.write(`data: ${jsonString}\n\n`);
          } else {
            console.error('Invalid JSON in advanced progress update:', jsonString);
            res.write(`data: ${JsonSanitizer.safeStringify({ progress: 0, status: 'Processing...' })}\n\n`);
          }
        }
      );

      // Send final result with robust JSON sanitization
      const finalResult = { type: 'complete', result: scanResult };
      const jsonString = JsonSanitizer.safeStringify(finalResult);
      if (JsonSanitizer.isValidJson(jsonString)) {
        res.write(`data: ${jsonString}\n\n`);
      } else {
        console.error('Failed to serialize advanced scan result');
        res.write(`data: ${JsonSanitizer.safeStringify({ type: 'error', error: 'Failed to serialize advanced scan result' })}\n\n`);
      }
      res.end();

      // Store enhanced scan result in database
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
          performanceScore: scanResult.performance,
          seoScore: scanResult.seo,
          mobileScore: scanResult.mobile,
          userExperienceScore: scanResult.userExperience,
          issues: JSON.stringify(scanResult.issues),
          recommendations: JSON.stringify(scanResult.recommendations),
          keywords: JSON.stringify(scanResult.keywords),
          competitors: JSON.stringify(scanResult.competitors),
          scanDate: new Date().toISOString(),
        });
      }

    } catch (error) {
      console.error("Advanced scan error:", error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Advanced scan failed' })}\n\n`);
      res.end();
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
