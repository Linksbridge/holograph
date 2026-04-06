/**
 * Nivo Adapter Component
 * 
 * A component that renders various Nivo chart types.
 * Supports: Line, Bar, Pie
 * Includes legend and responsive sizing.
 * Nivo is known for beautiful, animated charts with good defaults.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveChoropleth } from '@nivo/geo';
import { CHART_TYPES, CHART_LIBRARIES, THEMES } from '@holograph/dashboard-schema';

// GeoJSON sources for choropleth maps (Natural Earth via CartoDB CDN)
const GEO_FEATURE_URLS = {
  'world-50m': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
  'world-110m': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
  'usa': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces.geojson',
  'europe': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
};

// Module-level cache so features are only fetched once per session
const featureCache = {};

const loadGeoFeatures = async (mapFeatures, geoJsonUrl) => {
  const url = mapFeatures === 'custom' ? geoJsonUrl : GEO_FEATURE_URLS[mapFeatures];
  if (!url) return [];
  if (featureCache[url]) return featureCache[url];
  const res = await fetch(url);
  const json = await res.json();
  const features = (json.features || []).map(f => ({
    ...f,
    // iso_3166_2 covers sub-national features (US-CA, CA-ON …)
    // iso_a3 / ISO_A3 / adm0_a3 cover sovereign countries (USA, GBR …)
    id: f.properties?.iso_3166_2
      || (f.properties?.iso_a3 !== '-99' ? f.properties?.iso_a3 : null)
      || (f.properties?.ISO_A3  !== '-99' ? f.properties?.ISO_A3  : null)
      || f.properties?.adm0_a3
      || f.id,
  }));
  featureCache[url] = features;
  return features;
};

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

// Demo data for choropleth maps (US states with sample values)
const DEMO_CHOROPLETH_DATA = [
  { id: 'US-CA', label: 'California', value: 39538223 },
  { id: 'US-TX', label: 'Texas', value: 29145505 },
  { id: 'US-FL', label: 'Florida', value: 21538187 },
  { id: 'US-NY', label: 'New York', value: 20201249 },
  { id: 'US-PA', label: 'Pennsylvania', value: 13002700 },
  { id: 'US-IL', label: 'Illinois', value: 12812508 },
  { id: 'US-OH', label: 'Ohio', value: 11799448 },
  { id: 'US-GA', label: 'Georgia', value: 10711908 },
  { id: 'US-NC', label: 'North Carolina', value: 10439388 },
  { id: 'US-MI', label: 'Michigan', value: 10037773 },
  { id: 'US-NJ', label: 'New Jersey', value: 9288994 },
  { id: 'US-VA', label: 'Virginia', value: 8631393 },
  { id: 'US-WA', label: 'Washington', value: 7693612 },
  { id: 'US-AZ', label: 'Arizona', value: 7276316 },
  { id: 'US-MA', label: 'Massachusetts', value: 6981974 },
  { id: 'US-TN', label: 'Tennessee', value: 6910840 },
  { id: 'US-IN', label: 'Indiana', value: 6785528 },
  { id: 'US-MO', label: 'Missouri', value: 6196540 },
  { id: 'US-MD', label: 'Maryland', value: 6177224 },
  { id: 'US-WI', label: 'Wisconsin', value: 5893718 },
];

// Nivo chart component mapping (by our chart type constants)
const NIVO_CHART_COMPONENTS = {
  [CHART_TYPES.NIVO_LINE]: ResponsiveLine,
  [CHART_TYPES.NIVO_BAR]: ResponsiveBar,
  [CHART_TYPES.NIVO_PIE]: ResponsivePie,
  [CHART_TYPES.NIVO_CHOROPLETH]: ResponsiveChoropleth,
};

// Map nivo chart types to components
const getNivoChartComponent = (nivoChartType) => {
  switch (nivoChartType) {
    case NIVO_CHART_TYPES.LINE:
      return ResponsiveLine;
    case NIVO_CHART_TYPES.BAR:
      return ResponsiveBar;
    case NIVO_CHART_TYPES.PIE:
      return ResponsivePie;
    case NIVO_CHART_TYPES.CHOROPLETH:
      return ResponsiveChoropleth;
    default:
      return ResponsiveLine;
  }
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
  tooltip,
  zoneConfig = {},
}) => {
  const colors = THEMES[theme] || THEMES.default;
  const legendEnabled = legend?.enabled !== false;
  const showLegend = legendEnabled && width > 180 && height > 140;

  const [geoFeatures, setGeoFeatures] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [choroplethZoom, setChoroplethZoom] = useState(1);

  const isChoropleth = getNivoChartType(chartType) === NIVO_CHART_TYPES.CHOROPLETH;

  // Reset zoom when the map source changes
  useEffect(() => {
    setChoroplethZoom(1);
  }, [zoneConfig.mapFeatures]);

  useEffect(() => {
    if (!isChoropleth) return;
    const mapFeatures = zoneConfig.mapFeatures || 'usa';
    const geoJsonUrl = zoneConfig.geoJsonUrl || '';
    if (mapFeatures === 'custom' && !geoJsonUrl) return;
    setGeoLoading(true);
    setGeoError(null);
    loadGeoFeatures(mapFeatures, geoJsonUrl)
      .then(setGeoFeatures)
      .catch(err => setGeoError(err.message))
      .finally(() => setGeoLoading(false));
  }, [isChoropleth, zoneConfig.mapFeatures, zoneConfig.geoJsonUrl]);
  
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
  // For choropleth, use demo data if no data is provided
  const chartData = (getNivoChartType(chartType) === NIVO_CHART_TYPES.CHOROPLETH && (!data || data.length === 0))
    ? DEMO_CHOROPLETH_DATA
    : data;

  if (!chartData || chartData.length === 0) return [];

  const palette = [...DEFAULT_PALETTE];
  
  // For pie chart - nivo pie expects { id, value, label }
  if (getNivoChartType(chartType) === NIVO_CHART_TYPES.PIE) {
    return chartData.map((item, index) => ({
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
    return chartData.map((item, index) => ({
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
      data: chartData.map(item => ({
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
const choroplethConfig = useMemo(() => {
  // Compute domain from the data that will actually be rendered (including demo data)
  const renderData = (getNivoChartType(chartType) === NIVO_CHART_TYPES.CHOROPLETH && (!data || data.length === 0))
    ? DEMO_CHOROPLETH_DATA
    : (data || []);
  const values = renderData.map(d => d.value).filter(v => typeof v === 'number' && !isNaN(v));
  const domainMin = values.length ? Math.min(...values) : 0;
  const domainMax = values.length ? Math.max(...values) : 100;

  // Determine projection — Nivo supports: mercator, naturalEarth1, equirectangular, etc.
  // NOTE: 'albersUsa' is NOT supported by Nivo — sanitize any stored value to 'mercator'.
  const mapSrc = zoneConfig.mapFeatures || 'usa';
  const isUsa = mapSrc === 'usa';
  const rawProjection = zoneConfig.projectionType || (isUsa ? 'mercator' : 'naturalEarth1');
  const effectiveProjection = rawProjection === 'albersUsa' ? 'mercator' : rawProjection;

  const margin = 40;
  const availW = Math.max(100, width - margin);
  const availH = Math.max(60, height - margin);
  // Combined zoom factor (slider % × button zoom)
  const zf = (zoneConfig.projectionScale || 100) / 100 * choroplethZoom;

  let autoScale, projTrans;
  if (isUsa && effectiveProjection === 'mercator') {
    // Scale so the contiguous US fills ~90% of the container width.
    // Center on lon=-96°, lat=39° using mercator projection math:
    //   tx_nivo = 0.5 + s * lon_rad * zf       where lon_rad(96°) = 1.676
    //   ty_nivo = 0.5 + s * lat_merc * (W/H) * zf  where lat_merc(39°) ≈ 0.745
    const s = 0.9;
    autoScale = availW * s;
    projTrans = [
      0.5 + s * 1.676 * zf,
      0.5 + s * 0.745 * (availW / availH) * zf,
    ];
  } else {
    autoScale = availW * 0.145;
    projTrans = [0.5, 0.5];
  }
  const effectiveScale = autoScale * zf;

  return ({
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  features: geoFeatures,
  projectionType: effectiveProjection,
  projectionScale: effectiveScale,
  projectionTranslation: projTrans,
  match: zoneConfig.matchBy === 'properties.name'
    ? (feature, datum) => (feature.properties?.name || feature.properties?.NAME) === datum.id
    : zoneConfig.matchBy === 'properties.iso_a3'
    ? (feature, datum) => (feature.properties?.iso_a3 || feature.properties?.ISO_A3) === datum.id
    : undefined,
  colors: 'blues',
  domain: [domainMin, domainMax],
  unknownColor: '#e0e0e0',
  borderColor: { from: 'color', modifiers: [['darker', 0.2]] },
  defs: [],
  fill: [],
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
});
}, [showLegend, colors, fontSize, data, chartType, geoFeatures, width, height, zoneConfig.mapFeatures, zoneConfig.projectionType, zoneConfig.projectionScale, zoneConfig.matchBy, choroplethZoom]);
  
// Get the appropriate chart component and config
const nivoChartType = getNivoChartType(chartType);
const ChartComponent = getNivoChartComponent(nivoChartType);

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
      <div style={{ width: '100%', flex: 1, minHeight: '80px', position: 'relative' }}>
        {isChoropleth && geoLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.text, fontSize: fontSize }}>
            Loading map data...
          </div>
        ) : isChoropleth && geoError ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontSize: fontSize, padding: '8px', textAlign: 'center' }}>
            Failed to load map: {geoError}
          </div>
        ) : isChoropleth ? (
          <>
            <ChartComponent
              data={nivoData}
              {...chartConfig}
              theme={nivoTheme}
            />
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', flexDirection: 'column', gap: '3px', zIndex: 10 }}>
              {[
                { label: '+', fn: z => Math.min(z * 1.25, 8) },
                { label: '−', fn: z => Math.max(z * 0.8, 0.125) },
              ].map(({ label, fn }) => (
                <button
                  key={label}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => setChoroplethZoom(fn)}
                  style={{
                    width: '22px', height: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: colors.background,
                    border: `1px solid ${colors.grid}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: '14px',
                    lineHeight: 1,
                    padding: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                >{label}</button>
              ))}
            </div>
          </>
        ) : (
          <ChartComponent
            data={nivoData}
            {...chartConfig}
            theme={nivoTheme}
          />
        )}
      </div>
    </div>
  );
};

export default NivoAdapter;
