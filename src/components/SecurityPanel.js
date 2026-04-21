/**
 * SecurityPanel
 *
 * Modal drawer for managing role-based security rules.
 * Rules are global (apply across all datasources) and are persisted
 * via webhook URLs configured here.
 *
 * Rule granularity:
 *   datasource only          → entire datasource
 *   datasource + tableName   → entire table
 *   datasource + tableName + columnName → specific column
 */

import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import RoleTagInput from './RoleTagInput';
import { getAllRoles } from '../utils/securityUtils';

const SCOPE_BADGE = {
  datasource: { label: 'Datasource', bg: '#dbeafe', color: '#1d4ed8' },
  table:      { label: 'Table',      bg: '#dcfce7', color: '#15803d' },
  column:     { label: 'Column',     bg: '#ffedd5', color: '#c2410c' },
};

const getScope = (rule) => {
  if (rule.columnName) return 'column';
  if (rule.tableName)  return 'table';
  return 'datasource';
};

const getResourcePath = (rule) => {
  const parts = [rule.datasource];
  if (rule.tableName)  parts.push(rule.tableName);
  if (rule.columnName) parts.push(rule.columnName);
  return parts.join('.');
};

const BLANK_FORM = {
  datasource: '',
  tableName: '',
  columnName: '',
  roles: [],
  description: '',
};

const SecurityPanel = ({
  isOpen,
  onClose,
  rules,
  onRulesChange,
  webhookUrls,
  onWebhookUrlsChange,
  onSave,
  onRefresh,
}) => {
  const [localRules, setLocalRules] = useState(rules || []);
  const [localUrls, setLocalUrls] = useState(webhookUrls || { securitySaveUrl: '', listSecurityUrl: '' });
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState(BLANK_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const allRoles = useMemo(() => getAllRoles(localRules), [localRules]);

  if (!isOpen) return null;

  const showStatus = (msg, isError = false) => {
    setStatusMsg({ msg, isError });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    onWebhookUrlsChange(localUrls);
    const result = await onSave(localRules, localUrls);
    setSaving(false);
    if (result?.success) {
      onRulesChange(localRules);
      showStatus('Security rules saved.');
    } else {
      showStatus(result?.error || 'Save failed.', true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await onRefresh(localUrls);
    setRefreshing(false);
    if (result?.success && Array.isArray(result.result?.rules)) {
      setLocalRules(result.result.rules);
      onRulesChange(result.result.rules);
      showStatus('Rules refreshed.');
    } else {
      showStatus(result?.error || 'Refresh failed.', true);
    }
  };

  const commitNew = () => {
    if (!newForm.datasource.trim()) return;
    const rule = {
      id: uuidv4(),
      datasource:  newForm.datasource.trim(),
      tableName:   newForm.tableName.trim()  || null,
      columnName:  newForm.columnName.trim() || null,
      roles:       newForm.roles,
      description: newForm.description.trim() || null,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };
    setLocalRules((prev) => [...prev, rule]);
    setNewForm(BLANK_FORM);
    setAddingNew(false);
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setEditForm({
      datasource:  rule.datasource,
      tableName:   rule.tableName  || '',
      columnName:  rule.columnName || '',
      roles:       rule.roles,
      description: rule.description || '',
    });
  };

  const commitEdit = () => {
    setLocalRules((prev) => prev.map((r) => r.id !== editingId ? r : {
      ...r,
      datasource:  editForm.datasource.trim(),
      tableName:   editForm.tableName.trim()  || null,
      columnName:  editForm.columnName.trim() || null,
      roles:       editForm.roles,
      description: editForm.description.trim() || null,
      updatedAt:   new Date().toISOString(),
    }));
    setEditingId(null);
    setEditForm(null);
  };

  const deleteRule = (id) => setLocalRules((prev) => prev.filter((r) => r.id !== id));

  // ── styles ──────────────────────────────────────────────────────────────
  const s = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
    },
    panel: {
      background: '#fff', width: '780px', maxWidth: '95vw', height: '100vh',
      display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
    },
    header: {
      padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#0f172a',
    },
    headerTitle: { color: '#f8fafc', fontSize: '15px', fontWeight: 700, margin: 0 },
    closeBtn: {
      background: 'none', border: 'none', color: '#94a3b8',
      fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px',
    },
    body: { flex: 1, overflowY: 'auto', padding: '20px' },
    section: { marginBottom: '24px' },
    sectionTitle: {
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
      color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px',
    },
    urlRow: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
    urlLabel: { fontSize: '12px', color: '#374151', fontWeight: 500, marginBottom: '2px' },
    urlInput: {
      width: '100%', padding: '7px 10px', border: '1px solid #d1d5db',
      borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box',
    },
    helpText: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: {
      textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: 600,
      color: '#6b7280', borderBottom: '2px solid #e5e7eb', background: '#f9fafb',
      whiteSpace: 'nowrap',
    },
    td: { padding: '8px 10px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
    scopeBadge: (scope) => ({
      display: 'inline-block', padding: '2px 7px', borderRadius: '10px',
      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
      background: SCOPE_BADGE[scope].bg, color: SCOPE_BADGE[scope].color,
    }),
    resourcePath: { fontFamily: 'monospace', fontSize: '12px', color: '#1e293b' },
    actionBtn: (variant) => ({
      padding: '4px 10px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer',
      border: '1px solid',
      ...(variant === 'edit'
        ? { background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }
        : { background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }),
    }),
    addRowBtn: {
      marginTop: '10px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer',
      border: '1px dashed #94a3b8', borderRadius: '6px', background: '#f8fafc',
      color: '#475569', width: '100%',
    },
    formRow: {
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: '8px', padding: '14px', marginTop: '10px',
    },
    formGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px',
    },
    formLabel: { fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' },
    formInput: {
      width: '100%', padding: '6px 9px', border: '1px solid #d1d5db',
      borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box',
    },
    formActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' },
    footer: {
      padding: '14px 20px', borderTop: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '10px', background: '#f9fafb',
    },
    primaryBtn: {
      padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
      cursor: 'pointer', border: 'none', background: '#0f172a', color: '#fff',
    },
    secondaryBtn: {
      padding: '8px 14px', borderRadius: '6px', fontSize: '13px',
      cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', color: '#374151',
    },
    status: (isError) => ({
      fontSize: '12px', color: isError ? '#be123c' : '#15803d',
      background: isError ? '#fff1f2' : '#f0fdf4',
      border: `1px solid ${isError ? '#fecdd3' : '#bbf7d0'}`,
      borderRadius: '5px', padding: '5px 10px',
    }),
  };

  const FormFields = ({ form, setForm, roles }) => (
    <>
      <div style={s.formGrid}>
        <div>
          <div style={s.formLabel}>Datasource *</div>
          <input
            style={s.formInput}
            value={form.datasource}
            onChange={(e) => setForm((f) => ({ ...f, datasource: e.target.value }))}
            placeholder="e.g. sales_db"
          />
        </div>
        <div>
          <div style={s.formLabel}>Table (optional)</div>
          <input
            style={s.formInput}
            value={form.tableName}
            onChange={(e) => setForm((f) => ({ ...f, tableName: e.target.value, columnName: e.target.value ? f.columnName : '' }))}
            placeholder="leave blank = whole datasource"
          />
        </div>
        <div>
          <div style={s.formLabel}>Column (optional)</div>
          <input
            style={s.formInput}
            value={form.columnName}
            disabled={!form.tableName}
            onChange={(e) => setForm((f) => ({ ...f, columnName: e.target.value }))}
            placeholder={form.tableName ? 'leave blank = whole table' : 'requires table first'}
          />
        </div>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={s.formLabel}>Roles</div>
        <RoleTagInput
          value={form.roles}
          onChange={(r) => setForm((f) => ({ ...f, roles: r }))}
          allRoles={roles}
          placeholder="Add role…"
        />
      </div>
      <div>
        <div style={s.formLabel}>Description (optional)</div>
        <input
          style={s.formInput}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Human-readable note"
        />
      </div>
    </>
  );

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.headerTitle}>🔒 Security Rules</h2>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={s.body}>

          {/* Webhook URLs */}
          <div style={s.section}>
            <div style={s.sectionTitle}>Webhook Configuration</div>
            <div style={s.urlRow}>
              <div style={s.urlLabel}>List Security Rules URL</div>
              <input
                style={s.urlInput}
                type="text"
                value={localUrls.listSecurityUrl}
                onChange={(e) => setLocalUrls((u) => ({ ...u, listSecurityUrl: e.target.value }))}
                placeholder="https://api.example.com/security-rules"
              />
              <div style={s.helpText}>GET — returns {`{ version, rules: [...] }`}</div>
            </div>
            <div style={s.urlRow}>
              <div style={s.urlLabel}>Save Security Rules URL</div>
              <input
                style={s.urlInput}
                type="text"
                value={localUrls.securitySaveUrl}
                onChange={(e) => setLocalUrls((u) => ({ ...u, securitySaveUrl: e.target.value }))}
                placeholder="https://api.example.com/security-rules/save"
              />
              <div style={s.helpText}>POST — receives {`{ version, rules: [...] }`}</div>
            </div>
          </div>

          {/* Rules Table */}
          <div style={s.section}>
            <div style={s.sectionTitle}>
              Rules ({localRules.length})
            </div>

            {localRules.length === 0 && !addingNew ? (
              <div style={{ color: '#9ca3af', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                No security rules yet. Click "Add Rule" to create one.
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Resource Path</th>
                    <th style={s.th}>Scope</th>
                    <th style={s.th}>Roles</th>
                    <th style={s.th}>Description</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {localRules.map((rule) => (
                    editingId === rule.id ? (
                      <tr key={rule.id}>
                        <td colSpan={5} style={s.td}>
                          <div style={s.formRow}>
                            <FormFields form={editForm} setForm={setEditForm} roles={allRoles} />
                            <div style={s.formActions}>
                              <button style={s.secondaryBtn} onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</button>
                              <button style={s.primaryBtn} onClick={commitEdit}>Save</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={rule.id}>
                        <td style={s.td}>
                          <span style={s.resourcePath}>{getResourcePath(rule)}</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.scopeBadge(getScope(rule))}>
                            {SCOPE_BADGE[getScope(rule)].label}
                          </span>
                        </td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {rule.roles.length === 0
                              ? <span style={{ color: '#9ca3af', fontSize: '12px' }}>none</span>
                              : rule.roles.map((r) => (
                                  <span key={r} style={{
                                    background: '#eff6ff', border: '1px solid #bfdbfe',
                                    borderRadius: '4px', padding: '1px 6px',
                                    fontSize: '11px', color: '#1d4ed8',
                                  }}>{r}</span>
                                ))
                            }
                          </div>
                        </td>
                        <td style={{ ...s.td, color: '#6b7280', fontSize: '12px', maxWidth: '180px' }}>
                          {rule.description || '—'}
                        </td>
                        <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={s.actionBtn('edit')} onClick={() => startEdit(rule)}>Edit</button>
                            <button style={s.actionBtn('delete')} onClick={() => deleteRule(rule.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            )}

            {/* Add new rule inline form */}
            {addingNew ? (
              <div style={s.formRow}>
                <FormFields form={newForm} setForm={setNewForm} roles={allRoles} />
                <div style={s.formActions}>
                  <button style={s.secondaryBtn} onClick={() => { setAddingNew(false); setNewForm(BLANK_FORM); }}>Cancel</button>
                  <button style={s.primaryBtn} onClick={commitNew} disabled={!newForm.datasource.trim()}>Add Rule</button>
                </div>
              </div>
            ) : (
              <button style={s.addRowBtn} onClick={() => setAddingNew(true)}>
                ＋ Add Rule
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <div>
            {statusMsg && <span style={s.status(statusMsg.isError)}>{statusMsg.msg}</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={s.secondaryBtn} onClick={onClose}>Close</button>
            <button style={s.secondaryBtn} onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? 'Loading…' : '↺ Refresh'}
            </button>
            <button style={s.primaryBtn} onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Rules'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;
