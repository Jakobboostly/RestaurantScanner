#!/usr/bin/env node

/**
 * DataForSEO MCP Server
 * 
 * Provides comprehensive SEO analysis capabilities through the Model Context Protocol
 * Supports keyword research, competitor analysis, SERP analysis, and technical SEO audits
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

// DataForSEO MCP Server Class
class DataForSeoMcpServer {
  private server: Server;
  private client: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'dataforseo-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize DataForSEO client
    const login = process.env.DATAFOREO_LOGIN;
    const password = process.env.DATAFOREO_PASSWORD;
    
    if (!login || !password) {
      throw new Error('DATAFOREO_LOGIN and DATAFOREO_PASSWORD environment variables are required');
    }

    this.client = axios.create({
      baseURL: 'https://api.dataforseo.com/v3',
      auth: {
        username: login,
        password: password
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'keyword_research',
          description: 'Get comprehensive keyword research data including search volume, difficulty, and related keywords',
          inputSchema: {
            type: 'object',
            properties: {
              keyword: {
                type: 'string',
                description: 'Primary keyword to research'
              },
              location: {
                type: 'string',
                description: 'Geographic location for search data',
                default: 'United States'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of suggestions to return',
                default: 100
              }
            },
            required: ['keyword']
          }
        },
        {
          name: 'competitor_analysis',
          description: 'Analyze domain competitors with backlink data and content gaps',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Target domain to analyze'
              },
              location: {
                type: 'string',
                description: 'Geographic location for analysis',
                default: 'United States'
              },
              limit: {
                type: 'number',
                description: 'Number of competitors to analyze',
                default: 10
              }
            },
            required: ['domain']
          }
        },
        {
          name: 'serp_analysis',
          description: 'Analyze search engine results pages for keyword rankings and SERP features',
          inputSchema: {
            type: 'object',
            properties: {
              keyword: {
                type: 'string',
                description: 'Keyword to analyze SERP for'
              },
              domain: {
                type: 'string',
                description: 'Domain to check ranking position for'
              },
              location: {
                type: 'string',
                description: 'Geographic location for SERP analysis',
                default: 'United States'
              },
              device: {
                type: 'string',
                description: 'Device type for analysis',
                enum: ['desktop', 'mobile'],
                default: 'mobile'
              }
            },
            required: ['keyword', 'domain']
          }
        },
        {
          name: 'technical_seo_audit',
          description: 'Comprehensive technical SEO audit including page issues and backlink analysis',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain to audit'
              },
              page_limit: {
                type: 'number',
                description: 'Maximum pages to analyze',
                default: 100
              },
              backlink_limit: {
                type: 'number',
                description: 'Maximum backlinks to analyze',
                default: 1000
              }
            },
            required: ['domain']
          }
        },
        {
          name: 'backlink_analysis',
          description: 'Detailed backlink profile analysis with quality scoring',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain to analyze backlinks for'
              },
              limit: {
                type: 'number',
                description: 'Maximum backlinks to retrieve',
                default: 1000
              },
              dofollow_only: {
                type: 'boolean',
                description: 'Only analyze dofollow backlinks',
                default: true
              }
            },
            required: ['domain']
          }
        },
        {
          name: 'restaurant_seo_analysis',
          description: 'Specialized SEO analysis for restaurants with local search optimization',
          inputSchema: {
            type: 'object',
            properties: {
              restaurant_name: {
                type: 'string',
                description: 'Name of the restaurant'
              },
              location: {
                type: 'string',
                description: 'Restaurant location or coordinates'
              },
              cuisine_type: {
                type: 'string',
                description: 'Type of cuisine (optional)'
              },
              domain: {
                type: 'string',
                description: 'Restaurant website domain (optional)'
              }
            },
            required: ['restaurant_name', 'location']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'keyword_research':
            return await this.handleKeywordResearch(args);
          case 'competitor_analysis':
            return await this.handleCompetitorAnalysis(args);
          case 'serp_analysis':
            return await this.handleSerpAnalysis(args);
          case 'technical_seo_audit':
            return await this.handleTechnicalSeoAudit(args);
          case 'backlink_analysis':
            return await this.handleBacklinkAnalysis(args);
          case 'restaurant_seo_analysis':
            return await this.handleRestaurantSeoAnalysis(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleKeywordResearch(args: any) {
    const { keyword, location = 'United States', limit = 100 } = args;

    // Get keyword difficulty
    const difficultyResponse = await this.client.post('/keywords_data/google/keyword_difficulty/live', [{
      keywords: [keyword],
      location_name: location,
      language_name: 'English'
    }]);

    // Get keyword suggestions
    const suggestionsResponse = await this.client.post('/keywords_data/google/keyword_suggestions/live', [{
      keyword: keyword,
      location_name: location,
      language_name: 'English',
      limit: limit
    }]);

    // Get search volume
    const volumeResponse = await this.client.post('/keywords_data/google/search_volume/live', [{
      keywords: [keyword],
      location_name: location,
      language_name: 'English'
    }]);

    const difficultyData = difficultyResponse.data.tasks?.[0]?.result || [];
    const suggestions = suggestionsResponse.data.tasks?.[0]?.result || [];
    const volumeData = volumeResponse.data.tasks?.[0]?.result || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            keyword,
            location,
            primary_keyword: {
              keyword,
              search_volume: volumeData[0]?.search_volume || 0,
              difficulty: difficultyData[0]?.keyword_difficulty || 0,
              cpc: volumeData[0]?.keyword_info?.cpc || 0,
              competition: volumeData[0]?.keyword_info?.competition || 0
            },
            related_keywords: suggestions.slice(0, 20).map((s: any) => ({
              keyword: s.keyword,
              search_volume: s.search_volume || 0,
              difficulty: s.keyword_difficulty || 0
            })),
            total_suggestions: suggestions.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async handleCompetitorAnalysis(args: any) {
    const { domain, location = 'United States', limit = 10 } = args;

    const competitorsResponse = await this.client.post('/dataforseo_labs/google/competitors_domain/live', [{
      target: domain,
      location_name: location,
      language_name: 'English',
      limit: limit
    }]);

    const competitors = competitorsResponse.data.tasks?.[0]?.result || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            target_domain: domain,
            location,
            competitors: competitors.map((comp: any) => ({
              domain: comp.domain,
              organic_traffic: comp.organic_etv || 0,
              organic_keywords: comp.organic_count || 0,
              paid_traffic: comp.paid_etv || 0,
              paid_keywords: comp.paid_count || 0,
              domain_rank: comp.rank || 0,
              competition_level: comp.organic_etv > 10000 ? 'high' : comp.organic_etv > 1000 ? 'medium' : 'low'
            })),
            analysis_summary: {
              total_competitors: competitors.length,
              avg_organic_traffic: competitors.reduce((sum: number, c: any) => sum + (c.organic_etv || 0), 0) / competitors.length,
              strongest_competitor: competitors[0]?.domain || 'N/A'
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async handleSerpAnalysis(args: any) {
    const { keyword, domain, location = 'United States', device = 'mobile' } = args;

    const serpResponse = await this.client.post('/serp/google/organic/live/advanced', [{
      keyword,
      location_name: location,
      language_name: 'English',
      device: device,
      os: device === 'mobile' ? 'ios' : 'windows'
    }]);

    const items = serpResponse.data.tasks?.[0]?.result?.[0]?.items || [];
    const domainClean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Find domain position
    let position = null;
    let url = null;
    let title = null;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.domain === domainClean) {
        position = item.rank_group || i + 1;
        url = item.url;
        title = item.title;
        break;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            keyword,
            target_domain: domain,
            location,
            device,
            ranking_data: {
              position,
              url,
              title,
              ranking_status: position ? (position <= 3 ? 'excellent' : position <= 10 ? 'good' : 'poor') : 'not_found'
            },
            top_competitors: items.slice(0, 5).map((item: any) => ({
              domain: item.domain,
              position: item.rank_group || 0,
              title: item.title,
              url: item.url
            })),
            serp_features: this.extractSerpFeatures(serpResponse.data.tasks?.[0]?.result?.[0]),
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async handleTechnicalSeoAudit(args: any) {
    const { domain, page_limit = 100, backlink_limit = 1000 } = args;

    // Get technical issues
    const technicalResponse = await this.client.post('/on_page/pages/live', [{
      target: domain,
      limit: page_limit,
      filters: [
        ["status_code", "!=", 200],
        ["size", ">", 1000000],
        ["loading_time", ">", 3000]
      ]
    }]);

    // Get backlinks
    const backlinkResponse = await this.client.post('/backlinks/backlinks/live', [{
      target: domain,
      limit: backlink_limit,
      filters: [["dofollow", "=", true]]
    }]);

    const technicalIssues = technicalResponse.data.tasks?.[0]?.result || [];
    const backlinks = backlinkResponse.data.tasks?.[0]?.result || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            domain,
            technical_issues: {
              total_issues: technicalIssues.length,
              critical_issues: technicalIssues.filter((issue: any) => issue.status_code >= 400).length,
              slow_pages: technicalIssues.filter((issue: any) => issue.loading_time > 3000).length,
              large_files: technicalIssues.filter((issue: any) => issue.size > 1000000).length,
              sample_issues: technicalIssues.slice(0, 5).map((issue: any) => ({
                url: issue.url,
                status_code: issue.status_code,
                loading_time: issue.loading_time,
                size: issue.size,
                issue_type: this.categorizeIssue(issue)
              }))
            },
            backlink_profile: {
              total_backlinks: backlinks.length,
              quality_score: this.calculateBacklinkQuality(backlinks),
              domain_authority: this.calculateDomainAuthority(backlinks),
              top_referrers: backlinks.slice(0, 10).map((link: any) => ({
                domain: link.domain,
                url: link.url,
                anchor: link.anchor,
                rank: link.domain_rank
              }))
            },
            overall_score: this.calculateTechnicalScore(technicalIssues, backlinks),
            recommendations: this.generateTechnicalRecommendations(technicalIssues, backlinks),
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async handleBacklinkAnalysis(args: any) {
    const { domain, limit = 1000, dofollow_only = true } = args;

    const filters = dofollow_only ? [["dofollow", "=", true]] : [];
    
    const backlinkResponse = await this.client.post('/backlinks/backlinks/live', [{
      target: domain,
      limit: limit,
      filters: filters
    }]);

    const backlinks = backlinkResponse.data.tasks?.[0]?.result || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            domain,
            backlink_summary: {
              total_backlinks: backlinks.length,
              dofollow_only: dofollow_only,
              quality_score: this.calculateBacklinkQuality(backlinks),
              domain_authority: this.calculateDomainAuthority(backlinks)
            },
            backlink_distribution: this.analyzeBacklinkDistribution(backlinks),
            top_backlinks: backlinks.slice(0, 20).map((link: any) => ({
              domain: link.domain,
              url: link.url,
              anchor: link.anchor,
              domain_rank: link.domain_rank,
              trust_flow: link.trust_flow,
              citation_flow: link.citation_flow,
              is_dofollow: link.dofollow,
              first_seen: link.first_seen
            })),
            recommendations: this.generateBacklinkRecommendations(backlinks),
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async handleRestaurantSeoAnalysis(args: any) {
    const { restaurant_name, location, cuisine_type, domain } = args;

    // Generate restaurant-specific keywords
    const baseKeywords = [
      restaurant_name,
      `${restaurant_name} menu`,
      `${restaurant_name} hours`,
      `${restaurant_name} delivery`,
      `${restaurant_name} reservations`,
      `${restaurant_name} reviews`,
      `${restaurant_name} near me`,
      `best restaurant ${location}`,
      cuisine_type ? `${cuisine_type} restaurant ${location}` : `restaurant ${location}`
    ].filter(Boolean);

    // Get keyword data for restaurant keywords
    const keywordPromises = baseKeywords.slice(0, 5).map(keyword => 
      this.client.post('/keywords_data/google/search_volume/live', [{
        keywords: [keyword],
        location_name: location,
        language_name: 'English'
      }])
    );

    const keywordResults = await Promise.allSettled(keywordPromises);
    const keywordData = keywordResults
      .filter(result => result.status === 'fulfilled')
      .map((result: any) => result.value.data.tasks?.[0]?.result?.[0])
      .filter(Boolean);

    // If domain provided, get competitor analysis
    let competitors = [];
    if (domain) {
      try {
        const competitorResponse = await this.client.post('/dataforseo_labs/google/competitors_domain/live', [{
          target: domain,
          location_name: location,
          language_name: 'English',
          limit: 5
        }]);
        competitors = competitorResponse.data.tasks?.[0]?.result || [];
      } catch (error) {
        console.error('Competitor analysis failed:', error);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            restaurant_name,
            location,
            cuisine_type,
            domain,
            keyword_analysis: {
              primary_keywords: keywordData.map((kd: any) => ({
                keyword: kd.keyword,
                search_volume: kd.search_volume || 0,
                competition: kd.keyword_info?.competition || 0,
                cpc: kd.keyword_info?.cpc || 0,
                intent: this.classifySearchIntent(kd.keyword)
              })),
              local_seo_opportunities: baseKeywords.filter(k => k.includes('near me') || k.includes(location))
            },
            competitor_analysis: competitors.length > 0 ? {
              direct_competitors: competitors.slice(0, 3).map((comp: any) => ({
                domain: comp.domain,
                organic_traffic: comp.organic_etv || 0,
                organic_keywords: comp.organic_count || 0,
                competition_level: comp.organic_etv > 5000 ? 'high' : comp.organic_etv > 1000 ? 'medium' : 'low'
              })),
              market_insights: {
                avg_competitor_traffic: competitors.reduce((sum: number, c: any) => sum + (c.organic_etv || 0), 0) / competitors.length,
                market_competitiveness: competitors.length > 3 ? 'high' : competitors.length > 1 ? 'medium' : 'low'
              }
            } : null,
            local_seo_recommendations: this.generateRestaurantRecommendations(restaurant_name, location, cuisine_type, keywordData),
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  // Helper methods
  private extractSerpFeatures(serpResult: any): string[] {
    const features: string[] = [];
    if (serpResult?.featured_snippet) features.push('Featured Snippet');
    if (serpResult?.local_pack) features.push('Local Pack');
    if (serpResult?.knowledge_graph) features.push('Knowledge Graph');
    if (serpResult?.people_also_ask) features.push('People Also Ask');
    if (serpResult?.images) features.push('Images');
    return features;
  }

  private calculateBacklinkQuality(backlinks: any[]): number {
    if (!backlinks || backlinks.length === 0) return 0;
    
    let qualityScore = 0;
    backlinks.forEach(link => {
      const domainRank = link.domain_rank || 0;
      const trustFlow = link.trust_flow || 0;
      const citationFlow = link.citation_flow || 0;
      
      qualityScore += (domainRank * 0.4) + (trustFlow * 0.3) + (citationFlow * 0.3);
    });
    
    return Math.round(qualityScore / backlinks.length);
  }

  private calculateDomainAuthority(backlinks: any[]): number {
    if (!backlinks || backlinks.length === 0) return 0;
    
    const totalDomainRank = backlinks.reduce((sum, link) => sum + (link.domain_rank || 0), 0);
    return Math.round(totalDomainRank / backlinks.length);
  }

  private calculateTechnicalScore(technicalIssues: any[], backlinks: any[]): number {
    let score = 100;
    
    score -= technicalIssues.filter((issue: any) => issue.status_code >= 400).length * 5;
    score -= technicalIssues.filter((issue: any) => issue.loading_time > 3000).length * 2;
    score -= technicalIssues.filter((issue: any) => issue.size > 1000000).length * 1;
    
    const backlinkScore = Math.min(backlinks.length / 10, 20);
    score += backlinkScore;
    
    return Math.max(0, Math.min(100, score));
  }

  private categorizeIssue(issue: any): string {
    if (issue.status_code >= 400) return 'critical_error';
    if (issue.loading_time > 3000) return 'performance_issue';
    if (issue.size > 1000000) return 'large_file';
    return 'minor_issue';
  }

  private analyzeBacklinkDistribution(backlinks: any[]): any {
    const domains = new Set(backlinks.map(link => link.domain));
    const domainRanks = backlinks.map(link => link.domain_rank || 0);
    
    return {
      unique_domains: domains.size,
      avg_domain_rank: domainRanks.reduce((sum, rank) => sum + rank, 0) / domainRanks.length,
      high_authority_links: backlinks.filter(link => (link.domain_rank || 0) > 50).length,
      dofollow_percentage: (backlinks.filter(link => link.dofollow).length / backlinks.length) * 100
    };
  }

  private generateTechnicalRecommendations(technicalIssues: any[], backlinks: any[]): string[] {
    const recommendations = [];
    
    if (technicalIssues.filter(issue => issue.status_code >= 400).length > 0) {
      recommendations.push('Fix critical HTTP errors (4xx, 5xx status codes)');
    }
    
    if (technicalIssues.filter(issue => issue.loading_time > 3000).length > 0) {
      recommendations.push('Optimize page loading times - aim for under 3 seconds');
    }
    
    if (technicalIssues.filter(issue => issue.size > 1000000).length > 0) {
      recommendations.push('Compress large files and optimize images');
    }
    
    if (backlinks.length < 10) {
      recommendations.push('Build more high-quality backlinks to improve domain authority');
    }
    
    return recommendations;
  }

  private generateBacklinkRecommendations(backlinks: any[]): string[] {
    const recommendations = [];
    
    if (backlinks.length < 50) {
      recommendations.push('Build more backlinks to improve domain authority');
    }
    
    const qualityScore = this.calculateBacklinkQuality(backlinks);
    if (qualityScore < 30) {
      recommendations.push('Focus on acquiring backlinks from higher authority domains');
    }
    
    const domains = new Set(backlinks.map(link => link.domain));
    if (domains.size < backlinks.length * 0.7) {
      recommendations.push('Diversify backlink sources - avoid too many links from the same domain');
    }
    
    return recommendations;
  }

  private classifySearchIntent(keyword: string): string {
    if (keyword.includes('buy') || keyword.includes('order') || keyword.includes('delivery')) {
      return 'transactional';
    }
    if (keyword.includes('how') || keyword.includes('what') || keyword.includes('why')) {
      return 'informational';
    }
    if (keyword.includes('best') || keyword.includes('review') || keyword.includes('vs')) {
      return 'investigational';
    }
    if (keyword.includes('near me') || keyword.includes('location')) {
      return 'local';
    }
    return 'navigational';
  }

  private generateRestaurantRecommendations(restaurantName: string, location: string, cuisineType?: string, keywordData?: any[]): string[] {
    const recommendations = [
      'Optimize Google My Business profile with accurate hours, photos, and descriptions',
      'Create location-specific landing pages for local SEO',
      'Implement schema markup for restaurant information',
      'Optimize for "near me" searches with local content',
      'Build citations on local directory sites'
    ];

    if (cuisineType) {
      recommendations.push(`Target cuisine-specific keywords like "${cuisineType} restaurant ${location}"`);
    }

    if (keywordData && keywordData.length > 0) {
      const lowVolumeKeywords = keywordData.filter(kd => (kd.search_volume || 0) < 100);
      if (lowVolumeKeywords.length > 0) {
        recommendations.push('Focus on higher search volume keywords for better visibility');
      }
    }

    return recommendations;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  const server = new DataForSeoMcpServer();
  server.run().catch(console.error);
}