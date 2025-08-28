#!/usr/bin/env bash
set -o errexit

echo "🚀 Setting up Puppeteer for Render..."

# Configure the Puppeteer cache directory
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
echo "📁 Setting up Puppeteer cache directory at: $PUPPETEER_CACHE_DIR"
mkdir -p $PUPPETEER_CACHE_DIR

# Set environment variable for Puppeteer
export PUPPETEER_CACHE_DIR=$PUPPETEER_CACHE_DIR

# Install Puppeteer and download Chrome
echo "🌐 Installing Chrome browser for Puppeteer..."
npx puppeteer browsers install chrome

# Find the actual Chrome executable
echo "🔍 Searching for Chrome executable..."
CHROME_PATH=$(find $PUPPETEER_CACHE_DIR -name chrome -type f -executable 2>/dev/null | head -1)

if [[ -n "$CHROME_PATH" ]]; then
  echo "✅ Chrome found at: $CHROME_PATH"
  echo "📍 Chrome directory structure:"
  ls -la $(dirname "$CHROME_PATH")
  echo "🔍 Full Chrome path for PUPPETEER_EXECUTABLE_PATH environment variable:"
  echo "$CHROME_PATH"
else
  echo "⚠️  Chrome executable not found in expected location"
  echo "📁 Contents of cache directory:"
  ls -la $PUPPETEER_CACHE_DIR || echo "Cache directory not accessible"
  echo "🔍 Searching entire /opt/render for Chrome..."
  find /opt/render -name chrome -type f 2>/dev/null | head -5 || echo "No Chrome found in /opt/render"
fi

echo "✨ Render build complete!"