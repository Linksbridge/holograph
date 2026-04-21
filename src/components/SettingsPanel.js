/**
 * SettingsPanel Component
 * 
 * A panel for overall dashboard setup including:
 * - Data source configuration
 * - Save locations for drafts and publishes
 * - General dashboard settings
 * - Chart library settings
 */

import React, { useState } from 'react';
import { CHART_LIBRARIES } from '../types/schema';

// Available chart libraries with display names
const AVAILABLE_LIBRARIES = [
  { value: CHART_LIBRARIES.CHARTJS, label: 'Chart.js', description: 'Simple, responsive charts' },
  { value: CHART_LIBRARIES.D3, label: 'D3.js', description: ' Powerful data visualizations' },
  { value: CHART_LIBRARIES.NIVO, label: 'Nivo', description: 'Beautiful, animated charts' },
];

const SettingsPanel = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings || {
    dataSource: {
      type: 'azure-sql',
      connectionString: '',
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
    enabledLibraries: [
      CHART_LIBRARIES.CHARTJS,
      CHART_LIBRARIES.D3,
      CHART_LIBRARIES.NIVO,
    ],
  });

  const [activeTab, setActiveTab] = useState('datasource');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
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
          className={`settings-tab ${activeTab === 'libraries' ? 'active' : ''}`}
          onClick={() => setActiveTab('libraries')}
        >
          Libraries
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
              <p className="property-help-text">GET endpoint to list all dashboards (returns array with id, name, status, lastModified)</p>
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

        {activeTab === 'libraries' && (
          <>
            <div className="settings-section-title">Chart Libraries</div>
            <p className="property-help-text" style={{ marginBottom: '16px' }}>
              Select which chart libraries to enable in the palette. Users will only see charts from enabled libraries.
            </p>

            {AVAILABLE_LIBRARIES.map((library) => (
              <div className="property-field-group" key={library.value}>
                <div className="settings-toggle">
                  <input
                    type="checkbox"
                    id={`library-${library.value}`}
                    className="settings-toggle-input"
                    checked={localSettings.enabledLibraries?.includes(library.value)}
                    onChange={(e) => {
                      const currentLibraries = localSettings.enabledLibraries || [];
                      let newLibraries;
                      if (e.target.checked) {
                        // Add library if checked
                        newLibraries = [...currentLibraries, library.value];
                      } else {
                        // Remove library if unchecked
                        newLibraries = currentLibraries.filter(lib => lib !== library.value);
                      }
                      setLocalSettings(prev => ({
                        ...prev,
                        enabledLibraries: newLibraries,
                      }));
                    }}
                  />
                  <label htmlFor={`library-${library.value}`} className="settings-toggle-label">
                    {library.label}
                  </label>
                </div>
                <p className="property-help-text" style={{ marginLeft: '28px' }}>
                  {library.description}
                </p>
              </div>
            ))}

            {localSettings.enabledLibraries?.length === 0 && (
              <div className="property-field-group">
                <p style={{ color: '#ef4444', fontSize: '12px', fontStyle: 'italic' }}>
                  Warning: No libraries selected. Users will not be able to add charts.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
