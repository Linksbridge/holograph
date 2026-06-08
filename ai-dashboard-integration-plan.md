# AI Dashboard Integration Plan

## Goal

Enable `DashboardViewer` to accept a dashboard JSON delivered by an AI API — mount without a config, re-render cleanly when new JSON arrives.

---

## What Already Works

- Zone `useEffect` re-fetches data when `tableName` / `labelColumn` / `valueColumn` change — AI swapping those in triggers fresh fetches automatically
- `layout` memo responds to `dashboard?.zones` changes
- React re-renders viewer whenever `dashboard` prop reference changes

---

## Changes Required

### 1. Null dashboard → idle state
**File:** `packages/viewer/src/DashboardViewer.js` line 370

Currently renders an error string when `dashboard` is null. Change to a neutral idle state so the viewer mounts, initializes the data service, and is ready to render the moment the AI responds.

```jsx
// Before
if (!dashboard) {
  return (
    <div className={`dashboard-viewer ${className}`}>
      <div className="viewer-error">No dashboard schema provided</div>
    </div>
  );
}

// After
if (!dashboard) {
  return (
    <div className={`dashboard-viewer ${className}`} ref={containerRef}>
      <div className="viewer-empty-state">
        <p>Waiting for dashboard…</p>
      </div>
    </div>
  );
}
```

---

### 2. Clear query cache on new dashboard
**File:** `packages/viewer/src/services/dataService.js`

`queryDataCache` caches rows by table name. If two AI responses use the same table name but a different `dataQueryUrl`, the second response gets the first one's cached rows.

Export a new function:

```js
export const clearQueryDataCache = () => {
  queryDataCache = {};
  uniqueValuesCache = {};
};
```

**File:** `packages/viewer/src/DashboardViewer.js`

Add a `useEffect` that fires when the dashboard changes:

```js
useEffect(() => {
  if (!dashboard) return;
  clearQueryDataCache();
  if (dashboard.dataQueryUrl) {
    setDataQueryUrl(dashboard.dataQueryUrl);
  }
}, [dashboard]);
```

Import `clearQueryDataCache` and `setDataQueryUrl` from `dataService`.

---

### 3. Read `dataQueryUrl` from dashboard object
**File:** `packages/viewer/src/DashboardViewer.js`

The designer already stores `dataQueryUrl` in the dashboard schema (via settings). The viewer currently ignores it — data fetches always go to whatever URL was set at init time. The `useEffect` in change 2 above covers this by calling `setDataQueryUrl(dashboard.dataQueryUrl)` when a new dashboard arrives.

No additional code change beyond what is described in change 2.

---

### 4. Schema normalization guard
**File:** `packages/viewer/src/DashboardViewer.js`

AI responses can be incomplete or malformed. Normalize before rendering to prevent crashes:

```js
const normalizeDashboard = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    ...raw,
    zones: Array.isArray(raw.zones)
      ? raw.zones.filter(z => z && z.id)
      : [],
  };
};
```

Apply in the component:

```js
const normalizedDashboard = useMemo(() => normalizeDashboard(dashboard), [dashboard]);
```

Then use `normalizedDashboard` everywhere `dashboard` is referenced inside the render.

---

## Files Changed

| File | What changes |
|---|---|
| `packages/viewer/src/services/dataService.js` | Export `clearQueryDataCache()` |
| `packages/viewer/src/DashboardViewer.js` | Idle state, cache-clear effect, dataQueryUrl wiring, normalization |
| `README.md` | Note `dashboard` prop is now optional; document `dataQueryUrl` field |

## Files Not Changed

| File | Reason |
|---|---|
| Zone data fetching | Already reactive to prop changes |
| `layout` memo | Already reactive to `dashboard?.zones` |
| File sources | Already a separate prop, no change needed |

---

## Expected AI JSON Format

The AI API should return standard dashboard schema JSON. Minimum viable shape:

```json
{
  "version": "1.0.0",
  "name": "My AI Dashboard",
  "dataQueryUrl": "https://api.example.com/data",
  "zones": [
    {
      "id": "zone-1",
      "componentType": "chart",
      "library": "chartjs",
      "chartType": "chartjs-bar",
      "title": "Revenue by Region",
      "gridPosition": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "dataSource": {
        "tableName": "sales",
        "labelColumn": "region",
        "valueColumn": "revenue"
      }
    }
  ]
}
```

`dataQueryUrl` is optional — if omitted, the viewer uses whatever URL was configured at init time.
