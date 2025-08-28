import React, { useEffect, useRef, useState } from 'react';
import { BubblePhysicsSketch, BubbleData } from '../creative/sketches/BubblePhysics';

const restaurantFacts: BubbleData[] = [
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
  }
];

interface FloatingBubblesPhysicsProps {
  monthlyRevenue?: number;
  onBubbleInteraction?: (data: BubbleData) => void;
}

const FloatingBubblesPhysics: React.FC<FloatingBubblesPhysicsProps> = ({ 
  monthlyRevenue = 50000,
  onBubbleInteraction 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<BubblePhysicsSketch | null>(null);
  const [selectedFact, setSelectedFact] = useState<BubbleData | null>(null);

  useEffect(() => {
    if (containerRef.current && !sketchRef.current) {
      // Initialize p5.js sketch
      sketchRef.current = new BubblePhysicsSketch(
        containerRef.current,
        restaurantFacts,
        monthlyRevenue
      );

      // Set up bubble click handler
      sketchRef.current.setBubbleClickHandler((data) => {
        setSelectedFact(data);
        if (onBubbleInteraction) {
          onBubbleInteraction(data);
        }
      });
    }

    return () => {
      // Cleanup on unmount
      if (sketchRef.current) {
        sketchRef.current.destroy();
        sketchRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update revenue in sketch when it changes
    if (sketchRef.current) {
      sketchRef.current.updateRevenue(monthlyRevenue);
    }
  }, [monthlyRevenue]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    >
      {/* p5.js canvas will be inserted here */}
      
      {/* Optional: Display selected fact in a React-controlled overlay */}
      {selectedFact && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '10px',
            fontSize: '14px',
            maxWidth: '500px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideUp 0.3s ease-out',
            zIndex: 1000
          }}
        >
          <strong>{selectedFact.title}:</strong> {selectedFact.details.substring(0, 150)}...
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
      )}
    </div>
  );
};

export default FloatingBubblesPhysics;