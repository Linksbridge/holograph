/**
 * DashboardEditor Component
 * 
 * The main container component using react-grid-layout to manage
 * a grid of "zones" that contain charts. Supports drag-and-drop
 * to add new charts from the palette.
 */

import React, { useState, useCallback, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import { v4 as uuidv4 } from 'uuid';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import UniversalChart from './UniversalChart';
import PropertyPanel from './PropertyPanel';
import ChartPalette from './ChartPalette';
import { CHART_LIBRARIES, createZoneConfig } from '../types/schema';

const DashboardEditor = ({ dashboard, onDashboardUpdate }) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState(null);
  const gridRef = useRef(null);
  const droppingItemRef = useRef(null);

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

      // Update selected zone with new config
      setSelectedZone(updatedZone);
    },
    [dashboard, onDashboardUpdate]
  );

  // Handle zone click to open property panel
  const handleZoneClick = useCallback((zone) => {
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
    // Only set isDragging to false if we're leaving the grid container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  // Handle drop - react-grid-layout calls this with the correct position
  const handleDrop = useCallback(
    (layout, layoutItem, event) => {
      // Use the layoutItem position from react-grid-layout (where the pink indicator is)
      const dropX = layoutItem?.x ?? 0;
      const dropY = layoutItem?.y ?? 0;

      // Get the chart type from the data transfer
      const chartTypeData = event?.dataTransfer?.getData?.('chartType');
      if (!chartTypeData) {
        setIsDragging(false);
        setDropPosition(null);
        return;
      }

      try {
        const chartOption = JSON.parse(chartTypeData);

        // Create new zone config at the drop position
        const newZone = createZoneConfig(`zone-${uuidv4()}`);
        newZone.library = chartOption.library;
        newZone.chartType = chartOption.chartType;
        newZone.title = chartOption.title;
        newZone.gridPosition = {
          x: dropX,
          y: dropY,
          w: 4,
          h: 4,
        };

        // Add new zone to dashboard
        onDashboardUpdate({
          ...dashboard,
          zones: [...dashboard.zones, newZone],
        });

        // Open property panel for the new zone
        setTimeout(() => setSelectedZone(newZone), 100);
      } catch (err) {
        console.error('Error parsing chart type:', err);
      }

      // Reset state
      setIsDragging(false);
      setDropPosition(null);
    },
    [dashboard, onDashboardUpdate]
  );

  // Generate layout items for react-grid-layout
  const layout = dashboard.zones.map((zone) => ({
    i: zone.id,
    x: zone.gridPosition.x,
    y: zone.gridPosition.y,
    w: zone.gridPosition.w,
    h: zone.gridPosition.h,
    minW: 3,
    minH: 3,
  }));

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px',
    marginLeft: '80px', // Account for palette width
  };

  const headerStyle = {
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: '#1f2937',
  };

  const subtitleStyle = {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  };

  const gridContainerStyle = {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '10px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    minHeight: '500px',
  };

  const dropOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    border: isDragging ? '2px dashed #3b82f6' : '2px dashed transparent',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
    transition: 'all 0.15s ease',
    opacity: isDragging ? 1 : 0,
  };

  const dropTextStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#3b82f6',
    backgroundColor: '#ffffff',
    padding: '12px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  };

  const zoneCardStyle = (zone) => ({
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: selectedZone?.id === zone.id 
      ? '2px solid #3b82f6' 
      : '1px solid #e5e7eb',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: selectedZone?.id === zone.id 
      ? '0 4px 12px rgba(59, 130, 246, 0.2)' 
      : '0 1px 3px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
  });

  const zoneHeaderStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  };

  const zoneTitleStyle = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
  };

  const zoneBadgeStyle = (zone) => ({
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: zone.library === CHART_LIBRARIES.D3 ? '#fef3c7' : '#dbeafe',
    color: zone.library === CHART_LIBRARIES.D3 ? '#92400e' : '#1e40af',
    fontWeight: 500,
  });

  const chartContainerStyle = {
    flex: 1,
    padding: '8px',
    minHeight: 0,
  };

  return (
    <>
      {/* Chart Palette */}
      <ChartPalette />
      
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>{dashboard.name}</h1>
          <p style={subtitleStyle}>{dashboard.description}</p>
        </div>

        {/* Grid Layout */}
        <div 
          ref={gridRef}
          style={gridContainerStyle}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div style={dropOverlayStyle}>
            <span style={dropTextStyle}>Drop chart here</span>
          </div>
          <GridLayout
            className="layout"
            layout={layout}
            cols={dashboard.layout.cols}
            rowHeight={dashboard.layout.rowHeight}
            margin={dashboard.layout.margin}
            width={1200}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".zone-header"
            compactType="vertical"
            preventCollision={false}
            isDroppable={true}
            droppingItem={{ i: '__dropping-elem__', w: 4, h: 4 }}
            onDrop={handleDrop}
          >
            {dashboard.zones.map((zone) => (
              <div
                key={zone.id}
                style={zoneCardStyle(zone)}
                onClick={() => handleZoneClick(zone)}
              >
                <div className="zone-header" style={zoneHeaderStyle}>
                  <h3 style={zoneTitleStyle}>{zone.title}</h3>
                  <span style={zoneBadgeStyle(zone)}>
                    {zone.library === CHART_LIBRARIES.D3 ? 'D3.js' : 'Chart.js'}
                  </span>
                </div>
                <div style={chartContainerStyle}>
                  <UniversalChart
                    config={zone}
                    width={null}
                    height={null}
                  />
                </div>
              </div>
            ))}
          </GridLayout>
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
