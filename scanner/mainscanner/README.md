# Boostly Restaurant Scanner

A comprehensive SEO and competitive intelligence scanner for restaurants, providing actionable insights to improve online visibility and attract more customers.

## Overview

The Boostly Restaurant Scanner is a professional-grade tool that analyzes restaurant websites and online presence to identify opportunities for improvement. It combines multiple data sources including Google Places, DataForSEO, Apify, and OpenAI to deliver comprehensive competitive intelligence.

## Features

### 🔍 SEO Analysis
- Keyword ranking tracking across Google search results
- Local pack visibility analysis
- Competitive keyword gap identification
- Search volume and difficulty metrics
- Real-time position tracking
- Interactive keyword navigation with worst-to-best ranking order

### 📊 Competitor Intelligence
- Identifies top 3 local competitors for each keyword
- Tracks competitor rankings and visibility
- Analyzes competitive gaps and opportunities
- Local search dominance metrics
- Comprehensive competitor detection from local pack results

### ⭐ Review Analysis
- Sentiment analysis of Google Reviews using GPT-4o
- Customer mood tracking and insights
- Review trend identification
- Service-specific Boostly recommendations (text marketing, SEO, social media, reviews)
- Customer pain point identification with percentage breakdown

### 📱 Social Media Detection
- Automatic detection of Facebook, Instagram, and other social profiles
- Verification of social media presence
- Integration with Google Business Profile data
- Enhanced URL handling for social-only businesses

### 🚀 Performance Metrics
- Page load speed analysis
- Mobile responsiveness checking
- Core Web Vitals monitoring
- Technical SEO audit

### 💰 Revenue Loss Analysis
- Revenue opportunity calculation based on keyword performance
- Admin-triggered Revenue Loss Gate for employee demos
- Automated screenshot generation for sales/marketing materials
- Context-aware recommendations matching restaurant type (QSR vs FSR)

### 🎯 AI-Powered Recommendations
- Intelligent service recommendations based on scan results
- Caching system for improved performance (10-minute cache)
- Optimized token usage for cost efficiency
- Service-specific emojis and indicators

### 📊 Scan Caching System
- 7-day TTL for scan results to reduce API costs
- File-based caching with automatic cleanup
- 90% reduction in API usage for repeat searches

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **APIs**: Google Places, DataForSEO, Apify, OpenAI GPT-4
- **Architecture**: Monorepo with shared types

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- API keys for Google Places, DataForSEO, OpenAI, and Apify

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/boostly-scanner.git
cd boostly-scanner/mainscanner
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your API keys:
```env
GOOGLE_PLACES_API_KEY=your_key_here
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
OPENAI_API_KEY=your_key_here
APIFY_API_KEY=your_key_here
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Search for a Restaurant**: Enter a restaurant name and location in the search bar
2. **Select from Results**: Choose the correct restaurant from the search results
3. **Run Professional Scan**: Click "Professional Scan" to start comprehensive analysis
4. **View Results**: Review the detailed report including:
   - Overall performance score
   - Keyword rankings and opportunities
   - Competitor analysis
   - Review insights
   - Actionable recommendations

## Key Components

### Services
- `advancedScannerService.ts` - Main orchestration service
- `localCompetitorService.ts` - Competitor detection and analysis
- `restaurantLocalPackScanner.ts` - Local pack visibility tracking
- `unifiedKeywordService.ts` - Batch keyword processing
- `openaiReviewAnalysisService.ts` - AI-powered review analysis
- `aiRecommendationEngine.ts` - AI-powered service recommendations
- `scanCacheService.ts` - Scan result caching with 7-day TTL
- `revenueLossScreenshotService.ts` - Automated screenshot generation

### UI Components
- `enhanced-results-dashboard.tsx` - Main results display
- `premium-score-dashboard.tsx` - Visual scoring metrics
- `revenue-loss-gate.tsx` - Revenue opportunity analysis modal
- `ai-missing-ingredients.tsx` - AI-powered recommendations display
- `lead-capture-modal.tsx` - Lead capture with admin bypass
- `ui/` - Reusable UI components (shadcn/ui)

## Performance

- **Scan Time**: ~2.5 minutes for complete analysis
- **Batch Processing**: Multiple keywords processed in single API calls
- **Real-time Updates**: Server-sent events for progress tracking
- **Error Recovery**: Graceful handling of API failures
- **Caching**: 7-day scan result caching reduces API usage by 90%
- **AI Optimization**: 10-minute AI recommendation caching, reduced token usage

## Development

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm start` - Run production build

### Project Structure
```
mainscanner/
├── client/                    # React frontend
│   ├── src/components/       # UI components
│   ├── src/hooks/           # Custom React hooks
│   └── src/pages/           # Route components
├── server/                   # Express backend
│   ├── services/            # Business logic services
│   └── routes.ts           # API endpoints
├── shared/                  # Shared types and schemas
│   ├── schema.ts           # Database and type definitions
│   └── revenueCalculations.ts # Revenue analysis utilities
├── scan-cache/             # 7-day scan result cache
├── revenue-gate-screenshots/ # Generated revenue loss screenshots
├── public/                 # Static assets
└── dist/                  # Build output
```

## Recent Updates (August 2025)

### Enhanced Caching & Performance
- ✅ 7-day scan result caching reduces API costs by 90%
- ✅ 10-minute AI recommendation caching for improved performance
- ✅ Fixed ES module compatibility issues in cache service
- ✅ Optimized scan time from 4+ minutes to ~2.5 minutes

### Revenue Loss Analysis
- ✅ Admin-triggered Revenue Loss Gate for employee demos
- ✅ Automated screenshot generation with Puppeteer
- ✅ Revenue opportunity calculations based on keyword performance
- ✅ Fixed screenshot generation to match live admin display

### AI Optimization
- ✅ Fixed unprofessional asterisk formatting in customer-facing recommendations
- ✅ Reduced OpenAI token usage from 1000 to 400 tokens per request
- ✅ Enhanced service-specific recommendations (text marketing, SEO, social, reviews)
- ✅ Intelligent fallback recommendations when API fails

### UI/UX Improvements
- ✅ Interactive keyword navigation with worst-to-best ranking order
- ✅ Real ranking positions instead of generic #1, #2, #3 badges
- ✅ Enhanced competitor intelligence with local pack data
- ✅ Service-specific emoji indicators for better visual hierarchy

## Known Limitations

- Restaurants with only social media pages (no website) have limited SEO analysis
- API rate limits may affect scan frequency for non-cached results
- Local pack data availability varies by location
- Screenshot generation requires cached scan data

## Contributing

Please see CLAUDE.md for detailed development guidelines and architecture documentation.

## License

Proprietary - Boostly