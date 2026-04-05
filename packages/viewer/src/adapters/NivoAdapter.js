/**
 * Nivo Adapter Component
 * 
 * A component that renders various Nivo chart types.
 * Supports: Line, Bar, Pie
 * Includes legend and responsive sizing.
 * Nivo is known for beautiful, animated charts with good defaults.
 */

import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveChoropleth } from '@nivo/geo';
import { CHART_TYPES, CHART_LIBRARIES, THEMES } from '@holograph/dashboard-schema';

// Default color palette for nivo
const DEFAULT_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
];

// Nivo chart type mapping
const NIVO_CHART_COMPONENTS = {
  [CHART_TYPES.NIVO_LINE]: ResponsiveLine,
  [CHART_TYPES.NIVO_BAR]: ResponsiveBar,
  [CHART_TYPES.NIVO_PIE]: ResponsivePie,
  [CHART_TYPES.NIVO_CHOROPLETH]: ResponsiveChoropleth,
};

// Nivo uses different chart types
const NIVO_CHART_TYPES = {
  LINE: 'nivo_line',
  BAR: 'nivo_bar',
  PIE: 'nivo_pie',
  CHOROPLETH: 'nivo_choropleth',
};

// Map our chart types to nivo chart types
const getNivoChartType = (chartType) => {
  switch (chartType) {
    case CHART_TYPES.NIVO_LINE:
      return NIVO_CHART_TYPES.LINE;
    case CHART_TYPES.NIVO_BAR:
      return NIVO_CHART_TYPES.BAR;
    case CHART_TYPES.NIVO_PIE:
      return NIVO_CHART_TYPES.PIE;
    case CHART_TYPES.NIVO_CHOROPLETH:
      return NIVO_CHART_TYPES.CHOROPLETH;
    default:
      return NIVO_CHART_TYPES.LINE;
  }
};

const NivoAdapter = ({
  data,
  theme = 'default',
  width = 400,
  height = 300,
  title,
  chartType = CHART_TYPES.NIVO_LINE,
  legend,
  tooltip
}) => {
  const colors = THEMES[theme] || THEMES.default;
  const legendEnabled = legend?.enabled !== false;
  const showLegend = legendEnabled && width > 180 && height > 140;
  
  const fontSize = Math.max(9, Math.min(12, width / 30));

  // Helper function to format tooltip values
  const formatTooltipValue = (value) => {
    if (!tooltip?.enabled) return null;

    let formattedValue = value?.toLocaleString();

    if (tooltip?.format === 'currency') {
      formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    } else if (tooltip?.format === 'percentage') {
      formattedValue = `${(value * 100).toFixed(1)}%`;
    } else if (tooltip?.format === 'number') {
      formattedValue = value?.toLocaleString();
    }

    return formattedValue;
  };

  // Convert data to nivo format
const nivoData = useMemo(() => {
  if (!data || data.length === 0) return [];
  
  const palette = [...DEFAULT_PALETTE];
  
  // For pie chart - nivo pie expects { id, value, label }
  if (getNivoChartType(chartType) === NIVO_CHART_TYPES.PIE) {
    return data.map((item, index) => ({
      id: item.label || `item-${index}`,
      label: item.label || `Item ${index + 1}`,
      value: item.value,
      color: palette[index % palette.length],
    }));
  }
  
  // For choropleth - nivo expects { id, label, value, color? }
  // Note: Choropleth charts require additional props: features (geo data) and match function
  // These should be provided via chart configuration or data source
  if (getNivoChartType(chartType) === NIVO_CHART_TYPES.CHOROPLETH) {
    return data.map((item, index) => ({
      id: item.id || item.label || `region-${index}`,
      label: item.label || item.id || `Region ${index + 1}`,
      value: item.value,
      color: item.color || palette[index % palette.length],
    }));
  }
  
  // For line and bar - nivo expects array of series
  // Each series has id and data array of { x, y }
  return [
    {
      id: title || 'Series 1',
      data: data.map(item => ({
        x: item.label,
        y: item.value,
      })),
      color: colors.primary,
    },
  ];
}, [data, chartType, title, colors]);
  
  // Common theme for nivo
  const nivoTheme = useMemo(() => ({
    fontSize,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textColor: colors.text,
    axis: {
      domain: {
        line: {
          stroke: colors.grid,
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: fontSize + 2,
          fontWeight: 'bold',
          fill: colors.text,
        },
      },
      ticks: {
        line: {
          stroke: colors.grid,
          strokeWidth: 1,
        },
        text: {
          fontSize: fontSize - 1,
          fill: colors.text,
        },
      },
    },
    grid: {
      line: {
        stroke: colors.grid,
        strokeWidth: 1,
      },
    },
    tooltip: {
      container: {
        background: tooltip?.backgroundColor === 'auto' ? colors.background : (tooltip?.backgroundColor || colors.background),
        color: tooltip?.textColor === 'auto' ? colors.text : (tooltip?.textColor || colors.text),
        fontSize: fontSize,
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : (tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'),
      },
    },
    legend: {
      title: {
        fontSize: fontSize + 1,
        fontWeight: 'bold',
        fill: colors.text,
      },
      text: {
        fontSize: fontSize,
        fill: colors.text,
      },
    },
  }), [colors, fontSize, title]);
  
  // Line chart specific config
  const lineConfig = useMemo(() => ({
    margin: { top: 20, right: 20, bottom: 50, left: 60 },
    xScale: { type: 'point' },
    yScale: { 
      type: 'linear', 
      min: 'auto', 
      max: 'auto', 
      stacked: false, 
      reverse: false 
    },
    yFormat: " >-.2f",
    curve: 'monotoneX',
    axisTop: null,
    axisRight: null,
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: width < 150 ? -45 : 0,
      legend: '',
      legendOffset: 36,
      legendPosition: 'middle',
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: '',
      legendOffset: -40,
      legendPosition: 'middle',
    },
    enableGridX: false,
    enableGridY: true,
    colors: DEFAULT_PALETTE,
    lineWidth: 2,
    enablePoints: true,
    pointSize: 8,
    pointColor: { theme: 'background' },
    pointBorderWidth: 2,
    pointBorderColor: { from: 'serieColor' },
    enableArea: true,
    areaOpacity: 0.1,
    useMesh: false,
    enableSlices: 'x',
    legends: showLegend ? [{
      anchor: 'bottom',
      direction: 'row',
      justify: false,
      translateX: 0,
      translateY: 50,
      itemsSpacing: 0,
      itemDirection: 'left-to-right',
      itemWidth: 60,
      itemHeight: 20,
      itemOpacity: 0.75,
      symbolSize: 12,
      symbolShape: 'circle',
      symbolBorderColor: { from: 'serieColor' },
      effects: [
        {
          on: 'hover',
          style: {
            itemBackground: 'rgba(0, 0, 0, .03)',
            itemOpacity: 1,
          },
        },
      ],
    }] : [],
  }), [width, showLegend]);
  
  // Bar chart specific config
  const barConfig = useMemo(() => ({
    margin: { top: 20, right: 20, bottom: 50, left: 60 },
    padding: 0.3,
    innerPadding: 0,
    minValue: 'auto',
    maxValue: 'auto',
    groupMode: 'grouped',
    reverse: false,
    indexBy: 'label',
    layout: 'horizontal',
    valueScale: { type: 'linear' },
    indexScale: { type: 'band', round: true },
    colors: DEFAULT_PALETTE,
    borderRadius: 4,
    borderColor: { from: 'serieColor' },
    axisTop: null,
    axisRight: null,
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: width < 150 ? -45 : 0,
      legend: '',
      legendOffset: 36,
      legendPosition: 'middle',
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: '',
      legendOffset: -40,
      legendPosition: 'middle',
    },
    enableGridX: false,
    enableGridY: true,
    enableLabel: true,
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    labelTextColor: { from: 'color', modifiers: [['darker', 1.6]] },
    legends: showLegend ? [{
      dataFrom: 'keys',
      anchor: 'bottom',
      direction: 'row',
      justify: false,
      translateX: 0,
      translateY: 50,
      itemsSpacing: 0,
      itemWidth: 60,
      itemHeight: 20,
      itemOpacity: 0.75,
      symbolSize: 12,
      symbolShape: 'square',
      symbolBorderColor: { from: 'serieColor' },
      effects: [
        {
          on: 'hover',
          style: {
            itemBackground: 'rgba(0, 0, 0, .03)',
            itemOpacity: 1,
          },
        },
      ],
    }] : [],
    tooltip: tooltip?.enabled !== false ? ((tooltipData) => {
      const formattedValue = formatTooltipValue(tooltipData.value);
      const titleText = tooltip?.title ? tooltip.title.replace('{id}', tooltipData.id).replace('{label}', tooltipData.id) : tooltipData.id;
      const labelText = tooltip?.label ? tooltip.label.replace('{value}', formattedValue) : formattedValue;
      return (
        <div style={{
          background: tooltip?.backgroundColor === 'auto' ? colors.background : (tooltip?.backgroundColor || colors.background),
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: tooltip?.textColor === 'auto' ? colors.text : (tooltip?.textColor || colors.text),
          fontSize: fontSize,
          border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : (tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'),
        }}>
          <strong>{titleText}</strong>: {labelText}
        </div>
      );
    }) : false,
  }), [width, showLegend, colors, fontSize]);
  
// Pie chart specific config
const pieConfig = useMemo(() => ({
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  innerRadius: 0.5,
  padAngle: 2,
  cornerRadius: 4,
  activeOuterRadiusOffset: 8,
  borderWidth: 2,
  borderColor: { from: 'color', modifiers: [['darker', 0.2]] },
  arcLinkLabelsSkipAngle: 10,
  arcLinkLabelsTextColor: colors.text,
  arcLinkLabelsThickness: 2,
  arcLinkLabelsColor: { from: 'color' },
  arcLabelsSkipAngle: 10,
  arcLabelsTextColor: { from: 'color', modifiers: [['darker', 2]] },
  colors: DEFAULT_PALETTE,
  defs: [],
  legends: showLegend ? [{
    anchor: 'bottom',
    direction: 'row',
    justify: false,
    translateX: 0,
    translateY: 56,
    itemsSpacing: 0,
    itemWidth: 60,
    itemHeight: 20,
    itemOpacity: 0.75,
    symbolSize: 12,
    symbolShape: 'circle',
    symbolBorderColor: { from: 'color' },
    effects: [
      {
        on: 'hover',
        style: {
          itemBackground: 'rgba(0, 0, 0, .03)',
          itemOpacity: 1,
        },
      },
    ],
  }] : [],
  tooltip: tooltip?.enabled !== false ? ((tooltipData) => {
    const formattedValue = formatTooltipValue(tooltipData.datum.value);
    const total = data?.reduce((a, b) => a + b.value, 0) || 1;
    const percentage = ((tooltipData.datum.value / total) * 100).toFixed(1);
    const titleText = tooltip?.title ? tooltip.title.replace('{id}', tooltipData.datum.id || tooltipData.datum.label).replace('{label}', tooltipData.datum.label) : tooltipData.datum.label;
    const labelText = tooltip?.label ? tooltip.label.replace('{value}', formattedValue) : formattedValue;

    return (
      <div style={{
        background: tooltip?.backgroundColor === 'auto' ? colors.background : (tooltip?.backgroundColor || colors.background),
        padding: '8px 12px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        color: tooltip?.textColor === 'auto' ? colors.text : (tooltip?.textColor || colors.text),
        fontSize: fontSize,
        border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : (tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'),
      }}>
        <strong>{titleText}</strong>: {labelText}
        <br />
        ({percentage}%)
      </div>
    );
  }) : false,
}), [showLegend, colors, fontSize, data]);

// Choropleth chart specific config
const choroplethConfig = useMemo(() => ({
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  borderColor: { from: 'color', modifiers: [['darker', 0.2]] },
  colors: DEFAULT_PALETTE,
  enableLabel: true,
  label: ({ datum }) => datum?.label || '',
  labelTextColor: { from: 'color', modifiers: [['darker', 0.5]] },
  projectionType: 'naturalEarth1',
  projectionScale: 100,
  projectionTranslation: [0.5, 0.5],
  defs: [],
  fill: [],
  // Note: features prop (geographical data) should be provided via chart configuration
  // features: geoJsonFeatures, // e.g., from @nivo/geo-atlas/world-50m
  legends: showLegend ? [{
    anchor: 'bottom',
    direction: 'row',
    justify: false,
    translateX: 0,
    translateY: 50,
    itemsSpacing: 0,
    itemWidth: 60,
    itemHeight: 20,
    itemOpacity: 0.75,
    symbolSize: 12,
    symbolShape: 'square',
    symbolBorderColor: { from: 'color' },
    effects: [
      {
        on: 'hover',
        style: {
          itemBackground: 'rgba(0, 0, 0, .03)',
          itemOpacity: 1,
        },
      },
    ],
  }] : [],
  tooltip: tooltip?.enabled !== false ? ((tooltipData) => {
    const formattedValue = formatTooltipValue(tooltipData.datum?.value);
    const titleText = tooltip?.title ? tooltip.title.replace('{id}', tooltipData.datum?.id || 'Region').replace('{label}', tooltipData.datum?.label || '') : (tooltipData.datum?.id || 'Region');
    const labelText = tooltip?.label ? tooltip.label.replace('{value}', formattedValue ?? 'N/A') : (formattedValue ?? 'N/A');
    const extraInfo = tooltipData.datum?.label && tooltipData.datum?.label !== tooltipData.datum?.id ? tooltipData.datum.label : '';

    return (
      <div style={{
        background: tooltip?.backgroundColor === 'auto' ? colors.background : (tooltip?.backgroundColor || colors.background),
        padding: '8px 12px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        color: tooltip?.textColor === 'auto' ? colors.text : (tooltip?.textColor || colors.text),
        fontSize: fontSize,
        border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : (tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'),
      }}>
        <strong>{titleText}</strong>: {labelText}
        {extraInfo && <br />}
        {extraInfo}
      </div>
    );
  }) : false,
}), [showLegend, colors, fontSize, data]);
  
// Get the appropriate chart component and config
const nivoChartType = getNivoChartType(chartType);
const ChartComponent = NIVO_CHART_COMPONENTS[chartType] || ResponsiveLine;

let chartConfig;
switch (nivoChartType) {
  case NIVO_CHART_TYPES.LINE:
    chartConfig = lineConfig;
    break;
  case NIVO_CHART_TYPES.BAR:
    chartConfig = barConfig;
    break;
  case NIVO_CHART_TYPES.PIE:
    chartConfig = pieConfig;
    break;
  case NIVO_CHART_TYPES.CHOROPLETH:
    chartConfig = choroplethConfig;
    break;
  default:
    chartConfig = lineConfig;
}
  
  const containerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    borderRadius: '6px',
    padding: '6px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={containerStyle}>
      {title && width > 120 && (
        <div style={{
          color: colors.text,
          fontSize: Math.max(10, Math.min(14, width / 25)),
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '4px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          {title}
        </div>
      )}
      <div style={{ width: '100%', flex: 1, minHeight: '80px' }}>
        <ChartComponent
          data={nivoData}
          {...chartConfig}
          theme={nivoTheme}
        />
      </div>
    </div>
  );
};

export default NivoAdapter;