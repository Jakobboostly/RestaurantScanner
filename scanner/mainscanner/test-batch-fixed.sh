#!/bin/bash

echo "🧪 Testing the FIXED batch processing system..."

# Set the database URL
export DATABASE_URL="postgresql://scannerinfo_user:nv7bNbYB8oeRP2od8aGKPtuKgqEwVKWO@dpg-d2nj9fq4d50c73etffs0-a.oregon-postgres.render.com/scannerinfo"

# Run the test script first
echo "🔬 Running test with sample restaurants..."
npx tsx scripts/test-batch-processing.ts

echo ""
echo "📋 Test completed. Check the results above."
echo "If successful, you can run the full batch with your CSV file."