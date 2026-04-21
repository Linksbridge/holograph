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

// Component types (charts and tables)
export const COMPONENT_TYPES = {
  CHART: 'chart',
  TABLE: 'table',
  IMAGE: 'image',
  RICHTEXT: 'richtext',
};

// Supported chart library types
export const CHART_LIBRARIES = {
  D3: 'd3',
  CHARTJS: 'chartjs',
  NIVO: 'nivo',
};

// Chart types available in each library
export const CHART_TYPES = {
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
CHARTJS_BUBBLEMAP: 'chartjs_bubblemap',
};

// Map chart types to their libraries
export const CHART_TYPE_LIBRARY = {
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
[CHART_TYPES.CHARTJS_BUBBLEMAP]: CHART_LIBRARIES.CHARTJS,
};

// Default chart types per library
export const DEFAULT_CHART_TYPE = {
  [CHART_LIBRARIES.D3]: CHART_TYPES.D3_BAR,
  [CHART_LIBRARIES.CHARTJS]: CHART_TYPES.CHARTJS_LINE,
  [CHART_LIBRARIES.NIVO]: CHART_TYPES.NIVO_LINE,
};

// Responsive sizing modes
export const SIZING_MODES = {
  FIXED: 'fixed',       // Fixed pixel-based sizing
  RESPONSIVE: 'responsive', // Proportional sizing based on container
  AUTO: 'auto',         // Auto-fit to content
};

// Color themes available
export const COLOR_THEMES = {
  DEFAULT: 'default',
  OCEAN: 'ocean',
  SUNSET: 'sunset',
  FOREST: 'forest',
  MONOCHROME: 'monochrome',
};

// Theme color palettes
export const THEMES = {
  [COLOR_THEMES.DEFAULT]: {
    primary: '#3b82f6',
    secondary: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    grid: '#e5e7eb',
  },
  [COLOR_THEMES.OCEAN]: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    background: '#f0f9ff',
    text: '#0c4a6e',
    grid: '#bae6fd',
  },
  [COLOR_THEMES.SUNSET]: {
    primary: '#f97316',
    secondary: '#ef4444',
    background: '#fff7ed',
    text: '#7c2d12',
    grid: '#fed7aa',
  },
  [COLOR_THEMES.FOREST]: {
    primary: '#22c55e',
    secondary: '#14b8a6',
    background: '#f0fdf4',
    text: '#14532d',
    grid: '#bbf7d0',
  },
  [COLOR_THEMES.MONOCHROME]: {
    primary: '#6b7280',
    secondary: '#9ca3af',
    background: '#f9fafb',
    text: '#111827',
    grid: '#d1d5db',
  },
};

// Legend position options
export const LEGEND_POSITIONS = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  NONE: 'none',
};

/**
 * Creates a new zone configuration
 * @param {string} id - Unique zone identifier
 * @returns {ZoneConfig} Default zone configuration
 */
export const createZoneConfig = (id) => ({
  id,
  componentType: COMPONENT_TYPES.CHART,
  library: null, // Will be set by the chart option
  chartType: null, // Will be set by the chart option
  theme: COLOR_THEMES.DEFAULT,
  title: 'New Chart',
  showHeader: true,
  legend: {
    enabled: true,
    position: LEGEND_POSITIONS.BOTTOM,
  },
  tooltip: {
    enabled: true,
    showColors: true,
    backgroundColor: 'auto',
    textColor: 'auto',
    borderColor: 'auto',
    format: 'auto', // auto, currency, percentage, number
    position: 'auto',
  },
  dataSource: {
    tableName: 'sales_data',
    labelColumn: 'month',
    valueColumn: 'revenue',
  },
  gridPosition: {
    x: 0,
    y: 0,
    w: 6,
    h: 4,
  },
});

/**
 * Creates the initial dashboard schema
 * @returns {DashboardSchema} Initial dashboard state
 */
export const createInitialDashboard = () => ({
  version: '1.0.0',
  name: 'My Dashboard',
  description: 'A zero-VM dashboard with pluggable chart adapters',
  showTitle: true,
  showSubtitle: true,
  zones: [
    {
      ...createZoneConfig('zone-1'),
      title: 'Monthly Revenue',
      gridPosition: { x: 0, y: 0, w: 6, h: 4 },
    },
    {
      ...createZoneConfig('zone-2'),
      title: 'Sales by Region',
      library: CHART_LIBRARIES.D3,
      chartType: CHART_TYPES.D3_BAR,
      gridPosition: { x: 6, y: 0, w: 6, h: 4 },
    },
    {
      ...createZoneConfig('zone-3'),
      title: 'Product Trends',
      chartType: CHART_TYPES.CHARTJS_BAR,
      gridPosition: { x: 0, y: 4, w: 4, h: 4 },
    },
    {
      ...createZoneConfig('zone-4'),
      title: 'Customer Growth',
      library: CHART_LIBRARIES.D3,
      chartType: CHART_TYPES.D3_LINE,
      gridPosition: { x: 4, y: 4, w: 4, h: 4 },
    },
    {
      ...createZoneConfig('zone-5'),
      title: 'Performance Metrics',
      chartType: CHART_TYPES.CHARTJS_PIE,
      gridPosition: { x: 8, y: 4, w: 4, h: 4 },
    },
  ],
  layout: {
    cols: 12,
    rowHeight: 30,
    margin: [10, 10],
    sizingMode: SIZING_MODES.RESPONSIVE,
    // Responsive breakpoints for different screen sizes
    breakpoints: {
      lg: { cols: 12, rowHeight: 30 },
      md: { cols: 8, rowHeight: 40 },
      sm: { cols: 4, rowHeight: 50 },
      xs: { cols: 2, rowHeight: 60 },
    },
  },
});

// Export types as JSDoc for reference
/**
 * @typedef {Object} DataSourceConfig
 * @property {string} tableName - SQL table name
 * @property {string} labelColumn - Column for labels
 * @property {string} valueColumn - Column for values
 */

/**
 * @typedef {Object} GridPosition
 * @property {number} x - X position on grid
 * @property {number} y - Y position on grid
 * @property {number} w - Width in grid units
 * @property {number} h - Height in grid units
 */

/**
 * @typedef {Object} ZoneConfig
 * @property {string} id - Unique zone identifier
 * @property {string} componentType - Type of component (chart or table)
 * @property {string} library - Chart library (d3 or chartjs)
 * @property {string} chartType - Type of chart
 * @property {string} theme - Color theme
 * @property {string} title - Chart title
 * @property {DataSourceConfig} dataSource - Data source configuration
 * @property {GridPosition} gridPosition - Grid position
 */

/**
 * @typedef {Object} LayoutConfig
 * @property {number} cols - Number of columns
 * @property {number} rowHeight - Height of each row
 * @property {number[]} margin - Margin between items
 */

/**
 * @typedef {Object} DashboardSchema
 * @property {string} version - Schema version
 * @property {string} name - Dashboard name
 * @property {string} description - Dashboard description
 * @property {boolean} showTitle - Whether to show the dashboard title (optional, default true)
 * @property {boolean} showSubtitle - Whether to show the dashboard subtitle/description (optional, default true)
 * @property {ZoneConfig[]} zones - Array of zone configurations
 * @property {LayoutConfig} layout - Layout configuration
 */
