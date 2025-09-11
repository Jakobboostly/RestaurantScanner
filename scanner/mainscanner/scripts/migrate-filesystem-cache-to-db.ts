#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';
import { db } from '../server/db';
import { fullScanResults } from '../shared/schema';

interface CachedScan {
  data: any;
  metadata: {
    cachedAt: string;
    expiresAt: string;
    placeId: string;
    restaurantName: string;
    cacheVersion: string;
  };
}

interface MigrationStats {
  totalFound: number;
  migrated: number;
  skipped: number;
  errors: number;
  duplicates: number;
}

class FilesystemToDbMigrator {
  private readonly cacheDir = path.join(process.cwd(), 'scan-cache');
  private stats: MigrationStats = {
    totalFound: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0
  };

  async migrateAllCaches(): Promise<void> {
    console.log('🚀 Starting filesystem cache to database migration');
    console.log(`📁 Cache directory: ${this.cacheDir}`);

    try {
      // Check if database connection is available
      if (!db) {
        throw new Error('Database connection not available. Please check DATABASE_URL environment variable.');
      }

      // Check if cache directory exists
      try {
        await fs.access(this.cacheDir);
        console.log('✅ Cache directory found');
      } catch {
        console.log('❌ Cache directory not found. Nothing to migrate.');
        return;
      }

      // Get all cache directories
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });
      const cacheDirectories = entries.filter(entry => entry.isDirectory());
      
      console.log(`📦 Found ${cacheDirectories.length} potential cache directories\n`);
      this.stats.totalFound = cacheDirectories.length;

      // Process each cache directory
      for (const [index, entry] of cacheDirectories.entries()) {
        console.log(`\n🔄 Processing ${index + 1}/${cacheDirectories.length}: ${entry.name}`);
        await this.migrateSingleCache(entry.name);
      }

      this.printStats();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.printStats();
      process.exit(1);
    }
  }

  private async migrateSingleCache(directoryName: string): Promise<void> {
    try {
      const cachePath = path.join(this.cacheDir, directoryName);
      const cacheFile = path.join(cachePath, 'scan.json');

      // Check if scan.json exists
      try {
        await fs.access(cacheFile);
      } catch {
        console.log(`   ⏭️ No scan.json found, skipping`);
        this.stats.skipped++;
        return;
      }

      // Read and parse cache file
      const cacheContent = await fs.readFile(cacheFile, 'utf-8');
      const cachedScan: CachedScan = JSON.parse(cacheContent);

      // Validate cache structure
      if (!cachedScan.metadata?.placeId || !cachedScan.data) {
        console.log(`   ❌ Invalid cache structure, skipping`);
        this.stats.errors++;
        return;
      }

      const { placeId, restaurantName } = cachedScan.metadata;
      const scanData = cachedScan.data;

      console.log(`   📍 Place ID: ${placeId}`);
      console.log(`   🏪 Restaurant: ${restaurantName}`);
      console.log(`   📅 Cached: ${cachedScan.metadata.cachedAt}`);

      // Check if already exists in database
      const existingRecord = await db.query.fullScanResults.findFirst({
        where: (table, { eq }) => eq(table.placeId, placeId)
      });

      if (existingRecord) {
        console.log(`   🔄 Record already exists in database, skipping`);
        this.stats.duplicates++;
        return;
      }

      // Extract domain from scan data if available
      const domain = scanData.domain || scanData.websiteUrl || null;

      // Insert into database
      await db.insert(fullScanResults).values({
        placeId,
        restaurantName,
        domain,
        scanData,
        createdAt: new Date(cachedScan.metadata.cachedAt),
        updatedAt: new Date(cachedScan.metadata.cachedAt)
      });

      console.log(`   ✅ Successfully migrated to database`);
      this.stats.migrated++;

    } catch (error) {
      console.log(`   ❌ Error migrating: ${error.message}`);
      this.stats.errors++;
    }
  }

  private printStats(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total cache directories found: ${this.stats.totalFound}`);
    console.log(`Successfully migrated: ${this.stats.migrated}`);
    console.log(`Already existed (duplicates): ${this.stats.duplicates}`);
    console.log(`Skipped (no scan.json): ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Migration success rate: ${Math.round((this.stats.migrated / this.stats.totalFound) * 100)}%`);
    console.log('='.repeat(60));
  }

  async validateMigration(): Promise<void> {
    console.log('\n🔍 Validating migration...');
    
    try {
      // Count records in database
      const dbRecords = await db.query.fullScanResults.findMany();
      console.log(`📊 Total records in database: ${dbRecords.length}`);

      // Count filesystem cache directories
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });
      const cacheDirectories = entries.filter(entry => entry.isDirectory());
      console.log(`📁 Total cache directories: ${cacheDirectories.length}`);

      // Sample validation - check a few records
      console.log('\n🔬 Sample validation:');
      const sampleRecords = dbRecords.slice(0, 3);
      
      for (const record of sampleRecords) {
        console.log(`   📍 ${record.placeId} - ${record.restaurantName}`);
        console.log(`      Domain: ${record.domain || 'N/A'}`);
        console.log(`      Has scan data: ${record.scanData ? '✅' : '❌'}`);
        console.log(`      Created: ${record.createdAt?.toISOString()}`);
      }

    } catch (error) {
      console.error('❌ Validation failed:', error);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  console.log('🗂️ Filesystem Cache to Database Migration Tool');
  console.log('This script migrates cached scan results from filesystem to database');
  console.log('ensuring no data is lost during deployment.\n');

  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('   Set it to your PostgreSQL connection string');
    process.exit(1);
  }

  const migrator = new FilesystemToDbMigrator();
  
  if (args.includes('--validate-only')) {
    await migrator.validateMigration();
  } else {
    await migrator.migrateAllCaches();
    await migrator.validateMigration();
  }
}

// Run the migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});