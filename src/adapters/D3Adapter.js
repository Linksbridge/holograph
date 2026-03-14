/**
 * D3 Adapter Component
 * 
 * A functional component that renders a D3.js bar chart.
 * Uses useRef and useEffect for D3 rendering with proper cleanup.
 * Includes legend and responsive sizing.
 */

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { THEMES } from '../types/schema';

const D3Adapter = ({ data, theme = 'default', width = 400, height = 300, title }) => {
  const svgRef = useRef(null);
  const colors = THEMES[theme] || THEMES.default;

  // Determine if we should show legend - lowered threshold
  const showLegend = width > 180 && height > 140;
  const legendHeight = showLegend ? 25 : 0;

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous chart elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Chart dimensions - account for legend
    const margin = { top: 25, right: 15, bottom: 40 + legendHeight, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    // Create SVG container with viewBox for responsive scaling
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) * 1.1])
      .range([innerHeight, 0]);

    // X Axis group
    const xAxisG = g
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // Style X axis
    const xFontSize = Math.max(8, Math.min(10, width / 40));
    xAxisG.selectAll('text')
      .attr('fill', colors.text)
      .style('font-size', `${xFontSize}px`)
      .style('font-family', 'inherit')
      .style('text-anchor', width < 150 ? 'end' : 'middle')
      .attr('dx', width < 150 ? '-0.2em' : '0')
      .attr('transform', width < 150 ? 'rotate(-45)' : '');
    
    xAxisG.select('.domain')
      .attr('stroke', colors.grid)
      .attr('stroke-width', 1);
    
    xAxisG.selectAll('.tick line')
      .attr('stroke', colors.grid);

    // Y Axis group
    const yAxisG = g
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(4));

    // Style Y axis
    yAxisG.selectAll('text')
      .attr('fill', colors.text)
      .style('font-size', `${xFontSize}px`)
      .style('font-family', 'inherit');
    
    yAxisG.select('.domain')
      .attr('stroke', colors.grid)
      .attr('stroke-width', 1);
    
    yAxisG.selectAll('.tick line')
      .attr('stroke', colors.grid);

    // Grid lines - horizontal only
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat('')
      )
      .selectAll('line')
      .attr('stroke', colors.grid)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '2,2');

    g.select('.grid .domain').remove();

    // Bars with animation
    const bars = g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.label))
      .attr('y', innerHeight)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', colors.primary)
      .attr('rx', 2)
      .attr('ry', 2);

    // Animate bars
    bars.transition()
      .duration(500)
      .delay((d, i) => i * 20)
      .attr('y', (d) => yScale(d.value))
      .attr('height', (d) => innerHeight - yScale(d.value));

    // Hover effects
    bars
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('fill', colors.secondary)
          .attr('opacity', 0.9);
        
        // Add tooltip
        const tooltip = g
          .append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.label) + xScale.bandwidth() / 2},${yScale(d.value) - 8})`);

        const tooltipText = tooltip
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('fill', colors.text)
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text(d.value.toLocaleString());

        const bbox = tooltipText.node().getBBox();
        tooltip
          .insert('rect', 'text')
          .attr('x', bbox.x - 3)
          .attr('y', bbox.y - 1)
          .attr('width', bbox.width + 6)
          .attr('height', bbox.height + 2)
          .attr('fill', '#ffffff')
          .attr('stroke', colors.grid)
          .attr('rx', 2)
          .attr('opacity', 0.95);
        
        tooltipText.raise();
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('fill', colors.primary)
          .attr('opacity', 1);
        g.selectAll('.tooltip').remove();
      });

    // Title (only if there's enough space)
    if (title && width > 100) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .style('font-size', `${Math.max(9, Math.min(12, width / 30))}px`)
        .style('font-weight', 'bold')
        .style('font-family', 'inherit')
        .text(title);
    }

    // Legend (only if there's enough space)
    if (showLegend) {
      const legendG = svg
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height - 12})`);

      // Legend color box
      legendG
        .append('rect')
        .attr('x', -40)
        .attr('y', -5)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', colors.primary)
        .attr('rx', 1);

      // Legend text
      legendG
        .append('text')
        .attr('x', -24)
        .attr('y', 4)
        .attr('fill', colors.text)
        .style('font-size', '10px')
        .style('font-family', 'inherit')
        .text(title || 'Bar Chart');
    }

    // Cleanup function - remove all SVG content on unmount
    return () => {
      svg.selectAll('*').remove();
    };
  }, [data, theme, width, height, title, colors, showLegend, legendHeight]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ 
        backgroundColor: colors.background, 
        borderRadius: '6px',
        display: 'block',
        overflow: 'hidden'
      }}
    />
  );
};

export default D3Adapter;
