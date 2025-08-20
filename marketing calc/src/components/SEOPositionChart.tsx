import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { restaurantBenchmarks } from '../data/restaurantStats';

interface SEOPositionChartProps {
  width?: number;
  height?: number;
  currentPosition?: number;
}

const SEOPositionChart: React.FC<SEOPositionChartProps> = ({ 
  width = 600, 
  height = 400,
  currentPosition = 3
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = restaurantBenchmarks.seo.localPackCTR;

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.position.toString()))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.ctr) || 0])
      .range([innerHeight, 0]);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.position.toString()) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.ctr))
      .attr('height', d => innerHeight - yScale(d.ctr))
      .attr('fill', d => d.position === currentPosition ? '#ff6b6b' : '#4ecdc4')
      .attr('stroke', d => d.position === currentPosition ? '#ff5252' : 'none')
      .attr('stroke-width', 2);

    // Value labels on bars
    g.selectAll('.label')
      .data(data)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.position.toString()) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.ctr) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(d => `${d.ctr}%`);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 35)
      .style('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '14px')
      .text('Local Pack Position');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '14px')
      .text('Click-Through Rate (%)');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Local Pack CTR by Position');

    // Current position indicator
    if (currentPosition <= 3) {
      g.append('text')
        .attr('x', (xScale(currentPosition.toString()) || 0) + xScale.bandwidth() / 2)
        .attr('y', innerHeight + 25)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#ff6b6b')
        .style('font-weight', 'bold')
        .text('Your Position');
    }

  }, [width, height, currentPosition]);

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default SEOPositionChart;