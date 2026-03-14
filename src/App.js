/**
 * App Component
 * 
 * The main application component that manages the dashboard state,
 * displays the dashboard list, and handles dashboard creation/editing.
 */

import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DashboardList from './components/DashboardList';
import DashboardEditor from './components/DashboardEditor';
import NewDashboardModal from './components/NewDashboardModal';
import SettingsPanel from './components/SettingsPanel';
import { createInitialDashboard } from './types/schema';

const App = () => {
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

  // Global styles
  const globalStyles = `
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #f3f4f6;
    }

    code {
      font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
        monospace;
    }

    /* React Grid Layout custom styles */
    .react-grid-layout {
      position: relative;
    }

    .react-grid-item {
      transition: all 200ms ease;
      transition-property: left, top, width, height;
    }

    .react-grid-item.cssTransforms {
      transition-property: transform, width, height;
    }

    .react-grid-item.resizing {
      z-index: 100;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }

    .react-grid-item.react-draggable-dragging {
      z-index: 100;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      will-change: transform;
    }

    .react-grid-item > .react-resizable-handle {
      position: absolute;
      width: 20px;
      height: 20px;
    }

    .react-grid-item > .react-resizable-handle::after {
      content: '';
      position: absolute;
      right: 5px;
      bottom: 5px;
      width: 8px;
      height: 8px;
      border-right: 2px solid rgba(0, 0, 0, 0.3);
      border-bottom: 2px solid rgba(0, 0, 0, 0.3);
    }

    .react-resizable-handle-se {
      bottom: 0;
      right: 0;
      cursor: se-resize;
    }

    /* Zone card hover effects */
    .zone-header {
      cursor: move;
      user-select: none;
    }
  `;

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
        zones: [], // Start with empty dashboard
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

  // Top bar with actions (shown when editing a dashboard)
  const TopBar = () => {
    const barStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px 0 100px', // Account for palette
      zIndex: 800,
    };

    const leftSectionStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    };

    const backButtonStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      fontSize: '14px',
      color: '#6b7280',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    };

    const dashboardTitleStyle = {
      fontSize: '16px',
      fontWeight: 600,
      color: '#1f2937',
    };

    const rightSectionStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    };

    const buttonStyle = (variant = 'default') => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: 500,
      borderRadius: '6px',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s',
      ...(variant === 'primary' && {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      }),
      ...(variant === 'secondary' && {
        backgroundColor: '#ffffff',
        color: '#374151',
        border: '1px solid #d1d5db',
      }),
      ...(variant === 'success' && {
        backgroundColor: '#10b981',
        color: '#ffffff',
      }),
      ...(variant === 'default' && {
        backgroundColor: '#f3f4f6',
        color: '#374151',
      }),
    });

    return (
      <div style={barStyle}>
        <div style={leftSectionStyle}>
          <button style={backButtonStyle} onClick={handleBackToList}>
            ← Back
          </button>
          <span style={dashboardTitleStyle}>
            {currentDashboard?.name || 'Untitled'}
          </span>
          <span style={{
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '10px',
            backgroundColor: currentDashboard?.status === 'published' ? '#dcfce7' : '#fef3c7',
            color: currentDashboard?.status === 'published' ? '#166534' : '#92400e',
          }}>
            {currentDashboard?.status || 'Draft'}
          </span>
        </div>
        
        <div style={rightSectionStyle}>
          <button style={buttonStyle('secondary')} onClick={handleSaveDraft}>
            💾 Save Draft
          </button>
          <button style={buttonStyle('success')} onClick={handlePublish}>
            🚀 Publish
          </button>
          <button 
            style={buttonStyle('default')} 
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
      <style>{globalStyles}</style>
      
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
    </>
  );
};

export default App;
