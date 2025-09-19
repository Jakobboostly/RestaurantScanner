import { ScanResult } from '@shared/schema';

interface CSVRecord {
  'Record ID': string;
  'Company Name'?: string;
  'Website'?: string;
  'Website URL'?: string;
  [key: string]: string | undefined;
}

interface ScoreResult {
  recordId: string;
  companyName: string;
  website: string;
  overallScore: number;
  searchScore: number;
  socialScore: number;
  localScore: number;
  reviewsScore: number;
  status: 'success' | 'failed' | 'cached';
  error?: string;
  hubspotStatus?: 'updated' | 'failed' | 'skipped';
  hubspotError?: string;
}

interface HubSpotUpdatePayload {
  properties: {
    overall_score: number;
    review_score: number;  // Maps to Reviews score
    seo_score: number;     // Maps to Local score (confusing but correct)
    social_score: number;  // Maps to Social score
  };
}

export class CSVScoreCalculationService {
  private hubspotApiKey: string;
  private hubspotBaseUrl: string;
  private webhookUrl: string;

  constructor() {
    this.hubspotApiKey = process.env.HUBSPOT_API_KEY || '';
    this.hubspotBaseUrl = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';
    // Get scan data from webhook and calculate frontend scores
    this.webhookUrl = 'http://localhost:3000/api/webhook/scan-by-url';
  }

  /**
   * Parse CSV content into records
   */
  parseCSV(csvContent: string): CSVRecord[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = this.parseCSVLine(lines[0]);
    const records: CSVRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Extract website URL from various possible column names
   */
  private extractWebsite(record: CSVRecord): string | null {
    const possibleFields = ['Website', 'Website URL', 'website', 'website_url', 'URL', 'url'];

    for (const field of possibleFields) {
      if (record[field]) {
        let url = record[field].trim();
        if (url && url !== 'N/A' && url !== 'n/a' && !url.includes('@')) {
          if (!url.startsWith('http')) {
            url = `https://${url}`;
          }
          try {
            new URL(url);
            return url;
          } catch {
            continue;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract company name from various possible column names
   */
  private extractCompanyName(record: CSVRecord): string {
    const possibleFields = [
      'Company name', 'Company Name', 'COMPANY_NAME', 'companyName',
      'restaurantName', 'Restaurant Name', 'RESTAURANT_NAME',
      'name', 'Name', 'NAME',
      'company', 'Company', 'COMPANY',
      'business', 'Business', 'BUSINESS',
      'Account Name', 'account_name',
      'client', 'Client', 'CLIENT',
      'customer', 'Customer', 'CUSTOMER'
    ];

    for (const field of possibleFields) {
      if (record[field] && typeof record[field] === 'string') {
        return record[field].toString().trim();
      }
    }

    // Fallback: use first non-empty field that's not Record ID or Website
    for (const [key, value] of Object.entries(record)) {
      if (value && value.trim() &&
          !key.toLowerCase().includes('record') &&
          !key.toLowerCase().includes('website') &&
          !key.toLowerCase().includes('url')) {
        return value.toString().trim();
      }
    }

    return 'Unknown Company';
  }

  // Note: Score calculation logic moved to shared/scoreCalculator.ts
  // to ensure consistency between frontend and CSV service

  /**
   * Get scan data for a website (from cache or fresh scan)
   */
  private async getScanData(website: string, companyName: string): Promise<any | null> {
    try {
      // Try to get domain from URL
      const url = new URL(website);
      const domain = url.hostname.replace(/^www\./, '');

      // Check cache first (implement cache lookup by domain)
      // For now, we'll always do a fresh scan via webhook

      console.log(`🔍 Scanning website: ${website} for ${companyName}`);
      console.log(`📤 Making request to: ${this.webhookUrl}`);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: website,
          returnFormat: 'json'
        }),
        timeout: 60000 // 60 second timeout
      } as any);

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        console.error(`Scan failed for ${website}: HTTP ${response.status}`);
        return null;
      }

      const result = await response.json();

      if (result.success && result.result) {
        console.log(`🔍 DEBUG: Scan data structure for ${companyName}:`, {
          hasBusinessProfile: !!result.result.businessProfile,
          hasSocialMediaLinks: !!result.result.socialMediaLinks,
          hasKeywordAnalysis: !!result.result.keywordAnalysis,
          hasLocalPackReport: !!result.result.localPackReport,
          hasReviewsAnalysis: !!result.result.reviewsAnalysis,
          rawScores: {
            seo: result.result.seo,
            overallScore: result.result.overallScore,
            performance: result.result.performance,
            userExperience: result.result.userExperience
          }
        });
        return result.result;
      }

      return null;
    } catch (error) {
      console.error(`Error scanning ${website}:`, error);
      return null;
    }
  }

  /**
   * Update HubSpot company with scores
   */
  private async updateHubSpotCompany(recordId: string, scores: {
    overall: number;
    reviews: number;
    local: number;
    social: number;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.hubspotApiKey) {
      return { success: false, error: 'HubSpot API key not configured' };
    }

    try {
      const payload: HubSpotUpdatePayload = {
        properties: {
          overall_score: scores.overall,
          review_score: scores.reviews,    // Reviews → review_score
          seo_score: scores.local,         // Local → seo_score (confusing but correct)
          social_score: scores.social      // Social → social_score
        }
      };

      console.log(`📤 Updating HubSpot record ${recordId} with scores:`, payload.properties);

      const response = await fetch(`${this.hubspotBaseUrl}/crm/v3/objects/companies/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.hubspotApiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HubSpot update failed for ${recordId}: ${errorText}`);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      console.log(`✅ HubSpot record ${recordId} updated successfully`);
      return { success: true };

    } catch (error) {
      console.error(`HubSpot update error for ${recordId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Process a single CSV record using Frontend Scores API
   */
  async processRecord(record: CSVRecord): Promise<ScoreResult> {
    const recordId = record['Record ID'];
    const companyName = this.extractCompanyName(record);
    const website = this.extractWebsite(record);

    if (!recordId) {
      return {
        recordId: 'MISSING',
        companyName,
        website: website || 'N/A',
        overallScore: 0,
        searchScore: 0,
        socialScore: 0,
        localScore: 0,
        reviewsScore: 0,
        status: 'failed',
        error: 'Missing Record ID',
        hubspotStatus: 'skipped'
      };
    }

    if (!website) {
      return {
        recordId,
        companyName,
        website: 'N/A',
        overallScore: 0,
        searchScore: 0,
        socialScore: 0,
        localScore: 0,
        reviewsScore: 0,
        status: 'failed',
        error: 'No valid website URL found',
        hubspotStatus: 'skipped'
      };
    }

    // Use Frontend Scores API for ALL restaurants (cached and non-cached)
    console.log(`🎯 Using Frontend Scores API for ${companyName}`);

    try {
      const response = await fetch('http://localhost:3000/api/frontend-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website })
      });

      if (!response.ok) {
        console.error(`Frontend Scores API failed for ${website}: HTTP ${response.status}`);
        return {
          recordId,
          companyName,
          website,
          overallScore: 0,
          searchScore: 0,
          socialScore: 0,
          localScore: 0,
          reviewsScore: 0,
          status: 'failed',
          error: `Frontend scores API failed: HTTP ${response.status}`,
          hubspotStatus: 'skipped'
        };
      }

      const result = await response.json();

      if (!result.scores) {
        console.error(`No scores returned from Frontend Scores API for ${website}`);
        return {
          recordId,
          companyName,
          website,
          overallScore: 0,
          searchScore: 0,
          socialScore: 0,
          localScore: 0,
          reviewsScore: 0,
          status: 'failed',
          error: 'No scores returned from frontend API',
          hubspotStatus: 'skipped'
        };
      }

      const scores = result.scores;
      console.log(`🔢 FRONTEND API SCORES: Got exact frontend scores for ${companyName}:`, scores);

      // Update HubSpot with exact frontend scores
      const hubspotResult = await this.updateHubSpotCompany(recordId, {
        overall: scores.overall,
        reviews: scores.reviews,
        local: scores.local,
        social: scores.social
      });

      return {
        recordId,
        companyName,
        website,
        overallScore: scores.overall,
        searchScore: scores.search,
        socialScore: scores.social,
        localScore: scores.local,
        reviewsScore: scores.reviews,
        status: 'success',
        hubspotStatus: hubspotResult.success ? 'updated' : 'failed',
        hubspotError: hubspotResult.error
      };

    } catch (error) {
      console.error(`Frontend Scores API error for ${website}:`, error);
      return {
        recordId,
        companyName,
        website,
        overallScore: 0,
        searchScore: 0,
        socialScore: 0,
        localScore: 0,
        reviewsScore: 0,
        status: 'failed',
        error: `Frontend API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        hubspotStatus: 'skipped'
      };
    }
  }

  /**
   * Process multiple records in batch
   */
  async processBatch(records: CSVRecord[], batchSize = 5): Promise<ScoreResult[]> {
    const results: ScoreResult[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);

      const batchPromises = batch.map(record => this.processRecord(record));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting between batches
      if (i + batchSize < records.length) {
        console.log(`⏸️ Rate limiting: waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  /**
   * Generate CSV output from results
   */
  generateCSVOutput(results: ScoreResult[]): string {
    const headers = [
      'Record ID',
      'Company Name',
      'Website',
      'Overall Score',
      'Search Score',
      'Social Score',
      'Local Score',
      'Reviews Score',
      'Status',
      'HubSpot Status',
      'Error'
    ];

    const rows = results.map(r => [
      r.recordId,
      `"${r.companyName}"`,
      r.website,
      r.overallScore.toString(),
      r.searchScore.toString(),
      r.socialScore.toString(),
      r.localScore.toString(),
      r.reviewsScore.toString(),
      r.status,
      r.hubspotStatus || '',
      r.error || r.hubspotError || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}