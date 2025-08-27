import postgres from 'postgres';

async function checkTables() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    // Check if screenshot tables exist
    const tables = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'revenue_gate_screenshots'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 revenue_gate_screenshots table structure:');
    console.table(tables);
    
    // Check how many screenshots we have
    const count = await sql`SELECT COUNT(*) as count FROM revenue_gate_screenshots`;
    console.log(`📸 Total screenshots in database: ${count[0].count}`);
    
    // Show sample data (without the large screenshot_data field)
    const samples = await sql`
      SELECT id, restaurant_name, screenshot_url, created_at, updated_at
      FROM revenue_gate_screenshots 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('\n📊 Sample screenshot records:');
    console.table(samples);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkTables();