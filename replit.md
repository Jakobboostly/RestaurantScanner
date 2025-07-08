# Restaurant Scanner - Complete Full-Stack Application

## Overview

This is a comprehensive restaurant website scanner application built with React and Express.js. The application allows users to search for restaurants, analyze their websites, and receive detailed performance reports including SEO, mobile responsiveness, and user experience metrics. It's designed as a pixel-perfect clone of Owner.com's restaurant scanner functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library
- **UI Components**: Radix UI primitives for accessibility
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for client-side routing
- **Animations**: Framer Motion for smooth transitions

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: In-memory storage with interface for database integration
- **API Integration**: Google Places API, PageSpeed API, SERP API
- **Session Management**: Built-in session handling

## Key Components

### Database Schema
- **Restaurants Table**: Stores restaurant information including name, address, Google Place ID, domain, and ratings
- **Scans Table**: Stores website scan results with performance metrics, issues, and recommendations

### API Services
- **Restaurant Service**: Handles Google Places API integration for restaurant search and details
- **Scanner Service**: Manages website analysis using various APIs for performance, SEO, and mobile metrics

### Frontend Components
- **Restaurant Search**: Debounced search with Google Places integration
- **Scanning Animation**: Real-time progress tracking with visual feedback
- **Results Dashboard**: Comprehensive display of scan results with score gauges and recommendations
- **Score Gauge**: Reusable component for displaying performance metrics with color-coded ratings

## Data Flow

1. **Restaurant Search**: User enters restaurant name → Frontend queries Google Places API → Results displayed with ratings and location data
2. **Website Scanning**: User selects restaurant → Backend retrieves website details → Multiple API calls for performance analysis → Progress updates streamed to frontend
3. **Results Display**: Scan completion → Structured data presentation with scores, issues, and actionable recommendations

## External Dependencies

### Required APIs
- **Google Places API**: Restaurant search and business details
- **PageSpeed API**: Website performance metrics
- **SERP API**: Search engine ranking analysis

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production build optimization
- **TSX**: TypeScript execution in development

## Deployment Strategy

### Development
- Hot module replacement with Vite
- TypeScript checking with strict mode
- Real-time error overlay for debugging

### Production
- Vite build for optimized frontend bundle
- ESBuild for server-side compilation
- Static file serving integrated with Express
- Environment variable configuration for API keys

### Database Integration
- Drizzle ORM configured for PostgreSQL
- Migration system for schema changes
- Fallback to in-memory storage for development

## Changelog

- July 07, 2025. Initial setup
- July 07, 2025. Enhanced scanning animation with dynamic loading features:
  - Added floating background particles with movement and pulsing effects
  - Implemented scanning beam effects that sweep across the screen
  - Created double-ring spinning loader with counter-rotation
  - Enhanced progress bar with animated shine effect and pulsing indicator dot
  - Added colorful gradients and animations for each scanning step
  - Implemented minimum 3-second delays for each scanning phase
  - Added sub-step progress updates for more detailed feedback
  - Created floating action indicators with rotation animations
  - Applied glass-morphism design with backdrop blur effects
- July 08, 2025. Fixed online ordering detection system:
  - Removed hardcoded "no online ordering" assumption that flagged all restaurants
  - Implemented real website content analysis to detect ordering systems
  - Added keyword detection for common ordering platforms (DoorDash, UberEats, etc.)
  - Only shows online ordering issue when actually confirmed missing
  - Improved PageSpeed API to request performance category only for reliability
- July 08, 2025. Major architecture upgrade with advanced scanning capabilities:
  - Integrated Lighthouse + Puppeteer for comprehensive website analysis
  - Added mobile screenshot capture (375x667 viewport)
  - Implemented local Lighthouse fallback when PageSpeed API fails
  - Enhanced SEO analysis with on-page element extraction (title, meta, H1 tags, images)
  - Added competitor discovery using Google Places API with location-based search
  - Upgraded scanning phases: Restaurant Verification → Performance → SEO → Competitors → Final Report
  - Added proper error handling with graceful fallbacks for all external services
  - Enhanced schema with screenshot and detailed SEO analysis fields
- July 08, 2025. Complete migration to DataForSEO unified API provider:
  - Replaced 4 separate API integrations (Google Places, PageSpeed, SERP, Google API) with single DataForSEO provider
  - Implemented comprehensive DataForSEO service architecture with restaurant search, scanning, and analysis
  - Added advanced keyword research and tracking capabilities through DataForSEO
  - Enhanced competitor analysis with location-based search using DataForSEO business data
  - Integrated domain authority and backlink analysis for comprehensive SEO insights
  - Verified credentials and confirmed full API access with jakob@boostly.com account
  - Streamlined authentication from multiple API keys to single DataForSEO login system
- July 08, 2025. Hybrid API approach for optimal functionality:
  - Restored Google Places API for restaurant search and details (user requirement)
  - Maintained DataForSEO for website scanning, SEO analysis, and keyword research
  - Combined Google Places accuracy for restaurant data with DataForSEO's comprehensive scanning
  - Preserved fallback to mock data when Google Places API unavailable
  - Ensured proper error handling and graceful degradation for both API providers
- July 08, 2025. Eliminated all mock data for real-data-only approach:
  - Removed all mock restaurant data and fallback mechanisms
  - Restaurant search now requires valid Google Places API key or returns proper error
  - Competitor analysis returns empty results instead of mock data when API fails
  - Application enforces authentic data integrity throughout all components
  - Enhanced error handling to guide users toward proper API configuration
- July 08, 2025. DataForSEO service limitations identified and addressed:
  - DataForSEO provides: Real keyword search volumes, SERP ranking positions, competition data
  - DataForSEO does NOT provide: Performance audits, business data, domain analytics, backlink data
  - Updated scanner service to use only working DataForSEO endpoints
  - Removed non-functional API calls to prevent confusion and errors
  - Clarified actual DataForSEO value: keyword research and search ranking analysis
- July 08, 2025. Focused restaurant scanner architecture implemented:
  - Built GoogleBusinessService for Google Business Profile data, review sentiment, and photo analysis
  - Created MobileExperienceService using Puppeteer for mobile experience testing
  - Implemented FocusedScannerService combining Google Business Profile, competitor analysis, and mobile testing
  - Analysis includes: Business profile ratings, review sentiment, photo quality/quantity, competitor comparison, mobile responsiveness
  - Removed complex multi-API dependencies in favor of single Google API for comprehensive restaurant analysis
  - Enhanced schema with businessProfile and mobileExperience fields for detailed restaurant insights
- July 08, 2025. Fixed critical data display and JSON parsing issues:
  - Resolved all score display problems (Performance: 85/100, SEO: 84/100, Mobile: 85/100)
  - Fixed property name mismatches between frontend and backend (performance, seo, mobile, userExperience)
  - Added working keyword generation with 6 restaurant-specific keywords
  - Enhanced mobile experience service with real screenshot capture and content analysis
  - Fixed JSON parsing errors caused by unescaped characters in content analysis
  - Implemented proper schema markup detection and content analysis (title, meta description, H1 tags, links)
  - Mobile screenshots now captured successfully with Puppeteer (base64 encoded)
  - All scanner components now functional: keywords, competitors, screenshots, content analysis

## User Preferences

Preferred communication style: Simple, everyday language.