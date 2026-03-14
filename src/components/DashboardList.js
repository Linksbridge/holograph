/**
 * DashboardList Component
 * 
 * A home view showing available dashboards with options to create new,
 * open existing, or manage dashboards.
 */

import React from 'react';

const DashboardList = ({ dashboards, onSelect, onCreateNew, onSettings, onDelete }) => {
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const headerStyle = {
    maxWidth: '1000px',
    margin: '0 auto 40px',
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: '#6b7280',
    marginTop: '8px',
  };

  const actionsStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  };

  const buttonStyle = (variant = 'primary') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
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
    ...(variant === 'danger' && {
      backgroundColor: '#ffffff',
      color: '#dc2626',
      border: '1px solid #fecaca',
    }),
    ...(variant === 'settings' && {
      backgroundColor: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
    }),
  });

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #e5e7eb',
    position: 'relative',
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  };

  const cardDescStyle = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '8px',
    lineHeight: 1.5,
  };

  const cardMetaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  };

  const badgeStyle = (status) => ({
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '12px',
    ...(status === 'published' && {
      backgroundColor: '#dcfce7',
      color: '#166534',
    }),
    ...(status === 'draft' && {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    }),
  });

  const dateStyle = {
    fontSize: '12px',
    color: '#9ca3af',
  };

  const deleteButtonStyle = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px dashed #e5e7eb',
    maxWidth: '1000px',
    margin: '0 auto',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Dashboards</h1>
        <p style={subtitleStyle}>Create and manage your data visualizations</p>
        
        <div style={actionsStyle}>
          <button style={buttonStyle('primary')} onClick={onCreateNew}>
            <span>+</span>
            Create New Dashboard
          </button>
          <button style={buttonStyle('settings')} onClick={onSettings}>
            ⚙️ Settings
          </button>
        </div>
      </div>

      {dashboards.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '18px', color: '#1f2937', margin: '0 0 8px' }}>
            No dashboards yet
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Create your first dashboard to get started
          </p>
        </div>
      ) : (
        <div style={gridStyle}>
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              style={cardStyle}
              onClick={() => onSelect(dashboard)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <button
                style={deleteButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(dashboard.id);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
                title="Delete dashboard"
              >
                ×
              </button>
              
              <h3 style={cardTitleStyle}>{dashboard.name}</h3>
              <p style={cardDescStyle}>
                {dashboard.description || 'No description'}
              </p>
              
              <div style={cardMetaStyle}>
                <span style={badgeStyle(dashboard.status || 'draft')}>
                  {dashboard.status || 'Draft'}
                </span>
                <span style={dateStyle}>
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
