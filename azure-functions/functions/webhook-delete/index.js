const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

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
 * Webhook Delete - Deletes dashboard data from Azure Table Storage
 * Requires id query parameter
 */
async function webhookDelete(request, context) {
  context.log(`Delete function processed request for url "${request.url}"`);

  try {
    const dashboardId = request.query.get('id');

    if (!dashboardId) {
      return {
        status: 400,
        jsonBody: { error: 'id query parameter is required' }
      };
    }

    const tableClient = getTableClient();
    
    try {
      await tableClient.deleteEntity('dashboard', dashboardId);
    } catch (err) {
      if (err.statusCode === 404) {
        return {
          status: 404,
          jsonBody: { error: 'Dashboard not found' }
        };
      }
      throw err;
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Dashboard deleted successfully'
      }
    };

  } catch (error) {
    context.error('Error deleting dashboard:', error);
    return {
      status: 500,
      jsonBody: { error: error.message }
    };
  }
}

app.http('webhookDelete', {
  methods: ['DELETE'],
  authLevel: 'function',
  handler: webhookDelete
});

module.exports = { webhookDelete };
