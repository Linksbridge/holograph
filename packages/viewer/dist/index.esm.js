import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import GridLayout from 'react-grid-layout';
import * as d3 from 'd3';
import { Chart as Chart$1, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { PolarArea, Radar, Doughnut, Pie, Bar, Line, Chart } from 'react-chartjs-2';
import { BubbleMapController, ProjectionScale, GeoFeature, SizeScale } from 'chartjs-chart-geo';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveChoropleth } from '@nivo/geo';

/**
 * Data Service for DashboardViewer
 *
 * Fetches live data from holograph-data-server when dataQueryUrl is set.
 * Also supports uploaded file sources via fileSourceRegistry.
 * Returns empty results when no data source is configured — no mock fallback.
 */

// Cache for columns, unique values, and fetched rows
let columnsCache = {};
let queryDataCache = {};

// Live data endpoint from dashboard JSON
let dataQueryUrl = null;
let authToken = null;
const setAuthToken = token => {
  authToken = token || null;
};

// File sources uploaded to the backend: name -> { id, columns, fileDataUrl }
let fileSourceRegistry = {};
const setDataQueryUrl = (url, id = null) => {
  dataQueryUrl = url || null;
  queryDataCache = {};
};
const setDashboardFileSources = (fileSources = [], fileDataUrl = null) => {
  fileSourceRegistry = {};
  fileSources.forEach(fs => {
    fileSourceRegistry[fs.name] = {
      id: fs.id,
      columns: fs.columns || [],
      fileDataUrl
    };
    delete queryDataCache[fs.name];
    delete columnsCache[fs.name];
  });
};
const clearQueryDataCache = () => {
  queryDataCache = {};
};
const initializeDataService = async (url = null, id = null) => {
  dataQueryUrl = url || null;
  columnsCache = {};
  queryDataCache = {};
};

// --- Fetchers ---

const fetchLiveData = async tableName => {
  if (queryDataCache[tableName]) return queryDataCache[tableName];
  const headers = authToken ? {
    Authorization: `Bearer ${authToken}`
  } : {};
  // URL template uses path params: /api/data/{datasource}/{table} — resolve {table} dynamically
  const url = dataQueryUrl.replace('{table}', encodeURIComponent(tableName));
  const response = await fetch(url, {
    headers
  });
  if (!response.ok) throw new Error(`Data fetch failed: ${response.status} ${response.statusText}`);
  const result = await response.json();
  const rows = result.data || result.rows || [];
  queryDataCache[tableName] = rows;
  if (rows.length > 0) columnsCache[tableName] = Object.keys(rows[0]);
  return rows;
};
const fetchFileSourceData = async tableName => {
  if (queryDataCache[tableName]) return queryDataCache[tableName];
  const {
    id,
    fileDataUrl
  } = fileSourceRegistry[tableName];
  if (!fileDataUrl) throw new Error(`No fileDataUrl configured for file source "${tableName}"`);
  const url = `${fileDataUrl}/${encodeURIComponent(id)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`File data fetch failed: ${response.status} ${response.statusText}`);
  const result = await response.json();
  const rows = result.rows || [];
  queryDataCache[tableName] = rows;
  return rows;
};
const fetchRows = async tableName => {
  if (fileSourceRegistry[tableName]) return fetchFileSourceData(tableName);
  if (dataQueryUrl) return fetchLiveData(tableName);
  return [];
};
const applyFilters = (rows, filters) => {
  if (!filters || Object.keys(filters).length === 0) return rows;
  return rows.filter(row => {
    for (const [col, filterDef] of Object.entries(filters)) {
      if (!filterDef) continue;
      if (!applyFilterToRow(row, col, filterDef)) return false;
    }
    return true;
  });
};

// --- Filter engine ---

const isNoValueOp = op => op === 'isBlank' || op === 'isNotBlank';
const applyCondition = (rowValue, condition) => {
  const {
    operator,
    value
  } = condition;
  const str = String(rowValue ?? '').toLowerCase();
  const cond = String(value ?? '').toLowerCase();
  const numRow = parseFloat(rowValue);
  const numCond = parseFloat(value);
  switch (operator) {
    case 'is':
      return str === cond;
    case 'isNot':
      return str !== cond;
    case 'contains':
      return str.includes(cond);
    case 'doesNotContain':
      return !str.includes(cond);
    case 'startsWith':
      return str.startsWith(cond);
    case 'endsWith':
      return str.endsWith(cond);
    case 'isBlank':
      return rowValue === null || rowValue === undefined || rowValue === '';
    case 'isNotBlank':
      return rowValue !== null && rowValue !== undefined && rowValue !== '';
    case 'eq':
      return numRow === numCond;
    case 'neq':
      return numRow !== numCond;
    case 'gt':
      return numRow > numCond;
    case 'gte':
      return numRow >= numCond;
    case 'lt':
      return numRow < numCond;
    case 'lte':
      return numRow <= numCond;
    default:
      return true;
  }
};
const applyFilterToRow = (row, columnName, filterDef) => {
  const rowValue = row[columnName];
  if (Array.isArray(filterDef)) {
    if (filterDef.length === 0) return true;
    return filterDef.includes(rowValue);
  }
  if (!filterDef || typeof filterDef !== 'object') return true;
  const {
    mode,
    filterType,
    values,
    logicalOperator,
    conditions
  } = filterDef;
  if (mode === 'basic') {
    if (!values || values.length === 0) return true;
    const included = values.includes(rowValue);
    return filterType === 'exclude' ? !included : included;
  }
  if (mode === 'advanced') {
    const active = (conditions || []).filter(c => isNoValueOp(c.operator) || c.value !== '' && c.value !== null && c.value !== undefined);
    if (active.length === 0) return true;
    const results = active.map(c => applyCondition(rowValue, c));
    return logicalOperator === 'or' ? results.some(Boolean) : results.every(Boolean);
  }
  return true;
};
const fetchChartDataMulti = async (tableName, labelColumn, valueColumns, filters = null) => {
  const cols = Array.isArray(valueColumns) ? valueColumns : valueColumns ? [valueColumns] : [];
  const rows = await fetchRows(tableName);
  const filtered = applyFilters(rows, filters);
  return filtered.map(row => {
    const point = {
      label: row[labelColumn] ?? row[Object.keys(row)[0]]
    };
    cols.forEach(col => {
      point[col] = row[col];
    });
    return point;
  });
};
const fetchTableData = async (tableName, columns = null, filters = null) => {
  const rows = await fetchRows(tableName);
  const filtered = applyFilters(rows, filters);
  if (columns && columns.length > 0) {
    return filtered.map(row => {
      const out = {};
      columns.forEach(c => {
        out[c] = row[c];
      });
      return out;
    });
  }
  return filtered;
};

/**
 * Dashboard Schema Constants
 * 
 * These constants define the available options for dashboard configuration.
 * This is a framework-agnostic module that can be used in any JavaScript project.
 */

// Component types (charts and tables)
const COMPONENT_TYPES = {
  CHART: 'chart',
  TABLE: 'table',
  IMAGE: 'image',
  RICHTEXT: 'richtext'
};

// Supported chart library types
const CHART_LIBRARIES = {
  D3: 'd3',
  CHARTJS: 'chartjs',
  NIVO: 'nivo'
};

// Chart types available in each library
const CHART_TYPES = {
  // D3 chart types
  D3_BAR: 'bar',
  D3_LINE: 'line',
  D3_AREA: 'area',
  D3_PIE: 'pie',
  D3_DONUT: 'donut',
  D3_SCATTER: 'scatter',
  // Chart.js chart types
  CHARTJS_LINE: 'line',
  CHARTJS_BAR: 'bar',
  CHARTJS_PIE: 'pie',
  CHARTJS_DOUGHNUT: 'doughnut',
  CHARTJS_RADAR: 'radar',
  CHARTJS_POLAR: 'polarArea',
  // Nivo chart types
  NIVO_LINE: 'nivo_line',
  NIVO_BAR: 'nivo_bar',
  NIVO_PIE: 'nivo_pie',
  NIVO_CHOROPLETH: 'nivo_choropleth',
  // Chart.js geo types
  CHARTJS_BUBBLEMAP: 'chartjs_bubblemap'
};

// Map chart types to their libraries
const CHART_TYPE_LIBRARY = {
  [CHART_TYPES.D3_BAR]: CHART_LIBRARIES.D3,
  [CHART_TYPES.D3_LINE]: CHART_LIBRARIES.D3,
  [CHART_TYPES.D3_AREA]: CHART_LIBRARIES.D3,
  [CHART_TYPES.D3_PIE]: CHART_LIBRARIES.D3,
  [CHART_TYPES.D3_DONUT]: CHART_LIBRARIES.D3,
  [CHART_TYPES.D3_SCATTER]: CHART_LIBRARIES.D3,
  [CHART_TYPES.CHARTJS_LINE]: CHART_LIBRARIES.CHARTJS,
  [CHART_TYPES.CHARTJS_BAR]: CHART_LIBRARIES.CHARTJS,
  [CHART_TYPES.CHARTJS_PIE]: CHART_LIBRARIES.CHARTJS,
  [CHART_TYPES.CHARTJS_DOUGHNUT]: CHART_LIBRARIES.CHARTJS,
  [CHART_TYPES.CHARTJS_RADAR]: CHART_LIBRARIES.CHARTJS,
  [CHART_TYPES.CHARTJS_POLAR]: CHART_LIBRARIES.CHARTJS,
  [CHART_TYPES.NIVO_LINE]: CHART_LIBRARIES.NIVO,
  [CHART_TYPES.NIVO_BAR]: CHART_LIBRARIES.NIVO,
  [CHART_TYPES.NIVO_PIE]: CHART_LIBRARIES.NIVO,
  [CHART_TYPES.NIVO_CHOROPLETH]: CHART_LIBRARIES.NIVO,
  [CHART_TYPES.CHARTJS_BUBBLEMAP]: CHART_LIBRARIES.CHARTJS
};

// Default chart types per library
const DEFAULT_CHART_TYPE = {
  [CHART_LIBRARIES.D3]: CHART_TYPES.D3_BAR,
  [CHART_LIBRARIES.CHARTJS]: CHART_TYPES.CHARTJS_LINE,
  [CHART_LIBRARIES.NIVO]: CHART_TYPES.NIVO_LINE
};

// Responsive sizing modes
const SIZING_MODES = {
  FIXED: 'fixed',
  // Fixed pixel-based sizing
  RESPONSIVE: 'responsive',
  // Proportional sizing based on container
  AUTO: 'auto' // Auto-fit to content
};

// Color themes available
const COLOR_THEMES = {
  DEFAULT: 'default',
  OCEAN: 'ocean',
  SUNSET: 'sunset',
  FOREST: 'forest',
  MONOCHROME: 'monochrome'
};

// Legend position options
const LEGEND_POSITIONS = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  NONE: 'none'
};

// Theme color palettes
const THEMES = {
  [COLOR_THEMES.DEFAULT]: {
    primary: '#3b82f6',
    secondary: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    grid: '#e5e7eb'
  },
  [COLOR_THEMES.OCEAN]: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    background: '#f0f9ff',
    text: '#0c4a6e',
    grid: '#bae6fd'
  },
  [COLOR_THEMES.SUNSET]: {
    primary: '#f97316',
    secondary: '#ef4444',
    background: '#fff7ed',
    text: '#7c2d12',
    grid: '#fed7aa'
  },
  [COLOR_THEMES.FOREST]: {
    primary: '#22c55e',
    secondary: '#14b8a6',
    background: '#f0fdf4',
    text: '#14532d',
    grid: '#bbf7d0'
  },
  [COLOR_THEMES.MONOCHROME]: {
    primary: '#6b7280',
    secondary: '#9ca3af',
    background: '#f9fafb',
    text: '#111827',
    grid: '#d1d5db'
  }
};

// Column requirements per chart type. valueMax: null = unlimited series.
const CHART_COLUMN_SCHEMA = {
  // Single-series only
  pie: {
    labelCount: 1,
    valueMin: 1,
    valueMax: 1
  },
  doughnut: {
    labelCount: 1,
    valueMin: 1,
    valueMax: 1
  },
  donut: {
    labelCount: 1,
    valueMin: 1,
    valueMax: 1
  },
  polarArea: {
    labelCount: 1,
    valueMin: 1,
    valueMax: 1
  },
  scatter: {
    labelCount: 0,
    valueMin: 1,
    valueMax: 1
  },
  chartjs_bubblemap: {
    labelCount: 1,
    valueMin: 1,
    valueMax: 1
  },
  nivo_pie: {
    labelCount: 1,
    valueMin: 1,
    valueMax: 1
  },
  nivo_choropleth: {
    labelCount: 1,
    valueMin: 1,
    valueMax: 1
  },
  // Multi-series capable
  bar: {
    labelCount: 1,
    valueMin: 1,
    valueMax: null
  },
  line: {
    labelCount: 1,
    valueMin: 1,
    valueMax: null
  },
  area: {
    labelCount: 1,
    valueMin: 1,
    valueMax: null
  },
  radar: {
    labelCount: 1,
    valueMin: 1,
    valueMax: null
  },
  nivo_line: {
    labelCount: 1,
    valueMin: 1,
    valueMax: null
  },
  nivo_bar: {
    labelCount: 1,
    valueMin: 1,
    valueMax: null
  }
};

/**
 * Dashboard Schema Types
 * 
 * This file defines the JSON schema structure for the dashboard state.
 * The entire dashboard is represented by a single JSON object.
 * 
 * Layout Storage Format:
 * - Grid positions (x, y, w, h) are stored as grid UNITs (relative), not pixels
 * - This allows the dashboard to scale proportionally across screen sizes
 * - The actual pixel size is calculated based on container width and rowHeight
 */


/**
 * Creates a new zone configuration
 * @param {string} id - Unique zone identifier
 * @returns {ZoneConfig} Default zone configuration
 */
const createZoneConfig = id => ({
  id,
  componentType: COMPONENT_TYPES.CHART,
  library: CHART_LIBRARIES.CHARTJS,
  chartType: CHART_TYPES.CHARTJS_LINE,
  theme: COLOR_THEMES.DEFAULT,
  title: 'New Chart',
  showHeader: true,
  legend: {
    enabled: true,
    position: LEGEND_POSITIONS.BOTTOM
  },
  dataSource: {
    tableName: 'sales_data',
    labelColumn: 'month',
    valueColumns: ['revenue']
  },
  gridPosition: {
    x: 0,
    y: 0,
    w: 6,
    h: 4
  }
});

/**
 * Creates the initial dashboard schema
 * @returns {DashboardSchema} Initial dashboard state
 */
const createInitialDashboard = () => ({
  version: '1.0.0',
  name: 'My Dashboard',
  description: 'A zero-VM dashboard with pluggable chart adapters',
  showTitle: true,
  showSubtitle: true,
  zones: [{
    ...createZoneConfig('zone-1'),
    title: 'Monthly Revenue',
    gridPosition: {
      x: 0,
      y: 0,
      w: 6,
      h: 4
    }
  }, {
    ...createZoneConfig('zone-2'),
    title: 'Sales by Region',
    library: CHART_LIBRARIES.D3,
    chartType: CHART_TYPES.D3_BAR,
    gridPosition: {
      x: 6,
      y: 0,
      w: 6,
      h: 4
    }
  }, {
    ...createZoneConfig('zone-3'),
    title: 'Product Trends',
    chartType: CHART_TYPES.CHARTJS_BAR,
    gridPosition: {
      x: 0,
      y: 4,
      w: 4,
      h: 4
    }
  }, {
    ...createZoneConfig('zone-4'),
    title: 'Customer Growth',
    library: CHART_LIBRARIES.D3,
    chartType: CHART_TYPES.D3_LINE,
    gridPosition: {
      x: 4,
      y: 4,
      w: 4,
      h: 4
    }
  }, {
    ...createZoneConfig('zone-5'),
    title: 'Performance Metrics',
    chartType: CHART_TYPES.CHARTJS_PIE,
    gridPosition: {
      x: 8,
      y: 4,
      w: 4,
      h: 4
    }
  }],
  layout: {
    cols: 12,
    rowHeight: 30,
    margin: [10, 10],
    sizingMode: SIZING_MODES.RESPONSIVE,
    // Responsive breakpoints for different screen sizes
    breakpoints: {
      lg: {
        cols: 12,
        rowHeight: 30
      },
      md: {
        cols: 8,
        rowHeight: 40
      },
      sm: {
        cols: 4,
        rowHeight: 50
      },
      xs: {
        cols: 2,
        rowHeight: 60
      }
    }
  }
});

/**
 * DashboardViewer Component
 * 
 * An embeddable React component that displays a dashboard based on the provided
 * schema. Supports external filters passed as props for integration with
 * parent applications.
 * 
 * Data can be provided in two ways:
 * 1. Via the `data` prop - pass data directly as an object keyed by zone ID
 * 2. Via the dataSource in each zone - uses the dataService to fetch data
 * 
 * @package @holograph/dashboard-viewer
 */


// Lazy-load chart adapters so only the libraries used in the dashboard are downloaded
const D3Adapter$2 = /*#__PURE__*/React.lazy(() => Promise.resolve().then(function () { return D3Adapter$1; }));
const ChartJsAdapter$2 = /*#__PURE__*/React.lazy(() => Promise.resolve().then(function () { return ChartJsAdapter$1; }));
const NivoAdapter$2 = /*#__PURE__*/React.lazy(() => Promise.resolve().then(function () { return NivoAdapter$1; }));

/**
 * Individual Chart/Table Component within a zone
 * 
 * @param {Object} props - Component props
 * @param {Object} props.zone - Zone configuration
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Callback for filter changes
 * @param {Array} props.zoneData - Optional data passed directly via props (bypasses data service)
 */
const ZoneContent = ({
  zone,
  filters,
  onFilterChange,
  zoneData,
  resolvedStyles = {},
  activeDataQueryUrl
}) => {
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: 300,
    height: 200
  });
  const containerRef = useRef(null);
  const {
    library,
    theme,
    title,
    dataSource,
    chartType,
    legend
  } = zone;
  const effectiveChartType = chartType || DEFAULT_CHART_TYPE[library] || CHART_TYPES.CHARTJS_LINE;
  const valueColumns = dataSource?.valueColumns ?? (dataSource?.valueColumn ? [dataSource.valueColumn] : []);

  // Get theme colors
  THEMES[theme] || THEMES.default;

  // Resize observer for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const {
          width: containerWidth,
          height: containerHeight
        } = entry.contentRect;
        const chartWidth = Math.max(150, containerWidth - 16);
        const chartHeight = Math.max(120, containerHeight - 16);
        setDimensions({
          width: chartWidth,
          height: chartHeight
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch data for charts - only if zoneData is not provided via props
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // If data was passed directly via props, use it
      if (zoneData !== undefined) {
        setLoading(false);
        if (zone.componentType === COMPONENT_TYPES.TABLE) {
          setTableData(zoneData);
        } else {
          setChartData(zoneData);
        }
        return;
      }

      // Otherwise, fetch data from the data service
      if (!dataSource?.tableName) {
        // For choropleth charts, pass empty array so demo data can be shown
        if (effectiveChartType === CHART_TYPES.NIVO_CHOROPLETH) {
          setChartData([]);
        }
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (zone.componentType === COMPONENT_TYPES.TABLE) {
          const data = await fetchTableData(dataSource.tableName, null,
          // Get all columns
          filters);
          if (isMounted) {
            setTableData(data);
          }
        } else {
          const data = await fetchChartDataMulti(dataSource.tableName, dataSource.labelColumn, valueColumns, filters);
          if (isMounted) {
            setChartData(data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [zoneData, dataSource?.tableName, dataSource?.labelColumn, JSON.stringify(valueColumns), zone.componentType, JSON.stringify(filters), activeDataQueryUrl]);

  // Determine which adapter to use
  const Adapter = useMemo(() => {
    if (zone.componentType === COMPONENT_TYPES.TABLE) {
      return null; // Will render table directly
    }
    switch (library) {
      case CHART_LIBRARIES.D3:
        return D3Adapter$2;
      case CHART_LIBRARIES.NIVO:
        return NivoAdapter$2;
      case CHART_LIBRARIES.CHARTJS:
      default:
        return ChartJsAdapter$2;
    }
  }, [library, zone.componentType]);

  // Container base style
  const containerBaseStyle = {
    width: '100%',
    height: '100%',
    minHeight: '100px',
    overflow: 'hidden'
  };

  // Loading state
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      ref: containerRef,
      style: containerBaseStyle,
      className: "viewer-zone-loading"
    }, /*#__PURE__*/React.createElement("div", {
      className: "viewer-spinner"
    }), /*#__PURE__*/React.createElement("span", {
      className: "viewer-zone-loading-text"
    }, "Loading..."));
  }

  // Error state
  if (error) {
    return /*#__PURE__*/React.createElement("div", {
      ref: containerRef,
      style: containerBaseStyle,
      className: "viewer-zone-error"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "viewer-zone-error-icon"
    }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", {
      className: "viewer-zone-error-text"
    }, error)));
  }

  // Empty data state
  // For choropleth charts, show demo data even when no data source is connected
  const isChoropleth = effectiveChartType === CHART_TYPES.NIVO_CHOROPLETH;
  const isEmpty = zone.componentType === COMPONENT_TYPES.TABLE ? !tableData || tableData.length === 0 : !isChoropleth && (!chartData || chartData.length === 0);
  if (isEmpty) {
    return /*#__PURE__*/React.createElement("div", {
      ref: containerRef,
      style: containerBaseStyle,
      className: "viewer-zone-empty"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "viewer-zone-empty-icon"
    }, "\uD83D\uDCCA"), /*#__PURE__*/React.createElement("div", {
      className: "viewer-zone-empty-text"
    }, "No data")));
  }

  // Render table
  if (zone.componentType === COMPONENT_TYPES.TABLE) {
    const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
    return /*#__PURE__*/React.createElement("div", {
      ref: containerRef,
      style: containerBaseStyle,
      className: "viewer-table-container"
    }, /*#__PURE__*/React.createElement("table", {
      className: "viewer-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(col => /*#__PURE__*/React.createElement("th", {
      key: col
    }, col)))), /*#__PURE__*/React.createElement("tbody", null, tableData.map((row, idx) => /*#__PURE__*/React.createElement("tr", {
      key: idx
    }, columns.map(col => /*#__PURE__*/React.createElement("td", {
      key: col
    }, row[col])))))));
  }

  // Render chart
  return /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    style: containerBaseStyle
  }, Adapter && /*#__PURE__*/React.createElement(Suspense, {
    fallback: /*#__PURE__*/React.createElement("div", {
      style: containerBaseStyle,
      className: "viewer-zone-loading"
    }, /*#__PURE__*/React.createElement("div", {
      className: "viewer-spinner"
    }), /*#__PURE__*/React.createElement("span", {
      className: "viewer-zone-loading-text"
    }, "Loading..."))
  }, /*#__PURE__*/React.createElement(Adapter, {
    data: chartData,
    valueColumns: valueColumns,
    theme: theme,
    width: dimensions.width,
    height: dimensions.height,
    title: title,
    chartType: effectiveChartType,
    legend: legend,
    zoneConfig: zone,
    resolvedStyles: resolvedStyles
  })));
};

/**
 * DashboardViewer Component
 * 
 * Main export - an embeddable dashboard viewer that accepts schema and filters as props.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.dashboard - Dashboard schema object (optional — renders idle state when absent)
 * @param {Object} props.data - Optional data object keyed by zone ID (bypasses data service)
 * @param {Object} props.filters - Optional filter values to apply to all charts
 * @param {Function} props.onFilterChange - Optional callback when filters change internally
 * @param {string} props.className - Optional CSS class name
 */
const normalizeDashboard = raw => {
  if (!raw || typeof raw !== 'object') return null;
  // API returns { id, name, dataQueryUrl, schema: { zones, layout, ... } }; flatten schema to root when present
  const flat = raw.schema && typeof raw.schema === 'object' ? {
    ...raw,
    ...raw.schema
  } : raw;
  // Schema's dataQueryUrl may be empty string — fall back to root's which has the real URL
  const dataQueryUrl = flat.dataQueryUrl || raw.dataQueryUrl || '';
  return {
    ...flat,
    dataQueryUrl,
    zones: Array.isArray(flat.zones) ? flat.zones.filter(z => z && z.id) : []
  };
};
const DashboardViewer = ({
  dashboard,
  data = {},
  filters = {},
  onFilterChange,
  className = '',
  fileSources = [],
  fileDataUrl = '',
  authToken = null
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(filters);
  const [gridWidth, setGridWidth] = useState(1200);
  const [resolvedStyles, setResolvedStyles] = useState({});
  // React-tracked copy of the module-level dataQueryUrl so ZoneContent re-fetches when it changes
  const [activeDataQueryUrl, setActiveDataQueryUrl] = useState(null);
  const containerRef = useRef(null);
  const normalizedDashboard = useMemo(() => normalizeDashboard(dashboard), [dashboard]);

  // Initialize data service on mount
  useEffect(() => {
    const init = async () => {
      await initializeDataService();
      setIsInitialized(true);
    };
    init();
  }, []);

  // Wire live data endpoint and clear stale cache whenever a new dashboard arrives.
  // Falls back to fileDataUrl when the dashboard schema has no dataQueryUrl of its own.
  // Also updates activeDataQueryUrl so ZoneContent dep arrays re-trigger when URL changes.
  useEffect(() => {
    if (!normalizedDashboard) return;
    clearQueryDataCache();
    const queryUrl = normalizedDashboard.dataQueryUrl || fileDataUrl || null;
    setDataQueryUrl(queryUrl, normalizedDashboard.id || null);
    setActiveDataQueryUrl(queryUrl);
  }, [normalizedDashboard, fileDataUrl]);

  // Register file sources whenever they change
  useEffect(() => {
    if (fileSources?.length > 0 && fileDataUrl) {
      setDashboardFileSources(fileSources, fileDataUrl);
    }
  }, [fileSources, fileDataUrl]);

  // Forward auth token to data service; clear cache so charts re-fetch with new credentials
  useEffect(() => {
    setAuthToken(authToken);
    clearQueryDataCache();
  }, [authToken]);

  // Read CSS custom properties from container so chart internals can use host-app theme values
  useEffect(() => {
    if (!containerRef.current) return;
    const computed = getComputedStyle(containerRef.current);
    const fontFamily = computed.getPropertyValue('--hv-font-family').trim();
    setResolvedStyles({
      fontFamily: fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });
  }, []);

  // Sync external filters — use serialized comparison to avoid re-firing on every render
  // when the parent passes a new object reference with the same contents (e.g. default `{}`)
  useEffect(() => {
    setCurrentFilters(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  // Handle filter change from internal components
  const handleFilterChange = newFilters => {
    setCurrentFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Responsive grid width
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setGridWidth(Math.max(400, containerRef.current.offsetWidth - 40));
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Generate layout for react-grid-layout
  const layout = useMemo(() => {
    if (!normalizedDashboard?.zones) return [];
    return normalizedDashboard.zones.map(zone => ({
      i: zone.id,
      x: zone.gridPosition?.x || 0,
      y: zone.gridPosition?.y || 0,
      w: zone.gridPosition?.w || 4,
      h: zone.gridPosition?.h || 4,
      minW: 2,
      minH: 2
    }));
  }, [normalizedDashboard?.zones]);

  // Default layout settings
  const cols = normalizedDashboard?.layout?.cols || 12;
  const rowHeight = normalizedDashboard?.layout?.rowHeight || 30;
  const margin = normalizedDashboard?.layout?.margin || [10, 10];

  // Helper to get library attribute value
  const getLibraryAttr = lib => {
    if (lib === CHART_LIBRARIES.D3) return 'd3';
    if (lib === CHART_LIBRARIES.CHARTJS) return 'chartjs';
    if (lib === CHART_LIBRARIES.NIVO) return 'nivo';
    return 'chartjs';
  };
  if (!normalizedDashboard) {
    return /*#__PURE__*/React.createElement("div", {
      className: `dashboard-viewer ${className}`,
      ref: containerRef
    }, /*#__PURE__*/React.createElement("div", {
      className: "viewer-empty-state"
    }, /*#__PURE__*/React.createElement("p", null, "Waiting for dashboard\u2026")));
  }
  if (!isInitialized) {
    return /*#__PURE__*/React.createElement("div", {
      className: `dashboard-viewer ${className}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "viewer-loading"
    }, /*#__PURE__*/React.createElement("div", {
      className: "viewer-spinner-large"
    }), /*#__PURE__*/React.createElement("span", null, "Initializing...")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `dashboard-viewer ${className}`,
    ref: containerRef
  }, normalizedDashboard.zones?.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "viewer-empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No charts to display")) : /*#__PURE__*/React.createElement(GridLayout, {
    className: "layout",
    layout: layout,
    cols: cols,
    rowHeight: rowHeight,
    margin: margin,
    width: gridWidth,
    isDraggable: false,
    isResizable: false,
    compactType: "vertical",
    preventCollision: false,
    useCSSTransforms: true,
    containerPadding: [10, 10]
  }, normalizedDashboard.zones?.map(zone => /*#__PURE__*/React.createElement("div", {
    key: zone.id,
    className: "viewer-zone-card",
    "data-component-type": zone.componentType === COMPONENT_TYPES.TABLE ? 'table' : 'chart',
    "data-library": getLibraryAttr(zone.library),
    "data-theme": zone.theme || 'default'
  }, zone.showHeader !== false && /*#__PURE__*/React.createElement("div", {
    className: "viewer-zone-header"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "viewer-zone-title"
  }, zone.title)), /*#__PURE__*/React.createElement("div", {
    className: "viewer-zone-chart-container"
  }, /*#__PURE__*/React.createElement(ZoneContent, {
    zone: zone,
    filters: currentFilters,
    onFilterChange: handleFilterChange,
    zoneData: data[zone.id],
    resolvedStyles: resolvedStyles,
    activeDataQueryUrl: activeDataQueryUrl
  }))))));
};

/**
 * @holograph/dashboard-viewer
 * 
 * An embeddable React dashboard viewer component.
 * 
 * Usage:
 * 
 * import { DashboardViewer } from '@holograph/dashboard-viewer';
 * 
 * // With inline schema and data passed via props
 * const myData = {
 *   'zone-1': [
 *     { label: 'Jan', value: 100 },
 *     { label: 'Feb', value: 200 },
 *   ],
 *   'zone-2': [
 *     { label: 'Product A', value: 50 },
 *     { label: 'Product B', value: 75 },
 *   ],
 * };
 * 
 * <DashboardViewer 
 *   dashboard={myDashboardSchema} 
 *   data={myData}
 *   filters={{ region: ['North', 'South'] }}
 * />
 * 
 * // Or without data (will use dataSource from schema to fetch)
 * <DashboardViewer 
 *   dashboard={loadedSchema} 
 *   onFilterChange={(filters) => console.log(filters)}
 * />
 */

/**
 * D3 Adapter Component
 * 
 * A functional component that renders various D3.js chart types.
 * Supports: Bar, Line, Area, Pie, Donut, Scatter
 * Uses useRef and useEffect for D3 rendering with proper cleanup.
 * Includes legend and responsive sizing.
 */

const D3Adapter = ({
  data,
  valueColumns = [],
  theme = 'default',
  width = 400,
  height = 300,
  title,
  chartType = CHART_TYPES.D3_BAR,
  legend,
  resolvedStyles = {}
}) => {
  const svgRef = useRef(null);
  const colors = THEMES[theme] || THEMES.default;
  const fontFamily = resolvedStyles.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Determine if we should show legend - from props or default based on size
  const legendEnabled = legend?.enabled !== false;
  const showLegend = legendEnabled && width > 180 && height > 140;
  const legendHeight = showLegend ? 25 : 0;

  // Color palette for pie/donut/scatter charts
  const colorPalette = [colors.primary, colors.secondary, '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous chart elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create SVG container with viewBox for responsive scaling
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet').style('font-family', fontFamily);

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
  }, [data, valueColumns, theme, width, height, title, chartType, colors, showLegend, legendHeight, colorPalette, fontFamily]);

  // Bar Chart Renderer
  const renderBarChart = (svg, chartData) => {
    const cols = valueColumns.length > 0 ? valueColumns : null;
    const isMulti = cols && cols.length > 1;
    const margin = {
      top: 25,
      right: 15,
      bottom: 40 + legendHeight,
      left: 45
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    if (innerWidth <= 0 || innerHeight <= 0) return;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xFontSize = Math.max(8, Math.min(10, width / 40));
    if (isMulti) {
      const xScale = d3.scaleBand().domain(chartData.map(d => d.label)).range([0, innerWidth]).padding(0.2);
      const xInner = d3.scaleBand().domain(cols).range([0, xScale.bandwidth()]).padding(0.05);
      const allVals = cols.flatMap(c => chartData.map(d => d[c] ?? 0));
      const yScale = d3.scaleLinear().domain([0, (d3.max(allVals) || 1) * 1.1]).range([innerHeight, 0]);
      const xAxisG = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));
      xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`).style('text-anchor', width < 150 ? 'end' : 'middle').attr('transform', width < 150 ? 'rotate(-45)' : '');
      xAxisG.select('.domain').attr('stroke', colors.grid);
      const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(4));
      yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
      yAxisG.select('.domain').attr('stroke', colors.grid);
      g.append('g').attr('class', 'grid').call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat('')).selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
      g.select('.grid .domain').remove();
      cols.forEach((col, ci) => {
        g.selectAll(`.bar-${ci}`).data(chartData).enter().append('rect').attr('class', `bar-${ci}`).attr('x', d => xScale(d.label) + xInner(col)).attr('y', innerHeight).attr('width', xInner.bandwidth()).attr('height', 0).attr('fill', colorPalette[ci % colorPalette.length]).attr('rx', 2).transition().duration(500).delay((d, i) => i * 20).attr('y', d => yScale(d[col] ?? 0)).attr('height', d => innerHeight - yScale(d[col] ?? 0));
      });
      addTitleAndLegend(svg, title, 'Bar Chart', false, cols);
      return;
    }
    const col0 = cols?.[0];
    const xScale = d3.scaleBand().domain(chartData.map(d => d.label)).range([0, innerWidth]).padding(0.3);
    const yScale = d3.scaleLinear().domain([0, (d3.max(chartData, d => d[col0] ?? d.value ?? 0) || 1) * 1.1]).range([innerHeight, 0]);
    const xAxisG = g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));
    xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`).style('text-anchor', width < 150 ? 'end' : 'middle').attr('transform', width < 150 ? 'rotate(-45)' : '');
    xAxisG.select('.domain').attr('stroke', colors.grid);
    const yAxisG = g.append('g').attr('class', 'y-axis').call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat('')).selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();
    g.selectAll('.bar').data(chartData).enter().append('rect').attr('class', 'bar').attr('x', d => xScale(d.label)).attr('y', innerHeight).attr('width', xScale.bandwidth()).attr('height', 0).attr('fill', colors.primary).attr('rx', 2).transition().duration(500).delay((d, i) => i * 20).attr('y', d => yScale(d[col0] ?? d.value ?? 0)).attr('height', d => innerHeight - yScale(d[col0] ?? d.value ?? 0));
    addTitleAndLegend(svg, title, 'Bar Chart');
  };

  // Line Chart Renderer
  const renderLineChart = (svg, chartData) => {
    const cols = valueColumns.length > 0 ? valueColumns : null;
    const isMulti = cols && cols.length > 1;
    const activeCols = isMulti ? cols : cols ? cols : ['value'];
    const margin = {
      top: 25,
      right: 15,
      bottom: 40 + legendHeight,
      left: 45
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    if (innerWidth <= 0 || innerHeight <= 0) return;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xFontSize = Math.max(8, Math.min(10, width / 40));
    const xScale = d3.scalePoint().domain(chartData.map(d => d.label)).range([0, innerWidth]);
    const allVals = activeCols.flatMap(c => chartData.map(d => d[c] ?? d.value ?? 0));
    const yScale = d3.scaleLinear().domain([0, (d3.max(allVals) || 1) * 1.1]).range([innerHeight, 0]);
    const xAxisG = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));
    xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    xAxisG.select('.domain').attr('stroke', colors.grid);
    const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat('')).selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();
    activeCols.forEach((col, ci) => {
      const color = isMulti ? colorPalette[ci % colorPalette.length] : colors.primary;
      const getValue = d => d[col] ?? d.value ?? 0;
      g.append('path').datum(chartData).attr('fill', `${color}20`).attr('d', d3.area().x(d => xScale(d.label)).y0(innerHeight).y1(d => yScale(getValue(d))).curve(d3.curveMonotoneX));
      const path = g.append('path').datum(chartData).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5).attr('d', d3.line().x(d => xScale(d.label)).y(d => yScale(getValue(d))).curve(d3.curveMonotoneX));
      const pathLen = path.node().getTotalLength();
      path.attr('stroke-dasharray', pathLen).attr('stroke-dashoffset', pathLen).transition().duration(800).attr('stroke-dashoffset', 0);
      g.selectAll(`.point-${ci}`).data(chartData).enter().append('circle').attr('class', `point-${ci}`).attr('cx', d => xScale(d.label)).attr('cy', d => yScale(getValue(d))).attr('r', 0).attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 2).transition().delay(800).duration(200).attr('r', 4);
    });
    addTitleAndLegend(svg, title, 'Line Chart', false, isMulti ? cols : null);
  };

  // Area Chart Renderer
  const renderAreaChart = (svg, chartData) => {
    const cols = valueColumns.length > 0 ? valueColumns : null;
    const isMulti = cols && cols.length > 1;
    const activeCols = isMulti ? cols : cols ? cols : ['value'];
    const margin = {
      top: 25,
      right: 15,
      bottom: 40 + legendHeight,
      left: 45
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    if (innerWidth <= 0 || innerHeight <= 0) return;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xScale = d3.scalePoint().domain(chartData.map(d => d.label)).range([0, innerWidth]);
    const allVals = activeCols.flatMap(c => chartData.map(d => d[c] ?? d.value ?? 0));
    const yScale = d3.scaleLinear().domain([0, (d3.max(allVals) || 1) * 1.1]).range([innerHeight, 0]);
    const xFontSize = Math.max(8, Math.min(10, width / 40));
    const xAxisG = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));
    xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    xAxisG.select('.domain').attr('stroke', colors.grid);
    const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat('')).selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();
    const defs = svg.append('defs');
    activeCols.forEach((col, ci) => {
      const color = isMulti ? colorPalette[ci % colorPalette.length] : colors.primary;
      const getValue = d => d[col] ?? d.value ?? 0;
      const gradId = `areaGradient-${ci}`;
      const gradient = defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.6);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.1);
      const areaPath = g.append('path').datum(chartData).attr('fill', `url(#${gradId})`).attr('d', d3.area().x(d => xScale(d.label)).y0(innerHeight).y1(d => yScale(getValue(d))).curve(d3.curveMonotoneX));
      areaPath.attr('opacity', 0).transition().duration(800).attr('opacity', 1);
      g.append('path').datum(chartData).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', d3.line().x(d => xScale(d.label)).y(d => yScale(getValue(d))).curve(d3.curveMonotoneX));
    });
    addTitleAndLegend(svg, title, 'Area Chart', false, isMulti ? cols : null);
  };

  // Pie/Donut Chart Renderer
  const renderPieChart = (svg, chartData, isDonut) => {
    const col0 = valueColumns[0];
    const getValue = d => d[col0] ?? d.value ?? 0;
    const radius = Math.min(width, height) / 2 - 30;
    const innerRadius = isDonut ? radius * 0.5 : 0;
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);
    const pie = d3.pie().value(d => getValue(d)).sort(null);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(innerRadius).outerRadius(radius + 8);
    const pieData = pie(chartData);

    // Slices
    const slices = g.selectAll('.slice').data(pieData).enter().append('g').attr('class', 'slice');
    slices.append('path').attr('d', arc).attr('fill', (d, i) => colorPalette[i % colorPalette.length]).attr('stroke', colors.background).attr('stroke-width', 2).style('opacity', 0).transition().duration(500).delay((d, i) => i * 50).style('opacity', 1).attrTween('d', function (d) {
      const interpolate = d3.interpolate({
        startAngle: 0,
        endAngle: 0
      }, d);
      return t => arc(interpolate(t));
    });

    // Hover effects
    slices.select('path').on('mouseenter', function (event, d) {
      d3.select(this).transition().duration(100).attr('d', arcHover);
    }).on('mouseleave', function (event, d) {
      d3.select(this).transition().duration(100).attr('d', arc);
    });

    // Labels for pie
    if (!isDonut) {
      slices.append('text').attr('transform', d => `translate(${arc.centroid(d)})`).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '11px').attr('font-weight', 'bold').style('opacity', 0).text(d => d.data.label).transition().delay(600).duration(200).style('opacity', 1);
    }

    // Center text for donut
    if (isDonut) {
      const total = d3.sum(chartData, d => getValue(d));
      g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em').attr('fill', colors.text).style('font-size', '20px').style('font-weight', 'bold').text(total.toLocaleString());
      g.append('text').attr('text-anchor', 'middle').attr('dy', '1.2em').attr('fill', colors.text).style('font-size', '11px').text('Total');
    }
    addTitleAndLegend(svg, title, isDonut ? 'Donut Chart' : 'Pie Chart', true);
  };

  // Scatter Chart Renderer
  const renderScatterChart = (svg, chartData) => {
    const col0 = valueColumns[0];
    const getValue = d => d[col0] ?? d.value ?? 0;
    const margin = {
      top: 25,
      right: 15,
      bottom: 40 + legendHeight,
      left: 45
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    if (innerWidth <= 0 || innerHeight <= 0) return;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xScale = d3.scaleLinear().domain([0, chartData.length + 1]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, (d3.max(chartData, d => getValue(d)) || 1) * 1.1]).range([innerHeight, 0]);
    const xFontSize = Math.max(8, Math.min(10, width / 40));

    // Axes
    const xAxisG = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).ticks(chartData.length));
    xAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    xAxisG.select('.domain').attr('stroke', colors.grid);
    const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(4));
    yAxisG.selectAll('text').attr('fill', colors.text).style('font-size', `${xFontSize}px`);
    yAxisG.select('.domain').attr('stroke', colors.grid);

    // Grid
    g.append('g').attr('class', 'grid').call(d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat('')).selectAll('line').attr('stroke', colors.grid).attr('stroke-opacity', 0.4).attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();

    // Points
    g.selectAll('.point').data(chartData).enter().append('circle').attr('class', 'point').attr('cx', (d, i) => xScale(i + 1)).attr('cy', d => yScale(getValue(d))).attr('r', 0).attr('fill', (d, i) => colorPalette[i % colorPalette.length]).attr('opacity', 0.8).transition().delay((d, i) => i * 50).duration(300).attr('r', d => Math.max(4, Math.min(10, getValue(d) / 20)));

    // Labels
    g.selectAll('.label').data(chartData).enter().append('text').attr('class', 'label').attr('x', (d, i) => xScale(i + 1)).attr('y', d => yScale(getValue(d)) - 12).attr('text-anchor', 'middle').attr('fill', colors.text).style('font-size', '9px').style('opacity', 0).text(d => d.label).transition().delay(400).duration(200).style('opacity', 1);
    addTitleAndLegend(svg, title, 'Scatter Chart', true);
  };

  // Helper to add title and multi-series legend
  const addTitleAndLegend = (svg, chartTitle, defaultTitle, forceLegend = false, seriesNames = null) => {
    const legendShow = showLegend || forceLegend;
    const yOffset = height - 12;
    if (title && width > 100) {
      svg.append('text').attr('x', width / 2).attr('y', 16).attr('text-anchor', 'middle').attr('fill', colors.text).style('font-size', `${Math.max(9, Math.min(12, width / 30))}px`).style('font-weight', 'bold').style('font-family', fontFamily).text(title);
    }
    if (legendShow) {
      if (seriesNames && seriesNames.length > 1) {
        const itemW = Math.min(80, (width - 20) / seriesNames.length);
        const legendG = svg.append('g').attr('transform', `translate(10, ${yOffset})`);
        seriesNames.forEach((name, i) => {
          const x = i * itemW;
          legendG.append('rect').attr('x', x).attr('y', -5).attr('width', 10).attr('height', 10).attr('fill', colorPalette[i % colorPalette.length]).attr('rx', 1);
          legendG.append('text').attr('x', x + 14).attr('y', 4).attr('fill', colors.text).style('font-size', '9px').style('font-family', fontFamily).text(name.length > 9 ? `${name.slice(0, 8)}…` : name);
        });
      } else {
        const legendG = svg.append('g').attr('transform', `translate(${width / 2}, ${yOffset})`);
        legendG.append('rect').attr('x', -40).attr('y', -5).attr('width', 10).attr('height', 10).attr('fill', colors.primary).attr('rx', 1);
        legendG.append('text').attr('x', -24).attr('y', 4).attr('fill', colors.text).style('font-size', '10px').style('font-family', fontFamily).text(defaultTitle || 'Series');
      }
    }
  };
  return /*#__PURE__*/React.createElement("svg", {
    ref: svgRef,
    width: "100%",
    height: "100%",
    style: {
      display: 'block'
    }
  });
};

var D3Adapter$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: D3Adapter
});

/**
 * Chart.js Adapter Component
 * 
 * A component that renders various Chart.js chart types using react-chartjs-2.
 * Supports: Line, Bar, Pie, Doughnut, Radar, Polar Area
 * Includes legend and responsive sizing.
 */


// Register Chart.js components
Chart$1.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler, BubbleMapController, ProjectionScale, GeoFeature, SizeScale);

// GeoJSON cache for bubble map background
const bubbleGeoCache = {};
const USA_STATES_GEO_URL = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces.geojson';
const DEMO_BUBBLE_DATA = [{
  city: 'New York',
  lat: 40.7128,
  lng: -74.006,
  value: 8336817
}, {
  city: 'Los Angeles',
  lat: 34.0522,
  lng: -118.2437,
  value: 3979576
}, {
  city: 'Chicago',
  lat: 41.8781,
  lng: -87.6298,
  value: 2693976
}, {
  city: 'Houston',
  lat: 29.7604,
  lng: -95.3698,
  value: 2320268
}, {
  city: 'Phoenix',
  lat: 33.4484,
  lng: -112.074,
  value: 1608139
}, {
  city: 'Philadelphia',
  lat: 39.9526,
  lng: -75.1652,
  value: 1603797
}, {
  city: 'San Antonio',
  lat: 29.4241,
  lng: -98.4936,
  value: 1434625
}, {
  city: 'San Diego',
  lat: 32.7157,
  lng: -117.1611,
  value: 1386932
}, {
  city: 'Dallas',
  lat: 32.7767,
  lng: -96.797,
  value: 1304379
}, {
  city: 'Seattle',
  lat: 47.6062,
  lng: -122.3321,
  value: 744955
}];
const BubbleMapChart = ({
  data,
  zoneConfig,
  colors,
  title,
  tooltip
}) => {
  const [geoData, setGeoData] = useState(null);
  const chartRef = useRef(null);
  const latCol = zoneConfig?.dataSource?.latColumn || 'lat';
  const lngCol = zoneConfig?.dataSource?.lngColumn || 'lng';
  const valueCol = zoneConfig?.dataSource?.valueColumn || 'value';
  const labelCol = zoneConfig?.dataSource?.labelColumn || 'city';
  useEffect(() => {
    if (bubbleGeoCache[USA_STATES_GEO_URL]) {
      setGeoData(bubbleGeoCache[USA_STATES_GEO_URL]);
      return;
    }
    fetch(USA_STATES_GEO_URL).then(r => r.json()).then(json => {
      bubbleGeoCache[USA_STATES_GEO_URL] = json;
      setGeoData(json);
    }).catch(() => {});
  }, []);
  const rowData = data?.length ? data : DEMO_BUBBLE_DATA;
  const chartData = useMemo(() => {
    if (!geoData) return null;
    return {
      labels: rowData.map(r => r[labelCol] ?? r.city ?? ''),
      datasets: [{
        label: title || 'Points',
        outline: geoData,
        showOutline: true,
        data: rowData.map(r => ({
          longitude: Number(r[lngCol] ?? r.lng ?? 0),
          latitude: Number(r[latCol] ?? r.lat ?? 0),
          value: Number(r[valueCol] ?? r.value ?? 0)
        })),
        backgroundColor: `${colors.primary}66`,
        borderColor: colors.primary,
        borderWidth: 1
      }]
    };
  }, [rowData, geoData, latCol, lngCol, valueCol, labelCol, colors, title]);
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    scales: {
      projection: {
        axis: 'x',
        projection: 'albersUsa'
      },
      size: {
        axis: 'x',
        size: [3, 25]
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: tooltip?.enabled !== false,
        callbacks: {
          label: ctx => {
            const row = rowData[ctx.dataIndex];
            const val = row?.[valueCol] ?? row?.value ?? 0;
            return `${ctx.label}: ${Number(val).toLocaleString()}`;
          }
        }
      }
    }
  }), [tooltip, rowData, valueCol]);
  const containerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    borderRadius: '6px',
    padding: '6px',
    boxSizing: 'border-box'
  };
  if (!geoData) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...containerStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text,
        fontSize: '12px'
      }
    }, "Loading map...");
  }
  return /*#__PURE__*/React.createElement("div", {
    style: containerStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      minHeight: '80px'
    }
  }, /*#__PURE__*/React.createElement(Chart, {
    ref: chartRef,
    type: "bubbleMap",
    data: chartData,
    options: options
  })));
};

// Chart type mapping
const CHART_COMPONENTS = {
  [CHART_TYPES.CHARTJS_LINE]: Line,
  [CHART_TYPES.CHARTJS_BAR]: Bar,
  [CHART_TYPES.CHARTJS_PIE]: Pie,
  [CHART_TYPES.CHARTJS_DOUGHNUT]: Doughnut,
  [CHART_TYPES.CHARTJS_RADAR]: Radar,
  [CHART_TYPES.CHARTJS_POLAR]: PolarArea
};
const ChartJsAdapter = ({
  data,
  valueColumns = [],
  theme = 'default',
  width = 400,
  height = 300,
  title,
  chartType = CHART_TYPES.CHARTJS_LINE,
  legend,
  tooltip,
  zoneConfig,
  resolvedStyles = {}
}) => {
  const chartRef = useRef(null);
  const colors = THEMES[theme] || THEMES.default;
  const fontFamily = resolvedStyles.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  if (chartType === CHART_TYPES.CHARTJS_BUBBLEMAP) {
    return /*#__PURE__*/React.createElement(BubbleMapChart, {
      data: data,
      zoneConfig: zoneConfig,
      colors: colors,
      title: title,
      tooltip: tooltip
    });
  }

  // Determine if we should show legend - from props or default based on size
  const legendEnabled = legend?.enabled !== false;
  const legendPosition = legend?.position || 'bottom';
  const showLegend = legendEnabled && width > 180 && height > 140;

  // Determine if we need scales (pie/doughnut/polar/radar don't use scales)
  const needsScales = ![CHART_TYPES.CHARTJS_PIE, CHART_TYPES.CHARTJS_DOUGHNUT, CHART_TYPES.CHARTJS_POLAR, CHART_TYPES.CHARTJS_RADAR].includes(chartType);

  // Get the appropriate chart component
  const ChartComponent = CHART_COMPONENTS[chartType] || Line;
  const palette = [colors.primary, colors.secondary, '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  // Chart configuration
  const chartData = useMemo(() => {
    const labels = data?.map(d => d.label) || [];
    const isPieType = [CHART_TYPES.CHARTJS_PIE, CHART_TYPES.CHARTJS_DOUGHNUT, CHART_TYPES.CHARTJS_POLAR, CHART_TYPES.CHARTJS_RADAR].includes(chartType);
    const cols = valueColumns.length > 0 ? valueColumns : null;
    const isMulti = cols && cols.length > 1 && !isPieType;
    if (!isMulti) {
      const col = cols?.[0];
      const vals = data?.map(d => col !== undefined ? d[col] ?? 0 : d.value ?? 0) || [];
      const dataset = {
        label: col || title || 'Value',
        data: vals
      };
      if (isPieType) {
        dataset.backgroundColor = vals.map((_, i) => `${palette[i % palette.length]}80`);
        dataset.borderColor = vals.map((_, i) => palette[i % palette.length]);
        dataset.borderWidth = 2;
      } else if (chartType === CHART_TYPES.CHARTJS_BAR) {
        dataset.backgroundColor = colors.primary;
        dataset.borderColor = colors.primary;
        dataset.borderWidth = 1;
        dataset.borderRadius = 4;
      } else {
        dataset.borderColor = colors.primary;
        dataset.backgroundColor = `${colors.primary}20`;
        dataset.fill = true;
        dataset.tension = 0.4;
        dataset.pointBackgroundColor = colors.primary;
        dataset.pointBorderColor = '#ffffff';
        dataset.pointBorderWidth = 2;
        dataset.pointRadius = Math.max(2, Math.min(5, width / 60));
        dataset.pointHoverRadius = Math.max(4, Math.min(8, width / 40));
      }
      return {
        labels,
        datasets: [dataset]
      };
    }
    const datasets = cols.map((col, i) => {
      const color = palette[i % palette.length];
      const vals = data?.map(d => d[col] ?? 0) || [];
      const dataset = {
        label: col,
        data: vals
      };
      if (chartType === CHART_TYPES.CHARTJS_BAR) {
        dataset.backgroundColor = color;
        dataset.borderColor = color;
        dataset.borderWidth = 1;
        dataset.borderRadius = 4;
      } else {
        dataset.borderColor = color;
        dataset.backgroundColor = `${color}20`;
        dataset.fill = false;
        dataset.tension = 0.4;
        dataset.pointBackgroundColor = color;
        dataset.pointBorderColor = '#ffffff';
        dataset.pointBorderWidth = 2;
        dataset.pointRadius = Math.max(2, Math.min(5, width / 60));
        dataset.pointHoverRadius = Math.max(4, Math.min(8, width / 40));
      }
      return dataset;
    });
    return {
      labels,
      datasets
    };
  }, [data, valueColumns, colors, title, width, chartType]);
  const options = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            color: colors.text,
            font: {
              size: Math.max(9, Math.min(12, width / 30)),
              family: fontFamily
            },
            padding: showLegend ? 10 : 0,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        title: {
          display: !!title && width > 120,
          text: title,
          color: colors.text,
          font: {
            size: Math.max(10, Math.min(14, width / 25)),
            weight: 'bold',
            family: fontFamily
          },
          padding: {
            bottom: showLegend ? 8 : 10
          }
        },
        tooltip: {
          enabled: tooltip?.enabled !== false,
          backgroundColor: tooltip?.backgroundColor === 'auto' ? colors.text : tooltip?.backgroundColor || colors.text,
          titleColor: tooltip?.textColor === 'auto' ? '#ffffff' : tooltip?.textColor || '#ffffff',
          bodyColor: tooltip?.textColor === 'auto' ? '#ffffff' : tooltip?.textColor || '#ffffff',
          borderColor: tooltip?.borderColor === 'auto' ? colors.primary : tooltip?.borderColor || colors.primary,
          borderWidth: 1,
          cornerRadius: 6,
          padding: 10,
          displayColors: tooltip?.showColors !== false,
          position: tooltip?.position === 'auto' ? 'average' : tooltip?.position || 'average',
          callbacks: {
            label: context => {
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
            }
          }
        }
      }
    };

    // Add scales for charts that need them
    if (needsScales) {
      baseOptions.scales = {
        x: {
          display: width > 100,
          grid: {
            color: colors.grid,
            drawBorder: false
          },
          ticks: {
            color: colors.text,
            font: {
              size: Math.max(8, Math.min(10, width / 40))
            },
            maxRotation: width < 150 ? 45 : 0
          }
        },
        y: {
          display: height > 100,
          grid: {
            color: colors.grid,
            drawBorder: false
          },
          ticks: {
            color: colors.text,
            font: {
              size: Math.max(8, Math.min(10, width / 40))
            },
            callback: value => {
              if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'k';
              }
              return value.toLocaleString();
            }
          },
          beginAtZero: true
        }
      };
    }

    // Radar chart specific options
    if (chartType === CHART_TYPES.CHARTJS_RADAR) {
      baseOptions.scales = {
        r: {
          angleLines: {
            color: colors.grid
          },
          grid: {
            color: colors.grid
          },
          pointLabels: {
            color: colors.text,
            font: {
              size: Math.max(8, Math.min(10, width / 40))
            }
          },
          ticks: {
            color: colors.text,
            backdropColor: 'transparent'
          },
          beginAtZero: true
        }
      };
    }

    // Polar area chart specific options
    if (chartType === CHART_TYPES.CHARTJS_POLAR) {
      baseOptions.scales = {
        r: {
          grid: {
            color: colors.grid
          },
          ticks: {
            color: colors.text,
            backdropColor: 'transparent'
          },
          beginAtZero: true
        }
      };
    }
    return baseOptions;
  }, [showLegend, legendPosition, colors, title, width, height, needsScales, chartType, tooltip, fontFamily]);

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
    boxSizing: 'border-box'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: containerStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      minHeight: '80px'
    }
  }, /*#__PURE__*/React.createElement(ChartComponent, {
    ref: chartRef,
    data: chartData,
    options: options
  })));
};

var ChartJsAdapter$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: ChartJsAdapter
});

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

// GeoJSON sources for choropleth maps
const GEO_FEATURE_URLS = {
  'world-50m': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson',
  'world-110m': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson',
  'usa': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces.geojson',
  'europe': 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson'
};
const featureCache = {};
const loadGeoFeatures = async (mapFeatures, geoJsonUrl) => {
  const url = mapFeatures === 'custom' ? geoJsonUrl : GEO_FEATURE_URLS[mapFeatures];
  if (!url) return [];
  if (featureCache[url]) return featureCache[url];
  const res = await fetch(url);
  const json = await res.json();
  const features = (json.features || []).map(f => ({
    ...f,
    id: f.properties?.iso_3166_2 || (f.properties?.iso_a3 !== '-99' ? f.properties?.iso_a3 : null) || (f.properties?.ISO_A3 !== '-99' ? f.properties?.ISO_A3 : null) || f.properties?.adm0_a3 || f.id
  }));
  featureCache[url] = features;
  return features;
};

// Default color palette for nivo
const DEFAULT_PALETTE = ['#3b82f6',
// blue
'#10b981',
// green
'#f59e0b',
// amber
'#8b5cf6',
// violet
'#ec4899',
// pink
'#14b8a6',
// teal
'#f97316',
// orange
'#6366f1' // indigo
];

// Demo data for choropleth maps (US states with sample values)
const DEMO_CHOROPLETH_DATA = [{
  id: 'US-CA',
  label: 'California',
  value: 39538223
}, {
  id: 'US-TX',
  label: 'Texas',
  value: 29145505
}, {
  id: 'US-FL',
  label: 'Florida',
  value: 21538187
}, {
  id: 'US-NY',
  label: 'New York',
  value: 20201249
}, {
  id: 'US-PA',
  label: 'Pennsylvania',
  value: 13002700
}, {
  id: 'US-IL',
  label: 'Illinois',
  value: 12812508
}, {
  id: 'US-OH',
  label: 'Ohio',
  value: 11799448
}, {
  id: 'US-GA',
  label: 'Georgia',
  value: 10711908
}, {
  id: 'US-NC',
  label: 'North Carolina',
  value: 10439388
}, {
  id: 'US-MI',
  label: 'Michigan',
  value: 10037773
}, {
  id: 'US-NJ',
  label: 'New Jersey',
  value: 9288994
}, {
  id: 'US-VA',
  label: 'Virginia',
  value: 8631393
}, {
  id: 'US-WA',
  label: 'Washington',
  value: 7693612
}, {
  id: 'US-AZ',
  label: 'Arizona',
  value: 7276316
}, {
  id: 'US-MA',
  label: 'Massachusetts',
  value: 6981974
}, {
  id: 'US-TN',
  label: 'Tennessee',
  value: 6910840
}, {
  id: 'US-IN',
  label: 'Indiana',
  value: 6785528
}, {
  id: 'US-MO',
  label: 'Missouri',
  value: 6196540
}, {
  id: 'US-MD',
  label: 'Maryland',
  value: 6177224
}, {
  id: 'US-WI',
  label: 'Wisconsin',
  value: 5893718
}];

// Nivo chart component mapping (by our chart type constants)
({
  [CHART_TYPES.NIVO_LINE]: ResponsiveLine,
  [CHART_TYPES.NIVO_BAR]: ResponsiveBar,
  [CHART_TYPES.NIVO_PIE]: ResponsivePie,
  [CHART_TYPES.NIVO_CHOROPLETH]: ResponsiveChoropleth
});

// Map nivo chart types to components
const getNivoChartComponent = nivoChartType => {
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
  CHOROPLETH: 'nivo_choropleth'
};

// Map our chart types to nivo chart types
const getNivoChartType = chartType => {
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
  valueColumns = [],
  theme = 'default',
  width = 400,
  height = 300,
  title,
  chartType = CHART_TYPES.NIVO_LINE,
  legend,
  tooltip,
  zoneConfig = {},
  resolvedStyles = {}
}) => {
  const colors = THEMES[theme] || THEMES.default;
  const fontFamily = resolvedStyles.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const legendEnabled = legend?.enabled !== false;
  const showLegend = legendEnabled && width > 180 && height > 140;
  const [geoFeatures, setGeoFeatures] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [choroplethZoom, setChoroplethZoom] = useState(1);
  const isChoropleth = getNivoChartType(chartType) === NIVO_CHART_TYPES.CHOROPLETH;
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
    loadGeoFeatures(mapFeatures, geoJsonUrl).then(setGeoFeatures).catch(err => setGeoError(err.message)).finally(() => setGeoLoading(false));
  }, [isChoropleth, zoneConfig.mapFeatures, zoneConfig.geoJsonUrl]);
  const fontSize = Math.max(9, Math.min(12, width / 30));

  // Helper function to format tooltip values
  const formatTooltipValue = value => {
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
    const nivoType = getNivoChartType(chartType);
    const chartData = nivoType === NIVO_CHART_TYPES.CHOROPLETH && (!data || data.length === 0) ? DEMO_CHOROPLETH_DATA : data;
    if (!chartData || chartData.length === 0) return [];
    const palette = [...DEFAULT_PALETTE];
    const cols = valueColumns.length > 0 ? valueColumns : null;
    if (nivoType === NIVO_CHART_TYPES.PIE) {
      const col0 = cols?.[0];
      return chartData.map((item, index) => ({
        id: item.label || `item-${index}`,
        label: item.label || `Item ${index + 1}`,
        value: col0 ? item[col0] ?? 0 : item.value ?? 0,
        color: palette[index % palette.length]
      }));
    }
    if (nivoType === NIVO_CHART_TYPES.CHOROPLETH) {
      const col0 = cols?.[0];
      return chartData.map((item, index) => ({
        id: item.id || item.label || `region-${index}`,
        label: item.label || item.id || `Region ${index + 1}`,
        value: col0 ? item[col0] ?? 0 : item.value ?? 0,
        color: item.color || palette[index % palette.length]
      }));
    }
    if (nivoType === NIVO_CHART_TYPES.BAR) {
      // Nivo bar expects flat rows: [{label, col1, col2}] — pass through as-is
      // keys are set in barConfig via valueColumns
      return chartData;
    }

    // Line chart — array of series, each with {id, data:[{x,y}]}
    if (cols && cols.length > 1) {
      return cols.map((col, i) => ({
        id: col,
        color: palette[i % palette.length],
        data: chartData.map(item => ({
          x: item.label,
          y: item[col] ?? 0
        }))
      }));
    }
    const col0 = cols?.[0];
    return [{
      id: col0 || title || 'Series 1',
      color: colors.primary,
      data: chartData.map(item => ({
        x: item.label,
        y: col0 ? item[col0] ?? 0 : item.value ?? 0
      }))
    }];
  }, [data, valueColumns, chartType, title, colors]);

  // Common theme for nivo
  const nivoTheme = useMemo(() => ({
    fontSize,
    fontFamily,
    textColor: colors.text,
    axis: {
      domain: {
        line: {
          stroke: colors.grid,
          strokeWidth: 1
        }
      },
      legend: {
        text: {
          fontSize: fontSize + 2,
          fontWeight: 'bold',
          fill: colors.text
        }
      },
      ticks: {
        line: {
          stroke: colors.grid,
          strokeWidth: 1
        },
        text: {
          fontSize: fontSize - 1,
          fill: colors.text
        }
      }
    },
    grid: {
      line: {
        stroke: colors.grid,
        strokeWidth: 1
      }
    },
    tooltip: {
      container: {
        background: tooltip?.backgroundColor === 'auto' ? colors.background : tooltip?.backgroundColor || colors.background,
        color: tooltip?.textColor === 'auto' ? colors.text : tooltip?.textColor || colors.text,
        fontSize: fontSize,
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'
      }
    },
    legend: {
      title: {
        fontSize: fontSize + 1,
        fontWeight: 'bold',
        fill: colors.text
      },
      text: {
        fontSize: fontSize,
        fill: colors.text
      }
    }
  }), [colors, fontSize, fontFamily]);

  // Line chart specific config
  const lineConfig = useMemo(() => ({
    margin: {
      top: 20,
      right: 20,
      bottom: 50,
      left: 60
    },
    xScale: {
      type: 'point'
    },
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
      legendPosition: 'middle'
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: '',
      legendOffset: -40,
      legendPosition: 'middle'
    },
    enableGridX: false,
    enableGridY: true,
    colors: DEFAULT_PALETTE,
    lineWidth: 2,
    enablePoints: true,
    pointSize: 8,
    pointColor: {
      theme: 'background'
    },
    pointBorderWidth: 2,
    pointBorderColor: {
      from: 'serieColor'
    },
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
      symbolBorderColor: {
        from: 'serieColor'
      },
      effects: [{
        on: 'hover',
        style: {
          itemBackground: 'rgba(0, 0, 0, .03)',
          itemOpacity: 1
        }
      }]
    }] : []
  }), [width, showLegend]);

  // Bar chart specific config
  const barConfig = useMemo(() => ({
    margin: {
      top: 20,
      right: 20,
      bottom: 50,
      left: 60
    },
    padding: 0.3,
    innerPadding: 0,
    minValue: 'auto',
    maxValue: 'auto',
    groupMode: 'grouped',
    reverse: false,
    keys: valueColumns.length > 0 ? valueColumns : ['value'],
    indexBy: 'label',
    layout: 'horizontal',
    valueScale: {
      type: 'linear'
    },
    indexScale: {
      type: 'band',
      round: true
    },
    colors: DEFAULT_PALETTE,
    borderRadius: 4,
    borderColor: {
      from: 'serieColor'
    },
    axisTop: null,
    axisRight: null,
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: width < 150 ? -45 : 0,
      legend: '',
      legendOffset: 36,
      legendPosition: 'middle'
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: '',
      legendOffset: -40,
      legendPosition: 'middle'
    },
    enableGridX: false,
    enableGridY: true,
    enableLabel: true,
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    labelTextColor: {
      from: 'color',
      modifiers: [['darker', 1.6]]
    },
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
      symbolBorderColor: {
        from: 'serieColor'
      },
      effects: [{
        on: 'hover',
        style: {
          itemBackground: 'rgba(0, 0, 0, .03)',
          itemOpacity: 1
        }
      }]
    }] : [],
    tooltip: tooltip?.enabled !== false ? tooltipData => {
      const formattedValue = formatTooltipValue(tooltipData.value);
      const titleText = tooltip?.title ? tooltip.title.replace('{id}', tooltipData.id).replace('{label}', tooltipData.id) : tooltipData.id;
      const labelText = tooltip?.label ? tooltip.label.replace('{value}', formattedValue) : formattedValue;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: tooltip?.backgroundColor === 'auto' ? colors.background : tooltip?.backgroundColor || colors.background,
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: tooltip?.textColor === 'auto' ? colors.text : tooltip?.textColor || colors.text,
          fontSize: fontSize,
          border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'
        }
      }, /*#__PURE__*/React.createElement("strong", null, titleText), ": ", labelText);
    } : false
  }), [width, showLegend, colors, fontSize, valueColumns]);

  // Pie chart specific config
  const pieConfig = useMemo(() => ({
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    innerRadius: 0.5,
    padAngle: 2,
    cornerRadius: 4,
    activeOuterRadiusOffset: 8,
    borderWidth: 2,
    borderColor: {
      from: 'color',
      modifiers: [['darker', 0.2]]
    },
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: colors.text,
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: {
      from: 'color'
    },
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: {
      from: 'color',
      modifiers: [['darker', 2]]
    },
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
      symbolBorderColor: {
        from: 'color'
      },
      effects: [{
        on: 'hover',
        style: {
          itemBackground: 'rgba(0, 0, 0, .03)',
          itemOpacity: 1
        }
      }]
    }] : [],
    tooltip: tooltip?.enabled !== false ? tooltipData => {
      const formattedValue = formatTooltipValue(tooltipData.datum.value);
      const total = data?.reduce((a, b) => a + b.value, 0) || 1;
      const percentage = (tooltipData.datum.value / total * 100).toFixed(1);
      const titleText = tooltip?.title ? tooltip.title.replace('{id}', tooltipData.datum.id || tooltipData.datum.label).replace('{label}', tooltipData.datum.label) : tooltipData.datum.label;
      const labelText = tooltip?.label ? tooltip.label.replace('{value}', formattedValue) : formattedValue;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          background: tooltip?.backgroundColor === 'auto' ? colors.background : tooltip?.backgroundColor || colors.background,
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: tooltip?.textColor === 'auto' ? colors.text : tooltip?.textColor || colors.text,
          fontSize: fontSize,
          border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'
        }
      }, /*#__PURE__*/React.createElement("strong", null, titleText), ": ", labelText, /*#__PURE__*/React.createElement("br", null), "(", percentage, "%)");
    } : false
  }), [showLegend, colors, fontSize, data]);

  // Choropleth chart specific config
  const choroplethConfig = useMemo(() => {
    const renderData = getNivoChartType(chartType) === NIVO_CHART_TYPES.CHOROPLETH && (!data || data.length === 0) ? DEMO_CHOROPLETH_DATA : data || [];
    const values = renderData.map(d => d.value).filter(v => typeof v === 'number' && !isNaN(v));
    const domainMin = values.length ? Math.min(...values) : 0;
    const domainMax = values.length ? Math.max(...values) : 100;
    const mapSrc = zoneConfig.mapFeatures || 'usa';
    const isUsa = mapSrc === 'usa';
    // NOTE: 'albersUsa' is NOT supported by Nivo — sanitize any stored value to 'mercator'.
    const rawProjection = zoneConfig.projectionType || (isUsa ? 'mercator' : 'naturalEarth1');
    const effectiveProjection = rawProjection === 'albersUsa' ? 'mercator' : rawProjection;
    const margin = 40;
    const availW = Math.max(100, width - margin);
    const availH = Math.max(60, height - margin);
    const zf = (zoneConfig.projectionScale || 100) / 100 * choroplethZoom;
    let autoScale, projTrans;
    if (isUsa && effectiveProjection === 'mercator') {
      const s = 0.9;
      autoScale = availW * s;
      projTrans = [0.5 + s * 1.676 * zf, 0.5 + s * 0.745 * (availW / availH) * zf];
    } else {
      autoScale = availW * 0.145;
      projTrans = [0.5, 0.5];
    }
    const effectiveScale = autoScale * zf;
    return {
      margin: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      features: geoFeatures,
      projectionType: effectiveProjection,
      projectionScale: effectiveScale,
      projectionTranslation: projTrans,
      match: zoneConfig.matchBy === 'properties.name' ? (feature, datum) => (feature.properties?.name || feature.properties?.NAME) === datum.id : zoneConfig.matchBy === 'properties.iso_a3' ? (feature, datum) => (feature.properties?.iso_a3 || feature.properties?.ISO_A3) === datum.id : undefined,
      colors: 'blues',
      domain: [domainMin, domainMax],
      unknownColor: '#e0e0e0',
      borderColor: {
        from: 'color',
        modifiers: [['darker', 0.2]]
      },
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
        symbolBorderColor: {
          from: 'color'
        },
        effects: [{
          on: 'hover',
          style: {
            itemBackground: 'rgba(0, 0, 0, .03)',
            itemOpacity: 1
          }
        }]
      }] : [],
      tooltip: tooltip?.enabled !== false ? tooltipData => {
        const formattedValue = formatTooltipValue(tooltipData.datum?.value);
        const titleText = tooltip?.title ? tooltip.title.replace('{id}', tooltipData.datum?.id || 'Region').replace('{label}', tooltipData.datum?.label || '') : tooltipData.datum?.id || 'Region';
        const labelText = tooltip?.label ? tooltip.label.replace('{value}', formattedValue ?? 'N/A') : formattedValue ?? 'N/A';
        const extraInfo = tooltipData.datum?.label && tooltipData.datum?.label !== tooltipData.datum?.id ? tooltipData.datum.label : '';
        return /*#__PURE__*/React.createElement("div", {
          style: {
            background: tooltip?.backgroundColor === 'auto' ? colors.background : tooltip?.backgroundColor || colors.background,
            padding: '8px 12px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            color: tooltip?.textColor === 'auto' ? colors.text : tooltip?.textColor || colors.text,
            fontSize: fontSize,
            border: tooltip?.borderColor === 'auto' ? `1px solid ${colors.primary}` : tooltip?.borderColor ? `1px solid ${tooltip.borderColor}` : 'none'
          }
        }, /*#__PURE__*/React.createElement("strong", null, titleText), ": ", labelText, extraInfo && /*#__PURE__*/React.createElement("br", null), extraInfo);
      } : false
    };
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
    flexDirection: 'column'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: containerStyle
  }, title && width > 120 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: colors.text,
      fontSize: Math.max(10, Math.min(14, width / 25)),
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '4px',
      fontFamily
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      flex: 1,
      minHeight: '80px',
      position: 'relative'
    }
  }, isChoropleth && geoLoading ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: colors.text,
      fontSize: fontSize
    }
  }, "Loading map data...") : isChoropleth && geoError ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#ef4444',
      fontSize: fontSize,
      padding: '8px',
      textAlign: 'center'
    }
  }, "Failed to load map: ", geoError) : isChoropleth ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ChartComponent, _extends({
    data: nivoData
  }, chartConfig, {
    theme: nivoTheme
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: '8px',
      right: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      zIndex: 10
    }
  }, [{
    label: '+',
    fn: z => Math.min(z * 1.25, 8)
  }, {
    label: '−',
    fn: z => Math.max(z * 0.8, 0.125)
  }].map(({
    label,
    fn
  }) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onMouseDown: e => e.stopPropagation(),
    onClick: () => setChoroplethZoom(fn),
    style: {
      width: '22px',
      height: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.background,
      border: `1px solid ${colors.grid}`,
      borderRadius: '4px',
      cursor: 'pointer',
      color: colors.text,
      fontSize: '14px',
      lineHeight: 1,
      padding: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    }
  }, label)))) : /*#__PURE__*/React.createElement(ChartComponent, _extends({
    data: nivoData
  }, chartConfig, {
    theme: nivoTheme
  }))));
};

var NivoAdapter$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: NivoAdapter
});

export { CHART_COLUMN_SCHEMA, CHART_LIBRARIES, CHART_TYPES, CHART_TYPE_LIBRARY, COLOR_THEMES, COMPONENT_TYPES, DEFAULT_CHART_TYPE, DashboardViewer, LEGEND_POSITIONS, SIZING_MODES, THEMES, createInitialDashboard, createZoneConfig, DashboardViewer as default };
//# sourceMappingURL=index.esm.js.map
