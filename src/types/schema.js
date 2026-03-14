/**
 * Dashboard Schema Types
 * 
 * This file defines the JSON schema structure for the dashboard state.
 * The entire dashboard is represented by a single JSON object.
 */

// Supported chart library types
export const CHART_LIBRARIES = {
  D3: 'd3',
  CHARTJS: 'chartjs',
};

// Supported chart types per library
export const CHART_TYPES = {
  [CHART_LIBRARIES.D3]: 'bar',
  [CHART_LIBRARIES.CHARTJS]: 'line',
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

/**
 * Creates a new zone configuration
 * @param {string} id - Unique zone identifier
 * @returns {ZoneConfig} Default zone configuration
 */
export const createZoneConfig = (id) => ({
  id,
  library: CHART_LIBRARIES.CHARTJS,
  chartType: CHART_TYPES[CHART_LIBRARIES.CHARTJS],
  theme: COLOR_THEMES.DEFAULT,
  title: 'New Chart',
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
      chartType: CHART_TYPES[CHART_LIBRARIES.D3],
      gridPosition: { x: 6, y: 0, w: 6, h: 4 },
    },
    {
      ...createZoneConfig('zone-3'),
      title: 'Product Trends',
      gridPosition: { x: 0, y: 4, w: 4, h: 4 },
    },
    {
      ...createZoneConfig('zone-4'),
      title: 'Customer Growth',
      library: CHART_LIBRARIES.D3,
      chartType: CHART_TYPES[CHART_LIBRARIES.D3],
      gridPosition: { x: 4, y: 4, w: 4, h: 4 },
    },
    {
      ...createZoneConfig('zone-5'),
      title: 'Performance Metrics',
      gridPosition: { x: 8, y: 4, w: 4, h: 4 },
    },
  ],
  layout: {
    cols: 12,
    rowHeight: 30,
    margin: [10, 10],
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
 * @property {ZoneConfig[]} zones - Array of zone configurations
 * @property {LayoutConfig} layout - Layout configuration
 */
