# Join Data Sources Plan

## Core Concept

Named join definitions live at the dashboard level. They appear in the **table picker alongside real tables** — charts treat them identically to a raw table. No changes to zone config shape.

---

## User Flow

1. Open "Data Sources" panel from the dashboard editor toolbar
2. Create a named data source: e.g. "Orders with Customers"
3. Define base table + joins
4. That name now appears in every chart's table picker
5. Pick columns, set label/value columns — same as any other table

---

## Config Shape

Added to the dashboard document root alongside `zones`:

```json
{
  "dataSources": [
    {
      "id": "ds-uuid-1",
      "name": "Orders with Customers",
      "baseTable": "orders",
      "joins": [
        {
          "type": "LEFT",
          "table": "customers",
          "on": { "left": "orders.customer_id", "right": "customers.id" }
        }
      ]
    },
    {
      "id": "ds-uuid-2",
      "name": "Sales Full Report",
      "baseTable": "sales",
      "joins": [
        {
          "type": "LEFT",
          "table": "products",
          "on": { "left": "sales.product_id", "right": "products.id" }
        },
        {
          "type": "FULL",
          "table": "regions",
          "on": { "left": "sales.region_id", "right": "regions.id" }
        }
      ]
    }
  ],
  "zones": [...]
}
```

Zone `dataSource` is **unchanged**:

```json
"dataSource": {
  "tableName": "Orders with Customers",
  "labelColumn": "customers.name",
  "valueColumn": "orders.total"
}
```

The `tableName` is just the name of either a real table or a named data source.

---

## Join Types

| Type | Behaviour |
|------|-----------|
| `INNER` | Only rows with matches on both sides |
| `LEFT` | All left rows; nulls for unmatched right |
| `RIGHT` | All right rows; nulls for unmatched left |
| `FULL` | All rows from both sides; nulls where no match |

---

## Column Naming

Columns with the same name in multiple tables get prefixed: `tablename.columnname`.  
Unambiguous columns stay unprefixed.

Example: joining `orders` + `customers` where both have `id`:
- `orders.id`, `customers.id` — prefixed
- `orders.total`, `customers.name` — no prefix needed

---

## Execution: Client-Side Hash Join

Backend API unchanged. Tables fetched individually (existing `fetchQueryData` + cache), joined in memory.

```
Build phase:  hash right table rows on join key → Map<key, row[]>
Probe phase:  iterate left rows, lookup key in Map

INNER: emit merged row only if match found
LEFT:  emit merged row if match; else emit left row with nulls for right cols
RIGHT: emit right-only rows after probe pass (unmatched right rows)
FULL:  LEFT result + unmatched right rows with nulls for left cols
```

3+ table joins chain: result of first join becomes the left side of the next.

Performance ceiling: ~5k rows per table before noticeable lag. Suitable for dashboards, not ETL.

---

## Files to Change

### `types/schema.js`
- Add `dataSources: []` to `createInitialDashboard()`
- No changes to zone config

### `dataService.js`
- Add `dataSources` registry: `setDashboardDataSources(dataSources)` called when dashboard loads
- `fetchQueryData(tableName)` checks registry first — if name matches a data source definition, runs join and returns merged rows (cached under the data source name)
- `getAvailableTables()` returns real tables + data source names
- `getTableColumns(name)` for a data source: derives column list from first cached result row (populated after first fetch); before first fetch, derives from union of each join table's known columns

### New: `DataSourcePanel.js`
- Slide-in panel (same pattern as SecurityPanel)
- List of named data sources with add / edit / delete
- Editor per data source:
  - Name field
  - Base table picker (real tables only)
  - Join list: each row has join type dropdown, table picker, left column picker, right column picker
  - Add join / remove join buttons
- Changes saved back to dashboard via `onDashboardUpdate`

### `DashboardEditor.js`
- Pass `dashboard.dataSources` to `setDashboardDataSources` in data service on load and on change
- Add "Data Sources" toolbar button that opens `DataSourcePanel`

### `PropertyPanel.js`
- No structural changes — table picker already uses `getAvailableTables()`, so named data sources appear automatically once registered

---

## Data Flow (After Implementation)

```
Dashboard loads
  → DashboardEditor calls setDashboardDataSources(dashboard.dataSources)
  → dataService registers join definitions under their names

Chart renders
  → fetchChartData("Orders with Customers", ...)
  → fetchQueryData("Orders with Customers")
      → matches registry entry
      → fetchQueryData("orders")    [cached after first call]
      → fetchQueryData("customers") [cached after first call]
      → runs LEFT join in memory
      → caches result under "Orders with Customers"
  → returns merged rows
  → chart renders from merged data

User opens FilterBar
  → getUniqueValuesForColumn pulls from queryDataCache
  → works identically — joined table is just another cached table

User opens PropertyPanel on a zone using joined table
  → getAvailableTables() includes "Orders with Customers"
  → getTableColumns("Orders with Customers") returns merged column list
  → column pickers populated normally
```

---

## Out of Scope (Not Planned)

- Server-side join execution (would require API + SQL generation changes)
- Aggregate functions (SUM, COUNT, GROUP BY) — separate feature
- Many-to-many join guards (result explosion) — user responsibility for now
- Cross-datasource joins (different API endpoints) — out of scope
