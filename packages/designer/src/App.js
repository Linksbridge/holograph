/**
 * App Component
 * 
 * The main application component that manages the dashboard state,
 * displays the dashboard list, and handles dashboard creation/editing.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DashboardList from './components/DashboardList';
import DashboardEditor from './components/DashboardEditor';
import NewDashboardModal from './components/NewDashboardModal';
import SettingsPanel from './components/SettingsPanel';
import PreviewModal from './components/PreviewModal';
import { FilterProvider, initializeGlobalFilterAPI, useFilters } from './hooks/useFilters';
import { createInitialDashboard } from './types/schema';
import { invokeSave, invokePublish, configureWebhookUrls, invokeListDocuments } from './services/webhookService';
import './styles/dashboard.css';

// Inner component that uses filter context
const AppContent = () => {
  // Dashboard management state
  const [dashboards, setDashboards] = useState([
    {
      id: 'demo-dashboard',
      name: 'Demo Dashboard',
      description: 'A sample dashboard with example charts',
      status: 'published',
      lastModified: new Date().toISOString(),
      schema: createInitialDashboard(),
    },
  ]);
  
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize webhook URLs from settings when settings change
  useEffect(() => {
    if (settings?.saveLocations) {
      configureWebhookUrls({
        saveDraftUrl: settings.saveLocations.saveDraftUrl || '',
        publishUrl: settings.saveLocations.publishUrl || '',
        listDocumentsUrl: settings.saveLocations.listDocumentsUrl || '',
      });
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
    
    if (result.success && Array.isArray(result.result)) {
      console.log(`Successfully loaded ${result.result.length} complete dashboard objects from URL`);
      setDashboards(result.result);
    } else if (result.success && result.result) {
      // Single dashboard returned, wrap it in array
      console.log('Successfully loaded 1 complete dashboard object from URL');
      setDashboards([result.result]);
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
    setSettings(newSettings);
    
    // Configure webhook URLs from settings
    if (newSettings?.saveLocations) {
      configureWebhookUrls({
        saveDraftUrl: newSettings.saveLocations.saveDraftUrl || '',
        publishUrl: newSettings.saveLocations.publishUrl || '',
        listDocumentsUrl: newSettings.saveLocations.listDocumentsUrl || '',
      });
      
      // Auto-refresh documents if listDocumentsUrl is provided
      if (newSettings.saveLocations.listDocumentsUrl?.trim()) {
        console.log('List Documents URL configured, loading complete dashboard objects...');
        try {
          await handleRefreshDashboards();
          console.log('Complete dashboard objects successfully loaded from URL');
        } catch (error) {
          console.error('Failed to load dashboard objects after settings save:', error);
        }
      }
    }
    
    console.log('Settings saved:', newSettings);
  }, [handleRefreshDashboards]);

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

  return (
    <>
      {currentDashboard ? (
        <>
          <TopBar />
          <div style={{ marginTop: '56px' }}>
            <DashboardEditor
              dashboard={currentDashboard.schema}
              onDashboardUpdate={handleDashboardUpdate}
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
        dashboard={currentDashboard?.schema}
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
