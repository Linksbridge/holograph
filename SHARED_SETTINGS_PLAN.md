# Shared Settings Implementation Plan

## Overview
Design a system for shared settings that when updated by an admin, are immediately available to all users of the designer site.

## Architecture Options

### Option 1: Simple Database Table Approach (Recommended)
```
Frontend (React) → Azure Functions → Azure SQL/Table Storage → All Users Updated
```

**How it works:**
- Store global settings in a dedicated table/container (`GlobalSettings`)
- Create 2 new Azure Functions:
  - `GET /api/settings/global` - Retrieves all shared settings
  - `PUT /api/settings/global` - Updates specific settings (admin only)
- Frontend polls for updates every 30 seconds or on app focus
- Settings cached locally for performance

**Benefits:**
- Simple to implement with existing Azure Functions setup
- Works with current Azure SQL + Table Storage infrastructure
- No additional infrastructure needed
- Predictable costs
- Easy to debug and maintain

**Implementation Effort:** Low (1-2 days)

### Option 2: Real-time Push Updates
```
Frontend ←→ SignalR Service ←→ Azure Functions ←→ Storage
```

**How it works:**
- Same storage approach as Option 1
- Add Azure SignalR Service for real-time updates
- When admin changes settings → Function updates storage → SignalR pushes to all connected users
- Users get instant updates without polling

**Benefits:**
- Instant updates across all users
- Better user experience
- More efficient than polling
- Supports real-time collaboration features

**Drawbacks:**
- Additional Azure service cost (~$1-5/month)
- More complex setup and debugging
- Need connection management

**Implementation Effort:** Medium (3-5 days)

### Option 3: Event-Driven with Service Bus
```
Admin Updates → Function → Service Bus → All User Sessions Notified
```

**How it works:**
- Settings stored in database as before
- Use Azure Service Bus topics for broadcasting changes
- Each user session subscribes to settings updates
- Functions publish setting changes to the topic

**Benefits:**
- Highly scalable
- Reliable message delivery
- Can extend for other notifications

**Drawbacks:**
- Overkill for simple settings
- Higher complexity and cost
- Service Bus learning curve

**Implementation Effort:** High (1-2 weeks)

## Recommended Implementation Plan

### Phase 1: Basic Shared Settings (Option 1)
**Duration:** 1-2 days

1. **Backend (Azure Functions)**
   - Add `GlobalSettings` table to existing Azure Table Storage
   - Create `global-settings` function with GET/PUT endpoints
   - Implement role-based access control

2. **Frontend Integration**
   - Create `globalSettingsService.js` for API calls
   - Add caching and periodic refresh logic
   - Update existing `SettingsPanel` with "Global Settings" tab (admin only)

3. **Settings Categories**
   ```json
   {
     "theme": {
       "primaryColor": "#007acc",
       "accentColor": "#00bcf2", 
       "mode": "light"
     },
     "defaults": {
       "chartLibrary": "chartjs",
       "autoSave": true,
       "autoSaveInterval": 30,
       "gridSnapSize": 10
     },
     "security": {
       "allowPublicDashboards": false,
       "requireApprovalForPublish": true,
       "sessionTimeout": 1800000
     },
     "dataSource": {
       "allowedTypes": ["azure-sql", "postgresql", "mysql"],
       "defaultConnectionTimeout": 30000,
       "enableQueryCache": true
     }
   }
   ```

### Phase 2: Enhanced User Experience (Optional)
**Duration:** 2-3 days

1. **Automatic Theme Application**
   - Apply global theme settings to CSS variables
   - Override user preferences with global ones where applicable

2. **Smart Defaults**
   - Use global defaults for new dashboard creation
   - Show global restrictions in UI (e.g., hide disabled database types)

3. **Change Notifications**
   - Toast notifications when global settings change
   - Visual indicators for settings that are globally controlled

### Phase 3: Real-time Updates (Optional Enhancement)
**Duration:** 3-5 days

1. **Add Azure SignalR Service**
   - Set up SignalR hub for settings broadcasts
   - Create connection management in frontend

2. **Real-time Broadcasting**
   - Modify settings function to broadcast changes
   - Update frontend to listen for real-time updates

## Technical Specifications

### Database Schema (Azure Table Storage)
```
Table: GlobalSettings
PartitionKey: "global"
RowKey: settingCategory (e.g., "theme", "defaults", "security")
Properties:
  - value: JSON string of setting values
  - lastModified: ISO timestamp
  - modifiedBy: user identifier
  - version: increment for optimistic concurrency
```

### API Endpoints
```
GET /api/settings/global
- Returns all global settings
- Available to all authenticated users

PUT /api/settings/global
- Updates specific setting category
- Requires admin role
- Body: { settingKey: "theme", value: {...}, modifiedBy: "admin@company.com" }

DELETE /api/settings/global?key=settingKey
- Removes a global setting
- Requires admin role
```

### Frontend Service Architecture
```javascript
// globalSettingsService.js
class GlobalSettingsService {
  - cache: Map for performance
  - subscribers: Set for change notifications
  - fetchInterval: 30s for polling
  - getAllSettings()
  - getSetting(key, defaultValue)
  - updateSetting(key, value, modifiedBy)
  - subscribe(callback)
}
```

### Role-Based Access Control
- **Regular Users**: Read-only access to global settings
- **Admins**: Can view and modify global settings
- **Super Users**: Full access including deletion
- Settings take effect immediately for new actions
- Existing dashboards maintain their settings until modified

### Caching Strategy
- **Frontend**: 30-second cache with force refresh option
- **Backend**: Consider Azure Redis Cache for high-traffic scenarios
- **Invalidation**: Manual refresh button + automatic refresh on visibility change

## Security Considerations

1. **Authentication**: Use existing auth system
2. **Authorization**: Role-based access to modification endpoints
3. **Audit Trail**: Log all setting changes with user and timestamp
4. **Validation**: Server-side validation of setting values
5. **Rate Limiting**: Prevent abuse of settings endpoints

## Testing Strategy

1. **Unit Tests**: Settings service logic and validation
2. **Integration Tests**: Azure Functions endpoints
3. **UI Tests**: Settings panel interactions
4. **Load Tests**: Multiple users polling for settings
5. **Security Tests**: Role-based access enforcement

## Deployment Considerations

1. **Environment Variables**: Keep sensitive settings in Azure Key Vault
2. **Rollback Plan**: Version settings for easy rollback
3. **Migration**: Scripts for moving existing settings to new structure
4. **Monitoring**: Application Insights for settings usage patterns

## Cost Estimates (Option 1)

- **Azure Table Storage**: <$1/month for settings storage
- **Azure Functions**: Consumption tier, ~$2-5/month for settings calls
- **Total Additional Cost**: ~$3-6/month

## Success Metrics

1. **Functionality**: All users see updated settings within 30 seconds
2. **Performance**: Settings load in <500ms
3. **Reliability**: 99.9% uptime for settings service
4. **User Experience**: Admins can update settings in <3 clicks
5. **Adoption**: Global settings reduce support tickets about inconsistent defaults

## Future Enhancements

1. **Setting Templates**: Predefined setting combinations for different use cases
2. **User Group Settings**: Different settings for different user groups
3. **A/B Testing**: Gradually roll out setting changes
4. **Import/Export**: Settings backup and restore functionality
5. **Change History**: Detailed audit log with rollback capability

## Implementation Priority

**Must Have (Phase 1):**
- Basic global settings storage and retrieval
- Admin interface for settings management
- Theme and default preferences

**Should Have (Phase 2):**
- Automatic theme application
- Smart defaults and restrictions
- Change notifications

**Nice to Have (Phase 3):**
- Real-time updates via SignalR
- Advanced role-based permissions
- Settings versioning and rollback