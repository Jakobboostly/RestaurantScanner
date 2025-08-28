import React, { useState, useCallback, useEffect } from 'react';
import { placesAPI, PlaceSearchResult, RestaurantIntelligence } from '../services/placesAPI';

interface RestaurantSearchProps {
  onRestaurantSelected: (intelligence: RestaurantIntelligence) => void;
  onSkip: () => void;
}

const RestaurantSearch: React.FC<RestaurantSearchProps> = ({ onRestaurantSelected, onSkip }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(true);
    try {
      const results = await placesAPI.searchRestaurants(searchQuery);
      setSearchResults(results.slice(0, 5)); // Limit to top 5 results
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Auto-search on input change with debouncing
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleRestaurantSelect = async (place: PlaceSearchResult) => {
    setSelectedPlaceId(place.place_id);
    setIsLoadingDetails(true);
    setShowSuggestions(false);
    setSearchQuery(place.name);
    
    try {
      const intelligence = await placesAPI.getRestaurantIntelligenceWithKeywords(place.place_id);
      onRestaurantSelected(intelligence);
    } catch (error) {
      console.error('Failed to get restaurant intelligence:', error);
    } finally {
      setIsLoadingDetails(false);
      setSelectedPlaceId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && searchResults[focusedIndex]) {
        handleRestaurantSelect(searchResults[focusedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Background Animation + Decorative Blobs */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(255,255,255,0.08) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: '-120px',
        right: '-120px',
        width: '360px',
        height: '360px',
        background: 'conic-gradient(from 180deg at 50% 50%, rgba(139,156,244,0.55), rgba(169,127,196,0.55), rgba(16,185,129,0.15))',
        filter: 'blur(60px)',
        opacity: 0.8,
        borderRadius: '50%'
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute',
        bottom: '-140px',
        left: '-140px',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(closest-side, rgba(2,132,199,0.35), rgba(2,132,199,0))',
        filter: 'blur(50px)',
        opacity: 0.9,
        borderRadius: '50%'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '60px 20px',
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Progress */}
        <div style={{ maxWidth: '820px', margin: '0 auto 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>Step 1 of 3</span>
            <span style={{ fontSize: '0.9rem' }}>Find your restaurant</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 9999, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: '33%', height: '100%', background: 'linear-gradient(90deg, #8b9cf4, #a97fc4)', borderRadius: 9999 }} />
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50px',
            padding: '10px 18px',
            marginBottom: '30px',
            fontSize: '12px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.9)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            🎯 AI-Powered Restaurant Intelligence
          </div>
          
          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: '900',
            backgroundImage: 'linear-gradient(90deg, #ffffff, #e9e7ff)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '12px',
            textShadow: '0 4px 30px rgba(0,0,0,0.15)',
            lineHeight: '1.08',
            letterSpacing: '-0.02em'
          }}>
            Restaurant Revenue Forecast
          </h1>
          
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '8px',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Instantly unlock personalized revenue insights with real-time data analysis
          </p>
          <p style={{
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            Start by searching name or address below
          </p>
        </div>

        {/* Search Card */
        }
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          marginBottom: '32px',
          position: 'relative'
        }}>
          {/* Search Input Section */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <label htmlFor="restaurant-search" style={{
              display: 'block',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#6b7280',
              margin: '0 auto 8px',
              maxWidth: '600px'
            }}>
              Restaurant name or address
            </label>
            <div style={{
              position: 'relative',
              maxWidth: '600px',
              margin: '0 auto'
            }}
              role="combobox"
              aria-expanded={(showSuggestions && searchResults.length > 0).toString()}
              aria-owns="restaurant-suggestions"
              aria-haspopup="listbox"
            >
              {/* Search Icon */}
              <div style={{
                position: 'absolute',
                left: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '20px',
                color: '#8b9cf4',
                zIndex: 2
              }}>
                🔍
              </div>
              
              <input
                id="restaurant-search"
                type="text"
                placeholder="Type your restaurant name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={(e) => {
                  setShowSuggestions(searchResults.length > 0);
                  e.target.style.borderColor = '#8b9cf4';
                  e.target.style.boxShadow = '0 8px 30px rgba(139,156,244,0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                aria-autocomplete="list"
                aria-controls="restaurant-suggestions"
                aria-activedescendant={focusedIndex >= 0 ? `suggestion-${focusedIndex}` : undefined}
                style={{
                  width: '100%',
                  padding: '24px 24px 24px 60px',
                  fontSize: '1.2rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontWeight: '500'
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    e.target.style.transform = 'translateY(0)';
                  }, 200);
                }}
              />
              
              {/* Loading indicator in input */}
              {isSearching && (
                <div style={{
                  position: 'absolute',
                  right: '24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #8b9cf4',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
            </div>

            {/* Skip button only */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
              <button
                onClick={onSkip}
                style={{
                  background: '#f9fafb',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  padding: '10px 16px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eef2ff';
                  e.currentTarget.style.borderColor = '#c7d2fe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                🚀 Skip & Enter Data Manually
              </button>
            </div>

            {/* Suggestions Dropdown (inline so it doesn't overlay Skip) */}
            {showSuggestions && (
              <div style={{
                position: 'static',
                width: '100%',
                maxWidth: '600px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                border: '1px solid #e5e7eb',
                margin: '8px auto 0',
                zIndex: 1,
                overflow: 'hidden'
              }}
                id="restaurant-suggestions"
                role="listbox"
                aria-label="Search suggestions"
              >
                <div style={{
                  padding: '16px 20px 8px',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Select Your Restaurant
                </div>
                {searchResults.length === 0 && !isSearching && (
                  <div style={{ padding: '20px', color: '#6b7280' }}>
                    No matches found. Try a different name or add the city.
                  </div>
                )}
                {searchResults.map((place, index) => (
                  <div
                    key={place.place_id}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={focusedIndex === index}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleRestaurantSelect(place)}
                    style={{
                      padding: '20px',
                      cursor: isLoadingDetails ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      background: focusedIndex === index ? '#f8fafc' : 
                                selectedPlaceId === place.place_id ? '#f0f9ff' : 'white',
                      borderLeft: focusedIndex === index ? '4px solid #8b9cf4' : '4px solid transparent',
                      opacity: isLoadingDetails && selectedPlaceId !== place.place_id ? 0.5 : 1,
                      borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    onMouseLeave={() => setFocusedIndex(-1)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Restaurant Icon */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0
                      }}>
                        🍽️
                      </div>
                      
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#1f2937',
                          margin: '0 0 6px 0'
                        }}>
                          {place.name}
                        </h4>
                        <p style={{
                          fontSize: '0.95rem',
                          color: '#6b7280',
                          margin: '0 0 8px 0',
                          lineHeight: '1.4'
                        }}>
                          📍 {place.formatted_address}
                        </p>
                        
                        {place.rating && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.9rem'
                          }}>
                            <span style={{
                              background: '#fef3c7',
                              color: '#d97706',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}>
                              ⭐ {place.rating}
                            </span>
                            {place.user_ratings_total && (
                              <span style={{ color: '#9ca3af' }}>
                                {place.user_ratings_total.toLocaleString()} reviews
                              </span>
                            )}
                            {place.price_level && (
                              <span style={{
                                background: '#d1fae5',
                                color: '#065f46',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: '600'
                              }}>
                                {'$'.repeat(place.price_level)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Loading/Arrow */}
                      {selectedPlaceId === place.place_id && isLoadingDetails ? (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          border: '3px solid #f3f3f3',
                          borderTop: '3px solid #8b9cf4',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      ) : (
                        <div style={{
                          color: '#d1d5db',
                          fontSize: '20px',
                          transition: 'transform 0.2s ease',
                          transform: focusedIndex === index ? 'translateX(4px)' : 'translateX(0)'
                        }}>
                          →
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Helper Text */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            color: '#6b7280',
            fontSize: '0.9rem',
            marginTop: '24px'
          }}>
            <span>💡 Start typing to see suggestions</span>
            <span>•</span>
            <span>⌨️ Use ↑↓ arrows to navigate</span>
            <span>•</span>
            <span>⏎ Press Enter to select</span>
          </div>
          {/* Attribution */}
          <div style={{
            textAlign: 'center',
            marginTop: '16px',
            color: '#9ca3af',
            fontSize: '0.8rem'
          }}>
            Powered by Google Places
          </div>
        </div>

        {/* Value + Live Preview */}
        <div className="rs-two-col" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 16,
          marginTop: 8
        }}>
          {/* What you get (bento) */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.14))',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 16,
            padding: '18px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            color: 'white',
            alignItems: 'center',
            minHeight: 96
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📈</span>
              <div>
                <div style={{ fontWeight: 800, lineHeight: 1 }}>Revenue Uplift</div>
                <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Channel-by-channel forecast</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔎</span>
              <div>
                <div style={{ fontWeight: 800, lineHeight: 1 }}>Social Snapshot</div>
                <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Auto-detected profiles</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🧭</span>
              <div>
                <div style={{ fontWeight: 800, lineHeight: 1 }}>SEO Impact</div>
                <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Local + organic lift</div>
              </div>
            </div>
          </div>

          
        </div>

      </div>

      {/* Animations + Responsive */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(120deg); }
          66% { transform: translateY(-20px) rotate(240deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @media (max-width: 640px) {
          h1 { font-size: 2rem !important; }
        }
      `}</style>
    </div>
  );
};

export default RestaurantSearch;
