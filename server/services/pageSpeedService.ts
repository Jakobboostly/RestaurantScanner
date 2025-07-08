import axios from 'axios';

export interface PageSpeedMetrics {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  coreWebVitals: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  opportunities: any[];
  diagnostics: any[];
}

export class PageSpeedService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeWebsite(url: string, strategy: 'desktop' | 'mobile' = 'mobile'): Promise<PageSpeedMetrics> {
    try {
      const response = await axios.get('https://www.googleapis.com/pagespeed/v5/runPagespeed', {
        params: {
          url: url.startsWith('http') ? url : `https://${url}`,
          key: this.apiKey,
          strategy,
          category: ['performance', 'accessibility', 'seo', 'best-practices']
        }
      });

      const lighthouse = response.data.lighthouseResult;
      const categories = lighthouse.categories;
      const audits = lighthouse.audits;

      return {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        coreWebVitals: {
          fcp: audits['first-contentful-paint']?.score || 0,
          lcp: audits['largest-contentful-paint']?.score || 0,
          cls: audits['cumulative-layout-shift']?.score || 0,
          fid: audits['first-input-delay']?.score || audits['max-potential-fid']?.score || 0,
        },
        opportunities: lighthouse.audits ? this.extractOpportunities(audits) : [],
        diagnostics: lighthouse.audits ? this.extractDiagnostics(audits) : [],
      };
    } catch (error) {
      console.error('PageSpeed API error:', error);
      throw new Error('Failed to analyze website performance');
    }
  }

  private extractOpportunities(audits: any): any[] {
    const opportunities = [];
    const opportunityAudits = [
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'efficiently-encode-images',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript'
    ];

    for (const auditId of opportunityAudits) {
      const audit = audits[auditId];
      if (audit && audit.score < 1) {
        opportunities.push({
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
          details: audit.details
        });
      }
    }

    return opportunities;
  }

  private extractDiagnostics(audits: any): any[] {
    const diagnostics = [];
    const diagnosticAudits = [
      'server-response-time',
      'dom-size',
      'critical-request-chains',
      'uses-long-cache-ttl',
      'total-byte-weight'
    ];

    for (const auditId of diagnosticAudits) {
      const audit = audits[auditId];
      if (audit && audit.score < 1) {
        diagnostics.push({
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
          details: audit.details
        });
      }
    }

    return diagnostics;
  }
}