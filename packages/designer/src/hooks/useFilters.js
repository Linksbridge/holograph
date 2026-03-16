/**
 * Filter Context
 * 
 * Provides a way to manage dashboard filters that can be passed from
 * consuming systems (similar to PowerBI embedding). Filters are applied
 * to chart data at the data service level.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const FilterContext = createContext(null);

/**
 * Filter Provider Component
 * Wraps the application to provide filter state and management
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.externalFilters - Optional filters passed from parent React component
 */
export const FilterProvider = ({ children, externalFilters }) => {
  const [filters, setFilters] = useState({});
  const [filterConfig, setFilterConfig] = useState({});

  // Sync external filters from parent component
  useEffect(() => {
    if (externalFilters && typeof externalFilters === 'object') {
      setFilters(externalFilters);
    }
  }, [externalFilters]);

  /**
   * Set filter values for specific columns
   * @param {Object} newFilters - Object with column names as keys and arrays of values to filter on
   * Example: { region: ['North', 'South'], quarter: ['Q1', 'Q2'] }
   */
  const setFilterValues = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Set a single filter value
   * @param {string} column - Column name to filter on
   * @param {Array} values - Array of values to include in filter
   */
  const setFilter = useCallback((column, values) => {
    setFilters((prev) => ({
      ...prev,
      [column]: values,
    }));
  }, []);

  /**
   * Clear a specific filter
   * @param {string} column - Column name to clear filter for
   */
  const clearFilter = useCallback((column) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  }, []);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Configure which columns can be filtered per zone/chart
   * @param {Object} config - Object with zone IDs as keys and array of filterable columns as values
   * Example: { 'zone-1': ['region', 'quarter'], 'zone-2': ['month'] }
   */
  const configureFilters = useCallback((config) => {
    setFilterConfig(config);
  }, []);

  /**
   * Get filters for a specific zone
   * @param {string} zoneId - Zone ID to get filters for
   * @returns {Object} Filter object for the zone
   */
  const getFiltersForZone = useCallback((zoneId) => {
    const allowedColumns = filterConfig[zoneId] || [];
    const zoneFilters = {};
    
    Object.keys(filters).forEach((column) => {
      if (allowedColumns.length === 0 || allowedColumns.includes(column)) {
        zoneFilters[column] = filters[column];
      }
    });
    
    return zoneFilters;
  }, [filters, filterConfig]);

  /**
   * Check if any filters are currently active
   * @returns {boolean} True if there are active filters
   */
  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  /**
   * Get all active filters
   * @returns {Object} Current filters object
   */
  const getActiveFilters = useCallback(() => {
    return { ...filters };
  }, [filters]);

  const value = {
    filters,
    filterConfig,
    setFilterValues,
    setFilter,
    clearFilter,
    clearAllFilters,
    configureFilters,
    getFiltersForZone,
    hasActiveFilters,
    getActiveFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

/**
 * Custom hook to use filter context
 * @returns {Object} Filter context value
 */
export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

/**
 * Initialize the global filter API for external/consuming systems
 * This allows embedding systems to pass filters via window.Holograph.setFilters()
 */
export const initializeGlobalFilterAPI = (filterFunctions) => {
  if (typeof window !== 'undefined') {
    window.Holograph = window.Holograph || {};
    window.Holograph.setFilters = filterFunctions.setFilterValues;
    window.Holograph.setFilter = filterFunctions.setFilter;
    window.Holograph.clearFilter = filterFunctions.clearFilter;
    window.Holograph.clearAllFilters = filterFunctions.clearAllFilters;
    window.Holograph.getFilters = filterFunctions.getActiveFilters;
    window.Holograph.hasFilters = filterFunctions.hasActiveFilters;
    
    console.log('Holograph Filter API initialized. Use window.Holograph.setFilters() to apply filters.');
  }
};

export default useFilters;
