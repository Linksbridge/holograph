/**
 * TableComponent Component
 * 
 * A table component that displays data from a data source.
 * Supports responsive design with scrollable body when there are many rows.
 * Includes border, hover effects, and matches dashboard design.
 */

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { fetchChartData, fetchTableData } from '../services/dataService';
import { THEMES } from '../types/schema';

const TableComponent = ({ config, width, height }) => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const containerRef = useRef(null);

  const { title, dataSource, theme } = config;

  // Get theme colors
  const themeColors = THEMES[theme] || THEMES.default;

  // Get columns from dataSource config
  const tableColumns = dataSource?.columns || [];

  // Get initial dimensions synchronously
  const getInitialDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          width: Math.max(150, rect.width - 16),
          height: Math.max(120, rect.height - 16),
        };
      }
    }
    return { width: 300, height: 200 };
  }, []);

  // Use layout effect to get initial dimensions immediately
  useLayoutEffect(() => {
    const initialDims = getInitialDimensions();
    setDimensions(initialDims);
  }, [getInitialDimensions]);

  // Use ResizeObserver to detect container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect;
        const tableWidth = Math.max(150, containerWidth - 16);
        const tableHeight = Math.max(120, containerHeight - 16);
        setDimensions({ width: tableWidth, height: tableHeight });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Fetch data when dataSource changes
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if we have multiple columns configured
        if (dataSource?.columns && Array.isArray(dataSource.columns) && dataSource.columns.length > 0) {
          // Use fetchTableData for multiple columns
          const data = await fetchTableData(
            dataSource.tableName,
            dataSource.columns
          );

          if (isMounted) {
            setTableData(data);
          }
        } else if (dataSource?.tableName && dataSource?.labelColumn && dataSource?.valueColumn) {
          // Fall back to original fetchChartData for backward compatibility
          const data = await fetchChartData(
            dataSource.tableName,
            dataSource.labelColumn,
            dataSource.valueColumn
          );

          if (isMounted) {
            setTableData(data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (dataSource?.tableName) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [dataSource?.tableName, dataSource?.labelColumn, dataSource?.valueColumn, dataSource?.columns]);

  // Common container styles
  const containerBaseStyle = {
    width: '100%',
    height: '100%',
    minHeight: '100px',
    overflow: 'hidden',
  };

  // Loading state
  if (loading) {
    return (
      <div ref={containerRef} style={{ ...containerBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e5e7eb',
              borderTopColor: themeColors.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 8px',
            }}
          />
          <span style={{ fontSize: '12px' }}>Loading...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={containerRef} style={{ ...containerBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>⚠️</div>
          <div style={{ fontSize: '12px' }}>{error}</div>
        </div>
      </div>
    );
  }

  // Empty data state
  if (!tableData || tableData.length === 0) {
    return (
      <div ref={containerRef} style={{ ...containerBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>📋</div>
          <div style={{ fontSize: '12px' }}>No data</div>
        </div>
      </div>
    );
  }

  // Format value for display (handle numbers)
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort the data based on current sort settings
  const getSortedData = () => {
    if (!sortColumn) return tableData;

    return [...tableData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string comparison (case-insensitive)
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  };

  // Get the columns to display in the table
  let displayColumns = ["label", "value"];
  if (tableColumns && Array.isArray(tableColumns) && tableColumns.length > 0) {
    displayColumns = tableColumns;
  }

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Get sorted data
  const sortedData = getSortedData();

  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tableData.length]);

  return (
    <div ref={containerRef} style={containerBaseStyle}>
      <div 
        className="dashboard-table-container"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '4px',
          border: `1px solid ${themeColors.grid}`,
        }}
      >
        <table className="dashboard-table">
          <thead className="dashboard-table-header">
            <tr>
              {displayColumns.map((col) => (
                <th 
                  key={col} 
                  className="dashboard-table-th"
                  onClick={() => handleSort(col)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort"
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{col.charAt(0).toUpperCase() + col.slice(1)}</span>
                    <span style={{ marginLeft: '6px', fontSize: '10px', opacity: sortColumn === col ? 1 : 0.3 }}>
                      {sortColumn === col ? (sortDirection === 'asc' ? '▲' : '▼') : '⬍'}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="dashboard-table-tbody">
            {paginatedData.map((row, index) => (
              <tr 
                key={index} 
                className="dashboard-table-row"
                style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}
              >
                {displayColumns.map((col) => (
                  <td key={col} className="dashboard-table-td">
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="dashboard-table-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px', borderTop: `1px solid ${themeColors.grid}`, backgroundColor: '#f9fafb' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{ margin: '0 2px', padding: '4px 8px', fontSize: '11px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, border: '1px solid #d1d5db', borderRadius: '3px', backgroundColor: '#fff' }}
              title="First page"
            >
              ⏮
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ margin: '0 2px', padding: '4px 8px', fontSize: '11px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, border: '1px solid #d1d5db', borderRadius: '3px', backgroundColor: '#fff' }}
              title="Previous page"
            >
              ◀
            </button>
            <span style={{ margin: '0 8px', fontSize: '11px', color: '#374151' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ margin: '0 2px', padding: '4px 8px', fontSize: '11px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, border: '1px solid #d1d5db', borderRadius: '3px', backgroundColor: '#fff' }}
              title="Next page"
            >
              ▶
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{ margin: '0 2px', padding: '4px 8px', fontSize: '11px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, border: '1px solid #d1d5db', borderRadius: '3px', backgroundColor: '#fff' }}
              title="Last page"
            >
              ⏭
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableComponent;
