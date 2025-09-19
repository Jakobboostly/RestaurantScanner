import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SalesDemoTool from './SalesDemoTool';
import { RestaurantCache } from '../utils/cache';
import { RestaurantIntelligence } from '../services/placesAPI';

interface RestaurantAnalysisProps {
  isDirectAccess?: boolean;
}

const RestaurantAnalysis: React.FC<RestaurantAnalysisProps> = ({ isDirectAccess = false }) => {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();
  const [cachedData, setCachedData] = useState<RestaurantIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (placeId && placeId !== 'new') {
      setIsLoading(true);
      
      // Try to load cached data for this place ID
      const cached = RestaurantCache.getCachedRestaurantIntelligence(placeId);
      if (cached) {
        console.log('Loaded cached data for place ID:', placeId);
        setCachedData(cached);
      } else {
        console.log('No cached data found for place ID:', placeId);
      }
      
      setIsLoading(false);
    } else {
      // For root path or 'new', ensure we're not loading
      setIsLoading(false);
      setCachedData(null);
    }
  }, [placeId]);

  const handleAnalysisComplete = (placeId: string, data: RestaurantIntelligence) => {
    // Cache the completed analysis
    RestaurantCache.cacheRestaurantIntelligence(placeId, data);
    
    // Update URL to include place ID if not already there
    if (!window.location.pathname.includes(placeId)) {
      navigate(`/${placeId}`, { replace: true });
    }
  };

  const handleStartNewAnalysis = () => {
    // Clear any cached data and reset to fresh state
    setCachedData(null);
    navigate('/new');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #8b9cf4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Loading Analysis</h2>
          <p style={{ color: '#666' }}>Retrieving cached data for this restaurant...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <SalesDemoTool
      cachedData={cachedData}
      onAnalysisComplete={handleAnalysisComplete}
      onStartNewAnalysis={handleStartNewAnalysis}
      placeId={placeId}
    />
  );
};

export default RestaurantAnalysis;