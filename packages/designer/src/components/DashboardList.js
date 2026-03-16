/**
 * DashboardList Component
 * 
 * A home view showing available dashboards with options to create new,
 * open existing, or manage dashboards.
 */

import React from 'react';
import BigLogo from '../big logo.png';

const DashboardList = ({ dashboards, onSelect, onCreateNew, onSettings, onDelete, onRefresh }) => {
  return (
    <div className="dashboard-list-container">
      <div className="dashboard-list-logo">
        <img src={BigLogo} alt="Holograph" className="big-logo" />
      </div>
      <div className="dashboard-list-header">
        <h1 className="dashboard-list-title">Dashboards</h1>
        <p className="dashboard-list-subtitle">Create and manage your data visualizations</p>
        
        <div className="dashboard-list-actions">
          <button className="btn btn-primary" onClick={onCreateNew}>
            <span>+</span>
            Create New Dashboard
          </button>
          {onRefresh && (
            <button className="btn btn-secondary" onClick={onRefresh} title="Refresh dashboards">
              🔄 Refresh
            </button>
          )}
          <button className="btn btn-secondary" onClick={onSettings}>
            ⚙️ Settings
          </button>
        </div>
      </div>

      {dashboards.length === 0 ? (
        <div className="dashboard-empty-state" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="dashboard-empty-state-icon">📊</div>
          <div className="dashboard-empty-state-title">No dashboards yet</div>
          <div className="dashboard-empty-state-text">Create your first dashboard to get started</div>
        </div>
      ) : (
        <div className="dashboard-list-grid">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="dashboard-card"
              onClick={() => onSelect(dashboard)}
            >
              <button
                className="dashboard-card-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(dashboard.id);
                }}
                title="Delete dashboard"
              >
                ×
              </button>
              
              <h3 className="dashboard-card-title">{dashboard.name}</h3>
              <p className="dashboard-card-description">
                {dashboard.description || 'No description'}
              </p>
              
              <div className="dashboard-card-meta">
                <span className={`dashboard-card-badge ${dashboard.status || 'draft'}`}>
                  {dashboard.status || 'Draft'}
                </span>
                <span className="dashboard-card-date">
                  {dashboard.lastModified ? new Date(dashboard.lastModified).toLocaleDateString() : 'Just now'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardList;
