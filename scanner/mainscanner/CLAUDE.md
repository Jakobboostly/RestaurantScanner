# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with both frontend (Vite) and backend (Express.js) on port 3000
- `npm run build` - Build frontend (Vite) and backend (ESBuild) for production
- `npm start` - Run production build
- `npm run check` - TypeScript type checking across all files
- `npm run db:push` - Push database schema changes using Drizzle

### Testing
No test framework is configured. Manual testing is done via browser at `http://localhost:3000`.

## Architecture Overview

### Full-Stack Structure
This is a monorepo with frontend and backend in a single project:
- **Frontend**: React 18 + TypeScript in `client/` directory using Vite
- **Backend**: Express.js + TypeScript in `server/` directory 
- **Shared**: Common types and schemas in `shared/` directory
- **Database**: PostgreSQL with Drizzle ORM (falls back to in-memory storage for development)

### Core Application Flow
1. **Restaurant Search**: Users search restaurants via Google Places API (`/api/restaurants/search`)
2. **Professional Scanning**: Selected restaurants are analyzed via Server-Sent Events (`/api/scan/professional`)
3. **Multi-API Integration**: Concurrent analysis using Google Places, DataForSEO, Apify, and OpenAI
4. **Real-time Progress**: Live updates with persona-focused messaging ("Finding new customers", "Analyzing competitor gaps", "Checking review reputation", "Measuring marketing opportunities")
5. **Comprehensive Reporting**: Context-aware recommendations matching restaurant type (QSR vs FSR) with service-specific solutions

### Key Services Architecture
The `server/services/` directory contains specialized services:

- **advancedScannerService.ts**: Main orchestration service coordinating all scanning operations
- **restaurantService.ts**: Google Places API integration for restaurant search and details
- **enhancedDataForSeoService.ts**: DataForSEO API for keyword research, rankings, and technical SEO
- **apifyReviewsService.ts**: Web scraping for authentic Google Reviews via Apify
- **openaiReviewAnalysisService.ts**: GPT-4o sentiment analysis with comprehensive Boostly service recommendations (text marketing, social media, SEO, review management)
- **enhancedSocialMediaDetector.ts**: Multi-platform social media detection (Facebook, Instagram)
- **googleBusinessService.ts**: Google Business Profile analysis and optimization recommendations
- **urlRankingService.ts**: Direct URL ranking verification in search results

### API Integration Pattern
All external APIs are configured via environment variables with graceful fallbacks:
- Google Places API (GOOGLE_PLACES_API_KEY)
- DataForSEO (DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD)  
- OpenAI (OPENAI_API_KEY)
- Apify (APIFY_API_KEY)

### Frontend Architecture
- **UI Components**: shadcn/ui with Radix UI primitives in `client/src/components/ui/`
- **Business Components**: Restaurant-specific components in `client/src/components/`
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom Boostly branding (light purple theme)

## Development Guidelines

### API Key Configuration
Always check for API key availability before calling services. The application gracefully handles missing credentials by returning appropriate error messages rather than crashing.

### Data Integrity Principle
This application uses **authentic data only** - no mock or synthetic data. All services must handle API failures gracefully with empty states rather than placeholder content.

### Error Handling Pattern
Services implement comprehensive error handling with fallback mechanisms. Check existing services for patterns when adding new API integrations.

### Server-Sent Events
The main scanning endpoint uses SSE for real-time progress updates. Follow the pattern in `/api/scan/professional` for streaming responses.

### Database Schema
The schema is defined in `shared/schema.ts` using Drizzle ORM with Zod validation. Update both database tables and TypeScript types when modifying data structures.

## Environment Setup

### Required Environment Variables
```env
# Core APIs
GOOGLE_PLACES_API_KEY=your_key_here
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
OPENAI_API_KEY=your_key_here

# Optional APIs  
APIFY_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Development Database
The application falls back to in-memory storage when DATABASE_URL is not provided, making it easy to develop without PostgreSQL setup.

## Key Files to Understand

- `server/routes.ts` - All API endpoints and business logic
- `server/services/advancedScannerService.ts` - Main scanning orchestration
- `shared/schema.ts` - Database schema and TypeScript types
- `client/src/components/enhanced-results-dashboard.tsx` - Main results display component
- `vite.config.ts` - Frontend build configuration with path aliases

## Common Patterns

### Service Integration
When adding new external APIs, follow the pattern of existing services with proper error handling, timeout management, and graceful degradation.

### Component Structure  
UI components are organized with shadcn/ui primitives in `ui/` and business-specific components at the root of `components/`.

### TypeScript Usage
The project uses strict TypeScript. All API responses should be validated against Zod schemas defined in `shared/schema.ts`.

## Recent Updates (August 2025)

### Enhanced OpenAI Review Analysis System
- **Comprehensive Service Integration**: Updated OpenAI prompts to recommend all Boostly services (text marketing, social media management, SEO, review management) instead of just auto-responder
- **Context-Aware Recommendations**: System now considers restaurant type (QSR vs FSR) and location count for targeted suggestions
- **Smart Service Mapping**: Intelligent matching of customer complaints to appropriate Boostly services (e.g., wait times → text marketing, visibility issues → SEO)
- **Visual Service Indicators**: Added service-specific emojis (📱 text, 📸 social, 🔍 SEO, ⭐ reviews) in UI display

### Performance Optimizations  
- **Reduced Scan Time**: Cut artificial delays from 4 seconds to 1 second per phase, reducing total scan time by ~18 seconds
- **Persona-Focused Messaging**: Updated progress messages to align with restaurant owner priorities:
  1. "Finding new customers..."
  2. "Analyzing competitor gaps..."  
  3. "Checking review reputation..."
  4. "Measuring marketing opportunities..."

### Service Architecture Improvements
- **Restaurant Context Detection**: Automatic QSR/FSR classification based on name patterns, pricing, and business indicators
- **Enhanced Error Handling**: Robust fallbacks for restaurant name resolution and context determination
- **Service Recommendation Parsing**: Advanced text processing to extract and format service-specific recommendations from OpenAI responses

### Text Marketing Focus & Customer Retention (August 6, 2025)
- **Specialized Text Marketing Prompts**: Tailored OpenAI LLM prompts to focus specifically on customer retention strategies
- **Text Club Promotion Strategy**: Updated service recommendations to emphasize building text clubs for promotions and bringing customers back
- **Customer Return Focus**: Modified all text marketing suggestions to prioritize getting existing customers to return to the restaurant

### Local SEO Competitive Intelligence Enhancement (August 6, 2025)
- **Local Search Visibility Analysis**: Completely redesigned Local section with competitive positioning data
- **Interactive Keyword Performance**: Added real-time local keyword ranking visualization with color-coded position indicators
- **Competitive Metrics Dashboard**: Displays Top 3 rankings, average search volume, and missing rankings for immediate actionable insights
- **Restaurant Owner Focused**: Transformed basic "missing ingredients" into competitive intelligence that restaurant owners actually need

### Keyword Ranking Optimization (August 6, 2025)
- **Worst-to-Best Ranking Order**: Updated all keyword displays to show worst performing keywords first so restaurant owners prioritize what needs attention
- **Enhanced Position Handling**: Special logic to treat "not ranked" (position 0/null) as worst position (999) for proper sorting
- **Priority-Based Display**: Restaurant owners now see keywords needing immediate improvement at the top of all lists

### Cuisine Detection System Overhaul (August 6, 2025)
- **Three-Phase Detection System**: Implemented bulletproof cuisine detection using Google Places types, advanced pattern matching, and contextual analysis
- **Greek Cuisine Specialization**: Separated Greek restaurants from Mediterranean category with higher confidence scoring (0.95 vs 0.9)
- **Enhanced Breakfast Detection**: Improved compound pattern matching for names like "Hash Kitchen" → breakfast cuisine
- **Comprehensive Pattern Library**: Added 200+ cuisine-specific patterns with confidence scoring across 20+ cuisine categories
- **Advanced Debugging**: Detailed logging throughout all detection phases for troubleshooting and accuracy verification

### Competitor Analysis Strategy & Roadmap (August 6, 2025)
- **Comprehensive Gap Analysis**: Identified critical missing competitor intelligence (local restaurant discovery, operational data, customer overlap)
- **Three-Phase Implementation Plan**: Detailed roadmap for transforming scanner from basic SEO tool to comprehensive competitive intelligence platform
- **Tool Requirements Assessment**: Evaluated existing APIs (Google Places, DataForSEO, Apify, OpenAI) and identified new tools needed for advanced competitor analysis
- **ROI Projections**: Phase 1 (40% improvement), Phase 2 (70% increase in insights), Phase 3 (90% coverage of restaurant owner needs)

### Interactive Keyword Navigation Enhancement (August 7, 2025)
- **Toggleable Keyword Selection**: Implemented interactive navigation for "See Where You Rank" section allowing users to cycle through all 8 competitive opportunity keywords
- **Arrow Navigation Interface**: Added left/right chevron arrows with circular navigation (first ↔ last) for seamless keyword browsing
- **Real-time Ranking Display**: Each keyword shows current Google ranking position with color-coded indicators (🟢 Top 3, 🟡 4-10, 🔴 11+ or Not Ranked)
- **Dynamic Search Integration**: "See Where You Rank" button dynamically updates to search Google for the currently selected keyword
- **Progressive Enhancement**: Maintains backward compatibility with fallback to original search terms when competitive keywords unavailable
- **Visual Progress Indicators**: Shows "X / Y" counter indicating current keyword position in the navigation sequence