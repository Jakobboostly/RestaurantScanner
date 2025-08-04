# Step-by-Step File Download Guide

## How to Download All Files from Replit

### Step 1: Download Individual Files

In Replit, click on each file in the left sidebar and use **Ctrl+A** (or **Cmd+A** on Mac) to select all content, then **Ctrl+C** (or **Cmd+C**) to copy. Create the same file locally and paste the content.

### Step 2: Essential Files to Download

#### 📁 Root Directory Files
```
✅ package.json                 - Project dependencies
✅ package-lock.json            - Dependency lock file
✅ tsconfig.json               - TypeScript configuration
✅ vite.config.ts              - Vite build configuration
✅ tailwind.config.ts          - Tailwind CSS configuration
✅ postcss.config.js           - PostCSS configuration
✅ components.json             - shadcn/ui components config
✅ drizzle.config.ts           - Database configuration
✅ README.md                   - Project documentation
✅ SETUP.md                    - Setup instructions
✅ DEPLOYMENT.md               - Deployment guide
✅ CONTRIBUTING.md             - Development guidelines
✅ .env.example                - Environment template
✅ .gitignore                  - Git ignore file
✅ replit.md                   - Development context
```

#### 📁 Client Folder (Frontend)
Create a `client` folder and download these files:

**client/index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Restaurant Scanner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**client/src/ files:**
```
✅ client/src/main.tsx              - React entry point
✅ client/src/App.tsx               - Main React component
✅ client/src/index.css             - Global styles
✅ client/src/lib/api.ts            - API utilities
✅ client/src/lib/queryClient.ts    - React Query setup
✅ client/src/lib/utils.ts          - Utility functions
✅ client/src/hooks/use-toast.ts    - Toast hook
✅ client/src/hooks/use-mobile.tsx  - Mobile detection hook
```

**client/src/components/ files:**
```
✅ client/src/components/navigation.tsx
✅ client/src/components/restaurant-search.tsx
✅ client/src/components/results-dashboard.tsx
✅ client/src/components/reviews-analysis.tsx
✅ client/src/components/scanning-animation.tsx
✅ client/src/components/score-gauge.tsx
```

**client/src/components/ui/ files (shadcn/ui components):**
```
✅ client/src/components/ui/accordion.tsx
✅ client/src/components/ui/alert-dialog.tsx
✅ client/src/components/ui/alert.tsx
✅ client/src/components/ui/avatar.tsx
✅ client/src/components/ui/badge.tsx
✅ client/src/components/ui/button.tsx
✅ client/src/components/ui/card.tsx
✅ client/src/components/ui/chart.tsx
✅ client/src/components/ui/checkbox.tsx
✅ client/src/components/ui/dialog.tsx
✅ client/src/components/ui/form.tsx
✅ client/src/components/ui/input.tsx
✅ client/src/components/ui/label.tsx
✅ client/src/components/ui/progress.tsx
✅ client/src/components/ui/select.tsx
✅ client/src/components/ui/separator.tsx
✅ client/src/components/ui/tabs.tsx
✅ client/src/components/ui/toaster.tsx
✅ client/src/components/ui/toast.tsx
✅ client/src/components/ui/tooltip.tsx
```

**client/src/pages/ files:**
```
✅ client/src/pages/home.tsx
✅ client/src/pages/not-found.tsx
```

#### 📁 Server Folder (Backend)
Create a `server` folder and download these files:

**server/ main files:**
```
✅ server/index.ts               - Server entry point
✅ server/routes.ts              - API routes
✅ server/storage.ts             - Data storage layer
✅ server/vite.ts                - Vite integration
```

**server/services/ files:**
```
✅ server/services/advancedScannerService.ts
✅ server/services/competitorService.ts
✅ server/services/contentAnalysisService.ts
✅ server/services/dataForSeoRestaurantService.ts
✅ server/services/dataForSeoScannerService.ts
✅ server/services/dataForSeoService.ts
✅ server/services/enhancedDataForSeoService.ts
✅ server/services/focusedScannerService.ts
✅ server/services/googleBusinessService.ts
✅ server/services/hybridScannerService.ts
✅ server/services/lighthouseScreenshotService.ts
✅ server/services/lighthouseService.ts
✅ server/services/mobileExperienceService.ts
✅ server/services/mozService.ts
✅ server/services/pageSpeedService.ts
✅ server/services/performanceService.ts
✅ server/services/professionalScannerService.ts
✅ server/services/queueService.ts
✅ server/services/restaurantService.ts
✅ server/services/scannerService.ts
✅ server/services/screenshotService.ts
✅ server/services/serpApiService.ts
✅ server/services/zembraTechReviewsService.ts
```

**server/utils/ files:**
```
✅ server/utils/jsonSanitizer.ts  - JSON sanitization utility
```

#### 📁 Shared Folder
Create a `shared` folder and download:
```
✅ shared/schema.ts               - Database schemas and types
```

### Step 3: Create Local Project Structure

After downloading all files, your local project should look like this:

```
restaurant-scanner/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   ├── navigation.tsx
│   │   │   ├── restaurant-search.tsx
│   │   │   ├── results-dashboard.tsx
│   │   │   ├── reviews-analysis.tsx
│   │   │   ├── scanning-animation.tsx
│   │   │   └── score-gauge.tsx
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── home.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── index.html
├── server/
│   ├── services/
│   │   ├── advancedScannerService.ts
│   │   ├── competitorService.ts
│   │   ├── contentAnalysisService.ts
│   │   ├── dataForSeoRestaurantService.ts
│   │   ├── dataForSeoScannerService.ts
│   │   ├── dataForSeoService.ts
│   │   ├── enhancedDataForSeoService.ts
│   │   ├── focusedScannerService.ts
│   │   ├── googleBusinessService.ts
│   │   ├── hybridScannerService.ts
│   │   ├── lighthouseScreenshotService.ts
│   │   ├── lighthouseService.ts
│   │   ├── mobileExperienceService.ts
│   │   ├── mozService.ts
│   │   ├── pageSpeedService.ts
│   │   ├── performanceService.ts
│   │   ├── professionalScannerService.ts
│   │   ├── queueService.ts
│   │   ├── restaurantService.ts
│   │   ├── scannerService.ts
│   │   ├── screenshotService.ts
│   │   ├── serpApiService.ts
│   │   └── zembraTechReviewsService.ts
│   ├── utils/
│   │   └── jsonSanitizer.ts
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── DEPLOYMENT.md
├── components.json
├── drizzle.config.ts
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── replit.md
├── SETUP.md
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Step 4: Alternative - Use Replit Download Feature

1. **Click the 3-dot menu** in the top right of Replit
2. **Select "Download as zip"**
3. **Extract the zip file** to your local computer
4. **Clean up the folder** by removing:
   - `node_modules/` folder
   - `.replit` file
   - `replit.nix` file
   - Any other Replit-specific files

### Step 5: Verify Your Download

After downloading, check that you have:
- ✅ All source code files (.ts, .tsx, .js, .jsx)
- ✅ Configuration files (package.json, tsconfig.json, etc.)
- ✅ Documentation files (README.md, SETUP.md, etc.)
- ✅ UI components (all shadcn/ui components)
- ✅ Server services (all API integration services)
- ✅ Proper folder structure

### Step 6: Test Locally

After downloading all files:
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# Then start the development server
npm run dev
```

### ⚠️ Important Notes

1. **Don't download `node_modules/`** - This will be recreated when you run `npm install`
2. **Don't download `.replit` files** - These are Replit-specific
3. **Do download `.env.example`** - But don't download `.env` if it exists (contains secrets)
4. **Maintain folder structure** - The exact folder structure is important for imports to work

### 🎯 Next Steps

After downloading all files:
1. Upload to your GitHub repository
2. Set up your `.env` file with API keys
3. Test the application locally
4. Deploy to production platform

You now have all the files needed to recreate the Restaurant Scanner project on GitHub!