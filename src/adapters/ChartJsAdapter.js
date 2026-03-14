/**
 * Chart.js Adapter Component
 * 
 * A component that renders a Chart.js line chart using react-chartjs-2.
 * Demonstrates multi-library support in the pluggable adapter pattern.
 * Includes legend and responsive sizing.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { THEMES } from '../types/schema';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartJsAdapter = ({ data, theme = 'default', width = 400, height = 300, title }) => {
  const chartRef = useRef(null);
  const colors = THEMES[theme] || THEMES.default;

  // Determine if we should show legend - lowered threshold
  const showLegend = width > 180 && height > 140;

  // Chart configuration
  const chartData = useMemo(() => ({
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
  }), [data, colors, title, width]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
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
        displayColors: false,
        callbacks: {
          label: (context) => `Value: ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
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
    },
  }), [showLegend, colors, title, width, height]);

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
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ChartJsAdapter;
