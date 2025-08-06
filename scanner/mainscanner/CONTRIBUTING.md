# Contributing to Restaurant Scanner

## Development Guidelines

This project follows specific development patterns for consistency and maintainability.

### Code Style

#### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` types - use proper typing
- Use `async/await` instead of `.then()` chains

#### React Components
- Use functional components with hooks
- Prefer `const` for component declarations
- Use TypeScript for prop types
- Implement proper error boundaries

#### API Integration
- Always use authentic data from real APIs
- Implement proper error handling with fallbacks
- Use environment variables for API keys
- Respect rate limits and implement caching

### Architecture Patterns

#### Frontend Structure
```
client/src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── lib/           # Utilities and helpers
└── hooks/         # Custom React hooks
```

#### Backend Structure
```
server/
├── services/      # API integration services
├── routes.ts      # Express route definitions
├── storage.ts     # Data storage layer
└── index.ts       # Server entry point
```

### Data Flow

1. **Search Flow**: User input → Google Places API → Results display
2. **Scanning Flow**: Restaurant selection → Multiple API calls → Real-time updates → Results dashboard
3. **Analysis Flow**: Raw data → Processing services → Structured insights → UI components

### API Integration Standards

#### Service Layer Pattern
```typescript
export class ExampleService {
  constructor(private apiKey: string) {}
  
  async getData(params: InputType): Promise<OutputType> {
    try {
      // API call implementation
    } catch (error) {
      // Error handling with fallbacks
    }
  }
}
```

#### Error Handling
- Always provide meaningful error messages
- Implement graceful degradation
- Use fallback systems for critical functionality
- Log errors for debugging

### Testing Guidelines

#### Unit Tests
- Test all service layer functions
- Mock external API calls
- Test error scenarios
- Verify data transformations

#### Integration Tests
- Test API endpoints
- Verify database operations
- Test real-time updates
- Check authentication flows

### Performance Standards

#### Frontend Performance
- Lazy load components where appropriate
- Implement proper React optimization (useMemo, useCallback)
- Minimize re-renders with proper state management
- Use React Query for server state caching

#### Backend Performance
- Implement API response caching
- Use connection pooling for databases
- Optimize database queries
- Implement rate limiting

### Security Requirements

#### API Security
- Never expose API keys in client code
- Use environment variables for secrets
- Implement proper CORS configuration
- Validate all user inputs

#### Authentication
- Implement secure session management
- Use HTTPS in production
- Sanitize user inputs
- Implement proper error handling

### Documentation Standards

#### Code Documentation
- Document complex business logic
- Add JSDoc comments for public APIs
- Include usage examples
- Document error scenarios

#### API Documentation
- Document all endpoints
- Include request/response examples
- Document error responses
- Provide integration guides

### Git Workflow

#### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `hotfix/*`: Critical fixes

#### Commit Messages
```
feat: add reviews analysis functionality
fix: resolve API timeout issues
docs: update setup instructions
refactor: improve performance metrics service
```

### Development Environment

#### Required Tools
- Node.js 18+
- npm or yarn
- TypeScript
- ESLint + Prettier
- Git

#### Setup Process
1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Add your API keys
5. Start development: `npm run dev`

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval

### Code Review Guidelines

#### What to Review
- Code functionality and logic
- TypeScript type safety
- Error handling implementation
- Performance implications
- Security considerations
- Documentation completeness

#### Review Criteria
- Does it solve the problem?
- Is it maintainable?
- Are there any security issues?
- Is it properly tested?
- Is documentation updated?

### Deployment Process

#### Pre-deployment Checklist
- [ ] All tests passing
- [ ] API keys configured
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Performance tested
- [ ] Security scan passed

#### Deployment Steps
1. Build application: `npm run build`
2. Run tests: `npm test`
3. Deploy to staging
4. Run integration tests
5. Deploy to production
6. Monitor for issues

### Support and Maintenance

#### Issue Reporting
- Use GitHub Issues for bug reports
- Include reproduction steps
- Provide error logs
- Specify environment details

#### Maintenance Tasks
- Regular dependency updates
- API key rotation
- Performance monitoring
- Security updates

### Resources

#### Documentation
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Setup instructions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [replit.md](replit.md) - Development context

#### External APIs
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [SERP API](https://serpapi.com/search-api)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Questions?** Check the documentation or create an issue for support.