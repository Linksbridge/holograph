/**
 * D3 Adapter Component
 * 
 * A functional component that renders various D3.js chart types.
 * Supports: Bar, Line, Area, Pie, Donut, Scatter
 * Uses useRef and useEffect for D3 rendering with proper cleanup.
 * Includes legend and responsive sizing.
 */

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { THEMES, CHART_TYPES } from '../types/schema';

const D3Adapter = ({ data, theme = 'default', width = 400, height = 300, title, chartType = CHART_TYPES.D3_BAR, legend }) => {
  const svgRef = useRef(null);
  const colors = THEMES[theme] || THEMES.default;

  // Determine if we should show legend - from props or default based on size
  const legendEnabled = legend?.enabled !== false;
  const showLegend = legendEnabled && width > 180 && height > 140;
  const legendHeight = showLegend ? 25 : 0;

  // Color palette for pie/donut/scatter charts
  const colorPalette = [
    colors.primary,
    colors.secondary,
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6366f1',
  ];

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous chart elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create SVG container with viewBox for responsive scaling
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Render based on chart type
    switch (chartType) {
      case CHART_TYPES.D3_LINE:
        renderLineChart(svg, data);
        break;
      case CHART_TYPES.D3_AREA:
        renderAreaChart(svg, data);
        break;
      case CHART_TYPES.D3_PIE:
        renderPieChart(svg, data, false);
        break;
      case CHART_TYPES.D3_DONUT:
        renderPieChart(svg, data, true);
        break;
      case CHART_TYPES.D3_SCATTER:
        renderScatterChart(svg, data);
        break;
      case CHART_TYPES.D3_BAR:
      default:
        renderBarChart(svg, data);
        break;
    }

    // Cleanup function - remove all SVG content on unmount
    return () => {
      svg.selectAll('*').remove();
    };
  }, [data, theme, width, height, title, chartType, colors, showLegend, legendHeight, colorPalette]);

  // Bar Chart Renderer
  const renderBarChart = (svg, chartData) => {
    const margin = { top: 25, right: 15, bottom: 40 + legendHeight, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(chartData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) * 1.1])
      .range([innerHeight, 0]);

    // X Axis
    const xAxisG = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    const xFontSize = Math.max(8, Math.min(10, width / 40));
    xAxisG.selectAll('text')
      .attr('fill', colors.text)
      .style('font-size', `${xFontSize}px`)
      .style('text-anchor', width < 150 ? 'end' : 'middle')
      .attr('transform', width < 150 ? 'rotate(-45)' : '');
    xAxisG.select('.domain').attr('stroke', colors.grid);

    // Y Axis
    const yAxisG = g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(''))
      .selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();

    // Bars
    g.selectAll('.bar').data(chartData).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.label))
      .attr('y', innerHeight)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', colors.primary)
      .attr('rx', 2)
      .transition().duration(500).delay((d, i) => i * 20)
      .attr('y', (d) => yScale(d.value))
      .attr('height', (d) => innerHeight - yScale(d.value));

    addTitleAndLegend(svg, title, 'Bar Chart');
  };

  // Line Chart Renderer
  const renderLineChart = (svg, chartData) => {
    const margin = { top: 25, right: 15, bottom: 40 + legendHeight, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint()
      .domain(chartData.map((d) => d.label))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) * 1.1])
      .range([innerHeight, 0]);

    const xFontSize = Math.max(8, Math.min(10, width / 40));

    // X Axis
    const xAxisG = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));
    xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    xAxisG.select('.domain').attr('stroke', colors.grid);

    // Y Axis
    const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(''))
      .selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();

    // Line generator
    const line = d3.line()
      .x((d) => xScale(d.label))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Area under line
    const area = d3.area()
      .x((d) => xScale(d.label))
      .y0(innerHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw area
    g.append('path')
      .datum(chartData)
      .attr('fill', `${colors.primary}20`)
      .attr('d', area);

    // Draw line
    const path = g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', colors.primary)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animate line
    const pathLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', pathLength)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(800)
      .attr('stroke-dashoffset', 0);

    // Points
    g.selectAll('.point').data(chartData).enter().append('circle')
      .attr('class', 'point')
      .attr('cx', (d) => xScale(d.label))
      .attr('cy', (d) => yScale(d.value))
      .attr('r', 0)
      .attr('fill', colors.primary)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .transition().delay(800).duration(200)
      .attr('r', 4);

    addTitleAndLegend(svg, title, 'Line Chart');
  };

  // Area Chart Renderer
  const renderAreaChart = (svg, chartData) => {
    const margin = { top: 25, right: 15, bottom: 40 + legendHeight, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint()
      .domain(chartData.map((d) => d.label))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) * 1.1])
      .range([innerHeight, 0]);

    const xFontSize = Math.max(8, Math.min(10, width / 40));

    // Axes
    const xAxisG = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));
    xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    xAxisG.select('.domain').attr('stroke', colors.grid);

    const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(''))
      .selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();

    // Area
    const area = d3.area()
      .x((d) => xScale(d.label))
      .y0(innerHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const areaPath = g.append('path')
      .datum(chartData)
      .attr('fill', `url(#areaGradient)`)
      .attr('d', area);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', colors.primary).attr('stop-opacity', 0.6);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', colors.primary).attr('stop-opacity', 0.1);

    // Animate area
    areaPath
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .attr('opacity', 1);

    // Line on top
    const line = d3.line()
      .x((d) => xScale(d.label))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', colors.primary)
      .attr('stroke-width', 2)
      .attr('d', line);

    addTitleAndLegend(svg, title, 'Area Chart');
  };

  // Pie/Donut Chart Renderer
  const renderPieChart = (svg, chartData, isDonut) => {
    const radius = Math.min(width, height) / 2 - 30;
    const innerRadius = isDonut ? radius * 0.5 : 0;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value((d) => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8);

    const pieData = pie(chartData);

    // Slices
    const slices = g.selectAll('.slice')
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', 'slice');

    slices.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => colorPalette[i % colorPalette.length])
      .attr('stroke', colors.background)
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 50)
      .style('opacity', 1)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(interpolate(t));
      });

    // Hover effects
    slices.select('path')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('d', arcHover);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('d', arc);
      });

    // Labels for pie
    if (!isDonut) {
      slices.append('text')
        .attr('transform', (d) => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .style('opacity', 0)
        .text((d) => d.data.label)
        .transition()
        .delay(600)
        .duration(200)
        .style('opacity', 1);
    }

    // Center text for donut
    if (isDonut) {
      const total = d3.sum(chartData, (d) => d.value);
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('fill', colors.text)
        .style('font-size', '20px')
        .style('font-weight', 'bold')
        .text(total.toLocaleString());
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .attr('fill', colors.text)
        .style('font-size', '11px')
        .text('Total');
    }

    addTitleAndLegend(svg, title, isDonut ? 'Donut Chart' : 'Pie Chart', true);
  };

  // Scatter Chart Renderer
  const renderScatterChart = (svg, chartData) => {
    const margin = { top: 25, right: 15, bottom: 40 + legendHeight, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, chartData.length + 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) * 1.1])
      .range([innerHeight, 0]);

    const xFontSize = Math.max(8, Math.min(10, width / 40));

    // Axes
    const xAxisG = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).ticks(chartData.length));
    xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    xAxisG.select('.domain').attr('stroke', colors.grid);

    const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);

    // Grid
    g.append('g').attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(''))
      .selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();

    // Points
    g.selectAll('.point')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (d, i) => xScale(i + 1))
      .attr('cy', (d) => yScale(d.value))
      .attr('r', 0)
      .attr('fill', (d, i) => colorPalette[i % colorPalette.length])
      .attr('opacity', 0.8)
      .transition()
      .delay((d, i) => i * 50)
      .duration(300)
      .attr('r', (d) => Math.max(4, Math.min(10, d.value / 20)));

    // Labels
    g.selectAll('.label')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d, i) => xScale(i + 1))
      .attr('y', (d) => yScale(d.value) - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .style('font-size', '9px')
      .style('opacity', 0)
      .text((d) => d.label)
      .transition()
      .delay(400)
      .duration(200)
      .style('opacity', 1);

    addTitleAndLegend(svg, title, 'Scatter Chart', true);
  };

  // Helper to add title and legend
  const addTitleAndLegend = (svg, chartTitle, defaultTitle, forceLegend = false) => {
    const legendShow = showLegend || forceLegend;
    const yOffset = legendShow ? height - 12 : height - 10;

    // Title
    if (title && width > 100) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .style('font-size', `${Math.max(9, Math.min(12, width / 30))}px`)
        .style('font-weight', 'bold')
        .style('font-family', 'inherit')
        .text(title);
    }

    // Legend
    if (legendShow) {
      const legendG = svg.append('g').attr('transform', `translate(${width / 2}, ${yOffset})`);
      legendG.append('rect')
        .attr('x', -40).attr('y', -5)
        .attr('width', 10).attr('height', 10)
        .attr('fill', colors.primary)
        .attr('rx', 1);
      legendG.append('text')
        .attr('x', -24).attr('y', 4)
        .attr('fill', colors.text)
        .style('font-size', '10px')
        .style('font-family', 'inherit')
        .text(defaultTitle);
    }
  };

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
