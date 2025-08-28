/**
 * API Configuration
 * Centralizes API keys and endpoints management
 */

export const config = {
  googlePlaces: {
    apiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '',
    baseUrl: 'https://maps.googleapis.com/maps/api/place'
  },
  apify: {
    token: import.meta.env.VITE_APIFY_TOKEN || '',
    actorId: 'nwua9Gu5YrADL7ZDj'
  },
  seo: {
    apiKey: import.meta.env.VITE_SEO_API_KEY || '',
    baseUrl: ''
  },
  socialMedia: {
    apiKey: import.meta.env.VITE_SOCIAL_MEDIA_API_KEY || '',
    baseUrl: ''
  }
};

/**
 * Validates that required API keys are present
 */
export const validateApiKeys = () => {
  const errors: string[] = [];
  
  if (!config.googlePlaces.apiKey) {
    errors.push('Google Places API key is missing. Please set VITE_GOOGLE_PLACES_API_KEY in your .env file.');
  }
  
  if (errors.length > 0) {
    console.warn('API Configuration Issues:', errors);
  }
  
  return errors.length === 0;
};