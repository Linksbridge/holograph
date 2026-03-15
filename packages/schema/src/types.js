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

import {
  COMPONENT_TYPES,
  CHART_LIBRARIES,
  CHART_TYPES,
  DEFAULT_CHART_TYPE,
  SIZING_MODES,
  COLOR_THEMES,
  LEGEND_POSITIONS,
} from './constants.js';

/**
 * Creates a new zone configuration
 * @param {string} id - Unique zone identifier
 * @returns {ZoneConfig} Default zone configuration
 */
export const createZoneConfig = (id) => ({
  id,
  componentType: COMPONENT_TYPES.CHART,
  library: CHART_LIBRARIES.CHARTJS,
  chartType: CHART_TYPES.CHARTJS_LINE,
  theme: COLOR_THEMES.DEFAULT,
  title: 'New Chart',
  showHeader: true,
  legend: {
    enabled: true,
    position: LEGEND_POSITIONS.BOTTOM,
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

export default {
  createZoneConfig,
  createInitialDashboard,
};
