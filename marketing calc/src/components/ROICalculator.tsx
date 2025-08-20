import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { channelROICalculators } from '../data/restaurantStats';

interface ROIResult {
  channel: string;
  monthlyROI: number;
  annualROI: number;
  color: string;
}

const ROICalculator: React.FC = () => {
  const [inputs, setInputs] = useState({
    monthlySearches: 1000,
    currentPosition: 3,
    targetPosition: 1,
    avgTicket: 25,
    smsListSize: 500,
    campaignsPerMonth: 4,
    currentCustomers: 200,
    loyaltyEnrollment: 50,
    visitsPerMonth: 2
  });

  const [roiResults, setROIResults] = useState<ROIResult[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
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

    setROIResults([
      { channel: 'SEO Improvement', monthlyROI: seoROI, annualROI: seoROI * 12, color: '#4CAF50' },
      { channel: 'SMS Marketing', monthlyROI: smsROI, annualROI: smsROI * 12, color: '#2196F3' },
      { channel: 'Loyalty Program', monthlyROI: loyaltyROI, annualROI: loyaltyROI * 12, color: '#FF9800' }
    ]);
  }, [inputs]);

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
          <h4 style={{ marginBottom: '15px', color: '#666' }}>SMS & Loyalty Inputs</h4>
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
        </div>
      </div>

      <svg ref={svgRef} width={600} height={300}></svg>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '10px', color: '#666' }}>Annual ROI Projections</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          {roiResults.map(result => (
            <div key={result.channel} style={{ 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              borderLeft: `4px solid ${result.color}`
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{result.channel}</div>
              <div style={{ fontSize: '18px', color: result.color, fontWeight: 'bold' }}>
                ${Math.round(result.annualROI).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>per year</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;