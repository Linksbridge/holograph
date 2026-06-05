/**
 * PropertyPanel Component
 * 
 * A configuration panel that allows users to modify zone settings.
 */

import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CHART_LIBRARIES, CHART_TYPES, CHART_TYPE_LIBRARY, DEFAULT_CHART_TYPE, COLOR_THEMES, THEMES, COMPONENT_TYPES, LEGEND_POSITIONS } from '../types/schema';
import { getAvailableTables, getTableColumns, isUsingRealSchema, MOCK_DATA_TABLES } from '../services/dataService';

const PropertyPanel = ({ zoneConfig, onUpdate, onClose }) => {
  const { id, componentType, library, theme, title, dataSource, chartType, showHeader, legend, dataSort } = zoneConfig;
  const _allTables = getAvailableTables();
  const availableTables = isUsingRealSchema()
    ? _allTables.filter(t => !Object.prototype.hasOwnProperty.call(MOCK_DATA_TABLES, t))
    : _allTables;
  const tableColumns = dataSource?.tableName ? getTableColumns(dataSource.tableName) : [];

  // All chart options grouped by library — mirrors the palette
  const CHART_OPTIONS_BY_LIBRARY = [
    {
      library: CHART_LIBRARIES.CHARTJS,
      label: 'Chart.js',
      types: [
        { value: CHART_TYPES.CHARTJS_LINE,      label: 'Line Chart' },
        { value: CHART_TYPES.CHARTJS_BAR,       label: 'Bar Chart' },
        { value: CHART_TYPES.CHARTJS_PIE,       label: 'Pie Chart' },
        { value: CHART_TYPES.CHARTJS_DOUGHNUT,  label: 'Doughnut Chart' },
        { value: CHART_TYPES.CHARTJS_RADAR,     label: 'Radar Chart' },
        { value: CHART_TYPES.CHARTJS_POLAR,     label: 'Polar Area Chart' },
        { value: CHART_TYPES.CHARTJS_BUBBLEMAP, label: 'Point Map' },
      ],
    },
    {
      library: CHART_LIBRARIES.D3,
      label: 'D3.js',
      types: [
        { value: CHART_TYPES.D3_BAR,     label: 'Bar Chart' },
        { value: CHART_TYPES.D3_LINE,    label: 'Line Chart' },
        { value: CHART_TYPES.D3_AREA,    label: 'Area Chart' },
        { value: CHART_TYPES.D3_PIE,     label: 'Pie Chart' },
        { value: CHART_TYPES.D3_DONUT,   label: 'Donut Chart' },
        { value: CHART_TYPES.D3_SCATTER, label: 'Scatter Chart' },
      ],
    },
    {
      library: CHART_LIBRARIES.NIVO,
      label: 'Nivo',
      types: [
        { value: CHART_TYPES.NIVO_LINE,        label: 'Line Chart' },
        { value: CHART_TYPES.NIVO_BAR,         label: 'Bar Chart' },
        { value: CHART_TYPES.NIVO_PIE,         label: 'Pie Chart' },
        { value: CHART_TYPES.NIVO_CHOROPLETH,  label: 'Choropleth Map' },
      ],
    },
  ];

  // Encode library+chartType together for the single select value
  const encodeChartOption = (lib, type) => `${lib}||${type}`;
  const decodeChartOption = (encoded) => {
    const [lib, type] = encoded.split('||');
    return { library: lib, chartType: type };
  };
  const currentChartValue = library && chartType ? encodeChartOption(library, chartType) : '';

  const handleChartTypeChange = (e) => {
    const { library: newLibrary, chartType: newChartType } = decodeChartOption(e.target.value);
    onUpdate({ ...zoneConfig, library: newLibrary, chartType: newChartType });
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

  const handleColumnsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onUpdate({
      ...zoneConfig,
      dataSource: { ...dataSource, columns: selectedOptions },
    });
  };

  const selectedColumns = dataSource?.columns || [];

  const addColumn = (col) => {
    if (selectedColumns.includes(col)) return;
    onUpdate({ ...zoneConfig, dataSource: { ...dataSource, columns: [...selectedColumns, col] } });
  };

  const removeColumn = (index) => {
    const updated = selectedColumns.filter((_, i) => i !== index);
    onUpdate({ ...zoneConfig, dataSource: { ...dataSource, columns: updated } });
  };

  const moveColumn = (index, dir) => {
    const updated = [...selectedColumns];
    const target = index + dir;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onUpdate({ ...zoneConfig, dataSource: { ...dataSource, columns: updated } });
  };

  const unselectedColumns = tableColumns.filter((c) => !selectedColumns.includes(c));

  const handleThemeClick = (themeKey) => {
    onUpdate({
      ...zoneConfig,
      theme: themeKey,
    });
  };

  const handleComponentTypeChange = (e) => {
    const newComponentType = e.target.value;
    onUpdate({
      ...zoneConfig,
      componentType: newComponentType,
      // Reset library and chartType when switching to table
      library: newComponentType === COMPONENT_TYPES.TABLE ? null : (newComponentType === COMPONENT_TYPES.IMAGE || newComponentType === COMPONENT_TYPES.RICHTEXT ? null : CHART_LIBRARIES.CHARTJS),
      chartType: newComponentType === COMPONENT_TYPES.TABLE ? null : (newComponentType === COMPONENT_TYPES.IMAGE || newComponentType === COMPONENT_TYPES.RICHTEXT ? null : DEFAULT_CHART_TYPE[CHART_LIBRARIES.CHARTJS]),
    });
  };

  const handleShowHeaderChange = (e) => {
    onUpdate({
      ...zoneConfig,
      showHeader: e.target.checked,
    });
  };

  // Image-specific handlers
  const handleSrcChange = (e) => {
    onUpdate({
      ...zoneConfig,
      src: e.target.value,
    });
  };

  const handleAltChange = (e) => {
    onUpdate({
      ...zoneConfig,
      alt: e.target.value,
    });
  };

  const handleObjectFitChange = (e) => {
    onUpdate({
      ...zoneConfig,
      objectFit: e.target.value,
    });
  };

  const handleCaptionChange = (e) => {
    onUpdate({
      ...zoneConfig,
      caption: e.target.value,
    });
  };

  const handleShowCaptionChange = (e) => {
    onUpdate({
      ...zoneConfig,
      showCaption: e.target.checked,
    });
  };

  // Rich text-specific handlers
  const handleContentChange = (value) => {
    onUpdate({
      ...zoneConfig,
      content: value,
    });
  };

  const handleTextAlignChange = (e) => {
    onUpdate({
      ...zoneConfig,
      textAlign: e.target.value,
    });
  };

  const handleFontSizeChange = (e) => {
    onUpdate({
      ...zoneConfig,
      fontSize: e.target.value,
    });
  };

  // Legend handlers
  const handleLegendEnabledChange = (e) => {
    onUpdate({
      ...zoneConfig,
      legend: {
        ...legend,
        enabled: e.target.checked,
      },
    });
  };

  const handleLegendPositionChange = (e) => {
    onUpdate({
      ...zoneConfig,
      legend: {
        ...legend,
        position: e.target.value,
      },
    });
  };

  // Content mode handler for RichText
  const handleContentModeChange = (e) => {
    onUpdate({
      ...zoneConfig,
      contentMode: e.target.value,
    });
  };

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <h2 className="property-panel-title">
          {componentType === COMPONENT_TYPES.TABLE ? 'Configure Table' : 
           componentType === COMPONENT_TYPES.IMAGE ? 'Configure Image' :
           componentType === COMPONENT_TYPES.RICHTEXT ? 'Configure Text' :
           'Configure Chart'}
        </h2>
        <button className="property-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="property-panel-content">
        {/* Title */}
        <div className="property-field-group">
          <label className="property-label">Title</label>
          <input
            type="text"
            className="property-input"
            value={title || ''}
            onChange={handleTitleChange}
            placeholder="Enter chart title"
          />
        </div>

        {/* Show Header Toggle */}
        <div className="property-field-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="property-label" style={{ marginBottom: 0 }}>Show Header</label>
          <label className="property-toggle">
            <input
              type="checkbox"
              checked={showHeader !== false}
              onChange={handleShowHeaderChange}
            />
            <span className="property-toggle-slider"></span>
          </label>
        </div>

        {/* Component Type Selection */}
        <div className="property-field-group">
          <label className="property-label">Component Type</label>
          <select
            className="property-select"
            value={componentType || COMPONENT_TYPES.CHART}
            onChange={handleComponentTypeChange}
          >
            <option value={COMPONENT_TYPES.CHART}>
              Chart
            </option>
            <option value={COMPONENT_TYPES.TABLE}>
              Table
            </option>
            <option value={COMPONENT_TYPES.IMAGE}>
              Image
            </option>
            <option value={COMPONENT_TYPES.RICHTEXT}>
              Rich Text
            </option>
          </select>
        </div>

        {/* Chart Type Selection - all libraries grouped, only show for charts */}
        {componentType === COMPONENT_TYPES.CHART && (
          <div className="property-field-group">
            <label className="property-label">Chart Type</label>
            <select
              className="property-select"
              value={currentChartValue}
              onChange={handleChartTypeChange}
            >
              <option value="">Select chart type…</option>
              {CHART_OPTIONS_BY_LIBRARY.map(({ library: lib, label: groupLabel, types }) => (
                <optgroup key={lib} label={groupLabel}>
                  {types.map(({ value, label }) => (
                    <option key={value} value={encodeChartOption(lib, value)}>
                      {label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Theme Selection - Only show for charts and tables */}
        {(componentType === COMPONENT_TYPES.CHART || componentType === COMPONENT_TYPES.TABLE) && (
          <div className="property-field-group">
            <label className="property-label">Color Theme</label>
            <select
              className="property-select"
              value={theme}
              onChange={handleThemeChange}
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
                  className="property-theme-preview"
                  onClick={() => handleThemeClick(themeKey)}
                >
                  <span 
                    className={`property-theme-color ${theme === themeKey ? 'selected' : ''}`}
                    style={{ backgroundColor: THEMES[themeKey]?.primary || '#3b82f6' }}
                  />
                  <span className="property-theme-label">{themeKey}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend Settings - Only show for charts */}
        {componentType === COMPONENT_TYPES.CHART && (
          <div className="property-field-group">
            <label className="property-label">Legend</label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="property-help-text" style={{ margin: 0 }}>Show Legend</span>
              <label className="property-toggle">
                <input
                  type="checkbox"
                  checked={legend?.enabled !== false}
                  onChange={handleLegendEnabledChange}
                />
                <span className="property-toggle-slider"></span>
              </label>
            </div>
            {legend?.enabled !== false && (
              <div className="property-field-group" style={{ marginTop: '8px' }}>
                <label className="property-label" style={{ fontSize: '12px', color: '#6b7280' }}>Position</label>
                <select
                  className="property-select"
                  value={legend?.position || LEGEND_POSITIONS.BOTTOM}
                  onChange={handleLegendPositionChange}
                >
                  <option value={LEGEND_POSITIONS.TOP}>Top</option>
                  <option value={LEGEND_POSITIONS.BOTTOM}>Bottom</option>
                  <option value={LEGEND_POSITIONS.LEFT}>Left</option>
                  <option value={LEGEND_POSITIONS.RIGHT}>Right</option>
                  <option value={LEGEND_POSITIONS.NONE}>None</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Data Source Selection - Only show for charts and tables */}
        {(componentType === COMPONENT_TYPES.CHART || componentType === COMPONENT_TYPES.TABLE) && (
        <div className="property-field-group">
          <label className="property-label">Data Source (SQL Table)</label>
          <select
            className="property-select"
            value={dataSource?.tableName || ''}
            onChange={handleTableChange}
          >
            <option value="">Select a table...</option>
            {availableTables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>
        )}

        {/* Label Column - Only show for charts */}
        {componentType === COMPONENT_TYPES.CHART && (
          <div className="property-field-group">
            <label className="property-label">Label Column</label>
            <select
              className="property-select"
              value={dataSource?.labelColumn || ''}
              onChange={handleLabelColumnChange}
              disabled={!dataSource?.tableName}
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

        {/* Value Column - Only show for charts */}
        {componentType === COMPONENT_TYPES.CHART && (
          <div className="property-field-group">
            <label className="property-label">Value Column</label>
            <select
              className="property-select"
              value={dataSource?.valueColumn || ''}
              onChange={handleValueColumnChange}
              disabled={!dataSource?.tableName}
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

        {/* Sort Order - for charts only */}
        {componentType === COMPONENT_TYPES.CHART && (
          <div className="property-field-group">
            <label className="property-label">Sort Order</label>
            <select
              className="property-select"
              value={dataSort || 'none'}
              onChange={(e) => onUpdate({ ...zoneConfig, dataSort: e.target.value })}
            >
              <option value="none">None (data order)</option>
              <option value="value-asc">Value ↑ ascending</option>
              <option value="value-desc">Value ↓ descending</option>
              <option value="label-asc">Label A → Z</option>
              <option value="label-desc">Label Z → A</option>
            </select>
          </div>
        )}

        {/* Table Columns - ordered list with up/down/remove + add picker */}
        {dataSource?.tableName && componentType === COMPONENT_TYPES.TABLE && (
          <div className="property-field-group">
            <label className="property-label">Table Columns</label>

            {/* Ordered selected columns */}
            {selectedColumns.length > 0 && (
              <div style={{ marginBottom: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                {selectedColumns.map((col, i) => (
                  <div key={col} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '5px 8px', background: i % 2 === 0 ? '#f9fafb' : '#fff',
                    borderBottom: i < selectedColumns.length - 1 ? '1px solid #f3f4f6' : 'none',
                    fontSize: '12px',
                  }}>
                    <span style={{ flex: 1, color: '#1e293b', fontFamily: 'monospace' }}>{col}</span>
                    <button
                      onClick={() => moveColumn(i, -1)}
                      disabled={i === 0}
                      style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', padding: '0 3px', color: i === 0 ? '#d1d5db' : '#6b7280', fontSize: '13px', lineHeight: 1 }}
                      title="Move up"
                    >↑</button>
                    <button
                      onClick={() => moveColumn(i, 1)}
                      disabled={i === selectedColumns.length - 1}
                      style={{ background: 'none', border: 'none', cursor: i === selectedColumns.length - 1 ? 'default' : 'pointer', padding: '0 3px', color: i === selectedColumns.length - 1 ? '#d1d5db' : '#6b7280', fontSize: '13px', lineHeight: 1 }}
                      title="Move down"
                    >↓</button>
                    <button
                      onClick={() => removeColumn(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 3px', color: '#ef4444', fontSize: '14px', lineHeight: 1 }}
                      title="Remove column"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add column picker */}
            {unselectedColumns.length > 0 && (
              <select
                className="property-select"
                value=""
                onChange={(e) => { if (e.target.value) addColumn(e.target.value); }}
              >
                <option value="">＋ Add column…</option>
                {unselectedColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            )}

            {selectedColumns.length === 0 && (
              <p className="property-help-text">All columns shown. Add specific columns above to control order.</p>
            )}
          </div>
        )}

        {/* Image-specific fields */}
        {componentType === COMPONENT_TYPES.IMAGE && (
          <>
            <div className="property-field-group">
              <label className="property-label">Image URL</label>
              <input
                type="text"
                className="property-input"
                value={zoneConfig.src || ''}
                onChange={handleSrcChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="property-field-group">
              <label className="property-label">Alt Text</label>
              <input
                type="text"
                className="property-input"
                value={zoneConfig.alt || ''}
                onChange={handleAltChange}
                placeholder="Image description"
              />
            </div>
            <div className="property-field-group">
              <label className="property-label">Object Fit</label>
              <select
                className="property-select"
                value={zoneConfig.objectFit || 'cover'}
                onChange={handleObjectFitChange}
              >
                <option value="cover">Cover (fill)</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="property-field-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="property-label" style={{ marginBottom: 0 }}>Show Caption</label>
              <label className="property-toggle">
                <input
                  type="checkbox"
                  checked={zoneConfig.showCaption || false}
                  onChange={handleShowCaptionChange}
                />
                <span className="property-toggle-slider"></span>
              </label>
            </div>
            {zoneConfig.showCaption && (
              <div className="property-field-group">
                <label className="property-label">Caption</label>
                <input
                  type="text"
                  className="property-input"
                  value={zoneConfig.caption || ''}
                  onChange={handleCaptionChange}
                  placeholder="Image caption"
                />
              </div>
            )}
          </>
        )}

        {/* Rich Text-specific fields */}
        {componentType === COMPONENT_TYPES.RICHTEXT && (
          <>
            <div className="property-field-group">
              <label className="property-label">Content Mode</label>
              <select
                className="property-select"
                value={zoneConfig.contentMode || 'manual'}
                onChange={handleContentModeChange}
              >
                <option value="manual">Manual Text</option>
                <option value="data">From Data Source</option>
              </select>
            </div>

            {/* Manual text entry */}
            {zoneConfig.contentMode !== 'data' && (
              <div className="property-field-group">
                <label className="property-label">Text Content</label>
                <ReactQuill
                  theme="snow"
                  value={zoneConfig.content || ''}
                  onChange={handleContentChange}
                  placeholder="Enter your text content..."
                  style={{ marginBottom: '50px', height: '250px' }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                />
              </div>
            )}

            {/* Data source mode */}
            {zoneConfig.contentMode === 'data' && (
              <>
                <div className="property-field-group">
                  <label className="property-label">Data Source (SQL Table)</label>
                  <select
                    className="property-select"
                    value={dataSource?.tableName || ''}
                    onChange={handleTableChange}
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
                  <div className="property-field-group">
                    <label className="property-label">Label Column</label>
                    <select
                      className="property-select"
                      value={dataSource?.labelColumn || ''}
                      onChange={handleLabelColumnChange}
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
                  <div className="property-field-group">
                    <label className="property-label">Value Column</label>
                    <select
                      className="property-select"
                      value={dataSource?.valueColumn || ''}
                      onChange={handleValueColumnChange}
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
              </>
            )}

            <div className="property-field-group">
              <label className="property-label">Text Alignment</label>
              <select
                className="property-select"
                value={zoneConfig.textAlign || 'left'}
                onChange={handleTextAlignChange}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
            <div className="property-field-group">
              <label className="property-label">Font Size</label>
              <select
                className="property-select"
                value={zoneConfig.fontSize || '14px'}
                onChange={handleFontSizeChange}
              >
                <option value="12px">Small (12px)</option>
                <option value="14px">Normal (14px)</option>
                <option value="16px">Medium (16px)</option>
                <option value="18px">Large (18px)</option>
                <option value="24px">Extra Large (24px)</option>
              </select>
            </div>
          </>
        )}

        {/* Zone Info */}
        <div className="property-info">
          <strong>Zone ID:</strong> {id}
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
