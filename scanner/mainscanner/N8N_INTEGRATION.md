# n8n Integration Guide for Restaurant Scanner

This guide explains how to integrate the Restaurant Scanner API with n8n workflows.

## API Endpoint

**URL:** `POST https://boostly-restaurant-scanner.onrender.com/api/webhook/scan-by-url`

**Purpose:** Scan a restaurant's online presence by providing their website URL.

## Request Format

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body Parameters
```json
{
  "url": "restaurant-website.com",
  "apiKey": "your-optional-api-key",
  "returnFormat": "simplified"
}
```

**Parameters:**
- `url` (required): The restaurant's website URL (e.g., "mcdonalds.com" or "https://www.mcdonalds.com")
- `apiKey` (optional): API key for authentication if WEBHOOK_API_KEY is set in environment
- `returnFormat` (optional): "simplified" or "json" (default: "json")
  - `simplified`: Returns condensed data optimized for n8n processing
  - `json`: Returns complete scan data

## Response Formats

### Simplified Format (recommended for n8n)
```json
{
  "success": true,
  "timestamp": "2025-08-14T12:00:00Z",
  "restaurant": {
    "name": "McDonald's",
    "domain": "mcdonalds.com",
    "placeId": "ChIJ...",
    "address": "123 Main St",
    "rating": 4.2,
    "totalReviews": 1250
  },
  "scores": {
    "overall": 78,
    "seo": 82,
    "performance": 75,
    "mobile": 80,
    "reviews": 76
  },
  "recommendations": [
    {
      "title": "Improve Page Speed",
      "description": "...",
      "impact": "high",
      "category": "performance"
    }
  ]
}
```

### Full Format
Returns the complete scan result with all detailed metrics, keywords, competitor analysis, and technical data.

## Environment Variables

Add these to your `.env` file:

```env
# Required for scanning
GOOGLE_PLACES_API_KEY=your_google_api_key
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password
OPENAI_API_KEY=your_openai_key

# Optional authentication
WEBHOOK_API_KEY=your_secret_api_key

# Optional webhook forwarding
WEBHOOK_URL=https://your-webhook-endpoint.com
```

## n8n Workflow Setup

### 1. Code Node Configuration (Recommended)

**Node Type:** Code

**Language:** JavaScript

**Code:**
```javascript
// Get the website URL from previous node or set manually
const websiteUrl = $input.first().json.website || 'mcdonalds.com';

try {
  console.log(`🔍 Starting restaurant scan for: ${websiteUrl}`);
  
  const response = await fetch('https://boostly-restaurant-scanner.onrender.com/api/webhook/scan-by-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: websiteUrl,
      returnFormat: 'simplified',
      // Add API key if you have WEBHOOK_API_KEY configured
      // apiKey: 'your-api-key-here'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Scan completed for ${result.restaurant?.name || websiteUrl}`);
  
  // Return the full result for next nodes
  return [result];
  
} catch (error) {
  console.error('❌ Restaurant scan failed:', error.message);
  
  // Return error information for handling
  return [{
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    website: websiteUrl
  }];
}
```

### 2. Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "scan-trigger"
    },
    {
      "name": "Scan Restaurant",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "// Get the website URL from previous node\nconst websiteUrl = $input.first().json.website || 'mcdonalds.com';\n\ntry {\n  console.log(`🔍 Starting restaurant scan for: ${websiteUrl}`);\n  \n  const response = await fetch('https://boostly-restaurant-scanner.onrender.com/api/webhook/scan-by-url', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json'\n    },\n    body: JSON.stringify({\n      url: websiteUrl,\n      returnFormat: 'simplified'\n    })\n  });\n\n  if (!response.ok) {\n    const errorText = await response.text();\n    throw new Error(`HTTP ${response.status}: ${errorText}`);\n  }\n\n  const result = await response.json();\n  console.log(`✅ Scan completed for ${result.restaurant?.name || websiteUrl}`);\n  \n  return [result];\n  \n} catch (error) {\n  console.error('❌ Restaurant scan failed:', error.message);\n  \n  return [{\n    success: false,\n    error: error.message,\n    timestamp: new Date().toISOString(),\n    website: websiteUrl\n  }];\n}"
      }
    },
    {
      "name": "Process Results",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "// Extract key metrics from scan result\nconst result = $input.first().json;\n\n// Check if scan was successful\nif (!result.success) {\n  return [{\n    error: true,\n    message: result.error || 'Scan failed',\n    website: result.website,\n    timestamp: result.timestamp\n  }];\n}\n\n// Extract useful data for further processing\nreturn [{\n  restaurantName: result.restaurant?.name || 'Unknown',\n  domain: result.restaurant?.domain || '',\n  overallScore: result.scores?.overall || 0,\n  seoScore: result.scores?.seo || 0,\n  performanceScore: result.scores?.performance || 0,\n  reviewScore: result.scores?.reviews || 0,\n  needsImprovement: (result.scores?.overall || 0) < 70,\n  \n  // Worst ranking keywords for improvement\n  worstKeywords: result.seoVisibility?.worstRankingKeywords || [],\n  \n  // Top recommendations\n  topRecommendations: result.topRecommendations?.slice(0, 3) || [],\n  \n  // Business metrics\n  rating: result.businessMetrics?.rating || 0,\n  totalReviews: result.businessMetrics?.totalReviews || 0,\n  \n  // Metadata\n  timestamp: result.timestamp,\n  scanId: result.scanId\n}];"
      }
    }
  ]
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful scan
- `400 Bad Request`: Missing or invalid URL
- `401 Unauthorized`: Invalid API key (if configured)
- `404 Not Found`: Restaurant not found for the given URL
- `500 Internal Server Error`: Server error during scanning
- `503 Service Unavailable`: Required API keys not configured

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2025-08-14T12:00:00Z"
}
```

## Testing the Endpoint

### Using the test script:
```bash
node test-n8n-endpoint.js mcdonalds.com [optional-api-key]
```

### Using curl:
```bash
curl -X POST https://boostly-restaurant-scanner.onrender.com/api/webhook/scan-by-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "mcdonalds.com",
    "returnFormat": "simplified"
  }'
```

## Rate Limiting & Performance

The endpoint processes scans synchronously and can take 2-3 minutes per scan. The Code node approach handles this automatically:

- **Built-in timeout handling** - No timeout configuration needed
- **Error handling** - Gracefully handles connection issues  
- **Progress logging** - Console output shows scan progress
- **Queue management** - Consider delays between multiple restaurant scans
- **Parallel processing** - Limit concurrent scans to avoid overloading the server

## Use Cases in n8n

1. **Batch Restaurant Analysis**: Process a list of restaurant URLs from a spreadsheet
2. **Scheduled Monitoring**: Regular scans of restaurant competitors
3. **Lead Qualification**: Automatically scan prospects' websites
4. **Alert System**: Notify when scores drop below thresholds
5. **CRM Integration**: Update restaurant records with scan data

## Support

For issues or questions about the API integration, check the server logs for detailed error messages and ensure all required API keys are properly configured in the environment variables.