# Holograph Dashboard

A zero-VM dashboard application with pluggable chart adapters (D3.js and Chart.js), filter support, and webhook integration for dashboard storage.

## Table of Contents

- [Installation](#installation)
- [Filters for Consumer/Reading](#filters-for-consumerreading)
  - [Global Filter API](#global-filter-api)
  - [React Component Integration](#react-component-integration)
  - [Filter Configuration](#filter-configuration)
  - [Filter Examples](#filter-examples)
- [Webhooks](#webhooks)
  - [Webhook Configuration](#webhook-configuration)
  - [Webhook Payloads](#webhook-payloads)
  - [Save Draft](#save-draft)
  - [Publish](#publish)
  - [List Documents](#list-documents)
  - [Custom Handlers](#custom-handlers)
- [Dashboard Schema](#dashboard-schema)
- [API Reference](#api-reference)

---

## Installation

```bash
npm install
npm start
```

The application will be available at `http://localhost:3000`.

---

## Using the Dashboard Viewer in Another React App

You can use the `@holograph/dashboard-viewer` package to embed dashboards in any React application.

### Installation

```bash
npm install @holograph/dashboard-viewer chart.js d3 react-chartjs-2 react-grid-layout
```

Or if using yarn:

```bash
yarn add @holograph/dashboard-viewer chart.js d3 react-chartjs-2 react-grid-layout
```

Note: You must have `react` and `react-dom` installed as peer dependencies.

### Basic Usage

```jsx
import { DashboardViewer } from '@holograph/dashboard-viewer';

// Define your dashboard schema
const myDashboard = {
  version: "1.0.0",
  name: "Sales Dashboard",
  description: "Monthly sales metrics",
  showTitle: true,
  showSubtitle: true,
  zones: [
    {
      id: "zone-1",
      componentType: "chart",
      library: "chartjs",
      chartType: "line",
      theme: "default",
      title: "Monthly Revenue",
      showHeader: true,
      dataSource: {
        tableName: "sales_data",
        labelColumn: "month",
        valueColumn: "revenue"
      },
      gridPosition: { x: 0, y: 0, w: 6, h: 4 }
    }
  ],
  layout: {
    cols: 12,
    rowHeight: 30,
    margin: [10, 10]
  }
};

function App() {
  return (
    <DashboardViewer 
      dashboard={myDashboard}
    />
  );
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `dashboard` | object | The dashboard schema object (required) |
| `filters` | object | Optional initial filters to apply |
| `onFilterChange` | function | Callback when filters change |
| `webhookConfig` | object | Configuration for data loading webhooks |

### With Filters

```jsx
import { DashboardViewer } from '@holograph/dashboard-viewer';

function App() {
  const [filters, setFilters] = useState({});

  return (
    <DashboardViewer 
      dashboard={myDashboard}
      filters={filters}
      onFilterChange={(newFilters) => {
        setFilters(newFilters);
        // Optionally sync with parent app
      }}
    />
  );
}
```

### With External Data Source

```jsx
import { DashboardViewer } from '@holograph/dashboard-viewer';

function App() {
  const webhookConfig = {
    dataSourceUrl: 'https://api.example.com/data'
  };

  return (
    <DashboardViewer 
      dashboard={myDashboard}
      webhookConfig={webhookConfig}
    />
  );
}
```

---

## Filters for Consumer/Reading

Holograph provides a powerful filter system that allows consuming applications (embedding the dashboard) to pass filters programmatically. This is similar to PowerBI embedding filters.

### Global Filter API

When Holograph loads, it exposes a global `window.Holograph` object with filter methods. This allows any consuming system to apply filters via JavaScript.

#### Available Methods

| Method | Description |
|--------|-------------|
| `window.Holograph.setFilters(filters)` | Set multiple filters at once |
| `window.Holograph.setFilter(column, values)` | Set a single filter |
| `window.Holograph.clearFilter(column)` | Clear a specific filter |
| `window.Holograph.clearAllFilters()` | Clear all active filters |
| `window.Holograph.getFilters()` | Get all current filters |
| `window.Holograph.hasFilters()` | Check if any filters are active |

#### Filter Object Structure

Filters are passed as objects where keys are column names and values are arrays of allowed values:

```javascript
// Single filter
{ region: ['North', 'South'] }

// Multiple filters
{ 
  region: ['North', 'South'], 
  quarter: ['Q1', 'Q2'] 
}
```

### React Component Integration

If you're embedding Holograph as a React component, you can pass filters via the `externalFilters` prop:

```jsx
import App from './App';

function MyDashboard() {
  const [filters, setFilters] = useState({
    region: ['North', 'South'],
    quarter: ['Q1', 'Q2']
  });

  return (
    <App 
      externalFilters={filters} 
    />
  );
}
```

The `externalFilters` prop accepts an object that will be synced to the filter context. Changes to this prop will automatically update the filters.

### Filter Configuration

By default, filters can be applied to any column. For more granular control, you can configure which columns are filterable per zone using the `configureFilters` method:

```javascript
import { useFilters } from './hooks/useFilters';

function Dashboard() {
  const { configureFilters, getFiltersForZone } = useFilters();

  // Configure which columns can be filtered per zone
  useEffect(() => {
    configureFilters({
      'zone-1': ['region', 'quarter'],
      'zone-2': ['month'],
      'zone-3': ['product']
    });
  }, []);

  // Get filters specific to a zone
  const zone1Filters = getFiltersForZone('zone-1');
}
```

### Filter Examples

#### Setting Filters from Console

```javascript
// Filter by region
window.Holograph.setFilters({ region: ['North', 'South'] });

// Filter by multiple columns
window.Holograph.setFilters({ 
  region: ['North'], 
  quarter: ['Q1', 'Q2'] 
});

// Add another filter
window.Holograph.setFilter('month', ['Jan', 'Feb']);

// Clear a specific filter
window.Holograph.clearFilter('quarter');

// Clear all filters
window.Holograph.clearAllFilters();
```

#### Programmatic Filter Control

```javascript
// Check if filters are active
if (window.Holograph.hasFilters()) {
  console.log('Active filters:', window.Holograph.getFilters());
}

// Filter with empty array shows all data (removes filter)
window.Holograph.setFilter('region', []);
```

---

## Webhooks

Holograph uses a webhook system for dashboard storage operations. This allows flexible storage backends without coupling to specific implementations.

### Webhook Configuration

You can configure webhooks via the Settings panel in the UI or programmatically via the webhook service.

#### Configuration Options

| Setting | Description |
|---------|-------------|
| `saveDraftUrl` | POST endpoint for saving draft dashboards |
| `publishUrl` | POST endpoint for publishing dashboards |
| `listDocumentsUrl` | GET endpoint for fetching dashboard list |

#### Programmatic Configuration

```javascript
import { configureWebhookUrls, configureWebhooks } from './services/webhookService';

// Configure HTTP webhook URLs
configureWebhookUrls({
  saveDraftUrl: 'https://api.example.com/dashboards/draft',
  publishUrl: 'https://api.example.com/dashboards/publish',
  listDocumentsUrl: 'https://api.example.com/dashboards'
});

// Or configure custom handler functions
configureWebhooks({
  onSave: async (dashboard) => {
    // Custom save logic
    await myDatabase.save(dashboard);
    return { success: true };
  },
  onPublish: async (dashboard) => {
    // Custom publish logic
    await myDatabase.publish(dashboard);
    return { success: true };
  }
});
```

### Webhook Payloads

#### Save Draft

**Endpoint:** Configured `saveDraftUrl` or `onSave` handler

**Method:** POST

**Content-Type:** application/json

**Payload:**

```json
{
  "id": "dashboard-123",
  "name": "Sales Dashboard",
  "description": "Monthly sales metrics",
  "status": "draft",
  "lastModified": "2024-01-15T10:30:00.000Z",
  "schema": {
    "version": "1.0.0",
    "name": "Sales Dashboard",
    "description": "Monthly sales metrics",
    "showTitle": true,
    "showSubtitle": true,
    "zones": [
      {
        "id": "zone-1",
        "componentType": "chart",
        "library": "chartjs",
        "chartType": "line",
        "theme": "default",
        "title": "Monthly Revenue",
        "showHeader": true,
        "dataSource": {
          "tableName": "sales_data",
          "labelColumn": "month",
          "valueColumn": "revenue"
        },
        "gridPosition": {
          "x": 0,
          "y": 0,
          "w": 6,
          "h": 4
        }
      }
    ],
    "layout": {
      "cols": 12,
      "rowHeight": 30,
      "margin": [10, 10],
      "sizingMode": "responsive",
      "breakpoints": {
        "lg": { "cols": 12, "rowHeight": 30 },
        "md": { "cols": 8, "rowHeight": 40 },
        "sm": { "cols": 4, "rowHeight": 50 },
        "xs": { "cols": 2, "rowHeight": 60 }
      }
    }
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "dashboard": { ... }
}
```

#### Publish

**Endpoint:** Configured `publishUrl` or `onPublish` handler

**Method:** POST

**Content-Type:** application/json

**Payload:** Same as Save Draft, but with `status` set to `"published"`:

```json
{
  "id": "dashboard-123",
  "name": "Sales Dashboard",
  "description": "Monthly sales metrics",
  "status": "published",
  "lastModified": "2024-01-15T10:30:00.000Z",
  "schema": { ... }
}
```

**Expected Response:**

```json
{
  "success": true,
  "dashboard": { ... }
}
```

#### List Documents

**Endpoint:** Configured `listDocumentsUrl` or `onListDocuments` handler

**Method:** GET

**Query Parameters (optional):**

| Parameter | Description |
|-----------|-------------|
| `id` | Specific dashboard ID to fetch |

**Example:** `GET /api/dashboards?id=dashboard-123`

**Expected Response:**

```json
{
  "success": true,
  "result": [
    {
      "id": "dashboard-123",
      "name": "Sales Dashboard",
      "description": "Monthly sales metrics",
      "status": "published",
      "lastModified": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "dashboard-456",
      "name": "Product Analytics",
      "description": "Product performance metrics",
      "status": "draft",
      "lastModified": "2024-01-14T15:45:00.000Z"
    }
  ]
}
```

### Custom Handlers

For more complex scenarios, you can provide custom handler functions instead of HTTP URLs:

```javascript
configureWebhooks({
  onSave: async (dashboard) => {
    try {
      // Save to database
      await db.dashboards.update(dashboard.id, dashboard);
      
      // Optionally notify other services
      await notifyService.dashboardSaved(dashboard);
      
      return { 
        success: true, 
        dashboard,
        savedAt: new Date().toISOString()
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  
  onPublish: async (dashboard) => {
    // Publish logic
    await publishToCdn(dashboard);
    await invalidateCache();
    
    return { success: true };
  },
  
  onListDocuments: async (dashboardId) => {
    let dashboards;
    
    if (dashboardId) {
      dashboards = [await db.dashboards.get(dashboardId)];
    } else {
      dashboards = await db.dashboards.list();
    }
    
    return { success: true, result: dashboards };
  }
});
```

---

## Dashboard Schema

The dashboard is stored as a JSON object with the following structure:

```javascript
{
  "version": "1.0.0",           // Schema version
  "name": "Dashboard Name",
  "description": "Description",
  "showTitle": true,            // Show/hide title
  "showSubtitle": true,         // Show/hide subtitle
  "zones": [                    // Array of chart/table zones
    {
      "id": "zone-1",
      "componentType": "chart", // chart, table, image, richtext
      "library": "chartjs",    // chartjs or d3
      "chartType": "line",     // Chart type
      "theme": "default",      // Color theme
      "title": "Chart Title",
      "showHeader": true,
      "dataSource": {
        "tableName": "sales_data",
        "labelColumn": "month",
        "valueColumn": "revenue"
      },
      "gridPosition": {
        "x": 0,                 // X position (grid units)
        "y": 0,                 // Y position (grid units)
        "w": 6,                 // Width (grid units)
        "h": 4                  // Height (grid units)
      }
    }
  ],
  "layout": {
    "cols": 12,                 // Total grid columns
    "rowHeight": 30,            // Row height in pixels
    "margin": [10, 10],        // [horizontal, vertical] margin
    "sizingMode": "responsive",
    "breakpoints": {
      "lg": { "cols": 12, "rowHeight": 30 },
      "md": { "cols": 8, "rowHeight": 40 },
      "sm": { "cols": 4, "rowHeight": 50 },
      "xs": { "cols": 2, "rowHeight": 60 }
    }
  }
}
```

### Component Types

| Type | Description |
|------|-------------|
| `chart` | Visual chart (bar, line, pie, etc.) |
| `table` | Data table |
| `image` | Image component |
| `richtext` | Rich text/HTML content |

### Chart Libraries

| Library | Description |
|---------|-------------|
| `chartjs` | Chart.js library |
| `d3` | D3.js library |

### Chart Types

**Chart.js:**
- `line`, `bar`, `pie`, `doughnut`, `radar`, `polarArea`

**D3.js:**
- `bar`, `line`, `area`, `pie`, `donut`, `scatter`

### Color Themes

| Theme | Description |
|-------|-------------|
| `default` | Blue/Green |
| `ocean` | Blue/Cyan |
| `sunset` | Orange/Red |
| `forest` | Green/Teal |
| `monochrome` | Gray scale |

---

## API Reference

### Filter Context (`useFilters`)

```javascript
import { useFilters } from './hooks/useFilters';

const { 
  filters,              // Current filter object
  filterConfig,         // Filter configuration per zone
  setFilterValues,      // Set multiple filters at once
  setFilter,            // Set single filter
  clearFilter,          // Clear specific filter
  clearAllFilters,     // Clear all filters
  configureFilters,    // Configure allowed columns per zone
  getFiltersForZone,   // Get filters for specific zone
  hasActiveFilters,    // Check if filters exist
  getActiveFilters     // Get all active filters
} = useFilters();
```

### Webhook Service

```javascript
import { 
  configureWebhooks,       // Configure handler functions
  configureWebhookUrls,    // Configure HTTP URLs
  getWebhookUrls,          // Get current URLs
  getWebhooks,             // Get current handlers
  resetWebhooks,           // Reset to defaults
  invokeSave,              // Trigger save webhook
  invokePublish,           // Trigger publish webhook
  invokeListDocuments      // Trigger list webhook
} from './services/webhookService';
```

### Data Service

```javascript
import { 
  fetchChartData,           // Fetch data for charts
  fetchTableData,           // Fetch raw table data
  getAvailableTables,       // List available tables
  getTableColumns,          // Get columns for a table
  initializeDataService,    // Initialize the service
  getUniqueValuesForColumn  // Get unique values for filtering
} from './services/dataService';
```

---

## Example: Embedding Holograph with Filters

```jsx
import React, { useState, useEffect } from 'react';
import App from './App';

function EmbeddedDashboard() {
  const [filters, setFilters] = useState({});
  
  // Example: Sync filters from parent application
  useEffect(() => {
    // Listen for filter changes from parent
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'FILTER_CHANGE') {
        setFilters(event.data.filters);
      }
    });
  }, []);
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <App externalFilters={filters} />
    </div>
  );
}

// Parent application can send filters:
function sendFiltersToDashboard() {
  const iframe = document.getElementById('dashboard-frame');
  iframe.contentWindow.postMessage({
    type: 'FILTER_CHANGE',
    filters: { region: ['North', 'South'] }
  }, '*');
}
```

---

## Example: Custom Storage Backend

```javascript
// Implement your own storage backend
configureWebhooks({
  onSave: async (dashboard) => {
    // Save to Azure Blob Storage
    await blobService.upload(
      `dashboards/${dashboard.id}.json`,
      JSON.stringify(dashboard)
    );
    
    return { success: true };
  },
  
  onPublish: async (dashboard) => {
    // Save to production container
    await blobService.upload(
      `production/${dashboard.id}.json`,
      JSON.stringify(dashboard)
    );
    
    // Update CDN
    await cdnService.invalidate(dashboard.id);
    
    return { success: true };
  },
  
  onListDocuments: async () => {
    // List from Blob Storage
    const blobs = await blobService.list('dashboards/');
    const dashboards = await Promise.all(
      blobs.map(blob => blobService.download(blob.name))
    );
    
    return { success: true, result: dashboards };
  }
});
```
