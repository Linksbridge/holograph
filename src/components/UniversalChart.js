/**
 * UniversalChart Component
 * 
 * A dispatcher component that dynamically loads the appropriate
 * Renderer Adapter based on the library string in the configuration.
 * Uses ResizeObserver to detect container size for responsive rendering.
 */

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import D3Adapter from '../adapters/D3Adapter';
import ChartJsAdapter from '../adapters/ChartJsAdapter';
import { fetchChartData } from '../services/dataService';
import { CHART_LIBRARIES } from '../types/schema';

const UniversalChart = ({ config, width, height }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
  const containerRef = useRef(null);

  const { library, theme, title, dataSource } = config;

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
        // Use smaller minimums to allow legends to show
        const chartWidth = Math.max(150, containerWidth - 16);
        const chartHeight = Math.max(120, containerHeight - 16);
        setDimensions({ width: chartWidth, height: chartHeight });
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
        const data = await fetchChartData(
          dataSource.tableName,
          dataSource.labelColumn,
          dataSource.valueColumn
        );

        if (isMounted) {
          setChartData(data);
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
  }, [dataSource?.tableName, dataSource?.labelColumn, dataSource?.valueColumn]);

  // Memoize the adapter selection based on library type
  const ChartAdapter = useCallback(() => {
    switch (library) {
      case CHART_LIBRARIES.D3:
        return D3Adapter;
      case CHART_LIBRARIES.CHARTJS:
        return ChartJsAdapter;
      default:
        console.warn(`Unknown library: ${library}, defaulting to ChartJsAdapter`);
        return ChartJsAdapter;
    }
  }, [library]);

  const Adapter = ChartAdapter();

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
              borderTopColor: '#3b82f6',
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
  if (!chartData || chartData.length === 0) {
    return (
      <div ref={containerRef} style={{ ...containerBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>📊</div>
          <div style={{ fontSize: '12px' }}>No data</div>
        </div>
      </div>
    );
  }

  // Render the appropriate adapter with actual dimensions
  return (
    <div ref={containerRef} style={containerBaseStyle}>
      <Adapter
        data={chartData}
        theme={theme}
        width={dimensions.width}
        height={dimensions.height}
        title={title}
      />
    </div>
  );
};

export default UniversalChart;
