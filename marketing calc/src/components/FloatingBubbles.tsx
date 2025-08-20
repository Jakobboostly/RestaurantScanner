import React, { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  fact: string;
  stat: string;
  title: string;
  details: string;
  source: string;
  color: string;
  delay: number;
}

const restaurantFacts = [
  { 
    stat: "70%", 
    fact: "of local searches lead to store visits within 24 hours",
    title: "Local Search Impact",
    details: "Local search is incredibly powerful for restaurants. When someone searches for 'restaurants near me' or 'pizza delivery', 70% will visit a location within 24 hours. This means optimizing your local SEO and Google Business Profile is critical for immediate revenue impact.",
    source: "Google Local Search Study 2024"
  },
  { 
    stat: "5x", 
    fact: "higher ROI with SMS marketing vs traditional ads",
    title: "SMS Marketing Power", 
    details: "SMS campaigns deliver 5x higher return on investment compared to traditional advertising channels. For every $100 spent on SMS, restaurants typically see $500+ in revenue. With 98% open rates and immediate delivery, SMS is the most direct way to reach customers.",
    source: "Mobile Marketing Association"
  },
  { 
    stat: "89%", 
    fact: "of consumers follow restaurants on social media",
    title: "Social Media Following",
    details: "Nearly 9 out of 10 consumers follow restaurants on social platforms. This presents a massive opportunity for engagement, brand building, and driving repeat visits through compelling content and user-generated posts.",
    source: "Restaurant Social Media Report 2024"
  },
  { 
    stat: "33%", 
    fact: "more clicks from Google position #1 vs #3",
    title: "Local Pack Rankings",
    details: "The difference between ranking #1 vs #3 in Google's Local Pack is massive: 33% CTR vs 13% CTR. For a restaurant with 1000 monthly searches, this means 330 clicks vs 130 clicks - potentially 200 more customers per month worth $5,000+ in additional monthly revenue.",
    source: "Local SEO Click-Through Rate Study"
  },
  { 
    stat: "98%", 
    fact: "SMS open rate - highest of any marketing channel",
    title: "SMS Open Rates",
    details: "SMS achieves a 98% open rate, making it the highest-performing marketing channel. Compare this to email (28% for restaurants) or social media (3-4% reach). SMS ensures your message gets seen by virtually every customer on your list.",
    source: "SMS Marketing Benchmark Report"
  },
  { 
    stat: "$6.50", 
    fact: "revenue for every $1 spent on influencer marketing",
    title: "Influencer Marketing ROI",
    details: "Influencer marketing delivers $6.50 in revenue for every $1 spent. For restaurants, partnering with local food bloggers and micro-influencers can drive significant awareness and foot traffic at a fraction of traditional advertising costs.",
    source: "Influencer Marketing Hub Study"
  },
  { 
    stat: "20%", 
    fact: "increase in visits with loyalty programs",
    title: "Loyalty Program Impact",
    details: "Customers enrolled in loyalty programs visit 20% more frequently and spend 20% more per visit. A well-designed loyalty program doesn't just retain customers - it actively increases their lifetime value by $200-500 per customer annually.",
    source: "Restaurant Loyalty Program Analysis"
  },
  { 
    stat: "28%", 
    fact: "higher engagement with user-generated content",
    title: "User-Generated Content",
    details: "Posts featuring customer photos, reviews, and check-ins generate 28% higher engagement than brand-only content. Encouraging customers to share their dining experience creates authentic marketing that resonates with potential visitors.",
    source: "Social Media Engagement Study"
  },
  { 
    stat: "81%", 
    fact: "of customers would join a loyalty program if offered",
    title: "Loyalty Program Demand",
    details: "4 out of 5 customers would join a restaurant loyalty program if offered one. Yet many restaurants still don't have loyalty programs, missing out on this powerful retention and revenue growth tool.",
    source: "Customer Loyalty Research 2024"
  },
  { 
    stat: "15-30%", 
    fact: "commission rates on third-party delivery platforms",
    title: "Delivery Platform Costs",
    details: "Third-party delivery platforms charge 15-30% commission per order, significantly impacting profit margins. For a $25 order, you pay $3.75-7.50 in fees. Building your own delivery system or promoting direct ordering can save $1,000s monthly.",
    source: "Restaurant Delivery Economics Report"
  }
];

const FloatingBubbles: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [expandedBubble, setExpandedBubble] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const initialBubbles: Bubble[] = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 200,
      size: Math.random() * 80 + 120, // 120-200px
      speed: Math.random() * 1.5 + 1.2, // 1.2-2.7
      fact: restaurantFacts[i % restaurantFacts.length].fact,
      stat: restaurantFacts[i % restaurantFacts.length].stat,
      title: restaurantFacts[i % restaurantFacts.length].title,
      details: restaurantFacts[i % restaurantFacts.length].details,
      source: restaurantFacts[i % restaurantFacts.length].source,
      color: [
        'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
        'linear-gradient(135deg, #4ecdc4 0%, #6ee6dd 100%)',
        'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)',
        'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)',
        'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)',
        'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
        'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
      ][i % 9],
      delay: i * 800 // Faster stagger appearance
    }));

    setBubbles(initialBubbles);
  }, []);

  useEffect(() => {
    const animateBubbles = () => {
      if (isPaused) return; // Don't animate when paused
      
      setBubbles(prevBubbles =>
        prevBubbles.map(bubble => {
          let newY = bubble.y - bubble.speed;
          let newX = bubble.x + Math.sin(Date.now() * 0.002 + bubble.id) * 1.5;

          // Reset bubble when it goes off screen
          if (newY < -bubble.size) {
            newY = window.innerHeight + bubble.size;
            newX = Math.random() * window.innerWidth;
          }

          return { ...bubble, x: newX, y: newY };
        })
      );
    };

    const interval = setInterval(animateBubbles, 16); // ~60fps
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleBubbleClick = (bubbleId: number) => {
    if (expandedBubble === bubbleId) {
      // Collapse if clicking the same bubble
      setExpandedBubble(null);
      setIsPaused(false);
    } else {
      // Expand this bubble
      setExpandedBubble(bubbleId);
      setIsPaused(true);
    }
  };

  const handleBackgroundClick = () => {
    if (expandedBubble !== null) {
      setExpandedBubble(null);
      setIsPaused(false);
    }
  };

  const expandedBubbleData = expandedBubble !== null 
    ? bubbles.find(b => b.id === expandedBubble) 
    : null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
      onClick={handleBackgroundClick}
    >
      {/* Regular floating bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          style={{
            position: 'absolute',
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: bubble.color,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            animation: `fadeIn 1s ease-in-out ${bubble.delay}ms both, float 6s ease-in-out infinite`,
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.3)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            opacity: expandedBubble !== null && expandedBubble !== bubble.id ? 0.3 : 1,
            zIndex: expandedBubble === bubble.id ? 10000 : 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleBubbleClick(bubble.id);
          }}
          onMouseEnter={(e) => {
            if (expandedBubble === null) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (expandedBubble === null) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <div style={{
            fontSize: bubble.size > 150 ? '2rem' : '1.5rem',
            fontWeight: '800',
            marginBottom: '5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {bubble.stat}
          </div>
          <div style={{
            fontSize: bubble.size > 150 ? '12px' : '10px',
            opacity: 0.95,
            lineHeight: '1.2',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            {bubble.fact}
          </div>
        </div>
      ))}

      {/* Expanded bubble overlay */}
      {expandedBubbleData && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            minHeight: '400px',
            background: expandedBubbleData.color,
            borderRadius: '30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '40px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)',
            border: '3px solid rgba(255,255,255,0.4)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 20000,
            animation: 'expandIn 0.3s ease-out'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleBubbleClick(expandedBubbleData.id);
          }}
        >
          <div style={{
            fontSize: '4rem',
            fontWeight: '800',
            marginBottom: '20px',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            {expandedBubbleData.stat}
          </div>
          
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '25px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {expandedBubbleData.title}
          </div>

          <div style={{
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '25px',
            opacity: 0.95,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            {expandedBubbleData.details}
          </div>

          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            fontStyle: 'italic',
            marginBottom: '15px'
          }}>
            Source: {expandedBubbleData.source}
          </div>

          <div style={{
            fontSize: '14px',
            opacity: 0.9,
            background: 'rgba(255,255,255,0.2)',
            padding: '10px 20px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            Click to close
          </div>
        </div>
      )}

      {/* Dark background overlay when bubble is expanded */}
      {expandedBubble !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 15000,
            pointerEvents: 'auto',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={handleBackgroundClick}
        />
      )}

      <style>
        {`
          @keyframes fadeIn {
            0% { 
              opacity: 0; 
              transform: scale(0.8) translateY(20px); 
            }
            100% { 
              opacity: 1; 
              transform: scale(1) translateY(0); 
            }
          }

          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg); 
            }
            25% { 
              transform: translateY(-10px) rotate(1deg); 
            }
            50% { 
              transform: translateY(0px) rotate(0deg); 
            }
            75% { 
              transform: translateY(-5px) rotate(-1deg); 
            }
          }

          @keyframes expandIn {
            0% { 
              opacity: 0; 
              transform: translate(-50%, -50%) scale(0.3); 
            }
            100% { 
              opacity: 1; 
              transform: translate(-50%, -50%) scale(1); 
            }
          }
        `}
      </style>
    </div>
  );
};

export default FloatingBubbles;