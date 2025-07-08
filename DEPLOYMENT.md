# Restaurant Scanner - Deployment Guide

## Production Deployment Options

### 1. Vercel (Recommended)
**Perfect for React + Node.js applications**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configuration** (`vercel.json`):
```json
{
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

### 2. Railway
**Simple Node.js deployment**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway deploy
```

### 3. Render
**Free tier available**

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables

### 4. Heroku
**Traditional PaaS option**

```bash
# Install Heroku CLI
npm i -g heroku

# Create app
heroku create restaurant-scanner

# Deploy
git push heroku main
```

## Environment Variables for Production

Set these in your deployment platform:

```env
# Required API Keys
GOOGLE_API_KEY=your_google_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
PAGESPEED_API_KEY=your_pagespeed_api_key
SERP_API_KEY=your_serp_api_key

# Optional
ZEMBRATECH_API_KEY=your_zembratech_api_key
DATAFOREO_LOGIN=your_dataforeo_login
DATAFOREO_PASSWORD=your_dataforeo_password

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Application
NODE_ENV=production
PORT=5000
```

## Build Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Build Backend
```bash
npm run build:server
```

### 4. Start Production Server
```bash
npm start
```

## Database Setup for Production

### PostgreSQL Configuration
```bash
# Install PostgreSQL
# Create database
createdb restaurant_scanner

# Run migrations
npm run db:push

# Seed data (optional)
npm run db:seed
```

### Connection String Format
```
postgresql://username:password@hostname:port/database
```

## Performance Optimizations

### 1. Caching Strategy
- Redis for API response caching
- CDN for static assets
- Browser caching headers

### 2. API Rate Limiting
- Implement rate limiting middleware
- Use queue systems for batch processing
- Monitor API usage patterns

### 3. Database Optimization
- Connection pooling
- Query optimization
- Proper indexing

## Monitoring & Logging

### 1. Error Tracking
```javascript
// Add to server/index.ts
import Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

### 2. Performance Monitoring
```javascript
// Add APM monitoring
import newrelic from 'newrelic';
```

### 3. Health Checks
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

## Security Considerations

### 1. API Key Security
- Never commit keys to git
- Use environment variables
- Rotate keys regularly
- Restrict API key domains

### 2. HTTPS Configuration
```javascript
// Force HTTPS in production
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 3. Security Headers
```javascript
import helmet from 'helmet';
app.use(helmet());
```

## Scaling Considerations

### 1. Load Balancing
- Use multiple server instances
- Implement health checks
- Configure auto-scaling

### 2. Database Scaling
- Read replicas for queries
- Connection pooling
- Query optimization

### 3. API Rate Management
- Implement queuing systems
- Use circuit breakers
- Monitor API limits

## Backup Strategy

### 1. Database Backups
```bash
# Automated daily backups
pg_dump restaurant_scanner > backup_$(date +%Y%m%d).sql
```

### 2. Environment Backup
- Document all environment variables
- Store in secure location
- Test restoration process

## Rollback Strategy

### 1. Blue-Green Deployment
- Deploy to staging environment
- Test thoroughly
- Switch traffic gradually

### 2. Database Migrations
- Always backup before migrations
- Use reversible migrations
- Test rollback procedures

## Post-Deployment Checklist

- [ ] All API keys configured
- [ ] Database connected and migrated
- [ ] SSL certificate installed
- [ ] Error monitoring configured
- [ ] Performance monitoring active
- [ ] Backup systems running
- [ ] Health checks responding
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Documentation updated

## Troubleshooting

### Common Issues
1. **API timeouts**: Increase timeout values
2. **Database connection errors**: Check connection string
3. **Build failures**: Verify Node.js version
4. **Memory issues**: Increase server resources

### Debug Commands
```bash
# Check logs
npm run logs

# Test API endpoints
curl https://your-domain.com/api/health

# Monitor performance
npm run monitor
```

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review error logs
3. Verify environment variables
4. Test locally first
5. Contact platform support if needed