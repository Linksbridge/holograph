/**
 * Chart.js Adapter Component
 * 
 * A component that renders various Chart.js chart types using react-chartjs-2.
 * Supports: Line, Bar, Pie, Doughnut, Radar, Polar Area
 * Includes legend and responsive sizing.
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
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
import { Line, Bar, Pie, Doughnut, Radar, PolarArea, Chart as ReactChart } from 'react-chartjs-2';
import { BubbleMapController, ProjectionScale, GeoFeature, SizeScale } from 'chartjs-chart-geo';
import { THEMES, CHART_TYPES } from '@holograph/dashboard-schema';

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
  Filler,
  BubbleMapController,
  ProjectionScale,
  GeoFeature,
  SizeScale,
);

// GeoJSON cache for bubble map background
const bubbleGeoCache = {};
const USA_STATES_GEO_URL = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces.geojson';

const DEMO_BUBBLE_DATA = [
  { city: 'New York',      lat: 40.7128, lng: -74.0060,  value: 8336817 },
  { city: 'Los Angeles',   lat: 34.0522, lng: -118.2437, value: 3979576 },
  { city: 'Chicago',       lat: 41.8781, lng: -87.6298,  value: 2693976 },
  { city: 'Houston',       lat: 29.7604, lng: -95.3698,  value: 2320268 },
  { city: 'Phoenix',       lat: 33.4484, lng: -112.0740, value: 1608139 },
  { city: 'Philadelphia',  lat: 39.9526, lng: -75.1652,  value: 1603797 },
  { city: 'San Antonio',   lat: 29.4241, lng: -98.4936,  value: 1434625 },
  { city: 'San Diego',     lat: 32.7157, lng: -117.1611, value: 1386932 },
  { city: 'Dallas',        lat: 32.7767, lng: -96.7970,  value: 1304379 },
  { city: 'Seattle',       lat: 47.6062, lng: -122.3321, value:  744955 },
];

const BubbleMapChart = ({ data, zoneConfig, colors, title, tooltip }) => {
  const [geoData, setGeoData] = useState(null);
  const chartRef = useRef(null);

  const latCol   = zoneConfig?.dataSource?.latColumn   || 'lat';
  const lngCol   = zoneConfig?.dataSource?.lngColumn   || 'lng';
  const valueCol = zoneConfig?.dataSource?.valueColumn || 'value';
  const labelCol = zoneConfig?.dataSource?.labelColumn || 'city';

  useEffect(() => {
    if (bubbleGeoCache[USA_STATES_GEO_URL]) {
      setGeoData(bubbleGeoCache[USA_STATES_GEO_URL]);
      return;
    }
    fetch(USA_STATES_GEO_URL)
      .then((r) => r.json())
      .then((json) => {
        bubbleGeoCache[USA_STATES_GEO_URL] = json;
        setGeoData(json);
      })
      .catch(() => {});
  }, []);

  const rowData = data?.length ? data : DEMO_BUBBLE_DATA;

  const chartData = useMemo(() => {
    if (!geoData) return null;
    return {
      labels: rowData.map((r) => r[labelCol] ?? r.city ?? ''),
      datasets: [{
        label: title || 'Points',
        outline: geoData,
        showOutline: true,
        data: rowData.map((r) => ({
          longitude: Number(r[lngCol] ?? r.lng ?? 0),
          latitude:  Number(r[latCol] ?? r.lat ?? 0),
          value: Number(r[valueCol] ?? r.value ?? 0),
        })),
        backgroundColor: `${colors.primary}66`,
        borderColor: colors.primary,
        borderWidth: 1,
      }],
    };
  }, [rowData, geoData, latCol, lngCol, valueCol, labelCol, colors, title]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      projection: {
        axis: 'x',
        projection: 'albersUsa',
      },
      size: {
        axis: 'x',
        size: [3, 25],
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: tooltip?.enabled !== false,
        callbacks: {
          label: (ctx) => {
            const row = rowData[ctx.dataIndex];
            const val = row?.[valueCol] ?? row?.value ?? 0;
            return `${ctx.label}: ${Number(val).toLocaleString()}`;
          },
        },
      },
    },
  }), [tooltip, rowData, valueCol]);

  const containerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    borderRadius: '6px',
    padding: '6px',
    boxSizing: 'border-box',
  };

  if (!geoData) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text, fontSize: '12px' }}>
        Loading map...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', height: '100%', minHeight: '80px' }}>
        <ReactChart ref={chartRef} type="bubbleMap" data={chartData} options={options} />
      </div>
    </div>
  );
};

// Chart type mapping
const CHART_COMPONENTS = {
  [CHART_TYPES.CHARTJS_LINE]: Line,
  [CHART_TYPES.CHARTJS_BAR]: Bar,
  [CHART_TYPES.CHARTJS_PIE]: Pie,
  [CHART_TYPES.CHARTJS_DOUGHNUT]: Doughnut,
  [CHART_TYPES.CHARTJS_RADAR]: Radar,
  [CHART_TYPES.CHARTJS_POLAR]: PolarArea,
};

const ChartJsAdapter = ({ data, theme = 'default', width = 400, height = 300, title, chartType = CHART_TYPES.CHARTJS_LINE, legend, tooltip, zoneConfig }) => {
  const chartRef = useRef(null);
  const colors = THEMES[theme] || THEMES.default;

  if (chartType === CHART_TYPES.CHARTJS_BUBBLEMAP) {
    return (
      <BubbleMapChart
        data={data}
        zoneConfig={zoneConfig}
        colors={colors}
        title={title}
        tooltip={tooltip}
      />
    );
  }

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
          enabled: tooltip?.enabled !== false,
          backgroundColor: tooltip?.backgroundColor === 'auto' ? colors.text : (tooltip?.backgroundColor || colors.text),
          titleColor: tooltip?.textColor === 'auto' ? '#ffffff' : (tooltip?.textColor || '#ffffff'),
          bodyColor: tooltip?.textColor === 'auto' ? '#ffffff' : (tooltip?.textColor || '#ffffff'),
          borderColor: tooltip?.borderColor === 'auto' ? colors.primary : (tooltip?.borderColor || colors.primary),
          borderWidth: 1,
          cornerRadius: 6,
          padding: 10,
          displayColors: tooltip?.showColors !== false,
          position: tooltip?.position === 'auto' ? 'average' : (tooltip?.position || 'average'),
          callbacks: {
            label: (context) => {
              const value = context.parsed.y?.toLocaleString() ?? context.parsed.toLocaleString();
              let formattedValue = value;

              // Apply formatting based on tooltip.format
              if (tooltip?.format === 'currency') {
                formattedValue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(context.parsed.y ?? context.parsed);
              } else if (tooltip?.format === 'percentage') {
                formattedValue = `${((context.parsed.y ?? context.parsed) * 100).toFixed(1)}%`;
              } else if (tooltip?.format === 'number') {
                formattedValue = (context.parsed.y ?? context.parsed).toLocaleString();
              }

              return `Value: ${formattedValue}`;
            },
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
  }, [showLegend, legendPosition, colors, title, width, height, needsScales, chartType, tooltip]);

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
