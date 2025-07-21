import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { RestaurantService } from "./services/restaurantService";
import { AdvancedScannerService } from "./services/advancedScannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { JsonSanitizer } from "./utils/jsonSanitizer";
import { EnhancedDataForSeoService } from "./services/enhancedDataForSeoService";
import { FunFactsService } from "./services/funFactsService";
import { RestaurantSearchScreenshotService } from "./services/restaurantSearchScreenshotService";
import screenshotsRouter from "./routes/screenshots";
import { z } from "zod";
import OpenAI from "openai";



export async function registerRoutes(app: Express): Promise<Server> {
  // API credentials with fallback priority
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
  const DATAFOREO_LOGIN = process.env.DATAFORSEO_LOGIN || process.env.DATAFOREO_LOGIN;
  const DATAFOREO_PASSWORD = process.env.DATAFORSEO_PASSWORD || process.env.DATAFOREO_PASSWORD;

  const APIFY_API_KEY = process.env.APIFY_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.warn("GOOGLE_API_KEY not configured - restaurant search may not work");
  }

  if (!DATAFOREO_LOGIN || !DATAFOREO_PASSWORD) {
    console.warn("DataForSEO credentials not configured - advanced analysis may not work");
    console.warn("Expected: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables");
  }

  const restaurantService = new RestaurantService(GOOGLE_API_KEY || "");
  
  // DataForSEO scanner with Google Places for restaurant search (no sentiment analysis to save costs)
  let dataForSeoScannerService: AdvancedScannerService | null = null;
  if (GOOGLE_API_KEY && DATAFOREO_LOGIN && DATAFOREO_PASSWORD) {
    dataForSeoScannerService = new AdvancedScannerService(
      GOOGLE_API_KEY,
      "", // No PageSpeed API needed - using DataForSEO
      "", // No SERP API needed - using DataForSEO
      DATAFOREO_LOGIN,
      DATAFOREO_PASSWORD,
      APIFY_API_KEY
    );
    console.log("DataForSEO scanner enabled with Google Places (restaurant search) and DataForSEO (performance, keywords, SERP) - sentiment analysis removed to save costs");
  } else {
    console.log("DataForSEO scanner disabled - requires GOOGLE_API_KEY, DATAFORSEO_LOGIN, and DATAFORSEO_PASSWORD");
  }

  // Google Business Profile scanner service
  const { GoogleBusinessService } = await import('./services/googleBusinessService.js');
  const googleBusinessService = new GoogleBusinessService(GOOGLE_API_KEY || "");
  
  // Fun facts service
  const funFactsService = new FunFactsService();
  
  // Restaurant search screenshot service
  const restaurantScreenshotService = new RestaurantSearchScreenshotService();

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
      const { domain, restaurantName, placeId, latitude, longitude, manualFacebookUrl } = req.body;
      
      console.log('📨 Professional scan request received:');
      console.log('  - domain:', domain);
      console.log('  - restaurantName:', restaurantName);  
      console.log('  - manualFacebookUrl:', manualFacebookUrl || 'NOT provided');
      
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
        },
        manualFacebookUrl
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

  // Restaurant search screenshot endpoint
  app.post("/api/screenshot/restaurant-search", async (req, res) => {
    try {
      const { placeId, restaurantName } = req.body;
      
      if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
      }
      
      if (!GOOGLE_API_KEY) {
        return res.status(500).json({ 
          error: "Google Places API key not configured. Please configure API key to capture restaurant search screenshots." 
        });
      }

      console.log('Starting restaurant search screenshot for place ID:', placeId);
      
      // Get business profile to extract cuisine type and location
      const businessProfile = await googleBusinessService.getBusinessProfile(placeId);
      
      // Extract cuisine type and location for search query
      const cuisineType = dataForSeoScannerService ? 
        (dataForSeoScannerService as any).extractCuisineType(businessProfile) : 
        'restaurant';
      
      const locationData = businessProfile?.address ? 
        (dataForSeoScannerService as any).extractCityFromAddress(businessProfile.address) : 
        { city: 'Unknown', state: 'Unknown' };

      console.log(`🔍 Capturing restaurant search screenshot for "${cuisineType}" in "${locationData.city}"`);
      
      // Capture screenshot
      const screenshotResult = await restaurantScreenshotService.searchWithCuisineType(
        cuisineType, 
        locationData.city
      );

      if (screenshotResult.success && screenshotResult.screenshotBase64) {
        const result = {
          searchQuery: `${cuisineType} ${locationData.city}`,
          screenshotBase64: screenshotResult.screenshotBase64,
          timestamp: screenshotResult.timestamp,
          success: true,
          screenshotSize: Math.round(screenshotResult.screenshotBase64.length / 1024) + 'KB'
        };
        
        console.log(`✅ Restaurant search screenshot captured: ${result.screenshotSize}`);
        return res.json(result);
      } else {
        console.log('❌ Restaurant search screenshot failed:', screenshotResult.error);
        return res.status(500).json({
          error: screenshotResult.error || 'Screenshot capture failed',
          success: false
        });
      }
      
    } catch (error) {
      console.error("Restaurant search screenshot error:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Restaurant search screenshot failed' 
      });
    }
  });

  // Legacy advanced scan endpoint (disabled)
  app.post("/api/scan/advanced", async (req, res) => {
    return res.status(503).json({ 
      error: "Advanced scanning endpoint has been migrated to /api/scan/professional" 
    });
  });

  // AI analyze performance endpoint
  app.post("/api/ai/analyze-performance", async (req, res) => {
    try {
      const { scanResult, restaurantName, scores } = req.body;
      
      // Use OpenAI to generate insightful explanations
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const systemPrompt = `You are a digital marketing expert analyzing restaurant performance data. Generate concise, personalized insights based on actual data. Each explanation should be 2-3 sentences that reference specific metrics and provide actionable context. Write in a professional yet friendly tone.`;
      
      const userPrompt = `Generate personalized explanations for ${restaurantName}'s performance scores. Return your response in JSON format with keys for each category:

      Search Score: ${scores.search}/100 (SEO: ${scanResult.seo}/100, Keywords: ${scanResult.keywordAnalysis?.targetKeywords?.length || 0})
      Social Score: ${scores.social}/100 (Platforms: ${Object.keys(scanResult.socialMediaLinks || {}).filter(k => scanResult.socialMediaLinks[k]).length})
      Local Score: ${scores.local}/100 (Rating: ${scanResult.businessProfile?.rating || 0}/5, Reviews: ${scanResult.businessProfile?.totalReviews || 0})
      Website Score: ${scores.website}/100 (Performance: ${scanResult.performance}/100, Mobile: ${scanResult.mobile}/100)
      Reviews Score: ${scores.reviews}/100 (Sentiment: ${scanResult.reviewsAnalysis?.sentiment?.positive || 0}% positive)
      
      For each category, explain what's working well or needs improvement based on the actual data. Return JSON with keys: search, social, local, website, reviews.`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      res.json({
        explanations: {
          search: result.search || `With an SEO score of ${scanResult.seo}/100 and ${scanResult.keywordAnalysis?.targetKeywords?.length || 0} keywords tracked, ${restaurantName} has room to improve search visibility. Focus on optimizing meta descriptions and building quality backlinks to compete better in local search results.`,
          social: result.social || `${restaurantName} currently has ${Object.keys(scanResult.socialMediaLinks || {}).filter(k => scanResult.socialMediaLinks[k]).length} active social platforms. ${scores.social >= 75 ? "Great social presence!" : "Consider expanding to Instagram and posting regular updates to engage with customers."}`,
          local: result.local || `With a ${scanResult.businessProfile?.rating || 0}/5 rating from ${scanResult.businessProfile?.totalReviews || 0} reviews, ${restaurantName} ${scores.local >= 75 ? "shows strong local presence" : "needs to focus on reputation management"}. ${scanResult.businessProfile?.isVerified ? "Being verified helps credibility." : "Verify your listing to boost trust."}`,
          website: result.website || `Your website scores ${scanResult.performance}/100 for speed and ${scanResult.mobile}/100 for mobile experience. ${scores.website >= 75 ? "Performance is solid" : "Improving load times will reduce bounce rates"} and directly impact customer conversions.`,
          reviews: result.reviews || `With ${scanResult.reviewsAnalysis?.sentiment?.positive || 0}% positive sentiment across ${scanResult.businessProfile?.totalReviews || 0} reviews, ${restaurantName} ${scores.reviews >= 75 ? "maintains excellent reputation" : "has opportunities to improve customer satisfaction"}. Responding to reviews shows you care about feedback.`
        }
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      
      // Fallback explanations if AI fails
      res.json({
        explanations: {
          search: `Your SEO score of ${req.body.scanResult.seo}/100 indicates opportunities to improve search visibility. Focus on local keywords and optimizing your Google Business Profile to attract more nearby customers.`,
          social: `You're active on ${Object.keys(req.body.scanResult.socialMediaLinks || {}).filter(k => req.body.scanResult.socialMediaLinks[k]).length} social platforms. Regular posting and customer engagement on Facebook and Instagram can significantly boost your online presence.`,
          local: `With ${req.body.scanResult.businessProfile?.totalReviews || 0} reviews and a ${req.body.scanResult.businessProfile?.rating || 0}/5 rating, you're building local trust. Keep encouraging satisfied customers to leave reviews and respond promptly to all feedback.`,
          website: `Your website performance score of ${req.body.scanResult.performance}/100 affects customer experience. Optimizing images and improving mobile responsiveness will help convert more visitors into customers.`,
          reviews: `Customer sentiment is ${req.body.scanResult.reviewsAnalysis?.sentiment?.positive || 0}% positive. Maintaining high review scores and addressing concerns quickly strengthens your reputation and attracts new diners.`
        }
      });
    }
  });

  // Fun facts endpoint
  app.get("/api/fun-facts", async (req, res) => {
    try {
      const { city, restaurant, placeId } = req.query;
      
      if (!restaurant) {
        return res.status(400).json({ error: "Restaurant name is required" });
      }
      
      let actualCity = city as string;
      let actualRestaurant = restaurant as string;
      
      // If placeId is provided, get the actual business profile data
      if (placeId && GOOGLE_API_KEY) {
        try {
          console.log('Fetching business profile for fun facts with placeId:', placeId);
          const businessProfile = await googleBusinessService.getBusinessProfile(placeId as string);
          console.log('Business profile received:', {
            name: businessProfile?.name,
            address: businessProfile?.address,
            originalCity: city,
            originalRestaurant: restaurant
          });
          
          if (businessProfile) {
            actualRestaurant = businessProfile.name || restaurant as string;
            // Extract city from business profile address
            if (businessProfile.address) {
              console.log('Extracting city from address:', businessProfile.address);
              // Try multiple patterns to extract city
              const cityPatterns = [
                /,\s*([^,]+),\s*[A-Z]{2}/,  // Standard format: "123 Main St, City, ST 12345"
                /,\s*([^,]+)\s+[A-Z]{2}\s+\d{5}/,  // "123 Main St, City ST 12345" 
                /,\s*([^,\d]+),/,  // "123 Main St, City, ..." (no state)
                /,\s*([A-Za-z\s]+),\s*[A-Z]{2}/  // More flexible city pattern
              ];
              
              let cityFound = false;
              for (const pattern of cityPatterns) {
                const cityMatch = businessProfile.address.match(pattern);
                if (cityMatch && cityMatch[1]) {
                  actualCity = cityMatch[1].trim();
                  console.log('Extracted city:', actualCity);
                  cityFound = true;
                  break;
                }
              }
              
              if (!cityFound) {
                console.log('No city match found in address:', businessProfile.address);
              }
            } else {
              console.log('No address found in business profile');
            }
          } else {
            console.log('No business profile returned');
          }
        } catch (error) {
          console.error('Error fetching business profile for fun facts:', error);
        }
      } else {
        console.log('No placeId or Google API key available:', { 
          placeId: !!placeId, 
          googleApiKey: !!GOOGLE_API_KEY,
          actualApiKey: GOOGLE_API_KEY?.substring(0, 10) + '...' || 'undefined'
        });
      }
      
      console.log('Generating fun facts for:', { actualCity, actualRestaurant, originalCity: city, originalRestaurant: restaurant });
      const funFacts = await funFactsService.generateFunFacts(actualCity, actualRestaurant);
      console.log('Generated fun facts:', funFacts);
      res.json({ 
        facts: funFacts,
        actualCity: actualCity,
        actualRestaurant: actualRestaurant
      });
    } catch (error) {
      console.error('Error generating fun facts:', error);
      res.status(500).json({ error: "Failed to generate fun facts" });
    }
  });

  // Restaurant search screenshot endpoint  
  app.post("/api/screenshot/restaurant-search", async (req, res) => {
    try {
      const { searchQuery, location, cuisineType } = req.body;
      
      let result;
      if (cuisineType && location) {
        result = await restaurantScreenshotService.searchWithCuisineType(cuisineType, location);
      } else if (location) {
        result = await restaurantScreenshotService.searchWithCustomLocation(location);
      } else if (searchQuery) {
        result = await restaurantScreenshotService.searchRestaurantsAndScreenshot(searchQuery);
      } else {
        result = await restaurantScreenshotService.searchRestaurantsAndScreenshot();
      }
      
      res.json(result);
    } catch (error) {
      console.error("Restaurant search screenshot error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to capture restaurant search screenshot",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Add screenshots API routes
  app.use('/api/screenshots', screenshotsRouter);

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
  
  // Updated review volume recommendations based on new ranges
  const reviewCount = profile.totalReviews || 0;
  if (reviewCount < 250) {
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
  
  // Updated review volume categories: 750+ excellent, 501-750 great, 250-500 good, 0-250 okay
  const reviewCount = profile.totalReviews || 0;
  if (reviewCount >= 750) {
    strengths.push('Excellent review volume');
  } else if (reviewCount >= 501) {
    strengths.push('Great review volume');
  } else if (reviewCount >= 250) {
    strengths.push('Good review volume');
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
