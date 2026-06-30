/**
 * SettingsPanel Component
 * 
 * A panel for overall dashboard setup including:
 * - Data source configuration
 * - Save locations for drafts and publishes
 * - General dashboard settings
 */

import React, { useState, useEffect } from 'react';
// Minimal CSV parser — avoids papaparse webpack 5 polyfill issues
const parseCSV = (text) => {
  const parseRow = (line) => {
    const fields = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(field); field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field);
    return fields;
  };
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { data: [], fields: [] };
  const fields = parseRow(lines[0]);
  const data = lines.slice(1).map(line => {
    const vals = parseRow(line);
    return Object.fromEntries(fields.map((h, i) => [h, vals[i] ?? '']));
  });
  return { data, fields };
};
import * as XLSX from 'xlsx';
import { initializeDataService, getCachedTables, getSchemaInfo, isUsingRealSchema } from '../services/dataService';
import { useGlobalSettings } from '../services/globalSettingsService';

const defaults = {
  dataSource: {
    type: 'azure-sql',
    connectionString: process.env.REACT_APP_DATABASE_CONNECTION_STRING || '',
    schemaUrl: process.env.REACT_APP_DATABASE_SCHEMA_URL || '',
    databaseName: '',
  },
  saveLocations: {
    saveDraftUrl: '',
    publishUrl: '',
    listDocumentsUrl: '',
    dataQueryUrl: '',
    globalSettingsUrl: process.env.REACT_APP_DEFAULT_GLOBAL_SETTINGS_URL || '',
    uploadFileUrl: '',
    fileDataUrl: '',
    listFilesUrl: '',
  },
  general: {
    autoSave: true,
    autoSaveInterval: 30,
  },
};

const SettingsPanel = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(() => ({
    dataSource: { ...defaults.dataSource, ...settings?.dataSource },
    saveLocations: {
      ...defaults.saveLocations,
      ...settings?.saveLocations,
      globalSettingsUrl:
        settings?.saveLocations?.globalSettingsUrl ||
        process.env.REACT_APP_DEFAULT_GLOBAL_SETTINGS_URL ||
        '',
    },
    general: { ...defaults.general, ...settings?.general },
    fileSources: settings?.fileSources || [],
  }));

  const [activeTab, setActiveTab] = useState('datasource');
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesLoadStatus, setTablesLoadStatus] = useState('');
  const [documentsLoadStatus, setDocumentsLoadStatus] = useState('');
  const [fileUploadStatus, setFileUploadStatus] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  
  // Global settings
  const { settings: globalSettings, loading: globalLoading, error: globalError, refreshSettings } = useGlobalSettings(localSettings);

  // When global settings load, populate database name if the field is empty
  useEffect(() => {
    const dbName = globalSettings?.database?.defaultDatabaseName;
    if (dbName && !localSettings.dataSource.databaseName) {
      setLocalSettings((prev) => ({
        ...prev,
        dataSource: { ...prev.dataSource, databaseName: dbName },
      }));
    }
  }, [globalSettings?.database?.defaultDatabaseName]);

  // When global settings load, populate webhook URLs if the fields are empty
  useEffect(() => {
    const wh = globalSettings?.webhooks;
    if (!wh) return;
    setLocalSettings((prev) => ({
      ...prev,
      saveLocations: {
        ...prev.saveLocations,
        saveDraftUrl: wh.saveDraftUrl || prev.saveLocations.saveDraftUrl || '',
        publishUrl: wh.publishUrl || prev.saveLocations.publishUrl || '',
        listDocumentsUrl: wh.listDocumentsUrl || prev.saveLocations.listDocumentsUrl || '',
        dataQueryUrl: wh.dataQueryUrl || prev.saveLocations.dataQueryUrl || '',
        uploadFileUrl: wh.uploadFileUrl || prev.saveLocations.uploadFileUrl || '',
        fileDataUrl: wh.fileDataUrl || prev.saveLocations.fileDataUrl || '',
        listFilesUrl: wh.listFilesUrl || prev.saveLocations.listFilesUrl || '',
      },
    }));
  }, [globalSettings?.webhooks]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const uploadUrl = localSettings.saveLocations.uploadFileUrl;
    if (!uploadUrl) return;

    setIsUploadingFile(true);
    setFileUploadStatus('Parsing file...');

    try {
      let name, columns, rows;
      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'csv') {
        const text = await file.text();
        const result = parseCSV(text);
        rows = result.data;
        columns = result.fields;
        name = file.name.replace(/\.csv$/i, '');
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        name = file.name.replace(/\.(xlsx?|xls)$/i, '');
      }

      setFileUploadStatus(`Uploading ${rows.length} rows...`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, columns, rows }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Upload failed (${response.status}): ${err}`);
      }

      const result = await response.json();
      const newFileSource = {
        id: result.id,
        name: result.name,
        columns: result.columns || columns,
        rowCount: result.rowCount ?? rows.length,
        uploadedAt: new Date().toISOString(),
      };

      setLocalSettings((prev) => ({
        ...prev,
        fileSources: [
          ...(prev.fileSources || []).filter((f) => f.id !== result.id),
          newFileSource,
        ],
      }));

      setFileUploadStatus(`Uploaded "${result.name}" — ${result.rowCount} rows, ${(result.columns || columns).length} columns`);
    } catch (err) {
      setFileUploadStatus(`Error: ${err.message}`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeFileSource = (id) => {
    setLocalSettings((prev) => ({
      ...prev,
      fileSources: (prev.fileSources || []).filter((f) => f.id !== id),
    }));
  };

  if (!isOpen) return null;

  const handleRefreshDataSettings = async () => {
    setIsLoadingTables(true);
    setTablesLoadStatus('Refreshing...');
    try {
      await refreshSettings();
      const dbName = localSettings.dataSource.databaseName || globalSettings?.database?.defaultDatabaseName;
      const schemaUrl = localSettings.dataSource.schemaUrl || process.env.REACT_APP_DATABASE_SCHEMA_URL;
      const dqUrl = localSettings.saveLocations.dataQueryUrl || null;
      await initializeDataService(null, schemaUrl, dbName, dqUrl);
      const tables = getCachedTables();
      setTablesLoadStatus(tables.length > 0 ? `Loaded ${tables.length} tables` : 'No tables found');
    } catch (err) {
      setTablesLoadStatus('Error refreshing settings');
    } finally {
      setIsLoadingTables(false);
      setTimeout(() => setTablesLoadStatus(''), 3000);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoadingTables(true);
      
      // If connection string is provided, load table information
      if (localSettings.dataSource.connectionString) {
        setTablesLoadStatus('Loading table information...');
        
        await initializeDataService(localSettings.dataSource.connectionString, localSettings.dataSource.schemaUrl, localSettings.dataSource.databaseName, localSettings.saveLocations.dataQueryUrl || null);
        const tables = getCachedTables();
        
        if (tables && tables.length > 0) {
          setTablesLoadStatus(`Successfully loaded ${tables.length} tables`);
        } else {
          setTablesLoadStatus('No tables found in database');
        }
        
        setTimeout(() => setTablesLoadStatus(''), 3000);
      }
      
      // Show document loading status if URL is provided
      if (localSettings.saveLocations.listDocumentsUrl?.trim()) {
        setDocumentsLoadStatus('Complete dashboard objects will be loaded after settings are saved...');
        setTimeout(() => setDocumentsLoadStatus(''), 3000);
      }
      
      onSave(localSettings);
      onClose();
    } catch (error) {
      console.error('Error loading table information:', error);
      setTablesLoadStatus('Error loading table information');
      setTimeout(() => setTablesLoadStatus(''), 3000);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const updateSettings = (section, key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  return (
    <div className="property-panel settings-panel-wide">
      <div className="property-panel-header">
        <h2 className="property-panel-title">Dashboard Settings</h2>
        <button className="property-panel-close" onClick={onClose}>×</button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'datasource' ? 'active' : ''}`}
          onClick={() => setActiveTab('datasource')}
        >
          Data Source
        </button>
        <button
          className={`settings-tab ${activeTab === 'save' ? 'active' : ''}`}
          onClick={() => setActiveTab('save')}
        >
          Save Locations
        </button>
        <button
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`settings-tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
          title="Site-wide settings (read-only)"
        >
          🌐 Global
        </button>
        <button
          className={`settings-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
          title="Upload CSV or Excel files as data sources"
        >
          📂 Files
        </button>
      </div>

      {/* Content */}
      <div className="property-panel-content">
        {activeTab === 'datasource' && (
          <>
            <div className="settings-section-title">Azure SQL Configuration</div>
            
            <div className="property-field-group">
              <label className="property-label">Data Source Type</label>
              <select
                className="property-select"
                value={localSettings.dataSource.type}
                onChange={(e) => updateSettings('dataSource', 'type', e.target.value)}
              >
                <option value="azure-sql">Azure SQL Database</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="cosmos">Azure Cosmos DB</option>
              </select>
            </div>

            <div className="property-field-group">
              <label className="property-label">Connection String</label>
              <input
                type="password"
                className="property-input"
                value={localSettings.dataSource.connectionString}
                onChange={(e) => updateSettings('dataSource', 'connectionString', e.target.value)}
                placeholder="DefaultEndpoints=..."
              />
              <p className="property-help-text">Leave empty to use environment variable</p>
            </div>

            <div className="property-field-group">
              <label className="property-label">Schema URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.dataSource.schemaUrl}
                onChange={(e) => updateSettings('dataSource', 'schemaUrl', e.target.value)}
                placeholder="https://api.example.com/api/get-database-schema"
              />
              <p className="property-help-text">POST endpoint that returns table and column names from the database</p>
            </div>

            <div className="property-field-group">
              <label className="property-label">Database Name</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.dataSource.databaseName}
                onChange={(e) => updateSettings('dataSource', 'databaseName', e.target.value)}
                placeholder="Enter database name"
              />
            </div>

            <div className="property-field-group">
              <label className="property-label">Schema Status</label>
              <div style={{
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: isUsingRealSchema() ? '#dcfce7' : '#fef3c7',
                border: `1px solid ${isUsingRealSchema() ? '#16a34a' : '#d97706'}`,
                fontSize: '0.875rem'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  color: isUsingRealSchema() ? '#16a34a' : '#d97706',
                  marginBottom: '4px'
                }}>
                  {isUsingRealSchema() ? '🗄️ Using Real Database Schema' : '📊 Using Sample Data'}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {(() => {
                    const schemaInfo = getSchemaInfo();
                    return `${schemaInfo.tableCount} tables available: ${schemaInfo.tables.join(', ')}`;
                  })()}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'save' && (
          <>
            <div className="settings-section-title">Global Settings</div>

            <div className="property-field-group">
              <label className="property-label">Global Settings URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.globalSettingsUrl}
                onChange={(e) => updateSettings('saveLocations', 'globalSettingsUrl', e.target.value)}
                placeholder="https://api.example.com/api/global-settings"
              />
              <p className="property-help-text">GET endpoint returning shared database config and webhook URLs. When set, overrides individual fields below.</p>
            </div>

            <div className="settings-section-title" style={{ marginTop: '24px' }}>Webhook URLs</div>

            <div className="property-field-group">
              <label className="property-label">List Documents URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.listDocumentsUrl}
                onChange={(e) => updateSettings('saveLocations', 'listDocumentsUrl', e.target.value)}
                placeholder="https://api.example.com/dashboards"
              />
              <p className="property-help-text">GET endpoint to list all dashboards with complete layout information (returns array of full dashboard objects including id, name, status, lastModified, schema, zones, etc.)</p>
            </div>

            <div className="property-field-group">
              <label className="property-label">Data Query URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.dataQueryUrl}
                onChange={(e) => updateSettings('saveLocations', 'dataQueryUrl', e.target.value)}
                placeholder="https://api.example.com/api/data"
              />
              <p className="property-help-text">Base URL for fetching chart and table data (e.g. <code>https://api.example.com/api/data</code>). The datasource name and <code>&#123;table&#125;</code> are appended automatically on save: <code>/api/data/datasourceName/&#123;table&#125;</code></p>
            </div>

            <div className="property-field-group">
              <label className="property-label">Save Draft URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.saveDraftUrl}
                onChange={(e) => updateSettings('saveLocations', 'saveDraftUrl', e.target.value)}
                placeholder="https://api.example.com/drafts"
              />
              <p className="property-help-text">POST endpoint for saving draft dashboards</p>
            </div>

            <div className="property-field-group">
              <label className="property-label">Publish URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.publishUrl}
                onChange={(e) => updateSettings('saveLocations', 'publishUrl', e.target.value)}
                placeholder="https://api.example.com/publish"
              />
              <p className="property-help-text">POST endpoint for publishing dashboards</p>
            </div>

            {localSettings.saveLocations.listDocumentsUrl?.trim() && (
              <div className="property-field-group">
                <label className="property-label">Document Loading Status</label>
                <div style={{
                  padding: '10px',
                  borderRadius: '4px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}>
                  <div style={{
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    📄 Complete Dashboard Loading URL Configured
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    When settings are saved, the system will automatically fetch and display your complete dashboard objects (including layouts, charts, and configurations) from: {localSettings.saveLocations.listDocumentsUrl}
                  </div>
                </div>
              </div>
            )}

          </>
        )}

        {activeTab === 'general' && (
          <>
            <div className="settings-section-title">General Settings</div>

            <div className="property-field-group">
              <div className="settings-toggle">
                <input
                  type="checkbox"
                  id="autoSave"
                  className="settings-toggle-input"
                  checked={localSettings.general.autoSave}
                  onChange={(e) => updateSettings('general', 'autoSave', e.target.checked)}
                />
                <label htmlFor="autoSave" className="settings-toggle-label">
                  Enable auto-save
                </label>
              </div>
              <p className="property-help-text" style={{ marginLeft: '28px' }}>
                Automatically save changes while editing
              </p>
            </div>

            {localSettings.general.autoSave && (
              <div className="property-field-group">
                <label className="property-label">Auto-save Interval (seconds)</label>
                <input
                  type="number"
                  className="property-input"
                  min="10"
                  max="300"
                  value={localSettings.general.autoSaveInterval}
                  onChange={(e) => updateSettings('general', 'autoSaveInterval', parseInt(e.target.value))}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'global' && (
          <>
            <div className="settings-section-title">
              🌐 Global Database Settings (Read-Only)
              <div style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280', marginTop: '4px' }}>
                These database settings are shared across all users
              </div>
            </div>

            {globalLoading && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                Loading global settings...
              </div>
            )}

            {globalError && (
              <div style={{
                padding: '15px',
                backgroundColor: '#fee2e2',
                border: '1px solid #dc2626',
                borderRadius: '4px',
                color: '#dc2626',
                marginBottom: '15px'
              }}>
                ⚠️ Unable to load global settings: {globalError}
                {!localSettings.saveLocations?.globalSettingsUrl && (
                  <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                    💡 Configure the Global Settings Function URL in the "Save Locations" tab
                  </div>
                )}
                <button
                  onClick={refreshSettings}
                  style={{
                    marginLeft: '10px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    border: '1px solid #dc2626',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {!globalLoading && !globalError && (
              <>
                {/* Database Configuration */}
                {globalSettings.database && (
                  <div className="settings-subsection" style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ marginTop: '0', marginBottom: '15px', color: '#374151' }}>Database Configuration</h4>
                    
                    <div className="property-field-group">
                      <label className="property-label">Default Database Name</label>
                      <div className="readonly-value" style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        color: '#6b7280',
                        fontFamily: 'monospace'
                      }}>
                        {globalSettings.database.defaultDatabaseName || 'DashboardDB'}
                      </div>
                    </div>

                    <div className="property-field-group">
                      <label className="property-label">Default Server</label>
                      <div className="readonly-value" style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        color: '#6b7280',
                        fontFamily: 'monospace'
                      }}>
                        {globalSettings.database.defaultServer || 'localhost'}
                      </div>
                    </div>

                    <div className="property-field-group">
                      <label className="property-label">Connection Template</label>
                      <div className="readonly-value" style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        color: '#6b7280',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        wordBreak: 'break-all'
                      }}>
                        {globalSettings.database.connectionStringTemplate || 'Server={server};Database={database};...'}
                      </div>
                    </div>

                    <div className="property-field-group">
                      <label className="property-label">Default Query Timeout</label>
                      <div className="readonly-value" style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        color: '#6b7280'
                      }}>
                        {globalSettings.database.defaultTimeout || 30} seconds
                      </div>
                    </div>
                  </div>
                )}

                {/* Webhook URLs */}
                {globalSettings.webhooks && (
                  <div className="settings-subsection" style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ marginTop: '0', marginBottom: '15px', color: '#374151' }}>Webhook URLs</h4>
                    {[
                      ['List Documents URL', globalSettings.webhooks.listDocumentsUrl],
                      ['Data Query URL', globalSettings.webhooks.dataQueryUrl],
                      ['Save Draft URL', globalSettings.webhooks.saveDraftUrl],
                      ['Publish URL', globalSettings.webhooks.publishUrl],
                    ].map(([label, value]) => (
                      <div className="property-field-group" key={label}>
                        <label className="property-label">{label}</label>
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: value ? '#ffffff' : '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          color: value ? '#374151' : '#9ca3af',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          wordBreak: 'break-all'
                        }}>
                          {value || 'Not configured'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Table Mappings */}
                {/* Note: Tables are loaded dynamically from database schema */}
                <div className="settings-subsection" style={{
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  border: '1px solid #0284c7'
                }}>
                  <h4 style={{ marginTop: '0', marginBottom: '15px', color: '#374151' }}>📊 Table Information</h4>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}>
                    Tables are loaded automatically from the database schema when you connect.
                    <br />
                    Configure your connection in the "Data Source" tab to see available tables.
                  </div>
                </div>

                {/* Data Source Policy */}
                {globalSettings.dataSource && (
                  <div className="settings-subsection" style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ marginTop: '0', marginBottom: '15px', color: '#374151' }}>Data Source Policy</h4>
                    
                    <div className="property-field-group">
                      <label className="property-label">Default Database Type</label>
                      <div className="readonly-value" style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        color: '#6b7280',
                        textTransform: 'capitalize'
                      }}>
                        {globalSettings.dataSource.defaultType || 'azure-sql'}
                      </div>
                    </div>

                    {globalSettings.dataSource.allowedTypes && (
                      <div className="property-field-group">
                        <label className="property-label">Allowed Database Types</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {globalSettings.dataSource.allowedTypes.map(type => (
                            <span
                              key={type}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                textTransform: 'capitalize'
                              }}
                            >
                              {type.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="property-field-group">
                      <label className="property-label">Query Timeout</label>
                      <div className="readonly-value" style={{
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        color: '#6b7280'
                      }}>
                        {globalSettings.dataSource.queryTimeout || 30000}ms
                      </div>
                    </div>

                    <div className="property-field-group">
                      <label className="property-label">Caching</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          backgroundColor: globalSettings.dataSource.enableCaching ? '#16a34a' : '#dc2626',
                          borderRadius: '2px'
                        }} />
                        <span style={{ color: '#6b7280' }}>
                          {globalSettings.dataSource.enableCaching ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Refresh Button */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', textAlign: 'center' }}>
                  <button
                    onClick={handleRefreshDataSettings}
                    disabled={isLoadingTables}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: isLoadingTables ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {isLoadingTables ? '⏳ Refreshing...' : '🔄 Refresh Data Settings'}
                  </button>
                  {tablesLoadStatus && (
                    <div style={{ marginTop: '10px', fontSize: '0.875rem', color: tablesLoadStatus.includes('Error') ? '#dc2626' : '#16a34a' }}>
                      {tablesLoadStatus}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
        {activeTab === 'files' && (
          <>
            <div className="settings-section-title">File Source URLs</div>

            <div className="property-field-group">
              <label className="property-label">Upload File URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.uploadFileUrl}
                onChange={(e) => updateSettings('saveLocations', 'uploadFileUrl', e.target.value)}
                placeholder="https://api.example.com/api/file-upload"
              />
              <p className="property-help-text">POST endpoint — receives parsed file data and returns a file ID</p>
            </div>

            <div className="property-field-group">
              <label className="property-label">File Data URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.fileDataUrl}
                onChange={(e) => updateSettings('saveLocations', 'fileDataUrl', e.target.value)}
                placeholder="https://api.example.com/api/file-data"
              />
              <p className="property-help-text">GET endpoint — fetches rows by file ID (appends ?id=...)</p>
            </div>

            <div className="property-field-group">
              <label className="property-label">List Files URL</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.listFilesUrl}
                onChange={(e) => updateSettings('saveLocations', 'listFilesUrl', e.target.value)}
                placeholder="https://api.example.com/api/file-list"
              />
              <p className="property-help-text">GET endpoint — returns metadata for all uploaded files</p>
            </div>

            <div className="settings-section-title" style={{ marginTop: '24px' }}>Upload a File</div>

            <div className="property-field-group">
              <label className="property-label">Choose File</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={!localSettings.saveLocations.uploadFileUrl || isUploadingFile}
                style={{ display: 'block', marginTop: '4px' }}
              />
              <p className="property-help-text">Supported: CSV, Excel (.xlsx, .xls) — parsed in browser, rows stored on backend</p>
              {!localSettings.saveLocations.uploadFileUrl && (
                <p style={{ color: '#d97706', fontSize: '0.8rem', marginTop: '4px' }}>
                  Set Upload File URL above to enable uploading
                </p>
              )}
            </div>

            {fileUploadStatus && (
              <div style={{
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: fileUploadStatus.startsWith('Error') ? '#fee2e2' : '#dcfce7',
                border: `1px solid ${fileUploadStatus.startsWith('Error') ? '#dc2626' : '#16a34a'}`,
                color: fileUploadStatus.startsWith('Error') ? '#dc2626' : '#16a34a',
                fontSize: '0.875rem',
                marginBottom: '16px',
              }}>
                {fileUploadStatus}
              </div>
            )}

            <div className="settings-section-title" style={{ marginTop: '8px' }}>Uploaded Files</div>
            <p className="property-help-text" style={{ marginBottom: '8px' }}>
              Files listed here can be used as a table name in any chart or table. Click Save Settings to register them.
            </p>

            {(localSettings.fileSources || []).length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '8px 0' }}>
                No files uploaded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(localSettings.fileSources || []).map((file) => (
                  <div
                    key={file.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {file.rowCount} rows · {(file.columns || []).join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFileSource(file.id)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.8rem',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#6b7280',
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* Footer */}
      <div className="modal-footer">
        {(tablesLoadStatus || documentsLoadStatus) && (
          <div className="status-messages" style={{ marginBottom: '10px' }}>
            {tablesLoadStatus && (
              <div className="tables-load-status" style={{ 
                marginBottom: '5px',
                padding: '8px', 
                borderRadius: '4px',
                backgroundColor: tablesLoadStatus.includes('Error') ? '#fee2e2' : 
                               tablesLoadStatus.includes('Successfully') ? '#dcfce7' : '#fef3c7',
                color: tablesLoadStatus.includes('Error') ? '#dc2626' : 
                       tablesLoadStatus.includes('Successfully') ? '#16a34a' : '#d97706',
                fontSize: '0.875rem'
              }}>
                🗄️ {tablesLoadStatus}
              </div>
            )}
            {documentsLoadStatus && (
              <div className="documents-load-status" style={{ 
                padding: '8px', 
                borderRadius: '4px',
                backgroundColor: '#e0f2fe',
                color: '#0277bd',
                fontSize: '0.875rem'
              }}>
                📄 {documentsLoadStatus}
              </div>
            )}
          </div>
        )}
        <button className="btn btn-secondary" onClick={onClose} disabled={isLoadingTables}>
          Cancel
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={isLoadingTables}
        >
          {isLoadingTables ? 'Loading...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
