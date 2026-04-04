# Azure Functions v4 Webhook Templates

Serverless Azure Functions (v4 programming model) for handling dashboard webhooks with Azure Table Storage backend.

## Functions

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| webhook-receiver | POST | `/api/webhook-receiver` | Save dashboard data |
| webhook-list | GET | `/api/webhook-list?id={id}` | List or get dashboard(s) |
| webhook-delete | DELETE | `/api/webhook-delete?id={id}` | Delete dashboard |

## Environment Variables

Set these in your Azure Function App configuration:

| Variable | Description |
|----------|-------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Full storage account connection string |
| `AZURE_STORAGE_TABLE_NAME` | Table name (default: `webhook-events`) |

## Azure Table Storage Schema

### PartitionKey and RowKey Strategy

| Field | Value | Purpose |
|-------|-------|---------|
| `partitionKey` | `dashboard` | Groups all dashboard entities together for efficient querying |
| `rowKey` | `{dashboardId}` | Unique identifier for each dashboard (the dashboard's ID) |

### Entity Structure

Each stored entity contains:

| Field | Type | Description |
|-------|------|-------------|
| `partitionKey` | String | Always `dashboard` |
| `rowKey` | String | The dashboard ID |
| `id` | String | Dashboard identifier (duplicate of rowKey for payload access) |
| `payload` | String | Full dashboard JSON object (stringified) |
| `updatedAt` | DateTime | ISO 8601 timestamp of last update |
| `createdAt` | DateTime | ISO 8601 timestamp of creation |

### Example Entity

```
PartitionKey: "dashboard"
RowKey: "dash-abc123"
id: "dash-abc123"
payload: "{\"id\":\"dash-abc123\",\"name\":\"Sales Overview\",\"widgets\":[...]}"
updatedAt: "2024-01-15T10:30:00.000Z"
createdAt: "2024-01-10T08:00:00.000Z"
```

## Setup Instructions

### 1. Create Azure Storage Account

```bash
az storage account create \
  --name <storage-account-name> \
  --resource-group <resource-group> \
  --location <location> \
  --sku Standard_LRS
```

### 2. Create Table

```bash
az storage table create \
  --name webhook-events \
  --account-name <storage-account-name>
```

### 3. Get Connection String

```bash
az storage account show-connection-string \
  --name <storage-account-name> \
  --resource-group <resource-group> \
  --query connectionString -o tsv
```

### 4. Create Azure Function App

```bash
az functionapp create \
  --resource-group <resource-group> \
  --consumption-plan-location <location> \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name <function-app-name> \
  --storage-account <storage-account-name> \
  --os-type Linux
```

### 5. Configure Environment Variables

```bash
az functionapp config appsettings set \
  --name <function-app-name> \
  --resource-group <resource-group> \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="<connection-string>" \
    AZURE_STORAGE_TABLE_NAME=webhook-events
```

### 6. Deploy Functions

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Deploy
func azure functionapp publish <function-app-name>
```

### 7. Get Function Key

```bash
az functionapp keys list \
  --name <function-app-name> \
  --resource-group <resource-group> \
  --query "functionKeys.default" -o tsv
```

## Usage from Frontend

```javascript
const FUNCTION_URL = 'https://<function-app-name>.azurewebsites.net/api';
const FUNCTION_KEY = '<function-key>';

// Save dashboard
const saveResponse = await fetch(`${FUNCTION_URL}/webhook-receiver?code=${FUNCTION_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dashboardData)
});
const saved = await saveResponse.json();

// List all dashboards
const listResponse = await fetch(`${FUNCTION_URL}/webhook-list?code=${FUNCTION_KEY}`);
const { dashboards } = await listResponse.json();

// Get single dashboard
const getResponse = await fetch(`${FUNCTION_URL}/webhook-list?code=${FUNCTION_KEY}&id=${dashboardId}`);
const dashboard = await getResponse.json();

// Delete dashboard
const deleteResponse = await fetch(`${FUNCTION_URL}/webhook-delete?code=${FUNCTION_KEY}&id=${dashboardId}`, {
  method: 'DELETE'
});
const deleted = await deleteResponse.json();
```

## Local Development

1. Copy `local.settings.json` to your environment
2. Fill in your storage account credentials
3. Run locally:

```bash
npm install
npm start
```

Test with:

```bash
curl -X POST http://localhost:7071/api/webhook-receiver \
  -H "Content-Type: application/json" \
  -d '{"id":"test-1","name":"Test Dashboard"}'
```

## Security Notes

- Function keys provide basic authentication
- For production, consider using Azure AD authentication or IP restrictions
- Storage account keys should be rotated periodically
- Consider using Managed Identity instead of storage keys for enhanced security
