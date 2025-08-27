import postgres from 'postgres';

async function populateDomains() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🚀 Populating domain data for revenue gate screenshots...');
    
    // Get screenshots without domains
    const screenshotsWithoutDomains = await sql`
      SELECT id, restaurant_name, place_id
      FROM revenue_gate_screenshots 
      WHERE domain IS NULL OR domain = ''
    `;
    
    console.log(`📋 Found ${screenshotsWithoutDomains.length} screenshots without domains`);
    
    let updatedCount = 0;
    let manualReviewCount = 0;
    
    for (const screenshot of screenshotsWithoutDomains) {
      try {
        // Try to find matching domain from full_scan_results
        const scanResult = await sql`
          SELECT scan_data->>'domain' as domain
          FROM full_scan_results 
          WHERE LOWER(restaurant_name) = LOWER(${screenshot.restaurant_name})
          AND scan_data->>'domain' IS NOT NULL
          AND scan_data->>'domain' != ''
          LIMIT 1
        `;
        
        if (scanResult.length > 0 && scanResult[0].domain) {
          const domain = scanResult[0].domain;
          
          await sql`
            UPDATE revenue_gate_screenshots 
            SET domain = ${domain}, updated_at = NOW()
            WHERE id = ${screenshot.id}
          `;
          
          console.log(`✅ Updated "${screenshot.restaurant_name}": ${domain}`);
          updatedCount++;
        } else {
          // Try alternative approach - check if place_id matches any restaurants table
          const restaurantResult = await sql`
            SELECT domain
            FROM restaurants 
            WHERE place_id = ${screenshot.place_id}
            AND domain IS NOT NULL
            AND domain != ''
            LIMIT 1
          `;
          
          if (restaurantResult.length > 0 && restaurantResult[0].domain) {
            const domain = restaurantResult[0].domain;
            
            await sql`
              UPDATE revenue_gate_screenshots 
              SET domain = ${domain}, updated_at = NOW()
              WHERE id = ${screenshot.id}
            `;
            
            console.log(`✅ Updated "${screenshot.restaurant_name}" (from restaurants): ${domain}`);
            updatedCount++;
          } else {
            console.log(`⚠️  No domain found for "${screenshot.restaurant_name}" - needs manual review`);
            manualReviewCount++;
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${screenshot.restaurant_name}:`, error);
        manualReviewCount++;
      }
    }
    
    console.log('\n📊 Domain Population Summary:');
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⚠️  Need manual review: ${manualReviewCount}`);
    console.log(`🎯 Total processed: ${screenshotsWithoutDomains.length}`);
    
    // Show current state
    const finalCheck = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(domain) as with_domains,
        COUNT(*) - COUNT(domain) as without_domains
      FROM revenue_gate_screenshots
    `;
    
    console.log('\n📈 Final Status:');
    console.log(`Total screenshots: ${finalCheck[0].total}`);
    console.log(`With domains: ${finalCheck[0].with_domains}`);
    console.log(`Without domains: ${finalCheck[0].without_domains}`);
    
  } catch (error) {
    console.error('❌ Fatal error during domain population:', error);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

populateDomains();