import React, { useState } from 'react';
import { placesAPI } from '../services/placesAPI';

const TestPlaces: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('Testing API...');
    
    try {
      console.log('Testing Google Places API...');
      const restaurants = await placesAPI.searchRestaurants('pizza chicago');
      console.log('API Response:', restaurants);
      setResult(`Found ${restaurants.length} restaurants: ${JSON.stringify(restaurants.slice(0, 2), null, 2)}`);
    } catch (error) {
      console.error('API Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', margin: '20px', borderRadius: '10px' }}>
      <h3>Google Places API Test</h3>
      <button onClick={testAPI} disabled={loading}>
        {loading ? 'Testing...' : 'Test API'}
      </button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', fontSize: '12px' }}>
        {result}
      </pre>
    </div>
  );
};

export default TestPlaces;