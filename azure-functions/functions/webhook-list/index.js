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
 * Webhook List - Retrieves dashboard data from Azure Table Storage
 * Supports optional id query parameter for single item retrieval
 */
async function webhookList(request, context) {
  context.log(`List function processed request for url "${request.url}"`);

  try {
    const dashboardId = request.query.get('id');
    const tableClient = getTableClient();

    if (dashboardId) {
      // Get single dashboard by ID
      try {
        const entity = await tableClient.getEntity('dashboard', dashboardId);
        return {
          status: 200,
          jsonBody: JSON.parse(entity.payload)
        };
      } catch (err) {
        if (err.statusCode === 404) {
          return {
            status: 404,
            jsonBody: { error: 'Dashboard not found' }
          };
        }
        throw err;
      }
    }

    // List all dashboards
    const dashboards = [];
    for await (const entity of tableClient.listEntities({
      queryOptions: { filter: "PartitionKey eq 'dashboard'" }
    })) {
      try {
        dashboards.push({
          ...JSON.parse(entity.payload),
          updatedAt: entity.updatedAt,
          createdAt: entity.createdAt
        });
      } catch (parseError) {
        context.log('Warning: Could not parse payload for entity:', entity.rowKey);
      }
    }

    return {
      status: 200,
      jsonBody: { dashboards }
    };

  } catch (error) {
    context.error('Error listing dashboards:', error);
    return {
      status: 500,
      jsonBody: { error: error.message }
    };
  }
}

app.http('webhookList', {
  methods: ['GET'],
  authLevel: 'function',
  handler: webhookList
});

module.exports = { webhookList };
