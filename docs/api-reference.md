# Holograph Designer — Backend API Reference

This document describes the two backend endpoints the designer calls, where each is configured, and the exact response shape each must return.

---

## 1. Global Settings

**Purpose:** Provides site-wide read-only configuration (database defaults, allowed data source types, etc.) that is loaded on startup and refreshed periodically.

### How it is called

- **Caller:** `globalSettingsService.js` — on app startup (if the URL is set in the environment), and on every Settings Panel open
- **Method:** `GET`
- **URL source (priority order):**
  1. Settings Panel → Save Locations tab → **Global Settings URL** field (`saveLocations.globalSettingsUrl`)
  2. Environment variable `REACT_APP_DEFAULT_GLOBAL_SETTINGS_URL` (baked in at build time)

### Request

```
GET {globalSettingsUrl}
```

No body, no auth headers.

### Required response shape

```json
{
  "success": true,
  "settings": {
    "database": {
      "value": {
        "defaultDatabaseName": "MyDatabase",
        "defaultServer": "myserver.database.windows.net",
        "connectionStringTemplate": "Server={server};Database={database};User Id={user};Password={password};",
        "defaultTimeout": 30
      }
    },
    "dataSource": {
      "value": {
        "defaultType": "azure-sql",
        "allowedTypes": ["azure-sql", "postgresql", "mysql"],
        "queryTimeout": 30000,
        "enableCaching": true
      }
    }
  }
}
```

**Parsing rules:**
- The response must have `success: true` and a `settings` object, otherwise the designer falls back to hardcoded defaults.
- Each key under `settings` is read as `setting.value || setting` — so you can either wrap the value in `{ value: ... }` (as above) or return the value directly:

```json
{
  "success": true,
  "settings": {
    "database": {
      "defaultDatabaseName": "MyDatabase",
      "defaultServer": "myserver.database.windows.net"
    }
  }
}
```

**Fallback defaults** (used when the endpoint is unreachable or not configured):

| Key | Default |
|-----|---------|
| `database.defaultDatabaseName` | `"DashboardDB"` |
| `database.defaultServer` | `"localhost"` |
| `database.connectionStringTemplate` | `"Server={server};Database={database};Integrated Security=true;"` |
| `database.defaultTimeout` | `30` |
| `dataSource.defaultType` | `"azure-sql"` |
| `dataSource.allowedTypes` | `["azure-sql", "postgresql", "mysql"]` |
| `dataSource.queryTimeout` | `30000` |
| `dataSource.enableCaching` | `true` |

**Cache:** Settings are cached for 30 seconds in-memory and refreshed every 60 seconds while the Settings Panel is open.

---

## 2. Database Schema

**Purpose:** Returns the table names and column names from the configured database so the designer can populate dropdowns in the chart builder and filter panel.

### How it is called

- **Callers:**
  - `dataService.js` → `initializeDataService()` — triggered from:
    - `SettingsPanel.js` on save
    - `DashboardEditor.js` on mount
    - `FilterBar.js` on mount
- **Method:** `POST`
- **URL source (priority order):**
  1. Settings Panel → Data Source tab → **Schema URL** field (`dataSource.schemaUrl`)
  2. Environment variable `REACT_APP_DATABASE_SCHEMA_URL` (baked in at build time)
- **Database name:** appended to the URL as a path segment when provided via Settings Panel → **Database Name** field (`dataSource.databaseName`)

### Request

```
POST {schemaUrl}/{databaseName}
Content-Type: application/json

{
  "connectionString": "Server=tcp:myserver.database.windows.net,1433;Initial Catalog=MyDatabase;..."
}
```

If no database name is configured the path segment is omitted:

```
POST {schemaUrl}
```

### Required response shape

```json
{
  "tables": {
    "Customers": ["CustomerId", "Name", "Email", "CreatedDate"],
    "Orders":    ["OrderId", "CustomerId", "Amount", "OrderDate", "Status"],
    "Products":  ["ProductId", "Name", "Category", "Price", "StockQty"]
  }
}
```

Each key under `tables` is a table name; its value is an ordered array of column name strings.

**On error:** Return any non-2xx status. The designer will log the error and fall back to the built-in sample data (sales_data, product_trends, customer_growth, performance_metrics, regional_sales).

---

## Environment variables summary

| Variable | Used by | Purpose |
|----------|---------|---------|
| `REACT_APP_DEFAULT_GLOBAL_SETTINGS_URL` | `globalSettingsService.js` | Default global settings endpoint URL |
| `REACT_APP_DATABASE_CONNECTION_STRING` | `SettingsPanel.js` | Pre-fills the connection string field |
| `REACT_APP_DATABASE_SCHEMA_URL` | `dataService.js` | Default schema endpoint URL |
