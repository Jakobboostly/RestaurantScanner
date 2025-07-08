# Restaurant Scanner - Professional Analysis Tool

A comprehensive restaurant website performance analysis platform that provides instant, actionable insights through advanced AI-driven scanning, competitive intelligence, and real-time monitoring technologies.

## 🚀 Features

### Core Functionality
- **Restaurant Search**: Google Places API integration for accurate restaurant discovery
- **Performance Analysis**: Lighthouse-powered website auditing with fallback systems
- **SEO Intelligence**: SERP API integration for keyword rankings and competitive analysis
- **Mobile Experience**: Puppeteer-based mobile screenshot capture and responsiveness testing
- **Reviews Analysis**: Comprehensive sentiment analysis with Zembratech integration
- **Competitor Analysis**: Location-based competitor discovery and benchmarking

### Advanced Analytics
- **Real-time Scanning**: Live progress updates with streaming results
- **Multi-source Data**: Google Places, Lighthouse, SERP API, Puppeteer, Zembratech
- **Visual Dashboards**: Interactive charts and gauges for performance metrics
- **Actionable Insights**: Prioritized recommendations with impact and effort estimates
- **Professional UI**: Boostly-branded interface with responsive design

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **Framer Motion** for animations
- **React Query** for state management
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **In-memory storage** for development
- **Server-Sent Events** for real-time updates
- **Multi-API integration** architecture

### APIs & Services
- **Google Places API** - Restaurant search and business details
- **Lighthouse** - Website performance auditing
- **SERP API** - Keyword rankings and competitor analysis
- **Puppeteer** - Mobile screenshot capture
- **Zembratech** - Reviews analysis and sentiment processing

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- API keys for external services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/restaurant-scanner.git
   cd restaurant-scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Required API Keys
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   PAGESPEED_API_KEY=your_pagespeed_api_key
   SERP_API_KEY=your_serp_api_key
   ZEMBRATECH_API_KEY=your_zembratech_api_key
   
   # Optional: DataForSEO (alternative provider)
   DATAFOREO_LOGIN=your_dataforeo_login
   DATAFOREO_PASSWORD=your_dataforeo_password
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### API Key Setup

#### Google APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Places API and PageSpeed Insights API
4. Create credentials and copy the API keys

#### SERP API
1. Sign up at [SerpApi](https://serpapi.com/)
2. Get your API key from the dashboard
3. Add to environment variables

#### Zembratech
1. Contact Zembratech for API access
2. Add credentials to environment variables

## 📁 Project Structure

```
restaurant-scanner/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities and helpers
├── server/                 # Backend Express application
│   ├── services/          # API integration services
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data storage layer
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schemas and types
└── attached_assets/        # Project assets and screenshots
```

## 🎯 Usage

### Basic Scanning
1. **Search Restaurant**: Enter restaurant name in the search field
2. **Select Location**: Choose from Google Places results
3. **Start Scan**: Click "Analyze Website" to begin comprehensive analysis
4. **View Results**: Navigate through tabs for detailed insights

### Analysis Tabs
- **Overview**: Overall scores and key metrics
- **Keywords**: Search rankings and keyword opportunities
- **SEO**: Technical SEO analysis and recommendations
- **Mobile**: Mobile experience and responsiveness
- **Competitors**: Local competitor analysis and benchmarking
- **Reviews**: Sentiment analysis and reputation insights
- **Actions**: Prioritized recommendations with impact estimates

### Professional Features
- **Real-time Progress**: Live scanning updates with streaming results
- **Fallback Systems**: Robust error handling with alternative data sources
- **Authentic Data**: No mock or synthetic data - real-world analysis only
- **Export Results**: Detailed reports for client presentations

## 🔐 Security & Privacy

- All API keys stored securely in environment variables
- No sensitive data logged or stored persistently
- HTTPS enforcement for all external API calls
- Client-side data validation and sanitization

## 📊 Performance Optimizations

- **Concurrent API Calls**: Parallel processing for faster results
- **Caching Layer**: Redis-based caching for repeated requests
- **Fallback Metrics**: Intelligent fallbacks when APIs fail
- **Rate Limiting**: Respect API rate limits with queue management

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required API keys are set in production environment.

## 📈 Recent Updates

- **July 2025**: Added comprehensive reviews analysis with sentiment breakdown
- **July 2025**: Implemented fallback metrics system for improved reliability
- **July 2025**: Enhanced competitor analysis with location-based discovery
- **July 2025**: Added real-time review streaming during scan process
- **July 2025**: Integrated professional UI with Boostly branding

## 🤝 Contributing

This is a proprietary project for Boostly's marketing packages. For internal development:

1. Follow the coding standards in `replit.md`
2. Test all API integrations thoroughly
3. Ensure authentic data integrity
4. Update documentation with changes

## 📝 License

Proprietary - Boostly Marketing Platform

## 📞 Support

For technical support or API issues:
- Check the console logs for detailed error messages
- Verify API key validity and permissions
- Consult the `replit.md` for troubleshooting guidance

---

**Built with ❤️ for Boostly Marketing Platform**