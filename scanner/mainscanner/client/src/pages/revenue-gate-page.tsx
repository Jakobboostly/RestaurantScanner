import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { RevenueLossGate } from '@/components/revenue-loss-gate';
import { ScanResult } from '../../../shared/schema';

interface SavedScanData {
  success: boolean;
  restaurantName: string;
  domain: string;
  scanData: ScanResult;
  createdAt: string;
  updatedAt: string;
}

export default function RevenueGatePage() {
  const { placeId } = useParams<{ placeId: string }>();
  const [scanData, setScanData] = useState<SavedScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScanData = async () => {
      if (!placeId) {
        setError('Place ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/scan/revenue-gate/${placeId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Scan results not found. This link may be expired or invalid.');
          } else {
            setError('Failed to load scan results');
          }
          setLoading(false);
          return;
        }

        const data: SavedScanData = await response.json();
        setScanData(data);
      } catch (err) {
        setError('Failed to load scan results');
        console.error('Failed to load scan data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadScanData();
  }, [placeId]);

  const handleClose = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  const handleContinue = () => {
    // For now, just close the gate - could implement full results view later
    handleClose();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading revenue analysis...</div>
      </div>
    );
  }

  if (error || !scanData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-lg mb-6">{error || 'Scan results not found'}</p>
          <button 
            onClick={handleClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RevenueLossGate 
        scanData={scanData.scanData}
        placeId={placeId}
        onClose={handleClose}
        onContinue={handleContinue}
      />
    </div>
  );
}