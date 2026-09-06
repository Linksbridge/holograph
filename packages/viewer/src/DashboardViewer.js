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
import { fetchChartData, fetchChartDataMulti, fetchTableData, initializeDataService, setDashboardFileSources, setDataQueryUrl, setAuthToken, clearQueryDataCache } from './services/dataService';

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
const ZoneContent = ({ zone, filters, onFilterChange, zoneData, resolvedStyles = {}, activeDataQueryUrl }) => {
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const containerRef = useRef(null);

  const { library, theme, title, dataSource, chartType, legend } = zone;
  const effectiveChartType = chartType || DEFAULT_CHART_TYPE[library] || CHART_TYPES.CHARTJS_LINE;
  const valueColumns = dataSource?.valueColumns
    ?? (dataSource?.valueColumn ? [dataSource.valueColumn] : []);
  // Zone filters override dashboard-wide ones for the same column
  const activeFilters = { ...filters, ...dataSource?.filters };

  // Get theme colors
  const themeColors = THEMES[theme] || THEMES.default;

  // Resize observer for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width: containerWidth, height: containerHeight } = entry.contentRect;
          const chartWidth = Math.max(150, containerWidth);
          const chartHeight = Math.max(120, containerHeight);
          setDimensions({ width: chartWidth, height: chartHeight });
        }
      });
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
          const configuredCols = dataSource.columns?.length ? dataSource.columns : null;
          const data = await fetchTableData(dataSource.tableName, configuredCols, activeFilters);
          if (isMounted) {
            setTableData(data);
            setCurrentPage(1);
          }
        } else {
          const data = await fetchChartDataMulti(
            dataSource.tableName,
            dataSource.labelColumn,
            valueColumns,
            activeFilters
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
  }, [zoneData, dataSource?.tableName, dataSource?.labelColumn, JSON.stringify(valueColumns), zone.componentType, JSON.stringify(activeFilters), activeDataQueryUrl]);

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
    const configuredCols = dataSource?.columns?.length ? dataSource.columns : null;
    const displayColumns = configuredCols || (tableData.length > 0 ? Object.keys(tableData[0]) : []);

    const handleSort = (col) => {
      if (sortColumn === col) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(col);
        setSortDirection('asc');
      }
      setCurrentPage(1);
    };

    const sorted = sortColumn
      ? [...tableData].sort((a, b) => {
          const av = a[sortColumn], bv = b[sortColumn];
          if (typeof av === 'number' && typeof bv === 'number') return sortDirection === 'asc' ? av - bv : bv - av;
          return sortDirection === 'asc'
            ? String(av ?? '').localeCompare(String(bv ?? ''))
            : String(bv ?? '').localeCompare(String(av ?? ''));
        })
      : tableData;

    // Fit rows to available height: subtract thead (~36px) + pagination bar (~40px),
    // divide by data row height (~36px). Minimum 1 row always shown.
    const rowsPerPage = Math.max(1, Math.floor((dimensions.height - 76) / 36));
    const totalPages = Math.ceil(sorted.length / rowsPerPage);
    const pageRows = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
      <div ref={containerRef} style={containerBaseStyle} className="viewer-table-container">
        <div className="viewer-table-scroll">
          <table className="viewer-table">
            <thead>
              <tr>
                {displayColumns.map((col) => (
                  <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span>{col.charAt(0).toUpperCase() + col.slice(1)}</span>
                      <span style={{ fontSize: '10px', opacity: sortColumn === col ? 1 : 0.3 }}>
                        {sortColumn === col ? (sortDirection === 'asc' ? '▲' : '▼') : '⬍'}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'viewer-table-row-even' : 'viewer-table-row-odd'}>
                  {displayColumns.map((col) => (
                    <td key={col}>{typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="viewer-table-pagination">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="viewer-table-page-btn" title="First page">«</button>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="viewer-table-page-btn" title="Previous page">‹</button>
            <span className="viewer-table-page-info">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="viewer-table-page-btn" title="Next page">›</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="viewer-table-page-btn" title="Last page">»</button>
          </div>
        )}
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
            valueColumns={valueColumns}
            theme={theme}
            width={dimensions.width}
            height={dimensions.height}
            title={title}
            chartType={effectiveChartType}
            legend={legend}
            zoneConfig={zone}
            resolvedStyles={resolvedStyles}
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
 * @param {Object} props.dashboard - Dashboard schema object (optional — renders idle state when absent)
 * @param {Object} props.data - Optional data object keyed by zone ID (bypasses data service)
 * @param {Object} props.filters - Optional filter values to apply to all charts
 * @param {Function} props.onFilterChange - Optional callback when filters change internally
 * @param {string} props.className - Optional CSS class name
 */
const normalizeDashboard = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  // API returns { id, name, dataQueryUrl, schema: { zones, layout, ... } }; flatten schema to root when present
  const flat = raw.schema && typeof raw.schema === 'object' ? { ...raw, ...raw.schema } : raw;
  // Schema's dataQueryUrl may be empty string — fall back to root's which has the real URL
  const dataQueryUrl = flat.dataQueryUrl || raw.dataQueryUrl || '';
  return {
    ...flat,
    dataQueryUrl,
    zones: Array.isArray(flat.zones) ? flat.zones.filter((z) => z && z.id) : [],
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
  dataServerUrl = null,
  authToken = null,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(filters);
  const [gridWidth, setGridWidth] = useState(1200);
  const [gridHeight, setGridHeight] = useState(null);
  const [resolvedStyles, setResolvedStyles] = useState({});
  // React-tracked copy of the module-level dataQueryUrl so ZoneContent re-fetches when it changes
  const [activeDataQueryUrl, setActiveDataQueryUrl] = useState(null);
  const containerRef = useRef(null); // outer container — measured for width/height

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
  // Priority: dataServerUrl prop > dashboard's embedded dataQueryUrl > null
  // fileDataUrl is reserved for file sources only.
  // Also updates activeDataQueryUrl so ZoneContent dep arrays re-trigger when URL changes.
  useEffect(() => {
    if (!normalizedDashboard) return;
    clearQueryDataCache();
    let queryUrl;
    if (dataServerUrl) {
      const base = dataServerUrl.replace(/\/$/, '');
      const ds = normalizedDashboard.datasource;
      queryUrl = ds ? `${base}/${ds}/{table}` : `${base}/{table}`;
    } else {
      queryUrl = normalizedDashboard.dataQueryUrl || null;
    }
    setDataQueryUrl(queryUrl, normalizedDashboard.id || null);
    setActiveDataQueryUrl(queryUrl);
  }, [normalizedDashboard, dataServerUrl]);

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
      fontFamily: fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });
  }, []);

  // Sync external filters — use serialized comparison to avoid re-firing on every render
  // when the parent passes a new object reference with the same contents (e.g. default `{}`)
  useEffect(() => {
    setCurrentFilters(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  // Handle filter change from internal components
  const handleFilterChange = (newFilters) => {
    setCurrentFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Responsive grid dimensions.
  // Width: containerRef offsetWidth minus horizontal padding.
  // Height: containerRef offsetHeight minus vertical padding — cannot use gridRef.offsetHeight
  // because GridLayout sets its own inline height from rowHeight, making it circular.
  // Padding is read from computed styles so any consumer override is respected.
  // Re-runs when isInitialized flips so containerRef.current is attached before measuring.
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const style = window.getComputedStyle(el);
      const paddingH = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const paddingV = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      setGridWidth(Math.max(400, el.offsetWidth - paddingH));
      setGridHeight(Math.max(0, el.offsetHeight - paddingV));
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updateDimensions));
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [isInitialized]);

  // Generate layout for react-grid-layout.
  // When gridPosition is absent or partial, defaults to full-width (w=12) and equal-height (h=1)
  // so zones fill all available space proportionally. Explicit values always take precedence.
  const layout = useMemo(() => {
    if (!normalizedDashboard?.zones) return [];
    let autoY = 0;
    return normalizedDashboard.zones.map((zone) => {
      const gp = zone.gridPosition;
      const w = gp?.w ?? 12;
      const h = gp?.h ?? 1;
      const x = gp?.x ?? 0;
      const y = gp?.y ?? autoY;
      autoY = Math.max(autoY, y + h);
      return { i: zone.id, x, y, w, h, minW: 1, minH: 1 };
    });
  }, [normalizedDashboard?.zones]);

  // Default layout settings
  const cols = normalizedDashboard?.layout?.cols || 12;
  const schemaRowHeight = normalizedDashboard?.layout?.rowHeight || 30;
  const margin = normalizedDashboard?.layout?.margin || [10, 10];

  // Calculate rowHeight so zones fill all available vertical space.
  // When the consuming site gives the viewer a fixed height (height/100vh/etc.),
  // zones expand proportionally to fill it. `h` in gridPosition acts as a weight:
  // h=2 gets twice the height of h=1. Falls back to schemaRowHeight when container
  // has no explicit height (auto-sized by content).
  const rowHeight = useMemo(() => {
    // gridHeight is the grid wrapper's own height (inside viewer padding, after any title),
    // so only subtract GridLayout's internal containerPadding and item margin gaps.
    if (!gridHeight || gridHeight < 50) return schemaRowHeight;
    const maxGridRow = layout.length > 0 ? Math.max(...layout.map(l => l.y + l.h)) : 1;
    const containerPaddingV = 10 * 2; // GridLayout containerPadding[1] * 2
    const marginGaps = (maxGridRow - 1) * margin[1];
    const available = gridHeight - containerPaddingV - marginGaps;
    const calculated = Math.floor(available / maxGridRow);
    return Math.max(schemaRowHeight, calculated);
  }, [gridHeight, layout, schemaRowHeight, margin]);

  // Helper to get library attribute value
  const getLibraryAttr = (lib) => {
    if (lib === CHART_LIBRARIES.D3) return 'd3';
    if (lib === CHART_LIBRARIES.CHARTJS) return 'chartjs';
    if (lib === CHART_LIBRARIES.NIVO) return 'nivo';
    return 'chartjs';
  };

  if (!normalizedDashboard) {
    return (
      <div className={`dashboard-viewer ${className}`} ref={containerRef}>
        <div className="viewer-empty-state">
          <p>Waiting for dashboard…</p>
        </div>
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
      {normalizedDashboard.zones?.length === 0 ? (
        <div className="viewer-empty-state">
          <p>No charts to display</p>
        </div>
      ) : (
        <div className="viewer-dashboard-grid">
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
            {normalizedDashboard.zones?.map((zone) => (
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
                    resolvedStyles={resolvedStyles}
                    activeDataQueryUrl={activeDataQueryUrl}
                  />
                </div>
              </div>
            ))}
          </GridLayout>
        </div>
      )}
    </div>
  );
};

export default DashboardViewer;
