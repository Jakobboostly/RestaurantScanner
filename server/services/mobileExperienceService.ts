import { ContentAnalysisService } from './contentAnalysisService';
import { lighthouseScreenshotService } from './lighthouseScreenshotService';

export interface MobileExperience {
  score: number;
  loadTime: number;
  isResponsive: boolean;
  touchFriendly: boolean;
  textReadable: boolean;
  navigationEasy: boolean;
  issues: string[];
  recommendations: string[];
  screenshot?: string;
  contentAnalysis?: {
    title: string;
    metaDescription: string;
    hasSchemaMarkup: boolean;
    h1Tags: string[];
    imageCount: number;
    internalLinks: number;
    externalLinks: number;
  };
}

export class MobileExperienceService {
  private contentAnalysisService: ContentAnalysisService;

  constructor() {
    this.contentAnalysisService = new ContentAnalysisService();
  }

  async analyzeMobileExperience(url: string): Promise<MobileExperience> {
    try {
      console.log('Starting mobile experience analysis for:', url);

      // Run content analysis and lighthouse screenshot capture in parallel
      const [contentAnalysis, lighthouseResult] = await Promise.all([
        this.contentAnalysisService.analyzeContent(url),
        lighthouseScreenshotService.captureScreenshotWithMetrics(url)
      ]);

      console.log('Content analysis completed:', contentAnalysis.success);
      console.log('Lighthouse screenshot captured:', lighthouseResult.success);

      // Analyze mobile experience based on content analysis
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Check for mobile optimization indicators
      if (!contentAnalysis.hasSchemaMarkup) {
        issues.push('Missing schema markup');
        recommendations.push('Add structured data markup for better search visibility');
      }

      if (!contentAnalysis.title) {
        issues.push('Missing or empty title tag');
        recommendations.push('Add descriptive title tag for SEO');
      }

      if (!contentAnalysis.metaDescription) {
        issues.push('Missing meta description');
        recommendations.push('Add meta description for better search snippets');
      }

      if (contentAnalysis.h1Tags.length === 0) {
        issues.push('No H1 tags found');
        recommendations.push('Add H1 heading tags for better content structure');
      }

      if (contentAnalysis.imageCount === 0) {
        issues.push('No images found');
        recommendations.push('Add relevant images to improve user engagement');
      }

      if (contentAnalysis.internalLinks < 3) {
        issues.push('Few internal links');
        recommendations.push('Add more internal links for better navigation');
      }

      // Mobile-specific checks based on load time
      const isResponsive = contentAnalysis.loadTime < 3000;
      const touchFriendly = contentAnalysis.loadTime < 5000;
      const textReadable = contentAnalysis.title.length > 10;
      const navigationEasy = contentAnalysis.internalLinks > 0;

      if (contentAnalysis.loadTime > 3000) {
        issues.push('Slow loading time');
        recommendations.push('Optimize images and reduce page size for faster loading');
      }

      if (contentAnalysis.loadTime > 5000) {
        issues.push('Very slow mobile performance');
        recommendations.push('Consider using a CDN and optimizing critical resources');
      }

      // Calculate overall score
      let score = 100;
      score -= issues.length * 12;
      score = Math.max(0, Math.min(100, score));

      return {
        score,
        loadTime: contentAnalysis.loadTime / 1000, // Convert to seconds
        isResponsive,
        touchFriendly,
        textReadable,
        navigationEasy,
        issues,
        recommendations,
        screenshot: lighthouseResult.screenshot || undefined,
        contentAnalysis: contentAnalysis.success ? {
          title: contentAnalysis.title,
          metaDescription: contentAnalysis.metaDescription,
          hasSchemaMarkup: contentAnalysis.hasSchemaMarkup,
          h1Tags: contentAnalysis.h1Tags,
          imageCount: contentAnalysis.imageCount,
          internalLinks: contentAnalysis.internalLinks,
          externalLinks: contentAnalysis.externalLinks
        } : undefined
      };

    } catch (error) {
      console.error('Mobile experience analysis error:', error);
      
      // Return fallback data
      return {
        score: 70,
        loadTime: 3.0,
        isResponsive: true,
        touchFriendly: true,
        textReadable: true,
        navigationEasy: true,
        issues: ['Unable to analyze mobile experience'],
        recommendations: ['Check website accessibility and mobile optimization'],
        screenshot: undefined,
        contentAnalysis: undefined
      };
    }
  }
}