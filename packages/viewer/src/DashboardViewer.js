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

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Lazy-load chart adapters so only the libraries used in the dashboard are downloaded
const D3Adapter = React.lazy(() => import('./adapters/D3Adapter'));
const ChartJsAdapter = React.lazy(() => import('./adapters/ChartJsAdapter'));
const NivoAdapter = React.lazy(() => import('./adapters/NivoAdapter'));

// Import data service
import { fetchChartData, fetchTableData, initializeDataService } from './services/dataService';

// Import schema types
import { CHART_LIBRARIES, CHART_TYPES, COMPONENT_TYPES, DEFAULT_CHART_TYPE, THEMES } from '@holograph/dashboard-schema';

// Import styles
import './styles/viewer.css';

/**
 * Individual Chart/Table Component within a zone
 * 
 * @param {Object} props - Component props
 * @param {Object} props.zone - Zone configuration
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Callback for filter changes
 * @param {Array} props.zoneData - Optional data passed directly via props (bypasses data service)
 */
const ZoneContent = ({ zone, filters, onFilterChange, zoneData }) => {
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const containerRef = useRef(null);

  const { library, theme, title, dataSource, chartType, legend } = zone;
  const effectiveChartType = chartType || DEFAULT_CHART_TYPE[library] || CHART_TYPES.CHARTJS_LINE;

  // Get theme colors
  const themeColors = THEMES[theme] || THEMES.default;

  // Resize observer for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect;
        const chartWidth = Math.max(150, containerWidth - 16);
        const chartHeight = Math.max(120, containerHeight - 16);
        setDimensions({ width: chartWidth, height: chartHeight });
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
          const data = await fetchTableData(
            dataSource.tableName,
            null, // Get all columns
            filters
          );
          if (isMounted) {
            setTableData(data);
          }
        } else {
          const data = await fetchChartData(
            dataSource.tableName,
            dataSource.labelColumn,
            dataSource.valueColumn,
            filters
          );
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
  }, [zoneData, dataSource?.tableName, dataSource?.labelColumn, dataSource?.valueColumn, zone.componentType, JSON.stringify(filters)]);

  // Determine which adapter to use
  const Adapter = useMemo(() => {
    if (zone.componentType === COMPONENT_TYPES.TABLE) {
      return null; // Will render table directly
    }
    switch (library) {
      case CHART_LIBRARIES.D3:
        return D3Adapter;
      case CHART_LIBRARIES.NIVO:
        return NivoAdapter;
      case CHART_LIBRARIES.CHARTJS:
      default:
        return ChartJsAdapter;
    }
  }, [library, zone.componentType]);

  // Container base style
  const containerBaseStyle = {
    width: '100%',
    height: '100%',
    minHeight: '100px',
    overflow: 'hidden',
  };

  // Loading state
  if (loading) {
    return (
      <div ref={containerRef} style={containerBaseStyle} className="viewer-zone-loading">
        <div className="viewer-spinner" />
        <span className="viewer-zone-loading-text">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={containerRef} style={containerBaseStyle} className="viewer-zone-error">
        <div style={{ textAlign: 'center' }}>
          <div className="viewer-zone-error-icon">⚠️</div>
          <div className="viewer-zone-error-text">{error}</div>
        </div>
      </div>
    );
  }

  // Empty data state
  // For choropleth charts, show demo data even when no data source is connected
  const isChoropleth = effectiveChartType === CHART_TYPES.NIVO_CHOROPLETH;
  const isEmpty = zone.componentType === COMPONENT_TYPES.TABLE
    ? !tableData || tableData.length === 0
    : !isChoropleth && (!chartData || chartData.length === 0);

  if (isEmpty) {
    return (
      <div ref={containerRef} style={containerBaseStyle} className="viewer-zone-empty">
        <div style={{ textAlign: 'center' }}>
          <div className="viewer-zone-empty-icon">📊</div>
          <div className="viewer-zone-empty-text">No data</div>
        </div>
      </div>
    );
  }

  // Render table
  if (zone.componentType === COMPONENT_TYPES.TABLE) {
    const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
    return (
      <div ref={containerRef} style={containerBaseStyle} className="viewer-table-container">
        <table className="viewer-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Render chart
  return (
    <div ref={containerRef} style={containerBaseStyle}>
      {Adapter && (
        <Suspense fallback={
          <div style={containerBaseStyle} className="viewer-zone-loading">
            <div className="viewer-spinner" />
            <span className="viewer-zone-loading-text">Loading...</span>
          </div>
        }>
          <Adapter
            data={chartData}
            theme={theme}
            width={dimensions.width}
            height={dimensions.height}
            title={title}
            chartType={effectiveChartType}
            legend={legend}
          />
        </Suspense>
      )}
    </div>
  );
};

/**
 * DashboardViewer Component
 * 
 * Main export - an embeddable dashboard viewer that accepts schema and filters as props.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.dashboard - Dashboard schema object
 * @param {Object} props.data - Optional data object keyed by zone ID (bypasses data service)
 * @param {Object} props.filters - Optional filter values to apply to all charts
 * @param {Function} props.onFilterChange - Optional callback when filters change internally
 * @param {string} props.className - Optional CSS class name
 */
const DashboardViewer = ({ 
  dashboard, 
  data = {},
  filters = {}, 
  onFilterChange,
  className = '' 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(filters);
  const [gridWidth, setGridWidth] = useState(1200);
  const containerRef = useRef(null);

  // Initialize data service on mount
  useEffect(() => {
    const init = async () => {
      await initializeDataService();
      setIsInitialized(true);
    };
    init();
  }, []);

  // Sync external filters
  useEffect(() => {
    setCurrentFilters(filters);
  }, [filters]);

  // Handle filter change from internal components
  const handleFilterChange = (newFilters) => {
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
    if (!dashboard?.zones) return [];
    return dashboard.zones.map((zone) => ({
      i: zone.id,
      x: zone.gridPosition?.x || 0,
      y: zone.gridPosition?.y || 0,
      w: zone.gridPosition?.w || 4,
      h: zone.gridPosition?.h || 4,
      minW: 2,
      minH: 2,
    }));
  }, [dashboard?.zones]);

  // Default layout settings
  const cols = dashboard?.layout?.cols || 12;
  const rowHeight = dashboard?.layout?.rowHeight || 30;
  const margin = dashboard?.layout?.margin || [10, 10];

  // Helper to get library attribute value
  const getLibraryAttr = (lib) => {
    if (lib === CHART_LIBRARIES.D3) return 'd3';
    if (lib === CHART_LIBRARIES.CHARTJS) return 'chartjs';
    if (lib === CHART_LIBRARIES.NIVO) return 'nivo';
    return 'chartjs';
  };

  if (!dashboard) {
    return (
      <div className={`dashboard-viewer ${className}`}>
        <div className="viewer-error">No dashboard schema provided</div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`dashboard-viewer ${className}`}>
        <div className="viewer-loading">
          <div className="viewer-spinner-large" />
          <span>Initializing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-viewer ${className}`} ref={containerRef}>
      {dashboard.zones?.length === 0 ? (
        <div className="viewer-empty-state">
          <p>No charts to display</p>
        </div>
      ) : (
        <GridLayout
          className="layout"
          layout={layout}
          cols={cols}
          rowHeight={rowHeight}
          margin={margin}
          width={gridWidth}
          isDraggable={false}
          isResizable={false}
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms={true}
          containerPadding={[10, 10]}
        >
          {dashboard.zones?.map((zone) => (
            <div
              key={zone.id}
              className="viewer-zone-card"
              data-component-type={zone.componentType === COMPONENT_TYPES.TABLE ? 'table' : 'chart'}
              data-library={getLibraryAttr(zone.library)}
              data-theme={zone.theme || 'default'}
            >
              {(zone.showHeader !== false) && (
                <div className="viewer-zone-header">
                  <h3 className="viewer-zone-title">{zone.title}</h3>
                </div>
              )}
              <div className="viewer-zone-chart-container">
                <ZoneContent
                  zone={zone}
                  filters={currentFilters}
                  onFilterChange={handleFilterChange}
                  zoneData={data[zone.id]}
                />
              </div>
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
};

export default DashboardViewer;
