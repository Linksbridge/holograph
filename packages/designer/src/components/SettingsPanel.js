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
