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

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '450px',
    maxWidth: '90vw',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  const contentStyle = {
    padding: '24px',
  };

  const fieldGroupStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const footerStyle = {
    padding: '16px 24px',
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
    transition: 'all 0.2s',
  });

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Create New Dashboard</h2>
          <button style={closeButtonStyle} onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={contentStyle}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Dashboard Name *</label>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                style={inputStyle}
                placeholder="Enter dashboard name"
                autoFocus
                required
              />
            </div>
            
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                style={inputStyle}
                placeholder="Enter dashboard description"
              />
            </div>
          </div>
          
          <div style={footerStyle}>
            <button
              type="button"
              style={buttonStyle(false)}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={buttonStyle(true)}
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
