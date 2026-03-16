/**
 * Chart.js Adapter Component
 * 
 * A component that renders various Chart.js chart types using react-chartjs-2.
 * Supports: Line, Bar, Pie, Doughnut, Radar, Polar Area
 * Includes legend and responsive sizing.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import { THEMES, CHART_TYPES } from '../types/schema';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart type mapping
const CHART_COMPONENTS = {
  [CHART_TYPES.CHARTJS_LINE]: Line,
  [CHART_TYPES.CHARTJS_BAR]: Bar,
  [CHART_TYPES.CHARTJS_PIE]: Pie,
  [CHART_TYPES.CHARTJS_DOUGHNUT]: Doughnut,
  [CHART_TYPES.CHARTJS_RADAR]: Radar,
  [CHART_TYPES.CHARTJS_POLAR]: PolarArea,
};

const ChartJsAdapter = ({ data, theme = 'default', width = 400, height = 300, title, chartType = CHART_TYPES.CHARTJS_LINE, legend }) => {
  const chartRef = useRef(null);
  const colors = THEMES[theme] || THEMES.default;

  // Determine if we should show legend - from props or default based on size
  const legendEnabled = legend?.enabled !== false;
  const legendPosition = legend?.position || 'bottom';
  const showLegend = legendEnabled && width > 180 && height > 140;
  
  // Determine if we need scales (pie/doughnut/polar/radar don't use scales)
  const needsScales = ![CHART_TYPES.CHARTJS_PIE, CHART_TYPES.CHARTJS_DOUGHNUT, CHART_TYPES.CHARTJS_POLAR, CHART_TYPES.CHARTJS_RADAR].includes(chartType);
  
  // Get the appropriate chart component
  const ChartComponent = CHART_COMPONENTS[chartType] || Line;

  // Chart configuration
  const chartData = useMemo(() => {
    const baseData = {
      labels: data?.map((d) => d.label) || [],
      datasets: [
        {
          label: title || 'Value',
          data: data?.map((d) => d.value) || [],
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}20`,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: Math.max(2, Math.min(5, width / 60)),
          pointHoverRadius: Math.max(4, Math.min(8, width / 40)),
        },
      ],
    };

    // Customize for pie/doughnut/polar/radar - use multiple colors
    if ([CHART_TYPES.CHARTJS_PIE, CHART_TYPES.CHARTJS_DOUGHNUT, CHART_TYPES.CHARTJS_POLAR, CHART_TYPES.CHARTJS_RADAR].includes(chartType)) {
      const palette = [
        colors.primary,
        colors.secondary,
        '#f59e0b',
        '#8b5cf6',
        '#ec4899',
        '#14b8a6',
        '#f97316',
        '#6366f1',
      ];
      baseData.datasets[0].backgroundColor = data?.map((_, i) => palette[i % palette.length] + '80') || [];
      baseData.datasets[0].borderColor = data?.map((_, i) => palette[i % palette.length]) || [];
      baseData.datasets[0].borderWidth = 2;
    }
    
    // Customize for bar chart
    if (chartType === CHART_TYPES.CHARTJS_BAR) {
      baseData.datasets[0].backgroundColor = colors.primary;
      baseData.datasets[0].borderColor = colors.primary;
      baseData.datasets[0].borderWidth = 1;
      baseData.datasets[0].borderRadius = 4;
    }

    return baseData;
  }, [data, colors, title, width, chartType]);

  const options = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
        easing: 'easeInOutQuart',
      },
      plugins: {
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            color: colors.text,
            font: {
              size: Math.max(9, Math.min(12, width / 30)),
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            padding: showLegend ? 10 : 0,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        title: {
          display: !!title && width > 120,
          text: title,
          color: colors.text,
          font: {
            size: Math.max(10, Math.min(14, width / 25)),
            weight: 'bold',
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          padding: {
            bottom: showLegend ? 8 : 10,
          },
        },
        tooltip: {
          backgroundColor: colors.text,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: colors.primary,
          borderWidth: 1,
          cornerRadius: 6,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: (context) => `Value: ${context.parsed.y?.toLocaleString() ?? context.parsed.toLocaleString()}`,
          },
        },
      },
    };

    // Add scales for charts that need them
    if (needsScales) {
      baseOptions.scales = {
        x: {
          display: width > 100,
          grid: {
            color: colors.grid,
            drawBorder: false,
          },
          ticks: {
            color: colors.text,
            font: {
              size: Math.max(8, Math.min(10, width / 40)),
            },
            maxRotation: width < 150 ? 45 : 0,
          },
        },
        y: {
          display: height > 100,
          grid: {
            color: colors.grid,
            drawBorder: false,
          },
          ticks: {
            color: colors.text,
            font: {
              size: Math.max(8, Math.min(10, width / 40)),
            },
            callback: (value) => {
              if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'k';
              }
              return value.toLocaleString();
            },
          },
          beginAtZero: true,
        },
      };
    }

    // Radar chart specific options
    if (chartType === CHART_TYPES.CHARTJS_RADAR) {
      baseOptions.scales = {
        r: {
          angleLines: { color: colors.grid },
          grid: { color: colors.grid },
          pointLabels: {
            color: colors.text,
            font: { size: Math.max(8, Math.min(10, width / 40)) },
          },
          ticks: {
            color: colors.text,
            backdropColor: 'transparent',
          },
          beginAtZero: true,
        },
      };
    }

    // Polar area chart specific options
    if (chartType === CHART_TYPES.CHARTJS_POLAR) {
      baseOptions.scales = {
        r: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            backdropColor: 'transparent',
          },
          beginAtZero: true,
        },
      };
    }

    return baseOptions;
  }, [showLegend, legendPosition, colors, title, width, height, needsScales, chartType]);

  // Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const containerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    borderRadius: '6px',
    padding: '6px',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', height: '100%', minHeight: '80px' }}>
        <ChartComponent ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ChartJsAdapter;
