/**
 * PreviewModal Component
 * 
 * A modal that displays a preview of the dashboard exactly as it would
 * appear when published, showing all charts and their configurations.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import UniversalChart from './UniversalChart';
import TableComponent from './TableComponent';
import { COMPONENT_TYPES } from '../types/schema';

const PreviewModal = ({ isOpen, onClose, dashboard }) => {
  const [gridWidth, setGridWidth] = useState(1100);
  const contentRef = useRef(null);

  // Calculate grid dimensions for preview - use responsive width
  useEffect(() => {
    const updateWidth = () => {
      if (contentRef.current) {
        const containerWidth = contentRef.current.offsetWidth;
        // Account for padding (20px) and margin
        const newWidth = Math.max(400, containerWidth - 40);
        setGridWidth(newWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [isOpen]);

  // Generate layout for react-grid-layout
  const layout = useMemo(() => {
    if (!dashboard || !dashboard.zones) return [];
    return dashboard.zones.map((zone) => ({
      i: zone.id,
      x: zone.gridPosition.x,
      y: zone.gridPosition.y,
      w: zone.gridPosition.w,
      h: zone.gridPosition.h,
    }));
  }, [dashboard]);

  // Calculate grid dimensions for preview
  const cols = dashboard?.layout?.cols || 12;
  const rowHeight = dashboard?.layout?.rowHeight || 30;
  const margin = dashboard?.layout?.margin || [10, 10];

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !dashboard) return null;

  return (
    <div className="preview-modal-backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal">
        <div className="preview-modal-header">
          {(dashboard.showTitle !== false) && (
            <h2 className="preview-modal-title">
              📊 {dashboard.name}
            </h2>
          )}
          <button className="preview-modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>
        
        {(dashboard.showSubtitle !== false) && dashboard.description && (
          <div className="preview-modal-subtitle">
            {dashboard.description}
          </div>
        )}
        
        <div className="preview-modal-content" ref={contentRef}>
          {!dashboard.zones || dashboard.zones.length === 0 ? (
            <div className="preview-empty-state">
              <p>No charts to preview</p>
            </div>
          ) : (
            <GridLayout
              className="layout"
              layout={layout}
              cols={cols}
              rowHeight={rowHeight}
              margin={margin}
              width={gridWidth}
              draggable={false}
              isDraggable={false}
              isResizable={false}
              compactType="vertical"
              preventCollision={false}
              useCSSTransforms={true}
              containerPadding={[10, 10]}
            >
              {dashboard.zones.map((zone) => (
                <div
                  key={zone.id}
                  className="preview-zone-card"
                >
                  {(zone.showHeader !== false) && (
                    <div className="preview-zone-header">
                      <h3 className="preview-zone-title">{zone.title}</h3>
                    </div>
                  )}
                  <div className="preview-zone-chart-container">
                    {zone.componentType === COMPONENT_TYPES.TABLE ? (
                      <TableComponent
                        config={zone}
                        width={null}
                        height={null}
                      />
                    ) : (
                      <UniversalChart
                        config={zone}
                        width={null}
                        height={null}
                      />
                    )}
                  </div>
                </div>
              ))}
            </GridLayout>
          )}
        </div>
        
        <div className="preview-modal-footer">
          <span className="preview-modal-badge">Preview Mode</span>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
