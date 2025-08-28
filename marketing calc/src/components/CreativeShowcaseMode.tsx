import React, { useState, useEffect, useRef } from 'react';
import FloatingBubblesPhysics from './FloatingBubblesPhysics';
import RevenueGlobe from '../creative/three/RevenueGlobe';
import EnhancedRevenueLeverSystem from './EnhancedRevenueLeverSystem';
import { AnimationTimelines, AnimationManager } from '../creative/animations/GSAPTimelines';
import { AudioReactManager } from '../creative/audio/ToneManager';

interface CreativeShowcaseModeProps {
  restaurantData: {
    placeName?: string;
    monthlyRevenue: number;
    avgTicket: number;
    monthlyTransactions: number;
  };
  onExit?: () => void;
}

interface DemoScene {
  id: string;
  name: string;
  duration: number; // seconds
  component: React.ReactNode;
  description: string;
}

const CreativeShowcaseMode: React.FC<CreativeShowcaseModeProps> = ({ 
  restaurantData, 
  onExit 
}) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const audioManager = useRef(new AudioReactManager());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sample channel data for globe
  const channelData = [
    { channel: 'SEO & Local Search', revenue: 18000, percentage: 35, color: '#4CAF50' },
    { channel: 'Social Media Marketing', revenue: 12000, percentage: 23, color: '#E91E63' },
    { channel: 'SMS Marketing', revenue: 15000, percentage: 29, color: '#2196F3' },
    { channel: 'Direct/Walk-in', revenue: 6800, percentage: 13, color: '#FF9800' }
  ];

  const demoScenes: DemoScene[] = [
    {
      id: 'intro',
      name: 'Creative Introduction',
      duration: 8,
      component: (
        <div style={{ 
          position: 'relative',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <FloatingBubblesPhysics 
            monthlyRevenue={restaurantData.monthlyRevenue}
            onBubbleInteraction={(data) => {
              console.log('Bubble interaction:', data.title);
            }}
          />
          <div style={{
            textAlign: 'center',
            color: 'white',
            zIndex: 10,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            padding: '50px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h1 style={{ 
              fontSize: '4rem', 
              fontWeight: '800', 
              marginBottom: '20px',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              {restaurantData.placeName || 'Your Restaurant'}
            </h1>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: '300', 
              marginBottom: '30px',
              opacity: 0.9
            }}>
              Creative Marketing Analytics
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              maxWidth: '600px',
              lineHeight: '1.6',
              opacity: 0.8
            }}>
              Experience the fusion of data visualization, generative art, and interactive storytelling
            </p>
          </div>
        </div>
      ),
      description: 'Physics-based p5.js bubble visualization with industry insights'
    },
    {
      id: 'globe',
      name: '3D Revenue Attribution',
      duration: 12,
      component: (
        <div style={{ 
          height: '100vh',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '30px'
        }}>
          <div style={{
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '10px' }}>
              Revenue Attribution Globe
            </h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
              Three.js visualization with particle systems and real-time data flows
            </p>
          </div>
          
          <RevenueGlobe 
            channels={channelData}
            autoRotate={true}
            width={800}
            height={600}
            onChannelSelect={(channel) => {
              console.log('Channel selected:', channel);
              audioManager.current.onSuccess();
            }}
          />
          
          <div style={{
            color: 'white',
            textAlign: 'center',
            maxWidth: '800px',
            opacity: 0.7
          }}>
            <p>Watch revenue streams flow as glowing particles from marketing channels to your business core</p>
          </div>
        </div>
      ),
      description: 'Interactive 3D globe showing revenue attribution with particle effects'
    },
    {
      id: 'levers',
      name: 'Interactive Revenue Levers',
      duration: 15,
      component: (
        <div style={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
          padding: '40px 20px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              textAlign: 'center',
              color: 'white',
              marginBottom: '40px'
            }}>
              <h2 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '15px' }}>
                Enhanced Revenue Levers
              </h2>
              <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
                GSAP animations, Tone.js audio feedback, and particle effects
              </p>
            </div>
            
            <EnhancedRevenueLeverSystem
              monthlyRevenue={restaurantData.monthlyRevenue}
              avgTicket={restaurantData.avgTicket}
              monthlyTransactions={restaurantData.monthlyTransactions}
              onLeverChange={(leverId, isActive, impact) => {
                console.log(`Lever ${leverId} ${isActive ? 'activated' : 'deactivated'} with $${impact} impact`);
              }}
            />
          </div>
        </div>
      ),
      description: 'Physics-based lever interactions with cascade animations and audio feedback'
    },
    {
      id: 'finale',
      name: 'Creative Synthesis',
      duration: 10,
      component: (
        <div style={{ 
          position: 'relative',
          height: '100vh',
          background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Background particles */}
          <FloatingBubblesPhysics 
            monthlyRevenue={restaurantData.monthlyRevenue}
          />
          
          {/* Main content */}
          <div style={{
            textAlign: 'center',
            color: 'white',
            zIndex: 10,
            maxWidth: '900px',
            padding: '50px'
          }}>
            <h1 style={{ 
              fontSize: '4.5rem', 
              fontWeight: '800', 
              marginBottom: '30px',
              textShadow: '0 8px 30px rgba(0,0,0,0.3)',
              animation: 'textFloat 3s ease-in-out infinite'
            }}>
              The Future of Analytics
            </h1>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '30px',
              marginBottom: '40px'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎨</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>p5.js Physics</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Generative art meets data visualization</p>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🌐</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Three.js 3D</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Immersive revenue storytelling</p>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎵</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Tone.js Audio</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Data sonification and feedback</p>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚡</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>GSAP Motion</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Cinematic animations and transitions</p>
              </div>
            </div>
            
            <p style={{ 
              fontSize: '1.5rem', 
              lineHeight: '1.6', 
              marginBottom: '40px',
              opacity: 0.9,
              fontWeight: '300'
            }}>
              Where business intelligence becomes an art form.<br />
              Creative coding transforms data into unforgettable experiences.
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
                padding: '15px 30px',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                💰 ${restaurantData.monthlyRevenue.toLocaleString()}/mo Revenue
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                padding: '15px 30px',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                🎯 ${restaurantData.avgTicket} Avg Ticket
              </div>
            </div>
          </div>
        </div>
      ),
      description: 'Creative synthesis showcasing all interactive elements'
    }
  ];

  useEffect(() => {
    audioManager.current.initialize();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioManager.current.cleanup();
    };
  }, []);

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentScene(0);
    setShowControls(false);
    playCurrentScene();
    
    // Start ambient audio
    audioManager.current.setEnabled(true);
    audioManager.current.onSuccess();
  };

  const playCurrentScene = () => {
    const scene = demoScenes[currentScene];
    setTimeRemaining(scene.duration);
    
    // Audio cue for scene start
    audioManager.current.onSuccess();
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          nextScene();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextScene = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (currentScene < demoScenes.length - 1) {
      setCurrentScene(prev => prev + 1);
      setTimeout(playCurrentScene, 500); // Brief pause between scenes
    } else {
      endDemo();
    }
  };

  const prevScene = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
      setTimeout(playCurrentScene, 500);
    }
  };

  const endDemo = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Final audio flourish
    audioManager.current.onMilestone(100000);
  };

  const jumpToScene = (sceneIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentScene(sceneIndex);
    
    if (isPlaying) {
      setTimeout(playCurrentScene, 100);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Scene Content */}
      <div style={{ minHeight: '100vh' }}>
        {demoScenes[currentScene].component}
      </div>

      {/* Demo Controls */}
      {showControls && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '20px 30px',
          border: '1px solid rgba(255,255,255,0.2)',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            color: 'white'
          }}>
            <button
              onClick={startDemo}
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              🎬 Start Creative Demo
            </button>
            
            {onExit && (
              <button
                onClick={onExit}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '15px 25px',
                  borderRadius: '50px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Exit Showcase
              </button>
            )}
          </div>
        </div>
      )}

      {/* Demo Progress Bar (when playing) */}
      {isPlaying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          padding: '20px',
          zIndex: 1000,
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            margin: '0 auto',
            color: 'white'
          }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>
                {demoScenes[currentScene].name}
              </h3>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.7 }}>
                {demoScenes[currentScene].description}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                {timeRemaining}s
              </div>
              
              <div style={{
                width: '200px',
                height: '6px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((demoScenes[currentScene].duration - timeRemaining) / demoScenes[currentScene].duration) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4CAF50, #45a049)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={prevScene}
                  disabled={currentScene === 0}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    cursor: currentScene === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentScene === 0 ? 0.5 : 1
                  }}
                >
                  ⏮
                </button>
                
                <button
                  onClick={nextScene}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ⏭
                </button>
                
                <button
                  onClick={endDemo}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ⏹
                </button>
              </div>
            </div>
          </div>
          
          {/* Scene Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '15px'
          }}>
            {demoScenes.map((scene, index) => (
              <button
                key={scene.id}
                onClick={() => jumpToScene(index)}
                style={{
                  background: index === currentScene ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.3s ease'
                }}
              >
                {index + 1}. {scene.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes textFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `
      }} />
    </div>
  );
};

export default CreativeShowcaseMode;