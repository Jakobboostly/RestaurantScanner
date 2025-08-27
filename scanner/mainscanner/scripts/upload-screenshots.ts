import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { revenueGateScreenshots } from '../shared/schema';

// Database setup
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });
const db = drizzle(sql);

const SCREENSHOTS_DIR = '/Users/jakobthompson/Desktop/Boostly/scanner/mainscanner/revenue-gate-screenshots';
const METADATA_FILE = join(SCREENSHOTS_DIR, 'metadata.json');

interface ScreenshotMetadata {
  restaurantName: string;
  createdAt: string;
  primaryPath: string;
  backupPath: string | null;
  fileSize: number;
}

async function uploadScreenshots() {
  console.log('🚀 Starting screenshot upload process...');

  try {
    // Load metadata
    const metadataContent = readFileSync(METADATA_FILE, 'utf-8');
    const metadata: Record<string, ScreenshotMetadata> = JSON.parse(metadataContent);

    console.log(`📋 Found ${Object.keys(metadata).length} restaurants in metadata`);

    // Get all PNG files in directory
    const files = readdirSync(SCREENSHOTS_DIR).filter(file => 
      extname(file).toLowerCase() === '.png'
    );

    console.log(`📸 Found ${files.length} PNG files`);

    let uploadCount = 0;
    let skipCount = 0;

    for (const file of files) {
      const filePath = join(SCREENSHOTS_DIR, file);
      const fileName = basename(file, '.png');
      
      // Skip metadata.json
      if (file === 'metadata.json') continue;

      // Find corresponding metadata entry
      const metaEntry = Object.values(metadata).find(entry => 
        entry.primaryPath.includes(file) || entry.backupPath?.includes(file)
      );

      if (!metaEntry) {
        console.log(`⚠️  No metadata found for ${file}, skipping...`);
        skipCount++;
        continue;
      }

      try {
        // Read file and convert to base64
        const imageBuffer = readFileSync(filePath);
        const base64Data = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        const fileStats = statSync(filePath);

        // Check if already exists
        const existing = await db
          .select()
          .from(revenueGateScreenshots)
          .where(sql`restaurant_name = ${metaEntry.restaurantName}`)
          .limit(1);

        if (existing.length > 0) {
          console.log(`⏭️  Screenshot for "${metaEntry.restaurantName}" already exists, skipping...`);
          skipCount++;
          continue;
        }

        // Insert into database
        await db.insert(revenueGateScreenshots).values({
          placeId: `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique place ID
          restaurantName: metaEntry.restaurantName,
          screenshotData: base64Data,
          metadata: {
            originalFileName: file,
            fileSize: fileStats.size,
            dimensions: 'unknown', // You could use a library like sharp to get actual dimensions
            createdAt: metaEntry.createdAt,
            primaryPath: metaEntry.primaryPath,
            backupPath: metaEntry.backupPath,
          }
        });

        console.log(`✅ Uploaded screenshot for "${metaEntry.restaurantName}" (${fileStats.size} bytes)`);
        uploadCount++;

      } catch (error) {
        console.error(`❌ Error uploading ${file}:`, error);
        skipCount++;
      }
    }

    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successfully uploaded: ${uploadCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`🎯 Total processed: ${uploadCount + skipCount}`);

  } catch (error) {
    console.error('❌ Fatal error during upload:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the upload
uploadScreenshots().then(() => {
  console.log('🎉 Screenshot upload complete!');
}).catch((error) => {
  console.error('💥 Upload failed:', error);
  process.exit(1);
});