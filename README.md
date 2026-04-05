# Holograph Dashboard

A zero-VM dashboard application with pluggable chart adapters (D3.js and Chart.js), filter support, and webhook integration for dashboard storage.

## Table of Contents

- [Installation](#installation)
- [Using the Dashboard Viewer in Another React App](#using-the-dashboard-viewer-in-another-react-app)
  - [Props](#props)
  - [With Filters](#with-filters)
  - [Filter Types](#filter-types)
  - [Filter Operators](#filter-operators)
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
- [Choropleth Map Configuration](#choropleth-map-configuration)
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

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dashboard` | object | — | The dashboard schema object (required) |
| `data` | object | `{}` | Optional data keyed by zone ID; bypasses the data service when provided |
| `filters` | object | `{}` | Filter definitions to apply to all charts (see [Filter Types](#filter-types)) |
| `onFilterChange` | function | — | Called with the current filter object whenever filters change |
| `className` | string | `''` | Additional CSS class applied to the root element |

### With Filters

Pass a `filters` object to the viewer. Keys are column names; values are filter definitions. The viewer keeps its internal state in sync whenever the prop changes, so you can drive it from your own state.

```jsx
import { DashboardViewer } from '@holograph/dashboard-viewer';

function App() {
  const [filters, setFilters] = useState({
    region: {
      mode: 'basic',
      filterType: 'include',
      values: ['North', 'South'],
    },
  });

  return (
    <DashboardViewer
      dashboard={myDashboard}
      filters={filters}
      onFilterChange={setFilters}
    />
  );
}
```

### Filter Types

There are three filter formats. All three can be mixed in the same `filters` object.

#### Basic filter

Show only rows where a column's value is in (or not in) a fixed list — equivalent to Power BI's "Basic filtering".

```js
// Include: only show rows where region is North or South
region: {
  mode: 'basic',
  filterType: 'include',   // 'include' | 'exclude'
  values: ['North', 'South'],
}

// Exclude: hide rows where region is West
region: {
  mode: 'basic',
  filterType: 'exclude',
  values: ['West'],
}
```

#### Advanced filter

Apply up to two operator-based conditions joined by `and` / `or` — equivalent to Power BI's "Advanced filtering".

```js
// revenue between 10 000 and 30 000
revenue: {
  mode: 'advanced',
  logicalOperator: 'and',   // 'and' | 'or'
  conditions: [
    { operator: 'gte', value: '10000' },
    { operator: 'lte', value: '30000' },
  ],
}

// product name starts with "Widget" OR is blank
product: {
  mode: 'advanced',
  logicalOperator: 'or',
  conditions: [
    { operator: 'startsWith', value: 'Widget' },
    { operator: 'isBlank',    value: '' },
  ],
}
```

#### Legacy array format

The original simple include-list shorthand is still supported:

```js
// Equivalent to mode:'basic', filterType:'include', values:[…]
region: ['North', 'South']
```

### Filter Operators

Operators are inferred from column type (numeric columns automatically use the number set in the editor's FilterBar, but you can use either set in prop-driven filters).

**Text operators**

| Operator | Description |
|----------|-------------|
| `is` | Exact match (case-insensitive) |
| `isNot` | Does not match |
| `contains` | Value contains the string |
| `doesNotContain` | Value does not contain the string |
| `startsWith` | Value starts with the string |
| `endsWith` | Value ends with the string |
| `isBlank` | Value is null, undefined, or empty string |
| `isNotBlank` | Value is not blank |

**Number operators**

| Operator | Description |
|----------|-------------|
| `eq` | Equal to |
| `neq` | Not equal to |
| `gt` | Greater than |
| `gte` | Greater than or equal to |
| `lt` | Less than |
| `lte` | Less than or equal to |
| `isBlank` | Value is null or undefined |
| `isNotBlank` | Value is not null or undefined |

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

Filters are passed as objects where keys are column names. Each value is a filter definition — see [Filter Types](#filter-types) for the full format. The simple array shorthand is also accepted for backwards compatibility.

```javascript
// Simple include list (legacy shorthand)
{ region: ['North', 'South'] }

// Basic include/exclude (Power BI style)
{
  region: { mode: 'basic', filterType: 'include', values: ['North', 'South'] },
  quarter: { mode: 'basic', filterType: 'exclude', values: ['Q4'] },
}

// Advanced operator conditions
{
  revenue: {
    mode: 'advanced',
    logicalOperator: 'and',
    conditions: [
      { operator: 'gte', value: '10000' },
      { operator: 'lt',  value: '50000' },
    ],
  },
}

// Multiple formats can be mixed in the same object
{
  region:  { mode: 'basic', filterType: 'include', values: ['North'] },
  revenue: { mode: 'advanced', logicalOperator: 'or', conditions: [
    { operator: 'gt', value: '20000' },
    { operator: 'isBlank', value: '' },
  ]},
  quarter: ['Q1', 'Q2'],   // legacy array still works
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
// Basic include (legacy shorthand still works)
window.Holograph.setFilters({ region: ['North', 'South'] });

// Basic include using full format
window.Holograph.setFilters({
  region: { mode: 'basic', filterType: 'include', values: ['North', 'South'] },
});

// Exclude specific values
window.Holograph.setFilter('region', {
  mode: 'basic',
  filterType: 'exclude',
  values: ['West'],
});

// Advanced: revenue between two values
window.Holograph.setFilter('revenue', {
  mode: 'advanced',
  logicalOperator: 'and',
  conditions: [
    { operator: 'gte', value: '10000' },
    { operator: 'lte', value: '30000' },
  ],
});

// Clear a specific filter
window.Holograph.clearFilter('region');

// Clear all filters
window.Holograph.clearAllFilters();
```

#### Programmatic Filter Control

```javascript
// Check if filters are active
if (window.Holograph.hasFilters()) {
  console.log('Active filters:', window.Holograph.getFilters());
}

// Clear a filter by setting an empty values list
window.Holograph.setFilter('region', { mode: 'basic', filterType: 'include', values: [] });
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

## Tooltip Customization

Holograph provides customizable tooltips for all chart types. You can control both the appearance and content of tooltips through the Property Panel.

### Tooltip Text Templates

When configuring tooltips in the Property Panel, you can customize the text displayed using template placeholders:

#### Title Text
Controls the bold part of the tooltip (typically the category or data identifier).

**Available placeholders:**
- `{id}` - The data identifier (e.g., "Jan", "US-CA", "Q1")
- `{label}` - Alternative label field if available

**Examples:**
- `{id}` - Shows just the identifier (e.g., "Jan")
- `Month: {id}` - Shows "Month: Jan"
- `Category: {label}` - Shows "Category: Sales"

#### Value Text
Controls the value part of the tooltip (typically the data value).

**Available placeholders:**
- `{value}` - The formatted data value (e.g., "$1,234", "45.6%", "123")

**Examples:**
- `{value}` - Shows just the formatted value (e.g., "$1,234")
- `Amount: {value}` - Shows "Amount: $1,234"
- `Total: {value}` - Shows "Total: 45.6%"

### Tooltip Appearance

In addition to text customization, you can control the visual appearance:

- **Background Color** - Set custom background color or use "Auto" for theme-based coloring
- **Text Color** - Set custom text color or use "Auto" for theme-based coloring
- **Border Color** - Set custom border color or use "Auto" for theme-based coloring
- **Value Format** - Choose from Auto, Number, Currency, or Percentage
- **Position** - Auto (recommended), Top, Bottom, Left, Right, or Center
- **Show Color Indicators** - Display color dots next to values (Chart.js only)

### Examples

#### Bar Chart with Custom Tooltips
```javascript
{
  "id": "revenue-chart",
  "componentType": "chart",
  "library": "chartjs",
  "chartType": "bar",
  "title": "Monthly Revenue",
  "tooltip": {
    "enabled": true,
    "title": "Month: {id}",
    "label": "Revenue: {value}",
    "format": "currency",
    "backgroundColor": "#ffffff",
    "textColor": "#000000",
    "borderColor": "#3b82f6",
    "position": "auto",
    "showColors": true
  }
}
```

#### Pie Chart with Percentage
```javascript
{
  "id": "sales-pie",
  "componentType": "chart",
  "library": "d3",
  "chartType": "pie",
  "title": "Sales by Category",
  "tooltip": {
    "enabled": true,
    "title": "{label}",
    "label": "{value} ({percentage}%)",
    "format": "currency"
  }
}
```

### Chart Library Support

All chart libraries support tooltip customization:

- **Chart.js** - Full support including color indicators and advanced positioning
- **D3.js** - Full support with hover animations
- **Nivo** - Full support including choropleth maps

---

## CSS Customization

Holograph dashboards can be fully customized through CSS. The viewer uses CSS custom properties (CSS variables) for all styling, allowing complete visual customization without JavaScript changes.

### CSS Classes for Targeting

| Class | Description |
|-------|-------------|
| `.holograph-viewer` | Main dashboard container |
| `.viewer-dashboard-header` | Dashboard title/subtitle area |
| `.viewer-dashboard-title` | Main dashboard title |
| `.viewer-dashboard-subtitle` | Dashboard subtitle |
| `.viewer-dashboard-grid` | Grid layout container |
| `.viewer-zone-card` | Individual chart/table zone |
| `.viewer-zone-header` | Zone title bar |
| `.viewer-zone-title` | Zone title text |
| `.viewer-zone-chart-container` | Chart content area |
| `.viewer-table` | Table component |
| `.viewer-empty-state` | Empty state display |

### CSS Custom Properties

Override these variables to customize appearance:

```css
.holograph-viewer {
  /* Layout */
  --hv-viewer-bg: #f9fafb;
  --hv-viewer-padding: 20px;
  --hv-viewer-radius: 8px;

  /* Zone Cards */
  --hv-zone-bg: #ffffff;
  --hv-zone-radius: 8px;
  --hv-header-bg: #f9fafb;
  --hv-header-padding: 12px 16px;

  /* Typography */
  --hv-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --hv-title-size: 24px;
  --hv-title-weight: 600;
  --hv-subtitle-size: 14px;
  --hv-zone-title-size: 14px;
  --hv-zone-title-weight: 600;
  --hv-body-font-size: 14px;

  /* Colors */
  --hv-text-primary: #111827;
  --hv-text-secondary: #6b7280;
  --hv-text-tertiary: #4b5563;
  --hv-text-inverse: #ffffff;
  --hv-border-color: #e5e7eb;
  --hv-border-strong: #d1d5db;
  --hv-primary: #3b82f6;
  --hv-primary-hover: #2563eb;
  --hv-success: #10b981;
  --hv-warning: #f59e0b;
  --hv-error: #dc2626;

  /* Shadows */
  --hv-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --hv-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --hv-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --hv-transition-fast: 150ms ease;
  --hv-transition-normal: 200ms ease;
  --hv-transition-slow: 300ms ease;

  /* Grid */
  --hv-grid-gap: 10px;
  --hv-min-zone-height: 150px;
}
```

### Example Customizations

#### Dark Theme
```css
.holograph-viewer {
  --hv-viewer-bg: #1f2937;
  --hv-zone-bg: #374151;
  --hv-header-bg: #374151;
  --hv-text-primary: #f9fafb;
  --hv-text-secondary: #d1d5db;
  --hv-border-color: #4b5563;
  --hv-primary: #60a5fa;
}
```

#### Compact Layout
```css
.holograph-viewer {
  --hv-viewer-padding: 12px;
  --hv-header-padding: 8px 12px;
  --hv-grid-gap: 8px;
  --hv-zone-radius: 4px;
}
```

#### High Contrast
```css
.holograph-viewer {
  --hv-border-color: #000000;
  --hv-border-strong: #000000;
  --hv-text-primary: #000000;
  --hv-zone-bg: #ffffff;
  --hv-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

### Component-Specific Overrides

Target specific dashboard instances:

```css
/* Specific dashboard */
#dashboard-sales {
  --hv-primary: #dc2626;
  --hv-viewer-bg: #fef2f2;
}

/* Department-specific styling */
.holograph-viewer[data-department="finance"] {
  --hv-primary: #059669;
  --hv-zone-bg: #f0fdf4;
}

/* Environment-specific */
.holograph-viewer[data-env="staging"] {
  --hv-viewer-bg: #fefce8;
  --hv-border-color: #f59e0b;
}
```

### Responsive Customization

```css
/* Mobile adjustments */
@media (max-width: 768px) {
  .holograph-viewer {
    --hv-viewer-padding: 12px;
    --hv-title-size: 20px;
    --hv-zone-title-size: 13px;
  }
}

/* Print styles */
@media print {
  .holograph-viewer {
    --hv-viewer-bg: #ffffff;
    --hv-zone-bg: #ffffff;
    --hv-shadow-sm: none;
    --hv-shadow-md: none;
    --hv-shadow-lg: none;
  }
}
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
      "library": "nivo",       // chartjs, d3, or nivo
      "chartType": "choropleth", // Chart type (line, bar, pie, choropleth, etc.)
      "theme": "default",      // Color theme
      "title": "Chart Title",
      "showHeader": true,
      // Choropleth-specific properties
      "mapFeatures": "world-50m", // Geographical data source
      "projectionType": "naturalEarth1", // Map projection
      "projectionScale": 100,   // Map scale (50-200)
      "matchBy": "id",          // Data matching method
      "geoJsonUrl": "https://example.com/custom.geojson", // Custom GeoJSON URL
      "dataSource": {
        "tableName": "geographic_data",
        "labelColumn": "region_name",
        "valueColumn": "metric_value"
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
| `nivo` | Nivo library (includes choropleth maps) |

### Chart Types

**Chart.js:**
- `line`, `bar`, `pie`, `doughnut`, `radar`, `polarArea`

**D3.js:**
- `bar`, `line`, `area`, `pie`, `donut`, `scatter`

**Nivo:**
- `line`, `bar`, `pie`, `choropleth`

### Choropleth Map Configuration

Choropleth maps visualize geographic data by coloring regions based on data values. Holograph supports choropleth maps through the Nivo library.

#### Prerequisites

1. **Install Nivo Geo Package:**
   ```bash
   npm install @nivo/geo
   ```

2. **Enable Nivo Library:**
   Go to Settings → Chart Libraries and enable "Nivo"

#### Creating a Choropleth Map

1. **Add a Chart Zone:**
   - Drag a chart from the palette
   - Select "Nivo" as the rendering library
   - Choose "Choropleth Map" as the chart type

2. **Configure Map Data:**
   - **Geographical Data Source:** Choose from preset maps or provide custom GeoJSON
     - World (50m resolution)
     - World (110m resolution)
     - United States
     - Europe
     - Custom GeoJSON URL

   - **Projection Settings:**
     - **Projection Type:** Natural Earth 1, Mercator, Orthographic, Equirectangular, Albers USA
     - **Scale:** Adjust map zoom level (50-200)

   - **Data Matching:**
     - Match your data to map regions by ID, Name, ISO Code, or custom function

#### Data Format

Your data should include region identifiers that match the geographical features:

```javascript
const choroplethData = [
  { id: 'US-CA', label: 'California', value: 39538223 },
  { id: 'US-TX', label: 'Texas', value: 29145505 },
  { id: 'US-FL', label: 'Florida', value: 21538187 },
  // ... more states
];
```

#### Example Configuration

```javascript
const choroplethZone = {
  id: "population-map",
  componentType: "chart",
  library: "nivo",
  chartType: "choropleth",
  theme: "default",
  title: "US Population by State",
  showHeader: true,
  mapFeatures: "usa",                    // Use USA map
  projectionType: "albersUsa",          // Albers USA projection
  projectionScale: 100,                 // Map scale
  matchBy: "id",                        // Match data by ID field
  dataSource: {
    tableName: "population_data",
    labelColumn: "state_name",
    valueColumn: "population"
  },
  gridPosition: { x: 0, y: 0, w: 12, h: 8 }
};
```

#### Custom GeoJSON

For custom maps, provide a GeoJSON URL:

```javascript
const customChoroplethZone = {
  id: "custom-map",
  componentType: "chart",
  library: "nivo",
  chartType: "choropleth",
  theme: "ocean",
  title: "Custom Region Map",
  mapFeatures: "custom",
  geoJsonUrl: "https://example.com/my-regions.geojson",
  projectionType: "naturalEarth1",
  projectionScale: 150,
  matchBy: "properties.name",           // Match by GeoJSON properties
  // ... other configuration
};
```

#### Common Issues

**Map Not Loading:**
- Ensure `@nivo/geo` package is installed
- Check that your GeoJSON URL is accessible
- Verify data matching (IDs must match between your data and GeoJSON features)

**Data Not Displaying:**
- Ensure your data includes the correct identifier field (`id`, `name`, etc.)
- Check that the `matchBy` setting matches your data structure
- Verify that region identifiers exist in the geographical data

**Performance Issues:**
- Use appropriate resolution (50m for detailed maps, 110m for faster loading)
- Consider data sampling for very large datasets

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
  fetchChartData,                // Fetch data for charts
  fetchTableData,                // Fetch raw table data
  getAvailableTables,            // List available tables
  getTableColumns,               // Get columns for a table
  initializeDataService,         // Initialize the service
  getUniqueValuesForColumn,      // Get unique values for a column across all tables
  getUniqueValuesForTableColumn, // Get unique values for a column within one table
} from './services/dataService';
```

Both `fetchChartData` and `fetchTableData` accept a `filters` argument in any of the three formats described in [Filter Types](#filter-types).

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
