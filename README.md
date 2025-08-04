# Restaurant Scanner - AI-Powered Marketing Intelligence Platform

The Restaurant Scanner is an AI-powered marketing intelligence platform that analyzes any restaurant's complete digital presence in under 30 seconds, providing actionable insights across search rankings, social media, website performance, local SEO, and customer reviews. It uses real data from Google Places, DataForSEO, and other authentic sources to identify exactly where restaurants are losing customers online and provides prioritized recommendations to fix these issues.

## 🚀 Features

### Core Functionality
- **30-Second Analysis**: Complete digital presence audit in under 30 seconds
- **Restaurant Discovery**: Google Places API integration for accurate restaurant search
- **Search Performance**: Real DataForSEO rankings showing where restaurants appear in Google searches
- **Social Media Detection**: Finds Facebook and Instagram pages across multiple URL formats
- **Website Analysis**: Live performance testing with Google PageSpeed Insights and mobile screenshots
- **Review Intelligence**: AI-powered analysis of up to 100 customer reviews with sentiment breakdown
- **Competitive Analysis**: Identifies local competitors and shows "where your competition is winning"

### Advanced Intelligence
- **Real-time Progress**: Live scanning updates with visual progress indicators
- **Authentic Data Only**: No mock data - uses real Google Places, DataForSEO, and OpenAI APIs
- **AI-Powered Insights**: OpenAI GPT-4o analyzes customer reviews and generates business recommendations
- **Visual Proof**: Screenshots of actual Google search results showing restaurant rankings
- **Prioritized Actions**: High/Medium/Low priority recommendations with specific solutions

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
- **Google Places API** - Restaurant search, business details, photos, and reviews
- **DataForSEO** - Real search rankings, keyword research, and SEO analysis
- **OpenAI GPT-4o** - Customer review sentiment analysis and business insights
- **Google PageSpeed Insights** - Website performance and mobile experience testing
- **Selenium WebDriver** - Google search result screenshots and ranking verification

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
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   DATAFORSEO_LOGIN=your_dataforseo_login
   DATAFORSEO_PASSWORD=your_dataforseo_password
   OPENAI_API_KEY=your_openai_api_key
   
   # Optional: Database (uses in-memory storage if not provided)
   DATABASE_URL=postgresql://user:password@localhost:5432/restaurant_scanner
   
   # Optional: Port configuration
   PORT=5000
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### API Key Setup

#### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Places API
4. Create credentials and copy the API key

#### DataForSEO
1. Sign up at [DataForSEO](https://dataforseo.com/)
2. Get your login credentials from the dashboard
3. Add login and password to environment variables

#### OpenAI
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Create an API key in your account settings
3. Add to environment variables

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

### How It Works
1. **Enter Restaurant Name**: Type any restaurant name in the search field
2. **Select from Results**: Choose from Google Places search results
3. **30-Second Analysis**: Watch real-time progress as the system analyzes 5 key areas
4. **Get Action Plan**: View prioritized recommendations with specific solutions

### Dashboard Sections
- **Overall Score**: Comprehensive digital health score with AI explanations
- **Search Performance**: Google ranking positions and keyword opportunities
- **Social Presence**: Facebook/Instagram detection and engagement analysis
- **Local SEO**: Google Business Profile optimization and competitive positioning
- **Website Performance**: Speed, mobile experience, and technical issues
- **Reviews Analysis**: AI-powered sentiment analysis of customer feedback

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

- **July 23, 2025**: Fixed ES module compatibility issues for deployment readiness
- **July 22, 2025**: Added competitive opportunity analysis showing where competition outranks restaurant
- **July 22, 2025**: Enhanced DataForSEO integration with website URL validation and keyword limits
- **July 22, 2025**: Implemented MCP integration with authentic DataForSEO ranked keywords API
- **July 22, 2025**: Fixed Instagram detection workflow with timeout and selector improvements
- **July 22, 2025**: Added OpenAI customer mood analysis with 100-review processing

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