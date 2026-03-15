/**
 * ImageComponent Component
 * 
 * A component that displays images from a URL or uploaded file.
 * Supports various object-fit modes and has a placeholder for empty states.
 */

import React, { useState, useRef, useEffect } from 'react';

const ImageComponent = ({ config, width, height }) => {
  const { src, alt, objectFit, borderRadius, showCaption, caption } = config;
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  // Default values
  const objectFitMode = objectFit || 'cover';
  const borderRadiusValue = borderRadius || '4px';
  const altText = alt || config.title || 'Image';

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // Reset state when src changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [src]);

  // Container base styles
  const containerBaseStyle = {
    width: '100%',
    height: '100%',
    minHeight: '100px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  // Image container styles
  const imageContainerStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: borderRadiusValue,
    overflow: 'hidden',
    minHeight: '80px',
  };

  // Loading state
  if (isLoading && src) {
    return (
      <div ref={containerRef} style={containerBaseStyle}>
        <div style={imageContainerStyle}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
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
            <span style={{ fontSize: '12px' }}>Loading image...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  // Error state - no src or load error
  if (!src || imageError) {
    return (
      <div ref={containerRef} style={containerBaseStyle}>
        <div style={imageContainerStyle}>
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>No Image</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
              {imageError ? 'Failed to load image' : 'Add an image URL in settings'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Caption style
  const captionStyle = {
    padding: '8px 0',
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
  };

  return (
    <div ref={containerRef} style={containerBaseStyle}>
      <div style={imageContainerStyle}>
        <img
          src={src}
          alt={altText}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: objectFitMode,
            display: 'block',
          }}
        />
      </div>
      {showCaption && caption && (
        <div style={captionStyle}>{caption}</div>
      )}
    </div>
  );
};

export default ImageComponent;
