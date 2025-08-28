#!/usr/bin/env bash
set -o errexit

echo "🚀 Setting up Puppeteer for Render..."

# Configure the Puppeteer cache directory
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
echo "📁 Setting up Puppeteer cache directory at: $PUPPETEER_CACHE_DIR"
mkdir -p $PUPPETEER_CACHE_DIR

# Install Puppeteer and download Chrome
echo "🌐 Installing Chrome browser for Puppeteer..."
npx puppeteer browsers install chrome

# Check if Chrome was installed successfully
if [[ -d $PUPPETEER_CACHE_DIR/chrome ]]; then
  echo "✅ Chrome installed successfully"
  echo "📍 Chrome location: $(find $PUPPETEER_CACHE_DIR -name chrome -type f 2>/dev/null | head -1)"
else
  echo "⚠️  Chrome installation directory not found, but continuing..."
fi

echo "✨ Render build complete!"