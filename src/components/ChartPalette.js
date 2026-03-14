/**
 * ChartPalette Component
 * 
 * A panel showing available chart types with icons for drag-and-drop
 * to add new charts to the dashboard.
 */

import React from 'react';
import { CHART_LIBRARIES, CHART_TYPES } from '../types/schema';

const CHART_OPTIONS = [
  {
    id: 'line-chart',
    library: CHART_LIBRARIES.CHARTJS,
    chartType: CHART_TYPES[CHART_LIBRARIES.CHARTJS],
    title: 'Line Chart',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    description: 'Trend visualization',
  },
  {
    id: 'bar-chart',
    library: CHART_LIBRARIES.D3,
    chartType: CHART_TYPES[CHART_LIBRARIES.D3],
    title: 'Bar Chart',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="6" width="4" height="15" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
    ),
    description: 'Comparison visualization',
  },
];

const ChartPalette = ({ onDragStart }) => {
  const paletteStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '80px',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
    zIndex: 900,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const titleStyle = {
    fontSize: '10px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'center',
    marginBottom: '16px',
    padding: '0 4px',
  };

  const chartItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    marginBottom: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    cursor: 'grab',
    transition: 'all 0.2s ease',
    border: '1px solid #e5e7eb',
  };

  const chartItemHoverStyle = {
    ...chartItemStyle,
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
  };

  const handleDragStart = (e, chartOption) => {
    e.dataTransfer.setData('chartType', JSON.stringify(chartOption));
    e.dataTransfer.effectAllowed = 'copy';
    if (onDragStart) {
      onDragStart(chartOption);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragStart) {
      onDragStart(null);
    }
  };

  return (
    <div style={paletteStyle}>
      <div style={titleStyle}>Add Chart</div>
      
      {CHART_OPTIONS.map((chartOption) => (
        <div
          key={chartOption.id}
          draggable
          onDragStart={(e) => handleDragStart(e, chartOption)}
          onDragEnd={handleDragEnd}
          style={chartItemStyle}
          title={`${chartOption.title}: ${chartOption.description}`}
          onMouseEnter={(e) => {
            Object.assign(e.target.style, chartItemHoverStyle);
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f9fafb';
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              color: '#3b82f6',
              marginBottom: '6px',
            }}
          >
            {chartOption.icon}
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: '#374151',
              textAlign: 'center',
            }}
          >
            {chartOption.title}
          </span>
        </div>
      ))}

      <div
        style={{
          marginTop: 'auto',
          padding: '12px',
          textAlign: 'center',
          fontSize: '10px',
          color: '#9ca3af',
        }}
      >
        <div style={{ marginBottom: '4px' }}>📊</div>
        Drag to add
      </div>
    </div>
  );
};

export default ChartPalette;
