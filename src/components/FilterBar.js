/**
 * FilterBar Component
 * 
 * A component that provides a UI for manually configuring and applying
 * filters to the dashboard. This allows users to interactively filter
 * data across all charts.
 */

import React, { useState, useEffect } from 'react';
import { useFilters } from '../hooks/useFilters';
import { getAvailableTables, getTableColumns, MOCK_DATA_TABLES } from '../services/dataService';

const FilterBar = ({ visible = true }) => {
  const { 
    filters, 
    setFilter, 
    clearFilter, 
    clearAllFilters,
    hasActiveFilters 
  } = useFilters();

  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedValues, setSelectedValues] = useState([]);
  const [availableValues, setAvailableValues] = useState([]);

  // Get all unique columns from available tables
  useEffect(() => {
    const tables = getAvailableTables();
    const columns = new Set();
    
    tables.forEach((table) => {
      const tableColumns = getTableColumns(table);
      tableColumns.forEach((col) => columns.add(col));
    });
    
    setAvailableColumns(Array.from(columns).sort());
  }, []);

  // Get available values when column is selected
  useEffect(() => {
    if (!selectedColumn) {
      setAvailableValues([]);
      return;
    }

    // Collect all unique values for the selected column from all tables
    const tables = getAvailableTables();
    const values = new Set();
    
    tables.forEach((table) => {
      const tableColumns = getTableColumns(table);
      if (tableColumns.includes(selectedColumn)) {
        const tableData = MOCK_DATA_TABLES[table];
        if (tableData) {
          tableData.forEach((row) => {
            if (row[selectedColumn] !== undefined) {
              values.add(row[selectedColumn]);
            }
          });
        }
      }
    });
    
    setAvailableValues(Array.from(values).sort());
  }, [selectedColumn]);

  // Update selected values when filters change
  useEffect(() => {
    if (selectedColumn && filters[selectedColumn]) {
      setSelectedValues(filters[selectedColumn]);
    } else {
      setSelectedValues([]);
    }
  }, [filters, selectedColumn]);

  const handleColumnChange = (e) => {
    setSelectedColumn(e.target.value);
    setSelectedValues([]);
  };

  const handleValueToggle = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newValues);
    
    if (newValues.length > 0) {
      setFilter(selectedColumn, newValues);
    } else {
      clearFilter(selectedColumn);
    }
  };

  const handleSelectAll = () => {
    setFilter(selectedColumn, availableValues);
  };

  const handleClearAll = () => {
    setSelectedColumn('');
    setSelectedValues([]);
    clearAllFilters();
  };

  const handleClearColumn = () => {
    clearFilter(selectedColumn);
    setSelectedValues([]);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <span className="filter-bar-title">Filters</span>
        {hasActiveFilters() && (
          <button 
            className="filter-bar-clear-all"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="filter-bar-content">
        <div className="filter-bar-row">
          <label className="filter-bar-label">Column:</label>
          <select 
            className="filter-bar-select"
            value={selectedColumn}
            onChange={handleColumnChange}
          >
            <option value="">Select a column...</option>
            {availableColumns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        
        {selectedColumn && (
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
                onClick={handleClearColumn}
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
                        checked={selectedValues.includes(value)}
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
        
        {hasActiveFilters() && (
          <div className="filter-bar-active">
            <span className="filter-bar-label">Active Filters:</span>
            <div className="filter-bar-tags">
              {Object.entries(filters).map(([column, values]) => (
                <span key={column} className="filter-bar-tag">
                  {column}: {values.join(', ')}
                  <button
                    className="filter-bar-tag-remove"
                    onClick={() => clearFilter(column)}
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
