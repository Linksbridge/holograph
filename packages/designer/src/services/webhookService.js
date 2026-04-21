/**
 * Webhook Service
 * 
 * A simple webhook/callback system that allows hooking in custom handlers
 * for dashboard storage operations. This enables flexible storage backends
 * without coupling to specific implementations.
 */

// Default no-op handlers
const defaultHandlers = {
  onSave: async (dashboard) => {
    console.log('=== WEBHOOK: onSave ===');
    console.log(JSON.stringify(dashboard, null, 2));
    return { success: true, dashboard };
  },
  onPublish: async (dashboard) => {
    console.log('=== WEBHOOK: onPublish ===');
    console.log(JSON.stringify(dashboard, null, 2));
    return { success: true, dashboard };
  },
  onListDocuments: async (dashboardId) => {
    console.log('=== WEBHOOK: onListDocuments ===');
    console.log('Dashboard ID:', dashboardId || 'all');
    // Return empty array as fallback when no webhook URL is configured
    return { 
      success: true, 
      result: [],
      message: 'No documents found - configure List Documents URL to load complete dashboard objects with schemas from external source'
    };
  },
};

// Current handlers (can be overridden)
let handlers = { ...defaultHandlers };

// Webhook URLs (can be configured)
let webhookUrls = {
  saveDraftUrl: '',
  publishUrl: '',
  listDocumentsUrl: '',
};

/**
 * Configure webhook handlers
 * @param {Object} newHandlers - Object with onSave and/or onPublish callbacks
 * @param {Function} newHandlers.onSave - Callback for save draft (dashboard) => Promise<result>
 * @param {Function} newHandlers.onPublish - Callback for publish (dashboard) => Promise<result>
 */
export const configureWebhooks = (newHandlers) => {
  handlers = {
    ...handlers,
    ...newHandlers,
  };
};

/**
 * Configure webhook URLs for HTTP calls
 * @param {Object} urls - Object with saveDraftUrl, publishUrl, and/or listDocumentsUrl
 * @param {string} urls.saveDraftUrl - URL to POST dashboard when saving draft
 * @param {string} urls.publishUrl - URL to POST dashboard when publishing
 * @param {string} urls.listDocumentsUrl - URL to GET list of dashboards
 */
export const configureWebhookUrls = (urls) => {
  webhookUrls = {
    ...webhookUrls,
    ...urls,
  };
};

/**
 * Get current webhook URLs
 * @returns {Object} Current webhook URLs
 */
export const getWebhookUrls = () => {
  return { ...webhookUrls };
};

/**
 * Make HTTP GET request to webhook URL
 * @param {string} url - The URL to GET from
 * @returns {Promise<Object>} Result from the request
 */
async function getFromWebhookUrl(url) {
  if (!url) {
    return { success: false, error: 'No URL configured' };
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get current handlers
 * @returns {Object} Current webhook handlers
 */
export const getWebhooks = () => {
  return { ...handlers };
};

/**
 * Reset handlers to defaults
 */
export const resetWebhooks = () => {
  handlers = { ...defaultHandlers };
};

/**
 * Make HTTP POST request to webhook URL
 * @param {string} url - The URL to POST to
 * @param {Object} data - The data to send
 * @returns {Promise<Object>} Result from the request
 */
async function postToWebhookUrl(url, data) {
  if (!url) {
    return { success: false, error: 'No URL configured' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Invoke the save webhook
 * @param {Object} dashboard - The dashboard object to save
 * @returns {Promise<Object>} Result from the handler
 */
export const invokeSave = async (dashboard) => {
  // First try webhook URL if configured
  if (webhookUrls.saveDraftUrl) {
    const urlResult = await postToWebhookUrl(webhookUrls.saveDraftUrl, dashboard);
    if (urlResult.success) {
      return urlResult;
    }
    // Fall through to handler if URL fails
  }
  
  // Fall back to custom handler
  try {
    const result = await handlers.onSave(dashboard);
    return result;
  } catch (error) {
    console.error('Save webhook error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invoke the publish webhook
 * @param {Object} dashboard - The dashboard object to publish
 * @returns {Promise<Object>} Result from the handler
 */
export const invokePublish = async (dashboard) => {
  // First try webhook URL if configured
  if (webhookUrls.publishUrl) {
    const urlResult = await postToWebhookUrl(webhookUrls.publishUrl, dashboard);
    if (urlResult.success) {
      return urlResult;
    }
    // Fall through to handler if URL fails
  }
  
  // Fall back to custom handler
  try {
    const result = await handlers.onPublish(dashboard);
    return result;
  } catch (error) {
    console.error('Publish webhook error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invoke the list documents webhook
 * Expects complete dashboard objects with full schemas and layout information
 * 
 * Expected API Response Format:
 * {
 *   "success": true,
 *   "result": [
 *     {
 *       "id": "dashboard-1",
 *       "name": "Sales Dashboard", 
 *       "description": "Monthly sales analytics",
 *       "status": "published",
 *       "lastModified": "2026-04-21T10:30:00Z",
 *       "schema": {
 *         "version": "1.0.0",
 *         "name": "Sales Dashboard",
 *         "description": "Monthly sales analytics",
 *         "showTitle": true,
 *         "zones": [
 *           {
 *             "id": "zone-1",
 *             "title": "Revenue Chart",
 *             "library": "chartjs",
 *             "chartType": "bar",
 *             "dataSource": { "tableName": "sales", "labelColumn": "month", "valueColumn": "revenue" },
 *             "gridPosition": { "x": 0, "y": 0, "w": 6, "h": 4 }
 *           }
 *         ]
 *       }
 *     }
 *   ]
 * }
 * 
 * @param {string} [dashboardId] - Optional ID to fetch a specific dashboard
 * @returns {Promise<Object>} Result with complete dashboard objects including schemas
 */
export const invokeListDocuments = async (dashboardId) => {
  // Build URL with optional ID query param
  let url = webhookUrls.listDocumentsUrl;
  if (dashboardId) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}id=${encodeURIComponent(dashboardId)}`;
  }
  
  // Try webhook URL if configured
  if (webhookUrls.listDocumentsUrl) {
    const urlResult = await getFromWebhookUrl(url);
    if (urlResult.success) {
      return urlResult;
    }
  }
  
  // Fall back to custom handler
  try {
    const result = await handlers.onListDocuments(dashboardId);
    return result;
  } catch (error) {
    console.error('List documents webhook error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  configureWebhooks,
  configureWebhookUrls,
  getWebhookUrls,
  getWebhooks,
  resetWebhooks,
  invokeSave,
  invokePublish,
  invokeListDocuments,
};
