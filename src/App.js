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

  // Save draft
  const handleSaveDraft = useCallback(() => {
    if (!currentDashboard) return;

    const updatedDashboard = {
      ...currentDashboard,
      status: 'draft',
      lastModified: new Date().toISOString(),
    };

    setDashboards((prev) =>
      prev.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d))
    );
    setCurrentDashboard(updatedDashboard);
    
    console.log('=== SAVE DRAFT JSON ===');
    console.log(JSON.stringify(updatedDashboard, null, 2));
    alert('Draft saved successfully!');
  }, [currentDashboard]);

  // Publish dashboard
  const handlePublish = useCallback(() => {
    if (!currentDashboard) return;

    const updatedDashboard = {
      ...currentDashboard,
      status: 'published',
      lastModified: new Date().toISOString(),
    };

    setDashboards((prev) =>
      prev.map((d) => (d.id === updatedDashboard.id ? updatedDashboard : d))
    );
    setCurrentDashboard(updatedDashboard);
    
    console.log('=== PUBLISH JSON ===');
    console.log(JSON.stringify(updatedDashboard, null, 2));
    alert('Dashboard published successfully!');
  }, [currentDashboard]);

  // Delete dashboard
  const handleDeleteDashboard = useCallback((dashboardId) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;

    setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
    
    if (currentDashboard?.id === dashboardId) {
      setCurrentDashboard(null);
    }
  }, [currentDashboard]);

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
  const handleSettingsSave = useCallback((newSettings) => {
    setSettings(newSettings);
    console.log('Settings saved:', newSettings);
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
