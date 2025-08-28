import React, { useState, useEffect, useMemo, useRef } from 'react';
import { channelROICalculators } from '../data/restaurantStats';
import { calculateUnifiedRevenue, RevenueCalculationInputs } from '../services/revenueCalculations';
import { useCountUp } from '../hooks/useCountUp';
import { AnimationTimelines, AnimationManager } from '../creative/animations/GSAPTimelines';
import { AudioReactManager } from '../creative/audio/ToneManager';

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
  impactLevel: 'Low' | 'Medium' | 'High';
}

interface EnhancedRevenueLeverSystemProps {
  monthlyRevenue: number;
  avgTicket: number;
  monthlyTransactions: number;
  restaurantData?: RevenueCalculationInputs;
  onLeverChange?: (leverId: string, isActive: boolean, impact: number) => void;
}

const EnhancedRevenueLeverSystem: React.FC<EnhancedRevenueLeverSystemProps> = ({
  monthlyRevenue,
  avgTicket,
  monthlyTransactions,
  restaurantData,
  onLeverChange
}) => {
  const [showMethodology, setShowMethodology] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Refs for animation targets
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const leversRef = useRef<HTMLDivElement[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);
  
  // Audio manager
  const audioManager = useRef(new AudioReactManager());
  
  useEffect(() => {
    // Initialize audio on first user interaction
    const handleFirstInteraction = async () => {
      await audioManager.current.initialize();
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      audioManager.current.cleanup();
    };
  }, []);

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

    const getImpactLevel = (gap: number): 'Low' | 'Medium' | 'High' => {
      if (gap > 15000) return 'High';
      if (gap > 7500) return 'Medium';
      return 'Low';
    };

    return [
      {
        id: 'seo',
        name: 'SEO & Local Search',
        isActive: false,
        currentRevenue: seoCurrentRevenue,
        potentialRevenue: seoPotentialRevenue,
        color: '#4CAF50',
        icon: '🔍',
        methodology: 'Based on Local Pack vs Organic search attribution (70%/30% split) and position-specific CTR: Local Pack Position #1 (33% CTR), #2 (22% CTR), #3 (13% CTR). Organic Search Position #1 (18% CTR), #2 (7% CTR), #3 (3% CTR). Uses 5% website conversion rate and 2.5x search volume multiplier.',
        dataSource: 'Google Local Search Study 2024, Local SEO Click-Through Rate Analysis, Restaurant Industry Benchmarks',
        impactLevel: getImpactLevel(seoPotentialRevenue - seoCurrentRevenue)
      },
      {
        id: 'social',
        name: 'Social Media Marketing',
        isActive: false,
        currentRevenue: socialCurrentRevenue,
        potentialRevenue: socialPotentialRevenue,
        color: '#E91E63',
        icon: '📱',
        methodology: 'Calculated using realistic follower-to-customer conversion rates, with Instagram performing at 1.5% monthly conversion and Facebook at 0.5%. Accounts for posting frequency impact and content strategy optimization.',
        dataSource: 'Restaurant Social Media Report 2024, Platform-specific engagement studies, Food & Beverage industry analysis',
        impactLevel: getImpactLevel(socialPotentialRevenue - socialCurrentRevenue)
      },
      {
        id: 'sms',
        name: 'SMS Marketing',
        isActive: false,
        currentRevenue: smsCurrentRevenue,
        potentialRevenue: smsPotentialRevenue,
        color: '#2196F3',
        icon: '💬',
        methodology: 'Based on 98% SMS open rate (highest in F&B sector), 19-20% click-through rate, and 25% conversion rate. Assumes 30% of customers would opt-in to SMS marketing with 4 campaigns per month. 10x higher redemption vs other channels.',
        dataSource: 'SMS Marketing Benchmark Report, Mobile Marketing Association F&B data, Redemption rate studies',
        impactLevel: getImpactLevel(smsPotentialRevenue - smsCurrentRevenue)
      }
    ];
  }, [monthlyRevenue, avgTicket, monthlyTransactions, restaurantData]);

  const [leverStates, setLeverStates] = useState<{[key: string]: boolean}>({});
  
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
    
    // Enhanced animations with GSAP
    const leverElement = leversRef.current.find(el => el?.dataset.leverId === leverId);
    const connectedElements = cardsRef.current.filter(Boolean);
    
    if (leverElement) {
      const animation = AnimationTimelines.createLeverToggleAnimation(
        leverElement,
        connectedElements,
        willBeActive
      );
      AnimationManager.play(`lever-${leverId}`, animation);
      
      // Particle explosion effect at lever position
      const rect = leverElement.getBoundingClientRect();
      const containerRect = leverElement.parentElement?.getBoundingClientRect();
      if (containerRect) {
        const relativeX = rect.left - containerRect.left + rect.width / 2;
        const relativeY = rect.top - containerRect.top + rect.height / 2;
        
        const explosionAnimation = AnimationTimelines.createParticleExplosion(
          relativeX,
          relativeY,
          leverElement.parentElement!,
          willBeActive ? 30 : 15
        );
        AnimationManager.play(`explosion-${leverId}`, explosionAnimation);
      }
      
      // Cascade effect to other charts
      const cascadeAnimation = AnimationTimelines.createCascadeAnimation(
        leverElement,
        connectedElements,
        impact > 10000 ? 'explosion' : 'ripple'
      );
      AnimationManager.play(`cascade-${leverId}`, cascadeAnimation);
    }
    
    // Audio feedback
    if (audioEnabled) {
      audioManager.current.onLeverToggle(leverId, willBeActive, impact);
      
      // Special milestone sound for high impact
      if (impact > 15000 && willBeActive) {
        setTimeout(() => {
          audioManager.current.onMilestone(impact);
        }, 600);
      }
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

  // Animated values with enhanced easing
  const animatedCurrentRevenue = useCountUp(totals.current, { duration: 1500 });
  const animatedPotentialRevenue = useCountUp(totals.potential, { duration: 1500 });
  const animatedMissingRevenue = useCountUp(totals.missing, { duration: 1500 });

  // Demo mode - automatic sequence
  const startDemoMode = () => {
    setIsDemoMode(true);
    
    // Cinematic intro animation
    if (titleRef.current && summaryRef.current) {
      const elements = {
        title: titleRef.current,
        cards: cardsRef.current.filter(Boolean),
        charts: leversRef.current.filter(Boolean),
        summary: summaryRef.current
      };
      
      const introAnimation = AnimationTimelines.createRevenueRevealAnimation(elements);
      AnimationManager.play('demo-intro', introAnimation);
    }
    
    // Automated lever sequence
    let currentIndex = 0;
    const leverSequence = () => {
      if (currentIndex < levers.length && isDemoMode) {
        const lever = levers[currentIndex];
        toggleLever(lever.id);
        currentIndex++;
        setTimeout(leverSequence, 2000);
      } else {
        setIsDemoMode(false);
      }
    };
    
    setTimeout(leverSequence, 1000);
  };

  // Audio control with visual feedback
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    audioManager.current.setEnabled(!audioEnabled);
    
    if (!audioEnabled) {
      audioManager.current.onSuccess();
      // Start ambient sonification
      audioManager.current.onRevenueUpdate(monthlyRevenue, monthlyTransactions, levers);
    }
  };

  // Enhanced number animation component
  const AnimatedNumber: React.FC<{ 
    value: number; 
    lever: LeverData; 
    type: 'current' | 'missing' | 'potential';
    elementRef?: React.RefObject<HTMLDivElement>;
  }> = ({ value, lever, type, elementRef }) => {
    const targetValue = type === 'current' ? calculateCurrentRevenue(lever) : 
                      type === 'missing' ? calculateMissingRevenue(lever) : 
                      lever.potentialRevenue;
    const animatedValue = useCountUp(targetValue, { duration: 1500 });
    
    useEffect(() => {
      if (elementRef?.current) {
        const animation = AnimationTimelines.createNumberMorphAnimation(
          elementRef.current,
          value,
          targetValue,
          1.5
        );
        AnimationManager.play(`number-${lever.id}-${type}`, animation);
      }
    }, [targetValue]);
    
    return <>{Math.round(animatedValue).toLocaleString()}</>;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '30px',
      padding: '50px',
      boxShadow: '0 30px 80px rgba(0,0,0,0.15)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Enhanced Header with Controls */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={toggleAudio}
            style={{
              background: audioEnabled ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            🎵 {audioEnabled ? 'Audio ON' : 'Audio OFF'}
          </button>
          
          <button
            onClick={startDemoMode}
            disabled={isDemoMode}
            style={{
              background: isDemoMode ? '#ccc' : 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '25px',
              cursor: isDemoMode ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            {isDemoMode ? '🎬 Demo Running...' : '🎬 Start Demo Mode'}
          </button>
        </div>
        
        <div ref={titleRef}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '15px'
          }}>
            Flip the Switch. See the Impact.
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: '30px'
          }}>
            Experience the power of creative coding with interactive revenue levers
          </p>
        </div>

        {/* Enhanced Summary Cards */}
        <div 
          ref={summaryRef}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}
        >
          <div 
            ref={el => cardsRef.current[0] = el!}
            style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #dee2e6',
              transform: 'translateZ(0)', // Enable hardware acceleration
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Current Revenue</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#333' }}>
              ${Math.round(animatedCurrentRevenue).toLocaleString()}
            </div>
          </div>

          <div 
            ref={el => cardsRef.current[1] = el!}
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
            ref={el => cardsRef.current[2] = el!}
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

      {/* Enhanced Levers with Physics-Based Animation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' }}>
        {levers.map((lever, index) => (
          <div 
            key={lever.id} 
            ref={el => leversRef.current[index] = el!}
            data-lever-id={lever.id}
            style={{ 
              textAlign: 'center', 
              position: 'relative',
              transform: 'translateZ(0)' // Hardware acceleration
            }}
          >
            {/* Impact Level Indicator */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              background: lever.impactLevel === 'High' ? '#FF4444' : 
                         lever.impactLevel === 'Medium' ? '#FFA500' : '#4CAF50',
              color: 'white',
              fontSize: '10px',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: '600',
              zIndex: 10
            }}>
              {lever.impactLevel} Impact
            </div>
            
            {/* Lever Name with Enhanced Design */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <span style={{ 
                fontSize: '2rem', 
                marginRight: '10px',
                filter: lever.isActive ? 'drop-shadow(0 0 10px gold)' : 'none',
                transition: 'filter 0.3s ease'
              }}>
                {lever.icon}
              </span>
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

            {/* Enhanced Lever Switch with Particle Effects */}
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
                transition: 'all 0.3s ease',
                overflow: 'hidden'
              }}
              onClick={() => toggleLever(lever.id)}
            >
              {/* Lever Track with Glow Effect */}
              <div style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                width: 'calc(100% - 12px)',
                height: 'calc(100% - 12px)',
                background: lever.isActive 
                  ? `linear-gradient(to top, ${lever.color}, ${lever.color}dd)` 
                  : '#e0e0e0',
                borderRadius: '24px',
                transition: 'all 0.4s ease',
                boxShadow: lever.isActive 
                  ? `inset 0 0 20px ${lever.color}66, 0 0 30px ${lever.color}33` 
                  : 'none'
              }} />

              {/* Enhanced Lever Handle */}
              <div style={{
                position: 'absolute',
                top: lever.isActive ? '10px' : 'calc(100% - 50px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '70px',
                height: '40px',
                background: 'white',
                borderRadius: '20px',
                border: `3px solid ${lever.isActive ? lever.color : '#999'}`,
                boxShadow: lever.isActive 
                  ? `0 6px 15px ${lever.color}40, 0 0 20px ${lever.color}20` 
                  : '0 6px 15px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '800',
                color: lever.isActive ? lever.color : '#999',
                transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                zIndex: 2
              }}>
                {lever.isActive ? 'ON' : 'OFF'}
              </div>

              {/* Particle Trail Effect */}
              {lever.isActive && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  background: `radial-gradient(circle, ${lever.color}22 0%, transparent 70%)`,
                  borderRadius: '30px',
                  animation: 'pulse 2s ease-in-out infinite',
                  transform: 'translate(-50%, -50%)'
                }} />
              )}
            </div>

            {/* Enhanced Status Display */}
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
                transition: 'all 0.3s ease',
                textShadow: lever.isActive ? `0 0 10px ${lever.color}50` : 'none'
              }}>
                {lever.isActive ? '✓ WITH OUR SERVICE' : '✗ WITHOUT OUR SERVICE'}
              </div>
            </div>

            {/* Enhanced Revenue Display */}
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

            {/* Enhanced Methodology Popup */}
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
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                zIndex: 1000,
                marginTop: '10px',
                animation: 'modalSlideIn 0.3s ease-out'
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
                    cursor: 'pointer',
                    padding: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enhanced Instructions */}
      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        borderRadius: '15px',
        color: 'white'
      }}>
        <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>
          💡 Experience creative coding: Enhanced animations • Audio feedback • Physics-based interactions
        </p>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
          }
          
          @keyframes modalSlideIn {
            from { 
              opacity: 0; 
              transform: translateX(-50%) translateY(-20px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(-50%) translateY(0); 
            }
          }
          
          .lever-glow {
            filter: drop-shadow(0 0 20px currentColor);
          }
        `
      }} />
    </div>
  );
};

export default EnhancedRevenueLeverSystem;