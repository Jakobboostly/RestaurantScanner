# Excel Batch Processing Scripts

This directory contains comprehensive batch processing scripts for scanning HubSpot CRM Excel files and ensuring all restaurants have complete scan data and screenshots.

## Overview

The batch processing system handles:
- ✅ Reading Excel/XLSX files with flexible column detection
- ✅ Checking existing scans to avoid duplicates
- ✅ Professional restaurant scanning via your existing API
- ✅ Screenshot generation and PostgreSQL storage
- ✅ Comprehensive error handling and retry logic
- ✅ Detailed reporting with success/failure tracking

## Prerequisites

1. **Environment Setup:**
   ```bash
   export DATABASE_URL="postgresql://scannerinfo_user:..."
   cd /path/to/scanner/mainscanner
   npm install  # This will install the new xlsx dependency
   ```

2. **Server Running:**
   - Your scanner API should be running at `https://boostly-restaurant-scanner.onrender.com`
   - Or locally at `http://localhost:3000` for testing

## Scripts

### 1. Main Batch Processing: `batch-scan-excel.ts`

Process an entire Excel file of restaurants:

```bash
# Basic usage
npx tsx scripts/batch-scan-excel.ts "/path/to/HubSpot CRM Historical Clients Aug 27 2025.xlsx"

# With custom options
npx tsx scripts/batch-scan-excel.ts "/path/to/file.xlsx" --batch-size=3 --output-dir=./my-results
```

**Options:**
- `--batch-size=N` - Process N websites concurrently (default: 5)
- `--base-url=URL` - Scanner API base URL  
- `--output-dir=DIR` - Output directory for reports (default: ./batch-results)

### 2. Retry Failed Entries: `retry-failed-scans.ts`

Retry only the entries that failed in a previous batch run:

```bash
# Retry all failed entries
npx tsx scripts/retry-failed-scans.ts "./batch-results/failed-report-2025-01-28T15-30-45-123Z.json"

# Retry only specific error types
npx tsx scripts/retry-failed-scans.ts "./batch-results/failed-report.json" --filter-errors=screenshot,timeout
```

**Filter Options:**
- `screenshot` - Only retry screenshot generation failures
- `scan` - Only retry scan API failures  
- `invalid` - Only retry invalid URL/domain issues
- `timeout` - Only retry timeout errors

## Excel File Format

The scripts automatically detect column names. Supported formats:

**Website URL columns:** `website`, `Website`, `url`, `URL`, `domain`, `Website URL`, `company_website`, etc.

**Company name columns:** `companyName`, `Company Name`, `restaurantName`, `name`, `Account Name`, etc.

**Example Excel structure:**
```
Company Name          | Website URL
Pizza Palace         | https://pizzapalace.com
Burger King Downtown | burgerking-downtown.com
Taco Bell #123       | www.tacobell.com/locations/123
```

## Output Reports

Each run generates comprehensive reports in the output directory:

### Success Report (`success-report-TIMESTAMP.json`)
```json
{
  "generated": "2025-01-28T15:30:45.123Z",
  "total": 150,
  "results": [
    {
      "companyName": "Pizza Palace",
      "website": "https://pizzapalace.com",
      "screenshotUrl": "https://boostly-restaurant-scanner.onrender.com/api/revenue-gate/image/Pizza%20Palace",
      "placeId": "ChIJ...",
      "status": "success"
    }
  ]
}
```

### Failed Report (`failed-report-TIMESTAMP.json`)
```json
{
  "generated": "2025-01-28T15:30:45.123Z", 
  "total": 15,
  "results": [
    {
      "companyName": "Bad Website Co",
      "website": "https://nonexistent.com",
      "error": "No restaurant found for this website",
      "details": "Professional scan failed"
    }
  ]
}
```

### Statistics Report (`stats-report-TIMESTAMP.json`)
```json
{
  "totalProcessed": 165,
  "successful": 150,
  "failed": 10,
  "skipped": 5,
  "successRate": "90.91%",
  "errors": {
    "invalidUrl": 3,
    "scanFailed": 4,
    "screenshotFailed": 2,
    "databaseError": 1,
    "other": 0
  }
}
```

### CSV Report (`batch-results-TIMESTAMP.csv`)
Spreadsheet-friendly format for easy viewing and sharing.

## Error Handling

The system handles multiple error categories:

1. **Invalid URLs** - Malformed or non-existent websites
2. **Scan Failures** - Restaurant not found in Google Places
3. **Screenshot Failures** - Image generation timeouts
4. **Database Errors** - PostgreSQL connection issues

Each error type can be retried separately using the retry script.

## Rate Limiting

- **Default batch size:** 5 concurrent scans
- **Inter-batch delay:** 10 seconds  
- **Screenshot timeout:** 60 seconds per restaurant
- **Retry batch size:** 3 concurrent (more conservative)

## Typical Workflow

1. **Initial Batch Run:**
   ```bash
   npx tsx scripts/batch-scan-excel.ts "/path/to/HubSpot-file.xlsx"
   ```

2. **Review Results:**
   - Check `success-report-*.json` for working screenshots
   - Check `failed-report-*.json` for issues

3. **Retry Failed Entries:**
   ```bash
   npx tsx scripts/retry-failed-scans.ts "./batch-results/failed-report-*.json"
   ```

4. **Manual Review:**
   - Entries that fail multiple retries need manual investigation
   - Common issues: restaurant closed, website redirects, social media only

## Expected Results

For a typical HubSpot CRM file:
- **Success Rate:** 80-90% on first run
- **After Retries:** 90-95% success rate
- **Manual Review:** 5-10% may need individual attention

Each successful entry will have:
- ✅ Complete professional scan data in PostgreSQL
- ✅ Revenue gate screenshot stored as base64
- ✅ Direct URL for accessing screenshot
- ✅ All data linked by placeId for easy lookup

## Troubleshooting

**Common Issues:**

1. **Database Connection:**
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   ```

2. **API Rate Limits:**
   - Reduce batch size: `--batch-size=2`
   - Check Google Places API quota

3. **Excel Format Issues:**
   - Verify column names contain website/URL data
   - Check for merged cells or unusual formatting

4. **Screenshot Timeouts:**
   - Screenshots may take 30-60 seconds to generate
   - Retry script will catch most timeout issues

## Support

For issues with the batch processing system:
1. Check the detailed error logs
2. Try the retry script with specific error filters
3. Manually test individual problematic URLs via the web interface
4. Review the generated reports for patterns in failures