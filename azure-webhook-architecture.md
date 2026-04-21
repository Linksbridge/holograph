# Azure Functions Webhook Architecture

## Overview

This architecture implements a serverless solution for receiving document webhooks and storing JSON payloads in Azure Table Storage using Azure Functions with Node.js runtime.

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Document   │────▶│   Azure Functions   │────▶│  Azure Table        │
│  Service    │     │   (Webhook Receiver) │     │  Storage            │
└─────────────┘     └──────────────────────┘     └─────────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Response   │
                   │   Handler    │
                   └──────────────┘
```

## Components

### 1. Azure Functions

- **Runtime**: Node.js 18+ (LTS)
- **Trigger**: HTTP Trigger (Webhook endpoint)
- **Bindings**: Table Storage output binding

### 2. Azure Table Storage

- **Purpose**: Store JSON webhook payloads
- **Partition Strategy**: By document type or date

## Implementation

### Project Structure

```
azure-webhook-function/
├── host.json
├── local.settings.json
├── package.json
└── functions/
    ├── webhook-receiver/
    │   ├── function.json
    │   └── index.js
    └── shared/
        └── tableService.js
```

### Configuration Files

#### package.json

```json
{
  "name": "azure-webhook-function",
  "version": "1.0.0",
  "description": "Azure Function for receiving document webhooks",
  "scripts": {
    "start": "func start",
    "test": "jest"
  },
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@azure/data-tables": "^13.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

#### host.json

```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "logging": {
    "logLevel": {
      "default": "Information"
    }
  }
}
```

#### local.settings.json

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "TABLE_STORAGE_CONNECTION": "UseDevelopmentStorage=true",
    "TABLE_NAME": "webhook-events"
  }
}
```

### Function Implementation

#### webhook-receiver/index.js

```javascript
const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { v4: uuidv4 } = require('uuid');

// Table client singleton (created on first call)
let tableClient = null;

/**
 * Gets or creates the Table client
 */
function getTableClient() {
  if (!tableClient) {
    const connectionString = process.env.TABLE_STORAGE_CONNECTION;
    const tableName = process.env.TABLE_NAME || 'webhook-events';
    tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }
  return tableClient;
}

/**
 * Azure Function: Webhook Receiver
 * Receives document hooks and stores JSON blobs in Azure Table Storage
 */
app.http('webhookReceiver', {
  methods: ['POST', 'GET'],
  authLevel: 'function',
  handler: async (request, context) => {
    context.log('Webhook received:', request.method);

    // Handle GET request (health check)
    if (request.method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() })
      };
    }

    try {
      // Parse the incoming JSON payload
      const payload = await request.json();
      
      // Extract document metadata
      const documentId = payload.documentId || uuidv4();
      const documentType = payload.type || 'unknown';
      const timestamp = payload.timestamp || new Date().toISOString();

      // Create table entity
      const entity = {
        partitionKey: documentType,
        rowKey: `${timestamp}_${documentId}`,
        documentId,
        documentType,
        payload: JSON.stringify(payload),
        receivedAt: new Date().toISOString(),
        webhookSource: request.headers.get('x-webhook-source') || 'unknown'
      };

      // Use Direct SDK to insert entity
      const client = getTableClient();
      await client.createEntity(entity);

      context.log(`Stored webhook for document: ${documentId}`);

      return {
        status: 201,
        body: JSON.stringify({
          success: true,
          documentId,
          message: 'Webhook received and stored'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };

    } catch (error) {
      context.log.error('Error processing webhook:', error);

      return {
        status: 400,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }
});
```

#### webhook-receiver/function.json

```json
{
  "bindings": [
    {
      "name": "request",
      "type": "httpTrigger",
      "direction": "in",
      "authLevel": "function",
      "methods": ["post", "get"],
      "route": "webhooks"
    },
    {
      "name": "response",
      "type": "http",
      "direction": "out"
    }
  ]
}
```

> **Note**: Table storage access is handled via the Direct SDK in the function code, not via bindings. This gives more control over error handling and operations.

### Shared Table Service

#### shared/tableService.js

```javascript
const { TableClient } = require('@azure/data-tables');

/**
 * Creates a Table Service client for Azure Table Storage
 * @param {string} connectionString - Storage account connection string
 * @param {string} tableName - Name of the table
 * @returns {TableClient} Configured table client
 */
function createTableClient(connectionString, tableName) {
  return TableClient.fromConnectionString(connectionString, tableName);
}

/**
 * Inserts or updates an entity in the table
 * @param {TableClient} client - Table client
 * @param {object} entity - Entity to insert
 */
async function upsertEntity(client, entity) {
  await client.upsertEntity(entity);
}

/**
 * Queries entities with a filter
 * @param {TableClient} client - Table client
 * @param {string} filter - OData filter expression
 * @returns {Array} Matching entities
 */
async function queryEntities(client, filter) {
  const entities = [];
  for await (const entity of client.listEntities({ filter })) {
    entities.push(entity);
  }
  return entities;
}

module.exports = {
  createTableClient,
  upsertEntity,
  queryEntities
};
```

## Azure Table Storage Schema

### Table Design

| Property | Type | Description |
|----------|------|-------------|
| PartitionKey | String | Document type (e.g., "invoice", "contract") |
| RowKey | String | Unique identifier: `${timestamp}_${documentId}` |
| documentId | String | Unique document identifier |
| documentType | String | Type of document |
| payload | String | Full JSON payload (stringified) |
| receivedAt | DateTime | When the webhook was received |
| webhookSource | String | Source of the webhook |

### Example Entities

```
PartitionKey: "invoice"
RowKey: "2024-01-15T10:30:00Z_abc123"
documentId: "abc123"
documentType: "invoice"
payload: {"invoiceId":"abc123","amount":1500.00,...}
receivedAt: "2024-01-15T10:30:00Z"
webhookSource: "doc-service-prod"
```

## Deployment

### Azure Portal Setup

1. **Create Function App**
   - Publish: Code
   - Runtime stack: Node.js 18 (LTS)
   - Operating System: Linux

2. **Configure Application Settings**
   ```
   TABLE_STORAGE_CONNECTION = <storage-account-connection-string>
   TABLE_NAME = webhook-events
   ```

3. **Enable CORS** (if needed)
   - Allowed Origins: Your frontend domain

### Deployment Commands

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Deploy to Azure
func azure functionapp publish <your-function-app-name>

# Or use Azure CLI
az functionapp deployment source config-local-git \
  --resource-group <rg-name> \
  --name <function-app-name>
```

### Terraform Deployment (Optional)

```hcl
resource "azurerm_function_app" "webhook_function" {
  name                = "webhook-receiver"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  app_service_plan_id = azurerm_app_service_plan.main.id
  storage_account_name = azurerm_storage_account.main.name
  
  app_settings = {
    TABLE_STORAGE_CONNECTION = azurerm_storage_account.main.primary_connection_string
    TABLE_NAME               = "webhook-events"
    FUNCTIONS_WORKER_RUNTIME = "node"
  }
}
```

## Security Considerations

### Authentication

- **Function Level**: Use function keys for API authentication
- **Table Storage**: Use Managed Identity for production deployments

### Example with Managed Identity

```javascript
const { TableClient } = require('@azure/data-tables');
const { DefaultAzureCredential } = require('@azure/identity');

/**
 * Creates a Table client using Managed Identity (production approach)
 * @param {string} storageAccountName - Name of the storage account
 * @param {string} tableName - Name of the table
 * @returns {TableClient} Configured table client
 */
function createTableClientWithManagedIdentity(storageAccountName, tableName) {
  const url = `https://${storageAccountName}.table.core.windows.net/${tableName}`;
  const credential = new DefaultAzureCredential();
  return new TableClient(url, tableName, credential);
}

// Usage in function
app.http('webhookReceiver', {
  handler: async (request, context) => {
    const client = createTableClientWithManagedIdentity(
      process.env.STORAGE_ACCOUNT_NAME,
      process.env.TABLE_NAME
    );
    
    await client.createEntity(entity);
    // ... rest of handler
  }
});
```

> **Note**: With Managed Identity, you need to assign the "Storage Table Data Contributor" role to the Function App's managed identity in Azure.

### Network Security

- Enable Virtual Network integration
- Use Private Endpoints for Table Storage
- Configure IP restrictions on the Function App

## Monitoring

### Application Insights Integration

```javascript
// In host.json
{
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  }
}
```

### Log Queries

```kusto
traces
| where timestamp > ago(1h)
| where message contains "webhook"
| project timestamp, message, level
```

## Testing

### Local Testing

```bash
# Start the function locally
npm start

# Test with curl
curl -X POST http://localhost:7071/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"documentId":"test123","type":"invoice","data":{"amount":100}}'
```

### Unit Testing Example

```javascript
// test/webhook.test.js
const handler = require('../functions/webhook-receiver/index');

describe('Webhook Receiver', () => {
  test('should return 200 for health check GET', async () => {
    const mockRequest = {
      method: 'GET',
      json: jest.fn()
    };
    
    const result = await handler(mockRequest, mockContext);
    expect(result.status).toBe(200);
  });

  test('should store valid payload', async () => {
    const mockPayload = {
      documentId: 'doc-123',
      type: 'invoice',
      amount: 500
    };
    
    // Test implementation...
  });
});
```

## Configuration Checklist

- [ ] Create Azure Storage Account
- [ ] Create Table in Storage Account
- [ ] Create Function App (Consumption or Premium plan)
- [ ] Configure Application Settings
- [ ] Set up CORS if needed
- [ ] Configure Authentication/Authorization
- [ ] Enable Application Insights
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring alerts
- [ ] Review and apply security best practices