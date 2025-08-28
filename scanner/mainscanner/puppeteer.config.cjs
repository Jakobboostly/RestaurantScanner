/**
 * Puppeteer configuration for cache directory
 * This ensures Chrome is cached in the correct location on Render
 */

const path = require('path');

module.exports = {
  // Use Render's persistent cache directory when on Render, otherwise use local cache
  cacheDirectory: process.env.RENDER 
    ? '/opt/render/.cache/puppeteer' 
    : path.join(__dirname, '.cache', 'puppeteer'),
  
  // Ensure we use the installed Chrome version
  skipDownload: false,
  
  // Set executable path for different environments
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
};