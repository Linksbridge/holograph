/**
 * StandaloneViewer — Viewer package demo page
 *
 * Demonstrates @holograph/dashboard-viewer as it would be used in a real React app.
 * Accessible at /#/viewer. The designer's "Open in Viewer" button passes a live
 * dashboard here via React Router route state.
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardViewer from '@holograph/dashboard-viewer';

// ---------------------------------------------------------------------------
// Demo dashboard — uses sample tables built into the viewer's data service
// ---------------------------------------------------------------------------
const DEMO_DASHBOARD = {
  name: 'Sales Analytics',
  description: 'Demo dashboard rendered by @holograph/dashboard-viewer',
  layout: { cols: 12, rowHeight: 30, margin: [10, 10] },
  zones: [
    {
      id: 'z-bar',
      title: 'Monthly Revenue',
      componentType: 'chart',
      library: 'chartjs',
      chartType: 'chartjs_bar',
      theme: 'default',
      showHeader: true,
      gridPosition: { x: 0, y: 0, w: 5, h: 5 },
      dataSource: { tableName: 'sales_data', labelColumn: 'month', valueColumn: 'revenue' },
    },
    {
      id: 'z-donut',
      title: 'Regional Sales',
      componentType: 'chart',
      library: 'chartjs',
      chartType: 'chartjs_doughnut',
      theme: 'ocean',
      showHeader: true,
      gridPosition: { x: 5, y: 0, w: 3, h: 5 },
      dataSource: { tableName: 'regional_sales', labelColumn: 'region', valueColumn: 'sales' },
    },
    {
      id: 'z-line',
      title: 'Customer Growth',
      componentType: 'chart',
      library: 'nivo',
      chartType: 'nivo_line',
      theme: 'default',
      showHeader: true,
      gridPosition: { x: 8, y: 0, w: 4, h: 5 },
      dataSource: { tableName: 'customer_growth', labelColumn: 'month', valueColumn: 'customers' },
    },
    {
      id: 'z-pie',
      title: 'Performance Metrics',
      componentType: 'chart',
      library: 'nivo',
      chartType: 'nivo_pie',
      theme: 'sunset',
      showHeader: true,
      gridPosition: { x: 0, y: 5, w: 4, h: 5 },
      dataSource: { tableName: 'performance_metrics', labelColumn: 'metric', valueColumn: 'value' },
    },
    {
      id: 'z-nivo-bar',
      title: 'Product Trends',
      componentType: 'chart',
      library: 'nivo',
      chartType: 'nivo_bar',
      theme: 'forest',
      showHeader: true,
      gridPosition: { x: 4, y: 5, w: 8, h: 5 },
      dataSource: { tableName: 'product_trends', labelColumn: 'product', valueColumn: 'sales' },
    },
  ],
};

// ---------------------------------------------------------------------------
// Usage code snippet shown on the "Usage" tab
// ---------------------------------------------------------------------------
const CODE_SNIPPET = `import { DashboardViewer } from '@holograph/dashboard-viewer';

function App() {
  const [filters, setFilters] = useState({});

  return (
    <DashboardViewer
      dashboard={dashboardSchema}   // schema from the designer
      filters={filters}             // optional: drives chart data filtering
      onFilterChange={setFilters}   // optional: filter changes callback
    />
  );
}

// Pass your own data directly (bypasses the data service):
<DashboardViewer
  dashboard={schema}
  data={{
    'zone-id': [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ],
  }}
/>`;

const PROPS_DOC = [
  ['dashboard', 'object', 'Dashboard schema exported from the designer'],
  ['data',      'object', 'Optional: { zoneId: [{ label, value }] } — bypasses data service'],
  ['filters',   'object', 'Optional: filter values applied to all chart queries'],
  ['onFilterChange', 'function', 'Callback when filters change internally'],
  ['className', 'string', 'Optional CSS class added to the root element'],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const StandaloneViewer = () => {
  const location = useLocation();
  const [showCode, setShowCode] = useState(false);
  const [filters, setFilters] = useState({});

  // If the designer passed a real dashboard via route state, use it; else demo
  const dashboard = location.state?.dashboard || DEMO_DASHBOARD;
  const isLive = !!location.state?.dashboard;

  // ---- styles (inline to keep the component self-contained) ----
  const s = {
    page: {
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      background: '#0f172a',
      color: '#f8fafc',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    backLink: { color: '#94a3b8', fontSize: '13px', textDecoration: 'none' },
    divider: { color: '#334155' },
    title: { fontSize: '14px', fontWeight: 600 },
    badge: (live) => ({
      background: live ? '#22c55e18' : '#0ea5e918',
      color: live ? '#4ade80' : '#38bdf8',
      border: `1px solid ${live ? '#22c55e40' : '#0ea5e940'}`,
      fontSize: '11px',
      padding: '2px 8px',
      borderRadius: '12px',
    }),
    toggleBtn: (active) => ({
      background: active ? '#0ea5e9' : 'transparent',
      color: active ? '#fff' : '#94a3b8',
      border: '1px solid #334155',
      borderRadius: '6px',
      padding: '5px 12px',
      fontSize: '13px',
      cursor: 'pointer',
    }),
    body: { flex: 1, padding: '16px' },
    hint: {
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '10px 16px',
      marginBottom: '12px',
      fontSize: '13px',
      color: '#64748b',
    },
    codeBody: {
      flex: 1,
      padding: '32px',
      maxWidth: '820px',
      margin: '0 auto',
      width: '100%',
    },
    codeBlock: {
      background: '#1e293b',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px',
    },
    codeLabel: { color: '#64748b', fontSize: '11px', letterSpacing: '0.05em', marginBottom: '8px' },
    pre: {
      color: '#e2e8f0',
      margin: 0,
      fontSize: '13px',
      fontFamily: '"Fira Code", "Cascadia Code", monospace',
      lineHeight: 1.65,
      overflowX: 'auto',
      whiteSpace: 'pre',
    },
    propsBox: {
      marginTop: '20px',
      padding: '16px 20px',
      background: '#f0fdf4',
      borderRadius: '8px',
      border: '1px solid #bbf7d0',
    },
  };

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <a href="/#/" style={s.backLink}>← Designer</a>
          <span style={s.divider}>|</span>
          <span style={s.title}>{isLive ? dashboard.name : 'Viewer Demo'}</span>
          <span style={s.badge(isLive)}>
            {isLive ? 'Live Dashboard' : '@holograph/dashboard-viewer'}
          </span>
        </div>
        <button style={s.toggleBtn(showCode)} onClick={() => setShowCode(!showCode)}>
          {showCode ? '← Preview' : '</> Usage'}
        </button>
      </div>

      {showCode ? (
        /* ── Usage tab ── */
        <div style={s.codeBody}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
            Using the Viewer
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            Embed <code>DashboardViewer</code> in any React app. It accepts a dashboard schema
            exported from the designer and renders it with full chart support.
          </p>

          <div style={s.codeBlock}>
            <div style={s.codeLabel}>INSTALL</div>
            <pre style={s.pre}>npm install @holograph/dashboard-viewer</pre>
          </div>

          <div style={s.codeBlock}>
            <div style={s.codeLabel}>USAGE</div>
            <pre style={s.pre}>{CODE_SNIPPET}</pre>
          </div>

          <div style={s.propsBox}>
            <strong style={{ color: '#15803d', fontSize: '13px' }}>Props</strong>
            <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
              {PROPS_DOC.map(([prop, type, desc]) => (
                <div key={prop} style={{ fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                  <code style={{ color: '#0f766e', minWidth: '140px' }}>{prop}</code>
                  <code style={{ color: '#7c3aed', minWidth: '70px', fontSize: '12px' }}>{type}</code>
                  <span style={{ color: '#6b7280' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Preview tab ── */
        <div style={s.body}>
          <div style={s.hint}>
            {isLive
              ? `Rendering "${dashboard.name}" (${dashboard.zones?.length || 0} zones) via DashboardViewer — this is exactly how it appears embedded in another app.`
              : 'Demo dashboard — open any dashboard from the designer using "Open in Viewer" to preview it here.'}
          </div>

          {/* Component boundary wrapper — shows the viewer as a contained element */}
          <div style={{
            position: 'relative',
            border: '2px dashed #94a3b8',
            borderRadius: '8px',
            background: '#fff',
          }}>
            {/* Corner label */}
            <div style={{
              position: 'absolute',
              top: '-11px',
              left: '12px',
              background: '#475569',
              color: '#f8fafc',
              fontSize: '11px',
              fontFamily: '"Fira Code", monospace',
              padding: '1px 8px',
              borderRadius: '4px',
              userSelect: 'none',
              zIndex: 1,
            }}>
              &lt;DashboardViewer /&gt;
            </div>

            <DashboardViewer
              dashboard={dashboard}
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneViewer;
