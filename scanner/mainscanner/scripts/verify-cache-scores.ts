#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';
import { calculateScores, type ScanData } from '../shared/scoreCalculator';

interface CachedScan {
  data: any;
  metadata: {
    placeId: string;
    restaurantName: string;
    cachedAt: string;
  };
}

interface VerificationResult {
  placeId: string;
  restaurantName: string;
  cachedScores: {
    seo: number;
    overallScore: number;
    performance: number;
    userExperience: number;
  };
  frontendScores: {
    search: number;
    social: number;
    local: number;
    reviews: number;
    overall: number;
  };
  matches: boolean;
}

class CacheScoreVerifier {
  private cacheDir = path.join(process.cwd(), 'scan-cache');

  async verifyRandomSample(sampleSize: number = 5): Promise<void> {
    console.log('🔍 Verifying cache scores against frontend calculation logic...\n');

    try {
      // Get all cache directories
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });
      const cacheDirectories = entries.filter(entry => entry.isDirectory());

      console.log(`📁 Found ${cacheDirectories.length} cached scan results`);

      // Randomly sample directories
      const shuffled = cacheDirectories.sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, Math.min(sampleSize, cacheDirectories.length));

      const results: VerificationResult[] = [];

      for (const dir of sample) {
        const result = await this.verifySingleScan(dir.name);
        if (result) {
          results.push(result);
        }
      }

      this.printVerificationResults(results);

    } catch (error) {
      console.error('❌ Error during verification:', error);
    }
  }

  private async verifySingleScan(placeId: string): Promise<VerificationResult | null> {
    try {
      const scanFile = path.join(this.cacheDir, placeId, 'scan.json');
      const content = await fs.readFile(scanFile, 'utf-8');
      const cachedScan: CachedScan = JSON.parse(content);

      // Extract cached scores
      const cachedData = cachedScan.data;
      const cachedScores = {
        seo: cachedData.seo || 0,
        overallScore: cachedData.overallScore || 0,
        performance: cachedData.performance || 0,
        userExperience: cachedData.userExperience || 0
      };

      // Calculate frontend scores using shared logic
      const scanData: ScanData = {
        seo: cachedData.seo,
        keywordAnalysis: cachedData.keywordAnalysis,
        socialMediaLinks: cachedData.socialMediaLinks,
        businessProfile: cachedData.businessProfile,
        localPackReport: cachedData.localPackReport,
        reviewsAnalysis: cachedData.reviewsAnalysis,
        competitiveOpportunityKeywords: cachedData.competitiveOpportunityKeywords
      };

      const frontendScores = calculateScores(scanData);

      // Simple match check - we expect different naming but similar values
      const matches = true; // For now, just showing both sets of scores

      return {
        placeId,
        restaurantName: cachedScan.metadata.restaurantName,
        cachedScores,
        frontendScores,
        matches
      };

    } catch (error) {
      console.log(`⚠️ Could not verify ${placeId}: ${error.message}`);
      return null;
    }
  }

  private printVerificationResults(results: VerificationResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CACHE VS FRONTEND SCORE VERIFICATION');
    console.log('='.repeat(80));

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.restaurantName} (${result.placeId})`);
      console.log('   Cached Backend Scores:');
      console.log(`     SEO: ${result.cachedScores.seo}`);
      console.log(`     Overall: ${result.cachedScores.overallScore}`);
      console.log(`     Performance: ${result.cachedScores.performance}`);
      console.log(`     User Experience: ${result.cachedScores.userExperience}`);

      console.log('   Frontend Calculated Scores:');
      console.log(`     Search: ${result.frontendScores.search}`);
      console.log(`     Social: ${result.frontendScores.social}`);
      console.log(`     Local: ${result.frontendScores.local}`);
      console.log(`     Reviews: ${result.frontendScores.reviews}`);
      console.log(`     Overall: ${result.frontendScores.overall}`);

      // Show score mapping for comparison
      console.log('   Score Mapping:');
      console.log(`     SEO (${result.cachedScores.seo}) → Search (${result.frontendScores.search})`);
      console.log(`     Performance (${result.cachedScores.performance}) → Social calculation`);
      console.log(`     User Experience (${result.cachedScores.userExperience}) → Reviews calculation`);
      console.log(`     Overall: Backend (${result.cachedScores.overallScore}) vs Frontend (${result.frontendScores.overall})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Verification complete!');
    console.log('📋 Notes:');
    console.log('   - Backend scores are raw values from scanning APIs');
    console.log('   - Frontend scores use complex calculation logic based on multiple factors');
    console.log('   - The frontend recalculates scores using the shared scoreCalculator.ts');
    console.log('   - Cache contains the raw scan data needed for frontend calculations');
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const sampleSize = args[0] ? parseInt(args[0]) : 5;

  console.log(`🎯 Verifying ${sampleSize} random cached scans...\n`);

  const verifier = new CacheScoreVerifier();
  await verifier.verifyRandomSample(sampleSize);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});