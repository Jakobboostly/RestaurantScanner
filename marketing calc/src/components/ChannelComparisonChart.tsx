import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { restaurantBenchmarks } from '../data/restaurantStats';

interface ChannelData {
  channel: string;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  color: string;
}

interface ChannelComparisonChartProps {
  width?: number;
  height?: number;
}

const ChannelComparisonChart: React.FC<ChannelComparisonChartProps> = ({ 
  width = 800, 
  height = 400 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 60, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data: ChannelData[] = [
      {
        channel: 'SMS',
        openRate: restaurantBenchmarks.sms.openRate,
        clickRate: restaurantBenchmarks.sms.clickRate,
        conversionRate: 30, // Estimated from clicks
        color: '#4CAF50'
      },
      {
        channel: 'Email',
        openRate: restaurantBenchmarks.email.openRate,
        clickRate: restaurantBenchmarks.email.clickRate,
        conversionRate: restaurantBenchmarks.email.conversionRate,
        color: '#2196F3'
      }
    ];

    const metrics = ['openRate', 'clickRate', 'conversionRate'];
    const metricLabels = ['Open Rate (%)', 'Click Rate (%)', 'Conversion Rate (%)'];

    const xScale = d3.scaleBand()
      .domain(metrics)
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    const channelScale = d3.scaleBand()
      .domain(data.map(d => d.channel))
      .range([0, xScale.bandwidth()])
      .padding(0.1);

    // Create bars for each metric and channel
    metrics.forEach((metric, metricIndex) => {
      const metricGroup = g.append('g')
        .attr('transform', `translate(${xScale(metric)},0)`);

      data.forEach(channelData => {
        const value = channelData[metric as keyof ChannelData] as number;
        
        metricGroup.append('rect')
          .attr('x', channelScale(channelData.channel) || 0)
          .attr('width', channelScale.bandwidth())
          .attr('y', yScale(value))
          .attr('height', innerHeight - yScale(value))
          .attr('fill', channelData.color)
          .attr('opacity', 0.8);

        // Value labels
        metricGroup.append('text')
          .attr('x', (channelScale(channelData.channel) || 0) + channelScale.bandwidth() / 2)
          .attr('y', yScale(value) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .style('fill', '#333')
          .text(`${value}%`);
      });
    });

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d, i) => metricLabels[i]))
      .selectAll('text')
      .style('font-size', '12px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '14px')
      .text('Performance (%)');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 90}, 40)`);

    data.forEach((d, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d.color);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .style('fill', '#333')
        .text(d.channel);
    });

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('SMS vs Email Marketing Performance');

  }, [width, height]);

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default ChannelComparisonChart;