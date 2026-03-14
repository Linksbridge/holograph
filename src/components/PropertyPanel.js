/**
 * PropertyPanel Component
 * 
 * A configuration panel that allows users to modify zone settings.
 * Changes to the configuration trigger immediate re-renders of the chart.
 */

import React from 'react';
import { CHART_LIBRARIES, CHART_TYPES, COLOR_THEMES, THEMES } from '../types/schema';
import { getAvailableTables, getTableColumns } from '../services/dataService';

const PropertyPanel = ({ zoneConfig, onUpdate, onClose }) => {
  const { id, library, theme, title, dataSource } = zoneConfig;
  const availableTables = getAvailableTables();
  const tableColumns = dataSource?.tableName ? getTableColumns(dataSource.tableName) : [];

  const handleLibraryChange = (e) => {
    const newLibrary = e.target.value;
    onUpdate({
      ...zoneConfig,
      library: newLibrary,
      chartType: CHART_TYPES[newLibrary],
    });
  };

  const handleThemeChange = (e) => {
    onUpdate({
      ...zoneConfig,
      theme: e.target.value,
    });
  };

  const handleTitleChange = (e) => {
    onUpdate({
      ...zoneConfig,
      title: e.target.value,
    });
  };

  const handleTableChange = (e) => {
    onUpdate({
      ...zoneConfig,
      dataSource: {
        ...dataSource,
        tableName: e.target.value,
        labelColumn: '',
        valueColumn: '',
      },
    });
  };

  const handleLabelColumnChange = (e) => {
    onUpdate({
      ...zoneConfig,
      dataSource: {
        ...dataSource,
        labelColumn: e.target.value,
      },
    });
  };

  const handleValueColumnChange = (e) => {
    onUpdate({
      ...zoneConfig,
      dataSource: {
        ...dataSource,
        valueColumn: e.target.value,
      },
    });
  };

  const panelStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '320px',
    height: '100%',
    backgroundColor: '#ffffff',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const headerStyle = {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  };

  const contentStyle = {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  };

  const fieldGroupStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const themePreviewStyle = (themeKey) => ({
    display: 'inline-block',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: THEMES[themeKey]?.primary || '#3b82f6',
    marginRight: '8px',
    verticalAlign: 'middle',
    border: theme === themeKey ? '3px solid #1f2937' : 'none',
  });

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    lineHeight: 1,
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>
          Configure Chart
        </h2>
        <button style={closeButtonStyle} onClick={onClose}>
          ×
        </button>
      </div>

      <div style={contentStyle}>
        {/* Chart Title */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Chart Title</label>
          <input
            type="text"
            value={title || ''}
            onChange={handleTitleChange}
            style={inputStyle}
            placeholder="Enter chart title"
          />
        </div>

        {/* Library Selection */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Rendering Library</label>
          <select
            value={library}
            onChange={handleLibraryChange}
            style={selectStyle}
          >
            <option value={CHART_LIBRARIES.CHARTJS}>
              Chart.js (Line Chart)
            </option>
            <option value={CHART_LIBRARIES.D3}>
              D3.js (Bar Chart)
            </option>
          </select>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
            {library === CHART_LIBRARIES.CHARTJS
              ? 'Renders an interactive line chart'
              : 'Renders a D3-powered bar chart'}
          </p>
        </div>

        {/* Theme Selection */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Color Theme</label>
          <select
            value={theme}
            onChange={handleThemeChange}
            style={selectStyle}
          >
            {Object.values(COLOR_THEMES).map((themeKey) => (
              <option key={themeKey} value={themeKey}>
                {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
              </option>
            ))}
          </select>
          <div style={{ marginTop: '12px' }}>
            {Object.values(COLOR_THEMES).map((themeKey) => (
              <div
                key={themeKey}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginRight: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => handleThemeChange({ target: { value: themeKey } })}
              >
                <span style={themePreviewStyle(themeKey)} />
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  {themeKey}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Source Selection */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Data Source (SQL Table)</label>
          <select
            value={dataSource?.tableName || ''}
            onChange={handleTableChange}
            style={selectStyle}
          >
            <option value="">Select a table...</option>
            {availableTables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>

        {/* Label Column */}
        {dataSource?.tableName && (
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Label Column</label>
            <select
              value={dataSource?.labelColumn || ''}
              onChange={handleLabelColumnChange}
              style={selectStyle}
            >
              <option value="">Select column...</option>
              {tableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Value Column */}
        {dataSource?.tableName && (
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Value Column</label>
            <select
              value={dataSource?.valueColumn || ''}
              onChange={handleValueColumnChange}
              style={selectStyle}
            >
              <option value="">Select column...</option>
              {tableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Zone Info */}
        <div
          style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          <strong>Zone ID:</strong> {id}
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
