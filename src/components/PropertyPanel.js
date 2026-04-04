/**
 * PropertyPanel Component
 * 
 * A configuration panel that allows users to modify zone settings.
 */

import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CHART_LIBRARIES, CHART_TYPES, CHART_TYPE_LIBRARY, DEFAULT_CHART_TYPE, COLOR_THEMES, THEMES, COMPONENT_TYPES, LEGEND_POSITIONS } from '../types/schema';
import { getAvailableTables, getTableColumns } from '../services/dataService';

const PropertyPanel = ({ zoneConfig, onUpdate, onClose }) => {
  const { id, componentType, library, theme, title, dataSource, chartType, showHeader, legend } = zoneConfig;
  const availableTables = getAvailableTables();
  const tableColumns = dataSource?.tableName ? getTableColumns(dataSource.tableName) : [];

  // Get available chart types for the current library
  const availableChartTypes = Object.values(CHART_TYPES).filter(
    (type) => CHART_TYPE_LIBRARY[type] === library
  );

  // Get chart type display name
  const getChartTypeName = (type) => {
    const names = {
      [CHART_TYPES.D3_BAR]: 'Bar Chart',
      [CHART_TYPES.D3_LINE]: 'Line Chart',
      [CHART_TYPES.D3_AREA]: 'Area Chart',
      [CHART_TYPES.D3_PIE]: 'Pie Chart',
      [CHART_TYPES.D3_DONUT]: 'Donut Chart',
      [CHART_TYPES.D3_SCATTER]: 'Scatter Chart',
      [CHART_TYPES.CHARTJS_LINE]: 'Line Chart',
      [CHART_TYPES.CHARTJS_BAR]: 'Bar Chart',
      [CHART_TYPES.CHARTJS_PIE]: 'Pie Chart',
      [CHART_TYPES.CHARTJS_DOUGHNUT]: 'Doughnut Chart',
      [CHART_TYPES.CHARTJS_RADAR]: 'Radar Chart',
      [CHART_TYPES.CHARTJS_POLAR]: 'Polar Area Chart',
      [CHART_TYPES.NIVO_LINE]: 'Line Chart',
      [CHART_TYPES.NIVO_BAR]: 'Bar Chart',
      [CHART_TYPES.NIVO_PIE]: 'Pie Chart',
      [CHART_TYPES.NIVO_CHOROPLETH]: 'Choropleth Map',
    };
    return names[type] || type;
  };

  const handleLibraryChange = (e) => {
    const newLibrary = e.target.value;
    const defaultType = DEFAULT_CHART_TYPE[newLibrary];
    onUpdate({
      ...zoneConfig,
      library: newLibrary,
      chartType: defaultType,
    });
  };

  const handleChartTypeChange = (e) => {
    onUpdate({
      ...zoneConfig,
      chartType: e.target.value,
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

  const handleColumnsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onUpdate({
      ...zoneConfig,
      dataSource: {
        ...dataSource,
        columns: selectedOptions,
      },
    });
  };

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

        {/* Library Selection - Only show for charts */}
        {componentType === COMPONENT_TYPES.CHART && (
        <div className="property-field-group">
          <label className="property-label">Rendering Library</label>
          <select
            className="property-select"
            value={library}
            onChange={handleLibraryChange}
          >
            <option value={CHART_LIBRARIES.CHARTJS}>
              Chart.js
            </option>
            <option value={CHART_LIBRARIES.D3}>
              D3.js
            </option>
            <option value={CHART_LIBRARIES.NIVO}>
              Nivo
            </option>
          </select>
        </div>
        )}

        {/* Chart Type Selection - Only show for charts */}
        {componentType === COMPONENT_TYPES.CHART && (
        <div className="property-field-group">
          <label className="property-label">Chart Type</label>
          <select
            className="property-select"
            value={chartType || DEFAULT_CHART_TYPE[library]}
            onChange={handleChartTypeChange}
          >
            {availableChartTypes.map((type) => (
              <option key={type} value={type}>
                {getChartTypeName(type)}
              </option>
            ))}
          </select>
            <p className="property-help-text">
              {library === CHART_LIBRARIES.CHARTJS
                ? 'Select a chart type from Chart.js library'
                : library === CHART_LIBRARIES.D3
                ? 'Select a chart type from D3.js library'
                : 'Select a chart type from Nivo library'}
            </p>
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

        {/* Choropleth-specific settings */}
        {componentType === COMPONENT_TYPES.CHART && chartType === CHART_TYPES.NIVO_CHOROPLETH && (
          <div className="property-field-group">
            <label className="property-label">Map Configuration</label>

            {/* Geographical Data Source */}
            <div className="property-field-group" style={{ marginTop: '12px' }}>
              <label className="property-label" style={{ fontSize: '12px', color: '#6b7280' }}>Geographical Data</label>
              <select
                className="property-select"
                value={zoneConfig.mapFeatures || 'world-50m'}
                onChange={(e) => onUpdate({
                  ...zoneConfig,
                  mapFeatures: e.target.value,
                })}
              >
                <option value="world-50m">World (50m resolution)</option>
                <option value="world-110m">World (110m resolution)</option>
                <option value="usa">United States</option>
                <option value="europe">Europe</option>
                <option value="custom">Custom GeoJSON</option>
              </select>
              <p className="property-help-text">
                Select the geographical features for your map
              </p>
            </div>

            {/* Projection Type */}
            <div className="property-field-group" style={{ marginTop: '12px' }}>
              <label className="property-label" style={{ fontSize: '12px', color: '#6b7280' }}>Projection</label>
              <select
                className="property-select"
                value={zoneConfig.projectionType || 'naturalEarth1'}
                onChange={(e) => onUpdate({
                  ...zoneConfig,
                  projectionType: e.target.value,
                })}
              >
                <option value="naturalEarth1">Natural Earth 1</option>
                <option value="mercator">Mercator</option>
                <option value="orthographic">Orthographic</option>
                <option value="equirectangular">Equirectangular</option>
                <option value="albersUsa">Albers USA</option>
              </select>
            </div>

            {/* Projection Scale */}
            <div className="property-field-group" style={{ marginTop: '12px' }}>
              <label className="property-label" style={{ fontSize: '12px', color: '#6b7280' }}>Scale</label>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                className="property-input"
                value={zoneConfig.projectionScale || 100}
                onChange={(e) => onUpdate({
                  ...zoneConfig,
                  projectionScale: parseInt(e.target.value),
                })}
                style={{ margin: '8px 0' }}
              />
              <span className="property-help-text">{zoneConfig.projectionScale || 100}</span>
            </div>

            {/* Custom GeoJSON URL */}
            {zoneConfig.mapFeatures === 'custom' && (
              <div className="property-field-group" style={{ marginTop: '12px' }}>
                <label className="property-label" style={{ fontSize: '12px', color: '#6b7280' }}>GeoJSON URL</label>
                <input
                  type="text"
                  className="property-input"
                  value={zoneConfig.geoJsonUrl || ''}
                  onChange={(e) => onUpdate({
                    ...zoneConfig,
                    geoJsonUrl: e.target.value,
                  })}
                  placeholder="https://example.com/geojson-data.json"
                />
                <p className="property-help-text">
                  URL to your custom GeoJSON features
                </p>
              </div>
            )}

            {/* Match Function */}
            <div className="property-field-group" style={{ marginTop: '12px' }}>
              <label className="property-label" style={{ fontSize: '12px', color: '#6b7280' }}>Data Matching</label>
              <select
                className="property-select"
                value={zoneConfig.matchBy || 'id'}
                onChange={(e) => onUpdate({
                  ...zoneConfig,
                  matchBy: e.target.value,
                })}
              >
                <option value="id">Match by ID</option>
                <option value="properties.name">Match by Name</option>
                <option value="properties.iso_a3">Match by ISO Code</option>
                <option value="custom">Custom Match Function</option>
              </select>
              <p className="property-help-text">
                How to match your data to map features
              </p>
            </div>

            <div className="property-info" style={{ marginTop: '16px' }}>
              <strong>Data format:</strong>{' '}
              {(!zoneConfig.matchBy || zoneConfig.matchBy === 'id') && (
                <>Each data row needs an <code>id</code> field with the ISO&nbsp;A3 country code (e.g. <code>USA</code>, <code>GBR</code>, <code>DEU</code>).</>
              )}
              {zoneConfig.matchBy === 'properties.name' && (
                <>Each data row needs an <code>id</code> field with the full country name (e.g. <code>United States of America</code>).</>
              )}
              {zoneConfig.matchBy === 'properties.iso_a3' && (
                <>Each data row needs an <code>id</code> field with the ISO&nbsp;A3 code (e.g. <code>USA</code>, <code>GBR</code>, <code>DEU</code>).</>
              )}
              {zoneConfig.matchBy === 'custom' && (
                <>Custom matching requires a data field that aligns with the chosen GeoJSON feature properties.</>
              )}
            </div>
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
        {dataSource?.tableName && componentType === COMPONENT_TYPES.CHART && (
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

        {/* Value Column - Only show for charts */}
        {dataSource?.tableName && componentType === COMPONENT_TYPES.CHART && (
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

        {/* Table Columns - Multi-select for tables */}
        {dataSource?.tableName && componentType === COMPONENT_TYPES.TABLE && (
          <div className="property-field-group">
            <label className="property-label">Table Columns</label>
            <select
              className="property-select"
              multiple
              value={dataSource?.columns || []}
              onChange={handleColumnsChange}
              style={{ height: '100px' }}
            >
              {tableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <p className="property-help-text">
              Hold Ctrl/Cmd to select multiple columns
            </p>
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
