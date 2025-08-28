import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  fact: string;
  stat: string;
  title: string;
  color: string;
  opacity: number;
  rotationSpeed: number;
  pulsePhase: number;
}

const restaurantFacts = [
  { 
    stat: "70%", 
    fact: "of local searches lead to visits within 24 hours",
    title: "Local Search Power",
    color: "rgba(78, 205, 196, 0.9)"
  },
  { 
    stat: "5x", 
    fact: "higher ROI with SMS vs traditional marketing",
    title: "SMS Marketing", 
    color: "rgba(255, 107, 107, 0.9)"
  },
  { 
    stat: "98%", 
    fact: "SMS open rate - highest of any channel",
    title: "Message Delivery",
    color: "rgba(167, 139, 250, 0.9)"
  },
  { 
    stat: "33%", 
    fact: "more clicks from Google position #1 vs #3",
    title: "SEO Rankings",
    color: "rgba(251, 191, 36, 0.9)"
  },
  { 
    stat: "$6.50", 
    fact: "return for every $1 spent on influencer marketing",
    title: "Influencer ROI",
    color: "rgba(244, 114, 182, 0.9)"
  },
  { 
    stat: "20%", 
    fact: "increase in visits with loyalty programs",
    title: "Customer Loyalty",
    color: "rgba(16, 185, 129, 0.9)"
  }
];

interface EnhancedFloatingBubblesProps {
  isPaused?: boolean;
  revenueMultiplier?: number;
}

const EnhancedFloatingBubbles: React.FC<EnhancedFloatingBubblesProps> = ({ 
  isPaused = false, 
  revenueMultiplier = 1 
}) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [selectedBubble, setSelectedBubble] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const bubblesRef = useRef<Bubble[]>([]);

  // Initialize bubbles
  useEffect(() => {
    const initialBubbles: Bubble[] = restaurantFacts.map((fact, index) => ({
      id: index,
      x: Math.random() * (window.innerWidth - 200) + 100,
      y: Math.random() * (window.innerHeight - 200) + 100,
      size: 60 + Math.random() * 40 + (revenueMultiplier * 20),
      speed: 0.3 + Math.random() * 0.4,
      fact: fact.fact,
      stat: fact.stat,
      title: fact.title,
      color: fact.color,
      opacity: 0.8 + Math.random() * 0.2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    setBubbles(initialBubbles);
    bubblesRef.current = initialBubbles;
  }, [revenueMultiplier]);

  // Animation loop
  useEffect(() => {
    if (isPaused) return;

    const animate = () => {
      setBubbles(prevBubbles => {
        const updatedBubbles = prevBubbles.map(bubble => {
          let newY = bubble.y - bubble.speed;
          let newX = bubble.x + Math.sin(Date.now() * 0.001 + bubble.id) * 0.5;
          
          // Reset when bubble goes off screen
          if (newY < -bubble.size) {
            newY = window.innerHeight + bubble.size;
            newX = Math.random() * (window.innerWidth - 200) + 100;
          }
          
          // Keep bubbles within horizontal bounds
          if (newX < bubble.size) newX = bubble.size;
          if (newX > window.innerWidth - bubble.size) newX = window.innerWidth - bubble.size;
          
          return {
            ...bubble,
            x: newX,
            y: newY,
            pulsePhase: bubble.pulsePhase + 0.02
          };
        });
        
        bubblesRef.current = updatedBubbles;
        return updatedBubbles;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused]);

  const handleBubbleClick = (bubbleId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (selectedBubble === bubbleId) {
      // Close if clicking the same bubble
      setSelectedBubble(null);
      gsap.to(`.bubble-${bubbleId}`, {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    } else {
      // Close previous bubble if any
      if (selectedBubble !== null) {
        gsap.to(`.bubble-${selectedBubble}`, {
          scale: 1,
          duration: 0.2
        });
      }
      
      // Open new bubble
      setSelectedBubble(bubbleId);
      gsap.to(`.bubble-${bubbleId}`, {
        scale: 1.2,
        duration: 0.4,
        ease: "back.out(1.7)"
      });
      
      // Create a ripple effect
      gsap.fromTo(`.bubble-${bubbleId}`, 
        { boxShadow: "0 0 0 0 rgba(255,255,255,0.6)" },
        { 
          boxShadow: "0 0 0 20px rgba(255,255,255,0)",
          duration: 0.6,
          ease: "power2.out"
        }
      );
    }
  };

  const handleBackgroundClick = () => {
    if (selectedBubble !== null) {
      gsap.to(`.bubble-${selectedBubble}`, {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
      setSelectedBubble(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1
      }}
      onClick={handleBackgroundClick}
    >
      {bubbles.map((bubble) => {
        const pulseScale = 1 + Math.sin(bubble.pulsePhase) * 0.05;
        const isSelected = selectedBubble === bubble.id;
        
        return (
          <div
            key={bubble.id}
            className={`bubble-${bubble.id}`}
            style={{
              position: 'absolute',
              left: `${bubble.x - bubble.size/2}px`,
              top: `${bubble.y - bubble.size/2}px`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: `linear-gradient(135deg, ${bubble.color}, ${bubble.color.replace('0.9', '0.7')})`,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              textAlign: 'center',
              padding: '10px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transform: `scale(${pulseScale})`,
              transition: 'transform 0.1s ease-out',
              boxShadow: `0 4px 20px ${bubble.color.replace('0.9', '0.3')}, inset 0 1px 0 rgba(255,255,255,0.3)`,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              opacity: isSelected ? 1 : (0.7 + Math.sin(bubble.pulsePhase * 0.5) * 0.1),
              zIndex: isSelected ? 1000 : 1
            }}
            onClick={(e) => handleBubbleClick(bubble.id, e)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                gsap.to(e.currentTarget, {
                  scale: pulseScale * 1.1,
                  duration: 0.2,
                  ease: "power2.out"
                });
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                gsap.to(e.currentTarget, {
                  scale: pulseScale,
                  duration: 0.2,
                  ease: "power2.out"
                });
              }
            }}
          >
            <div style={{
              fontSize: bubble.size > 80 ? '1.8rem' : '1.4rem',
              fontWeight: '800',
              marginBottom: '4px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              lineHeight: 1
            }}>
              {bubble.stat}
            </div>
            <div style={{
              fontSize: bubble.size > 80 ? '11px' : '9px',
              fontWeight: '600',
              lineHeight: '1.2',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              opacity: 0.95
            }}>
              {bubble.fact}
            </div>
          </div>
        );
      })}

      {/* Selected bubble detail overlay */}
      {selectedBubble !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '20px 30px',
            borderRadius: '16px',
            maxWidth: '500px',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            zIndex: 2000,
            pointerEvents: 'auto',
            animation: 'slideUp 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '1.2rem',
            color: bubbles.find(b => b.id === selectedBubble)?.color?.replace('0.9)', '1)') || 'white'
          }}>
            {bubbles.find(b => b.id === selectedBubble)?.title}
          </h3>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            lineHeight: '1.5',
            opacity: 0.9
          }}>
            <strong>{bubbles.find(b => b.id === selectedBubble)?.stat}</strong> {bubbles.find(b => b.id === selectedBubble)?.fact}
          </p>
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            opacity: 0.6
          }}>
            Click the bubble again to close
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
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

export default EnhancedFloatingBubbles;