# Production Cache Migration Instructions

## Overview
This document contains instructions for migrating the 850+ cached scan results from the production server's filesystem to the database before deploying the new database-first caching system.

## Background
- The production server at `https://boostly-restaurant-scanner.onrender.com/` has ~850 restaurant scans cached in filesystem
- These are stored in `/app/scan-cache/` directory (Render.com default path)
- The new caching system uses database-first approach to work across server instances
- Without migration, all cached scans would be lost during deployment

## Migration Script
The script `scripts/migrate-filesystem-cache-to-db.ts` has been created and tested locally:

### What it does:
1. ✅ Reads all cache directories from `scan-cache/`
2. ✅ Parses each `scan.json` file with restaurant data
3. ✅ Checks for existing records in database (avoids duplicates)
4. ✅ Migrates new records to `fullScanResults` table
5. ✅ Provides detailed statistics and validation

### Local Test Results:
- ✅ Successfully migrated 12/18 local cache entries
- ✅ Properly detected 6 existing duplicates (no overwrites)
- ✅ Database records increased from 200 to 212
- ✅ All scan data integrity preserved
- ✅ No errors during migration process

## Production Deployment Steps

### Step 1: Deploy Migration Script to Production
Upload the migration script to the production server:
```bash
# The script is ready at:
scripts/migrate-filesystem-cache-to-db.ts
```

### Step 2: Run Migration on Production Server
SSH or use Render.com console to execute:

```bash
# Set required environment variables
export DATABASE_URL="postgresql://scannerinfo_user:nv7bNbYB8oeRP2od8aGKPtuKgqEwVKWO@dpg-d2nj9fq4d50c73etffs0-a.oregon-postgres.render.com/scannerinfo"
export PGSSLMODE=require

# Run the migration
npx tsx scripts/migrate-filesystem-cache-to-db.ts
```

### Step 3: Validate Migration Success
Check the migration completed successfully:

```bash
# Validate only (no migration)
npx tsx scripts/migrate-filesystem-cache-to-db.ts --validate-only
```

Expected output:
- ✅ Total records in database: ~1050+ (200 existing + 850 migrated)
- ✅ Sample validation showing scan data integrity
- ✅ Migration statistics with high success rate

### Step 4: Deploy New Caching System
After successful migration, deploy the updated codebase with:
- ✅ `server/services/scanCacheService.ts` (database-first caching)
- ✅ `server/routes.ts` (webhook endpoint with caching)

## Rollback Plan
If migration fails:
1. The script never deletes filesystem cache (read-only)
2. Database records can be deleted if needed:
   ```sql
   DELETE FROM fullScanResults WHERE createdAt > '2025-09-11';
   ```
3. Revert to filesystem-only caching temporarily

## Expected Migration Results

### Before Migration:
- Database: ~200 scan records
- Filesystem: ~850 cached scans
- Production cache: Not working across server instances

### After Migration:
- Database: ~1050+ scan records (200 + 850)
- Filesystem: Preserved as backup
- Production cache: Working across all server instances
- CSV processing: Benefits from cached results
- Scan performance: Dramatically improved for repeat scans

## Migration Timeline
- **Preparation**: ✅ Complete (script created and tested)
- **Deployment**: Ready to execute on production
- **Validation**: Built-in validation and statistics
- **Total time**: ~5-10 minutes for 850 records

## Technical Details

### Migration Script Features:
- ✅ Duplicate detection (skips existing records)
- ✅ Comprehensive error handling
- ✅ Progress tracking with detailed logging
- ✅ Data integrity validation
- ✅ Graceful handling of malformed cache files
- ✅ SSL/TLS support for database connections
- ✅ Preserves original cache timestamps

### Database Schema:
```typescript
fullScanResults: {
  id: uuid (primary key)
  placeId: string (unique)
  restaurantName: string
  domain: string (nullable)
  scanData: jsonb (complete scan result)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Post-Migration Benefits
1. **CSV Processing**: Will use cached results instead of re-scanning
2. **Performance**: Instant results for previously scanned restaurants
3. **Scalability**: Cache works across multiple server instances
4. **Reliability**: Database persistence vs ephemeral filesystem
5. **Cost Savings**: Reduced API calls to external services

---

**Status**: Ready for production deployment
**Risk Level**: Low (read-only filesystem operations, duplicate detection)
**Recovery Time**: Immediate (filesystem cache preserved as backup)