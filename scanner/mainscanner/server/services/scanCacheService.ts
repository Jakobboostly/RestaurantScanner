import fs from 'fs/promises';
import * as fs_sync from 'fs';
import path from 'path';
import { ScanResult, fullScanResults } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { calculateScores, type ScanData } from '../../shared/scoreCalculator';

interface CachedScan {
  data: ScanResult;
  metadata: {
    cachedAt: string;
    expiresAt: string;
    placeId: string;
    restaurantName: string;
    cacheVersion: string;
  };
}

export class ScanCacheService {
  private readonly cacheDir = path.join(process.cwd(), 'scan-cache');
  private readonly cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  private readonly cacheVersion = '1.0.0';

  constructor() {
    // Initialize cache directory synchronously to ensure it exists
    this.initializeCacheDirectory();
    console.log('✅ ScanCacheService constructor called - cache service initialized');
  }

  private initializeCacheDirectory(): void {
    try {
      // Use synchronous mkdir to ensure directory exists before any cache operations
      fs_sync.mkdirSync(this.cacheDir, { recursive: true });
      console.log('📁 Cache directory initialized:', this.cacheDir);
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  private getCachePath(placeId: string): string {
    // Sanitize placeId for filesystem
    const sanitizedId = placeId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.cacheDir, sanitizedId);
  }

  private getCacheFilePath(placeId: string): string {
    return path.join(this.getCachePath(placeId), 'scan.json');
  }

  async getCachedScan(placeId: string): Promise<ScanResult | null> {
    try {
      console.log(`🔍 Cache lookup for placeId: ${placeId}`);
      
      // First try database cache (production-friendly)
      if (db) {
        try {
          console.log(`🗄️ Checking database cache for placeId: ${placeId}`);
          const dbResult = await db.query.fullScanResults.findFirst({
            where: eq(fullScanResults.placeId, placeId)
          });
          
          if (dbResult && dbResult.scanData) {
            // Check if cache is still valid (30 days)
            const cachedAt = new Date(dbResult.updatedAt || dbResult.createdAt);
            const expiresAt = new Date(cachedAt.getTime() + this.cacheTTL);
            const now = new Date();
            
            if (now <= expiresAt) {
              console.log(`✅ DATABASE cache hit for placeId: ${placeId}, cached: ${cachedAt.toISOString()}`);
              return {
                ...dbResult.scanData as ScanResult,
                isCached: true,
                cachedAt: cachedAt.toISOString()
              } as ScanResult & { isCached: boolean; cachedAt: string };
            } else {
              console.log(`⏰ Database cache expired for placeId: ${placeId}, expires: ${expiresAt.toISOString()}`);
              // Don't delete expired DB entries automatically - they might be needed for revenue gates
            }
          } else {
            console.log(`📭 No database cache found for placeId: ${placeId}`);
          }
        } catch (dbError) {
          console.warn(`⚠️ Database cache lookup failed for placeId: ${placeId}, falling back to filesystem:`, dbError);
        }
      }
      
      // Fallback to filesystem cache (for local development)
      console.log(`💾 Checking filesystem cache for placeId: ${placeId}`);
      const cacheFile = this.getCacheFilePath(placeId);
      console.log(`🔍 Cache file path: ${cacheFile}`);
      
      // Check if cache file exists
      try {
        await fs.access(cacheFile);
        console.log(`✅ Cache file exists for placeId: ${placeId}`);
      } catch {
        console.log(`❌ Cache miss for placeId: ${placeId} - no database or filesystem cache found`);
        return null;
      }

      // Read and parse cache file
      const cacheContent = await fs.readFile(cacheFile, 'utf-8');
      const cachedScan: CachedScan = JSON.parse(cacheContent);

      // Check if cache is expired
      const expiresAt = new Date(cachedScan.metadata.expiresAt);
      if (expiresAt < new Date()) {
        console.log(`Cache expired for placeId: ${placeId}`);
        // Optionally delete expired cache
        await this.deleteCachedScan(placeId);
        return null;
      }

      // Check cache version compatibility
      if (cachedScan.metadata.cacheVersion !== this.cacheVersion) {
        console.log(`Cache version mismatch for placeId: ${placeId}`);
        await this.deleteCachedScan(placeId);
        return null;
      }

      console.log(`✅ FILESYSTEM cache hit for placeId: ${placeId}, expires at: ${cachedScan.metadata.expiresAt}`);
      
      // Add a flag to indicate this is cached data
      return {
        ...cachedScan.data,
        isCached: true,
        cachedAt: cachedScan.metadata.cachedAt
      } as ScanResult & { isCached: boolean; cachedAt: string };
    } catch (error) {
      console.error(`Error reading cache for placeId ${placeId}:`, error);
      return null;
    }
  }

  async cacheScan(placeId: string, scanResult: ScanResult): Promise<void> {
    try {
      console.log(`💾 Caching scan for placeId: ${placeId}, restaurant: ${scanResult.restaurantName}`);

      // Calculate frontend scores and update the scan result
      const calculatedScores = calculateScores(scanResult as ScanData);
      console.log(`🧮 Calculated frontend scores for ${scanResult.restaurantName}:`, calculatedScores);

      // Update scanResult with calculated scores to match frontend display
      const enhancedScanResult = {
        ...scanResult,
        // Map calculated scores to the existing score fields
        seo: calculatedScores.search,
        overallScore: calculatedScores.overall,
        performance: calculatedScores.social,
        userExperience: calculatedScores.reviews,
        // Also store the full calculated scores for reference
        calculatedScores: calculatedScores
      };

      // First save to database (production-friendly)
      if (db) {
        try {
          console.log(`🗄️ Saving to database cache for placeId: ${placeId}`);
          await db.insert(fullScanResults)
            .values({
              placeId,
              restaurantName: enhancedScanResult.restaurantName,
              domain: enhancedScanResult.domain,
              scanData: enhancedScanResult,
            })
            .onConflictDoUpdate({
              target: fullScanResults.placeId,
              set: {
                scanData: enhancedScanResult,
                restaurantName: enhancedScanResult.restaurantName,
                domain: enhancedScanResult.domain,
                updatedAt: new Date(),
              }
            });
          console.log(`✅ Saved to DATABASE cache for placeId: ${placeId}`);
        } catch (dbError) {
          console.error(`❌ Failed to save to database cache for placeId: ${placeId}:`, dbError);
          // Continue with filesystem cache as fallback
        }
      }
      
      // Also save to filesystem (for local development and backup)
      const cachePath = this.getCachePath(placeId);
      const cacheFile = this.getCacheFilePath(placeId);
      console.log(`💾 Cache will also be saved to filesystem: ${cacheFile}`);

      // Create directory for this place if it doesn't exist
      await fs.mkdir(cachePath, { recursive: true });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.cacheTTL);

      const cachedScan: CachedScan = {
        data: enhancedScanResult,
        metadata: {
          cachedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          placeId,
          restaurantName: enhancedScanResult.restaurantName,
          cacheVersion: this.cacheVersion
        }
      };

      // Write cache file
      await fs.writeFile(cacheFile, JSON.stringify(cachedScan, null, 2));
      
      console.log(`✅ Cached scan for placeId: ${placeId} to filesystem, expires at: ${expiresAt.toISOString()}`);

      // Also save a backup with timestamp for history
      const backupFile = path.join(cachePath, `scan_${Date.now()}.json`);
      await fs.writeFile(backupFile, JSON.stringify(cachedScan, null, 2));
    } catch (error) {
      console.error(`Error caching scan for placeId ${placeId}:`, error);
    }
  }

  async deleteCachedScan(placeId: string): Promise<void> {
    try {
      const cachePath = this.getCachePath(placeId);
      await fs.rm(cachePath, { recursive: true, force: true });
      console.log(`Deleted cache for placeId: ${placeId}`);
    } catch (error) {
      console.error(`Error deleting cache for placeId ${placeId}:`, error);
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const cacheFile = path.join(this.cacheDir, entry.name, 'scan.json');
          
          try {
            const content = await fs.readFile(cacheFile, 'utf-8');
            const cachedScan: CachedScan = JSON.parse(content);
            
            const expiresAt = new Date(cachedScan.metadata.expiresAt);
            if (expiresAt < new Date()) {
              await this.deleteCachedScan(cachedScan.metadata.placeId);
              console.log(`Cleaned up expired cache for: ${cachedScan.metadata.restaurantName}`);
            }
          } catch (error) {
            // Skip if file doesn't exist or is invalid
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalCached: number;
    totalSize: number;
    restaurants: Array<{
      placeId: string;
      restaurantName: string;
      cachedAt: string;
      expiresAt: string;
    }>;
  }> {
    try {
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });
      const restaurants = [];
      let totalSize = 0;

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const cacheFile = path.join(this.cacheDir, entry.name, 'scan.json');
          
          try {
            const stats = await fs.stat(cacheFile);
            totalSize += stats.size;
            
            const content = await fs.readFile(cacheFile, 'utf-8');
            const cachedScan: CachedScan = JSON.parse(content);
            
            restaurants.push({
              placeId: cachedScan.metadata.placeId,
              restaurantName: cachedScan.metadata.restaurantName,
              cachedAt: cachedScan.metadata.cachedAt,
              expiresAt: cachedScan.metadata.expiresAt
            });
          } catch (error) {
            // Skip invalid entries
            continue;
          }
        }
      }

      return {
        totalCached: restaurants.length,
        totalSize,
        restaurants
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalCached: 0,
        totalSize: 0,
        restaurants: []
      };
    }
  }
}

// Export singleton instance
export const scanCacheService = new ScanCacheService();