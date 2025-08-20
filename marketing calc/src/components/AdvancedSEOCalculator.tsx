import React, { useState, useEffect } from 'react';
import { KeywordData, channelROICalculators } from '../data/restaurantStats';

interface AdvancedSEOCalculatorProps {
  avgTicket: number;
  onROICalculated: (roi: number, breakdown: any) => void;
}

// Sample keyword data based on typical restaurant SEO scans
const sampleKeywords: KeywordData[] = [
  { keyword: "restaurants near me", monthlySearchVolume: 8200, currentPosition: 5, difficulty: 'Hard', intent: 'High' },
  { keyword: "best italian restaurant [city]", monthlySearchVolume: 2100, currentPosition: 8, difficulty: 'Medium', intent: 'High' },
  { keyword: "[restaurant name]", monthlySearchVolume: 1200, currentPosition: 1, difficulty: 'Easy', intent: 'High' },
  { keyword: "pizza delivery [city]", monthlySearchVolume: 3400, currentPosition: 12, difficulty: 'Medium', intent: 'High' },
  { keyword: "fine dining [city]", monthlySearchVolume: 900, currentPosition: 15, difficulty: 'Hard', intent: 'Medium' },
  { keyword: "brunch near me", monthlySearchVolume: 1800, currentPosition: 7, difficulty: 'Medium', intent: 'High' },
  { keyword: "[city] restaurants", monthlySearchVolume: 2800, currentPosition: 9, difficulty: 'Hard', intent: 'Medium' },
  { keyword: "takeout [city]", monthlySearchVolume: 1500, currentPosition: 11, difficulty: 'Medium', intent: 'High' },
  { keyword: "happy hour [city]", monthlySearchVolume: 800, currentPosition: 6, difficulty: 'Easy', intent: 'Medium' },
  { keyword: "outdoor dining [city]", monthlySearchVolume: 600, currentPosition: 13, difficulty: 'Medium', intent: 'Medium' },
  { keyword: "romantic restaurant [city]", monthlySearchVolume: 700, currentPosition: 14, difficulty: 'Medium', intent: 'Medium' },
  { keyword: "family restaurant [city]", monthlySearchVolume: 1100, currentPosition: 10, difficulty: 'Medium', intent: 'Medium' },
  { keyword: "food delivery [city]", monthlySearchVolume: 2200, currentPosition: 16, difficulty: 'Hard', intent: 'High' },
  { keyword: "restaurant reservations [city]", monthlySearchVolume: 900, currentPosition: 8, difficulty: 'Medium', intent: 'High' },
  { keyword: "[cuisine type] restaurant [city]", monthlySearchVolume: 1300, currentPosition: 7, difficulty: 'Medium', intent: 'High' },
  { keyword: "catering [city]", monthlySearchVolume: 800, currentPosition: 12, difficulty: 'Easy', intent: 'Medium' }
];

const AdvancedSEOCalculator: React.FC<AdvancedSEOCalculatorProps> = ({ avgTicket, onROICalculated }) => {
  const [keywords, setKeywords] = useState<KeywordData[]>(sampleKeywords);
  const [showDetailed, setShowDetailed] = useState(false);
  const [seoResults, setSeoResults] = useState<any>(null);

  useEffect(() => {
    const results = channelROICalculators.calculateAdvancedSEOROI(keywords, avgTicket);
    setSeoResults(results);
    onROICalculated(results.totalGap, results);
  }, [keywords, avgTicket, onROICalculated]);

  const updateKeyword = (index: number, field: keyof KeywordData, value: any) => {
    const newKeywords = [...keywords];
    newKeywords[index] = { ...newKeywords[index], [field]: value };
    setKeywords(newKeywords);
  };

  if (!seoResults) return null;

  const topOpportunities = seoResults.keywordBreakdown.slice(0, 5);

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h3 style={{
          fontSize: '1.6rem',
          fontWeight: '700',
          color: '#333',
          margin: '0'
        }}>
          SEO Keyword Analysis
        </h3>
        
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          style={{
            background: showDetailed ? '#8b9cf4' : 'transparent',
            color: showDetailed ? 'white' : '#8b9cf4',
            border: '2px solid #8b9cf4',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {showDetailed ? 'Hide Details' : 'Show All Keywords'}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Total Keywords Tracked</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>{keywords.length}</div>
        </div>
        
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Current Monthly Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
            ${Math.round(seoResults.currentRevenue).toLocaleString()}
          </div>
        </div>
        
        <div style={{
          background: '#e8f5e8',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Potential Monthly Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4CAF50' }}>
            ${Math.round(seoResults.potentialRevenue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
          Top 5 Revenue Opportunities
        </h4>
        
        {topOpportunities.map((kw: any, index: number) => (
          <div key={kw.keyword} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 100px 80px 120px 120px',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: index < topOpportunities.length - 1 ? '1px solid #f0f0f0' : 'none',
            fontSize: '14px'
          }}>
            <div>
              <div style={{ fontWeight: '600', color: '#333' }}>{kw.keyword}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {kw.searchVolume.toLocaleString()} searches/month
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <span style={{
                background: kw.currentPosition <= 3 ? '#4CAF50' : kw.currentPosition <= 10 ? '#FF9800' : '#f44336',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                #{kw.currentPosition}
              </span>
            </div>
            
            <div style={{ textAlign: 'center', color: '#666' }}>
              → #{kw.targetPosition}
            </div>
            
            <div style={{ textAlign: 'right', fontSize: '13px' }}>
              <div style={{ color: '#666' }}>${Math.round(kw.currentRevenue).toLocaleString()}</div>
              <div style={{ color: '#4CAF50', fontWeight: '600' }}>
                ${Math.round(kw.potentialRevenue).toLocaleString()}
              </div>
            </div>
            
            <div style={{ textAlign: 'right', fontWeight: '700', color: '#8b9cf4' }}>
              +${Math.round(kw.gap).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Keyword Table */}
      {showDetailed && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '15px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
            All Keywords (Editable)
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 120px 80px 100px 80px 120px',
            gap: '10px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#666',
            marginBottom: '10px',
            paddingBottom: '10px',
            borderBottom: '2px solid #e1e5e9'
          }}>
            <div>Keyword</div>
            <div>Search Volume</div>
            <div>Position</div>
            <div>Difficulty</div>
            <div>Intent</div>
            <div>Monthly Gap</div>
          </div>

          {keywords.map((keyword, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 120px 80px 100px 80px 120px',
              gap: '10px',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #e1e5e9',
              fontSize: '13px'
            }}>
              <input
                value={keyword.keyword}
                onChange={(e) => updateKeyword(index, 'keyword', e.target.value)}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              
              <input
                type="number"
                value={keyword.monthlySearchVolume}
                onChange={(e) => updateKeyword(index, 'monthlySearchVolume', Number(e.target.value))}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              
              <input
                type="number"
                value={keyword.currentPosition}
                onChange={(e) => updateKeyword(index, 'currentPosition', Number(e.target.value))}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              
              <select
                value={keyword.difficulty}
                onChange={(e) => updateKeyword(index, 'difficulty', e.target.value)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              
              <select
                value={keyword.intent}
                onChange={(e) => updateKeyword(index, 'intent', e.target.value)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="High">High</option>
                <option value="Medium">Med</option>
                <option value="Low">Low</option>
              </select>
              
              <div style={{ fontWeight: '600', color: '#8b9cf4' }}>
                +${Math.round(seoResults.keywordBreakdown.find((kw: any) => kw.keyword === keyword.keyword)?.gap || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '15px',
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>
          Total SEO Revenue Opportunity
        </h4>
        <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '5px' }}>
          +${Math.round(seoResults.totalGap).toLocaleString()}/month
        </div>
        <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          ${Math.round(seoResults.totalGap * 12).toLocaleString()}/year
        </div>
      </div>
    </div>
  );
};

export default AdvancedSEOCalculator;