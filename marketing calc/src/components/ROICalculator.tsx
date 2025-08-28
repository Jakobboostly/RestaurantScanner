import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { channelROICalculators } from '../data/restaurantStats';
import { calculateUnifiedRevenue, RevenueCalculationInputs } from '../services/revenueCalculations';

interface ROIResult {
  channel: string;
  monthlyROI: number;
  annualROI: number;
  color: string;
  attribution?: string;
  confidence?: 'High' | 'Medium' | 'Low';
}

interface ROICalculatorProps {
  restaurantData?: RevenueCalculationInputs;
}

const ROICalculator: React.FC<ROICalculatorProps> = ({ restaurantData }) => {
  const [inputs, setInputs] = useState({
    monthlySearches: restaurantData ? restaurantData.monthlyTransactions * 2.5 : 1000,
    currentPosition: restaurantData?.currentLocalPackPosition || 3,
    targetPosition: 1,
    avgTicket: restaurantData?.avgTicket || 25,
    smsListSize: restaurantData?.smsListSize || 500,
    campaignsPerMonth: 4,
    currentCustomers: restaurantData ? restaurantData.monthlyTransactions * 0.2 : 200,
    loyaltyEnrollment: 50,
    visitsPerMonth: 2,
    emailListSize: restaurantData?.emailListSize || 1000,
    socialFollowers: restaurantData ? (restaurantData.socialFollowersInstagram + restaurantData.socialFollowersFacebook) : 2000,
    directMailRadius: 5,
    directMailFrequency: 1,
    thirdPartyOrders: 300
  });

  const [roiResults, setROIResults] = useState<ROIResult[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // If we have restaurant data, use unified calculations
    if (restaurantData) {
      const unifiedCalcs = calculateUnifiedRevenue(restaurantData);
      
      const seoROI = unifiedCalcs.seo.additionalRevenue;
      const smsROI = unifiedCalcs.sms.additionalRevenue;
      const socialROI = unifiedCalcs.social.additionalRevenue;
      
      // Keep loyalty as is for now (not part of main 3 services)
      const loyaltyROI = channelROICalculators.calculateLoyaltyROI(
        inputs.currentCustomers,
        inputs.loyaltyEnrollment,
        inputs.avgTicket,
        inputs.visitsPerMonth
      );
      
      // These are supplementary channels, keep as is
      const emailROI = inputs.emailListSize * 0.284 * 0.042 * 0.028 * inputs.avgTicket * 4;
      const directMailHouseholds = Math.PI * Math.pow(inputs.directMailRadius, 2) * 500;
      const directMailROI = directMailHouseholds * 0.0296 * inputs.avgTicket * inputs.directMailFrequency * 0.2;
      const thirdPartyRevenue = inputs.thirdPartyOrders * inputs.avgTicket;
      const thirdPartyCommission = thirdPartyRevenue * 0.225;
      const thirdPartyNetROI = thirdPartyRevenue - thirdPartyCommission;
      
      setROIResults([
        { 
          channel: 'SEO Improvement', 
          monthlyROI: seoROI, 
          annualROI: seoROI * 12, 
          color: '#4CAF50',
          attribution: '70% Local Pack, 30% Organic',
          confidence: 'High'
        },
        { 
          channel: 'SMS Marketing', 
          monthlyROI: smsROI, 
          annualROI: smsROI * 12, 
          color: '#2196F3',
          attribution: '98% open, 19.5% CTR',
          confidence: 'High'
        },
        { 
          channel: 'Social Media', 
          monthlyROI: socialROI, 
          annualROI: socialROI * 12, 
          color: '#E91E63',
          attribution: 'Instagram + Facebook growth',
          confidence: 'High'
        },
        { 
          channel: 'Loyalty Program', 
          monthlyROI: loyaltyROI, 
          annualROI: loyaltyROI * 12, 
          color: '#FF9800',
          attribution: '20% higher spend & frequency',
          confidence: 'Medium'
        },
        {
          channel: 'Email Marketing',
          monthlyROI: emailROI,
          annualROI: emailROI * 12,
          color: '#9C27B0',
          attribution: '28.4% open, 4.2% CTR',
          confidence: 'Low'
        },
        {
          channel: 'Direct Mail',
          monthlyROI: directMailROI,
          annualROI: directMailROI * 12,
          color: '#795548',
          attribution: '2.96% response rate',
          confidence: 'Low'
        },
        {
          channel: 'Third-Party Delivery',
          monthlyROI: thirdPartyNetROI,
          annualROI: thirdPartyNetROI * 12,
          color: '#F44336',
          attribution: '65% new customer discovery',
          confidence: 'Medium'
        }
      ].filter(r => r.monthlyROI > 0));
    } else {
      // Fallback to original calculations if no restaurant data
      const seoROI = channelROICalculators.calculateSEOROI(
        inputs.monthlySearches,
        inputs.currentPosition,
        inputs.targetPosition,
        inputs.avgTicket
      );

      const smsROI = channelROICalculators.calculateSMSROI(
        inputs.smsListSize,
        inputs.campaignsPerMonth,
        inputs.avgTicket
      );

      const loyaltyROI = channelROICalculators.calculateLoyaltyROI(
        inputs.currentCustomers,
        inputs.loyaltyEnrollment,
        inputs.avgTicket,
        inputs.visitsPerMonth
      );

      // Email Marketing ROI (28.4% open, 4.2% CTR, 2.8% conversion)
      const emailROI = inputs.emailListSize * 0.284 * 0.042 * 0.028 * inputs.avgTicket * 4; // 4 campaigns/month
      
      // Social Media ROI (Influencer marketing $6.50 per $1 spent)
      const socialROI = (inputs.socialFollowers * 0.02 * inputs.avgTicket * 0.1); // Conservative 2% monthly conversion
      
      // Direct Mail ROI (2.96% response rate)
      const directMailHouseholds = Math.PI * Math.pow(inputs.directMailRadius, 2) * 500; // ~500 households per sq mile
      const directMailROI = directMailHouseholds * 0.0296 * inputs.avgTicket * inputs.directMailFrequency * 0.2; // 20% become repeat customers
      
      // Third-Party Delivery Revenue (minus 15-30% commission)
      const thirdPartyRevenue = inputs.thirdPartyOrders * inputs.avgTicket;
      const thirdPartyCommission = thirdPartyRevenue * 0.225; // Average 22.5% commission
      const thirdPartyNetROI = thirdPartyRevenue - thirdPartyCommission;

      setROIResults([
        { 
          channel: 'SEO Improvement', 
          monthlyROI: seoROI, 
          annualROI: seoROI * 12, 
          color: '#4CAF50',
          attribution: '70% Local Pack, 30% Organic',
          confidence: 'High'
        },
        { 
          channel: 'SMS Marketing', 
          monthlyROI: smsROI, 
          annualROI: smsROI * 12, 
          color: '#2196F3',
          attribution: '98% open, 19.5% CTR',
          confidence: 'High'
        },
        { 
          channel: 'Loyalty Program', 
          monthlyROI: loyaltyROI, 
          annualROI: loyaltyROI * 12, 
          color: '#FF9800',
          attribution: '20% higher spend & frequency',
          confidence: 'High'
        },
        {
          channel: 'Email Marketing',
          monthlyROI: emailROI,
          annualROI: emailROI * 12,
          color: '#9C27B0',
          attribution: '28.4% open, 4.2% CTR',
          confidence: 'Medium'
        },
        {
          channel: 'Social Media',
          monthlyROI: socialROI,
          annualROI: socialROI * 12,
          color: '#00BCD4',
          attribution: '$6.50 per $1 spent on influencers',
          confidence: 'Medium'
        },
        {
          channel: 'Direct Mail',
          monthlyROI: directMailROI,
          annualROI: directMailROI * 12,
          color: '#795548',
          attribution: '2.96% response rate',
          confidence: 'Low'
        },
        {
          channel: 'Third-Party Delivery',
          monthlyROI: thirdPartyNetROI,
          annualROI: thirdPartyNetROI * 12,
          color: '#F44336',
          attribution: '65% new customer discovery',
          confidence: 'High'
        }
      ].filter(r => r.monthlyROI > 0));
    }
  }, [inputs, restaurantData]);

  useEffect(() => {
    if (!svgRef.current || roiResults.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(roiResults.map(d => d.channel))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(roiResults, d => d.monthlyROI) || 0])
      .range([innerHeight, 0]);

    // Bars
    g.selectAll('.bar')
      .data(roiResults)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.channel) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.monthlyROI))
      .attr('height', d => innerHeight - yScale(d.monthlyROI))
      .attr('fill', d => d.color)
      .attr('opacity', 0.8);

    // Value labels
    g.selectAll('.label')
      .data(roiResults)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.channel) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.monthlyROI) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(d => `$${Math.round(d.monthlyROI).toLocaleString()}`);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '11px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `$${d3.format('.0s')(d as number)}`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '14px')
      .text('Monthly ROI ($)');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Projected Monthly ROI by Channel');

  }, [roiResults]);

  const handleInputChange = (field: string, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>ROI Calculator</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h4 style={{ marginBottom: '15px', color: '#666' }}>SEO Inputs</h4>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Monthly Searches:</label>
            <input
              type="number"
              value={inputs.monthlySearches}
              onChange={(e) => handleInputChange('monthlySearches', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Current Position:</label>
            <select
              value={inputs.currentPosition}
              onChange={(e) => handleInputChange('currentPosition', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Target Position:</label>
            <select
              value={inputs.targetPosition}
              onChange={(e) => handleInputChange('targetPosition', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Average Ticket ($):</label>
            <input
              type="number"
              value={inputs.avgTicket}
              onChange={(e) => handleInputChange('avgTicket', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '15px', color: '#666' }}>Marketing Channels</h4>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>SMS List Size:</label>
            <input
              type="number"
              value={inputs.smsListSize}
              onChange={(e) => handleInputChange('smsListSize', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Campaigns/Month:</label>
            <input
              type="number"
              value={inputs.campaignsPerMonth}
              onChange={(e) => handleInputChange('campaignsPerMonth', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Current Customers:</label>
            <input
              type="number"
              value={inputs.currentCustomers}
              onChange={(e) => handleInputChange('currentCustomers', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Loyalty Enrollment (%):</label>
            <input
              type="number"
              value={inputs.loyaltyEnrollment}
              onChange={(e) => handleInputChange('loyaltyEnrollment', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email List Size:</label>
            <input
              type="number"
              value={inputs.emailListSize}
              onChange={(e) => handleInputChange('emailListSize', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Social Followers:</label>
            <input
              type="number"
              value={inputs.socialFollowers}
              onChange={(e) => handleInputChange('socialFollowers', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Third-Party Orders/Month:</label>
            <input
              type="number"
              value={inputs.thirdPartyOrders}
              onChange={(e) => handleInputChange('thirdPartyOrders', Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      <svg ref={svgRef} width={600} height={300}></svg>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '10px', color: '#666' }}>Annual ROI Projections with Attribution</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {roiResults.map(result => (
            <div key={result.channel} style={{ 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              borderLeft: `4px solid ${result.color}`,
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: result.confidence === 'High' ? '#4CAF50' : 
                                result.confidence === 'Medium' ? '#FF9800' : '#9E9E9E',
                color: 'white'
              }}>
                {result.confidence}
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{result.channel}</div>
              <div style={{ fontSize: '18px', color: result.color, fontWeight: 'bold' }}>
                ${Math.round(result.annualROI).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>per year</div>
              {result.attribution && (
                <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                  {result.attribution}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '6px',
          border: '1px solid #ffc107'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>Attribution Methodology</h5>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#856404' }}>
            <li><strong>High Confidence:</strong> Based on industry-standard benchmarks with proven ROI</li>
            <li><strong>Medium Confidence:</strong> Estimated from industry averages, results may vary</li>
            <li><strong>Low Confidence:</strong> Rough estimates, highly dependent on execution</li>
            <li>Local Pack drives 70% of search traffic, Organic drives 30%</li>
            <li>Multi-channel attribution effects can increase total ROI by 10-15%</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;