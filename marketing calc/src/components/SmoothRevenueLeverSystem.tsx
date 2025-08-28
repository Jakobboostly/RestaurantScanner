import React, { useState, useEffect, useMemo, useRef } from 'react';
import { channelROICalculators } from '../data/restaurantStats';
import { calculateUnifiedRevenue, RevenueCalculationInputs } from '../services/revenueCalculations';
import { useCountUp } from '../hooks/useCountUp';
import { gsap } from 'gsap';
import { useSimpleAudio } from '../utils/SimpleAudio';

interface LeverData {
  id: string;
  name: string;
  isActive: boolean;
  currentRevenue: number;
  potentialRevenue: number;
  color: string;
  icon: string;
  methodology: string;
  dataSource: string;
}

interface SmoothRevenueLeverSystemProps {
  monthlyRevenue: number;
  avgTicket: number;
  monthlyTransactions: number;
  restaurantData?: RevenueCalculationInputs;
  onLeverChange?: (leverId: string, isActive: boolean, impact: number) => void;
}

const SmoothRevenueLeverSystem: React.FC<SmoothRevenueLeverSystemProps> = ({
  monthlyRevenue,
  avgTicket,
  monthlyTransactions,
  restaurantData,
  onLeverChange
}) => {
  const [showMethodology, setShowMethodology] = useState<string | null>(null);
  const [leverStates, setLeverStates] = useState<{[key: string]: boolean}>({});
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Refs for smooth animations
  const leverRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const cardRefs = useRef<HTMLDivElement[]>([]);
  
  // Audio integration
  const { 
    initializeAudio, 
    playToggle, 
    playClick, 
    playSuccess, 
    playHover,
    setEnabled: setAudioEnabledInManager 
  } = useSimpleAudio();

  const leverCalculations = useMemo(() => {
    let seoCurrentRevenue, seoPotentialRevenue, socialCurrentRevenue, socialPotentialRevenue, smsCurrentRevenue, smsPotentialRevenue;
    
    if (restaurantData) {
      const unifiedCalcs = calculateUnifiedRevenue(restaurantData);
      
      seoCurrentRevenue = unifiedCalcs.seo.currentRevenue;
      seoPotentialRevenue = unifiedCalcs.seo.potentialRevenue;
      
      socialCurrentRevenue = unifiedCalcs.social.currentRevenue;
      socialPotentialRevenue = unifiedCalcs.social.potentialRevenue;
      
      smsCurrentRevenue = unifiedCalcs.sms.currentRevenue;
      smsPotentialRevenue = unifiedCalcs.sms.potentialRevenue;
    } else {
      // Fallback calculations
      seoCurrentRevenue = monthlyRevenue * 0.1;
      seoPotentialRevenue = channelROICalculators.calculateSEOROI(monthlyTransactions * 2.5, 5, 1, avgTicket) + seoCurrentRevenue;
      
      socialCurrentRevenue = monthlyRevenue * 0.05;
      socialPotentialRevenue = socialCurrentRevenue + (monthlyTransactions * 0.15 * avgTicket);
      
      smsCurrentRevenue = 0;
      smsPotentialRevenue = channelROICalculators.calculateSMSROI(monthlyTransactions * 0.3, 4, avgTicket);
    }

    return [
      {
        id: 'seo',
        name: 'SEO & Local Search',
        isActive: false,
        currentRevenue: seoCurrentRevenue,
        potentialRevenue: seoPotentialRevenue,
        color: '#4CAF50',
        icon: '🔍',
        methodology: 'Based on Local Pack vs Organic search attribution (70%/30% split) and position-specific CTR.',
        dataSource: 'Google Local Search Study 2024, Local SEO Click-Through Rate Analysis'
      },
      {
        id: 'social',
        name: 'Social Media Marketing',
        isActive: false,
        currentRevenue: socialCurrentRevenue,
        potentialRevenue: socialPotentialRevenue,
        color: '#E91E63',
        icon: '📱',
        methodology: 'Calculated using realistic follower-to-customer conversion rates and engagement optimization.',
        dataSource: 'Restaurant Social Media Report 2024, Platform-specific engagement studies'
      },
      {
        id: 'sms',
        name: 'SMS Marketing',
        isActive: false,
        currentRevenue: smsCurrentRevenue,
        potentialRevenue: smsPotentialRevenue,
        color: '#2196F3',
        icon: '💬',
        methodology: 'Based on 98% SMS open rate, 19-20% click-through rate, and 25% conversion rate.',
        dataSource: 'SMS Marketing Benchmark Report, Mobile Marketing Association F&B data'
      }
    ];
  }, [monthlyRevenue, avgTicket, monthlyTransactions, restaurantData]);

  const levers = useMemo(() => 
    leverCalculations.map(lever => ({
      ...lever,
      isActive: leverStates[lever.id] ?? false
    })), 
    [leverCalculations, leverStates]
  );

  const toggleLever = (leverId: string) => {
    const lever = levers.find(l => l.id === leverId);
    if (!lever) return;
    
    const wasActive = lever.isActive;
    const willBeActive = !wasActive;
    const impact = lever.potentialRevenue - lever.currentRevenue;
    
    // Update state
    setLeverStates(prev => ({
      ...prev,
      [leverId]: willBeActive
    }));
    
    // Audio feedback
    if (audioEnabled) {
      playToggle(willBeActive);
      if (impact > 10000) {
        setTimeout(() => playSuccess(), 300);
      }
    }
    
    // Smooth animations
    const leverElement = leverRefs.current[leverId];
    if (leverElement) {
      // Lever animation
      gsap.to(leverElement.querySelector('.lever-handle'), {
        y: willBeActive ? -80 : 80,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
      
      // Track color change
      gsap.to(leverElement.querySelector('.lever-track'), {
        background: willBeActive 
          ? `linear-gradient(to top, ${lever.color}, ${lever.color}88)` 
          : '#e0e0e0',
        duration: 0.3,
        ease: "power2.out"
      });
      
      // Pulse effect
      gsap.fromTo(leverElement, 
        { scale: 1 },
        { 
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out",
          yoyo: true,
          repeat: 1
        }
      );
      
      // Card update animation
      cardRefs.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(card,
            { scale: 1 },
            {
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out",
              delay: index * 0.1,
              yoyo: true,
              repeat: 1
            }
          );
        }
      });
    }
    
    // Callback
    if (onLeverChange) {
      onLeverChange(leverId, willBeActive, impact);
    }
  };

  const calculateCurrentRevenue = (lever: LeverData) => {
    return lever.isActive ? lever.potentialRevenue : lever.currentRevenue;
  };

  const calculateMissingRevenue = (lever: LeverData) => {
    return lever.isActive ? 0 : (lever.potentialRevenue - lever.currentRevenue);
  };

  const totals = useMemo(() => {
    const totalCurrentRevenue = levers.reduce((sum, lever) => sum + calculateCurrentRevenue(lever), 0);
    const totalPotentialRevenue = levers.reduce((sum, lever) => sum + lever.potentialRevenue, 0);
    const totalMissing = totalPotentialRevenue - totalCurrentRevenue;
    
    return {
      current: totalCurrentRevenue,
      potential: totalPotentialRevenue,
      missing: totalMissing
    };
  }, [levers]);

  // Smooth animated values
  const animatedCurrentRevenue = useCountUp(totals.current, { duration: 1000 });
  const animatedPotentialRevenue = useCountUp(totals.potential, { duration: 1000 });
  const animatedMissingRevenue = useCountUp(totals.missing, { duration: 1000 });

  const AnimatedNumber: React.FC<{ 
    value: number; 
    lever: LeverData; 
    type: 'current' | 'missing' | 'potential' 
  }> = ({ lever, type }) => {
    const targetValue = type === 'current' ? calculateCurrentRevenue(lever) : 
                      type === 'missing' ? calculateMissingRevenue(lever) : 
                      lever.potentialRevenue;
    const animatedValue = useCountUp(targetValue, { duration: 800 });
    return <>{Math.round(animatedValue).toLocaleString()}</>;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '30px',
      padding: '50px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div></div> {/* Spacer */}
          
          <div>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1a1a1a',
              margin: '0'
            }}>
              Interactive Revenue Levers
            </h2>
          </div>
          
          <button
            onClick={() => {
              const newAudioState = !audioEnabled;
              setAudioEnabled(newAudioState);
              setAudioEnabledInManager(newAudioState);
              
              if (newAudioState) {
                initializeAudio();
                setTimeout(() => playClick(), 100);
              }
            }}
            style={{
              background: audioEnabled ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={() => audioEnabled && playHover()}
          >
            {audioEnabled ? '🔊' : '🔇'} Audio
          </button>
        </div>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#666',
          marginBottom: '30px'
        }}>
          Toggle services to see real-time revenue impact with smooth animations
        </p>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
          <div 
            ref={el => cardRefs.current[0] = el!}
            style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #dee2e6',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Current Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#333' }}>
              ${Math.round(animatedCurrentRevenue).toLocaleString()}
            </div>
          </div>

          <div 
            ref={el => cardRefs.current[1] = el!}
            style={{
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #ffc107'
            }}
          >
            <div style={{ fontSize: '14px', color: '#856404', marginBottom: '5px' }}>Missing Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#856404' }}>
              ${Math.round(animatedMissingRevenue).toLocaleString()}
            </div>
          </div>

          <div 
            ref={el => cardRefs.current[2] = el!}
            style={{
              background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #28a745'
            }}
          >
            <div style={{ fontSize: '14px', color: '#155724', marginBottom: '5px' }}>Full Potential</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#155724' }}>
              ${Math.round(animatedPotentialRevenue).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Levers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' }}>
        {levers.map((lever) => (
          <div 
            key={lever.id} 
            ref={el => leverRefs.current[lever.id] = el}
            style={{ 
              textAlign: 'center', 
              position: 'relative'
            }}
          >
            {/* Lever Name */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '2rem', marginRight: '10px' }}>{lever.icon}</span>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#333',
                margin: '0'
              }}>
                {lever.name}
              </h3>
              <div
                style={{
                  marginLeft: '10px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#666',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setShowMethodology(showMethodology === lever.id ? null : lever.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = lever.color;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.color = '#666';
                }}
              >
                ?
              </div>
            </div>

            {/* Smooth Lever Switch */}
            <div 
              style={{
                position: 'relative',
                width: '60px',
                height: '160px',
                background: '#f0f0f0',
                borderRadius: '30px',
                margin: '0 auto 20px auto',
                cursor: 'pointer',
                border: '3px solid #ddd',
                overflow: 'hidden'
              }}
              onClick={() => toggleLever(lever.id)}
            >
              {/* Lever Track */}
              <div 
                className="lever-track"
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  width: 'calc(100% - 12px)',
                  height: 'calc(100% - 12px)',
                  background: lever.isActive 
                    ? `linear-gradient(to top, ${lever.color}, ${lever.color}88)` 
                    : '#e0e0e0',
                  borderRadius: '24px',
                  transition: 'background 0.3s ease'
                }} 
              />

              {/* Lever Handle */}
              <div 
                className="lever-handle"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, ${lever.isActive ? '-130%' : '30%'})`,
                  width: '50px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '20px',
                  border: `3px solid ${lever.isActive ? lever.color : '#999'}`,
                  boxShadow: lever.isActive 
                    ? `0 4px 15px ${lever.color}40` 
                    : '0 4px 15px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '800',
                  color: lever.isActive ? lever.color : '#999',
                  zIndex: 2
                }}
              >
                {lever.isActive ? 'ON' : 'OFF'}
              </div>
            </div>

            {/* Status Display */}
            <div style={{
              textAlign: 'center',
              marginBottom: '15px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: lever.isActive ? lever.color : '#999',
                padding: '8px 16px',
                background: lever.isActive ? `${lever.color}20` : '#f5f5f5',
                borderRadius: '20px',
                border: `2px solid ${lever.isActive ? lever.color : '#ddd'}`,
                transition: 'all 0.3s ease'
              }}>
                {lever.isActive ? '✓ ACTIVE' : '○ INACTIVE'}
              </div>
            </div>

            {/* Revenue Display */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '15px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px' }}>Current</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#333' }}>
                  $<AnimatedNumber value={calculateCurrentRevenue(lever)} lever={lever} type="current" />
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#856404', marginBottom: '3px' }}>Missing</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#856404' }}>
                  $<AnimatedNumber value={calculateMissingRevenue(lever)} lever={lever} type="missing" />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#155724', marginBottom: '3px' }}>Potential</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#155724' }}>
                  $<AnimatedNumber value={lever.potentialRevenue} lever={lever} type="potential" />
                </div>
              </div>
            </div>

            {/* Methodology Popup */}
            {showMethodology === lever.id && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '350px',
                background: 'white',
                border: `3px solid ${lever.color}`,
                borderRadius: '15px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                zIndex: 1000,
                marginTop: '10px',
                animation: 'fadeInUp 0.3s ease-out'
              }}>
                <h4 style={{
                  margin: '0 0 15px 0',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: lever.color
                }}>
                  How We Calculate This
                </h4>
                <p style={{
                  margin: '0 0 15px 0',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: '#333'
                }}>
                  {lever.methodology}
                </p>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  fontStyle: 'italic',
                  borderTop: '1px solid #f0f0f0',
                  paddingTop: '10px'
                }}>
                  <strong>Data Sources:</strong> {lever.dataSource}
                </div>
                <button
                  onClick={() => setShowMethodology(null)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '15px',
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    color: '#999',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        borderRadius: '15px',
        color: 'white'
      }}>
        <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>
          💡 Click levers to see smooth animations and real-time revenue calculations
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SmoothRevenueLeverSystem;