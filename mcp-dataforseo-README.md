# DataForSEO MCP Server

A comprehensive Model Context Protocol (MCP) server that provides professional-grade SEO analysis capabilities through DataForSEO's APIs. Perfect for AI agents, chatbots, and automated SEO workflows.

## Features

### 🔍 Keyword Research
- **Real search volume data** from Google
- **Keyword difficulty scoring** for competitive analysis
- **Related keyword suggestions** (up to 100 per query)
- **Search intent classification** (transactional, informational, local, etc.)

### 🏆 Competitor Analysis
- **Domain competitor discovery** with traffic estimates
- **Organic keyword comparison** between domains
- **Competition level assessment** (high/medium/low)
- **Market positioning insights**

### 📊 SERP Analysis
- **Real-time ranking positions** for any keyword/domain combination
- **SERP feature detection** (Featured Snippets, Local Pack, Knowledge Graph)
- **Top competitor identification** with ranking data
- **Mobile vs desktop analysis**

### 🔧 Technical SEO Audit
- **Page-level issue detection** (4xx errors, slow loading, large files)
- **Backlink profile analysis** with quality scoring
- **Domain authority calculation**
- **Technical score with recommendations**

### 🔗 Backlink Analysis
- **Comprehensive backlink profiling** with quality metrics
- **Domain authority scoring** based on link profile
- **Dofollow/nofollow distribution analysis**
- **Top referrer identification**

### 🍕 Restaurant SEO Specialization
- **Local SEO keyword targeting** with location-based research
- **Cuisine-specific optimization** recommendations
- **"Near me" search optimization**
- **Local competitor analysis**

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- DataForSEO API credentials

### Setup

1. **Install dependencies:**
```bash
npm install @modelcontextprotocol/sdk axios tsx typescript
```

2. **Set environment variables:**
```bash
export DATAFOREO_LOGIN="your_login@email.com"
export DATAFOREO_PASSWORD="your_api_password"
```

3. **Make executable:**
```bash
chmod +x mcp-dataforseo-server.ts
```

## Usage

### Running the Server

**Standalone:**
```bash
tsx mcp-dataforseo-server.ts
```

**With Claude Desktop:**
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "dataforseo": {
      "command": "tsx",
      "args": ["path/to/mcp-dataforseo-server.ts"],
      "env": {
        "DATAFOREO_LOGIN": "your_login@email.com",
        "DATAFOREO_PASSWORD": "your_api_password"
      }
    }
  }
}
```

### Available Tools

#### 1. Keyword Research
```json
{
  "name": "keyword_research",
  "arguments": {
    "keyword": "pizza restaurant",
    "location": "United States",
    "limit": 100
  }
}
```

**Returns:**
- Primary keyword data (search volume, difficulty, CPC)
- 20 related keywords with metrics
- Search intent classification
- Competition analysis

#### 2. Competitor Analysis
```json
{
  "name": "competitor_analysis",
  "arguments": {
    "domain": "dominos.com",
    "location": "United States",
    "limit": 10
  }
}
```

**Returns:**
- Top competitors with traffic estimates
- Organic keyword counts
- Competition level assessment
- Market positioning insights

#### 3. SERP Analysis
```json
{
  "name": "serp_analysis",
  "arguments": {
    "keyword": "pizza delivery",
    "domain": "dominos.com",
    "location": "United States",
    "device": "mobile"
  }
}
```

**Returns:**
- Current ranking position
- Top 5 competitors in SERP
- SERP features present
- Ranking quality assessment

#### 4. Technical SEO Audit
```json
{
  "name": "technical_seo_audit",
  "arguments": {
    "domain": "pizzahut.com",
    "page_limit": 100,
    "backlink_limit": 1000
  }
}
```

**Returns:**
- Technical issues breakdown
- Backlink profile analysis
- Domain authority score
- Actionable recommendations

#### 5. Backlink Analysis
```json
{
  "name": "backlink_analysis",
  "arguments": {
    "domain": "pizzahut.com",
    "limit": 1000,
    "dofollow_only": true
  }
}
```

**Returns:**
- Comprehensive backlink metrics
- Quality distribution analysis
- Top 20 referring domains
- Link building recommendations

#### 6. Restaurant SEO Analysis
```json
{
  "name": "restaurant_seo_analysis",
  "arguments": {
    "restaurant_name": "Mario's Pizza",
    "location": "New York, NY",
    "cuisine_type": "Italian",
    "domain": "mariospizza.com"
  }
}
```

**Returns:**
- Restaurant-specific keyword opportunities
- Local SEO recommendations
- Competitor analysis for local market
- Citation and review optimization tips

## DataForSEO API Endpoints Used

### Keyword Data
- `/keywords_data/google/keyword_difficulty/live` - Real difficulty scores
- `/keywords_data/google/keyword_suggestions/live` - Comprehensive suggestions
- `/keywords_data/google/search_volume/live` - Accurate search volumes

### Competitor Intelligence
- `/dataforseo_labs/google/competitors_domain/live` - Domain competitor discovery
- `/dataforseo_labs/google/bulk_traffic_estimation/live` - Traffic analysis

### SERP Analysis
- `/serp/google/organic/live/advanced` - Real-time rankings

### Technical Analysis
- `/on_page/pages/live` - Page-level technical issues
- `/backlinks/backlinks/live` - Comprehensive backlink data

## Real-World Use Cases

### 1. AI-Powered SEO Audits
```bash
# Restaurant owner asks: "How is my pizza restaurant performing in SEO?"
Tool: restaurant_seo_analysis
Result: Complete local SEO analysis with specific recommendations
```

### 2. Competitive Research
```bash
# Marketing agency asks: "Who are the top competitors for 'sushi delivery'?"
Tool: serp_analysis + competitor_analysis
Result: Detailed competitive landscape with traffic estimates
```

### 3. Content Strategy
```bash
# Content creator asks: "What keywords should I target for Italian restaurants?"
Tool: keyword_research
Result: 100+ keyword opportunities with difficulty and volume data
```

### 4. Technical SEO Monitoring
```bash
# Developer asks: "What technical issues does this restaurant website have?"
Tool: technical_seo_audit
Result: Comprehensive technical analysis with prioritized fixes
```

## Error Handling

The server includes comprehensive error handling:
- **API Authentication:** Clear error messages for credential issues
- **Rate Limiting:** Automatic retry logic for API limits
- **Data Validation:** Input validation before API calls
- **Graceful Degradation:** Fallback responses when APIs are unavailable

## Rate Limits & Costs

DataForSEO pricing is based on API calls:
- **Keyword Research:** ~$0.01-0.05 per query
- **SERP Analysis:** ~$0.01-0.02 per query
- **Backlink Analysis:** ~$0.10-0.50 per domain
- **Technical Audit:** ~$0.05-0.20 per domain

The server includes built-in caching to minimize API costs.

## Security

- **Environment Variables:** Credentials stored securely
- **Input Validation:** All inputs sanitized
- **HTTPS Only:** Secure API communication
- **No Data Storage:** No sensitive data persisted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create a GitHub issue
- Check DataForSEO documentation
- Review MCP specification

---

**Built with ❤️ for the SEO community**

Transform any AI system into a professional SEO analysis powerhouse with real DataForSEO intelligence.