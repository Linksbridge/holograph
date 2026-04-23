/**
 * SettingsPanel Component
 * 
 * A panel for overall dashboard setup including:
 * - Data source configuration
 * - Save locations for drafts and publishes
 * - General dashboard settings
 */

import React, { useState } from 'react';
import { initializeDataService, getCachedTables, getSchemaInfo, isUsingRealSchema } from '../services/dataService';
import { useGlobalSettings } from '../services/globalSettingsService';

const SettingsPanel = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings || {
    dataSource: {
      type: 'azure-sql',
      connectionString: process.env.REACT_APP_DATABASE_CONNECTION_STRING || '',
      databaseName: '',
    },
    saveLocations: {
      draftsContainer: 'drafts',
      publishedContainer: 'published',
      storageAccount: '',
      saveDraftUrl: '',
      publishUrl: '',
      listDocumentsUrl: '',
      globalSettingsUrl: '',
    },
    general: {
      autoSave: true,
      autoSaveInterval: 30,
    },
  });

  const [activeTab, setActiveTab] = useState('datasource');
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesLoadStatus, setTablesLoadStatus] = useState('');
  const [documentsLoadStatus, setDocumentsLoadStatus] = useState('');
  
  // Global settings
  const { settings: globalSettings, loading: globalLoading, error: globalError, refreshSettings } = useGlobalSettings(localSettings);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsLoadingTables(true);
      
      // If connection string is provided, load table information
      if (localSettings.dataSource.connectionString) {
        setTablesLoadStatus('Loading table information...');
        
        await initializeDataService(localSettings.dataSource.connectionString);
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
    <div className="property-panel">
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
          className={`settings-tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
          title="Site-wide settings (read-only)"
        >
          🌐 Global
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
            <div className="settings-section-title">Webhook URLs</div>

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

            <div className="settings-section-title" style={{ marginTop: '24px' }}>Azure Blob Storage</div>

            <div className="property-field-group">
              <label className="property-label">Storage Account Name</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.storageAccount}
                onChange={(e) => updateSettings('saveLocations', 'storageAccount', e.target.value)}
                placeholder="mystorageaccount"
              />
            </div>

            <div className="property-field-group">
              <label className="property-label">Drafts Container</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.draftsContainer}
                onChange={(e) => updateSettings('saveLocations', 'draftsContainer', e.target.value)}
                placeholder="drafts"
              />
              <p className="property-help-text">Container for saving draft dashboards</p>
            </div>

            <div className="property-field-group">
              <label className="property-label">Published Container</label>
              <input
                type="text"
                className="property-input"
                value={localSettings.saveLocations.publishedContainer}
                onChange={(e) => updateSettings('saveLocations', 'publishedContainer', e.target.value)}
                placeholder="published"
              />
              <p className="property-help-text">Container for publishing live dashboards</p>
            </div>
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
                    onClick={refreshSettings}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    🔄 Refresh Database Settings
                  </button>
                </div>
              </>
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
