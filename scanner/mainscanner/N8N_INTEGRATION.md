# n8n Integration Guide for Restaurant Scanner

This guide explains how to integrate the Restaurant Scanner API with n8n workflows.

## API Endpoint

**URL:** `POST /api/webhook/scan-by-url`

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

### 1. HTTP Request Node Configuration

**Node Type:** HTTP Request

**Method:** POST

**URL:** `http://your-server:3000/api/webhook/scan-by-url`

**Authentication:** None (or use Header Auth if WEBHOOK_API_KEY is configured)

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "url": "{{ $json.website }}",
  "returnFormat": "simplified"
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
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/webhook/scan-by-url",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": {
          "url": "={{ $json.website }}",
          "returnFormat": "simplified"
        }
      }
    },
    {
      "name": "Process Results",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [650, 300],
      "parameters": {
        "code": "// Extract key metrics\nconst result = $input.first().json;\n\nreturn {\n  restaurantName: result.restaurant.name,\n  overallScore: result.scores.overall,\n  needsImprovement: result.scores.overall < 70,\n  topRecommendation: result.recommendations[0]?.title || 'None',\n  timestamp: result.timestamp\n};"
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
curl -X POST http://localhost:3000/api/webhook/scan-by-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "mcdonalds.com",
    "returnFormat": "simplified"
  }'
```

## Rate Limiting

The endpoint processes scans synchronously and can take 2-3 minutes per scan. Consider implementing:
- Queue management in n8n for multiple restaurants
- Parallel processing limits
- Timeout handling (set to 5 minutes minimum)

## Use Cases in n8n

1. **Batch Restaurant Analysis**: Process a list of restaurant URLs from a spreadsheet
2. **Scheduled Monitoring**: Regular scans of restaurant competitors
3. **Lead Qualification**: Automatically scan prospects' websites
4. **Alert System**: Notify when scores drop below thresholds
5. **CRM Integration**: Update restaurant records with scan data

## Support

For issues or questions about the API integration, check the server logs for detailed error messages and ensure all required API keys are properly configured in the environment variables.