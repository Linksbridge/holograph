/**
 * Global Settings Service
 * 
 * Fetches read-only global settings from Azure Functions backend.
 * Settings are cached for performance with periodic refresh.
 * 
 * Environment Variables:
 * - REACT_APP_GLOBAL_SETTINGS_URL: Default URL for global settings function
 *   If set, global settings will be loaded automatically on app startup.
 * 
 * Usage:
 * - Settings loaded on app startup if env URL is configured
 * - Can be overridden via SettingsPanel configuration
 * - Automatic caching and periodic refresh
 */

import React, { useState, useEffect } from 'react';

class GlobalSettingsService {
  constructor() {
    this.cache = new Map();
    this.lastFetch = 0;
    this.fetchInterval = 30000; // 30 seconds cache
    this.globalSettingsUrl = process.env.REACT_APP_DEFAULT_GLOBAL_SETTINGS_URL || '';
    
    // Auto-load settings if URL is configured in environment
    if (this.globalSettingsUrl) {
      this.loadSettingsOnStartup();
    }
  }

  /**
   * Load settings on app startup
   */
  async loadSettingsOnStartup() {
    try {
      await this.getAllSettings();
      console.log('Global settings loaded on startup');
    } catch (error) {
      console.warn('Failed to load global settings on startup:', error);
    }
  }

  /**
   * Set the global settings URL
   */
  setGlobalSettingsUrl(url) {
    if (url !== this.globalSettingsUrl) {
      this.globalSettingsUrl = url;
      this.cache.clear(); // Clear cache when URL changes
      this.lastFetch = 0;
      console.log('Global settings URL updated:', url || 'cleared');
    }
  }

  /**
   * Get all global settings with caching
   */
  async getAllSettings(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && (now - this.lastFetch) < this.fetchInterval && this.cache.size > 0) {
      return Object.fromEntries(this.cache);
    }

    // If no URL is configured, return fallback settings
    if (!this.globalSettingsUrl) {
      console.warn('Global settings URL not configured, using fallback settings');
      return this.getFallbackSettings();
    }

    try {
      const response = await fetch(this.globalSettingsUrl);
      
      if (!response.ok) {
        console.warn(`Failed to fetch global settings: ${response.statusText}`);
        return this.getFallbackSettings();
      }

      const data = await response.json();
      
      if (data.success && data.settings) {
        this.cache.clear();
        Object.entries(data.settings).forEach(([key, setting]) => {
          this.cache.set(key, setting.value || setting);
        });
        this.lastFetch = now;
        return Object.fromEntries(this.cache);
      }
      
      return this.getFallbackSettings();
      
    } catch (error) {
      console.warn('Error fetching global settings:', error);
      return this.getFallbackSettings();
    }
  }

  /**
   * Get a specific global setting
   */
  async getSetting(key, defaultValue = null) {
    const allSettings = await this.getAllSettings();
    return allSettings[key] || defaultValue;
  }

  /**
   * Get fallback settings when backend is unavailable
   */
  getFallbackSettings() {
    return {
      database: {
        defaultDatabaseName: 'DashboardDB',
        connectionStringTemplate: 'Server={server};Database={database};Integrated Security=true;',
        defaultServer: 'localhost',
        defaultTimeout: 30
      },
      dataSource: {
        defaultType: 'azure-sql',
        allowedTypes: ['azure-sql', 'postgresql', 'mysql'],
        queryTimeout: 30000,
        enableCaching: true
      }
    };
  }

  /**
   * Force refresh settings from server
   */
  async refreshSettings() {
    return this.getAllSettings(true);
  }
}

// Export singleton instance
export const globalSettingsService = new GlobalSettingsService();

/**
 * React hook for using global settings
 */
export const useGlobalSettings = (settingsConfig = {}) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    const globalSettingsUrl = settingsConfig.saveLocations?.globalSettingsUrl || '';
    
    // Update URL if it changed
    if (globalSettingsUrl !== currentUrl) {
      setCurrentUrl(globalSettingsUrl);
      if (globalSettingsUrl) {
        globalSettingsService.setGlobalSettingsUrl(globalSettingsUrl);
      }
    }

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we already have cached settings from startup
        if (globalSettingsService.cache.size > 0 && 
            (Date.now() - globalSettingsService.lastFetch) < globalSettingsService.fetchInterval) {
          const cachedSettings = Object.fromEntries(globalSettingsService.cache);
          setSettings(cachedSettings);
          console.log('Using cached global settings from startup');
        } else {
          const allSettings = await globalSettingsService.getAllSettings();
          setSettings(allSettings);
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to load global settings:', err);
      } finally {
        setLoading(false);
      }
    };

    // Load settings
    loadSettings();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      loadSettings();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [settingsConfig.saveLocations?.globalSettingsUrl, currentUrl]);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await globalSettingsService.refreshSettings();
      setSettings(allSettings);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    refreshSettings
  };
};

/**
 * Convenience hooks for specific setting categories
 */
export const useGlobalDatabase = () => {
  const { settings } = useGlobalSettings();
  return settings.database || {
    defaultDatabaseName: 'DashboardDB',
    connectionStringTemplate: 'Server={server};Database={database};Integrated Security=true;',
    defaultServer: 'localhost',
    defaultTimeout: 30
  };
};

export const useGlobalDataSource = () => {
  const { settings } = useGlobalSettings();
  return settings.dataSource || {
    defaultType: 'azure-sql',
    allowedTypes: ['azure-sql', 'postgresql', 'mysql'],
    queryTimeout: 30000,
    enableCaching: true
  };
};