/**
 * NewDashboardModal Component
 * 
 * A modal dialog for creating a new empty dashboard.
 */

import React, { useState } from 'react';

const NewDashboardModal = ({ isOpen, onClose, onCreate }) => {
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dashboardName.trim()) {
      onCreate({
        name: dashboardName.trim(),
        description: dashboardDescription.trim(),
      });
      setDashboardName('');
      setDashboardDescription('');
    }
  };

  const handleClose = () => {
    setDashboardName('');
    setDashboardDescription('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Dashboard</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="property-field-group">
              <label className="property-label">Dashboard Name *</label>
              <input
                type="text"
                className="property-input"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Enter dashboard name"
                autoFocus
                required
              />
            </div>
            
            <div className="property-field-group">
              <label className="property-label">Description</label>
              <input
                type="text"
                className="property-input"
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Enter dashboard description"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!dashboardName.trim()}
            >
              Create Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDashboardModal;
