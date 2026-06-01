# Holograph Webhook Configuration

Settings panel lives at: **Dashboard Settings → Save Locations tab**

---

## Webhook URLs

### Global Settings URL
- **Method:** GET
- **Purpose:** Centralized config source — returns shared webhook URLs + database defaults
- **When set:** overrides all individual webhook fields below (fills empty ones)
- **Env var fallback:** `REACT_APP_DEFAULT_GLOBAL_SETTINGS_URL`

### List Documents URL
- **Method:** GET
- **Purpose:** Fetch all saved dashboards (returns array of full dashboard objects)
- **Called:** on app load and after settings save
- **Response shape:** `{ dashboards: [{ id, name, status, lastModified, schema, zones, ... }] }`

### Data Query URL
- **Method:** POST
- **Purpose:** Fetch chart and table data at runtime
- **Note:** datasource name is appended as path segment — e.g. `/api/data/myDatasource`

### Save Draft URL
- **Method:** POST
- **Purpose:** Persist dashboard as draft
- **Also used for:** Edit Published (creates draft copy), Duplicate (new id)
- **Payload:** full dashboard object with `status: 'draft'`

### Publish URL
- **Method:** POST
- **Purpose:** Persist dashboard as published
- **Payload:** full dashboard object with `status: 'published'`

---

## Security Webhook URLs

Configured separately in the Security panel (not Save Locations tab).

### List Security URL
- **Method:** GET
- **Purpose:** Fetch role-based access rules
- **Response shape:** `{ rules: [...], availableRoles: [...] }`

### Security Save URL
- **Method:** POST
- **Purpose:** Persist role-based access rules
- **Payload:** `{ rules: [...], availableRoles: [...] }`

---

## URL Template Variables

Any URL can contain `{id}`, `{name}`, or `{status}` — replaced and URI-encoded at call time.

```
https://api.example.com/dashboards/{id}/save  →  .../dashboards/dash-abc123/save
```

---

## Config Priority (highest → lowest)

1. Global Settings URL response (remote JSON, fetched on load)
2. User-entered values in SettingsPanel (saved to localStorage)
3. Environment variable defaults (`REACT_APP_*`)

If Global Settings URL is set, it populates any **empty** fields — it won't overwrite values the user has already entered.
