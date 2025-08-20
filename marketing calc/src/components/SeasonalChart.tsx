import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { restaurantBenchmarks } from '../data/restaurantStats';

interface SeasonalChartProps {
  width?: number;
  height?: number;
}

const SeasonalChart: React.FC<SeasonalChartProps> = ({ 
  width = 700, 
  height = 400 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 30, bottom: 100, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const dayData = restaurantBenchmarks.seasonal.dayOfWeek;

    const xScale = d3.scaleBand()
      .domain(dayData.map(d => d.day))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0.5, d3.max(dayData, d => d.multiplier) || 1.5])
      .range([innerHeight, 0]);

    // Baseline at 1.0
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(1))
      .attr('y2', yScale(1))
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', yScale(1) - 5)
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Baseline (1.0x)');

    // Bars
    g.selectAll('.bar')
      .data(dayData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.day) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.multiplier))
      .attr('height', d => Math.abs(yScale(d.multiplier) - yScale(1)))
      .attr('fill', d => d.multiplier > 1 ? '#4CAF50' : '#f44336')
      .attr('opacity', 0.8);

    // Value labels
    g.selectAll('.label')
      .data(dayData)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.day) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => d.multiplier > 1 ? yScale(d.multiplier) - 5 : yScale(d.multiplier) + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(d => `${d.multiplier}x`);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}x`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '14px')
      .text('Traffic Multiplier');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Day of Week Traffic Multipliers');

    // Holiday insights
    const holidayData = restaurantBenchmarks.seasonal.holidays;
    const holidaySection = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${height - 80})`);

    holidaySection.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Holiday Traffic Boosts:');

    holidayData.forEach((holiday, i) => {
      holidaySection.append('text')
        .attr('x', 0)
        .attr('y', 20 + i * 15)
        .style('font-size', '12px')
        .style('fill', '#666')
        .text(`${holiday.name}: +${holiday.increase}%`);
    });

    // Weekly pattern insights
    const insightSection = svg.append('g')
      .attr('transform', `translate(${width - 200}, ${height - 80})`);

    insightSection.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Key Insights:');

    const insights = [
      'Weekend = 40-50% higher traffic',
      'Friday-Saturday are peak days',
      'Tuesday is the slowest day'
    ];

    insights.forEach((insight, i) => {
      insightSection.append('text')
        .attr('x', 0)
        .attr('y', 20 + i * 15)
        .style('font-size', '12px')
        .style('fill', '#666')
        .text(`• ${insight}`);
    });

  }, [width, height]);

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default SeasonalChart;