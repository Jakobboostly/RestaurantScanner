import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { calculateUnifiedRevenue, RevenueCalculationInputs } from '../services/revenueCalculations';

interface MonthlyForecastChartProps {
  currentRevenue: number;
  leverStates: {[key: string]: boolean};
  monthlyGrowthPotential?: number;
  restaurantData?: RevenueCalculationInputs;
  leverData?: Array<{
    id: string;
    currentRevenue: number;
    potentialRevenue: number;
    isActive: boolean;
  }>;
  onMonth12DataChange?: (data: {
    baseline: number;
    optimized: number;
    difference: number;
    percentageGrowth: number;
  }) => void;
}

const MonthlyForecastChart: React.FC<MonthlyForecastChartProps> = ({
  currentRevenue,
  leverStates,
  monthlyGrowthPotential = 0,
  restaurantData,
  leverData,
  onMonth12DataChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Define months array outside to be accessible everywhere
  const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];

  // Generate monthly data using useMemo to make it accessible to calculateMetrics
  const { baselineData, optimizedData } = useMemo(() => {
    
    const baselineData = months.map((month, i) => ({
      month,
      monthIndex: i,
      revenue: currentRevenue * (1 + (0.005 * i)) // 0.5% monthly growth (realistic without marketing investment)
    }));

    // Use actual lever calculations for optimized data
    const optimizedData = months.map((month, i) => {
      // Base revenue with natural growth
      const baseWithGrowth = currentRevenue * (1 + (0.005 * i)); // 0.5% monthly growth
      
      // If no levers active, same as baseline
      if (!leverData || leverData.length === 0 || !leverData.some(l => l.isActive)) {
        return {
          month,
          monthIndex: i,
          revenue: baseWithGrowth
        };
      }
      
      // Calculate additional revenue from active levers
      const additionalRevenue = leverData.reduce((sum, lever) => {
        if (lever.isActive) {
          // Gradual ramp up to full potential by month 6, then steady
          const rampUpFactor = i <= 6 ? (i / 6) : 1;
          return sum + ((lever.potentialRevenue - lever.currentRevenue) * rampUpFactor);
        }
        return sum;
      }, 0);
      
      return {
        month,
        monthIndex: i,
        revenue: baseWithGrowth + additionalRevenue
      };
    });

    return { baselineData, optimizedData };
  }, [currentRevenue, leverData]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 680;
    const height = 300;
    const margin = { top: 20, right: 60, bottom: 40, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add gradient definitions
    const defs = svg.append('defs');
    
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', innerHeight);
    
    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.3);
    
    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.05);


    // Calculate cumulative additional revenue
    const additionalRevenue = optimizedData.reduce((sum, d, i) => 
      sum + (d.revenue - baselineData[i].revenue), 0
    );

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, 11])
      .range([0, innerWidth]);

    // Fixed Y-axis scale with $20k increments for consistent visual impact
    const maxRevenue = Math.max(
      d3.max(optimizedData, d => d.revenue) || 0,
      d3.max(baselineData, d => d.revenue) || 0,
      currentRevenue
    );
    
    const minRevenue = Math.min(
      d3.min(baselineData, d => d.revenue) || currentRevenue,
      currentRevenue
    );
    
    // Round to nearest 20k increments
    const yMin = Math.floor(minRevenue * 0.8 / 20000) * 20000;
    const yMax = Math.ceil(maxRevenue * 1.05 / 20000) * 20000;
    
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    // Line generators
    const lineGenerator = d3.line<any>()
      .x(d => xScale(d.monthIndex))
      .y(d => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    // Area generator for the gap
    const areaGenerator = d3.area<any>()
      .x((d, i) => xScale(i))
      .y0(d => yScale(baselineData[d.monthIndex].revenue))
      .y1(d => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Fill area between lines
    g.append('path')
      .datum(optimizedData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', areaGenerator);

    // Baseline line
    g.append('path')
      .datum(baselineData)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', lineGenerator);

    // Optimized line
    const optimizedLine = g.append('path')
      .datum(optimizedData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3)
      .attr('d', lineGenerator)
      .style('filter', 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))');

    // Add dots for each data point
    g.selectAll('.baseline-dot')
      .data(baselineData)
      .enter().append('circle')
      .attr('class', 'baseline-dot')
      .attr('cx', d => xScale(d.monthIndex))
      .attr('cy', d => yScale(d.revenue))
      .attr('r', 4)
      .attr('fill', '#94a3b8');

    g.selectAll('.optimized-dot')
      .data(optimizedData)
      .enter().append('circle')
      .attr('class', 'optimized-dot')
      .attr('cx', d => xScale(d.monthIndex))
      .attr('cy', d => yScale(d.revenue))
      .attr('r', 5)
      .attr('fill', '#10b981')
      .style('filter', 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))');

    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(i => months[i as number])
        .ticks(12)
      )
      .style('font-size', '12px');

    // Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `$${(d as number / 1000).toFixed(0)}k`)
      )
      .style('font-size', '12px');

    // Labels
    g.append('text')
      .attr('x', innerWidth)
      .attr('y', yScale(baselineData[11].revenue))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('fill', '#94a3b8')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Without Boostly');

    g.append('text')
      .attr('x', innerWidth)
      .attr('y', yScale(optimizedData[11].revenue))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('fill', '#10b981')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('With Boostly');

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('font-size', '12px');

    // Interactive overlay
    const bisect = d3.bisector((d: any) => d.monthIndex).left;

    const focus = g.append('g')
      .style('display', 'none');

    focus.append('line')
      .attr('class', 'focus-line')
      .style('stroke', '#666')
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.5);

    focus.append('circle')
      .attr('class', 'focus-circle-baseline')
      .attr('r', 4)
      .style('fill', '#94a3b8');

    focus.append('circle')
      .attr('class', 'focus-circle-optimized')
      .attr('r', 4)
      .style('fill', '#10b981');

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => focus.style('display', null))
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.style('opacity', 0);
      })
      .on('mousemove', function(event) {
        const [xPos] = d3.pointer(event);
        const x0 = xScale.invert(xPos);
        const i = Math.round(x0);
        
        if (i >= 0 && i < 12) {
          const baselineValue = baselineData[i].revenue;
          const optimizedValue = optimizedData[i].revenue;
          const difference = optimizedValue - baselineValue;
          
          focus.select('.focus-line')
            .attr('x1', xScale(i))
            .attr('y1', 0)
            .attr('x2', xScale(i))
            .attr('y2', innerHeight);
          
          focus.select('.focus-circle-baseline')
            .attr('cx', xScale(i))
            .attr('cy', yScale(baselineValue));
          
          focus.select('.focus-circle-optimized')
            .attr('cx', xScale(i))
            .attr('cy', yScale(optimizedValue));
          
          tooltip.html(`
            <div style="font-weight: bold; margin-bottom: 5px;">${months[i]}</div>
            <div style="color: #94a3b8;">Without: $${(baselineValue / 1000).toFixed(1)}k</div>
            <div style="color: #10b981;">With Boostly: $${(optimizedValue / 1000).toFixed(1)}k</div>
            <div style="color: #fbbf24; margin-top: 5px;">+$${(difference / 1000).toFixed(1)}k (+${((difference / baselineValue) * 100).toFixed(1)}%)</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px')
            .style('opacity', 1);
        }
      });

    // Cleanup
    return () => {
      d3.select('body').selectAll('.chart-tooltip').remove();
    };
  }, [currentRevenue, leverStates]);

  // Calculate key metrics using consistent data
  const calculateMetrics = () => {
    let totalAdditional = 0;
    let breakEvenMonth = 0;
    let yearEndGrowth = 0;
    
    for (let i = 0; i < 12; i++) {
      const baselineRevenue = baselineData[i].revenue;
      const optimizedRevenue = optimizedData[i].revenue;
      const monthlyAdditional = optimizedRevenue - baselineRevenue;
      
      totalAdditional += monthlyAdditional;
      
      if (i === 11) {
        yearEndGrowth = ((optimizedRevenue - baselineRevenue) / baselineRevenue) * 100;
      }
      
      if (breakEvenMonth === 0 && monthlyAdditional > 5000) {
        breakEvenMonth = i + 1;
      }
    }
    
    return { totalAdditional, breakEvenMonth, yearEndGrowth };
  };

  const { totalAdditional, breakEvenMonth, yearEndGrowth } = calculateMetrics();

  // Notify parent component of Month 12 data changes
  useEffect(() => {
    if (onMonth12DataChange && baselineData.length > 0 && optimizedData.length > 0) {
      const month12Baseline = baselineData[11].revenue;
      const month12Optimized = optimizedData[11].revenue;
      const difference = month12Optimized - month12Baseline;
      const percentageGrowth = (difference / month12Baseline) * 100;

      onMonth12DataChange({
        baseline: month12Baseline,
        optimized: month12Optimized,
        difference: difference,
        percentageGrowth: percentageGrowth
      });
    }
  }, [baselineData, optimizedData, onMonth12DataChange]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      borderRadius: '15px',
      padding: '15px',
      margin: '0',
      height: '100%',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      border: '1px solid #cbd5e1'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '5px',
          textAlign: 'center'
        }}>
          Your 12-Month Revenue Transformation
        </h2>
        
        {totalAdditional > 0 && (
          <div style={{
            fontSize: '18px',
            color: '#10b981',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            +${(totalAdditional / 1000).toFixed(0)}k in Additional Revenue
          </div>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          marginBottom: '10px'
        }}>
          {breakEvenMonth > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>
                BREAK EVEN
              </div>
              <div style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 'bold' }}>
                Month {breakEvenMonth}
              </div>
            </div>
          )}
          
          {yearEndGrowth > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>
                YEAR-END GROWTH
              </div>
              <div style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>
                +{yearEndGrowth.toFixed(0)}%
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
              ROI
            </div>
            <div style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>
              {Math.max(0, ((totalAdditional / 60000) * 100)).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
      
      <svg ref={svgRef} width={680} height={300}></svg>
      
      <div style={{
        marginTop: '10px',
        padding: '8px',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '8px',
        borderLeft: '3px solid #10b981'
      }}>
        <p style={{
          color: '#10b981',
          fontSize: '12px',
          margin: 0,
          textAlign: 'center'
        }}>
          Join 500+ restaurants seeing these results with proven marketing strategies
        </p>
      </div>
    </div>
  );
};

export default MonthlyForecastChart;