/**
 * PreviewModal Component
 *
 * A modal that displays a preview of the dashboard exactly as it would
 * appear when published, showing all charts and their configurations.
 *
 * Includes a Security Preview toolbar that lets the author simulate
 * what a specific role would see — zones the role cannot access are
 * replaced with a grayed-out restricted placeholder.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import UniversalChart from './UniversalChart';
import TableComponent from './TableComponent';
import { COMPONENT_TYPES } from '../types/schema';
import { canRoleAccessZone, getAllRoles } from '../utils/securityUtils';

const PreviewModal = ({ isOpen, onClose, dashboard, securityRules = [], settings = null }) => {
  const [gridWidth, setGridWidth] = useState(1100);
  const [securityOn, setSecurityOn] = useState(false);
  const [previewRole, setPreviewRole] = useState('');
  const contentRef = useRef(null);

  // Derive all unique roles from the security rules
  const allRoles = useMemo(() => getAllRoles(securityRules), [securityRules]);

  // Reset security state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSecurityOn(false);
      setPreviewRole('');
    }
  }, [isOpen]);

  // Auto-select first role when toggling security on
  useEffect(() => {
    if (securityOn && !previewRole && allRoles.length > 0) {
      setPreviewRole(allRoles[0]);
    }
  }, [securityOn, previewRole, allRoles]);

  // Calculate grid dimensions for preview - use responsive width
  useEffect(() => {
    const updateWidth = () => {
      if (contentRef.current) {
        const containerWidth = contentRef.current.offsetWidth;
        // Account for padding (20px each side)
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

  const cols      = dashboard?.layout?.cols      || 12;
  const rowHeight = dashboard?.layout?.rowHeight || 30;
  const margin    = dashboard?.layout?.margin    || [10, 10];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen || !dashboard) return null;

  const securityActive = securityOn && !!previewRole;

  return (
    <div className="preview-modal-backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal">

        {/* Header */}
        <div className="preview-modal-header">
          {(dashboard.showTitle !== false) && (
            <h2 className="preview-modal-title">📊 {dashboard.name}</h2>
          )}
          <button className="preview-modal-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            ✕
          </button>
        </div>

        {(dashboard.showSubtitle !== false) && dashboard.description && (
          <div className="preview-modal-subtitle">{dashboard.description}</div>
        )}

        {/* Security Preview toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '8px 16px', borderBottom: '1px solid #e5e7eb',
          background: securityActive ? '#fefce8' : '#f9fafb',
          fontSize: '13px',
        }}>
          <span style={{ color: '#6b7280', fontWeight: 500 }}>🔒 Security Preview</span>

          {/* Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={securityOn}
              onChange={(e) => setSecurityOn(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: securityOn ? '#0f172a' : '#9ca3af' }}>
              {securityOn ? 'ON' : 'OFF'}
            </span>
          </label>

          {/* Role selector */}
          {securityOn && (
            <>
              <span style={{ color: '#6b7280' }}>Preview as role:</span>
              {allRoles.length === 0 ? (
                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No roles defined in security rules</span>
              ) : (
                <select
                  value={previewRole}
                  onChange={(e) => setPreviewRole(e.target.value)}
                  style={{
                    padding: '4px 8px', borderRadius: '5px', border: '1px solid #d1d5db',
                    fontSize: '13px', background: '#fff', cursor: 'pointer',
                  }}
                >
                  <option value="">— select role —</option>
                  {allRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}
              {securityActive && (
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                  background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a',
                }}>
                  Simulating: {previewRole}
                </span>
              )}
            </>
          )}
        </div>

        {/* Grid */}
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
              {dashboard.zones.map((zone) => {
                const restricted = securityActive &&
                  !canRoleAccessZone(zone, securityRules, settings, previewRole);

                return (
                  <div
                    key={zone.id}
                    className="preview-zone-card"
                    style={restricted ? {
                      opacity: 0.45,
                      filter: 'grayscale(80%)',
                      border: '2px dashed #94a3b8',
                    } : {}}
                  >
                    {(zone.showHeader !== false) && (
                      <div className="preview-zone-header">
                        <h3 className="preview-zone-title">
                          {zone.title}
                          {restricted && <span style={{ marginLeft: '6px', fontSize: '12px' }}>🔒</span>}
                        </h3>
                      </div>
                    )}

                    <div className="preview-zone-chart-container">
                      {restricted ? (
                        /* Restricted placeholder */
                        <div style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          height: '100%', minHeight: '80px', gap: '6px',
                          color: '#64748b',
                        }}>
                          <span style={{ fontSize: '24px' }}>🔒</span>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>Access Restricted</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Not visible to role: "{previewRole}"
                          </span>
                        </div>
                      ) : zone.componentType === COMPONENT_TYPES.TABLE ? (
                        <TableComponent config={zone} width={null} height={null} />
                      ) : (
                        <UniversalChart config={zone} width={null} height={null} />
                      )}
                    </div>
                  </div>
                );
              })}
            </GridLayout>
          )}
        </div>

        <div className="preview-modal-footer">
          <span className="preview-modal-badge">Preview Mode</span>
          {securityActive && (
            <span style={{
              fontSize: '11px', color: '#854d0e', background: '#fef9c3',
              border: '1px solid #fde68a', borderRadius: '4px', padding: '2px 8px', marginLeft: '8px',
            }}>
              Security active — viewing as "{previewRole}"
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
