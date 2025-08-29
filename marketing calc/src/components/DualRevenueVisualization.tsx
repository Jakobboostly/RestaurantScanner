import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { channelROICalculators } from '../data/restaurantStats';
import { calculateUnifiedRevenue, RevenueCalculationInputs } from '../services/revenueCalculations';

interface AttributionData {
  channel: string;
  revenue: number;
  percentage: number;
  color: string;
  details?: string;
}

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

interface DualRevenueVisualizationProps {
  monthlyRevenue: number;
  avgTicket: number;
  monthlyTransactions: number;
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
  restaurantData?: RevenueCalculationInputs;
}

const DualRevenueVisualization: React.FC<DualRevenueVisualizationProps> = ({
  monthlyRevenue = 50000,
  avgTicket = 25,
  monthlyTransactions = 2000,
  hasLoyaltyProgram = false,
  smsListSize = 0,
  emailListSize = 0,
  socialFollowers = 0,
  thirdPartyPercentage = 20,
  currentSEORevenue = 0,
  restaurantData
}) => {
  const currentChartRef = useRef<SVGSVGElement>(null);
  const optimizedChartRef = useRef<SVGSVGElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [leverStates, setLeverStates] = useState<{[key: string]: boolean}>({});

  // Calculate lever data using unified revenue calculations
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
      // Fallback to basic calculations
      seoCurrentRevenue = monthlyRevenue * 0.1;
      seoPotentialRevenue = channelROICalculators.calculateSEOROI(monthlyTransactions * 2.5, 5, 1, avgTicket) + seoCurrentRevenue;
      
      socialCurrentRevenue = monthlyRevenue * 0.05;
      socialPotentialRevenue = socialCurrentRevenue + (monthlyTransactions * 0.15 * avgTicket);
      
      smsCurrentRevenue = 0;
      smsPotentialRevenue = channelROICalculators.calculateSMSROI(monthlyTransactions * 0.3, 4, avgTicket);
    }

    // No additional boost multiplier needed since boosts are already applied in revenue calculations
    // SEO is boosted by 50%, Social by 20%, SMS is capped for realism
    
    return [
      {
        id: 'seo',
        name: 'SEO & Local Search',
        isActive: false,
        currentRevenue: seoCurrentRevenue,
        potentialRevenue: seoPotentialRevenue, // Already boosted by 50% in calculations
        color: '#4CAF50',
        icon: '🔍',
        methodology: 'Based on Local Pack vs Organic search attribution (70%/30% split) and position-specific CTR: Local Pack Position #1 (33% CTR), #2 (22% CTR), #3 (13% CTR). Organic Search Position #1 (18% CTR), #2 (7% CTR), #3 (3% CTR). Uses 5% website conversion rate and 2.5x search volume multiplier. Enhanced performance projections.',
        dataSource: 'Google Local Search Study 2024, Local SEO Click-Through Rate Analysis, Restaurant Industry Benchmarks'
      },
      {
        id: 'social',
        name: 'Social Media Marketing',
        isActive: false,
        currentRevenue: socialCurrentRevenue,
        potentialRevenue: socialPotentialRevenue, // Already boosted by 20% in calculations
        color: '#E91E63',
        icon: '📱',
        methodology: 'Calculated using enhanced follower-to-customer conversion rates, with Instagram performing at optimized monthly conversion and Facebook with improved engagement strategies. Accounts for posting frequency impact and advanced content strategy optimization.',
        dataSource: 'Restaurant Social Media Report 2024, Platform-specific engagement studies, Food & Beverage industry analysis'
      },
      {
        id: 'sms',
        name: 'SMS Marketing',
        isActive: false,
        currentRevenue: smsCurrentRevenue,
        potentialRevenue: smsPotentialRevenue, // Capped at 25% of monthly revenue for realism
        color: '#2196F3',
        icon: '💬',
        methodology: 'Based on 98% SMS open rate (highest in F&B sector), 19-20% click-through rate, and 25% conversion rate. Assumes 30% of customers would opt-in to SMS marketing with 4 campaigns per month. 10x higher redemption vs other channels. Revenue capped for realistic projections.',
        dataSource: 'SMS Marketing Benchmark Report, Mobile Marketing Association F&B data, Redemption rate studies'
      }
    ];
  }, [monthlyRevenue, avgTicket, monthlyTransactions, restaurantData]);

  // Combine calculations with toggle states
  const levers = useMemo(() => {
    return leverCalculations.map(lever => ({
      ...lever,
      isActive: leverStates[lever.id] || false
    }));
  }, [leverCalculations, leverStates]);

  // Calculate attribution for both current and optimized scenarios
  const calculateAttribution = (isOptimized: boolean = false): AttributionData[] => {
    const attribution: AttributionData[] = [];
    let baseRevenue = monthlyRevenue;
    
    // Add optimized revenue from active levers + overall business growth
    if (isOptimized) {
      const activeLeverCount = levers.filter(l => l.isActive).length;
      const additionalRevenue = levers.reduce((sum, lever) => {
        if (lever.isActive) {
          return sum + (lever.potentialRevenue - lever.currentRevenue);
        }
        return sum;
      }, 0);
      
      // Simply add additional revenue from active levers (no multipliers)
      if (activeLeverCount > 0) {
        baseRevenue = monthlyRevenue + additionalRevenue;
      } else {
        // No levers active = same as current revenue
        baseRevenue = monthlyRevenue;
      }
    }
    
    // Third-Party Delivery
    let thirdPartyRevenue = 0;
    if (thirdPartyPercentage > 0) {
      thirdPartyRevenue = baseRevenue * (thirdPartyPercentage / 100);
      attribution.push({
        channel: 'Third-Party Delivery',
        revenue: thirdPartyRevenue,
        percentage: thirdPartyPercentage,
        color: '#FF6B6B',
        details: `Commission: 15-30% per order`
      });
    }
    
    // SEO Revenue - enhanced with lever state
    const seoLever = levers.find(l => l.id === 'seo');
    const seoRevenue = isOptimized && seoLever?.isActive ? seoLever.potentialRevenue : (currentSEORevenue || seoLever?.currentRevenue || baseRevenue * 0.1);
    attribution.push({
      channel: 'SEO & Local Search',
      revenue: seoRevenue,
      percentage: (seoRevenue / baseRevenue) * 100,
      color: '#4CAF50',
      details: isOptimized && seoLever?.isActive ? 'Optimized with Boostly' : 'Current performance'
    });
    
    // Social Media - enhanced with lever state
    const socialLever = levers.find(l => l.id === 'social');
    const socialRevenue = isOptimized && socialLever?.isActive ? socialLever.potentialRevenue : (socialLever?.currentRevenue || baseRevenue * 0.05);
    if (socialRevenue > 0) {
      attribution.push({
        channel: 'Social Media',
        revenue: socialRevenue,
        percentage: (socialRevenue / baseRevenue) * 100,
        color: '#E91E63',
        details: isOptimized && socialLever?.isActive ? 'Optimized strategy' : 'Current social presence'
      });
    }
    
    // SMS Marketing - enhanced with lever state
    const smsLever = levers.find(l => l.id === 'sms');
    const smsRevenue = isOptimized && smsLever?.isActive ? smsLever.potentialRevenue : (smsLever?.currentRevenue || 0);
    if (smsRevenue > 0) {
      attribution.push({
        channel: 'SMS Marketing',
        revenue: smsRevenue,
        percentage: (smsRevenue / baseRevenue) * 100,
        color: '#2196F3',
        details: '98% open rate, 19.5% CTR'
      });
    }
    
    // Email Marketing
    if (emailListSize > 0) {
      const emailRevenue = (emailListSize * 0.284 * 0.042 * avgTicket * 0.3);
      attribution.push({
        channel: 'Email Marketing',
        revenue: emailRevenue,
        percentage: (emailRevenue / baseRevenue) * 100,
        color: '#A8E6CF',
        details: '28.4% open rate, 4.2% CTR'
      });
    }
    
    // Loyalty Program
    if (hasLoyaltyProgram) {
      const loyaltyRevenue = baseRevenue * 0.15;
      attribution.push({
        channel: 'Loyalty Program',
        revenue: loyaltyRevenue,
        percentage: (loyaltyRevenue / baseRevenue) * 100,
        color: '#FFD93D',
        details: '20% higher spend, 20% more visits'
      });
    }
    
    // Calculate total of all channels before adding Direct/Walk-in
    const otherChannelsRevenue = attribution.reduce((sum, item) => 
      item.channel !== 'Third-Party Delivery' ? sum + item.revenue : sum, 0);
    const totalChannelRevenue = thirdPartyRevenue + otherChannelsRevenue;
    
    // If total channels exceed base revenue, scale them proportionally
    if (totalChannelRevenue > baseRevenue) {
      const scalingFactor = baseRevenue / totalChannelRevenue;
      // Scale down all non-third-party channels proportionally
      attribution = attribution.map(item => {
        if (item.channel !== 'Third-Party Delivery') {
          return {
            ...item,
            revenue: item.revenue * scalingFactor,
            percentage: (item.revenue * scalingFactor / baseRevenue) * 100
          };
        }
        return item;
      });
      
      // Recalculate third-party percentage after scaling
      if (thirdPartyRevenue > 0) {
        const thirdPartyIndex = attribution.findIndex(item => item.channel === 'Third-Party Delivery');
        if (thirdPartyIndex >= 0) {
          attribution[thirdPartyIndex].percentage = (thirdPartyRevenue / baseRevenue) * 100;
        }
      }
      
      // No Direct/Walk-in needed since all revenue is accounted for
    } else {
      // Normal case: add Direct/Walk-in for remaining revenue
      const directRevenue = baseRevenue - totalChannelRevenue;
      if (directRevenue > 0) {
        attribution.push({
          channel: 'Direct/Walk-in',
          revenue: directRevenue,
          percentage: (directRevenue / baseRevenue) * 100,
          color: '#2E7D32',
          details: 'Repeat customers, walk-ins, direct traffic'
        });
      }
    }
    
    return attribution.sort((a, b) => b.revenue - a.revenue);
  };

  // Calculate dynamic scale for optimized chart based on active levers
  const getOptimizedChartScale = () => {
    const activeLeverCount = levers.filter(l => l.isActive).length;
    // Base scale 1.0, grow by 0.15 for each active lever (smoother than size changes)
    const scalePerLever = 0.15;
    return 1.0 + (activeLeverCount * scalePerLever);
  };

  // Generate dynamic title for optimized chart
  const getOptimizedChartTitle = () => {
    const leverServiceMap: { [key: string]: string } = {
      'seo': 'SEO',
      'social': 'Social Media',
      'sms': 'SMS Marketing'
    };

    const activeServices = levers
      .filter(lever => lever.isActive)
      .map(lever => leverServiceMap[lever.id])
      .filter(Boolean);

    if (activeServices.length === 0) {
      return 'Revenue DNA with no changes';
    }

    return `Revenue DNA + ${activeServices.join(' + ')}`;
  };

  // D3 Chart rendering function
  const renderChart = (svgRef: React.RefObject<SVGSVGElement>, data: AttributionData[], isOptimized: boolean = false) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Use same base dimensions for both charts - scaling will be handled by CSS transform
    const width = 480;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<AttributionData>()
      .value(d => d.revenue)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<AttributionData>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const hoverArc = d3.arc<d3.PieArcDatum<AttributionData>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 1.05);

    // Add glow effect for optimized chart
    if (isOptimized) {
      const defs = svg.append('defs');
      const filter = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filter.append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'coloredBlur');

      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    // Draw pie segments
    const segments = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    segments.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .style('stroke', isOptimized ? '#FFD700' : 'white')
      .style('stroke-width', isOptimized ? 3 : 2)
      .style('cursor', 'pointer')
      .style('filter', isOptimized ? 'url(#glow)' : 'none')
      .on('mouseover', function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc(d));
        setHoveredSegment(d.data.channel);
      })
      .on('mouseout', function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc(d));
        setHoveredSegment(null);
      });

    // Add percentage labels
    segments.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .style('font-size', isOptimized ? '13px' : '12px')
      .style('pointer-events', 'none')
      .text(d => d.data.percentage > 5 ? `${d.data.percentage.toFixed(0)}%` : '');

    // Center text
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', isOptimized ? '28px' : '24px')
      .style('font-weight', 'bold')
      .style('fill', isOptimized ? '#FFD700' : '#333')
      .text(`$${Math.round(totalRevenue).toLocaleString()}`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Monthly Revenue');

  };

  useEffect(() => {
    const currentData = calculateAttribution(false);
    const optimizedData = calculateAttribution(true);
    
    renderChart(currentChartRef, currentData, false);
    renderChart(optimizedChartRef, optimizedData, true);
  }, [monthlyRevenue, avgTicket, hasLoyaltyProgram, smsListSize, emailListSize, 
      socialFollowers, thirdPartyPercentage, currentSEORevenue, leverStates, levers]);

  const currentData = calculateAttribution(false);
  const optimizedData = calculateAttribution(true);
  const totalOptimizedRevenue = optimizedData.reduce((sum, d) => sum + d.revenue, 0);
  const growthPotential = totalOptimizedRevenue - monthlyRevenue;
  const growthPercentage = (growthPotential / monthlyRevenue) * 100;
  const optimizedChartScale = getOptimizedChartScale();

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '10px'
        }}>
          💰 Your Revenue DNA
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '10px'
        }}>
          Current Reality vs. Optimized Potential
        </p>
        <p style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#10b981',
          margin: 0
        }}>
          Unlock ${Math.round(growthPotential).toLocaleString()} ({growthPercentage.toFixed(0)}% growth)
        </p>
      </div>

      {/* Dual Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Current Revenue Chart */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#334155',
            marginBottom: '20px'
          }}>
            Current Revenue DNA
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <svg ref={currentChartRef} width={480} height={400}></svg>
          </div>
        </div>

        {/* Optimized Revenue Chart - Premium Treatment */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: `0 12px ${20 + (levers.filter(l => l.isActive).length * 10)}px rgba(255,215,0,${0.3 + (levers.filter(l => l.isActive).length * 0.1)})`,
          border: `${2 + levers.filter(l => l.isActive).length}px solid #FFD700`,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Background glow effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle, rgba(255,215,0,${0.1 + (levers.filter(l => l.isActive).length * 0.05)}) 0%, transparent 70%)`,
            animation: `pulse ${3 - (levers.filter(l => l.isActive).length * 0.3)}s ease-in-out infinite`,
            pointerEvents: 'none'
          }} />
          
          <div style={{ 
            position: 'relative', 
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '20px'
            }}>
              {getOptimizedChartTitle()}
            </h3>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              width: '100%',
              height: '600px', // Fixed container height to prevent layout shifts
              overflow: 'visible' // Allow chart to grow beyond container
            }}>
              <svg 
                ref={optimizedChartRef} 
                width={480} 
                height={400}
                style={{
                  transform: `scale(${optimizedChartScale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 8px 25px rgba(255,215,0,${0.3 + (levers.filter(l => l.isActive).length * 0.1)}))`,
                }}
              ></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Levers */}
      <div style={{
        marginBottom: '40px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          color: '#334155',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          ⚡ Interactive Revenue Levers
        </h3>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Toggle the levers below to see real-time impact on your revenue potential
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' }}>
          {levers.map((lever) => (
            <div key={lever.id} style={{ textAlign: 'center', position: 'relative' }}>
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
              </div>

              {/* Lever Switch */}
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
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setLeverStates(prev => ({ ...prev, [lever.id]: !prev[lever.id] }))}
              >
                {/* Lever Track */}
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  width: 'calc(100% - 12px)',
                  height: 'calc(100% - 12px)',
                  background: lever.isActive ? `linear-gradient(to top, ${lever.color}, ${lever.color}dd)` : '#e0e0e0',
                  borderRadius: '24px',
                  transition: 'all 0.4s ease'
                }} />

                {/* Lever Handle */}
                <div style={{
                  position: 'absolute',
                  top: lever.isActive ? '10px' : 'calc(100% - 50px)', // UP when active, DOWN when inactive
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '70px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '20px',
                  border: `3px solid ${lever.isActive ? lever.color : '#999'}`,
                  boxShadow: lever.isActive ? `0 6px 15px ${lever.color}40` : '0 6px 15px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: lever.isActive ? lever.color : '#999',
                  transition: 'all 0.4s ease',
                  zIndex: 2
                }}>
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
                  {lever.isActive ? '✓ WITH BOOSTLY' : '✗ WITHOUT BOOSTLY'}
                </div>
              </div>

              {/* Revenue Impact */}
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '15px',
                border: '2px solid #e9ecef'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: lever.isActive ? lever.color : '#666',
                  marginBottom: '5px'
                }}>
                  +${Math.round(lever.potentialRevenue - lever.currentRevenue).toLocaleString()}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666'
                }}>
                  monthly revenue boost
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Breakdown Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Current Breakdown */}
        <div>
          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            marginBottom: '20px',
            color: '#334155'
          }}>
            📊 Current Channel Breakdown
          </h3>
          {currentData.map((item) => (
            <div 
              key={item.channel}
              style={{ 
                marginBottom: '12px',
                padding: '15px',
                backgroundColor: hoveredSegment === item.channel ? '#e8f4f8' : 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: item.color,
                    borderRadius: '2px',
                    marginRight: '10px'
                  }}
                />
                <span style={{ fontWeight: '700', flex: 1, fontSize: '14px' }}>{item.channel}</span>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>${Math.round(item.revenue).toLocaleString()}</span>
              </div>
              {item.details && (
                <div style={{ fontSize: '12px', color: '#64748b', marginLeft: '22px' }}>
                  {item.details}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Optimized Breakdown */}
        <div>
          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🚀 Optimized Channel Breakdown
          </h3>
          {optimizedData.map((item) => (
            <div 
              key={item.channel}
              style={{ 
                marginBottom: '12px',
                padding: '15px',
                backgroundColor: hoveredSegment === item.channel ? '#fef3c7' : 'rgba(255,255,255,0.8)',
                borderRadius: '8px',
                border: '1px solid #fbbf24',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: item.color,
                    borderRadius: '2px',
                    marginRight: '10px'
                  }}
                />
                <span style={{ fontWeight: '700', flex: 1, fontSize: '14px' }}>{item.channel}</span>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>${Math.round(item.revenue).toLocaleString()}</span>
              </div>
              {item.details && (
                <div style={{ fontSize: '12px', color: '#92400e', marginLeft: '22px' }}>
                  {item.details}
                </div>
              )}
            </div>
          ))}
          
          {/* Growth Summary */}
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '700' }}>
              💎 Revenue Growth Summary
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Additional Monthly Revenue:</span>
              <span style={{ fontWeight: '700' }}>+${Math.round(growthPotential).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Growth Percentage:</span>
              <span style={{ fontWeight: '700' }}>{growthPercentage.toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Annual Revenue Impact:</span>
              <span style={{ fontWeight: '700' }}>${Math.round(growthPotential * 12).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Opportunities Showcase */}
      {restaurantData && restaurantData.keywords && restaurantData.keywords.length > 0 && (
        <div style={{
          marginBottom: '40px',
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🎯</span>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#334155',
              margin: 0
            }}>
              Your Top SEO Opportunities
            </h3>
          </div>
          
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '25px'
          }}>
            {levers.find(l => l.id === 'seo')?.isActive 
              ? 'Here\'s how we\'ll optimize your keyword rankings:'
              : 'Unlock revenue potential with strategic keyword improvements:'
            }
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 100px 100px 120px 140px',
            gap: '15px',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '12px 20px',
            backgroundColor: '#334155',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div>Keyword</div>
            <div style={{ textAlign: 'center' }}>Current</div>
            <div style={{ textAlign: 'center' }}>Target</div>
            <div style={{ textAlign: 'center' }}>Volume</div>
            <div style={{ textAlign: 'center' }}>Revenue Impact</div>
          </div>

          {restaurantData.keywords
            .map(keyword => {
              if (!keyword || typeof keyword !== 'object') return null;
              
              const currentPosition = Number(keyword.currentPosition) || 5;
              const targetPosition = Math.max(1, currentPosition - 2);
              const searchVolume = Number(keyword.searchVolume) || 0;
              const avgTicketCalc = Number(avgTicket) || 45;
              
              if (searchVolume <= 0) return null;
              
              const getCTR = (position: number) => {
                const ctrRates = { 1: 0.25, 2: 0.18, 3: 0.12, 4: 0.08, 5: 0.05, 6: 0.03, 7: 0.02, 8: 0.01, 9: 0.01, 10: 0.01 };
                return ctrRates[position as keyof typeof ctrRates] || 0.005;
              };
              
              const conversionRate = 0.25;
              const currentRevenue = Math.floor(searchVolume * getCTR(currentPosition) * conversionRate * avgTicketCalc) || 0;
              const targetRevenue = Math.floor(searchVolume * getCTR(targetPosition) * conversionRate * avgTicketCalc) || 0;
              const improvementRevenue = Math.max(0, targetRevenue - currentRevenue) || 0;
              
              return {
                ...keyword,
                currentPosition,
                targetPosition,
                searchVolume,
                improvementRevenue
              };
            })
            .filter(Boolean)
            .sort((a, b) => (b?.improvementRevenue || 0) - (a?.improvementRevenue || 0))
            .slice(0, 5) // Show top 5 opportunities
            .map((keyword, index) => {
              if (!keyword) return null;
              
              const seoLever = levers.find(l => l.id === 'seo');
              const showOptimized = seoLever?.isActive;
              
              return (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 100px 100px 120px 140px',
                  gap: '15px',
                  alignItems: 'center',
                  padding: '18px 20px',
                  backgroundColor: showOptimized ? '#f0f9ff' : 'white',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: showOptimized ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {keyword.keyword}
                    {index < 2 && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        backgroundColor: index === 0 ? '#dc2626' : '#f59e0b',
                        color: 'white',
                        fontSize: '10px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        {index === 0 ? 'HIGH IMPACT' : 'QUICK WIN'}
                      </span>
                    )}
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: keyword.currentPosition <= 3 ? '#10b981' : keyword.currentPosition <= 10 ? '#f59e0b' : '#ef4444'
                  }}>
                    #{keyword.currentPosition}
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: showOptimized ? '#0ea5e9' : '#10b981'
                  }}>
                    #{showOptimized ? keyword.targetPosition : keyword.targetPosition}
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    {keyword.searchVolume.toLocaleString()}
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      fontWeight: '700',
                      color: showOptimized ? '#0ea5e9' : '#10b981',
                      fontSize: '16px',
                      marginBottom: '2px'
                    }}>
                      +${keyword.improvementRevenue.toLocaleString()}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#64748b'
                    }}>
                      monthly
                    </div>
                  </div>
                </div>
              );
            })}
          
          <div style={{
            marginTop: '20px',
            padding: '15px 20px',
            background: levers.find(l => l.id === 'seo')?.isActive ? 
              'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : 
              'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '8px',
            border: levers.find(l => l.id === 'seo')?.isActive ? 'none' : '1px solid #e2e8f0',
            color: levers.find(l => l.id === 'seo')?.isActive ? 'white' : '#334155'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {levers.find(l => l.id === 'seo')?.isActive ? 
                    '✓ SEO Optimization Active' : 
                    'Total SEO Opportunity'
                  }
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {levers.find(l => l.id === 'seo')?.isActive ?
                    'Rankings improved, revenue flowing' :
                    'Additional monthly revenue potential'
                  }
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700'
              }}>
                +${restaurantData.keywords
                  .slice(0, 5)
                  .reduce((total, keyword) => {
                    if (!keyword || typeof keyword !== 'object') return total;
                    
                    const currentPosition = Number(keyword.currentPosition) || 5;
                    const targetPosition = Math.max(1, currentPosition - 2);
                    const searchVolume = Number(keyword.searchVolume) || 0;
                    const avgTicketCalc = Number(avgTicket) || 45;
                    
                    if (searchVolume <= 0) return total;
                    
                    const getCTR = (position: number) => {
                      const ctrRates = { 1: 0.25, 2: 0.18, 3: 0.12, 4: 0.08, 5: 0.05, 6: 0.03, 7: 0.02, 8: 0.01, 9: 0.01, 10: 0.01 };
                      return ctrRates[position as keyof typeof ctrRates] || 0.005;
                    };
                    
                    const conversionRate = 0.25;
                    const currentRevenue = Math.floor(searchVolume * getCTR(currentPosition) * conversionRate * avgTicketCalc) || 0;
                    const targetRevenue = Math.floor(searchVolume * getCTR(targetPosition) * conversionRate * avgTicketCalc) || 0;
                    const improvement = Math.max(0, targetRevenue - currentRevenue) || 0;
                    
                    return total + improvement;
                  }, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default DualRevenueVisualization;