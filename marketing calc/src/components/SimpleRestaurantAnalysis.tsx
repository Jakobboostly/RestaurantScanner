import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SalesDemoTool from './SalesDemoTool';

const SimpleRestaurantAnalysis: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();

  const handleAnalysisComplete = (placeId: string, data: any) => {
    console.log('Analysis complete for:', placeId);
    // Navigate to the specific restaurant URL
    if (!window.location.pathname.includes(placeId)) {
      navigate(`/${placeId}`, { replace: true });
    }
  };

  const handleStartNewAnalysis = () => {
    navigate('/new');
  };

  return (
    <SalesDemoTool
      placeId={placeId}
      onAnalysisComplete={handleAnalysisComplete}
      onStartNewAnalysis={handleStartNewAnalysis}
    />
  );
};

export default SimpleRestaurantAnalysis;