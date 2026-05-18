import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getCachedTables, getCachedColumns } from '../services/dataService';

const JOIN_TYPES = ['INNER', 'LEFT', 'RIGHT', 'FULL'];

const JOIN_TYPE_LABELS = {
  INNER: 'Inner — matched rows only',
  LEFT:  'Left — all base rows',
  RIGHT: 'Right — all joined rows',
  FULL:  'Full — all rows both sides',
};

const BLANK_DS = { name: '', baseTable: '', joins: [] };
const BLANK_JOIN = { type: 'LEFT', table: '', on: { left: '', right: '' } };

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
  },
  panel: {
    width: '680px', maxWidth: '95vw', background: '#fff',
    display: 'flex', flexDirection: 'column', height: '100%',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#f9fafb',
  },
  headerTitle: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '20px',
    cursor: 'pointer', color: '#6b7280', lineHeight: 1,
  },
  body: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  section: { marginBottom: '20px' },
  sectionTitle: {
    fontSize: '11px', fontWeight: 700, color: '#6b7280',
    textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em',
  },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '7px',
    marginBottom: '6px', background: '#fafafa',
  },
  rowName: { fontWeight: 600, fontSize: '13px', color: '#1e293b' },
  rowMeta: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },
  actionBtn: (variant) => ({
    padding: '4px 10px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer',
    border: '1px solid',
    ...(variant === 'edit'
      ? { background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }
      : { background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }),
  }),
  addBtn: {
    width: '100%', padding: '8px', fontSize: '13px', cursor: 'pointer',
    border: '1px dashed #94a3b8', borderRadius: '6px',
    background: '#f8fafc', color: '#475569',
  },
  form: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '8px', padding: '16px', marginTop: '6px',
  },
  label: { fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', display: 'block' },
  input: {
    width: '100%', padding: '6px 9px', border: '1px solid #d1d5db',
    borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '6px 9px', border: '1px solid #d1d5db',
    borderRadius: '5px', fontSize: '13px', boxSizing: 'border-box', background: '#fff',
  },
  fieldGroup: { marginBottom: '12px' },
  joinCard: {
    border: '1px solid #e2e8f0', borderRadius: '7px',
    padding: '12px', marginBottom: '8px', background: '#fff', position: 'relative',
  },
  joinGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px',
  },
  joinHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px',
  },
  joinTypeRow: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', marginBottom: '8px' },
  removeJoinBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '14px', color: '#9ca3af', padding: '0 4px',
  },
  formActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' },
  primaryBtn: {
    padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', border: 'none', background: '#0f172a', color: '#fff',
  },
  secondaryBtn: {
    padding: '8px 14px', borderRadius: '6px', fontSize: '13px',
    cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', color: '#374151',
  },
  footer: {
    padding: '14px 20px', borderTop: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'flex-end', background: '#f9fafb',
  },
};

const JoinEditor = ({ join, index, tables, onUpdate, onRemove }) => {
  const rightCols = join.table ? getCachedColumns(join.table) : [];
  // For left columns, offer all columns from tables before this join — simplified to all cached columns
  const leftColOptions = join.table ? getCachedColumns(join.table === tables[0] ? '' : tables[0]) : [];

  return (
    <div style={s.joinCard}>
      <div style={s.joinHeader}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
          Join {index + 1}
        </span>
        <button style={s.removeJoinBtn} onClick={onRemove} title="Remove join">×</button>
      </div>

      <div style={s.joinTypeRow}>
        <div>
          <label style={s.label}>Type</label>
          <select
            style={s.select}
            value={join.type}
            onChange={(e) => onUpdate({ ...join, type: e.target.value })}
          >
            {JOIN_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={s.label}>Join Table</label>
          <select
            style={s.select}
            value={join.table}
            onChange={(e) => onUpdate({ ...join, table: e.target.value, on: { left: '', right: '' } })}
          >
            <option value="">Select table…</option>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
        {join.type ? JOIN_TYPE_LABELS[join.type] : ''}
      </div>

      <div style={s.joinGrid}>
        <div>
          <label style={s.label}>Left column (base / previous)</label>
          <input
            style={s.input}
            value={join.on.left}
            onChange={(e) => onUpdate({ ...join, on: { ...join.on, left: e.target.value } })}
            placeholder="e.g. orders.customer_id"
          />
        </div>
        <div>
          <label style={s.label}>Right column ({join.table || 'joined table'})</label>
          {rightCols.length > 0 ? (
            <select
              style={s.select}
              value={join.on.right}
              onChange={(e) => onUpdate({ ...join, on: { ...join.on, right: e.target.value } })}
            >
              <option value="">Select column…</option>
              {rightCols.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input
              style={s.input}
              value={join.on.right}
              onChange={(e) => onUpdate({ ...join, on: { ...join.on, right: e.target.value } })}
              placeholder="e.g. id"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const DataSourceForm = ({ initial, realTables, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || BLANK_DS);

  const baseCols = form.baseTable ? getCachedColumns(form.baseTable) : [];

  const updateJoin = (i, updated) => {
    const joins = [...form.joins];
    joins[i] = updated;
    setForm({ ...form, joins });
  };

  const removeJoin = (i) => {
    setForm({ ...form, joins: form.joins.filter((_, idx) => idx !== i) });
  };

  const addJoin = () => {
    setForm({ ...form, joins: [...form.joins, { ...BLANK_JOIN, id: uuidv4() }] });
  };

  const canSave = form.name.trim() && form.baseTable;

  return (
    <div style={s.form}>
      <div style={s.fieldGroup}>
        <label style={s.label}>Name *</label>
        <input
          style={s.input}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Orders with Customers"
        />
      </div>

      <div style={s.fieldGroup}>
        <label style={s.label}>Base Table *</label>
        <select
          style={s.select}
          value={form.baseTable}
          onChange={(e) => setForm({ ...form, baseTable: e.target.value, joins: [] })}
        >
          <option value="">Select table…</option>
          {realTables.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {form.baseTable && (
        <>
          <div style={{ ...s.sectionTitle, marginTop: '14px' }}>Joins</div>

          {form.joins.map((join, i) => (
            <JoinEditor
              key={join.id || i}
              join={join}
              index={i}
              tables={realTables.filter((t) => t !== form.baseTable)}
              onUpdate={(updated) => updateJoin(i, updated)}
              onRemove={() => removeJoin(i)}
            />
          ))}

          <button style={s.addBtn} onClick={addJoin}>＋ Add Join</button>
        </>
      )}

      <div style={s.formActions}>
        <button style={s.secondaryBtn} onClick={onCancel}>Cancel</button>
        <button style={s.primaryBtn} onClick={() => onSave(form)} disabled={!canSave}>
          Save Data Source
        </button>
      </div>
    </div>
  );
};

const DataSourcePanel = ({ isOpen, onClose, dataSources = [], onDataSourcesChange }) => {
  const [localSources, setLocalSources] = useState(dataSources);
  const [editingId, setEditingId] = useState(null); // null = list view, 'new' = new form, uuid = editing
  const realTables = getCachedTables().filter((t) => !localSources.some((ds) => ds.name === t));

  useEffect(() => {
    if (isOpen) setLocalSources(dataSources);
  }, [isOpen, dataSources]);

  if (!isOpen) return null;

  const handleSave = (form) => {
    let updated;
    if (editingId === 'new') {
      updated = [...localSources, { ...form, id: uuidv4() }];
    } else {
      updated = localSources.map((ds) => ds.id === editingId ? { ...form, id: editingId } : ds);
    }
    setLocalSources(updated);
    onDataSourcesChange(updated);
    setEditingId(null);
  };

  const handleDelete = (id) => {
    const updated = localSources.filter((ds) => ds.id !== id);
    setLocalSources(updated);
    onDataSourcesChange(updated);
  };

  const editingSource = editingId && editingId !== 'new'
    ? localSources.find((ds) => ds.id === editingId)
    : null;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={(e) => e.stopPropagation()}>

        <div style={s.header}>
          <h2 style={s.headerTitle}>🔗 Data Sources</h2>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={s.body}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', marginTop: 0 }}>
            Named data sources combine multiple tables via joins. They appear in the table picker
            alongside regular tables and work identically with all chart types.
          </p>

          <div style={s.section}>
            <div style={s.sectionTitle}>
              Defined Data Sources ({localSources.length})
            </div>

            {localSources.length === 0 && editingId !== 'new' && (
              <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                No data sources yet. Click "Add Data Source" to create one.
              </p>
            )}

            {localSources.map((ds) => (
              editingId === ds.id ? (
                <DataSourceForm
                  key={ds.id}
                  initial={ds}
                  realTables={getCachedTables().filter((t) => !localSources.some((x) => x.name === t && x.id !== ds.id))}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={ds.id} style={s.row}>
                  <div>
                    <div style={s.rowName}>{ds.name}</div>
                    <div style={s.rowMeta}>
                      {ds.baseTable}
                      {ds.joins?.length > 0 && (
                        <> + {ds.joins.map((j) => `${j.type} JOIN ${j.table}`).join(', ')}</>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={s.actionBtn('edit')} onClick={() => setEditingId(ds.id)}>Edit</button>
                    <button style={s.actionBtn('delete')} onClick={() => handleDelete(ds.id)}>Delete</button>
                  </div>
                </div>
              )
            ))}

            {editingId === 'new' ? (
              <DataSourceForm
                initial={BLANK_DS}
                realTables={getCachedTables().filter((t) => !localSources.some((ds) => ds.name === t))}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <button style={{ ...s.addBtn, marginTop: '8px' }} onClick={() => setEditingId('new')}>
                ＋ Add Data Source
              </button>
            )}
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.secondaryBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DataSourcePanel;
