import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  position: number;
  title: string;
  url: string;
  domain: string;
  description: string;
}

interface KeywordSearchResponse {
  keyword: string;
  location: string;
  results: SearchResult[];
  searchVolume: number;
  difficulty: number;
  competition: number;
  timestamp: string;
}

interface KeywordSearchToolProps {
  defaultLocation?: string;
  city?: string;
  state?: string;
}

// Helper function to format location for DataForSEO (no spaces after commas)
const formatLocation = (location: string): string => {
  return location.replace(/,\s+/g, ',');
};

// Helper function to classify search volume levels
const getVolumeLevel = (volume: number): { text: string; color: string } => {
  if (volume >= 10000) return { text: 'High', color: 'text-green-400' };
  if (volume >= 1000) return { text: 'Medium', color: 'text-yellow-400' };
  if (volume >= 100) return { text: 'Low', color: 'text-orange-400' };
  return { text: 'Very Low', color: 'text-red-400' };
};

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function KeywordSearchTool({ defaultLocation = 'United States', city, state }: KeywordSearchToolProps) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<KeywordSearchResponse | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('Please enter a keyword to search');
      return;
    }

    setIsSearching(true);
    setError('');
    
    try {
      const response = await fetch('/api/keyword-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: formatLocation(location.trim() || 'United States'),
          city: city?.trim(),
          state: state?.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: KeywordSearchResponse = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-[#5F5FFF]/30 border-2 border-yellow-300 rounded-lg p-4 mb-3 backdrop-blur-sm">
      <div className="text-white font-black text-xl mb-3 drop-shadow-lg text-center">
        🔍 Keyword Ranking Search Tool
      </div>
      
      {/* Search Form */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter keyword to search..."
            className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Location (e.g., Las Vegas, Nevada)"
            className="w-48 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
          />
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isSearching || !keyword.trim()}
          className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search Top 5 Rankings
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-400 text-red-200 px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search Volume Data */}
      {searchResults && (
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <div className="text-yellow-200 text-sm font-bold mb-2">
            Keyword Analysis for "{searchResults.keyword}":
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="text-white font-bold text-lg">
                {formatNumber(searchResults.searchVolume || 0)}
              </div>
              <div className={`${getVolumeLevel(searchResults.searchVolume || 0).color} font-medium`}>
                {getVolumeLevel(searchResults.searchVolume || 0).text} Volume
              </div>
              <div className="text-gray-300">monthly searches</div>
            </div>
            
            <div className="text-center">
              <div className="text-white font-bold text-lg">
                {searchResults.difficulty || 0}%
              </div>
              <div className="text-purple-300 font-medium">Difficulty</div>
              <div className="text-gray-300">to rank</div>
            </div>
            
            <div className="text-center">
              <div className="text-white font-bold text-lg">
                {Math.round((searchResults.competition || 0) * 100)}%
              </div>
              <div className="text-red-300 font-medium">Competition</div>
              <div className="text-gray-300">level</div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div>
          <div className="text-yellow-200 text-sm font-bold mb-2">
            Top 5 rankings for "{searchResults.keyword}" in {searchResults.location}:
          </div>
          
          <div className="space-y-1 text-left max-h-64 overflow-y-auto">
            {searchResults.results.length > 0 ? (
              searchResults.results.map((result, index) => (
                <div key={index} className="flex justify-between items-start text-xs bg-white/10 rounded px-2 py-2">
                  <div className="flex-1 pr-2">
                    <div className="text-white font-semibold truncate">
                      #{result.position} - {result.title}
                    </div>
                    <div className="text-yellow-200 text-xs truncate">
                      {result.domain}
                    </div>
                    {result.description && (
                      <div className="text-gray-300 text-xs mt-1 line-clamp-2">
                        {result.description.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  <span className="text-yellow-300 font-bold text-sm ml-2">
                    #{result.position}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-300 text-center py-4">
                No results found for "{searchResults.keyword}"
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 mt-2 text-center">
            Search completed at {new Date(searchResults.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}