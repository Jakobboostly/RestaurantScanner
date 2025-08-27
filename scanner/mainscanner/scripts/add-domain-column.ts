import postgres from 'postgres';

async function addDomainColumn() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  try {
    console.log('🚀 Adding domain column to revenue_gate_screenshots table...');
    
    // Check if column already exists
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'revenue_gate_screenshots' 
      AND column_name = 'domain'
    `;
    
    if (columnExists.length > 0) {
      console.log('✅ Domain column already exists, skipping...');
      return;
    }
    
    // Add domain column
    await sql`
      ALTER TABLE revenue_gate_screenshots 
      ADD COLUMN domain text
    `;
    
    console.log('✅ Domain column added successfully!');
    
    // Verify the column was added
    const verification = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'revenue_gate_screenshots' 
      AND column_name = 'domain'
    `;
    
    if (verification.length > 0) {
      console.log('✅ Verification: Domain column exists with type:', verification[0].data_type);
    } else {
      console.log('❌ Verification failed: Domain column not found');
    }
    
  } catch (error) {
    console.error('❌ Error adding domain column:', error);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

addDomainColumn();