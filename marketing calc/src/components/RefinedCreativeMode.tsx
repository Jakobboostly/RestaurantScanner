import React, { useState, useEffect } from 'react';
import EnhancedFloatingBubbles from './EnhancedFloatingBubbles';
import SmoothRevenueLeverSystem from './SmoothRevenueLeverSystem';
import ThreeJSRevenueChart from './ThreeJSRevenueChart';
import { gsap } from 'gsap';

interface RefinedCreativeModeProps {
  restaurantData: {
    placeName?: string;
    monthlyRevenue: number;
    avgTicket: number;
    monthlyTransactions: number;
  };
  onExit?: () => void;
}

const RefinedCreativeMode: React.FC<RefinedCreativeModeProps> = ({ 
  restaurantData, 
  onExit 
}) => {
  const [currentView, setCurrentView] = useState<'intro' | 'charts' | 'levers'>('intro');
  const [showTransition, setShowTransition] = useState(false);

  // Sample data for demonstrations
  const channelData = [
    { channel: 'SEO & Local', revenue: 18000, color: '#4CAF50' },
    { channel: 'Social Media', revenue: 12000, color: '#E91E63' },
    { channel: 'SMS Marketing', revenue: 15000, color: '#2196F3' },
    { channel: 'Direct Traffic', revenue: 8000, color: '#FF9800' }
  ];

  const navigateToView = (view: 'intro' | 'charts' | 'levers') => {
    setShowTransition(true);
    
    setTimeout(() => {
      setCurrentView(view);
      setShowTransition(false);
    }, 300);
  };

  useEffect(() => {
    // Entrance animation
    gsap.from('.creative-content', {
      opacity: 0,
      y: 50,
      duration: 0.8,
      ease: "power3.out"
    });
  }, [currentView]);

  const renderIntroView = () => (
    <div style={{ 
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <EnhancedFloatingBubbles revenueMultiplier={restaurantData.monthlyRevenue / 50000} />
      
      <div className="creative-content" style={{
        textAlign: 'center',
        color: 'white',
        zIndex: 10,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        padding: '60px',
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.2)',
        maxWidth: '700px'
      }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: '800', 
          marginBottom: '20px',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          {restaurantData.placeName || 'Your Restaurant'}
        </h1>
        
        <h2 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '300', 
          marginBottom: '30px',
          opacity: 0.9
        }}>
          Enhanced Marketing Analytics
        </h2>
        
        <p style={{ 
          fontSize: '1.1rem', 
          lineHeight: '1.6',
          marginBottom: '40px',
          opacity: 0.8
        }}>
          Experience your restaurant's revenue potential through interactive visualizations, 
          smooth animations, and immersive data storytelling.
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '15px 25px',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.3)',
            fontSize: '1rem'
          }}>
            💰 ${restaurantData.monthlyRevenue.toLocaleString()}/mo
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '15px 25px',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.3)',
            fontSize: '1rem'
          }}>
            🎯 ${restaurantData.avgTicket} avg ticket
          </div>
        </div>
      </div>
    </div>
  );

  const renderChartsView = () => (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '40px 20px'
    }}>
      <div className="creative-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#333',
            marginBottom: '15px'
          }}>
            3D Revenue Visualization
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            marginBottom: '30px'
          }}>
            Interactive Three.js charts with smooth animations and hover effects
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <ThreeJSRevenueChart 
            channels={channelData}
            width={800}
            height={500}
            autoRotate={true}
          />
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '40px'
        }}>
          {channelData.map((channel, index) => (
            <div key={channel.channel} style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              textAlign: 'center',
              border: `3px solid ${channel.color}20`,
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3 });
            }}
            onMouseLeave={(e) => {
              gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
            }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: channel.color,
                borderRadius: '50%',
                margin: '0 auto 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                {index === 0 ? '🔍' : index === 1 ? '📱' : index === 2 ? '💬' : '🌐'}
              </div>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{channel.channel}</h4>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: channel.color }}>
                ${channel.revenue.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLeversView = () => (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
      padding: '40px 20px'
    }}>
      <div className="creative-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '40px'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '15px'
          }}>
            Interactive Revenue Levers
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            opacity: 0.9,
            marginBottom: '30px'
          }}>
            Experience smooth GSAP animations and real-time calculations
          </p>
        </div>
        
        <SmoothRevenueLeverSystem
          monthlyRevenue={restaurantData.monthlyRevenue}
          avgTicket={restaurantData.avgTicket}
          monthlyTransactions={restaurantData.monthlyTransactions}
          onLeverChange={(leverId, isActive, impact) => {
            console.log(`${leverId} ${isActive ? 'activated' : 'deactivated'}: $${impact} impact`);
          }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Transition overlay */}
      {showTransition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Transitioning...
          </div>
        </div>
      )}

      {/* Content */}
      {currentView === 'intro' && renderIntroView()}
      {currentView === 'charts' && renderChartsView()}
      {currentView === 'levers' && renderLeversView()}

      {/* Navigation */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '50px',
        padding: '10px 20px',
        display: 'flex',
        gap: '10px',
        zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {(['intro', 'charts', 'levers'] as const).map((view, index) => (
          <button
            key={view}
            onClick={() => navigateToView(view)}
            style={{
              background: currentView === view ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            {index + 1}. {view === 'intro' ? 'Intro' : view === 'charts' ? '3D Charts' : 'Levers'}
          </button>
        ))}
        
        {onExit && (
          <button
            onClick={onExit}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '10px'
            }}
          >
            Exit
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 1000
      }}>
        {(['intro', 'charts', 'levers'] as const).map((view) => (
          <div
            key={view}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: currentView === view ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => navigateToView(view)}
          />
        ))}
      </div>
    </div>
  );
};

export default RefinedCreativeMode;