/**
 * FilterBar Component
 * 
 * A component that provides a UI for manually configuring and applying
 * multiple filters to the dashboard. This allows users to interactively filter
 * data across all charts using multiple independent filter criteria.
 * 
 * Flow: Add Filter -> Select Table -> Select Column -> Select Values -> Repeat
 */

import React, { useState, useEffect } from 'react';
import { useFilters } from '../hooks/useFilters';
import { 
  getCachedTables, 
  getCachedColumns, 
  getUniqueValuesForColumn,
  initializeDataService 
} from '../services/dataService';

/**
 * Individual filter definition
 * @typedef {Object} FilterDefinition
 * @property {string} id - Unique identifier for this filter
 * @property {string} tableName - Selected table
 * @property {string} columnName - Selected column
 * @property {Array} values - Selected filter values
 */

const FilterBar = ({ visible = true, settings }) => {
  const { 
    filters, 
    setFilter, 
    clearFilter, 
    clearAllFilters,
    hasActiveFilters 
  } = useFilters();

  const [isInitialized, setIsInitialized] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  
  // Pending filters being configured (not yet applied)
  const [pendingFilters, setPendingFilters] = useState([]);
  // Track which pending filter is currently being edited
  const [activePendingIndex, setActivePendingIndex] = useState(0);

  // Initialize data service on mount
  useEffect(() => {
    const init = async () => {
      await initializeDataService(
        settings?.dataSource?.connectionString,
        settings?.dataSource?.schemaUrl,
        settings?.dataSource?.databaseName
      );
      setAvailableTables(getCachedTables());
      setIsInitialized(true);
    };
    init();
  }, []);

  // Get the currently active pending filter
  const activePendingFilter = pendingFilters[activePendingIndex] || null;

  // Get columns for the active pending filter's table
  const [availableColumns, setAvailableColumns] = useState([]);
  useEffect(() => {
    if (!activePendingFilter?.tableName) {
      setAvailableColumns([]);
      return;
    }

    const columns = getCachedColumns(activePendingFilter.tableName);
    setAvailableColumns(columns);
  }, [activePendingFilter?.tableName]);

  // Get available values for the active pending filter's column
  const [availableValues, setAvailableValues] = useState([]);
  useEffect(() => {
    if (!activePendingFilter?.columnName) {
      setAvailableValues([]);
      return;
    }

    const values = getUniqueValuesForColumn(activePendingFilter.columnName);
    setAvailableValues(values);
  }, [activePendingFilter?.columnName]);

  // Add a new empty filter definition
  const handleAddFilter = () => {
    const newFilter = {
      id: `filter-${Date.now()}`,
      tableName: '',
      columnName: '',
      values: [],
    };
    setPendingFilters([...pendingFilters, newFilter]);
    setActivePendingIndex(pendingFilters.length);
  };

  // Update a pending filter's property
  const updatePendingFilter = (property, value) => {
    const updated = [...pendingFilters];
    updated[activePendingIndex] = {
      ...updated[activePendingIndex],
      [property]: value,
    };
    
    // Reset column and values when table changes
    if (property === 'tableName') {
      updated[activePendingIndex].columnName = '';
      updated[activePendingIndex].values = [];
    }
    
    // Reset values when column changes
    if (property === 'columnName') {
      updated[activePendingIndex].values = [];
    }
    
    setPendingFilters(updated);
  };

  // Toggle a value in the pending filter
  const handleValueToggle = (value) => {
    const currentValues = activePendingFilter.values || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    
    updatePendingFilter('values', newValues);
  };

  // Apply the pending filter to the actual filters
  const handleApplyFilter = () => {
    if (!activePendingFilter?.columnName || !activePendingFilter?.values?.length) {
      return;
    }

    setFilter(activePendingFilter.columnName, activePendingFilter.values);
    
    // Clear this pending filter after applying
    const updated = pendingFilters.filter((_, idx) => idx !== activePendingIndex);
    setPendingFilters(updated);
    setActivePendingIndex(Math.min(activePendingIndex, updated.length - 1));
  };

  // Remove a pending filter without applying
  const handleRemovePendingFilter = (index) => {
    const updated = pendingFilters.filter((_, idx) => idx !== index);
    setPendingFilters(updated);
    setActivePendingIndex(Math.min(activePendingIndex, updated.length - 1));
  };

  // Handle table selection change for active pending filter
  const handleTableChange = (e) => {
    updatePendingFilter('tableName', e.target.value);
  };

  // Handle column selection change for active pending filter
  const handleColumnChange = (e) => {
    updatePendingFilter('columnName', e.target.value);
  };

  // Handle select all values
  const handleSelectAll = () => {
    updatePendingFilter('values', availableValues);
  };

  // Handle clear values
  const handleClearValues = () => {
    updatePendingFilter('values', []);
  };

  // Handle clearing an applied filter
  const handleClearAppliedFilter = (column) => {
    clearFilter(column);
  };

  // Handle clearing all filters (both pending and applied)
  const handleClearAll = () => {
    setPendingFilters([]);
    setActivePendingIndex(0);
    clearAllFilters();
  };

  if (!visible || !isInitialized) {
    return null;
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <span className="filter-bar-title">Filters</span>
        <div className="filter-bar-header-actions">
          {hasActiveFilters() && (
            <button 
              className="filter-bar-clear-all"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      <div className="filter-bar-content">
        {/* Pending Filters Section */}
        {(pendingFilters.length > 0 || hasActiveFilters()) && (
          <div className="filter-bar-section">
            <div className="filter-bar-section-title">Configure Filters</div>
            
            {/* Pending filter tabs */}
            {pendingFilters.length > 0 && (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePendingFilter(index);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  className="filter-bar-add-btn"
                  onClick={handleAddFilter}
                  title="Add another filter"
                >
                  +
                </button>
              </div>
            )}

            {/* Active pending filter configuration */}
            {activePendingFilter && (
              <div className="filter-bar-pending-config">
                {/* Table Selection */}
                <div className="filter-bar-row">
                  <label className="filter-bar-label">Table:</label>
                  <select 
                    className="filter-bar-select"
                    value={activePendingFilter.tableName}
                    onChange={handleTableChange}
                  >
                    <option value="">Select a table...</option>
                    {availableTables.map((table) => (
                      <option key={table} value={table}>{table}</option>
                    ))}
                  </select>
                </div>
                
                {/* Column Selection */}
                {activePendingFilter.tableName && availableColumns.length > 0 && (
                  <div className="filter-bar-row">
                    <label className="filter-bar-label">Column:</label>
                    <select 
                      className="filter-bar-select"
                      value={activePendingFilter.columnName}
                      onChange={handleColumnChange}
                    >
                      <option value="">Select a column...</option>
                      {availableColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Values Selection */}
                {activePendingFilter.columnName && (
                  <>
                    <div className="filter-bar-row filter-bar-actions">
                      <button 
                        className="filter-bar-btn"
                        onClick={handleSelectAll}
                      >
                        Select All
                      </button>
                      <button 
                        className="filter-bar-btn filter-bar-btn-secondary"
                        onClick={handleClearValues}
                      >
                        Clear
                      </button>
                    </div>
                    
                    <div className="filter-bar-values">
                      <label className="filter-bar-label">Values:</label>
                      <div className="filter-bar-values-list">
                        {availableValues.length === 0 ? (
                          <span className="filter-bar-empty">No values available</span>
                        ) : (
                          availableValues.map((value) => (
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
                  </>
                )}

                {/* Apply Button */}
                {activePendingFilter.columnName && activePendingFilter.values?.length > 0 && (
                  <div className="filter-bar-row">
                    <button 
                      className="filter-bar-btn filter-bar-btn-primary"
                      onClick={handleApplyFilter}
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add Filter button (shown when no pending filters) */}
            {pendingFilters.length === 0 && (
              <button 
                className="filter-bar-add-filter-btn"
                onClick={handleAddFilter}
              >
                + Add Filter
              </button>
            )}
          </div>
        )}

        {/* Show "Add Filter" button at bottom if no filters at all */}
        {pendingFilters.length === 0 && !hasActiveFilters() && (
          <div className="filter-bar-empty-state">
            <p>No filters configured</p>
            <button 
              className="filter-bar-add-filter-btn"
              onClick={handleAddFilter}
            >
              + Add Filter
            </button>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="filter-bar-active">
            <span className="filter-bar-label">Active Filters:</span>
            <div className="filter-bar-tags">
              {Object.entries(filters).map(([column, values]) => (
                <span key={column} className="filter-bar-tag">
                  <span className="filter-bar-tag-content">
                    <strong>{column}:</strong> {values.join(', ')}
                  </span>
                  <button
                    className="filter-bar-tag-remove"
                    onClick={() => handleClearAppliedFilter(column)}
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
