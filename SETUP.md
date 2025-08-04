# Restaurant Scanner - Setup Guide

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/restaurant-scanner.git
   cd restaurant-scanner
   npm install
   ```

2. **API Keys Setup**
   Create `.env` file with your API keys:
   ```env
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   PAGESPEED_API_KEY=your_pagespeed_api_key
   SERP_API_KEY=your_serp_api_key
   ZEMBRATECH_API_KEY=your_zembratech_api_key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Keys Required

### Google APIs (Required)
- **Google Places API**: Restaurant search and business details
- **Google PageSpeed Insights API**: Website performance metrics
- **Google API Key**: General Google services

Get these from [Google Cloud Console](https://console.cloud.google.com/):
1. Create new project or select existing
2. Enable APIs: Places API, PageSpeed Insights API
3. Create credentials (API Key)
4. Restrict key to your domain for security

### SERP API (Required)
- **Purpose**: Keyword rankings and competitor analysis
- **Provider**: [SerpApi](https://serpapi.com/)
- **Setup**: Sign up → Get API key → Add to `.env`

### Zembratech (Optional)
- **Purpose**: Advanced reviews analysis and sentiment processing
- **Setup**: Contact Zembratech for API access
- **Note**: Reviews analysis works without this, using Google Reviews only

## Development Environment

### System Requirements
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher (or yarn equivalent)
- Modern web browser for testing

### Port Configuration
- Frontend: `http://localhost:5000` (Vite dev server)
- Backend: Express server integrated with frontend
- WebSocket: Server-Sent Events for real-time updates

### Database Setup
- **Development**: Uses in-memory storage (no setup required)
- **Production**: PostgreSQL with Drizzle ORM
- **Migration**: Run `npm run db:push` for database schema

## Testing Your Setup

1. **Start the application**: `npm run dev`
2. **Open browser**: Navigate to `http://localhost:5000`
3. **Test search**: Enter "Pizza Hut" or any restaurant name
4. **Verify APIs**: Check console for API responses
5. **Run scan**: Select a restaurant and click "Analyze Website"

## Common Issues

### API Key Problems
```
Error: Google Places API key not found
```
**Solution**: Verify `.env` file exists and contains valid API keys

### Port Conflicts
```
Error: Port 5000 already in use
```
**Solution**: Kill existing processes or change port in `vite.config.ts`

### Build Errors
```
Error: Cannot resolve module '@/components/ui/card'
```
**Solution**: Run `npm install` to ensure all dependencies are installed

## Production Deployment

### Build Command
```bash
npm run build
```

### Environment Variables
Set all required API keys in your production environment:
- `GOOGLE_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `PAGESPEED_API_KEY`
- `SERP_API_KEY`
- `ZEMBRATECH_API_KEY` (optional)

### Database Setup
```bash
# Install PostgreSQL
# Update connection string in environment
# Run migrations
npm run db:push
```

## Project Structure Overview

```
restaurant-scanner/
├── client/src/           # React frontend
│   ├── components/      # UI components
│   ├── pages/          # Page components
│   └── lib/            # Utilities
├── server/             # Express backend
│   ├── services/      # API integrations
│   └── routes.ts      # API endpoints
├── shared/schema.ts   # Database schemas
└── package.json       # Dependencies
```

## Next Steps

After successful setup:
1. Test restaurant search functionality
2. Verify performance scanning works
3. Check reviews analysis integration
4. Customize branding and colors
5. Set up production deployment

## Support

For setup issues:
1. Check console logs for error details
2. Verify API key permissions
3. Ensure Node.js version compatibility
4. Review network connectivity

## Security Notes

- Never commit API keys to git
- Use environment variables for all secrets
- Restrict API keys to your domain
- Enable HTTPS in production