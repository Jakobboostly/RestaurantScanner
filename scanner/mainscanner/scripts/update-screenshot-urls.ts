import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { revenueGateScreenshots } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Database setup
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });
const db = drizzle(sql);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function updateScreenshotUrls() {
  console.log('🚀 Starting screenshot URL update process...');

  try {
    // Get all screenshots
    const screenshots = await db.select().from(revenueGateScreenshots);
    
    console.log(`📋 Found ${screenshots.length} screenshots to update`);

    let updateCount = 0;

    for (const screenshot of screenshots) {
      try {
        // Create URL for direct image viewing
        const imageUrl = `${BASE_URL}/api/revenue-gate/image/${encodeURIComponent(screenshot.restaurantName)}`;
        
        // Update the screenshot URL in the database
        await db
          .update(revenueGateScreenshots)
          .set({ 
            screenshotUrl: imageUrl,
            updatedAt: new Date()
          })
          .where(eq(revenueGateScreenshots.id, screenshot.id));

        console.log(`✅ Updated URL for "${screenshot.restaurantName}": ${imageUrl}`);
        updateCount++;

      } catch (error) {
        console.error(`❌ Error updating ${screenshot.restaurantName}:`, error);
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updateCount}`);
    console.log(`🎯 Total processed: ${screenshots.length}`);

  } catch (error) {
    console.error('❌ Fatal error during update:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the update
updateScreenshotUrls().then(() => {
  console.log('🎉 Screenshot URL update complete!');
}).catch((error) => {
  console.error('💥 Update failed:', error);
  process.exit(1);
});