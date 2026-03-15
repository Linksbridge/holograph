/**
 * RichTextComponent Component
 * 
 * A component that displays rich text content, either from free-form input
 * or from a data source column.
 */

import React, { useState, useEffect } from 'react';
import { fetchChartData } from '../services/dataService';

const RichTextComponent = ({ config, width, height }) => {
  const { 
    content, 
    textAlign, 
    fontSize, 
    color, 
    backgroundColor, 
    title,
    dataSource,
    contentMode 
  } = config;
  
  const [dataValue, setDataValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Default styling
  const textAlignValue = textAlign || 'left';
  const fontSizeValue = fontSize || '14px';
  const textColor = color || '#1f2937';
  const bgColor = backgroundColor || 'transparent';

  // Container styles
  const containerBaseStyle = {
    width: '100%',
    height: '100%',
    minHeight: '100px',
    overflow: 'auto',
    backgroundColor: bgColor,
    padding: '12px',
    boxSizing: 'border-box',
  };

  // Content styles
  const contentStyle = {
    minHeight: '100%',
    fontSize: fontSizeValue,
    color: textColor,
    textAlign: textAlignValue,
    lineHeight: '1.6',
  };

  // Fetch data when in data mode
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (contentMode === 'data' && dataSource?.tableName && dataSource?.valueColumn) {
        setLoading(true);
        try {
          const data = await fetchChartData(
            dataSource.tableName,
            dataSource.labelColumn || 'label',
            dataSource.valueColumn
          );
          
          if (isMounted && data && data.length > 0) {
            // Get the first row's value column
            setDataValue(String(data[0][dataSource.valueColumn] || ''));
          }
        } catch (err) {
          console.error('Error fetching rich text data:', err);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [contentMode, dataSource?.tableName, dataSource?.labelColumn, dataSource?.valueColumn]);

  // Determine what to display
  const displayContent = contentMode === 'data' ? dataValue : content;
  const isEmpty = !displayContent || displayContent === '<p></p>' || displayContent === '<p>Click to add text...</p>';

  // Loading state for data mode
  if (loading) {
    return (
      <div style={containerBaseStyle}>
        <div style={{ 
          ...contentStyle, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#9ca3af',
          minHeight: '80px'
        }}>
          Loading data...
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    const emptyMessage = contentMode === 'data' 
      ? 'No data available' 
      : 'Click to add text in settings';
      
    return (
      <div style={containerBaseStyle}>
        <div style={{ 
          ...contentStyle, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#9ca3af',
          minHeight: '80px'
        }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Check if content looks like HTML
  const isHtml = displayContent && (displayContent.includes('<') || displayContent.includes('>'));

  return (
    <div style={containerBaseStyle}>
      {isHtml ? (
        <div 
          style={contentStyle}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      ) : (
        <div style={contentStyle}>
          {displayContent}
        </div>
      )}
    </div>
  );
};

export default RichTextComponent;
