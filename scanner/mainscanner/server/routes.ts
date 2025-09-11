import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { fullScanResults } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { RestaurantService } from "./services/restaurantService";
import { AdvancedScannerService } from "./services/advancedScannerService";
import { restaurantSearchResultSchema, scanResultSchema } from "@shared/schema";
import { JsonSanitizer } from "./utils/jsonSanitizer";
import { EnhancedDataForSeoService } from "./services/enhancedDataForSeoService";
import { FunFactsService } from "./services/funFactsService";
import { WebhookExportService } from "./services/webhookExportService";
import { scanCacheService } from "./services/scanCacheService";
import { SearchVolumeService } from "./services/searchVolumeService";
import { GoogleBusinessService } from "./services/googleBusinessService";
import { z } from "zod";
import OpenAI from "openai";



export async function registerRoutes(app: Express): Promise<Server> {
  // API credentials with fallback priority
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  const DATAFOREO_LOGIN = process.env.DATAFORSEO_LOGIN;
  const DATAFOREO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

  const APIFY_API_KEY = process.env.APIFY_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.warn("GOOGLE_PLACES_API_KEY not configured - restaurant search may not work");
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
    console.log("DataForSEO scanner enabled with Google Places (restaurant search), DataForSEO (performance, keywords, SERP), and OpenAI sentiment analysis");
  } else {
    console.log("DataForSEO scanner disabled - requires GOOGLE_PLACES_API_KEY, DATAFORSEO_LOGIN, and DATAFORSEO_PASSWORD");
  }

  // Google Business Profile scanner service
  const googleBusinessService = new GoogleBusinessService(GOOGLE_API_KEY || "");

  // Search Volume Service
  let searchVolumeService: SearchVolumeService | null = null;
  if (DATAFOREO_LOGIN && DATAFOREO_PASSWORD) {
    searchVolumeService = new SearchVolumeService(DATAFOREO_LOGIN, DATAFOREO_PASSWORD);
    console.log("Search Volume Service enabled with DataForSEO credentials");
  } else {
    console.log("Search Volume Service disabled - requires DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD");
  }
  
  // Fun facts service
  const funFactsService = new FunFactsService();
  

  // In-memory store for mood analysis results
  const moodAnalysisCache = new Map<string, any>();

  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "Server is working!" });
  });

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
        location: (result as any).geometry?.location ? {
          lat: (result as any).geometry.location.lat,
          lng: (result as any).geometry.location.lng
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
        error: "DataForSEO scanning not available. Missing GOOGLE_PLACES_API_KEY, DATAFOREO_LOGIN, or DATAFOREO_PASSWORD" 
      });
    }

    try {
      const { domain, restaurantName, placeId, latitude, longitude, manualFacebookUrl, forceRefresh } = req.body;
      
      console.log('📨 Professional scan request received:');
      console.log('  - domain:', domain);
      console.log('  - restaurantName:', restaurantName);  
      console.log('  - placeId:', placeId);
      console.log('  - forceRefresh:', forceRefresh || false);
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

      // Check cache first if placeId is provided and forceRefresh is not true
      if (placeId && !forceRefresh) {
        const cachedResult = await scanCacheService.getCachedScan(placeId);
        
        if (cachedResult) {
          console.log(`📦 Returning cached scan for ${restaurantName} (${placeId})`);
          
          // Send cached result immediately
          const progressMessage = {
            type: 'progress',
            message: 'Loading cached results...',
            percentage: 100
          };
          res.write(`data: ${JsonSanitizer.safeStringify(progressMessage)}\n\n`);
          
          // Send completion with cached data
          const completionEvent = {
            type: 'complete',
            result: cachedResult,
            cached: true
          };
          res.write(`data: ${JsonSanitizer.safeStringify(completionEvent)}\n\n`);
          res.end();
          return;
        }
      }

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

      // Cache the scan result if placeId is available
      if (placeId) {
        await scanCacheService.cacheScan(placeId, scanResult);
        console.log(`💾 Cached scan results for ${restaurantName} (${placeId})`);
      }



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
      
      // Send webhook if configured (wrapped in try-catch to prevent scan failure)
      if (process.env.WEBHOOK_URL) {
        try {
          console.log('🪝 Webhook URL configured, preparing to send scan results...');
          
          const webhookConfig = {
            url: process.env.WEBHOOK_URL,
            secret: process.env.WEBHOOK_SECRET,
            timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000'),
            retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
            enableFileBackup: process.env.WEBHOOK_ENABLE_FILE_BACKUP === 'true'
          };
          
          const webhookService = new WebhookExportService(webhookConfig);
          
          // Send webhook asynchronously to not block the response
          setImmediate(() => {
            webhookService.sendWebhook(scanResult).then((success) => {
              if (success) {
                console.log('✅ Webhook sent successfully');
              } else {
                console.error('❌ Webhook failed after all retry attempts');
              }
            }).catch((error) => {
              console.error('💥 Webhook error:', error);
            });
          });
          
        } catch (error) {
          console.error('⚠️ Webhook setup error (scan continues):', error);
        }
      } else {
        console.log('ℹ️ No webhook URL configured (WEBHOOK_URL not set)');
      }
      
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

  // AI-powered recommendations endpoint
  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { category, priority, score, restaurantName, cuisine, location, specificData } = req.body;
      
      // Import the AI recommendation engine
      const { AIRecommendationEngine } = await import('./services/aiRecommendationEngine.js');
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured - using fallback recommendations');
        const engine = new AIRecommendationEngine('');
        const fallback = await engine.generateRecommendations({
          category,
          priority,
          score,
          restaurantName,
          cuisine,
          location,
          specificData
        });
        return res.json(fallback);
      }

      const engine = new AIRecommendationEngine(process.env.OPENAI_API_KEY);
      const recommendations = await engine.generateRecommendations({
        category,
        priority,
        score,
        restaurantName,
        cuisine,
        location,
        specificData
      });

      res.json(recommendations);
    } catch (error) {
      console.error('AI recommendations error:', error);
      
      // Return fallback recommendations
      res.json({
        recommendations: [
          `Improve ${req.body.category} performance with targeted optimization`,
          `Focus on local market presence and customer engagement`,
          `Implement consistent marketing strategies across all channels`,
          `Monitor competitor activities and adapt accordingly`
        ],
        context: `${req.body.priority} priority improvements needed for better ${req.body.category} performance.`,
        urgency: req.body.priority === 'high' ? 'critical' : req.body.priority === 'medium' ? 'important' : 'optimize'
      });
    }
  });

  // Mood analysis endpoint
  app.get("/api/mood-analysis/:placeId", async (req, res) => {
    try {
      const placeId = req.params.placeId;
      
      // Analysis not ready yet
      return res.json({ 
        status: 'generating',
        message: 'Generating your review analysis...' 
      });
      
    } catch (error) {
      console.error('Mood analysis endpoint error:', error);
      return res.status(500).json({ 
        error: 'Failed to get mood analysis status' 
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
      
      // Extract state from business profile if available
      let actualState = '';
      if (placeId && GOOGLE_API_KEY) {
        try {
          console.log('Fetching business profile for state extraction with placeId:', placeId);
          const businessProfile = await googleBusinessService.getBusinessProfile(placeId as string);
          actualState = businessProfile.state || '';
          console.log('Extracted state from business profile:', actualState);
        } catch (error) {
          console.error('Could not get state from business profile:', error);
        }
      }
      
      console.log('Generating fun facts for:', { actualCity, actualRestaurant, actualState, originalCity: city, originalRestaurant: restaurant });
      const funFacts = await funFactsService.generateFunFacts(actualCity, actualRestaurant, actualState);
      console.log('Generated fun facts:', funFacts);
      res.json({ 
        facts: funFacts,
        actualCity: actualCity,
        actualRestaurant: actualRestaurant,
        actualState: actualState
      });
    } catch (error) {
      console.error('Error generating fun facts:', error);
      res.status(500).json({ error: "Failed to generate fun facts" });
    }
  });



  // Test endpoint for Apify reviews service
  app.get("/api/test/apify-reviews/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      
      if (!APIFY_API_KEY) {
        return res.status(500).json({ 
          error: "Apify API key not configured. Please add APIFY_API_KEY environment variable." 
        });
      }

      if (!dataForSeoScannerService) {
        return res.status(500).json({ 
          error: "Scanner service not available. Please configure required API keys." 
        });
      }

      // Use the scanner service's apify reviews service
      const apifyService = (dataForSeoScannerService as any).apifyReviewsService;
      if (!apifyService) {
        return res.status(500).json({ 
          error: "Apify reviews service not available in scanner." 
        });
      }

      console.log(`Testing Apify reviews service for place: ${placeId}`);
      const result = await apifyService.getGoogleReviews(placeId);
      
      res.json({
        success: result.success,
        reviewCount: result.success ? result.data?.length || 0 : 0,
        metadata: result.metadata,
        socialMedia: result.socialMedia,
        contacts: result.contacts,
        sampleReviews: result.success && result.data ? result.data.slice(0, 3) : [],
        error: result.success ? null : result.error
      });
    } catch (error) {
      console.error("Apify reviews test error:", error);
      res.status(500).json({ 
        error: "Failed to test Apify reviews service", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // MCP integration endpoints (disabled - service not available)
  // Keyword search tool - gets top 5 rankings for any keyword
  app.post("/api/keyword-search", async (req, res) => {
    console.log('🔍 KEYWORD SEARCH API: Route hit!');
    console.log('🔍 Request body:', req.body);
    
    try {
      const { keyword, location, city, state } = req.body;
      
      if (!keyword) {
        console.log('❌ KEYWORD SEARCH: No keyword provided');
        return res.status(400).json({ error: "Keyword is required" });
      }
      
      if (!DATAFOREO_LOGIN || !DATAFOREO_PASSWORD) {
        console.log('❌ KEYWORD SEARCH: DataForSEO credentials missing');
        return res.status(503).json({ error: "DataForSEO credentials not configured" });
      }
      
      // Format location as "City,State,United States" to match restaurant scan format (no spaces)
      let searchLocation = 'United States';
      console.log(`🔍 DEBUG: Received city="${city}", state="${state}", location="${location}"`);
      
      if (city && state) {
        searchLocation = `${city},${state},United States`;  // No spaces after commas
        console.log(`🔍 DEBUG: Using city/state format: ${searchLocation}`);
      } else if (location) {
        // Ensure fallback location includes "United States"
        searchLocation = location.replace(/,\s+/g, ',');
        if (!searchLocation.includes('United States')) {
          searchLocation = `${searchLocation},United States`;
        }
        console.log(`🔍 DEBUG: Using fallback location: ${searchLocation}`);
      }
      
      console.log(`🔍 KEYWORD SEARCH: Searching for "${keyword}" in location: ${searchLocation}`);
      
      // Use DataForSEO organic search to get top 5 results
      const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${DATAFOREO_LOGIN}:${DATAFOREO_PASSWORD}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          language_code: 'en',
          location_name: searchLocation,  // Use properly formatted location
          keyword: keyword,
          depth: 5  // Only get top 5 results
        }])
      });
      
      if (!response.ok) {
        console.log(`❌ Keyword search API failed: ${response.status}`);
        return res.status(500).json({ error: 'Failed to fetch search results' });
      }
      
      const data = await response.json();
      console.log('🔍 DataForSEO response structure:', JSON.stringify({
        tasks: data.tasks?.length,
        result: data.tasks?.[0]?.result?.length,
        items: data.tasks?.[0]?.result?.[0]?.items?.length,
        firstItem: data.tasks?.[0]?.result?.[0]?.items?.[0]
      }, null, 2));
      
      const items = data.tasks?.[0]?.result?.[0]?.items || [];
      
      // Extract top 5 organic results
      const results = items
        .filter((item: any) => item.type === 'organic')
        .slice(0, 5)
        .map((item: any, index: number) => ({
          position: index + 1,
          title: item.title || 'No title',
          url: item.url || '',
          domain: item.domain || '',
          description: item.description || ''
        }));
      
      console.log(`✅ KEYWORD SEARCH: Found ${results.length} results for "${keyword}"`);
      
      // Get search volume data for the keyword
      let searchVolume = 0;
      let difficulty = 0;
      let competition = 0;
      
      console.log('🔍 SEARCH VOLUME SECTION: Starting search volume lookup...');
      
      try {
        console.log(`🔍 Getting search volume for "${keyword}" in ${searchLocation}`);
        console.log('🔍 About to call DataForSEO search volume API...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const volumeResponse = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${DATAFOREO_LOGIN}:${DATAFOREO_PASSWORD}`).toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{
            location_name: searchLocation,
            language_code: 'en',
            keywords: [keyword],
            search_partners: true
          }]),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('🔍 Volume response status:', volumeResponse.status, volumeResponse.ok);
        if (volumeResponse.ok) {
          const volumeData = await volumeResponse.json();
          console.log('🔍 Volume data received, processing...');
          
          const volumeItem = volumeData.tasks?.[0]?.result?.[0];
          console.log('🔍 Volume item found:', !!volumeItem);
          
          if (volumeItem && volumeItem.search_volume !== undefined) {
            searchVolume = volumeItem.search_volume || 0;
            difficulty = volumeItem.keyword_difficulty || 0;
            competition = volumeItem.competition || 0;
            console.log(`🔍 ✅ Volume data extracted: ${searchVolume} searches/month`);
            
            console.log(`✅ Search volume data: ${searchVolume} monthly searches, difficulty: ${difficulty}`);
          } else {
            console.log('⚠️ No search volume data found in API response');
          }
        } else {
          const errorText = await volumeResponse.text();
          console.log(`⚠️ Search volume API failed with status: ${volumeResponse.status}`);
          console.log(`⚠️ Search volume API error response: ${errorText}`);
        }
      } catch (volumeError) {
        console.log('⚠️ Failed to get search volume data:', volumeError.message);
        console.log('⚠️ Volume error details:', volumeError);
      }
      
      res.json({
        keyword,
        location: searchLocation,  // Return the properly formatted location
        results,
        searchVolume,
        difficulty,
        competition,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Keyword search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // Cache management endpoints
  app.get("/api/cache/stats", async (req, res) => {
    try {
      const stats = await scanCacheService.getCacheStats();
      res.json(stats);
    } catch (error) {
      console.error('Cache stats error:', error);
      res.status(500).json({ error: "Failed to get cache statistics" });
    }
  });

  app.post("/api/cache/clear-expired", async (req, res) => {
    try {
      await scanCacheService.clearExpiredCache();
      res.json({ success: true, message: "Expired cache entries cleared" });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: "Failed to clear expired cache" });
    }
  });

  app.delete("/api/cache/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      await scanCacheService.deleteCachedScan(placeId);
      res.json({ success: true, message: `Cache cleared for placeId: ${placeId}` });
    } catch (error) {
      console.error('Cache delete error:', error);
      res.status(500).json({ error: "Failed to delete cache entry" });
    }
  });

  // Revenue Loss Gate screenshot endpoints
  app.post("/api/revenue-gate-screenshot", async (req, res) => {
    try {
      const scanData = req.body;
      
      if (!scanData || !scanData.restaurantName) {
        return res.status(400).json({ error: "Valid scan data with restaurantName is required" });
      }

      console.log(`🖼️  Starting Revenue Loss Gate screenshot generation for ${scanData.restaurantName}`);
      
      const result = await revenueLossScreenshotService.generateScreenshot(scanData);
      
      if (result.success) {
        res.json({
          success: true,
          message: `Screenshot generated for ${scanData.restaurantName}`,
          path: result.path,
          backupPath: result.backupPath
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Screenshot generation failed"
        });
      }
    } catch (error) {
      console.error('Revenue Loss Gate screenshot error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Generate Revenue Loss Gate screenshot from cached scan data using placeId
  app.post("/api/revenue-loss-gate/screenshot", async (req, res) => {
    try {
      const { placeId } = req.body;
      
      if (!placeId) {
        return res.status(400).json({ error: "placeId is required" });
      }

      console.log(`🖼️  Generating Revenue Loss Gate screenshot for placeId: ${placeId}`);
      
      // Get cached scan data
      const cachedScan = await scanCacheService.getCachedScan(placeId);
      
      if (!cachedScan) {
        return res.status(404).json({ error: "No cached scan data found for this placeId" });
      }

      console.log(`📦 Found cached scan data for ${cachedScan.restaurantName}`);
      
      const result = await revenueLossScreenshotService.generateScreenshot(cachedScan);
      
      if (result.success) {
        res.json({
          success: true,
          message: `Screenshot generated for ${cachedScan.restaurantName}`,
          path: result.path,
          backupPath: result.backupPath,
          restaurantName: cachedScan.restaurantName
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Screenshot generation failed"
        });
      }
    } catch (error) {
      console.error('Revenue Loss Gate screenshot from placeId error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/revenue-gate-screenshot/:restaurantName", async (req, res) => {
    try {
      const { restaurantName } = req.params;
      const info = await revenueLossScreenshotService.getScreenshotInfo(restaurantName);
      res.json(info);
    } catch (error) {
      console.error('Get screenshot info error:', error);
      res.status(500).json({ error: "Failed to get screenshot info" });
    }
  });

  app.get("/api/revenue-gate-screenshots", async (req, res) => {
    try {
      const screenshots = await revenueLossScreenshotService.getAllScreenshots();
      res.json(screenshots);
    } catch (error) {
      console.error('Get all screenshots error:', error);
      res.status(500).json({ error: "Failed to get screenshots list" });
    }
  });

  app.delete("/api/revenue-gate-screenshot/:restaurantName", async (req, res) => {
    try {
      const { restaurantName } = req.params;
      const deleted = await revenueLossScreenshotService.deleteScreenshot(restaurantName);
      
      if (deleted) {
        res.json({ success: true, message: `Screenshot deleted for ${restaurantName}` });
      } else {
        res.status(404).json({ success: false, message: `Screenshot not found for ${restaurantName}` });
      }
    } catch (error) {
      console.error('Delete screenshot error:', error);
      res.status(500).json({ error: "Failed to delete screenshot" });
    }
  });

  app.get("/api/revenue-gate-stats", async (req, res) => {
    try {
      const stats = await revenueLossScreenshotService.getStorageStats();
      res.json(stats);
    } catch (error) {
      console.error('Get screenshot stats error:', error);
      res.status(500).json({ error: "Failed to get screenshot statistics" });
    }
  });

  // Search Volume API endpoint for Revenue Loss Gate
  app.post("/api/search-volume", async (req, res) => {
    try {
      const { keywords, city, state, country } = req.body;

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: "Keywords array is required" });
      }

      if (!searchVolumeService) {
        return res.status(503).json({ 
          error: "Search Volume Service not available - DataForSEO credentials required",
          fallback: true
        });
      }

      console.log(`🔍 Search volume request for ${keywords.length} keywords in ${city}, ${state}`);
      console.log(`🔧 SearchVolumeService available:`, !!searchVolumeService);
      console.log(`🔧 About to call getSearchVolumes with:`, { keywords, city, state, country });

      const results = await searchVolumeService.getSearchVolumes({
        keywords,
        city,
        state,
        country
      });
      
      console.log(`🔧 Results from getSearchVolumes:`, results);

      console.log(`✅ Search volume results: ${results.length} keywords processed`);

      res.json({
        success: true,
        results,
        location: `${city},${state},${country || 'United States'}`
      });

    } catch (error) {
      console.error('Search volume API error:', error);
      res.status(500).json({ 
        error: "Failed to fetch search volumes",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/mcp/tools", async (req, res) => {
    res.status(503).json({ 
      error: "MCP service not available",
      details: "MCP integration is not currently configured"
    });
  });

  app.post("/api/mcp/call", async (req, res) => {
    res.status(503).json({ 
      error: "MCP service not available",
      details: "MCP integration is not currently configured"
    });
  });

  app.post("/api/mcp/analyze", async (req, res) => {
    res.status(503).json({ 
      error: "MCP service not available",
      details: "MCP integration is not currently configured"
    });
  });

  // n8n Webhook endpoint - scan restaurant by URL
  app.post("/api/webhook/scan-by-url", async (req, res) => {
    try {
      const { url, apiKey, returnFormat = 'json' } = req.body;
      
      // Simple API key authentication if configured
      const expectedApiKey = process.env.WEBHOOK_API_KEY;
      if (expectedApiKey && apiKey !== expectedApiKey) {
        return res.status(401).json({ 
          error: "Unauthorized",
          message: "Invalid or missing API key" 
        });
      }
      
      if (!url) {
        return res.status(400).json({ 
          error: "Bad Request",
          message: "URL parameter is required" 
        });
      }

      if (!GOOGLE_API_KEY) {
        return res.status(503).json({ 
          error: "Service Unavailable",
          message: "Google Places API key not configured" 
        });
      }

      if (!dataForSeoScannerService) {
        return res.status(503).json({ 
          error: "Service Unavailable",
          message: "Scanner service not available. Missing required API credentials" 
        });
      }

      // Extract domain from URL
      let domain: string;
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        domain = urlObj.hostname.replace(/^www\./, '');
      } catch (error) {
        return res.status(400).json({ 
          error: "Invalid URL",
          message: "Please provide a valid website URL" 
        });
      }

      console.log(`🔗 n8n webhook scan request for domain: ${domain}`);

      // Search for the restaurant using the domain
      let searchResults = await restaurantService.searchRestaurantByWebsite(domain);
      
      if (!searchResults || searchResults.length === 0) {
        // Fallback: Try to search by domain name (e.g., "mcdonalds" from "mcdonalds.com")
        const domainName = domain.split('.')[0];
        const fallbackResults = await restaurantService.searchRestaurants(domainName + " restaurant");
        
        if (!fallbackResults || fallbackResults.length === 0) {
          return res.status(404).json({ 
            error: "Restaurant Not Found",
            message: `No restaurant found for domain: ${domain}` 
          });
        }
        
        // Use first result from fallback search
        searchResults = fallbackResults;
      }

      const restaurant = searchResults[0];
      const placeDetails = await restaurantService.getPlaceDetails(restaurant.place_id);
      
      // Prepare scan parameters
      const scanParams = {
        domain: placeDetails.website ? new URL(placeDetails.website).hostname : domain,
        restaurantName: placeDetails.name,
        placeId: restaurant.place_id,
        latitude: placeDetails.geometry?.location?.lat || 0,
        longitude: placeDetails.geometry?.location?.lng || 0
      };

      console.log(`📊 Starting scan for ${scanParams.restaurantName} (${scanParams.domain})`);

      // Perform the scan (synchronous version for webhook)
      const scanResult = await dataForSeoScannerService.scanRestaurantAdvanced(
        scanParams.placeId,
        scanParams.domain,
        scanParams.restaurantName,
        scanParams.latitude,
        scanParams.longitude,
        () => {}, // Empty progress callback for webhook
        null  // No manual Facebook URL
      );

      // Prepare webhook response based on format
      if (returnFormat === 'simplified') {
        // Return simplified format matching HeyGen webhook structure
        const webhookService = new WebhookExportService({ url: 'dummy' });
        const heygernFormat = await webhookService.prepareCompleteExport(scanResult);
        
        // Add n8n specific success wrapper
        const simplifiedResult = {
          success: true,
          ...heygernFormat
        };
        
        return res.json(simplifiedResult);
      } else {
        // Return full scan result
        return res.json({
          success: true,
          timestamp: new Date().toISOString(),
          result: scanResult
        });
      }
      
    } catch (error) {
      console.error("n8n webhook scan error:", error);
      return res.status(500).json({ 
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : 'Scan failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Save scan result for revenue gate sharing
  app.post("/api/scan/save", async (req, res) => {
    try {
      const { placeId, restaurantName, domain, scanData } = req.body;
      
      if (!placeId || !restaurantName || !scanData) {
        return res.status(400).json({ 
          error: "Missing required fields: placeId, restaurantName, and scanData are required" 
        });
      }

      // Store the full scan result
      if (db) {
        await db.insert(fullScanResults)
          .values({
            placeId,
            restaurantName,
            domain,
            scanData: scanData,
          })
          .onConflictDoUpdate({
            target: fullScanResults.placeId,
            set: {
              scanData: scanData,
              restaurantName,
              domain,
              updatedAt: new Date(),
            }
          });
      } else {
        // Fallback for in-memory storage - just return success for development
        console.warn("Database not connected - cannot save scan result permanently");
      }

      // Generate shareable link
      const shareableLink = `${req.protocol}://${req.get('host')}/revenue-gate/${placeId}`;
      
      res.json({ 
        success: true,
        shareableLink,
        placeId
      });
    } catch (error) {
      console.error("Failed to save scan result:", error);
      res.status(500).json({ 
        error: "Failed to save scan result",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get saved scan result for revenue gate
  app.get("/api/scan/revenue-gate/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      
      if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
      }

      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }

      const result = await db.query.fullScanResults.findFirst({
        where: eq(fullScanResults.placeId, placeId)
      });

      if (!result) {
        return res.status(404).json({ error: "Scan result not found" });
      }

      // Auto-generate screenshot if it doesn't exist (fire and forget - don't block response)
      if (result.scanData) {
        setImmediate(async () => {
          try {
            // Check if screenshot already exists
            const existingScreenshot = await db.query.revenueGateScreenshots.findFirst({
              where: eq(revenueGateScreenshots.placeId, placeId)
            });
            
            if (!existingScreenshot) {
              console.log(`🖼️  Auto-generating revenue gate screenshot for ${result.restaurantName} (${placeId})`);
              
              // Generate screenshot
              const screenshotResult = await revenueLossScreenshotService.generateScreenshot(result.scanData as any);
              
              if (screenshotResult.success && screenshotResult.path) {
                // Read the screenshot file and convert to base64
                const fs = await import('fs/promises');
                const screenshotBuffer = await fs.readFile(screenshotResult.path);
                const base64Data = screenshotBuffer.toString('base64');
                
                // Check if screenshot already exists
                const existingScreenshot2 = await db.query.revenueGateScreenshots.findFirst({
                  where: eq(revenueGateScreenshots.placeId, placeId)
                });
                
                if (existingScreenshot2) {
                  // Update existing screenshot
                  await db.update(revenueGateScreenshots)
                    .set({
                      screenshotData: `data:image/png;base64,${base64Data}`,
                      domain: result.domain || null,
                      updatedAt: new Date()
                    })
                    .where(eq(revenueGateScreenshots.placeId, placeId));
                } else {
                  // Insert new screenshot
                  await db.insert(revenueGateScreenshots).values({
                    placeId,
                    restaurantName: result.restaurantName || 'Unknown Restaurant',
                    domain: result.domain || null, // Include domain for HubSpot matching
                    screenshotData: `data:image/png;base64,${base64Data}`,
                    metadata: {
                      width: 1400,
                      height: 1000,
                      fileSize: screenshotBuffer.length,
                      generatedAt: new Date().toISOString(),
                      autoGenerated: true
                    }
                  });
                }
                
                console.log(`✅ Revenue gate screenshot auto-generated and saved for ${result.restaurantName}`);
              } else {
                console.log(`⚠️ Failed to auto-generate screenshot for ${result.restaurantName}: ${screenshotResult.error || 'Unknown error'}`);
              }
            }
          } catch (screenshotError) {
            console.error(`❌ Auto-screenshot generation error for ${placeId}:`, screenshotError);
            // Don't throw - this is background processing
          }
        });
      }

      res.json({
        success: true,
        restaurantName: result.restaurantName,
        domain: result.domain,
        scanData: result.scanData,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      });
    } catch (error) {
      console.error("Failed to retrieve scan result:", error);
      res.status(500).json({ 
        error: "Failed to retrieve scan result",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get cached scan result for full scan view
  app.get("/api/scan/cached/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      
      if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
      }
      
      // Check cache first
      const cachedResult = await scanCacheService.getCachedScan(placeId);
      
      if (cachedResult) {
        return res.json(cachedResult);
      }
      
      // Fall back to database if cache miss
      if (db) {
        const result = await db.query.fullScanResults.findFirst({
          where: eq(fullScanResults.placeId, placeId)
        });
        
        if (result && result.scanData) {
          return res.json(result.scanData);
        }
      }
      
      return res.status(404).json({ error: "Scan result not found" });
    } catch (error) {
      console.error("Failed to retrieve cached scan:", error);
      res.status(500).json({ error: "Failed to retrieve scan result" });
    }
  });

  // Track URL access
  app.post("/api/urls/track-access/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      const { type } = req.body; // 'full_scan' or 'revenue_gate'
      
      if (!placeId) {
        return res.status(400).json({ error: "Invalid request" });
      }
      
      // Only track if database is available
      if (!db) {
        return res.json({ success: true, tracked: false });
      }
      
      // Update or create URL tracking record
      const existing = await db.query.revenueGateUrls.findFirst({
        where: eq(revenueGateUrls.placeId, placeId)
      });
      
      if (existing) {
        await db.update(revenueGateUrls)
          .set({ 
            lastAccessedAt: new Date(),
            accessCount: sql`${revenueGateUrls.accessCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(revenueGateUrls.placeId, placeId));
      } else {
        // Get restaurant name from cache or database
        let restaurantName = 'Unknown Restaurant';
        const cachedScan = await scanCacheService.getCachedScan(placeId);
        if (cachedScan?.restaurantName) {
          restaurantName = cachedScan.restaurantName;
        }
        
        const protocol = req.protocol;
        const host = req.get('host');
        
        await db.insert(revenueGateUrls).values({
          placeId,
          restaurantName,
          shareableUrl: type === 'revenue_gate' 
            ? `${protocol}://${host}/revenue-gate/${placeId}`
            : `${protocol}://${host}/${placeId}`,
          fullScanUrl: `${protocol}://${host}/${placeId}`,
          accessCount: 1,
          lastAccessedAt: new Date()
        });
      }
      
      res.json({ success: true, tracked: true });
    } catch (error) {
      console.error("Failed to track access:", error);
      res.status(500).json({ error: "Failed to track access" });
    }
  });

  // Get URL statistics
  app.get("/api/urls/stats", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: "Database not available" });
      }
      
      const urls = await db.query.revenueGateUrls.findMany({
        orderBy: (urls, { desc }) => [desc(urls.accessCount)]
      });
      
      res.json({
        totalUrls: urls.length,
        totalAccesses: urls.reduce((sum, url) => sum + (url.accessCount || 0), 0),
        urls: urls.map(url => ({
          placeId: url.placeId,
          restaurantName: url.restaurantName,
          shareableUrl: url.shareableUrl,
          fullScanUrl: url.fullScanUrl,
          accessCount: url.accessCount,
          lastAccessedAt: url.lastAccessedAt,
          hubspotContactId: url.hubspotContactId,
          createdAt: url.createdAt
        }))
      });
    } catch (error) {
      console.error("Failed to get URL stats:", error);
      res.status(500).json({ error: "Failed to get URL statistics" });
    }
  });

  // Link URL to HubSpot contact
  app.put("/api/urls/:placeId/hubspot", async (req, res) => {
    try {
      const { placeId } = req.params;
      const { hubspotContactId } = req.body;
      
      if (!placeId || !hubspotContactId || !db) {
        return res.status(400).json({ error: "Place ID and HubSpot contact ID are required" });
      }
      
      await db.update(revenueGateUrls)
        .set({ 
          hubspotContactId,
          updatedAt: new Date()
        })
        .where(eq(revenueGateUrls.placeId, placeId));
      
      res.json({ success: true, message: "HubSpot contact linked successfully" });
    } catch (error) {
      console.error("Failed to link HubSpot contact:", error);
      res.status(500).json({ error: "Failed to link HubSpot contact" });
    }
  });

  // Generate and save revenue gate screenshot to database
  app.post("/api/revenue-gate/generate-screenshot/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      
      if (!placeId || !db) {
        return res.status(400).json({ error: "Place ID is required" });
      }
      
      // Get scan data from cache or database
      const cachedScan = await scanCacheService.getCachedScan(placeId);
      let scanData = cachedScan;
      
      if (!scanData && db) {
        const dbResult = await db.query.fullScanResults.findFirst({
          where: eq(fullScanResults.placeId, placeId)
        });
        if (dbResult?.scanData) {
          scanData = dbResult.scanData as any;
        }
      }
      
      if (!scanData) {
        return res.status(404).json({ error: "Scan data not found" });
      }
      
      // Generate screenshot
      const screenshotResult = await revenueLossScreenshotService.generateScreenshot(scanData);
      
      if (screenshotResult.success && screenshotResult.path) {
        // Read the screenshot file and convert to base64
        const fs = await import('fs/promises');
        const screenshotBuffer = await fs.readFile(screenshotResult.path);
        const base64Data = screenshotBuffer.toString('base64');
        
        // Check if screenshot already exists
        const existingScreenshot3 = await db.query.revenueGateScreenshots.findFirst({
          where: eq(revenueGateScreenshots.placeId, placeId)
        });
        
        if (existingScreenshot3) {
          // Update existing screenshot
          await db.update(revenueGateScreenshots)
            .set({
              screenshotData: `data:image/png;base64,${base64Data}`,
              domain: scanData.domain || null,
              updatedAt: new Date()
            })
            .where(eq(revenueGateScreenshots.placeId, placeId));
        } else {
          // Insert new screenshot
          await db.insert(revenueGateScreenshots).values({
            placeId,
            restaurantName: scanData.restaurantName || 'Unknown Restaurant',
            domain: scanData.domain || null, // Include domain for HubSpot matching
            screenshotData: `data:image/png;base64,${base64Data}`,
            metadata: {
              width: 1200,
              height: 800,
              fileSize: screenshotBuffer.length,
              generatedAt: new Date().toISOString()
            }
          });
        }
        
        res.json({ 
          success: true, 
          message: "Screenshot generated and saved to database",
          placeId,
          restaurantName: scanData.restaurantName
        });
      } else {
        res.status(500).json({ error: "Failed to generate screenshot" });
      }
    } catch (error) {
      console.error("Screenshot generation error:", error);
      res.status(500).json({ error: "Failed to generate screenshot" });
    }
  });

  // Get revenue gate screenshot from database
  app.get("/api/revenue-gate/screenshot/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      
      if (!placeId || !db) {
        return res.status(400).json({ error: "Place ID is required" });
      }
      
      const screenshot = await db.query.revenueGateScreenshots.findFirst({
        where: eq(revenueGateScreenshots.placeId, placeId)
      });
      
      if (!screenshot) {
        return res.status(404).json({ error: "Screenshot not found" });
      }
      
      res.json({
        success: true,
        placeId: screenshot.placeId,
        restaurantName: screenshot.restaurantName,
        screenshotData: screenshot.screenshotData,
        metadata: screenshot.metadata,
        createdAt: screenshot.createdAt
      });
    } catch (error) {
      console.error("Failed to retrieve screenshot:", error);
      res.status(500).json({ error: "Failed to retrieve screenshot" });
    }
  });

  // Get screenshot by restaurant name from database
  app.get("/api/revenue-gate/screenshot/restaurant/:restaurantName", async (req, res) => {
    try {
      const { restaurantName } = req.params;
      
      if (!restaurantName || !db) {
        return res.status(400).json({ error: "Restaurant name is required" });
      }
      
      const screenshot = await db.query.revenueGateScreenshots.findFirst({
        where: sql`LOWER(${revenueGateScreenshots.restaurantName}) = LOWER(${restaurantName})`
      });
      
      if (!screenshot) {
        return res.status(404).json({ error: "Screenshot not found for restaurant" });
      }
      
      res.json({
        success: true,
        placeId: screenshot.placeId,
        restaurantName: screenshot.restaurantName,
        screenshotData: screenshot.screenshotData,
        metadata: screenshot.metadata,
        createdAt: screenshot.createdAt
      });
    } catch (error) {
      console.error("Failed to retrieve screenshot by restaurant name:", error);
      res.status(500).json({ error: "Failed to retrieve screenshot" });
    }
  });

  // List all screenshots from database
  app.get("/api/revenue-gate/screenshots/list", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const screenshots = await db
        .select({
          id: revenueGateScreenshots.id,
          placeId: revenueGateScreenshots.placeId,
          restaurantName: revenueGateScreenshots.restaurantName,
          screenshotUrl: revenueGateScreenshots.screenshotUrl,
          metadata: revenueGateScreenshots.metadata,
          createdAt: revenueGateScreenshots.createdAt,
          updatedAt: revenueGateScreenshots.updatedAt
        })
        .from(revenueGateScreenshots)
        .orderBy(sql`${revenueGateScreenshots.createdAt} DESC`);
      
      // Add image URLs to each screenshot
      const screenshotsWithUrls = screenshots.map(screenshot => ({
        ...screenshot,
        imageUrl: `${req.protocol}://${req.get('host')}/api/revenue-gate/image/${encodeURIComponent(screenshot.restaurantName)}`
      }));
      
      res.json({
        success: true,
        count: screenshots.length,
        screenshots: screenshotsWithUrls
      });
    } catch (error) {
      console.error("Failed to list screenshots:", error);
      res.status(500).json({ error: "Failed to list screenshots" });
    }
  });

  // Serve screenshot as image - direct URL to view the image
  app.get("/api/revenue-gate/image/:restaurantName", async (req, res) => {
    try {
      const { restaurantName } = req.params;
      
      if (!restaurantName || !db) {
        return res.status(400).json({ error: "Restaurant name is required" });
      }
      
      const screenshot = await db.query.revenueGateScreenshots.findFirst({
        where: sql`LOWER(${revenueGateScreenshots.restaurantName}) = LOWER(${restaurantName})`
      });
      
      if (!screenshot) {
        return res.status(404).json({ error: "Screenshot not found for restaurant" });
      }
      
      // Extract base64 data (remove data:image/png;base64, prefix)
      const base64Data = screenshot.screenshotData.replace(/^data:image\/png;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error("Failed to serve screenshot image:", error);
      res.status(500).json({ error: "Failed to serve screenshot image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for Google Business Profile analysis
function calculateProfileCompleteness(profile: any): { score: number; missingElements: string[] } {
  console.log('🔍 PROFILE COMPLETENESS DEBUG:', {
    profileKeys: Object.keys(profile || {}), 
    name: profile?.name,
    phone: profile?.phone,
    phoneNumber: profile?.phoneNumber,
    website: profile?.website,
    photoCount: profile?.photoCount,
    photosTotal: profile?.photos?.total,
    reviewCount: profile?.reviewCount,
    totalReviews: profile?.totalReviews,
    rating: profile?.rating
  });
  
  let totalScore = 0;
  const missingElements = [];

  // Name (10% weight) - all or nothing
  if (profile.name) {
    totalScore += 10;
  } else {
    missingElements.push('name');
  }

  // Phone (15% weight) - all or nothing  
  if (profile.phone || profile.phoneNumber) {
    totalScore += 15;
  } else {
    missingElements.push('phone');
  }

  // Website (20% weight) - all or nothing
  if (profile.website) {
    totalScore += 20;
  } else {
    missingElements.push('website');
  }

  // Photos (25% weight) - 0.5% per photo up to 50 photos
  const photoCount = profile.photos?.total || profile.photoCount || 0;
  if (photoCount > 0) {
    const photoScore = Math.min(50, photoCount) * 0.5; // Cap at 50 photos for full 25 points
    totalScore += photoScore;
  } else {
    missingElements.push('photos');
  }

  // Reviews (20% weight) - 1% per 15 reviews up to 20% cap
  const reviewCount = profile.totalReviews || profile.reviewCount || 0;
  if (reviewCount > 0) {
    const reviewScore = Math.min(20, Math.floor(reviewCount / 15)); // 1% per 15 reviews, capped at 20%
    totalScore += reviewScore;
  } else {
    missingElements.push('reviews');
  }

  // Rating (10% weight) - tiered system
  const rating = profile.rating || 0;
  if (rating >= 3.9) {
    totalScore += 10; // 3.9-4.0+ gets full 10%
  } else if (rating >= 3.6) {
    totalScore += 7;  // 3.6-3.8 gets 7%
  } else if (rating >= 3.3) {
    totalScore += 5;  // 3.3-3.5 gets 5%
  } else if (rating >= 3.0) {
    totalScore += 2;  // 3.0-3.2 gets 2%
  } else {
    // 0-2.9 gets 0%, but only add to missing if truly 0
    if (rating === 0) {
      missingElements.push('rating');
    }
  }

  const score = Math.round(totalScore);

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
