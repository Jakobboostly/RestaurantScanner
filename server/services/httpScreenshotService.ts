import axios from 'axios';

export interface HttpScreenshotResult {
  keyword: string;
  location: string;
  screenshotUrl: string;
  searchUrl: string;
  success: boolean;
}

export class HttpScreenshotService {
  
  async captureSearchResults(
    keyword: string,
    restaurantName: string,
    restaurantDomain: string,
    location: string = 'United States'
  ): Promise<HttpScreenshotResult> {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=20`;
      
      console.log(`HTTP Screenshot service capturing: ${keyword}`);
      console.log(`Search URL: ${searchUrl}`);
      
      // Use a public screenshot API service
      const screenshotApiUrl = `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(searchUrl)}&dimension=1366x768&format=png&cacheLimit=0`;
      
      console.log('Using public screenshot API for Google search results');
      
      return {
        keyword,
        location,
        screenshotUrl: screenshotApiUrl,
        searchUrl,
        success: true
      };
      
    } catch (error) {
      console.error('Error with HTTP screenshot service:', error);
      
      return {
        keyword,
        location,
        screenshotUrl: '',
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
        success: false
      };
    }
  }
}