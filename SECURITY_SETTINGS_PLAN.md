# Security Settings — Implementation Plan

## Overview

Add a **Security Settings** panel to the Holograph designer that lets admins configure role-based access rules for datasources, tables, and columns. Rules are persisted via webhooks and consumed by the user's own backend for enforcement. The designer only reads and writes these rules — it does not enforce them.

---

## Rule Format (the canonical contract)

This is the JSON structure the designer writes and reads. Backend systems should implement their enforcement against this format.

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "datasource": "sales_db",
      "tableName": null,
      "columnName": null,
      "roles": ["admin", "analyst"],
      "description": "Entire sales_db — admin and analyst only",
      "createdAt": "2026-04-06T12:00:00.000Z",
      "updatedAt": "2026-04-06T12:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "datasource": "sales_db",
      "tableName": "customers",
      "columnName": null,
      "roles": ["sales_team", "admin"],
      "description": "Customers table — sales team and admin",
      "createdAt": "2026-04-06T12:00:00.000Z",
      "updatedAt": "2026-04-06T12:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "datasource": "sales_db",
      "tableName": "customers",
      "columnName": "ssn",
      "roles": ["hr_admin"],
      "description": "SSN column — HR admin only",
      "createdAt": "2026-04-06T12:00:00.000Z",
      "updatedAt": "2026-04-06T12:00:00.000Z"
    }
  ]
}
```

### Granularity logic

| `datasource` | `tableName` | `columnName` | Scope applied to |
|---|---|---|---|
| ✅ set | `null` | `null` | All tables and columns in that datasource |
| ✅ set | ✅ set | `null` | All columns in that table |
| ✅ set | ✅ set | ✅ set | That specific column only |

### Precedence note for backend implementors

More specific rules should take precedence over broader ones. Recommended interpretation:

1. Column-level rule overrides table-level rule for that column
2. Table-level rule overrides datasource-level rule for that table
3. Roles are additive within a given scope level — a user needs to match at least one role in the applicable rule

Enforcement strategy (additive vs. deny-by-default) is left entirely to the backend.

---

## Webhook Endpoints

Two new URLs, configured in the Security panel:

| Setting key | Method | Purpose |
|---|---|---|
| `securitySaveUrl` | `POST` | Save the complete rules list (full replace) |
| `listSecurityUrl` | `GET` | Load the current rules list |

### POST payload (to `securitySaveUrl`)

The full `{ version, rules }` object shown above is sent as the request body. The backend should replace its stored rules with this list.

**Expected response:**
```json
{ "success": true }
```

### GET response (from `listSecurityUrl`)

Should return the same `{ version, rules }` object.

**Expected response:**
```json
{
  "version": "1.0",
  "rules": [ ...same rule objects... ]
}
```

---

## Files to Create/Modify

### 1. New — `src/components/SecurityPanel.js`

Self-contained modal/drawer (styled like `SettingsPanel`) with three sections:

**Top — Webhook URLs**
- `listSecurityUrl` input — GET endpoint to load rules
- `securitySaveUrl` input — POST endpoint to save rules
- Refresh button (calls GET) and Save All button (calls POST)

**Middle — Rules Table**

Each row represents one rule. Columns:

| Resource Path | Scope Badge | Roles | Description | Actions |
|---|---|---|---|---|
| `sales_db` | [Datasource] | admin, analyst | ... | Edit / Delete |
| `sales_db.customers` | [Table] | sales_team, admin | ... | Edit / Delete |
| `sales_db.customers.ssn` | [Column] | hr_admin | ... | Edit / Delete |

- **Resource Path** — auto-computed as `datasource`, `datasource.table`, or `datasource.table.column`
- **Scope Badge** — color-coded chip: blue=Datasource, green=Table, orange=Column
- **Roles** — displayed as removable chips (tags); edited via the Role Tag Input (see below)

**Bottom toolbar — Add Rule button**

Clicking "Add Rule" appends a blank editable row inline. Fields:
- Datasource (required text input)
- Table name (optional text input — leave blank for datasource scope)
- Column name (optional text input — leave blank for table scope; only enabled if Table is filled)
- Roles (Role Tag Input — see below)
- Description (optional text input)
- ✓ confirm / ✕ cancel buttons

---

### Role Tag Input Component

Used everywhere roles are entered (rule rows, inline add form, and the preview role dropdown).

#### Behaviour

1. **Existing chips** — each already-added role renders as a dismissible chip to the left of the text cursor inside the input box. Clicking ✕ on a chip removes it.

2. **Typing triggers autocomplete** — the suggestion dropdown appears as soon as the user types at least one character. It is populated from **all unique role names already present in any rule across the entire rules list** (the global role vocabulary).

3. **Suggestion filtering** — the list filters in real time to roles whose names start with (or contain) the current input text, case-insensitive. Matching characters are bolded in the suggestion list.

4. **Divergence behaviour** — when the typed text no longer matches any existing role, the suggestion list either:
   - Collapses entirely, OR
   - Shows a single entry: `＋ Add "[typed text]" as new role` at the bottom
   Both options are acceptable; the `＋ Add` entry is preferred for discoverability.

5. **Committing a role** — a role is added (and the text field cleared) when:
   - The user clicks a suggestion in the dropdown
   - The user presses **Enter** or **Tab** with non-empty text (uses the current typed text verbatim, even if it doesn't exist yet — this is how new roles are created)
   - The user types a **comma** (`,`) — the text before the comma is committed and the comma is consumed

6. **Keyboard navigation** — **↑ / ↓** arrows move focus through the suggestion list; **Escape** closes the dropdown without committing; **Backspace** on an empty text field removes the last chip.

7. **No duplicates** — if the user tries to add a role already in the current rule's chip list, it is silently ignored (or a brief shake animation on the existing chip).

#### Visual layout

```
┌─────────────────────────────────────────────────────┐
│  [admin ✕]  [sales_team ✕]  viewer_          ▾     │  ← input box (chips + text cursor together)
└─────────────────────────────────────────────────────┘
         ┌──────────────────────────┐
         │  viewer                  │  ← exact match bolded
         │  viewer_readonly         │
         │  ＋ Add "viewer_" …      │  ← shown when text diverges
         └──────────────────────────┘
```

The input box looks like a standard text field but contains chips inline. The whole box is clickable to focus the hidden text input. Width expands with content or fills the available column width.

#### Implementation notes

- **Self-contained component** — `src/components/RoleTagInput.js`, accepts:
  - `value: string[]` — current roles for this rule
  - `onChange: (roles: string[]) => void`
  - `allRoles: string[]` — global vocabulary (derived from all rules, passed down from parent)
  - `placeholder?: string` (default: `"Add role…"`)
- **`allRoles` derivation** — computed once in `SecurityPanel` via `useMemo`:
  ```js
  const allRoles = useMemo(() =>
    [...new Set(rules.flatMap(r => r.roles))].sort(),
  [rules]);
  ```
- The same `RoleTagInput` is reused in the preview security toolbar's role dropdown (single-select mode — selecting a role immediately triggers the preview, no chips needed there; a standard styled `<select>` or a simplified single-value version of the component is acceptable for that context).

---

### 2. Modified — `src/services/webhookService.js`

Add to `webhookUrls`:
```js
securitySaveUrl: '',
listSecurityUrl: '',
```

Add two exported functions:

**`invokeSaveSecurityRules(rules)`**
- POST `{ version: '1.0', rules }` to `securitySaveUrl`
- Falls back to `console.log` (same pattern as `invokeSave`)

**`invokeListSecurityRules()`**
- GET from `listSecurityUrl`
- Returns `{ success, result: { version, rules } }`

Add `configureSecurityWebhookUrls({ securitySaveUrl, listSecurityUrl })` — same pattern as existing `configureWebhookUrls`.

---

### 3. Modified — `src/App.js`

Add state:
```js
const [securityRules, setSecurityRules] = useState([]);
const [showSecurity, setShowSecurity] = useState(false);
const [securityWebhookUrls, setSecurityWebhookUrls] = useState({
  securitySaveUrl: '',
  listSecurityUrl: '',
});
```

Add handlers:
- `handleSaveSecurityRules(rules)` — calls `invokeSaveSecurityRules`, updates local state
- `handleRefreshSecurityRules()` — calls `invokeListSecurityRules`, updates local state
- `handleSecurityUrlsSave(urls)` — calls `configureSecurityWebhookUrls`, persists to state

Add `SecurityPanel` to the render tree (alongside existing `SettingsPanel`).

Add 🔒 **Security** button:
- In `DashboardList` header actions (global, not per-dashboard — rules apply across all datasources)
- Also accessible from the TopBar editor view for convenience

---

### 4. Modified — `src/components/DashboardList.js`

Add Security button to the header actions row:
```jsx
<button className="btn btn-secondary" onClick={onSecurity}>
  🔒 Security
</button>
```

---

## Access Model Summary for Backend Consumers

When your backend receives the rules list via GET/POST, apply this logic at query time:

```
for each query against datasource D, table T, column C:
  1. Find all rules where rule.datasource === D
  2. Among those, find the most specific applicable rule:
       - column match:  rule.tableName === T && rule.columnName === C  → use this
       - table match:   rule.tableName === T && rule.columnName === null → use this
       - datasource:    rule.tableName === null                         → use this
  3. Check if the requesting user's role is in rule.roles
  4. If no rule matches, apply your default policy (allow-all or deny-all)
```

The designer does not dictate precedence behavior for conflicting rules — that is your backend's responsibility.

---

---

## Security Preview in the Designer

### How zones are matched to rules

Each zone has `dataSource: { tableName, labelColumn, valueColumn }`. The datasource name is taken from `settings.dataSource.databaseName` (global per designer instance). Matching works as follows:

```
zone matches a rule if:
  rule.datasource === settings.dataSource.databaseName
  AND (rule.tableName === null OR rule.tableName === zone.dataSource.tableName)
  AND (rule.columnName === null
       OR rule.columnName === zone.dataSource.labelColumn
       OR rule.columnName === zone.dataSource.valueColumn)
```

A zone is considered "security-restricted" for a given role if **any** matching rule exists and the role is **not** in that rule's `roles` array.

---

### Designer Mode — Passive Lock Indicator

In the editor view (`DashboardEditor`), zones that match at least one security rule always render normally (the admin can always see everything), but carry a visual indicator:

- A small **🔒 lock badge** in the zone card header (right side, next to the title)
- Badge is **muted / secondary color** so it doesn't dominate — it's informational only
- **Hovering** the badge shows a tooltip:
  ```
  Security rules apply to this zone:
  • sales_db.customers → [sales_team, admin]
  • sales_db.customers.ssn → [hr_admin]
  ```
- If no rules match the zone, no badge is shown

This gives the designer author awareness that the zone's data is access-controlled without blocking the editing experience.

**What changes in `DashboardEditor` / `ZoneCard`:**
- Accept `securityRules` as a prop drilled from `App.js`
- Compute `matchingRules = getMatchingRules(zone, securityRules, settings)` per zone
- If `matchingRules.length > 0`, render the lock badge with a tooltip

---

### Preview Mode — Role Simulation Toggle

The `PreviewModal` gets a security toolbar strip between its own header and the grid:

```
┌─────────────────────────────────────────────────────────────┐
│  Preview — My Dashboard                              [✕ Close]│
├─────────────────────────────────────────────────────────────┤
│  🔒 Security Preview  [toggle ON/OFF]   Role: [dropdown ▾]   │
├─────────────────────────────────────────────────────────────┤
│  (grid of charts)                                           │
└─────────────────────────────────────────────────────────────┘
```

- **Toggle OFF (default):** all zones render normally, no security applied
- **Toggle ON:** role dropdown becomes active
  - Dropdown is populated from all unique role names across all security rules
  - An "— select role —" placeholder is shown until a role is chosen

**When Toggle ON + role selected:**

For each zone, compute whether the selected role can access it:

| Zone access for selected role | Rendering |
|---|---|
| No security rules match this zone | Renders normally |
| Rules match AND role IS in `roles` | Renders normally |
| Rules match AND role IS NOT in `roles` | Replaced by restricted placeholder |

**Restricted placeholder (replaces the chart):**
```
┌─────────────────────────────────────────────┐
│           Monthly Revenue              [🔒]  │  ← zone header still visible, grayed
├─────────────────────────────────────────────┤
│                                             │
│        🔒   Access Restricted              │  ← chart area replaced
│    Not visible to role: "viewer"           │
│                                             │
└─────────────────────────────────────────────┘
```

Styling of restricted zones:
- Zone card: `opacity: 0.45`, `filter: grayscale(80%)`
- Chart area replaced with a centered lock icon + message
- Zone header title still readable (so the designer can identify what's hidden)
- A subtle **dashed border** instead of the normal card border

This gives the dashboard author a realistic sense of what each role's view looks like — zones they can't access are visually present but clearly blocked, so the author can understand the layout impact.

---

### Helper function — `getMatchingRules`

A shared utility (can live in a new `src/utils/securityUtils.js`):

```js
/**
 * Returns all security rules that apply to a given zone.
 * @param {Object} zone - zone schema object
 * @param {Array}  rules - full list of security rules
 * @param {Object} settings - app settings (for settings.dataSource.databaseName)
 * @returns {Array} matching rules
 */
export function getMatchingRules(zone, rules, settings) {
  const datasource = settings?.dataSource?.databaseName || '';
  const tableName = zone.dataSource?.tableName || '';
  const cols = [zone.dataSource?.labelColumn, zone.dataSource?.valueColumn].filter(Boolean);

  return rules.filter(rule => {
    if (rule.datasource !== datasource) return false;
    if (rule.tableName !== null && rule.tableName !== tableName) return false;
    if (rule.columnName !== null && !cols.includes(rule.columnName)) return false;
    return true;
  });
}

/**
 * Returns true if the given role can access the zone (or if no rules apply).
 */
export function canRoleAccessZone(zone, rules, settings, role) {
  const matching = getMatchingRules(zone, rules, settings);
  if (matching.length === 0) return true;
  return matching.every(rule => rule.roles.includes(role));
}
```

---

### Additional files affected

| File | Change |
|---|---|
| `src/utils/securityUtils.js` | New — `getMatchingRules`, `canRoleAccessZone` helpers |
| `src/components/PreviewModal.js` | Add security toolbar strip; accept `securityRules` + `settings` props; render restricted placeholders |
| `src/components/DashboardEditor.js` | Pass `securityRules` + `settings` down to zone cards |
| `src/components/ZoneCard.js` (or wherever zone headers render) | Render lock badge if `matchingRules.length > 0` |
| `src/App.js` | Pass `securityRules` + `settings` to `PreviewModal` and `DashboardEditor` |

---

## What is NOT in scope (designer side)

- The designer does not validate that datasource/table/column names exist
- The designer does not enforce these rules on live chart data in the editor
- The designer does not authenticate users against roles
- No per-dashboard security rules — rules are global across all datasources
- Column-level rules in preview hide the **entire zone** (not individual columns within a chart) since chart zones reference at most two columns and partial data would be misleading

---

## Implementation Order

1. Add webhook functions to `webhookService.js`
2. Create `src/utils/securityUtils.js` (matching helpers)
3. Create `src/components/RoleTagInput.js` (tag input with autocomplete)
4. Create `SecurityPanel.js` (uses `RoleTagInput`)
5. Wire into `App.js` (state + handlers + render)
6. Add Security button to `DashboardList.js` and TopBar
7. Add lock badge to zone cards in `DashboardEditor`
8. Add security toolbar + restricted placeholder rendering to `PreviewModal` (reuses `RoleTagInput` in single-select mode for the role picker)
