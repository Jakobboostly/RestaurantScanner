# Deploy Restaurant Scanner to boostly.com/restaurant-health-score

## Quick Overview
Your restaurant scanner app is built and ready for deployment. You have several options to get it running at boostly.com/restaurant-health-score.

## Production Files Ready
✅ Built successfully - production files are in `/dist` folder:
- `dist/index.js` - Your server (333.8kb)
- `dist/public/` - Frontend assets (516.58 kB)
- All dependencies bundled and optimized

## Deployment Options

### Option A: Upload to Your Existing boostly.com Server

**What you need:**
1. Node.js installed on your server
2. Your API keys (Google Places, DataForSEO, OpenAI)
3. PostgreSQL database (optional - has fallback)

**Steps:**
1. **Upload files** - Copy entire `/dist` folder to your server
2. **Install Node.js modules** - Run `npm install --production` 
3. **Set environment variables:**
   ```bash
   export GOOGLE_PLACES_API_KEY="your_key_here"
   export DATAFORSEO_LOGIN="your_login"
   export DATAFORSEO_PASSWORD="your_password" 
   export OPENAI_API_KEY="your_openai_key"
   export DATABASE_URL="your_postgres_url" # optional
   ```
4. **Configure path routing** - Set up your web server (Apache/Nginx) to route `/restaurant-health-score` to the Node.js app
5. **Start the app** - Run `node index.js`

### Option B: Replit Deployment + Custom Domain

**Steps:**
1. Click "Deploy" button in Replit
2. Get your .repl.app URL 
3. Configure DNS/proxy to point boostly.com/restaurant-health-score to Replit

### Option C: Subdomain Deployment

Deploy at `restaurant-health-score.boostly.com` instead of a path.

## Required Environment Variables
```
GOOGLE_PLACES_API_KEY=your_google_places_key
DATAFORSEO_LOGIN=your_dataforseo_login  
DATAFORSEO_PASSWORD=your_dataforseo_password
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql://... (optional - uses in-memory fallback)
PORT=5000 (or your preferred port)
```

## Web Server Configuration (Apache/Nginx)

### Nginx Example
```nginx
location /restaurant-health-score/ {
    proxy_pass http://localhost:5000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### Apache Example  
```apache
ProxyPass /restaurant-health-score/ http://localhost:5000/
ProxyPassReverse /restaurant-health-score/ http://localhost:5000/
ProxyPreserveHost On
```

## Health Check
Once deployed, test at: `https://boostly.com/restaurant-health-score`

## Need Help?
- **API Keys**: Make sure all required API keys are configured
- **Port conflicts**: Change PORT environment variable if 5000 is taken
- **Database**: App works without database using in-memory storage
- **SSL/HTTPS**: Your existing boostly.com SSL certificate will cover the path

## File Structure Deployed
```
dist/
├── index.js              # Node.js server (ES modules)
└── public/
    ├── index.html         # React app entry point
    ├── assets/           # CSS, JS, images
    └── boostly-logo.svg  # Your logo
```

The app is optimized, production-ready, and includes all the features:
- Restaurant search and scanning
- Performance analysis
- SEO insights  
- Mobile experience testing
- Competitive analysis
- Real-time progress tracking