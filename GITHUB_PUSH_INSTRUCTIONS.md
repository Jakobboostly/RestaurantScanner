# Push Restaurant Scanner to GitHub

## Quick Setup Instructions

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `restaurant-scanner` (or your preferred name)
3. Description: `AI-powered restaurant marketing intelligence platform`
4. Make it **Private** (contains business logic)  
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Step 2: Push from Replit
Copy and run these commands in the Replit shell:

```bash
# Set the correct remote URL for your new repository
git remote set-url origin https://github.com/Jakobthompson15/restaurant-scanner.git

# Verify the remote is set correctly
git remote -v

# Add all files to staging
git add .

# Commit with a descriptive message
git commit -m "Initial commit: Restaurant Scanner v1.0 - Production ready AI-powered marketing intelligence platform"

# Push to your GitHub repository
git push -u origin main
```

### Step 3: Set Up GitHub Secrets (for Actions/Deployment)
If you plan to use GitHub Actions for deployment, add these secrets:
- `GOOGLE_PLACES_API_KEY`
- `DATAFORSEO_LOGIN`  
- `DATAFORSEO_PASSWORD`
- `OPENAI_API_KEY`

## Alternative: Use GitHub CLI

If you have GitHub CLI installed:
```bash
# Create repo and push in one step
gh repo create restaurant-scanner --private --source=. --push
```

## What Gets Pushed

✅ **Included:**
- Complete source code (client + server)
- Documentation (README, setup guides)
- Configuration files (package.json, tsconfig.json)
- Built assets in dist/ folder (production ready)

❌ **Excluded by .gitignore:**
- node_modules/
- .env files (API keys)
- Temporary files
- .replit configuration

## Repository Structure
```
restaurant-scanner/
├── README.md                    # Updated with current features
├── client/                      # React frontend
├── server/                      # Express backend
├── shared/                      # Shared TypeScript types
├── dist/                        # Production build files
├── DEPLOYMENT_GUIDE_BOOSTLY.md  # Deployment instructions
└── package.json                 # Dependencies and scripts
```

## Next Steps After Push
1. **Set repository visibility** (Private for business use)
2. **Add collaborators** if needed
3. **Set up branch protection** for main branch
4. **Configure GitHub Actions** for automated deployment
5. **Add issues/project board** for feature tracking

## Troubleshooting

**If git push fails with authentication:**
```bash
# Use personal access token instead of password
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**If repository already exists:**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/restaurant-scanner.git
git push -u origin main --force
```

Your Restaurant Scanner is production-ready and contains:
- Complete AI-powered restaurant analysis
- Real API integrations (Google Places, DataForSEO, OpenAI)
- Professional UI with Boostly branding
- Deployment-ready build files
- Comprehensive documentation