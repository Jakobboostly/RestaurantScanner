import { db } from "../server/db";
import { scanActivities } from "@shared/schema";
import { eq } from "drizzle-orm";

async function removeTestActivity() {
  console.log("🗑️ Removing test restaurant activity...");
  
  try {
    if (!db) {
      console.log("No database connection available");
      return;
    }

    // Delete the test restaurant entry
    const result = await db
      .delete(scanActivities)
      .where(eq(scanActivities.restaurantName, "Test Restaurant"));

    console.log("✅ Test restaurant activity removed");
    
    // Show remaining activities
    const remaining = await db
      .select()
      .from(scanActivities)
      .orderBy(scanActivities.createdAt);
    
    console.log(`📊 Remaining activities (${remaining.length}):`);
    remaining.forEach(activity => {
      console.log(`- ${activity.restaurantName} (${activity.location})`);
    });
    
  } catch (error) {
    console.error("❌ Error removing test activity:", error);
    process.exit(1);
  }
}

removeTestActivity();