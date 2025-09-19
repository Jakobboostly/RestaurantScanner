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
    expiresAt: string;
    cacheVersion: string;
  };
}

interface MigrationStats {
  totalScanned: number;
  updated: number;
  errors: number;
  skipped: number;
}

class CacheScoreMigration {
  private cacheDir = path.join(process.cwd(), 'scan-cache');
  private stats: MigrationStats = {
    totalScanned: 0,
    updated: 0,
    errors: 0,
    skipped: 0
  };

  async migrateAllCaches(): Promise<void> {
    console.log('🚀 Starting cache score migration...');
    console.log('📋 Goal: Replace raw API scores with calculated frontend scores');
    console.log(`📁 Cache directory: ${this.cacheDir}\n`);

    try {
      // Get all cache directories
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });
      const cacheDirectories = entries.filter(entry => entry.isDirectory());

      console.log(`🔍 Found ${cacheDirectories.length} cached restaurants`);
      this.stats.totalScanned = cacheDirectories.length;

      // Process each cache directory
      let batchCount = 0;
      for (const dir of cacheDirectories) {
        await this.migrateSingleCache(dir.name);

        batchCount++;
        if (batchCount % 50 === 0) {
          console.log(`📊 Progress: ${batchCount}/${cacheDirectories.length} (${Math.round((batchCount/cacheDirectories.length)*100)}%)`);
        }
      }

      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.printSummary();
      process.exit(1);
    }
  }

  private async migrateSingleCache(placeId: string): Promise<void> {
    try {
      const scanFile = path.join(this.cacheDir, placeId, 'scan.json');

      // Read existing cache file
      const content = await fs.readFile(scanFile, 'utf-8');
      const cachedScan: CachedScan = JSON.parse(content);

      // Check if already migrated (has calculatedScores field)
      if (cachedScan.data.calculatedScores) {
        this.stats.skipped++;
        return;
      }

      // Calculate frontend scores using shared logic
      const scanData: ScanData = cachedScan.data;
      const calculatedScores = calculateScores(scanData);

      // Create backup of original scores for reference
      const originalScores = {
        seo: cachedScan.data.seo,
        overallScore: cachedScan.data.overallScore,
        performance: cachedScan.data.performance,
        userExperience: cachedScan.data.userExperience
      };

      // Update the cached data with calculated scores
      const updatedData = {
        ...cachedScan.data,
        // Replace main scores with calculated values
        seo: calculatedScores.search,
        overallScore: calculatedScores.overall,
        performance: calculatedScores.social,
        userExperience: calculatedScores.reviews,
        // Store both calculated and original scores for reference
        calculatedScores: calculatedScores,
        originalScores: originalScores,
        // Mark as migrated
        migratedAt: new Date().toISOString()
      };

      // Update the cached scan structure
      const updatedCachedScan: CachedScan = {
        ...cachedScan,
        data: updatedData,
        metadata: {
          ...cachedScan.metadata,
          cacheVersion: '2.0.0' // Increment version to indicate migration
        }
      };

      // Write the updated cache file
      await fs.writeFile(scanFile, JSON.stringify(updatedCachedScan, null, 2));

      console.log(`✅ Migrated: ${cachedScan.metadata.restaurantName}`);
      console.log(`   Old scores: SEO=${originalScores.seo}, Overall=${originalScores.overallScore}, Perf=${originalScores.performance}, UX=${originalScores.userExperience}`);
      console.log(`   New scores: Search=${calculatedScores.search}, Overall=${calculatedScores.overall}, Social=${calculatedScores.social}, Reviews=${calculatedScores.reviews}`);

      this.stats.updated++;

    } catch (error) {
      console.error(`❌ Failed to migrate ${placeId}: ${error.message}`);
      this.stats.errors++;
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CACHE MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total restaurants scanned: ${this.stats.totalScanned}`);
    console.log(`Successfully updated: ${this.stats.updated}`);
    console.log(`Already migrated (skipped): ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Success rate: ${Math.round((this.stats.updated / this.stats.totalScanned) * 100)}%`);
    console.log('='.repeat(60));

    if (this.stats.updated > 0) {
      console.log('✅ Cache migration completed successfully!');
      console.log('🎯 All cached scores now match frontend calculated scores');
      console.log('📋 Next: Update HubSpot with these calculated scores');
    } else {
      console.log('⚠️ No caches were updated');
    }
  }
}

// Main execution
async function main() {
  const migration = new CacheScoreMigration();
  await migration.migrateAllCaches();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});