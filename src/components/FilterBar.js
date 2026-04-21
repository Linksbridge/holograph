/**
 * FilterBar Component
 *
 * Provides Power BI-style filtering with two modes:
 * - Basic: include/exclude with a searchable checkbox list
 * - Advanced: up to two operator-based conditions with AND/OR logic
 *
 * Operators mirror PBI:
 *   Text  — is, is not, contains, does not contain, starts with, ends with, is blank, is not blank
 *   Number — is equal to, is not equal to, gt, gte, lt, lte, is blank, is not blank
 */

import React, { useState, useEffect } from 'react';
import { useFilters } from '../hooks/useFilters';
import {
  getCachedTables,
  getCachedColumns,
  getUniqueValuesForTableColumn,
  initializeDataService,
} from '../services/dataService';

// ── Operator definitions ──────────────────────────────────────────────────────

const TEXT_OPERATORS = [
  { value: 'is',             label: 'is' },
  { value: 'isNot',          label: 'is not' },
  { value: 'contains',       label: 'contains' },
  { value: 'doesNotContain', label: 'does not contain' },
  { value: 'startsWith',     label: 'starts with' },
  { value: 'endsWith',       label: 'ends with' },
  { value: 'isBlank',        label: 'is blank' },
  { value: 'isNotBlank',     label: 'is not blank' },
];

const NUMBER_OPERATORS = [
  { value: 'eq',         label: 'is equal to' },
  { value: 'neq',        label: 'is not equal to' },
  { value: 'gt',         label: 'is greater than' },
  { value: 'gte',        label: 'is greater than or equal to' },
  { value: 'lt',         label: 'is less than' },
  { value: 'lte',        label: 'is less than or equal to' },
  { value: 'isBlank',    label: 'is blank' },
  { value: 'isNotBlank', label: 'is not blank' },
];

const isNoValueOp = (op) => op === 'isBlank' || op === 'isNotBlank';

// ── Helpers ───────────────────────────────────────────────────────────────────

const detectColumnType = (values) => {
  if (!values || values.length === 0) return 'text';
  const numCount = values.filter((v) => typeof v === 'number').length;
  return numCount > values.length * 0.7 ? 'number' : 'text';
};

const getOpLabel = (op) => {
  const found = [...TEXT_OPERATORS, ...NUMBER_OPERATORS].find((o) => o.value === op);
  return found ? found.label : op;
};

const getFilterSummary = (column, filterDef) => {
  if (Array.isArray(filterDef)) {
    const preview = filterDef.slice(0, 3).join(', ') + (filterDef.length > 3 ? ` +${filterDef.length - 3}` : '');
    return `${column}: ${preview}`;
  }
  if (!filterDef || typeof filterDef !== 'object') return column;

  const { mode, filterType, values, logicalOperator, conditions } = filterDef;

  if (mode === 'basic') {
    if (!values?.length) return column;
    const sym = filterType === 'exclude' ? ' \u2260' : ':';
    const preview = values.slice(0, 2).join(', ') + (values.length > 2 ? ` +${values.length - 2}` : '');
    return `${column}${sym} ${preview}`;
  }

  if (mode === 'advanced') {
    const active = (conditions || []).filter(
      (c) => isNoValueOp(c.operator) || (c.value !== '' && c.value !== null && c.value !== undefined)
    );
    if (!active.length) return column;
    const parts = active.map((c) =>
      isNoValueOp(c.operator) ? getOpLabel(c.operator) : `${getOpLabel(c.operator)} ${c.value}`
    );
    return `${column}: ${parts.join(` ${logicalOperator} `)}`;
  }

  return column;
};

const createEmptyFilter = () => ({
  id: `filter-${Date.now()}`,
  tableName: '',
  columnName: '',
  mode: 'basic',
  filterType: 'include',
  values: [],
  valueSearch: '',
  logicalOperator: 'and',
  conditions: [
    { operator: 'is', value: '' },
    { operator: 'is', value: '' },
  ],
});

// ── Component ─────────────────────────────────────────────────────────────────

const FilterBar = ({ visible = true }) => {
  const { filters, setFilter, clearFilter, clearAllFilters, hasActiveFilters } = useFilters();

  const [isInitialized, setIsInitialized]   = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [pendingFilters, setPendingFilters]   = useState([]);
  const [activePendingIndex, setActivePendingIndex] = useState(0);

  useEffect(() => {
    const init = async () => {
      await initializeDataService();
      setAvailableTables(getCachedTables());
      setIsInitialized(true);
    };
    init();
  }, []);

  const activePendingFilter = pendingFilters[activePendingIndex] || null;

  const [availableColumns, setAvailableColumns] = useState([]);
  useEffect(() => {
    if (!activePendingFilter?.tableName) { setAvailableColumns([]); return; }
    setAvailableColumns(getCachedColumns(activePendingFilter.tableName));
  }, [activePendingFilter?.tableName]);

  const [availableValues, setAvailableValues] = useState([]);
  useEffect(() => {
    if (!activePendingFilter?.tableName || !activePendingFilter?.columnName) {
      setAvailableValues([]);
      return;
    }
    setAvailableValues(getUniqueValuesForTableColumn(activePendingFilter.tableName, activePendingFilter.columnName));
  }, [activePendingFilter?.tableName, activePendingFilter?.columnName]);

  const columnType = detectColumnType(availableValues);
  const operators  = columnType === 'number' ? NUMBER_OPERATORS : TEXT_OPERATORS;
  const defaultOp  = columnType === 'number' ? 'eq' : 'is';

  // ── Pending filter mutation helpers ──────────────────────────────────────

  const updatePendingFilter = (props) => {
    const updated = [...pendingFilters];
    updated[activePendingIndex] = { ...updated[activePendingIndex], ...props };

    if (props.tableName !== undefined) {
      updated[activePendingIndex].columnName  = '';
      updated[activePendingIndex].values      = [];
      updated[activePendingIndex].valueSearch = '';
    }
    if (props.columnName !== undefined) {
      updated[activePendingIndex].values      = [];
      updated[activePendingIndex].valueSearch = '';
      updated[activePendingIndex].conditions  = [
        { operator: defaultOp, value: '' },
        { operator: defaultOp, value: '' },
      ];
    }
    setPendingFilters(updated);
  };

  const updateCondition = (condIdx, props) => {
    const updated     = [...pendingFilters];
    const conditions  = [...(updated[activePendingIndex].conditions || [])];
    conditions[condIdx] = { ...conditions[condIdx], ...props };
    if (props.operator && isNoValueOp(props.operator)) {
      conditions[condIdx].value = '';
    }
    updated[activePendingIndex] = { ...updated[activePendingIndex], conditions };
    setPendingFilters(updated);
  };

  const handleValueToggle = (value) => {
    const current = activePendingFilter.values || [];
    const newVals = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updatePendingFilter({ values: newVals });
  };

  const filteredValues = activePendingFilter?.valueSearch
    ? availableValues.filter((v) =>
        String(v).toLowerCase().includes(activePendingFilter.valueSearch.toLowerCase())
      )
    : availableValues;

  const handleSelectAll   = () => updatePendingFilter({ values: availableValues });
  const handleClearValues = () => updatePendingFilter({ values: [] });

  // ── Apply / remove logic ─────────────────────────────────────────────────

  const canApply = () => {
    if (!activePendingFilter?.columnName) return false;
    if (activePendingFilter.mode === 'basic') return activePendingFilter.values?.length > 0;
    return (activePendingFilter.conditions || []).some(
      (c) => isNoValueOp(c.operator) || (c.value !== '' && c.value !== null)
    );
  };

  const handleApplyFilter = () => {
    if (!canApply()) return;
    const f = activePendingFilter;

    if (f.mode === 'basic') {
      setFilter(f.columnName, { mode: 'basic', filterType: f.filterType, values: f.values });
    } else {
      setFilter(f.columnName, {
        mode: 'advanced',
        logicalOperator: f.logicalOperator,
        conditions: f.conditions.map((c) => ({ ...c })),
      });
    }

    const updated = pendingFilters.filter((_, idx) => idx !== activePendingIndex);
    setPendingFilters(updated);
    setActivePendingIndex(Math.max(0, Math.min(activePendingIndex, updated.length - 1)));
  };

  const handleAddFilter = () => {
    const newFilter = createEmptyFilter();
    setPendingFilters([...pendingFilters, newFilter]);
    setActivePendingIndex(pendingFilters.length);
  };

  const handleRemovePendingFilter = (index) => {
    const updated = pendingFilters.filter((_, idx) => idx !== index);
    setPendingFilters(updated);
    setActivePendingIndex(Math.max(0, Math.min(activePendingIndex, updated.length - 1)));
  };

  const handleClearAll = () => {
    setPendingFilters([]);
    setActivePendingIndex(0);
    clearAllFilters();
  };

  if (!visible || !isInitialized) return null;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <span className="filter-bar-title">Filters</span>
        <div className="filter-bar-header-actions">
          {hasActiveFilters() && (
            <button className="filter-bar-clear-all" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar-content">

        {/* ── Pending filter tabs ─────────────────────────────────────────── */}
        {pendingFilters.length > 0 && (
          <div className="filter-bar-section">
            <div className="filter-bar-pending-tabs">
              {pendingFilters.map((filter, index) => (
                <div
                  key={filter.id}
                  className={`filter-bar-pending-tab ${index === activePendingIndex ? 'active' : ''}`}
                  onClick={() => setActivePendingIndex(index)}
                >
                  <span>Filter {index + 1}</span>
                  <button
                    className="filter-bar-pending-tab-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemovePendingFilter(index); }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="filter-bar-add-btn" onClick={handleAddFilter} title="Add another filter">
                +
              </button>
            </div>

            {/* ── Active pending filter config ──────────────────────────── */}
            {activePendingFilter && (
              <div className="filter-bar-pending-config">

                {/* Table */}
                <div className="filter-bar-row">
                  <label className="filter-bar-label">Table:</label>
                  <select
                    className="filter-bar-select"
                    value={activePendingFilter.tableName}
                    onChange={(e) => updatePendingFilter({ tableName: e.target.value })}
                  >
                    <option value="">Select a table...</option>
                    {availableTables.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Column */}
                {activePendingFilter.tableName && availableColumns.length > 0 && (
                  <div className="filter-bar-row">
                    <label className="filter-bar-label">Column:</label>
                    <select
                      className="filter-bar-select"
                      value={activePendingFilter.columnName}
                      onChange={(e) => updatePendingFilter({ columnName: e.target.value })}
                    >
                      <option value="">Select a column...</option>
                      {availableColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {/* Mode tabs + filter body */}
                {activePendingFilter.columnName && (
                  <>
                    <div className="filter-bar-mode-tabs">
                      <button
                        className={`filter-bar-mode-tab ${activePendingFilter.mode === 'basic' ? 'active' : ''}`}
                        onClick={() => updatePendingFilter({ mode: 'basic' })}
                      >
                        Basic
                      </button>
                      <button
                        className={`filter-bar-mode-tab ${activePendingFilter.mode === 'advanced' ? 'active' : ''}`}
                        onClick={() => updatePendingFilter({ mode: 'advanced' })}
                      >
                        Advanced
                      </button>
                    </div>

                    {/* ── BASIC MODE ─────────────────────────────────────── */}
                    {activePendingFilter.mode === 'basic' && (
                      <div className="filter-bar-basic-mode">
                        {/* Include / Exclude toggle */}
                        <div className="filter-bar-filter-type">
                          <button
                            className={`filter-bar-filter-type-btn ${activePendingFilter.filterType === 'include' ? 'active' : ''}`}
                            onClick={() => updatePendingFilter({ filterType: 'include' })}
                          >
                            Include
                          </button>
                          <button
                            className={`filter-bar-filter-type-btn ${activePendingFilter.filterType === 'exclude' ? 'active' : ''}`}
                            onClick={() => updatePendingFilter({ filterType: 'exclude' })}
                          >
                            Exclude
                          </button>
                        </div>

                        {/* Search */}
                        <input
                          type="text"
                          className="filter-bar-search-input"
                          placeholder="Search values..."
                          value={activePendingFilter.valueSearch || ''}
                          onChange={(e) => updatePendingFilter({ valueSearch: e.target.value })}
                        />

                        {/* Select All row */}
                        <div className="filter-bar-select-all-row">
                          <label className="filter-bar-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                availableValues.length > 0 &&
                                activePendingFilter.values.length === availableValues.length
                              }
                              onChange={(e) => (e.target.checked ? handleSelectAll() : handleClearValues())}
                            />
                            <span>(Select all)</span>
                          </label>
                        </div>

                        {/* Values list */}
                        <div className="filter-bar-values-list">
                          {filteredValues.length === 0 ? (
                            <span className="filter-bar-empty">No values available</span>
                          ) : (
                            filteredValues.map((value) => (
                              <label key={value} className="filter-bar-checkbox">
                                <input
                                  type="checkbox"
                                  checked={activePendingFilter.values.includes(value)}
                                  onChange={() => handleValueToggle(value)}
                                />
                                <span>{String(value)}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── ADVANCED MODE ──────────────────────────────────── */}
                    {activePendingFilter.mode === 'advanced' && (
                      <div className="filter-bar-advanced-mode">
                        {/* Condition 1 */}
                        <div className="filter-bar-condition-row">
                          <select
                            className="filter-bar-condition-op"
                            value={activePendingFilter.conditions[0]?.operator || defaultOp}
                            onChange={(e) => updateCondition(0, { operator: e.target.value })}
                          >
                            {operators.map((op) => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>
                          {!isNoValueOp(activePendingFilter.conditions[0]?.operator) && (
                            <input
                              type={columnType === 'number' ? 'number' : 'text'}
                              className="filter-bar-condition-value"
                              placeholder="Value..."
                              value={activePendingFilter.conditions[0]?.value || ''}
                              onChange={(e) => updateCondition(0, { value: e.target.value })}
                            />
                          )}
                        </div>

                        {/* AND / OR toggle */}
                        <div className="filter-bar-logic-toggle">
                          <button
                            className={`filter-bar-logic-btn ${activePendingFilter.logicalOperator === 'and' ? 'active' : ''}`}
                            onClick={() => updatePendingFilter({ logicalOperator: 'and' })}
                          >
                            And
                          </button>
                          <button
                            className={`filter-bar-logic-btn ${activePendingFilter.logicalOperator === 'or' ? 'active' : ''}`}
                            onClick={() => updatePendingFilter({ logicalOperator: 'or' })}
                          >
                            Or
                          </button>
                        </div>

                        {/* Condition 2 */}
                        <div className="filter-bar-condition-row">
                          <select
                            className="filter-bar-condition-op"
                            value={activePendingFilter.conditions[1]?.operator || defaultOp}
                            onChange={(e) => updateCondition(1, { operator: e.target.value })}
                          >
                            {operators.map((op) => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>
                          {!isNoValueOp(activePendingFilter.conditions[1]?.operator) && (
                            <input
                              type={columnType === 'number' ? 'number' : 'text'}
                              className="filter-bar-condition-value"
                              placeholder="Value..."
                              value={activePendingFilter.conditions[1]?.value || ''}
                              onChange={(e) => updateCondition(1, { value: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Apply button */}
                    {canApply() && (
                      <div className="filter-bar-row" style={{ marginTop: '12px' }}>
                        <button
                          className="filter-bar-btn filter-bar-btn-primary"
                          onClick={handleApplyFilter}
                        >
                          Apply Filter
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {pendingFilters.length === 0 && !hasActiveFilters() && (
          <div className="filter-bar-empty-state">
            <p>No filters configured</p>
            <button className="filter-bar-add-filter-btn" onClick={handleAddFilter}>
              + Add Filter
            </button>
          </div>
        )}

        {pendingFilters.length === 0 && hasActiveFilters() && (
          <div className="filter-bar-section">
            <button className="filter-bar-add-filter-btn" onClick={handleAddFilter}>
              + Add Filter
            </button>
          </div>
        )}

        {/* ── Active filter tags ───────────────────────────────────────────── */}
        {hasActiveFilters() && (
          <div className="filter-bar-active">
            <span className="filter-bar-label">Active Filters:</span>
            <div className="filter-bar-tags">
              {Object.entries(filters).map(([column, filterDef]) => (
                <span key={column} className="filter-bar-tag">
                  <span className="filter-bar-tag-content" title={getFilterSummary(column, filterDef)}>
                    {getFilterSummary(column, filterDef)}
                  </span>
                  <button
                    className="filter-bar-tag-remove"
                    onClick={() => clearFilter(column)}
                    title="Remove filter"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FilterBar;
