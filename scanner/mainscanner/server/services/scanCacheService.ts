import fs from 'fs/promises';
import * as fs_sync from 'fs';
import path from 'path';
import { ScanResult } from '../../shared/schema';

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
  private readonly cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
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
      const cacheFile = this.getCacheFilePath(placeId);
      console.log(`🔍 Cache file path: ${cacheFile}`);
      
      // Check if cache file exists
      try {
        await fs.access(cacheFile);
        console.log(`✅ Cache file exists for placeId: ${placeId}`);
      } catch {
        console.log(`❌ Cache miss for placeId: ${placeId} - file does not exist`);
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

      console.log(`Cache hit for placeId: ${placeId}, expires at: ${cachedScan.metadata.expiresAt}`);
      
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
      const cachePath = this.getCachePath(placeId);
      const cacheFile = this.getCacheFilePath(placeId);
      console.log(`💾 Cache will be saved to: ${cacheFile}`);

      // Create directory for this place if it doesn't exist
      await fs.mkdir(cachePath, { recursive: true });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.cacheTTL);

      const cachedScan: CachedScan = {
        data: scanResult,
        metadata: {
          cachedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          placeId,
          restaurantName: scanResult.restaurantName,
          cacheVersion: this.cacheVersion
        }
      };

      // Write cache file
      await fs.writeFile(cacheFile, JSON.stringify(cachedScan, null, 2));
      
      console.log(`Cached scan for placeId: ${placeId}, expires at: ${expiresAt.toISOString()}`);

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