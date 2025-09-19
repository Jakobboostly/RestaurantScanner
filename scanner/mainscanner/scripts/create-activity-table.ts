import { db } from "../server/db";
import { scanActivities } from "@shared/schema";

async function createActivityTable() {
  console.log("🛠️ Creating scan_activities table...");
  
  try {
    // Create the table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS scan_activities (
        id SERIAL PRIMARY KEY,
        restaurant_name TEXT NOT NULL,
        location TEXT,
        place_id TEXT,
        domain TEXT,
        action TEXT NOT NULL DEFAULT 'analyzed',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ scan_activities table created successfully");
    
    // Add some sample data for testing if table is empty
    const existingCount = await db.select().from(scanActivities);
    
    if (existingCount.length === 0) {
      console.log("📊 Adding sample activity data...");
      
      await db.insert(scanActivities).values([
        {
          restaurantName: "Mario's Italian Kitchen",
          location: "San Francisco, CA",
          placeId: null,
          domain: "marios-kitchen.com",
          action: "analyzed"
        },
        {
          restaurantName: "The Coffee Bean",
          location: "Los Angeles, CA", 
          placeId: null,
          domain: "coffeebean.com",
          action: "analyzed"
        },
        {
          restaurantName: "Burger Palace",
          location: "Austin, TX",
          placeId: null,
          domain: "burgerpalace.com", 
          action: "analyzed"
        }
      ]);
      
      console.log("✅ Sample activity data added");
    }
    
    console.log("🎉 Activity table setup completed!");
    
  } catch (error) {
    console.error("❌ Error creating activity table:", error);
    process.exit(1);
  }
}

createActivityTable();