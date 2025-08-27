import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { ScanResult } from '../../shared/schema';
import { RevenueLossHtmlGenerator } from './revenueLossHtmlGenerator';

export class RevenueLossScreenshotService {
  private readonly screenshotDir = path.join(process.cwd(), 'revenue-gate-screenshots');
  private readonly htmlGenerator = new RevenueLossHtmlGenerator();
  private puppeteerAvailable: boolean | null = null;

  constructor() {
    this.ensureScreenshotDirectory();
    this.checkPuppeteerAvailability();
  }

  private async checkPuppeteerAvailability(): Promise<void> {
    try {
      console.log('🔍 Checking Puppeteer availability...');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 10000
      });
      await browser.close();
      this.puppeteerAvailable = true;
      console.log('✅ Puppeteer is available and working');
    } catch (error) {
      this.puppeteerAvailable = false;
      console.warn('⚠️ Puppeteer not available on this environment:', error instanceof Error ? error.message : 'Unknown error');
      console.warn('📝 Screenshot generation will be disabled but server will continue running');
    }
  }

  private async ensureScreenshotDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create screenshot directory:', error);
    }
  }

  private sanitizeFilename(filename: string): string {
    // Replace invalid filesystem characters with underscores
    return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
  }

  private getScreenshotPath(restaurantName: string): string {
    const sanitized = this.sanitizeFilename(restaurantName);
    return path.join(this.screenshotDir, `${sanitized}.png`);
  }

  private getBackupScreenshotPath(restaurantName: string): string {
    const sanitized = this.sanitizeFilename(restaurantName);
    const timestamp = Date.now();
    return path.join(this.screenshotDir, `${sanitized}_backup_${timestamp}.png`);
  }

  async generateScreenshot(scanData: ScanResult): Promise<{
    success: boolean;
    path?: string;
    backupPath?: string;
    error?: string;
  }> {
    // Check if Puppeteer is available
    if (this.puppeteerAvailable === false) {
      console.warn(`🚫 Puppeteer not available - skipping screenshot generation for ${scanData.restaurantName}`);
      return {
        success: false,
        error: 'Puppeteer not available in this environment'
      };
    }

    // Wait for availability check to complete if still pending
    if (this.puppeteerAvailable === null) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (this.puppeteerAvailable === false) {
        return {
          success: false,
          error: 'Puppeteer availability check failed'
        };
      }
    }

    let browser;
    
    try {
      console.log(`🖼️  Generating Revenue Loss Gate screenshot for ${scanData.restaurantName}`);

      // Generate HTML content
      const html = this.htmlGenerator.generateHtml(scanData);

      // Launch Puppeteer with production-ready settings
      console.log('🚀 Launching Puppeteer browser...');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--run-all-compositor-stages-before-draw',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-ipc-flooding-protection',
          '--single-process'  // For low memory environments
        ],
        executablePath: process.env.CHROME_BIN || undefined, // Allow custom Chrome path
        timeout: 30000 // 30 second timeout
      });
      console.log('✅ Puppeteer browser launched successfully');

      const page = await browser.newPage();

      // Set viewport for consistent screenshot size
      await page.setViewport({
        width: 1400,
        height: 1000,
        deviceScaleFactor: 1
      });

      // Load HTML content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Determine file paths
      const primaryPath = this.getScreenshotPath(scanData.restaurantName);
      let actualPath = primaryPath;
      let backupPath;

      // Check if file already exists
      try {
        await fs.access(primaryPath);
        // File exists, create backup
        backupPath = this.getBackupScreenshotPath(scanData.restaurantName);
        actualPath = backupPath;
        console.log(`📁 File exists, creating backup: ${path.basename(backupPath)}`);
      } catch {
        // File doesn't exist, use primary path
        console.log(`📁 Creating new screenshot: ${path.basename(primaryPath)}`);
      }

      // Take screenshot of the full page
      await page.screenshot({
        path: actualPath as `${string}.png`,
        type: 'png',
        fullPage: true
      });

      // Update metadata
      await this.updateMetadata(scanData.restaurantName, actualPath, backupPath);

      console.log(`✅ Screenshot generated successfully: ${path.basename(actualPath)}`);

      return {
        success: true,
        path: actualPath,
        backupPath
      };

    } catch (error) {
      console.error(`❌ Screenshot generation failed for ${scanData.restaurantName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async updateMetadata(restaurantName: string, screenshotPath: string, backupPath?: string): Promise<void> {
    try {
      const metadataPath = path.join(this.screenshotDir, 'metadata.json');
      
      let metadata: any = {};
      try {
        const content = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(content);
      } catch {
        // File doesn't exist or is invalid, start fresh
      }

      const entry = {
        restaurantName,
        createdAt: new Date().toISOString(),
        primaryPath: screenshotPath,
        backupPath: backupPath || null,
        fileSize: 0
      };

      try {
        const stats = await fs.stat(screenshotPath);
        entry.fileSize = stats.size;
      } catch {
        // Ignore stat errors
      }

      metadata[restaurantName] = entry;

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }

  async getScreenshotInfo(restaurantName: string): Promise<{
    exists: boolean;
    path?: string;
    backupPath?: string;
    createdAt?: string;
    fileSize?: number;
  }> {
    try {
      const metadataPath = path.join(this.screenshotDir, 'metadata.json');
      const content = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      
      const entry = metadata[restaurantName];
      if (entry) {
        // Verify file still exists
        try {
          await fs.access(entry.primaryPath);
          return {
            exists: true,
            path: entry.primaryPath,
            backupPath: entry.backupPath,
            createdAt: entry.createdAt,
            fileSize: entry.fileSize
          };
        } catch {
          // File was deleted, remove from metadata
          delete metadata[restaurantName];
          await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
      }
    } catch (error) {
      // Metadata file doesn't exist or is invalid
    }

    return { exists: false };
  }

  async getAllScreenshots(): Promise<Array<{
    restaurantName: string;
    path: string;
    backupPath?: string;
    createdAt: string;
    fileSize: number;
  }>> {
    try {
      const metadataPath = path.join(this.screenshotDir, 'metadata.json');
      const content = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      
      const screenshots = [];
      for (const [restaurantName, entry] of Object.entries(metadata)) {
        const typedEntry = entry as any;
        try {
          // Verify file still exists
          await fs.access(typedEntry.primaryPath);
          screenshots.push({
            restaurantName,
            path: typedEntry.primaryPath,
            backupPath: typedEntry.backupPath,
            createdAt: typedEntry.createdAt,
            fileSize: typedEntry.fileSize
          });
        } catch {
          // File was deleted, will be cleaned up next time
        }
      }

      return screenshots.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get all screenshots:', error);
      return [];
    }
  }

  async deleteScreenshot(restaurantName: string): Promise<boolean> {
    try {
      const info = await this.getScreenshotInfo(restaurantName);
      if (!info.exists) {
        return false;
      }

      // Delete main file
      if (info.path) {
        await fs.unlink(info.path);
      }

      // Delete backup file if it exists
      if (info.backupPath) {
        try {
          await fs.unlink(info.backupPath);
        } catch {
          // Backup file might not exist
        }
      }

      // Update metadata
      const metadataPath = path.join(this.screenshotDir, 'metadata.json');
      try {
        const content = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(content);
        delete metadata[restaurantName];
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      } catch {
        // Metadata file doesn't exist
      }

      console.log(`🗑️  Deleted screenshot for ${restaurantName}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete screenshot for ${restaurantName}:`, error);
      return false;
    }
  }

  async getStorageStats(): Promise<{
    totalScreenshots: number;
    totalSize: number;
    oldestScreenshot?: string;
    newestScreenshot?: string;
  }> {
    try {
      const screenshots = await this.getAllScreenshots();
      const totalSize = screenshots.reduce((sum, s) => sum + s.fileSize, 0);

      return {
        totalScreenshots: screenshots.length,
        totalSize,
        oldestScreenshot: screenshots[screenshots.length - 1]?.restaurantName,
        newestScreenshot: screenshots[0]?.restaurantName
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalScreenshots: 0,
        totalSize: 0
      };
    }
  }
}

// Export singleton instance
export const revenueLossScreenshotService = new RevenueLossScreenshotService();