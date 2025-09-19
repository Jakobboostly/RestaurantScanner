#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';

interface CleanupStats {
  foldersProcessed: number;
  filesDeleted: number;
  filesKept: number;
  sizeFreed: number;
}

class ScanCacheCleanup {
  private cacheDir = path.join(process.cwd(), 'scan-cache');
  private stats: CleanupStats = {
    foldersProcessed: 0,
    filesDeleted: 0,
    filesKept: 0,
    sizeFreed: 0
  };

  async cleanup(): Promise<void> {
    console.log('🧹 Starting scan cache cleanup...');
    console.log(`📁 Cache directory: ${this.cacheDir}`);
    console.log('🎯 Goal: Keep only scan.json, delete all timestamped backups\n');

    try {
      const entries = await fs.readdir(this.cacheDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.cleanupPlaceIdFolder(entry.name);
        }
      }

      this.printSummary();

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      process.exit(1);
    }
  }

  private async cleanupPlaceIdFolder(placeId: string): Promise<void> {
    const folderPath = path.join(this.cacheDir, placeId);
    this.stats.foldersProcessed++;

    try {
      const files = await fs.readdir(folderPath);

      // Separate scan.json from timestamped files
      const scanJson = files.find(f => f === 'scan.json');
      const timestampedFiles = files.filter(f => f.startsWith('scan_') && f.endsWith('.json'));

      console.log(`📂 ${placeId} (${files.length} files)`);

      if (scanJson) {
        console.log(`   ✅ Keeping: ${scanJson}`);
        this.stats.filesKept++;
      } else {
        console.log(`   ⚠️ No scan.json found!`);
      }

      // Delete timestamped backup files
      for (const file of timestampedFiles) {
        const filePath = path.join(folderPath, file);

        try {
          const stat = await fs.stat(filePath);
          this.stats.sizeFreed += stat.size;

          await fs.unlink(filePath);
          console.log(`   🗑️ Deleted: ${file} (${this.formatBytes(stat.size)})`);
          this.stats.filesDeleted++;

        } catch (error) {
          console.log(`   ❌ Failed to delete ${file}: ${error.message}`);
        }
      }

      if (timestampedFiles.length === 0) {
        console.log(`   ✨ Already clean (no timestamped files)`);
      }

    } catch (error) {
      console.log(`   ❌ Error processing folder: ${error.message}`);
    }

    console.log('');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private printSummary(): void {
    console.log('='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Place ID folders processed: ${this.stats.foldersProcessed}`);
    console.log(`Files kept (scan.json): ${this.stats.filesKept}`);
    console.log(`Files deleted (timestamped): ${this.stats.filesDeleted}`);
    console.log(`Space freed: ${this.formatBytes(this.stats.sizeFreed)}`);
    console.log('='.repeat(60));
    console.log('✅ Cleanup complete! Each place ID now has exactly one scan file.');
  }
}

// Main execution
async function main() {
  const cleanup = new ScanCacheCleanup();
  await cleanup.cleanup();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});