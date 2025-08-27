import postgres from 'postgres';

// Known domains for common restaurant chains
const KNOWN_DOMAINS = {
  'Blaze Pizza': 'blazepizza.com',
  'Via 313 Pizza': 'via313.com',
  'Wayback Burgers': 'waybackburgers.com',
  'Taqueria 27': 'taqueria27.com',
  'SLABpizza': 'slabpizza.com',
  'Slab Pizza': 'slabpizza.com',
  'Seven Brothers Burgers': 'sevenbrothers.com',
  'Root\'s Place Burgers & More': 'rootsplace.com',
  'Burgers & Barley': 'burgersandbarley.com',
  'Padeli\'s Street Greek': 'padelis.com',
  'Rolberto\'s Mexican Food': 'rolbertos.com',
  'Don Joaquin Street Tacos': 'donjoaquinstreettacos.com',
  'Off Road Mexican Food': 'offroadmexicanfood.com'
};

async function populateKnownDomains() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🚀 Populating known domains for restaurant chains...');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const [restaurantName, domain] of Object.entries(KNOWN_DOMAINS)) {
      try {
        // Find screenshot with matching or similar restaurant name
        const screenshots = await sql`
          SELECT id, restaurant_name
          FROM revenue_gate_screenshots 
          WHERE LOWER(restaurant_name) LIKE LOWER(${'%' + restaurantName.split(' ')[0] + '%'})
          OR LOWER(restaurant_name) = LOWER(${restaurantName})
        `;
        
        if (screenshots.length > 0) {
          for (const screenshot of screenshots) {
            await sql`
              UPDATE revenue_gate_screenshots 
              SET domain = ${domain}, updated_at = NOW()
              WHERE id = ${screenshot.id}
            `;
            
            console.log(`✅ Updated "${screenshot.restaurant_name}": ${domain}`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️  No match found for "${restaurantName}"`);
          notFoundCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${restaurantName}:`, error);
        notFoundCount++;
      }
    }
    
    console.log('\n📊 Known Domains Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⚠️  Not found: ${notFoundCount}`);
    
    // Show final status
    const finalCheck = await sql`
      SELECT 
        id,
        restaurant_name,
        domain,
        CASE WHEN domain IS NOT NULL THEN '✅' ELSE '❌' END as status
      FROM revenue_gate_screenshots
      ORDER BY restaurant_name
    `;
    
    console.log('\n📈 Final Domain Status:');
    console.table(finalCheck.map(r => ({
      restaurant: r.restaurant_name,
      domain: r.domain || 'NOT SET',
      status: r.status
    })));
    
  } catch (error) {
    console.error('❌ Fatal error during known domains population:', error);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

populateKnownDomains();