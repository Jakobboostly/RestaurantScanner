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

## User Preferences

Preferred communication style: Simple, everyday language.