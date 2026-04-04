/**
 * DashboardEditor Component
 * 
 * The main container component using react-grid-layout to manage
 * a grid of "zones" that contain charts. Supports drag-and-drop
 * to add new charts from the palette.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import GridLayout from 'react-grid-layout';
import { v4 as uuidv4 } from 'uuid';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import UniversalChart from './UniversalChart';
import TableComponent from './TableComponent';
import ImageComponent from './ImageComponent';
import RichTextComponent from './RichTextComponent';
import PropertyPanel from './PropertyPanel';
import ChartPalette from './ChartPalette';
import FilterBar from './FilterBar';
import { CHART_LIBRARIES, COMPONENT_TYPES, createZoneConfig } from '../types/schema';
import { useFilters } from '../hooks/useFilters';
import { getTableColumns, initializeDataService } from '../services/dataService';

const DashboardEditor = ({ dashboard, onDashboardUpdate, enabledLibraries }) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [gridWidth, setGridWidth] = useState(1200);
  const [currentBreakpoint, setCurrentBreakpoint] = useState({ breakpoint: 'lg', cols: 12, rowHeight: 30 });
  const gridRef = useRef(null);
  const draggedChartRef = useRef(null);
  
  // Get filter context
  const { filters, configureFilters } = useFilters();
  
  // Initialize data service and configure filters
  useEffect(() => {
    const init = async () => {
      await initializeDataService();
      
      // Configure which columns can be filtered for each zone based on dataSource
      const filterConfig = {};
      dashboard.zones.forEach((zone) => {
        if (zone.dataSource?.tableName) {
          // Get available columns from the table
          const availableColumns = getTableColumns(zone.dataSource.tableName);
          // Allow filtering on all columns that exist in the data
          filterConfig[zone.id] = availableColumns;
        }
      });
      configureFilters(filterConfig);
    };
    init();
  }, [dashboard.zones, configureFilters]);

  // Handle layout change from react-grid-layout
  const handleLayoutChange = useCallback(
    (layout) => {
      const updatedZones = dashboard.zones.map((zone) => {
        const layoutItem = layout.find((item) => item.i === zone.id);
        if (layoutItem) {
          return {
            ...zone,
            gridPosition: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          };
        }
        return zone;
      });

      onDashboardUpdate({
        ...dashboard,
        zones: updatedZones,
      });
    },
    [dashboard, onDashboardUpdate]
  );

  // Handle zone configuration update from PropertyPanel
  const handleZoneUpdate = useCallback(
    (updatedZone) => {
      const updatedZones = dashboard.zones.map((zone) =>
        zone.id === updatedZone.id ? updatedZone : zone
      );

      onDashboardUpdate({
        ...dashboard,
        zones: updatedZones,
      });

      setSelectedZone(updatedZone);
    },
    [dashboard, onDashboardUpdate]
  );

  // Handle double click on zone card when header is hidden to open property panel
  const handleZoneDoubleClick = useCallback(
    (e, zone) => {
      // Only open panel if header is hidden
      if (zone.showHeader === false) {
        e.stopPropagation();
        setSelectedZone(zone);
      }
    },
    []
  );

  // Handle gear button click to open property panel
  const handleGearClick = useCallback((e, zone) => {
    e.stopPropagation();
    setSelectedZone(zone);
  }, []);

  // Handle closing property panel
  const handleClosePanel = useCallback(() => {
    setSelectedZone(null);
  }, []);

  // Handle drag over for dropping new charts
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  // Handle drag enter on grid container
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  // Native drop handler for when grid is empty
  const handleNativeDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);

      const chartTypeData = e.dataTransfer.getData('chartType');
      if (!chartTypeData) return;

      try {
        const chartOption = JSON.parse(chartTypeData);

        // Calculate drop position based on mouse position
        const gridRect = gridRef.current?.getBoundingClientRect();
        if (!gridRect) return;

        const x = e.clientX - gridRect.left;
        const y = e.clientY - gridRect.top;

        const colWidth = (gridRect.width - 20) / dashboard.layout.cols;
        const gridX = Math.max(0, Math.floor(x / colWidth));
        const gridY = Math.max(0, Math.floor(y / dashboard.layout.rowHeight));

        const clampedX = Math.min(gridX, dashboard.layout.cols - 4);

        const newZone = createZoneConfig(`zone-${uuidv4()}`);
        newZone.componentType = chartOption.componentType || COMPONENT_TYPES.CHART;
        newZone.library = chartOption.library;
        newZone.chartType = chartOption.chartType;
        newZone.title = chartOption.title;
        newZone.gridPosition = {
          x: clampedX,
          y: gridY,
          w: 4,
          h: 4,
        };

        onDashboardUpdate({
          ...dashboard,
          zones: [...dashboard.zones, newZone],
        });

        // Open property panel for the new zone
        setTimeout(() => setSelectedZone(newZone), 100);
      } catch (err) {
        console.error('Error adding chart:', err);
      }

      draggedChartRef.current = null;
    },
    [dashboard, onDashboardUpdate]
  );

  // Handle drop from react-grid-layout (when grid has items)
  const handleGridDrop = useCallback(
    (layout, layoutItem) => {
      const chartOption = draggedChartRef.current;
      
      if (!chartOption) {
        setIsDragging(false);
        return;
      }

      const dropX = layoutItem?.x ?? 0;
      const dropY = layoutItem?.y ?? 0;

      const newZone = createZoneConfig(`zone-${uuidv4()}`);
      newZone.componentType = chartOption.componentType || COMPONENT_TYPES.CHART;
      newZone.library = chartOption.library;
      newZone.chartType = chartOption.chartType;
      newZone.title = chartOption.title;
      newZone.gridPosition = {
        x: dropX,
        y: dropY,
        w: 4,
        h: 4,
      };

      onDashboardUpdate({
        ...dashboard,
        zones: [...dashboard.zones, newZone],
      });

      draggedChartRef.current = null;
      setIsDragging(false);

      setTimeout(() => setSelectedZone(newZone), 100);
    },
    [dashboard, onDashboardUpdate]
  );

  // Store dragged chart type when drag starts in palette
  const handlePaletteDragStart = useCallback((chartOption) => {
    draggedChartRef.current = chartOption;
  }, []);

  // ResizeObserver to dynamically calculate grid width and adjust breakpoints
  useEffect(() => {
    if (!gridRef.current) return;

    const updateGridDimensions = () => {
      if (gridRef.current) {
        const containerWidth = gridRef.current.offsetWidth;
        // Account for padding (10px on each side)
        const padding = 20;
        const newWidth = Math.max(400, containerWidth - padding);
        setGridWidth(newWidth);

        // Determine breakpoint based on width
        let breakpoint = 'lg';
        let newCols = 12;
        let newRowHeight = 30;

        if (newWidth < 480) {
          breakpoint = 'xs';
          newCols = 2;
          newRowHeight = 60;
        } else if (newWidth < 768) {
          breakpoint = 'sm';
          newCols = 4;
          newRowHeight = 50;
        } else if (newWidth < 1200) {
          breakpoint = 'md';
          newCols = 8;
          newRowHeight = 40;
        }

        setCurrentBreakpoint({ breakpoint, cols: newCols, rowHeight: newRowHeight });
      }
    };

    // Initial measurement
    updateGridDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateGridDimensions();
    });

    resizeObserver.observe(gridRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Generate layout items for react-grid-layout
  // IMPORTANT: must be memoized — react-grid-layout v2 calls onLayoutChange in a
  // useEffect([layout]) hook, so a new array reference on every render triggers
  // handleLayoutChange → onDashboardUpdate → cascade that prevents filter fetches
  // from completing.
  const layout = useMemo(() => dashboard.zones.map((zone) => ({
    i: zone.id,
    x: zone.gridPosition.x,
    y: zone.gridPosition.y,
    w: zone.gridPosition.w,
    h: zone.gridPosition.h,
    minW: 2,
    minH: 2,
  })), [dashboard.zones]);

  const getZoneBadgeClass = (zone) => {
    if (zone.componentType === COMPONENT_TYPES.TABLE) {
      return 'zone-badge table';
    }
    if (zone.componentType === COMPONENT_TYPES.IMAGE) {
      return 'zone-badge image';
    }
    if (zone.componentType === COMPONENT_TYPES.RICHTEXT) {
      return 'zone-badge richtext';
    }
    return zone.library === CHART_LIBRARIES.D3 ? 'zone-badge d3' : 'zone-badge chartjs';
  };

  const getZoneBadgeText = (zone) => {
    if (zone.componentType === COMPONENT_TYPES.TABLE) {
      return 'Table';
    }
    if (zone.componentType === COMPONENT_TYPES.IMAGE) {
      return 'Image';
    }
    if (zone.componentType === COMPONENT_TYPES.RICHTEXT) {
      return 'Text';
    }
    return zone.library === CHART_LIBRARIES.D3 ? 'D3.js' : 'Chart.js';
  };

  return (
    <>
      {/* Chart Palette */}
      <ChartPalette onDragStart={handlePaletteDragStart} enabledLibraries={enabledLibraries} />
      
      <div className="dashboard-editor-container">
        {/* Header */}
        {(dashboard.showTitle !== false) && (
          <div className="dashboard-editor-header">
            <h1 className="dashboard-editor-title">{dashboard.name}</h1>
            {(dashboard.showSubtitle !== false) && (
              <p className="dashboard-editor-subtitle">{dashboard.description}</p>
            )}
          </div>
        )}

        {/* Filter Bar */}
        <FilterBar />

        {/* Grid Layout */}
        <div 
          ref={gridRef}
          className="dashboard-grid-container"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleNativeDrop}
        >
          <div className={`dashboard-grid-drop-overlay ${isDragging ? 'active' : ''}`}>
            <span className="dashboard-grid-drop-text">Drop chart here</span>
          </div>
          
          {dashboard.zones.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-state-icon">📊</div>
              <div className="dashboard-empty-state-title">No charts yet</div>
              <div className="dashboard-empty-state-text">Drag a chart type from the left panel to get started</div>
            </div>
          ) : (
            <GridLayout
              className="layout"
              layout={layout}
              cols={currentBreakpoint.cols}
              rowHeight={currentBreakpoint.rowHeight}
              margin={dashboard.layout.margin}
              width={gridWidth}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".zone-drag-handle"
              compactType="vertical"
              preventCollision={false}
              isDroppable={true}
              droppingItem={{ i: '__dropping-elem__', w: 2, h: 2 }}
              onDrop={handleGridDrop}
              useCSSTransforms={true}
              containerPadding={[10, 10]}
            >
              {dashboard.zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`zone-card ${selectedZone?.id === zone.id ? 'selected' : ''}`}
                  onDoubleClick={(e) => handleZoneDoubleClick(e, zone)}
                >
                  {(zone.showHeader !== false) && (
                    <div className="zone-header">
                      <div className="zone-drag-handle">
                        <h3 className="zone-title">{zone.title}</h3>
                      </div>
                      <div className="zone-header-actions">
                        <span className={getZoneBadgeClass(zone)}>
                          {getZoneBadgeText(zone)}
                        </span>
                        <span 
                          className="zone-settings-btn"
                          draggable={false}
                          onClick={(e) => handleGearClick(e, zone)}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseUp={(e) => e.stopPropagation()}
                          title="Settings"
                        >
                          ⚙️
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="zone-chart-container">
                    {zone.componentType === COMPONENT_TYPES.IMAGE ? (
                      <ImageComponent
                        config={zone}
                        width={null}
                        height={null}
                      />
                    ) : zone.componentType === COMPONENT_TYPES.RICHTEXT ? (
                      <RichTextComponent
                        config={zone}
                        width={null}
                        height={null}
                      />
                    ) : zone.componentType === COMPONENT_TYPES.TABLE ? (
                      <TableComponent
                        config={zone}
                        width={null}
                        height={null}
                        filters={filters}
                      />
                    ) : (
                      <UniversalChart
                        config={zone}
                        width={null}
                        height={null}
                        filters={filters}
                      />
                    )}
                  </div>
                </div>
              ))}
            </GridLayout>
          )}
        </div>

        {/* Property Panel */}
        {selectedZone && (
          <PropertyPanel
            zoneConfig={selectedZone}
            onUpdate={handleZoneUpdate}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </>
  );
};

export default DashboardEditor;
