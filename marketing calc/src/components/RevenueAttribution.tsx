import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface AttributionData {
  channel: string;
  revenue: number;
  percentage: number;
  color: string;
  details?: string;
}

interface RevenueAttributionProps {
  monthlyRevenue: number;
  avgTicket: number;
  localPackPosition?: number;
  organicPosition?: number;
  localPackKeywords?: {
    position1: number;
    position2: number;
    position3: number;
  };
  organicKeywords?: {
    position1: number;
    position2: number;
    position3: number;
    position4: number;
    position5: number;
  };
  hasLoyaltyProgram?: boolean;
  smsListSize?: number;
  emailListSize?: number;
  socialFollowers?: number;
  thirdPartyPercentage?: number;
  currentSEORevenue?: number;
}

const RevenueAttribution: React.FC<RevenueAttributionProps> = ({
  monthlyRevenue = 50000,
  avgTicket = 25,
  localPackPosition = 5,
  organicPosition = 8,
  localPackKeywords = { position1: 0, position2: 0, position3: 0 },
  organicKeywords = { position1: 0, position2: 0, position3: 0, position4: 0, position5: 0 },
  hasLoyaltyProgram = false,
  smsListSize = 0,
  emailListSize = 0,
  socialFollowers = 0,
  thirdPartyPercentage = 20,
  currentSEORevenue = 0
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  
  const calculateAttribution = (): AttributionData[] => {
    const attribution: AttributionData[] = [];
    let totalRevenue = monthlyRevenue;
    
    // Third-Party Delivery (15-30% commission rates) - only if they use it
    let thirdPartyRevenue = 0;
    if (thirdPartyPercentage > 0) {
      thirdPartyRevenue = monthlyRevenue * (thirdPartyPercentage / 100);
      attribution.push({
        channel: 'Third-Party Delivery',
        revenue: thirdPartyRevenue,
        percentage: thirdPartyPercentage,
        color: '#FF6B6B',
        details: `Commission: 15-30% per order`
      });
    }
    
    // SEO Revenue - Use real keyword-based calculation when available
    if (currentSEORevenue && currentSEORevenue > 0) {
      attribution.push({
        channel: 'SEO (Keywords)',
        revenue: currentSEORevenue,
        percentage: (currentSEORevenue / monthlyRevenue) * 100,
        color: '#4ECDC4',
        details: `Real keyword data - positions & search volume`
      });
    } else {
      // Fallback to basic calculations when real data isn't available
      const totalLocalPackKeywords = localPackKeywords.position1 + localPackKeywords.position2 + localPackKeywords.position3;
      if (totalLocalPackKeywords > 0) {
        // Revenue per keyword estimated based on search volume and ticket size
        const revenuePerKeyword = avgTicket * 50; // Assume 50 searches per keyword per month, 5% conversion
        const localPackRevenue = (
          localPackKeywords.position1 * revenuePerKeyword * 0.33 * 0.05 +
          localPackKeywords.position2 * revenuePerKeyword * 0.22 * 0.05 +
          localPackKeywords.position3 * revenuePerKeyword * 0.13 * 0.05
        );
        attribution.push({
          channel: 'Local Pack SEO',
          revenue: localPackRevenue,
          percentage: (localPackRevenue / monthlyRevenue) * 100,
          color: '#4ECDC4',
          details: `${totalLocalPackKeywords} keywords ranked (P1: ${localPackKeywords.position1}, P2: ${localPackKeywords.position2}, P3: ${localPackKeywords.position3})`
        });
      }
      
      // Organic Search (30% of search traffic) - calculated from keyword counts
      const totalOrganicKeywords = organicKeywords.position1 + organicKeywords.position2 + organicKeywords.position3 + organicKeywords.position4 + organicKeywords.position5;
      if (totalOrganicKeywords > 0) {
        const revenuePerKeyword = avgTicket * 30; // Lower search volume than Local Pack
        const organicRevenue = (
          organicKeywords.position1 * revenuePerKeyword * 0.18 * 0.05 +
          organicKeywords.position2 * revenuePerKeyword * 0.07 * 0.05 +
          organicKeywords.position3 * revenuePerKeyword * 0.03 * 0.05 +
          organicKeywords.position4 * revenuePerKeyword * 0.02 * 0.05 +
          organicKeywords.position5 * revenuePerKeyword * 0.015 * 0.05
        );
        attribution.push({
          channel: 'Organic Search',
          revenue: organicRevenue,
          percentage: (organicRevenue / monthlyRevenue) * 100,
          color: '#95E1D3',
          details: `${totalOrganicKeywords} keywords ranked (P1: ${organicKeywords.position1}, P2: ${organicKeywords.position2}, P3: ${organicKeywords.position3}, P4: ${organicKeywords.position4}, P5: ${organicKeywords.position5})`
        });
      }
    }
    
    // Loyalty Program (12-18% more revenue from members)
    if (hasLoyaltyProgram) {
      const loyaltyRevenue = monthlyRevenue * 0.15;
      attribution.push({
        channel: 'Loyalty Program',
        revenue: loyaltyRevenue,
        percentage: (loyaltyRevenue / monthlyRevenue) * 100,
        color: '#FFD93D',
        details: '20% higher spend, 20% more visits'
      });
    }
    
    // SMS Marketing (98% open rate, 19.5% CTR)
    if (smsListSize > 0) {
      const smsRevenue = (smsListSize * 0.98 * 0.195 * avgTicket * 0.5); // Monthly engagement
      attribution.push({
        channel: 'SMS Marketing',
        revenue: smsRevenue,
        percentage: (smsRevenue / monthlyRevenue) * 100,
        color: '#6BCF7F',
        details: '98% open rate, 19.5% CTR'
      });
    }
    
    // Email Marketing (28.4% open rate, 4.2% CTR)
    if (emailListSize > 0) {
      const emailRevenue = (emailListSize * 0.284 * 0.042 * avgTicket * 0.3); // Monthly engagement
      attribution.push({
        channel: 'Email Marketing',
        revenue: emailRevenue,
        percentage: (emailRevenue / monthlyRevenue) * 100,
        color: '#A8E6CF',
        details: '28.4% open rate, 4.2% CTR'
      });
    }
    
    // Social Media (3.1% Instagram, 1.3% Facebook engagement)
    if (socialFollowers > 0) {
      const socialRevenue = (socialFollowers * 0.02 * avgTicket * 0.1); // Conservative conversion
      attribution.push({
        channel: 'Social Media',
        revenue: socialRevenue,
        percentage: (socialRevenue / monthlyRevenue) * 100,
        color: '#C7CEEA',
        details: 'Instagram: 3.1%, Facebook: 1.3% engagement'
      });
    }
    
    // Direct/Walk-in/Repeat (remaining revenue after subtracting third-party)
    const otherChannelsRevenue = attribution.reduce((sum, item) => 
      item.channel !== 'Third-Party Delivery' ? sum + item.revenue : sum, 0);
    const directRevenue = Math.max(0, monthlyRevenue - thirdPartyRevenue - otherChannelsRevenue);
    
    if (directRevenue > 0) {
      attribution.push({
        channel: 'Direct/Walk-in',
        revenue: directRevenue,
        percentage: (directRevenue / monthlyRevenue) * 100,
        color: '#2E7D32',
        details: 'Repeat customers, walk-ins, direct traffic'
      });
    }
    
    return attribution.sort((a, b) => b.revenue - a.revenue);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const data = calculateAttribution();
    
    const pie = d3.pie<AttributionData>()
      .value(d => d.revenue)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<AttributionData>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const hoverArc = d3.arc<d3.PieArcDatum<AttributionData>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 1.05);

    // Draw pie segments
    const segments = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    segments.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc);
        setHoveredSegment(d.data.channel);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);
        setHoveredSegment(null);
      });

    // Add percentage labels
    segments.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .text(d => d.data.percentage > 5 ? `${d.data.percentage.toFixed(0)}%` : '');

    // Center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .text(`$${Math.round(monthlyRevenue).toLocaleString()}`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Monthly Revenue');

  }, [monthlyRevenue, avgTicket, localPackPosition, organicPosition, 
      hasLoyaltyProgram, smsListSize, emailListSize, socialFollowers, thirdPartyPercentage, currentSEORevenue]);

  const data = calculateAttribution();

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Where Every Dollar Comes From</h2>
      
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <svg ref={svgRef} width={500} height={400}></svg>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Channel Breakdown</h3>
          {data.map((item) => (
            <div 
              key={item.channel}
              style={{ 
                marginBottom: '12px',
                padding: '10px',
                backgroundColor: hoveredSegment === item.channel ? '#e8f4f8' : 'white',
                borderRadius: '6px',
                border: '1px solid #ddd',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <div 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: item.color,
                    borderRadius: '2px',
                    marginRight: '8px'
                  }}
                />
                <span style={{ fontWeight: 'bold', flex: 1 }}>{item.channel}</span>
                <span style={{ fontWeight: 'bold' }}>${Math.round(item.revenue).toLocaleString()}</span>
              </div>
              {item.details && (
                <div style={{ fontSize: '12px', color: '#666', marginLeft: '20px' }}>
                  {item.details}
                </div>
              )}
            </div>
          ))}
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fff3cd',
            borderRadius: '6px',
            border: '1px solid #ffc107'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#856404' }}>
              Attribution Model Notes:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#856404' }}>
              <li>Based on industry benchmarks and position metrics</li>
              <li>Local Pack drives 70% of search traffic</li>
              <li>Loyalty members generate 12-18% more revenue</li>
              <li>Multi-touch effects not fully captured</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAttribution;