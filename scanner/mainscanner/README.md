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

### 📊 Competitor Intelligence
- Identifies top 3 local competitors for each keyword
- Tracks competitor rankings and visibility
- Analyzes competitive gaps and opportunities
- Local search dominance metrics

### ⭐ Review Analysis
- Sentiment analysis of Google Reviews using GPT-4
- Customer mood tracking and insights
- Review trend identification
- Actionable recommendations based on customer feedback

### 📱 Social Media Detection
- Automatic detection of Facebook, Instagram, and other social profiles
- Verification of social media presence
- Integration with Google Business Profile data

### 🚀 Performance Metrics
- Page load speed analysis
- Mobile responsiveness checking
- Core Web Vitals monitoring
- Technical SEO audit

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

### UI Components
- `enhanced-results-dashboard.tsx` - Main results display
- `premium-score-dashboard.tsx` - Visual scoring metrics
- `ui/` - Reusable UI components (shadcn/ui)

## Performance

- **Scan Time**: ~2.5 minutes for complete analysis
- **Batch Processing**: Multiple keywords processed in single API calls
- **Real-time Updates**: Server-sent events for progress tracking
- **Error Recovery**: Graceful handling of API failures

## Development

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm start` - Run production build

### Project Structure
```
mainscanner/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── public/          # Static assets
└── dist/           # Build output
```

## Known Limitations

- Restaurants with only social media pages (no website) have limited SEO analysis
- API rate limits may affect scan frequency
- Local pack data availability varies by location

## Contributing

Please see CLAUDE.md for detailed development guidelines and architecture documentation.

## License

Proprietary - Boostly