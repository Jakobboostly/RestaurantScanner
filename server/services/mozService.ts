import axios from 'axios';
import crypto from 'crypto';

export interface MozMetrics {
  domainAuthority: number;
  pageAuthority: number;
  spamScore: number;
  backlinks: number;
  linkingDomains: number;
  totalLinks: number;
  externalLinks: number;
  internalLinks: number;
}

export class MozService {
  private accessId: string;
  private secretKey: string;

  constructor(accessId: string, secretKey: string) {
    this.accessId = accessId;
    this.secretKey = secretKey;
  }

  async analyzeDomain(domain: string): Promise<MozMetrics> {
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const expires = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
      
      const stringToSign = `${this.accessId}\n${expires}`;
      const signature = crypto
        .createHmac('sha1', this.secretKey)
        .update(stringToSign)
        .digest('base64');

      const response = await axios.get('https://lsapi.seomoz.com/v2/url_metrics', {
        params: {
          target: cleanDomain,
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accessId}:${signature}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        domainAuthority: data.domain_authority || 0,
        pageAuthority: data.page_authority || 0,
        spamScore: data.spam_score || 0,
        backlinks: data.external_pages_to_page || 0,
        linkingDomains: data.linking_domains || 0,
        totalLinks: data.links || 0,
        externalLinks: data.external_links || 0,
        internalLinks: data.internal_links || 0,
      };
    } catch (error) {
      console.error('Moz API error:', error);
      throw new Error('Failed to get domain metrics from Moz');
    }
  }

  async getBacklinkData(domain: string): Promise<any> {
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const expires = Math.floor(Date.now() / 1000) + 300;
      
      const stringToSign = `${this.accessId}\n${expires}`;
      const signature = crypto
        .createHmac('sha1', this.secretKey)
        .update(stringToSign)
        .digest('base64');

      const response = await axios.get('https://lsapi.seomoz.com/v2/links', {
        params: {
          target: cleanDomain,
          scope: 'page',
          limit: 50
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accessId}:${signature}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        backlinks: response.data.results || [],
        totalBacklinks: response.data.total_results || 0,
        nextToken: response.data.next_token || null
      };
    } catch (error) {
      console.error('Moz backlink API error:', error);
      throw new Error('Failed to get backlink data from Moz');
    }
  }
}