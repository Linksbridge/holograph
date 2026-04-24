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

### Actual response shape (observed)

The live endpoint returns a double-nested structure — the outer `settings` object wraps another `success`/`settings` pair:

```json
{
  "success": true,
  "settings": {
    "success": true,
    "settings": {
      "database": {
        "defaultDatabaseName": "Sandbox-Frontend",
        "connectionStringTemplate": "Server=tcp:sqlsvr-prod.database.windows.net,1433;Initial Catalog=Sandbox-Frontend;Authentication=Active Directory Managed Identity;User Id=<identity-guid>;Encrypt=True;",
        "defaultServer": "sqlsvr-prod.database.windows.net",
        "defaultTimeout": 60
      },
      "dataSource": {
        "defaultType": "azure-sql",
        "allowedTypes": ["azure-sql", "postgresql"],
        "queryTimeout": 30000,
        "enableCaching": true
      }
    }
  },
  "lastModified": "2026-04-24T21:02:04.537Z",
  "timestamp": "2026-04-24T21:02:04.537Z"
}
```

The designer handles this automatically — if `data.settings.settings` exists it unwraps the inner object before parsing.

**Parsing rules:**
- The response must have `success: true` and a `settings` object, otherwise the designer falls back to hardcoded defaults.
- The `success` key inside `settings` is ignored during parsing; only non-`success` keys are stored.
- Each setting value is read as `setting.value || setting`, so you can either wrap in `{ value: ... }` or return the object directly.
- `lastModified` and `timestamp` at the top level are ignored.

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
- **Connection string source (priority order):**
  1. Settings Panel → Data Source tab → **Connection String** field (`dataSource.connectionString`)
  2. Environment variable `REACT_APP_DATABASE_CONNECTION_STRING` (baked in at build time)
  3. `database.connectionStringTemplate` from the Global Settings response (used automatically on mount if no local value is set)
- **Database name source (priority order):**
  1. Settings Panel → Data Source tab → **Database Name** field (`dataSource.databaseName`)
  2. `database.defaultDatabaseName` from the Global Settings response

### Request

```
POST {schemaUrl}/{databaseName}
Content-Type: application/json

{
  "connectionString": "Server=tcp:sqlsvr-prod.database.windows.net,1433;Initial Catalog=Sandbox-Frontend;Authentication=Active Directory Managed Identity;User Id=<identity-guid>;Encrypt=True;"
}
```

If no database name is configured the path segment is omitted:

```
POST {schemaUrl}
Content-Type: application/json

{
  "connectionString": "..."
}
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
