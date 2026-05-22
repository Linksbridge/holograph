# Holograph Dashboard JSON Schema Reference

This document describes the complete JSON structure for a Holograph dashboard. It is intended as a reference for developers (or AI systems) generating dashboard definitions programmatically.

---

## Top-Level Object

```json
{
  "id": "dashboard-82f87948-3cdd-4d1a-9112-03267ec834df",
  "name": "My Dashboard",
  "description": "Optional description shown as subtitle",
  "status": "draft",
  "lastModified": "2026-05-04T16:24:56.456Z",
  "schema": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier. Format: `dashboard-<uuid>`. Must be unique across all dashboards. |
| `name` | string | Display name shown in the dashboard list and top bar. |
| `description` | string | Optional subtitle shown below the title when `showSubtitle` is true. |
| `status` | string | `"draft"` or `"published"`. Controls availability in the viewer. |
| `lastModified` | string | ISO 8601 timestamp. Set automatically on save/publish. |
| `schema` | object | The full dashboard layout and content definition. See below. |

---

## Schema Object

The `schema` object is the core definition of what the dashboard displays and how it is laid out.

```json
{
  "version": "1.0.0",
  "name": "My Dashboard",
  "description": "",
  "showTitle": true,
  "showSubtitle": true,
  "dataSources": [],
  "layout": { ... },
  "zones": [ ... ]
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | string | `"1.0.0"` | Schema version. Always `"1.0.0"`. |
| `name` | string | — | Dashboard title, duplicated from top-level for self-contained rendering. |
| `description` | string | `""` | Subtitle text. Shown only when `showSubtitle` is true. |
| `showTitle` | boolean | `true` | Whether to render the dashboard title header. |
| `showSubtitle` | boolean | `true` | Whether to render the description below the title. |
| `dataSources` | array | `[]` | Named multi-table join sources. See [Data Sources](#named-data-sources). |
| `layout` | object | — | Grid system configuration. See [Layout](#layout). |
| `zones` | array | — | The charts, tables, images, and text blocks on the dashboard. See [Zones](#zones). |

---

## Layout

Controls the responsive grid system. Zones are positioned within this grid.

```json
{
  "cols": 12,
  "rowHeight": 30,
  "margin": [10, 10],
  "sizingMode": "responsive",
  "breakpoints": {
    "lg": { "cols": 12, "rowHeight": 30 },
    "md": { "cols": 8,  "rowHeight": 40 },
    "sm": { "cols": 4,  "rowHeight": 50 },
    "xs": { "cols": 2,  "rowHeight": 60 }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `cols` | number | Number of grid columns at the default (lg) breakpoint. Almost always `12`. |
| `rowHeight` | number | Pixel height of one grid row at the default breakpoint. |
| `margin` | [number, number] | `[horizontal, vertical]` gap in pixels between zones. |
| `sizingMode` | string | `"responsive"` (scales to container), `"fixed"` (pixel-based), or `"auto"`. |
| `breakpoints` | object | Per-breakpoint column and row-height overrides. Keys: `lg`, `md`, `sm`, `xs`. |

**Grid coordinate system:**
- The grid is `12` columns wide at `lg`. A zone with `w: 6` occupies half the width.
- `x` and `y` are zero-based column/row indices from the top-left.
- Pixel height of a zone = `h × rowHeight + (h - 1) × margin[1]`.

---

## Zones

`zones` is an array of zone objects. Each zone is one panel on the dashboard — a chart, table, image, or rich text block. Zones can be freely positioned and resized on the grid.

### Zone Base Fields

All zone types share these fields:

```json
{
  "id": "zone-<uuid>",
  "componentType": "chart",
  "title": "Monthly Revenue",
  "showHeader": true,
  "theme": "default",
  "legend": {
    "enabled": true,
    "position": "bottom"
  },
  "dataSource": { ... },
  "gridPosition": {
    "x": 0,
    "y": 0,
    "w": 6,
    "h": 4
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique zone identifier. Format: `zone-<uuid>`. |
| `componentType` | string | Determines what is rendered. One of: `"chart"`, `"table"`, `"image"`, `"richtext"`. |
| `title` | string | Displayed in the zone header bar. |
| `showHeader` | boolean | `true` shows the title bar with settings icon. `false` hides it (full bleed content). |
| `theme` | string | Color palette for charts. One of: `"default"`, `"ocean"`, `"sunset"`, `"forest"`, `"monochrome"`. Ignored for `table`, `image`, `richtext`. |
| `legend.enabled` | boolean | Whether to show the chart legend. |
| `legend.position` | string | `"top"`, `"bottom"`, `"left"`, `"right"`, or `"none"`. |
| `dataSource` | object | Where the zone pulls its data from. See [Data Source](#zone-data-source). |
| `gridPosition` | object | Position and size on the grid. See [Grid Position](#grid-position). |

---

### Component Type: `"chart"`

Charts additionally require:

```json
{
  "componentType": "chart",
  "library": "chartjs",
  "chartType": "bar",
  "dataSort": "none",
  "dataSource": {
    "tableName": "sales_data",
    "labelColumn": "month",
    "valueColumn": "revenue"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `library` | string | Rendering engine. `"chartjs"`, `"d3"`, or `"nivo"`. |
| `chartType` | string | Chart shape. Must be valid for the chosen `library`. See table below. |
| `dataSort` | string | Sort applied to chart data before rendering. `"none"`, `"value-asc"`, `"value-desc"`, `"label-asc"`, `"label-desc"`. |

**Valid `library` + `chartType` combinations:**

| `library` | `chartType` value | Display name | Notes |
|-----------|-------------------|--------------|-------|
| `"chartjs"` | `"line"` | Line Chart | |
| `"chartjs"` | `"bar"` | Bar Chart | |
| `"chartjs"` | `"pie"` | Pie Chart | |
| `"chartjs"` | `"doughnut"` | Doughnut Chart | |
| `"chartjs"` | `"radar"` | Radar Chart | |
| `"chartjs"` | `"polarArea"` | Polar Area | |
| `"chartjs"` | `"chartjs_bubblemap"` | Point Map | Geographic bubble map. Requires lat/lon columns. |
| `"d3"` | `"bar"` | D3 Bar | Animated |
| `"d3"` | `"line"` | D3 Line | Animated |
| `"d3"` | `"area"` | D3 Area | Filled area |
| `"d3"` | `"pie"` | D3 Pie | |
| `"d3"` | `"donut"` | D3 Donut | |
| `"d3"` | `"scatter"` | D3 Scatter | |
| `"nivo"` | `"nivo_line"` | Nivo Line | Animated, interactive |
| `"nivo"` | `"nivo_bar"` | Nivo Bar | Animated, interactive |
| `"nivo"` | `"nivo_pie"` | Nivo Pie | Animated, interactive |
| `"nivo"` | `"nivo_choropleth"` | Nivo Choropleth | Geographic heat map. Values mapped to geographic regions by ID. |

---

### Component Type: `"table"`

Tables render a paginated data grid.

```json
{
  "componentType": "table",
  "library": null,
  "chartType": null,
  "dataSource": {
    "tableName": "capacity",
    "labelColumn": "",
    "valueColumn": "",
    "columns": ["product_id", "vaccine", "vaccine_subtype", "company_name"]
  }
}
```

- `library` and `chartType` must be `null`.
- `dataSource.columns` — optional array of column names to display. If omitted or empty, all columns from the table are shown.
- `dataSource.labelColumn` and `valueColumn` are unused for tables; set to `""`.

---

### Component Type: `"image"`

Displays a static image (URL or embedded).

```json
{
  "componentType": "image",
  "library": null,
  "chartType": null,
  "dataSource": {
    "tableName": "",
    "labelColumn": "",
    "valueColumn": ""
  },
  "imageUrl": "https://example.com/logo.png",
  "altText": "Company logo"
}
```

- `library` and `chartType` must be `null`.
- `imageUrl` — the image to display.
- `altText` — accessibility label.
- `dataSource` fields are unused; populate with empty strings.

---

### Component Type: `"richtext"`

Displays formatted text content.

```json
{
  "componentType": "richtext",
  "library": null,
  "chartType": null,
  "dataSource": {
    "tableName": "",
    "labelColumn": "",
    "valueColumn": ""
  },
  "content": "<p>Hello <strong>world</strong></p>"
}
```

- `library` and `chartType` must be `null`.
- `content` — HTML string rendered as-is.
- `dataSource` fields are unused; populate with empty strings.

---

### Zone Data Source

Controls where a zone's data comes from.

```json
{
  "tableName": "sales_data",
  "labelColumn": "month",
  "valueColumn": "revenue",
  "columns": ["col1", "col2"]
}
```

| Field | Type | Used by | Description |
|-------|------|---------|-------------|
| `tableName` | string | chart, table | Name of the SQL table or named join data source to query. |
| `labelColumn` | string | chart | Column whose values become X-axis labels / slice labels. |
| `valueColumn` | string | chart | Column whose values are plotted as the numeric measure. |
| `columns` | string[] | table | Explicit list of columns to display. Omit to show all columns. |

`tableName` can reference either a real database table or a **named join data source** defined in `schema.dataSources`.

---

### Grid Position

Defines where the zone sits on the grid and how large it is.

```json
{
  "x": 0,
  "y": 0,
  "w": 6,
  "h": 4
}
```

| Field | Range | Description |
|-------|-------|-------------|
| `x` | 0 – (cols - w) | Left edge, zero-based column index. |
| `y` | 0+ | Top edge, zero-based row index. Zones below others have higher `y`. |
| `w` | 2 – cols | Width in grid columns. Minimum `2`. |
| `h` | 2+ | Height in grid rows. Minimum `2`. Typical chart is `4`, tall table `8–13`. |

**Placement tips for AI generation:**
- Grid is 12 columns. Two side-by-side zones: `w: 6` each, same `y`, `x: 0` and `x: 6`.
- Three equal zones per row: `w: 4`, `x: 0 / 4 / 8`.
- Zones at the same `y` must not overlap (`x + w` of one ≤ `x` of next).
- Increment `y` by the previous row's `h` to start a new row.

---

## Named Data Sources

`schema.dataSources` defines virtual tables that join multiple real tables. They appear in the table picker identically to real tables.

```json
{
  "dataSources": [
    {
      "id": "<uuid>",
      "name": "Orders with Customers",
      "baseTable": "orders",
      "joins": [
        {
          "id": "<uuid>",
          "type": "LEFT",
          "table": "customers",
          "on": {
            "left": "orders.customer_id",
            "right": "id"
          }
        }
      ]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID for this data source definition. |
| `name` | string | The name used in `dataSource.tableName` to reference this source in zones. |
| `baseTable` | string | Primary/left table in the join. |
| `joins` | array | Ordered list of join clauses applied to `baseTable`. |
| `joins[].type` | string | `"INNER"`, `"LEFT"`, `"RIGHT"`, or `"FULL"`. |
| `joins[].table` | string | The table being joined in. |
| `joins[].on.left` | string | Left key (from base/previous table). Use `table.column` notation. |
| `joins[].on.right` | string | Right key (from the joined table). Column name only. |

Joined table columns are accessed as `joinedTable.columnName` in `labelColumn` / `valueColumn`.

---

## Minimal Complete Example

A dashboard with one Chart.js bar chart and one table, side by side:

```json
{
  "id": "dashboard-00000000-0000-0000-0000-000000000001",
  "name": "Sales Overview",
  "description": "Monthly revenue and product table",
  "status": "draft",
  "lastModified": "2026-05-22T00:00:00.000Z",
  "schema": {
    "version": "1.0.0",
    "name": "Sales Overview",
    "description": "Monthly revenue and product table",
    "showTitle": true,
    "showSubtitle": true,
    "dataSources": [],
    "layout": {
      "cols": 12,
      "rowHeight": 30,
      "margin": [10, 10],
      "sizingMode": "responsive",
      "breakpoints": {
        "lg": { "cols": 12, "rowHeight": 30 },
        "md": { "cols": 8,  "rowHeight": 40 },
        "sm": { "cols": 4,  "rowHeight": 50 },
        "xs": { "cols": 2,  "rowHeight": 60 }
      }
    },
    "zones": [
      {
        "id": "zone-00000000-0000-0000-0000-000000000001",
        "componentType": "chart",
        "library": "chartjs",
        "chartType": "bar",
        "theme": "default",
        "title": "Monthly Revenue",
        "showHeader": true,
        "legend": { "enabled": true, "position": "bottom" },
        "dataSort": "none",
        "dataSource": {
          "tableName": "sales_data",
          "labelColumn": "month",
          "valueColumn": "revenue"
        },
        "gridPosition": { "x": 0, "y": 0, "w": 6, "h": 6 }
      },
      {
        "id": "zone-00000000-0000-0000-0000-000000000002",
        "componentType": "table",
        "library": null,
        "chartType": null,
        "theme": "default",
        "title": "Products",
        "showHeader": true,
        "legend": { "enabled": false, "position": "bottom" },
        "dataSource": {
          "tableName": "products",
          "labelColumn": "",
          "valueColumn": "",
          "columns": ["product_id", "name", "category", "price"]
        },
        "gridPosition": { "x": 6, "y": 0, "w": 6, "h": 6 }
      }
    ]
  }
}
```

---

## Security Rules

Security rules are **not** stored inside the dashboard JSON. They live in a separate config document persisted at the security endpoint (`listSecurityUrl` / `securitySaveUrl` configured in the Security panel).

### Security Config Document

```json
{
  "version": "1.0",
  "availableRoles": ["Level 1", "Level 2", "Level 3", "Level Q"],
  "rules": [
    {
      "id": "<uuid>",
      "datasource": "my_database",
      "tableName": "salary_data",
      "columnName": null,
      "roles": ["Level 3", "Level Q"],
      "description": "Restrict salary table to senior roles",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Always `"1.0"`. |
| `availableRoles` | string[] | Master list of all defined roles. These appear in the role picker when creating rules. Managed via the Security panel — not hard-coded. |
| `rules` | array | Access control rules. See below. |

### Rule Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID for this rule. |
| `datasource` | string | Must match the **database name** configured in Settings (`dataSource.databaseName`). This is how rules are scoped to a deployment. |
| `tableName` | string \| null | Restrict to a specific table. `null` = applies to the entire datasource. |
| `columnName` | string \| null | Restrict to a specific column (requires `tableName`). `null` = applies to the entire table. |
| `roles` | string[] | Roles that **are allowed** access. Must be non-empty for a rule to grant access. |
| `description` | string \| null | Human-readable note. No functional effect. |
| `createdAt` | string | ISO 8601 timestamp. |
| `updatedAt` | string | ISO 8601 timestamp. |

### Rule Granularity

Rules can target three levels of specificity:

| Scope | `tableName` | `columnName` | Matches |
|-------|-------------|--------------|---------|
| Datasource | `null` | `null` | Every zone in the database |
| Table | `"sales_data"` | `null` | Every zone sourced from that table |
| Column | `"sales_data"` | `"revenue"` | Any zone whose `labelColumn` or `valueColumn` is that column |

### Access Logic

When a role is selected in the viewer, each zone is evaluated:

1. Collect all rules where `rule.datasource` matches the configured database name AND `rule.tableName` matches the zone's `tableName` (or is `null`) AND `rule.columnName` is `null` or matches the zone's `labelColumn`/`valueColumn`.
2. If **no rules match** → zone is visible to everyone.
3. If **any rules match** → the viewer's current role must appear in at least one matching rule's `roles` array. If not, the zone is hidden and shown as "Access Restricted".

### Example Scenarios

**Restrict an entire table to senior roles only:**
```json
{
  "datasource": "production_db",
  "tableName": "hr_salaries",
  "columnName": null,
  "roles": ["Level 4", "Level Q"]
}
```

**Hide a sensitive column from junior roles:**
```json
{
  "datasource": "production_db",
  "tableName": "employees",
  "columnName": "salary",
  "roles": ["Level 3", "Level 4", "Level Q"]
}
```

**Lock an entire datasource (all zones) to one role:**
```json
{
  "datasource": "finance_db",
  "tableName": null,
  "columnName": null,
  "roles": ["Level Q"]
}
```

### Important Notes

- Security rules apply at **render time** in the viewer. They do not filter data server-side — they hide entire zones from the UI.
- A zone with no matching rules is **publicly visible** to all roles including unauthenticated viewers.
- Roles are free-form strings. The `availableRoles` list in the config is the canonical set, but any string is valid in a rule's `roles` array.
- The security config is a **global** document — it applies across all dashboards sharing the same endpoint, not per-dashboard.

---

## Quick Reference: Field Cheat Sheet

```
id                  "dashboard-<uuid>"
status              "draft" | "published"
schema.version      "1.0.0"
schema.showTitle    true | false
schema.showSubtitle true | false

zone.componentType  "chart" | "table" | "image" | "richtext"
zone.library        "chartjs" | "d3" | "nivo" | null
zone.chartType      see chart type table above, or null
                    chartjs:  line | bar | pie | doughnut | radar | polarArea | chartjs_bubblemap
                    d3:       bar | line | area | pie | donut | scatter
                    nivo:     nivo_line | nivo_bar | nivo_pie | nivo_choropleth
zone.theme          "default" | "ocean" | "sunset" | "forest" | "monochrome"
zone.dataSort       "none" | "value-asc" | "value-desc" | "label-asc" | "label-desc"
zone.showHeader     true | false
zone.legend.position "top" | "bottom" | "left" | "right" | "none"

gridPosition.x      0..11
gridPosition.y      0..N
gridPosition.w      2..12
gridPosition.h      2..N  (4 = typical chart, 6-13 = table)

--- Security (separate doc, not in dashboard JSON) ---
security.version          "1.0"
security.availableRoles   string[]
rule.datasource           must match Settings > database name
rule.tableName            string | null
rule.columnName           string | null  (requires tableName)
rule.roles                string[]  (who CAN access)
```
