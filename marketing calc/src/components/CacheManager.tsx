import React, { useState, useEffect } from 'react';
import { Cache, RestaurantCache } from '../utils/cache';

interface CacheManagerProps {
  onClose: () => void;
}

const CacheManager: React.FC<CacheManagerProps> = ({ onClose }) => {
  const [cacheStats, setCacheStats] = useState({ totalEntries: 0, totalSize: 0 });
  const [isClearing, setIsClearing] = useState(false);

  const refreshStats = () => {
    const stats = Cache.getStats();
    setCacheStats(stats);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      Cache.clearAll();
      refreshStats();
      setTimeout(() => {
        setIsClearing(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.8)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              fontSize: '20px',
              color: 'white'
            }}>🗄️</span>
            Cache Manager
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#64748b',
              padding: '5px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#1e293b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '30px',
          border: '2px solid #0ea5e9'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#0369a1',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Cache Statistics
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#0369a1',
                marginBottom: '4px'
              }}>
                {cacheStats.totalEntries}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Cached Restaurants
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#0369a1',
                marginBottom: '4px'
              }}>
                {formatBytes(cacheStats.totalSize)}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Storage Used
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '30px',
          border: '2px solid #f59e0b'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#92400e',
            lineHeight: '1.6',
            marginBottom: '16px'
          }}>
            <strong>🔒 Cache Duration:</strong> Restaurant data is cached for <strong>7 days</strong> to improve performance and reduce API costs. This includes Google Places details, social media profiles, and estimated metrics.
          </div>
          
          <div style={{
            fontSize: '13px',
            color: '#78716c',
            lineHeight: '1.5'
          }}>
            • Data is automatically cleared when expired<br/>
            • Unique restaurants are identified by Google Place ID<br/>
            • Cache persists across browser sessions
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center'
        }}>
          <button
            onClick={refreshStats}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔄 Refresh Stats
          </button>
          
          <button
            onClick={handleClearCache}
            disabled={isClearing || cacheStats.totalEntries === 0}
            style={{
              background: isClearing 
                ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' 
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isClearing || cacheStats.totalEntries === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: cacheStats.totalEntries === 0 ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isClearing && cacheStats.totalEntries > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isClearing) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Cache'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheManager;