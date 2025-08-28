#!/bin/bash

# Set the database URL
export DATABASE_URL="postgresql://scannerinfo_user:nv7bNbYB8oeRP2od8aGKPtuKgqEwVKWO@dpg-d2nj9fq4d50c73etffs0-a.oregon-postgres.render.com/scannerinfo"

# Run the CSV batch processor
npx tsx scripts/batch-scan-csv.ts "/Users/jakobthompson/Downloads/Historical Client Data.csv"