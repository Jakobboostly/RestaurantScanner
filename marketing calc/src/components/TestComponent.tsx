import React from 'react';
import { useParams } from 'react-router-dom';

const TestComponent: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();

  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🎉 Marketing Calculator Test</h1>
      <p>Route is working! Place ID: {placeId || 'new'}</p>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <p>This confirms React Router is working properly.</p>
        <p>Current URL path: {window.location.pathname}</p>
      </div>
    </div>
  );
};

export default TestComponent;