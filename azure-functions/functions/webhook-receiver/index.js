const { app, InvocationContext, HttpRequest, HttpResponseInit } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { v4: uuidv4 } = require('uuid');

/**
 * Creates a TableClient using environment variables
 */
function getTableClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const tableName = process.env.AZURE_STORAGE_TABLE_NAME || 'webhook-events';

  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING must be set');
  }

  return TableClient.fromConnectionString(connectionString, tableName);
}

/**
 * Webhook Receiver - Handles POST requests from the frontend
 * Stores dashboard data to Azure Table Storage
 */
async function webhookReceiver(request, context) {
  context.log(`Http function processed request for url "${request.url}"`);

  try {
    const body = await request.json();
    
    if (!body) {
      return {
        status: 400,
        jsonBody: { error: 'Request body is required' }
      };
    }

    const dashboardId = body.id || uuidv4();
    const timestamp = new Date().toISOString();
    
    const entity = {
      partitionKey: 'dashboard',
      rowKey: dashboardId,
      id: dashboardId,
      payload: JSON.stringify(body),
      updatedAt: timestamp,
      createdAt: timestamp
    };

    const tableClient = getTableClient();
    
    try {
      await tableClient.upsertEntity(entity);
    } catch (storageError) {
      context.error('Storage error:', storageError);
      return {
        status: 500,
        jsonBody: { error: 'Failed to store dashboard data' }
      };
    }

    return {
      status: 201,
      jsonBody: {
        success: true,
        id: dashboardId,
        message: 'Dashboard saved successfully'
      }
    };

  } catch (error) {
    context.error('Error processing webhook:', error);
    return {
      status: 500,
      jsonBody: { error: error.message }
    };
  }
}

app.http('webhookReceiver', {
  methods: ['POST'],
  authLevel: 'function',
  handler: webhookReceiver
});

module.exports = { webhookReceiver };
