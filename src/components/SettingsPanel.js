/**
 * SettingsPanel Component
 * 
 * A panel for overall dashboard setup including:
 * - Data source configuration
 * - Save locations for drafts and publishes
 * - General dashboard settings
 */

import React, { useState } from 'react';

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
    },
    general: {
      autoSave: true,
      autoSaveInterval: 30,
    },
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

  const panelStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '450px',
    height: '100%',
    backgroundColor: '#ffffff',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1500,
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

  const titleStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: 0,
    lineHeight: 1,
  };

  const tabsStyle = {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: isActive ? '#3b82f6' : '#6b7280',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
  });

  const contentStyle = {
    padding: '20px',
    flex: 1,
    overflowY: 'auto',
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
    outline: 'none',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const toggleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const checkboxStyle = {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  };

  const footerStyle = {
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: '#f9fafb',
  };

  const buttonStyle = (primary = false) => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    cursor: 'pointer',
    border: primary ? 'none' : '1px solid #d1d5db',
    backgroundColor: primary ? '#3b82f6' : '#ffffff',
    color: primary ? '#ffffff' : '#374151',
  });

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Dashboard Settings</h2>
        <button style={closeButtonStyle} onClick={onClose}>×</button>
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'datasource')}
          onClick={() => setActiveTab('datasource')}
        >
          Data Source
        </button>
        <button
          style={tabStyle(activeTab === 'save')}
          onClick={() => setActiveTab('save')}
        >
          Save Locations
        </button>
        <button
          style={tabStyle(activeTab === 'general')}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {activeTab === 'datasource' && (
          <>
            <div style={sectionTitleStyle}>Azure SQL Configuration</div>
            
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Data Source Type</label>
              <select
                value={localSettings.dataSource.type}
                onChange={(e) => updateSettings('dataSource', 'type', e.target.value)}
                style={selectStyle}
              >
                <option value="azure-sql">Azure SQL Database</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="cosmos">Azure Cosmos DB</option>
              </select>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Connection String</label>
              <input
                type="password"
                value={localSettings.dataSource.connectionString}
                onChange={(e) => updateSettings('dataSource', 'connectionString', e.target.value)}
                style={inputStyle}
                placeholder="DefaultEndpoints=..."
              />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Leave empty to use environment variable
              </p>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Database Name</label>
              <input
                type="text"
                value={localSettings.dataSource.databaseName}
                onChange={(e) => updateSettings('dataSource', 'databaseName', e.target.value)}
                style={inputStyle}
                placeholder="Enter database name"
              />
            </div>
          </>
        )}

        {activeTab === 'save' && (
          <>
            <div style={sectionTitleStyle}>Azure Blob Storage</div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Storage Account Name</label>
              <input
                type="text"
                value={localSettings.saveLocations.storageAccount}
                onChange={(e) => updateSettings('saveLocations', 'storageAccount', e.target.value)}
                style={inputStyle}
                placeholder="mystorageaccount"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Drafts Container</label>
              <input
                type="text"
                value={localSettings.saveLocations.draftsContainer}
                onChange={(e) => updateSettings('saveLocations', 'draftsContainer', e.target.value)}
                style={inputStyle}
                placeholder="drafts"
              />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Container for saving draft dashboards
              </p>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Published Container</label>
              <input
                type="text"
                value={localSettings.saveLocations.publishedContainer}
                onChange={(e) => updateSettings('saveLocations', 'publishedContainer', e.target.value)}
                style={inputStyle}
                placeholder="published"
              />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Container for publishing live dashboards
              </p>
            </div>
          </>
        )}

        {activeTab === 'general' && (
          <>
            <div style={sectionTitleStyle}>General Settings</div>

            <div style={fieldGroupStyle}>
              <div style={toggleStyle}>
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={localSettings.general.autoSave}
                  onChange={(e) => updateSettings('general', 'autoSave', e.target.checked)}
                  style={checkboxStyle}
                />
                <label htmlFor="autoSave" style={{ fontSize: '14px', color: '#374151' }}>
                  Enable auto-save
                </label>
              </div>
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', marginLeft: '28px' }}>
                Automatically save changes while editing
              </p>
            </div>

            {localSettings.general.autoSave && (
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Auto-save Interval (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={localSettings.general.autoSaveInterval}
                  onChange={(e) => updateSettings('general', 'autoSaveInterval', parseInt(e.target.value))}
                  style={inputStyle}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <button style={buttonStyle(false)} onClick={onClose}>
          Cancel
        </button>
        <button style={buttonStyle(true)} onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
