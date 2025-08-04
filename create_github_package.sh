#!/bin/bash

# Restaurant Scanner - GitHub Package Creator
# This script creates a clean package ready for GitHub upload

echo "🚀 Creating GitHub-ready package for Restaurant Scanner..."

# Create temporary directory
mkdir -p /tmp/restaurant-scanner-github
cd /tmp/restaurant-scanner-github

# Copy essential files from workspace
echo "📁 Copying project files..."

# Root configuration files
cp /home/runner/workspace/package.json .
cp /home/runner/workspace/package-lock.json .
cp /home/runner/workspace/tsconfig.json .
cp /home/runner/workspace/vite.config.ts .
cp /home/runner/workspace/tailwind.config.ts .
cp /home/runner/workspace/postcss.config.js .
cp /home/runner/workspace/components.json .
cp /home/runner/workspace/drizzle.config.ts .

# Documentation files
cp /home/runner/workspace/README.md .
cp /home/runner/workspace/SETUP.md .
cp /home/runner/workspace/DEPLOYMENT.md .
cp /home/runner/workspace/CONTRIBUTING.md .
cp /home/runner/workspace/FILE_DOWNLOAD_GUIDE.md .
cp /home/runner/workspace/GITHUB_SETUP.md .
cp /home/runner/workspace/.env.example .
cp /home/runner/workspace/.gitignore .
cp /home/runner/workspace/replit.md .

# Create directory structure
mkdir -p client/src/{components/ui,hooks,lib,pages}
mkdir -p server/{services,utils}
mkdir -p shared

# Copy client files
echo "📱 Copying frontend files..."
cp -r /home/runner/workspace/client/src/* client/src/
cp /home/runner/workspace/client/index.html client/

# Copy server files
echo "🖥️ Copying backend files..."
cp /home/runner/workspace/server/*.ts server/
cp /home/runner/workspace/server/services/*.ts server/services/
cp /home/runner/workspace/server/utils/*.ts server/utils/

# Copy shared files
echo "🔗 Copying shared files..."
cp /home/runner/workspace/shared/*.ts shared/

# Create zip file
echo "📦 Creating zip package..."
cd /tmp
zip -r restaurant-scanner-github.zip restaurant-scanner-github/

echo "✅ Package created successfully!"
echo "📍 Location: /tmp/restaurant-scanner-github.zip"
echo ""
echo "To download:"
echo "1. Open terminal in Replit"
echo "2. Run: cp /tmp/restaurant-scanner-github.zip /home/runner/workspace/"
echo "3. Download the zip file from the file browser"
echo ""
echo "🎯 Next steps:"
echo "1. Extract the zip file on your computer"
echo "2. Create new GitHub repository"
echo "3. Upload all files to GitHub"
echo "4. Follow SETUP.md for development setup"