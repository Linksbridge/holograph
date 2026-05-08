/**
 * App Component
 * 
 * The main application component that manages the dashboard state,
 * displays the dashboard list, and handles dashboard creation/editing.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DashboardList from './components/DashboardList';
import DashboardEditor from './components/DashboardEditor';
import NewDashboardModal from './components/NewDashboardModal';
import SettingsPanel from './components/SettingsPanel';
import PreviewModal from './components/PreviewModal';
import { FilterProvider, initializeGlobalFilterAPI, useFilters } from './hooks/useFilters';
import { createInitialDashboard } from './types/schema';
import { invokeSave, invokePublish, configureWebhookUrls, invokeListDocuments, invokeEditPublished, invokeDuplicate, configureSecurityWebhookUrls, invokeListSecurityRules, invokeSaveSecurityRules } from './services/webhookService';
import SecurityPanel from './components/SecurityPanel';
import HelpPage from './components/HelpPage';
import { globalSettingsService } from './services/globalSettingsService';
import { initializeDataService, setDataQueryUrl } from './services/dataService';
import './styles/dashboard.css';

const STORAGE_KEY = 'holograph_dashboards';
const SETTINGS_KEY = 'holograph_settings';

const loadDashboards = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const valid = parsed.filter(d => d.id && d.name);
      if (valid.length > 0) return valid;
    }
  } catch (_) {}
  return [{
    id: 'demo-dashboard',
    name: 'Demo Dashboard',
    description: 'A sample dashboard with example charts',
    status: 'published',
    lastModified: new Date().toISOString(),
    schema: createInitialDashboard(),
  }];
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return null;
};

// Inner component that uses filter context
const AppContent = () => {
  // Dashboard management state
  const [dashboards, setDashboards] = useState(loadDashboards);
  
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [securityRules, setSecurityRules] = useState([]);
  const defaultSecurityUrl = process.env.REACT_APP_SECURITY_RULES_URL || '';
  const [securityWebhookUrls, setSecurityWebhookUrls] = useState({
    securitySaveUrl: defaultSecurityUrl,
    listSecurityUrl: defaultSecurityUrl,
  });

  // Persist dashboards across sessions
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards)); } catch (_) {}
  }, [dashboards]);

  // Persist settings (including webhook URLs) across sessions
  useEffect(() => {
    try { if (settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
  }, [settings]);

  // Configure security webhook URLs from env var on mount
  useEffect(() => {
    if (defaultSecurityUrl) {
      configureSecurityWebhookUrls({ securitySaveUrl: defaultSecurityUrl, listSecurityUrl: defaultSecurityUrl });
    }
  }, []);

  // On startup: load global settings, apply webhooks, fetch schema, and auto-load dashboards
  useEffect(() => {
    const savedGlobalSettingsUrl =
      loadSettings()?.saveLocations?.globalSettingsUrl ||
      process.env.REACT_APP_DEFAULT_GLOBAL_SETTINGS_URL ||
      '';
    if (savedGlobalSettingsUrl) {
      globalSettingsService.setGlobalSettingsUrl(savedGlobalSettingsUrl);
    }

    globalSettingsService.getAllSettings().then(async (gs) => {
      const wh = gs?.webhooks;
      if (wh) {
        configureWebhookUrls({
          saveDraftUrl: wh.saveDraftUrl || '',
          publishUrl: wh.publishUrl || '',
          listDocumentsUrl: wh.listDocumentsUrl || '',
          dataQueryUrl: wh.dataQueryUrl || '',
        });
        setSettings((prev) => {
          const prevSave = prev?.saveLocations || {};
          return {
            ...prev,
            saveLocations: {
              ...prevSave,
              saveDraftUrl: wh.saveDraftUrl || prevSave.saveDraftUrl || '',
              publishUrl: wh.publishUrl || prevSave.publishUrl || '',
              listDocumentsUrl: wh.listDocumentsUrl || prevSave.listDocumentsUrl || '',
              dataQueryUrl: wh.dataQueryUrl || prevSave.dataQueryUrl || '',
            },
          };
        });
      }

      // Pass already-fetched values directly so initializeDataService doesn't need to re-fetch
      initializeDataService(
        null,
        null,
        gs?.database?.defaultDatabaseName || null,
        gs?.webhooks?.dataQueryUrl || null
      );

      // Auto-load dashboards if a list URL is available (removes the demo dashboard)
      const listUrl = wh?.listDocumentsUrl || loadSettings()?.saveLocations?.listDocumentsUrl;
      if (listUrl) {
        if (!wh?.listDocumentsUrl) configureWebhookUrls({ listDocumentsUrl: listUrl });
        const result = await invokeListDocuments();
        if (result.success) {
          const raw = result.result;
          // Server now returns a flat array of full dashboard objects
          const fetched = Array.isArray(raw) ? raw
            : Array.isArray(raw?.documents) ? raw.documents.filter(d => d.id)
            : null;
          if (fetched && fetched.length > 0) setDashboards(fetched);
        }
      }
    });
  }, []);

  // Keep webhook URLs in sync when user manually changes settings
  useEffect(() => {
    if (settings?.saveLocations) {
      configureWebhookUrls({
        saveDraftUrl: settings.saveLocations.saveDraftUrl || '',
        publishUrl: settings.saveLocations.publishUrl || '',
        listDocumentsUrl: settings.saveLocations.listDocumentsUrl || '',
      });
      if (settings.saveLocations.dataQueryUrl) {
        setDataQueryUrl(settings.saveLocations.dataQueryUrl);
      }
    }
  }, [settings]);

  // Get filter functions for global API
  const filterFunctions = useFilters();

  // Initialize global filter API for consuming systems
  useEffect(() => {
    initializeGlobalFilterAPI(filterFunctions);
  }, [filterFunctions]);

  // Create new dashboard
  const handleCreateDashboard = useCallback((dashboardInfo) => {
    const newDashboard = {
      id: `dashboard-${uuidv4()}`,
      name: dashboardInfo.name,
      description: dashboardInfo.description,
      status: 'draft',
      lastModified: new Date().toISOString(),
      schema: {
        ...createInitialDashboard(),
        name: dashboardInfo.name,
        description: dashboardInfo.description,
        zones: [],
      },
    };

    setDashboards((prev) => [...prev, newDashboard]);
    setCurrentDashboard(newDashboard);
    setShowNewModal(false);
  }, []);

  // Select dashboard to edit
  const handleSelectDashboard = useCallback((dashboard) => {
    setCurrentDashboard(dashboard);
  }, []);

  // Go back to dashboard list
  const handleBackToList = useCallback(() => {
    setCurrentDashboard(null);
  }, []);

  // Save draft (uses webhook callback)
  const handleSaveDraft = useCallback(async () => {
    if (!currentDashboard) return;

    const updatedDashboard = {
      ...currentDashboard,
      status: 'draft',
      lastModified: new Date().toISOString(),
    };

    // Invoke webhook handler
    const result = await invokeSave(updatedDashboard);
    
    if (result.success) {
      setDashboards((prev) =>
        prev.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d))
      );
      setCurrentDashboard(updatedDashboard);
      alert('Draft saved successfully!');
    } else {
      alert('Failed to save draft: ' + (result.error || 'Unknown error'));
    }
  }, [currentDashboard]);

  // Publish dashboard (uses webhook callback)
  const handlePublish = useCallback(async () => {
    if (!currentDashboard) return;

    const updatedDashboard = {
      ...currentDashboard,
      status: 'published',
      lastModified: new Date().toISOString(),
    };

    // Invoke webhook handler
    const result = await invokePublish(updatedDashboard);
    
    if (result.success) {
      setDashboards((prev) =>
        prev.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d))
      );
      setCurrentDashboard(updatedDashboard);
      alert('Dashboard published successfully!');
    } else {
      alert('Failed to publish: ' + (result.error || 'Unknown error'));
    }
  }, [currentDashboard]);

  // Open a published dashboard for editing — marks it as draft locally and calls the API
  const handleEditPublished = useCallback(async (dashboard) => {
    const result = await invokeEditPublished(dashboard.id);
    if (!result.success) {
      alert('Failed to create draft from published: ' + (result.error || 'Unknown error'));
      return;
    }
    const draftDashboard = { ...dashboard, status: 'draft', lastModified: new Date().toISOString() };
    setDashboards((prev) =>
      prev.map((d) => (d.id === draftDashboard.id ? draftDashboard : d))
    );
    setCurrentDashboard(draftDashboard);
  }, []);

  // Duplicate a published dashboard as a new draft with a new id
  const handleDuplicate = useCallback(async (dashboard) => {
    const newId = `dashboard-${uuidv4()}`;
    const newName = `${dashboard.name} (copy)`;
    const result = await invokeDuplicate(dashboard, newId, newName);
    if (!result.success) {
      alert('Failed to duplicate dashboard: ' + (result.error || 'Unknown error'));
      return;
    }
    const duplicated = {
      ...dashboard,
      id: newId,
      name: newName,
      status: 'draft',
      lastModified: new Date().toISOString(),
      duplicatedFrom: dashboard.id,
    };
    setDashboards((prev) => [...prev, duplicated]);
    setCurrentDashboard(duplicated);
  }, []);

  // Delete dashboard
  const handleDeleteDashboard = useCallback((dashboardId) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;

    setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
    
    if (currentDashboard?.id === dashboardId) {
      setCurrentDashboard(null);
    }
  }, [currentDashboard]);

  // Refresh dashboards from webhook
  const handleRefreshDashboards = useCallback(async () => {
    console.log('Loading complete dashboard objects from configured URL...');
    
    const result = await invokeListDocuments();
    
    if (result.success) {
      const raw = result.result;
      const fetched = Array.isArray(raw) ? raw
        : Array.isArray(raw?.documents) ? raw.documents.filter(d => d.id)
        : null;
      if (fetched && fetched.length > 0) {
        console.log(`Successfully loaded ${fetched.length} dashboard objects from URL`);
        setDashboards(fetched);
      } else {
        console.log('List returned no documents, keeping existing dashboards');
      }
    } else {
      console.error('Failed to load dashboard objects:', result.error || result.message);
      // Don't clear existing dashboards on error, just log it
      if (result.message) {
        console.info('Dashboard loading message:', result.message);
      }
    }
  }, []);

  // Update dashboard schema
  const handleDashboardUpdate = useCallback((updatedSchema) => {
    if (!currentDashboard) return;

    const updatedDashboard = {
      ...currentDashboard,
      schema: updatedSchema,
      lastModified: new Date().toISOString(),
    };

    setDashboards((prev) =>
      prev.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d))
    );
    setCurrentDashboard(updatedDashboard);
  }, [currentDashboard]);

  // Handle settings save
  const handleSettingsSave = useCallback(async (newSettings) => {
    // If globalSettingsUrl changed, re-fetch global settings and merge into the new settings
    const newGlobalUrl = newSettings?.saveLocations?.globalSettingsUrl;
    if (newGlobalUrl) {
      globalSettingsService.setGlobalSettingsUrl(newGlobalUrl);
      const gs = await globalSettingsService.getAllSettings(true);
      const wh = gs?.webhooks;
      if (wh) {
        // Global settings fill in any fields the user left blank
        newSettings = {
          ...newSettings,
          saveLocations: {
            ...newSettings.saveLocations,
            saveDraftUrl: newSettings.saveLocations.saveDraftUrl || wh.saveDraftUrl || '',
            publishUrl: newSettings.saveLocations.publishUrl || wh.publishUrl || '',
            listDocumentsUrl: newSettings.saveLocations.listDocumentsUrl || wh.listDocumentsUrl || '',
            dataQueryUrl: newSettings.saveLocations.dataQueryUrl || wh.dataQueryUrl || '',
          },
        };
      }
      initializeDataService(
        null,
        newSettings.dataSource?.schemaUrl || null,
        newSettings.dataSource?.databaseName || gs?.database?.defaultDatabaseName || null,
        newSettings.saveLocations.dataQueryUrl || null,
      );
    }

    setSettings(newSettings);

    // Configure webhook URLs from settings
    if (newSettings?.saveLocations) {
      configureWebhookUrls({
        saveDraftUrl: newSettings.saveLocations.saveDraftUrl || '',
        publishUrl: newSettings.saveLocations.publishUrl || '',
        listDocumentsUrl: newSettings.saveLocations.listDocumentsUrl || '',
        dataQueryUrl: newSettings.saveLocations.dataQueryUrl || '',
      });

      // Auto-refresh documents if listDocumentsUrl is provided
      if (newSettings.saveLocations.listDocumentsUrl?.trim()) {
        try {
          await handleRefreshDashboards();
        } catch (error) {
          console.error('Failed to load dashboard objects after settings save:', error);
        }
      }
    }
  }, [handleRefreshDashboards]);

  // Memoize normalized schema so dashboard.zones stays stable between renders
  const normalizedDashboardSchema = useMemo(() => {
    if (!currentDashboard) return null;
    const base = currentDashboard.schema ?? currentDashboard;
    return { zones: [], ...base };
  }, [currentDashboard]);

  const handleSaveSecurityRules = useCallback(async (rules, urls) => {
    if (urls) configureSecurityWebhookUrls(urls);
    return await invokeSaveSecurityRules(rules);
  }, []);

  const handleRefreshSecurityRules = useCallback(async (urls) => {
    if (urls) configureSecurityWebhookUrls(urls);
    return await invokeListSecurityRules();
  }, []);

  // Get badge class based on status
  const getStatusBadgeClass = (status) => {
    return status === 'published' ? 'top-bar-badge published' : 'top-bar-badge draft';
  };

  // Top bar with actions (shown when editing a dashboard)
  const TopBar = () => {
    return (
      <div className="top-bar">
        <div className="top-bar-left">
          <button className="top-bar-back" onClick={handleBackToList}>
            ← Back
          </button>
          <span className="top-bar-title">
            {currentDashboard?.name || 'Untitled'}
          </span>
          <span className={getStatusBadgeClass(currentDashboard?.status)}>
            {currentDashboard?.status || 'Draft'}
          </span>
        </div>
        
        <div className="top-bar-right">
          <button className="btn btn-secondary btn-icon" onClick={() => setShowPreview(true)}>
            👁️ Preview
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => setShowSecurity(true)}>
            🔒 Security
          </button>
          <button className="btn btn-secondary btn-icon" onClick={handleSaveDraft}>
            💾 Save Draft
          </button>
          <button className="btn btn-success btn-icon" onClick={handlePublish}>
            🚀 Publish
          </button>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={() => setShowSettings(true)}
          >
            ⚙️
          </button>
        </div>
      </div>
    );
  };

  if (showHelp) {
    return <HelpPage onBack={() => setShowHelp(false)} />;
  }

  return (
    <>
      {currentDashboard ? (
        <>
          <TopBar />
          <div style={{ marginTop: '56px' }}>
            <DashboardEditor
              dashboard={normalizedDashboardSchema}
              onDashboardUpdate={handleDashboardUpdate}
              settings={settings}
            />
          </div>
        </>
      ) : (
        <DashboardList
          dashboards={dashboards}
          onSelect={handleSelectDashboard}
          onCreateNew={() => setShowNewModal(true)}
          onSettings={() => setShowSettings(true)}
          onDelete={handleDeleteDashboard}
          onRefresh={handleRefreshDashboards}
          onEditPublished={handleEditPublished}
          onDuplicate={handleDuplicate}
          onSecurity={() => setShowSecurity(true)}
          onHelp={() => setShowHelp(true)}
        />
      )}

      {/* New Dashboard Modal */}
      <NewDashboardModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreateDashboard}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        dashboard={normalizedDashboardSchema}
        securityRules={securityRules}
        settings={settings}
      />

      {/* Security Panel */}
      <SecurityPanel
        isOpen={showSecurity}
        onClose={() => setShowSecurity(false)}
        rules={securityRules}
        onRulesChange={setSecurityRules}
        webhookUrls={securityWebhookUrls}
        onWebhookUrlsChange={setSecurityWebhookUrls}
        onSave={handleSaveSecurityRules}
        onRefresh={handleRefreshSecurityRules}
      />
    </>
  );
};

// Main App component that wraps content with FilterProvider
// Accepts optional externalFilters prop from parent React component
const App = ({ externalFilters }) => {
  return (
    <FilterProvider externalFilters={externalFilters}>
      <AppContent />
    </FilterProvider>
  );
};

export default App;
