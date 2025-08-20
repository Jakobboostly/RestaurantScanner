import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { restaurantBenchmarks } from '../data/restaurantStats';
import AdvancedSEOCalculator from './AdvancedSEOCalculator';
import FloatingBubbles from './FloatingBubbles';
import RevenueLeverSystem from './RevenueLeverSystem';

interface RestaurantData {
  monthlyRevenue: number;
  avgTicket: number;
  monthlyTransactions: number;
  
  // Current marketing channels
  hasWebsite: boolean;
  socialFollowersInstagram: number;
  socialFollowersFacebook: number;
  postsPerWeek: number;
  emailListSize: number;
  smsListSize: number;
  currentLocalPackPosition: number;
  currentOrganicPosition: number;
  usesDirectMail: boolean;
  mailerFrequency: number; // per month
}

interface ChannelGap {
  channel: string;
  currentRevenue: number;
  potentialRevenue: number;
  gap: number;
  confidence: 'High' | 'Medium' | 'Low';
  serviceOffered: boolean;
  color: string;
}

const SalesDemoTool: React.FC = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RestaurantData>({
    monthlyRevenue: 75000,
    avgTicket: 25,
    monthlyTransactions: 3000,
    hasWebsite: true,
    socialFollowersInstagram: 1200,
    socialFollowersFacebook: 800,
    postsPerWeek: 3,
    emailListSize: 0,
    smsListSize: 0,
    currentLocalPackPosition: 4,
    currentOrganicPosition: 8,
    usesDirectMail: true,
    mailerFrequency: 1
  });

  const [gaps, setGaps] = useState<ChannelGap[]>([]);
  const [seoROI, setSeoROI] = useState(0);
  const [seoBreakdown, setSeoBreakdown] = useState<any>(null);

  const handleSEOCalculation = (roi: number, breakdown: any) => {
    setSeoROI(roi);
    setSeoBreakdown(breakdown);
  };

  const calculateChannelGaps = () => {
    const revenue = data.monthlyRevenue;
    const transactions = data.monthlyTransactions;
    
    // SEO Gap Analysis - Local Pack (70%) + Organic (30%) attribution
    const estimatedSearches = transactions * 2.5; // Based on your data
    
    // Local Pack analysis (70% of search traffic)
    const localPackSearches = estimatedSearches * 0.7;
    const currentLocalCTR = data.currentLocalPackPosition <= 3 
      ? restaurantBenchmarks.seo.localPackCTR.find(p => p.position === data.currentLocalPackPosition)?.ctr || 0
      : data.currentLocalPackPosition <= 4 ? 5 : 0;
    const targetLocalCTR = 33; // Position #1
    
    // Organic analysis (30% of search traffic)  
    const organicSearches = estimatedSearches * 0.3;
    const currentOrganicCTR = data.currentOrganicPosition <= 5
      ? restaurantBenchmarks.seo.organicCTR.find(p => p.position === data.currentOrganicPosition)?.ctr || 0
      : data.currentOrganicPosition <= 7 ? 0.5 : 0.3;
    const targetOrganicCTR = 18; // Position #1
    
    // Combined SEO gap calculation
    const localPackGap = localPackSearches * (targetLocalCTR - currentLocalCTR) / 100 * (restaurantBenchmarks.seo.conversionRate / 100) * data.avgTicket;
    const organicGap = organicSearches * (targetOrganicCTR - currentOrganicCTR) / 100 * (restaurantBenchmarks.seo.conversionRate / 100) * data.avgTicket;
    const seoGapRevenue = Math.max(0, localPackGap + organicGap + (seoROI || 0));

    // Social Media Gap Analysis
    const instagramPotential = data.socialFollowersInstagram * (restaurantBenchmarks.socialMedia.followerConversion / 100) * 0.05 * data.avgTicket; // 5% monthly conversion
    const facebookPotential = data.socialFollowersFacebook * (restaurantBenchmarks.socialMedia.followerConversion / 100) * 0.03 * data.avgTicket; // 3% monthly conversion
    const currentSocialPerformance = (data.postsPerWeek < 5) ? instagramPotential * 0.3 : instagramPotential * 0.7; // Poor posting frequency
    const socialGap = (instagramPotential + facebookPotential) - currentSocialPerformance;

    // SMS Gap Analysis (they likely have zero)
    const potentialSMSList = transactions * 0.3; // 30% of customers could opt-in
    const smsRevenue = potentialSMSList * (restaurantBenchmarks.sms.openRate / 100) * (restaurantBenchmarks.sms.clickRate / 100) * 0.25 * data.avgTicket * 4; // 4 campaigns/month
    const currentSMSRevenue = data.smsListSize * (restaurantBenchmarks.sms.openRate / 100) * (restaurantBenchmarks.sms.clickRate / 100) * 0.25 * data.avgTicket * 4;
    const smsGap = smsRevenue - currentSMSRevenue;

    // Email vs Word of Mouth attribution
    const emailPotential = potentialSMSList * (restaurantBenchmarks.email.openRate / 100) * (restaurantBenchmarks.email.clickRate / 100) * (restaurantBenchmarks.email.conversionRate / 100) * data.avgTicket * 8; // 8 campaigns/month
    const currentEmailRevenue = data.emailListSize * (restaurantBenchmarks.email.openRate / 100) * (restaurantBenchmarks.email.clickRate / 100) * (restaurantBenchmarks.email.conversionRate / 100) * data.avgTicket * 8;

    const channelGaps: ChannelGap[] = [
      {
        channel: 'SEO & Local Search',
        currentRevenue: revenue * 0.15, // Estimated current SEO contribution
        potentialRevenue: revenue * 0.15 + seoGapRevenue,
        gap: seoGapRevenue,
        confidence: 'High',
        serviceOffered: true,
        color: '#4CAF50'
      },
      {
        channel: 'Social Media Marketing',
        currentRevenue: currentSocialPerformance,
        potentialRevenue: instagramPotential + facebookPotential,
        gap: socialGap,
        confidence: 'High',
        serviceOffered: true,
        color: '#E91E63'
      },
      {
        channel: 'SMS Marketing',
        currentRevenue: currentSMSRevenue,
        potentialRevenue: smsRevenue,
        gap: smsGap,
        confidence: 'High',
        serviceOffered: true,
        color: '#2196F3'
      },
      {
        channel: 'Email Marketing',
        currentRevenue: currentEmailRevenue,
        potentialRevenue: emailPotential,
        gap: emailPotential - currentEmailRevenue,
        confidence: 'Medium',
        serviceOffered: false,
        color: '#FF9800'
      },
      {
        channel: 'Word of Mouth',
        currentRevenue: revenue * 0.4, // Assuming 40% is word of mouth
        potentialRevenue: revenue * 0.4,
        gap: 0,
        confidence: 'Low',
        serviceOffered: false,
        color: '#9E9E9E'
      }
    ];

    setGaps(channelGaps);
  };

  useEffect(() => {
    calculateChannelGaps();
  }, [data, seoROI]);

  const totalGap = gaps.filter(g => g.serviceOffered).reduce((sum, gap) => sum + gap.gap, 0);
  const totalPotential = gaps.reduce((sum, gap) => sum + gap.potentialRevenue, 0);

  if (step === 1) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating Bubbles with Restaurant Facts */}
        <FloatingBubbles />
        
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '30px',
            padding: '60px 50px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(139, 156, 244, 0.1)',
              border: '2px solid rgba(139, 156, 244, 0.3)',
              borderRadius: '8px',
              padding: '8px 20px',
              marginBottom: '40px',
              color: '#8b9cf4',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              ● LIVE • ENTERPRISE REVENUE INTELLIGENCE
            </div>

            <h1 style={{
              fontSize: '3.2rem',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '25px',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}>
              Revenue Gap Analysis
            </h1>
            
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              marginBottom: '50px',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 50px auto',
              fontWeight: '400'
            }}>
              Comprehensive marketing channel assessment with <strong>quantified opportunity identification</strong> and competitive benchmarking
            </p>

            {/* Enterprise Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              marginBottom: '50px'
            }}>
              <div style={{
                background: 'white',
                border: '2px solid #f0f0f0',
                color: '#333',
                padding: '25px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', color: '#e74c3c' }}>98%</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>SMS Open Rate</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Industry benchmark</div>
              </div>

              <div style={{
                background: 'white',
                border: '2px solid #f0f0f0',
                color: '#333',
                padding: '25px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', color: '#27ae60' }}>33%</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Local Pack Position #1 CTR</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>vs 18% Organic Position #1</div>
              </div>

              <div style={{
                background: 'white',
                border: '2px solid #f0f0f0',
                color: '#333',
                padding: '25px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', color: '#8b9cf4' }}>$15K</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Avg. Monthly Opportunity</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Per location analyzed</div>
              </div>
            </div>

            {/* Input Section with Better Design */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '30px',
              marginBottom: '40px',
              textAlign: 'left'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Monthly Revenue
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#666',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    $
                  </span>
                  <input
                    type="text"
                    value={data.monthlyRevenue.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setData({...data, monthlyRevenue: Number(value) || 0});
                    }}
                    style={{
                      width: '100%',
                      padding: '18px 24px 18px 45px',
                      border: '3px solid #f0f0f0',
                      borderRadius: '15px',
                      fontSize: '20px',
                      fontWeight: '700',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b9cf4';
                      e.target.style.background = 'white';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#f0f0f0';
                      e.target.style.background = '#fafafa';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Average Ticket Size
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#666',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    $
                  </span>
                  <input
                    type="text"
                    value={data.avgTicket.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setData({...data, avgTicket: Number(value) || 0});
                    }}
                    style={{
                      width: '100%',
                      padding: '18px 24px 18px 45px',
                      border: '3px solid #f0f0f0',
                      borderRadius: '15px',
                      fontSize: '20px',
                      fontWeight: '700',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      background: '#fafafa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b9cf4';
                      e.target.style.background = 'white';
                      e.target.style.transform = 'scale(1.02)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#f0f0f0';
                      e.target.style.background = '#fafafa';
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Calculated Transaction Display */}
            <div style={{ 
              background: '#f8f9fa',
              border: '2px solid #e9ecef',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '40px'
            }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#666',
                marginBottom: '10px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Calculated Monthly Volume
              </p>
              <p style={{
                fontSize: '2.8rem',
                fontWeight: '800',
                color: '#1a1a1a',
                margin: '0 0 5px 0'
              }}>
                {Math.round(data.monthlyRevenue / data.avgTicket).toLocaleString()}
              </p>
              <p style={{ 
                fontSize: '16px', 
                color: '#666',
                margin: '0',
                fontWeight: '500'
              }}>
                transactions per month
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                background: '#1a1a1a',
                color: 'white',
                border: '2px solid #1a1a1a',
                padding: '18px 50px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#1a1a1a';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Begin Analysis →
            </button>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '30px',
              marginTop: '25px',
              fontSize: '12px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span>• Enterprise Grade</span>
              <span>• Real-Time Data</span>
              <span>• 500+ Locations Analyzed</span>
            </div>
          </div>
        </div>

        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
          `}
        </style>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '50px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#333',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              Current Marketing Assessment
            </h2>
            
            <p style={{
              fontSize: '1.2rem',
              color: '#666',
              marginBottom: '40px',
              textAlign: 'center'
            }}>
              Help us understand your current marketing channels
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div>
                <h3 style={{ color: '#333', marginBottom: '25px', fontSize: '1.4rem' }}>Social Media</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Instagram Followers
                  </label>
                  <input
                    type="number"
                    value={data.socialFollowersInstagram}
                    onChange={(e) => setData({...data, socialFollowersInstagram: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Facebook Followers
                  </label>
                  <input
                    type="number"
                    value={data.socialFollowersFacebook}
                    onChange={(e) => setData({...data, socialFollowersFacebook: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Posts Per Week
                  </label>
                  <input
                    type="number"
                    value={data.postsPerWeek}
                    onChange={(e) => setData({...data, postsPerWeek: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <h3 style={{ color: '#333', marginBottom: '25px', fontSize: '1.4rem' }}>Other Channels</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Local Pack Position (Google Maps)
                  </label>
                  <select
                    value={data.currentLocalPackPosition}
                    onChange={(e) => setData({...data, currentLocalPackPosition: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value={1}>Position #1 (33% CTR)</option>
                    <option value={2}>Position #2 (22% CTR)</option>
                    <option value={3}>Position #3 (13% CTR)</option>
                    <option value={4}>Position #4+ (5% CTR)</option>
                    <option value={10}>Not in Local Pack (0% CTR)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Organic Search Position
                  </label>
                  <select
                    value={data.currentOrganicPosition}
                    onChange={(e) => setData({...data, currentOrganicPosition: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value={1}>Position #1 (18% CTR)</option>
                    <option value={2}>Position #2 (7% CTR)</option>
                    <option value={3}>Position #3 (3% CTR)</option>
                    <option value={4}>Position #4 (2% CTR)</option>
                    <option value={5}>Position #5 (1.5% CTR)</option>
                    <option value={7}>Position #6-7 (&lt;1% CTR)</option>
                    <option value={15}>Position #8+ (0.5% CTR)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Email List Size
                  </label>
                  <input
                    type="number"
                    value={data.emailListSize}
                    onChange={(e) => setData({...data, emailListSize: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    SMS List Size
                  </label>
                  <input
                    type="number"
                    value={data.smsListSize}
                    onChange={(e) => setData({...data, smsListSize: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    Direct Mail Frequency (per month)
                  </label>
                  <input
                    type="number"
                    value={data.mailerFrequency}
                    onChange={(e) => setData({...data, mailerFrequency: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '18px 50px',
                  borderRadius: '50px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(139, 156, 244, 0.4)',
                  transition: 'transform 0.3s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Show My Revenue Opportunities →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Summary */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#333',
            marginBottom: '20px'
          }}>
            Revenue Opportunity Analysis
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Current Monthly Revenue</p>
              <p style={{ fontSize: '2.2rem', fontWeight: '700', color: '#333', margin: '0' }}>
                ${data.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Potential Additional Revenue</p>
              <p style={{ fontSize: '2.2rem', fontWeight: '700', color: '#4CAF50', margin: '0' }}>
                +${Math.round(totalGap).toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Upside</p>
              <p style={{ fontSize: '2.2rem', fontWeight: '700', color: '#2196F3', margin: '0' }}>
                {Math.round((totalGap / data.monthlyRevenue) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Revenue Lever System */}
        <RevenueLeverSystem 
          monthlyRevenue={data.monthlyRevenue}
          avgTicket={data.avgTicket}
          monthlyTransactions={Math.round(data.monthlyRevenue / data.avgTicket)}
        />

        {/* Methodology Overview */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#333',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            📊 How We Calculate Your Revenue Opportunities
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: '#f8f9fa',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #e9ecef'
            }}>
              <h4 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#4CAF50',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center'
              }}>
                🔍 SEO & Local Search Attribution
              </h4>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#333',
                margin: '0'
              }}>
                We use the industry-standard <strong>70% Local Pack / 30% Organic search</strong> traffic split. 
                Position-specific CTR rates from Google studies: Local Pack #1 (33%), #2 (22%), #3 (13%). 
                Organic #1 (18%), #2 (7%), #3 (3%). Applied to your estimated search volume with 5% conversion rate.
              </p>
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #e9ecef'
            }}>
              <h4 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#2196F3',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center'
              }}>
                💬 SMS Marketing ROI
              </h4>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#333',
                margin: '0'
              }}>
                Based on F&B industry's <strong>98% SMS open rate</strong> (highest of any channel), 19-20% CTR, 
                and 25% conversion. Assumes 30% opt-in rate from your customer base. 
                SMS delivers <strong>10x higher redemption</strong> than traditional coupons.
              </p>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '15px',
              margin: '0 0 15px 0'
            }}>
              📈 Data Sources & Validation
            </h4>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.5',
              margin: '0',
              opacity: '0.95'
            }}>
              All calculations based on 2024 industry reports: Google Local Search Study, SMS Marketing Benchmark Report, 
              Restaurant Social Media Analysis, and Mobile Marketing Association F&B data. 
              Methodology validated across <strong>500+ restaurant locations</strong> in our client base.
            </p>
          </div>
        </div>

        {/* Advanced SEO Analysis */}
        <AdvancedSEOCalculator 
          avgTicket={data.avgTicket}
          onROICalculated={handleSEOCalculation}
        />

        {/* Channel Gap Analysis */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#333', marginBottom: '30px' }}>
            Marketing Channel Performance vs. Industry Potential
          </h3>

          {gaps.map((gap, index) => (
            <div key={gap.channel} style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 150px 100px',
              alignItems: 'center',
              padding: '20px 0',
              borderBottom: index < gaps.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '5px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: gap.color,
                    marginRight: '10px'
                  }}></div>
                  <span style={{ fontWeight: '600', color: '#333' }}>{gap.channel}</span>
                  {gap.serviceOffered && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      We Offer
                    </span>
                  )}
                </div>
              </div>

              <div style={{ position: 'relative', height: '40px' }}>
                {/* Current Performance Bar */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  height: '18px',
                  width: `${Math.min((gap.currentRevenue / totalPotential) * 100, 100)}%`,
                  backgroundColor: gap.color,
                  borderRadius: '9px',
                  opacity: 0.7
                }}></div>
                
                {/* Potential Performance Bar */}
                <div style={{
                  position: 'absolute',
                  top: '22px',
                  left: '0',
                  height: '18px',
                  width: `${Math.min((gap.potentialRevenue / totalPotential) * 100, 100)}%`,
                  backgroundColor: gap.color,
                  borderRadius: '9px',
                  opacity: 0.3,
                  border: `2px solid ${gap.color}`
                }}></div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  ${Math.round(gap.currentRevenue).toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  / ${Math.round(gap.potentialRevenue).toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {gap.gap > 0 && (
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: gap.serviceOffered ? '#4CAF50' : '#FF9800'
                  }}>
                    +${Math.round(gap.gap).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Service Recommendations */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {gaps.filter(g => g.serviceOffered && g.gap > 0).map(gap => (
            <div key={gap.channel} style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              border: `3px solid ${gap.color}`,
              textAlign: 'center'
            }}>
              <h4 style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                color: '#333',
                marginBottom: '15px'
              }}>
                {gap.channel}
              </h4>
              
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: gap.color,
                marginBottom: '10px'
              }}>
                +${Math.round(gap.gap).toLocaleString()}
              </div>
              
              <p style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '20px'
              }}>
                Additional monthly revenue potential
              </p>

              <div style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#333'
              }}>
                ${Math.round(gap.gap * 12).toLocaleString()}/year
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          marginTop: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#333',
            marginBottom: '20px'
          }}>
            Ready to Capture This Revenue?
          </h3>
          
          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: '30px'
          }}>
            We specialize in SEO, Social Media Marketing, and SMS campaigns that deliver these exact results.
          </p>

          <button
            onClick={() => setStep(1)}
            style={{
              background: 'linear-gradient(135deg, #8b9cf4 0%, #a97fc4 100%)',
              color: 'white',
              border: 'none',
              padding: '20px 60px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
              marginRight: '20px',
              outline: 'none'
            }}
          >
            Schedule Strategy Call
          </button>

          <button
            onClick={() => setStep(1)}
            style={{
              background: 'transparent',
              color: '#8b9cf4',
              border: '2px solid #8b9cf4',
              padding: '20px 60px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Analyze Another Restaurant
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesDemoTool;