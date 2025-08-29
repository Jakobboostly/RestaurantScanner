#!/bin/bash

echo "🧪 Testing the FIXED batch processing system..."

# Set the database URL
export DATABASE_URL="postgresql://scannerinfo_user:nv7bNbYB8oeRP2od8aGKPtuKgqEwVKWO@dpg-d2nj9fq4d50c73etffs0-a.oregon-postgres.render.com/scannerinfo"

# Create a small test CSV file
cat > test-restaurants-sample.csv << EOF
Company Name,Website
Pizza Palace,https://pizzapalace.com
Burger Test,https://mcdonalds.com
EOF

echo "📝 Created test-restaurants-sample.csv with 2 sample restaurants"
echo "🔬 Running batch processing test..."

# Run the actual batch processor with the test file
npx tsx scripts/batch-scan-csv.ts "./test-restaurants-sample.csv" --batch-size=1 --output-dir=./test-results

echo ""
echo "📋 Test completed! Check ./test-results/ for output files."
echo "If successful, you can run the full batch with your Historical Client Data.csv"