# Restaurant Scanner - Complete Full-Stack Application

## Overview

This is a comprehensive restaurant website scanner application built with React and Express.js. The application allows users to search for restaurants, analyze their websites, and receive detailed performance reports including SEO, mobile responsiveness, and user experience metrics. It's designed as a pixel-perfect clone of Owner.com's restaurant scanner functionality, aiming to provide a complete marketing intelligence solution for restaurants, covering business vision, market potential, and project ambitions to empower restaurants with actionable insights for online visibility and growth.

## User Preferences

Preferred communication style: Simple, everyday language.
Data integrity: No mock data - system must work with authentic data only, gracefully handling API failures with empty states.
Required APIs: Google Places API for restaurant search, DataForSEO for performance analysis and keyword rankings, Zembratech for reviews analysis.
Core requirements: Performance scores, SEO analysis, mobile testing, keyword rankings (10 keywords), 5 competitors analysis, action plan with priority issues, meta tags extraction, social links detection.
GitHub Integration: Successfully connected to GitHub with complete repository deployment including custom Boostly branding.
Google Business Profile limitations: Response rate and response time data not available from Google Places API - requires manual tracking or alternative data sources.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui and Radix UI primitives
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Animations**: Framer Motion
- **UI/UX Decisions**: Professional light purple color scheme (Boostly branding), pixel-perfect design, score gauges, comprehensive dashboards, embedded Google search modal, actionable insights with priority-based recommendations (Missing Ingredients, Where customers love you, Where your customers want you to improve), AI-powered scoring dashboard with personalized explanations, image galleries for visual analysis.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (fallback to in-memory for dev)
- **API Integration**: Google Places API, PageSpeed API, SERP API, DataForSEO, Apify (for reviews and social media), OpenAI (for sentiment analysis)
- **Core Services**: Restaurant Service (Google Places), Scanner Service (website analysis), UrlRankingService (direct URL ranking), EnhancedSocialMediaDetector (multi-layered social media detection), ApifyReviewsService (authentic review collection), OpenAI for customer mood analysis, Zembratech (for sentiment analysis, if functional).
- **Session Management**: Built-in session handling
- **Architecture Patterns**: Microservices approach for API integrations, robust error handling with fallback mechanisms, parallel processing for speed optimization (e.g., PageSpeed API calls), background processing for long-running tasks (e.g., OpenAI analysis), intelligent timeout management.
- **Key Features**: Comprehensive website scanning, real-time progress tracking, dynamic keyword generation (cuisine-specific, branded, competitive), authentic ranking analysis (URL-based, Local Finder API), social media detection (Facebook, Instagram), Google Business Profile analysis (completeness, photos, reviews), sentiment analysis of reviews, dynamic recommendation system for marketing improvements, and secure API key management.
- **Deployment**: Vite for frontend, ESBuild for backend, static file serving, environment variable configuration, flexible Chrome binary detection for various environments.
- **Data Flow**: User searches for restaurant → Frontend queries Google Places → User selects restaurant → Backend initiates multi-API scan (PageSpeed, DataForSEO, Apify) → Progress updates streamed to frontend → Scan results displayed with scores, issues, and recommendations.

## External Dependencies

- **Google Places API**: Restaurant search, business details, photos, addresses.
- **PageSpeed API**: Website performance metrics (desktop and mobile).
- **SERP API**: Search engine ranking analysis (organic and local pack).
- **DataForSEO**: Keyword research (search volume, difficulty, suggestions), competitor analysis, backlink analysis, technical SEO auditing.
- **Apify**: Web scraping for authentic Google Reviews (via `compass/crawler-google-places` actor) and Facebook posts.
- **OpenAI**: GPT-4o for comprehensive customer mood and sentiment analysis from reviews.
- **Selenium WebDriver**: For robust SERP screenshot capture and website interaction, with PostgreSQL storage.
- **Zembratech**: For advanced review sentiment analysis (currently identified as non-functional due to network errors).
```