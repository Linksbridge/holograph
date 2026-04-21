# Security & Visibility Design Patterns

## Overview

This document explores approaches for incorporating Row Level Security (RLS) and visibility controls into the dashboard designer without creating tight coupling to the consuming app's 6-level security model (levels 1-6).

---

## Core Principle: Separation of Concerns

The key insight is that **design-time configuration** (what designers set) should be separate from **runtime enforcement** (what the consuming app applies). This allows:

- Designers to express intent without knowing security internals
- Consuming apps to map their security model to the designer's configuration
- Flexibility to change security models without breaking dashboards

---

## Pattern 1: Capability-Based Security

### Concept
Define abstract **capabilities** or **permissions** that designers can assign to elements. The consuming app maps its security levels to these capabilities.

### Implementation

```json
{
  "elementId": "chart-1",
  "security": {
    "capabilities": ["view_revenue", "edit_revenue"],
    "requireAll": false
  }
}
```

### Designer Experience
- Designer selects from a predefined list of capabilities (e.g., "View Revenue Data", "Edit Charts")
- Capabilities are semantic and business-friendly
- No mention of "security level 1-6"

### Consuming App Mapping
```
Security Level 1 → { view_revenue }
Security Level 3 → { view_revenue, edit_revenue }
Security Level 6 → { view_revenue, edit_revenue, admin_access }
```

### Pros
- Fully decoupled from security levels
- Self-documenting (capabilities describe what you can do)
- Easy to add new capabilities without changing element configs

### Cons
- Requires upfront definition of all capabilities
- Consuming app must maintain the mapping

---

## Pattern 2: Policy Reference Model

### Concept
Designers reference **named policies** that are defined elsewhere. The dashboard only stores the policy name, not the policy logic.

### Implementation

```json
{
  "elementId": "table-1",
  "visibility": {
    "policy": "show_sales_regions"
  },
  "rls": {
    "policy": "filter_by_user_region"
  }
}
```

### Designer Experience
- Dropdown of available policies (populated from the consuming app)
- Policies are created and managed by administrators in the consuming system
- Designer just assigns the appropriate policy

### Pros
- Maximum flexibility - policies can contain complex logic
- Security logic lives where it belongs (in the backend/app)
- Dashboard configs remain clean and simple

### Cons
- Requires tight integration with consuming app to populate policies
- "Magic" - designer may not understand what a policy does

---

## Pattern 3: Tag-Based Access Control

### Concept
Elements are tagged with security-relevant metadata. The consuming app evaluates these tags against user attributes.

### Implementation

```json
{
  "elementId": "chart-revenue",
  "securityTags": ["financial", "regional", "confidential"],
  "visibility": {
    "visibleTo": ["executive", "finance_team"],
    "rls": {
      "filterBy": "user_region"
    }
  }
}
```

### Designer Experience
- Tags are applied to elements (multi-select)
- Tags can be grouped (e.g., "Data Sensitivity", "Department Access")
- RLS rules can be set as key-value pairs

### Pros
- Flexible and expressive
- Tags can be reused across elements
- Supports both coarse (visibility) and fine (RLS) control

### Cons
- RequiresConsuming app to define tag vocabulary
- May need tag management UI

---

## Pattern 4: Role-Based with Custom Roles

### Concept
Introduce **dashboard roles** that are independent of app security levels. Designers assign roles to elements.

### Implementation

```json
{
  "elementId": "chart-quarterly",
  "access": {
    "roles": ["analyst", "manager"],
    "minimumRole": "analyst"
  },
  "columnVisibility": {
    "roles": {
      "salary_data": ["hr_manager", "executive"],
      "department": ["all"]
    }
  }
}
```

### Designer Experience
- Predefined dashboard roles (configurable by admins)
- Role assignment UI with clear names
- Per-column/element role settings

### Pros
- Intuitive mental model
- Supports granular column-level security
- Roles can be mapped flexibly to app security levels

### Cons
- Requires role management
- Mapping complexity moves to configuration

---

## Pattern 5: Condition-Based Rules

### Concept
Elements have **visibility conditions** and **RLS rules** expressed as simple expressions that reference user context.

### Implementation

```json
{
  "elementId": "chart-sales",
  "visibility": {
    "condition": "user.department == 'sales' OR user.level >= 4"
  },
  "rls": {
    "rules": [
      { "field": "region", "operator": "equals", "value": "user.region" },
      { "field": "is_confidential", "operator": "equals", "value": false }
    ]
  }
}
```

### Designer Experience
- Rule builder UI (field → operator → value)
- Reference `user.*` for current user context
- Predefined operators (equals, contains, greaterThan, in, etc.)

### Pros
- Very flexible
- No need to predefine roles/capabilities
- Rules are self-contained in dashboard

### Cons
- More complex UI for designers
- Security logic embedded in dashboard config (may or may not be desired)
- Requires careful escaping/validation

---

## Pattern 6: Hybrid Approach (Recommended)

Combine multiple patterns for maximum flexibility:

### Structure

```json
{
  "elements": [
    {
      "id": "chart-revenue",
      "type": "chart",
      "security": {
        "capability": "view_revenue",
        "visibilityPolicy": "revenue_visibility",
        "rlsPolicy": "revenue_rls"
      },
      "columnConfig": {
        "columns": [
          { "id": "total_revenue", "visibleTo": ["finance", "executive"] },
          { "id": "projected_revenue", "visibleTo": ["executive"] }
        ]
      }
    },
    {
      "id": "table-orders",
      "type": "table",
      "security": {
        "capability": "view_orders",
        "rls": {
          "field": "user_region",
          "operator": "equals",
          "value": "user.region"
        }
      }
    }
  ],
  "metadata": {
    "capabilityDefinitions": [...],
    "policyDefinitions": [...]
  }
}
```

### Designer UI Components

1. **Capability Selector** - Dropdown of available capabilities
2. **Policy Assignment** - List of policies from consuming app
3. **Role-based Access** - Checkboxes for predefined roles
4. **Column Visibility** - Per-column role/capability settings
5. **RLS Rule Builder** - Simple condition builder

### Consuming App Integration

```javascript
// API to get available capabilities/policies
GET /api/security/config

// Response
{
  "capabilities": [
    { "id": "view_revenue", "name": "View Revenue", "description": "Can view revenue data" },
    { "id": "view_orders", "name": "View Orders", "description": "Can view order data" }
  ],
  "policies": [
    { "id": "revenue_visibility", "name": "Revenue Visibility", "type": "visibility" },
    { "id": "revenue_rls", "name": "Revenue RLS", "type": "rls" }
  ],
  "roles": [
    { "id": "executive", "name": "Executive" },
    { "id": "finance", "name": "Finance Team" }
  ]
}
```

---

## Comparison Matrix

| Pattern | Decoupling | Designer Complexity | Flexibility | Column Security |
|---------|------------|---------------------|-------------|-----------------|
| Capability-Based | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★☆☆☆ |
| Policy Reference | ★★★★★ | ★★☆☆☆ | ★★★★★ | ★★★★☆ |
| Tag-Based | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★★★☆ |
| Custom Roles | ★★★☆☆ | ★★★★☆ | ★★★★☆ | ★★★★★ |
| Condition-Based | ★★☆☆☆ | ★★★★★ | ★★★★★ | ★★★★★ |
| Hybrid | ★★★★☆ | ★★★★☆ | ★★★★★ | ★★★★★ |

---

## Recommendations

1. **Start with Policy Reference** for RLS - keeps security logic in the backend
2. **Add Capability-Based** for broad access control
3. **Support Column-Level** settings for tables/charts with sensitive fields
4. **Provide API endpoint** for consuming app to inject its security vocabulary
5. **Version the schema** to allow backward compatibility as patterns evolve

---

## Next Steps

- [ ] Define initial set of capabilities with consuming app team
- [ ] Design API contract for security config
- [ ] Prototype designer UI for security settings
- [ ] Plan database schema for storing security configs
- [ ] Implement runtime evaluation logic
