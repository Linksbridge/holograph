/**
 * Dashboard Schema Constants
 * 
 * These constants define the available options for dashboard configuration.
 * This is a framework-agnostic module that can be used in any JavaScript project.
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
};

// Default chart types per library
export const DEFAULT_CHART_TYPE = {
  [CHART_LIBRARIES.D3]: CHART_TYPES.D3_BAR,
  [CHART_LIBRARIES.CHARTJS]: CHART_TYPES.CHARTJS_LINE,
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

// Legend position options
export const LEGEND_POSITIONS = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  NONE: 'none',
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

export default {
  COMPONENT_TYPES,
  CHART_LIBRARIES,
  CHART_TYPES,
  CHART_TYPE_LIBRARY,
  DEFAULT_CHART_TYPE,
  SIZING_MODES,
  COLOR_THEMES,
  THEMES,
  LEGEND_POSITIONS,
};
