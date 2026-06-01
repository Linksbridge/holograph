# Excel / CSV as a Data Source — Feasibility Review

## Short Answer

High feasibility. Two viable paths, different tradeoffs.

---

## Path A — Backend Handles It (recommended first step)

A new Azure Function accepts file uploads, parses them, and serves data via the existing webhook format the designer already speaks.

**How it works:**
- User uploads file to new endpoint (once)
- Endpoint parses Excel/CSV, stores rows in Azure Table Storage
- Designer points `dataQueryUrl` at it — file appears as a named table
- No frontend code changes needed

**New endpoint behavior:**
```
GET {dataQueryUrl}/my-sheet-name        → { "rows": [...] }
GET {schemaUrl}                         → { "tables": { "my-sheet-name": { "columns": [...] } } }
```

**What to build:**
1. `upload-file` Azure Function — accepts multipart POST, parses CSV/Excel, stores in Table Storage
2. `file-schema` Azure Function — returns table/column names for uploaded files
3. Extend existing `webhook-list` or add new endpoint to serve rows

**Tradeoff:** Upload step happens outside the designer UI. File lives on the server, not embedded in the dashboard.

---

## Path B — Client-Side File Upload in Designer

User uploads a file directly inside the designer. Browser parses it. Data is registered as a named data source alongside existing named joins.

**What needs to change:**

| Area | Change |
|---|---|
| `SettingsPanel.js` | New "Upload File" section with drag-and-drop |
| `dataService.js` line ~356 | Register parsed rows alongside named join definitions |
| Dependencies | Add Papa Parse (CSV) and optionally SheetJS (Excel) |
| Dashboard schema | Decision needed on where parsed data lives (see below) |

**The hard part — where does data live?**

| Option | Pro | Con |
|---|---|---|
| Embed rows in dashboard schema | Self-contained, saves with dashboard | Bloats payload — bad for large files |
| Upload to backend, reference by ID | Clean, lean schema | Still needs a backend endpoint |
| localStorage only | Simple, no backend | Lost on refresh, not shareable between users |

For CSV with small row counts (< 500 rows), embedding in the schema is workable. For Excel files or anything larger, backend storage is the right call.

**Libraries:**
- [Papa Parse](https://www.papaparse.com/) — CSV parsing, well-maintained, lightweight
- [SheetJS (xlsx)](https://sheetjs.com/) — Excel parsing, but adds significant bundle weight (~500kb)

---

## Recommendation

**Phase 1 — Path A only.**
One new Azure Function, zero frontend changes. Works immediately. Users get a permanent named table they can reference in any dashboard.

**Phase 2 — Path B for small CSVs.**
Client-side Papa Parse in the designer. Cap embedded rows at 500. Skip client-side Excel (SheetJS bundle weight not worth it — tell users to export as CSV first).

The designer architecture handles this cleanly. `dataService.js` already has a named join registry — CSV data slots into the same pattern without touching chart or table components.

---

## Integration Points (if building Path B)

- [dataService.js](packages/designer/src/services/dataService.js) — register parsed rows in `joinDefinitions` map
- [SettingsPanel.js](packages/designer/src/components/SettingsPanel.js) — new upload UI in Save Locations or Data Source tab
- [packages/viewer/src/services/dataService.js](packages/viewer/src/services/dataService.js) — same change needed so published dashboards render correctly
