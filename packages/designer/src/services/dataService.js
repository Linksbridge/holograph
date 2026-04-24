/**
 * Data Service
 *
 * Fetches real database schema from a configurable API endpoint, falling back
 * to sample data when no connection is configured.
 */

import { globalSettingsService } from './globalSettingsService';

export const MOCK_DATA_TABLES = {
  sales_data: [
    { month: 'Jan', revenue: 12500, region: 'North' },
    { month: 'Feb', revenue: 15200, region: 'North' },
    { month: 'Mar', revenue: 18900, region: 'North' },
    { month: 'Apr', revenue: 21000, region: 'North' },
    { month: 'May', revenue: 19800, region: 'South' },
    { month: 'Jun', revenue: 24500, region: 'South' },
    { month: 'Jul', revenue: 28000, region: 'South' },
    { month: 'Aug', revenue: 26500, region: 'East' },
    { month: 'Sep', revenue: 22100, region: 'East' },
    { month: 'Oct', revenue: 19800, region: 'East' },
    { month: 'Nov', revenue: 23500, region: 'West' },
    { month: 'Dec', revenue: 31000, region: 'West' },
  ],
  product_trends: [
    { product: 'Widget A', sales: 450, quarter: 'Q1' },
    { product: 'Widget B', sales: 620, quarter: 'Q1' },
    { product: 'Widget A', sales: 580, quarter: 'Q2' },
    { product: 'Widget B', sales: 710, quarter: 'Q2' },
    { product: 'Widget A', sales: 820, quarter: 'Q3' },
    { product: 'Widget B', sales: 690, quarter: 'Q3' },
    { product: 'Widget A', sales: 950, quarter: 'Q4' },
    { product: 'Widget B', sales: 880, quarter: 'Q4' },
  ],
  customer_growth: [
    { month: 'Jan', customers: 120 },
    { month: 'Feb', customers: 145 },
    { month: 'Mar', customers: 178 },
    { month: 'Apr', customers: 210 },
    { month: 'May', customers: 265 },
    { month: 'Jun', customers: 310 },
    { month: 'Jul', customers: 380 },
    { month: 'Aug', customers: 445 },
    { month: 'Sep', customers: 520 },
    { month: 'Oct', customers: 610 },
    { month: 'Nov', customers: 720 },
    { month: 'Dec', customers: 850 },
  ],
  performance_metrics: [
    { metric: 'Response Time', value: 45 },
    { metric: 'Uptime', value: 99.9 },
    { metric: 'Error Rate', value: 0.5 },
    { metric: 'Throughput', value: 1250 },
    { metric: 'CPU Usage', value: 72 },
    { metric: 'Memory', value: 68 },
  ],
  regional_sales: [
    { region: 'North', sales: 67600 },
    { region: 'South', sales: 72300 },
    { region: 'East', sales: 68400 },
    { region: 'West', sales: 74300 },
  ],
};

// Cache for tables, columns, and unique values
let tablesCache = null;
let columnsCache = {};
let uniqueValuesCache = {};

// Track whether we're using real schema or mock data
let usingRealSchema = false;
let realSchemaData = null;

/**
 * Initialize the data service cache
 * In production, this would fetch schema info from the SQL database
 * @param {string} connectionString - Optional database connection string
 */
export const initializeDataService = async (connectionString = null, schemaUrl = null, databaseName = null) => {
  console.log('Initializing data service...');

  const resolvedSchemaUrl = schemaUrl || process.env.REACT_APP_DATABASE_SCHEMA_URL;

  // Fall back to global settings for connection string and database name
  const globalDb = globalSettingsService.cache.get('database') || {};
  const resolvedConnectionString = connectionString || globalDb.connectionStringTemplate || null;
  const resolvedDatabaseName = databaseName || globalDb.defaultDatabaseName || null;

  if (resolvedConnectionString && resolvedSchemaUrl) {
    try {
      const url = resolvedDatabaseName ? `${resolvedSchemaUrl}/${resolvedDatabaseName}` : resolvedSchemaUrl;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      if (!response.ok) {
        throw new Error(`Schema endpoint returned ${response.status}`);
      }

      realSchemaData = await response.json();

      tablesCache = Object.keys(realSchemaData.tables);
      columnsCache = { ...realSchemaData.tables };
      uniqueValuesCache = {};
      usingRealSchema = true;

      console.log('Data service initialized with REAL schema - tables:', tablesCache);
    } catch (error) {
      console.error('Failed to load real schema, falling back to mock data:', error);
      await loadMockData();
    }
  } else {
    await loadMockData();
  }

  return tablesCache;
};

/**
 * Load mock/example data
 */
const loadMockData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  tablesCache = Object.keys(MOCK_DATA_TABLES);
  columnsCache = {};
  uniqueValuesCache = {};
  usingRealSchema = false;
  
  // Pre-populate columns cache for each mock table
  tablesCache.forEach((tableName) => {
    if (MOCK_DATA_TABLES[tableName]?.length > 0) {
      columnsCache[tableName] = Object.keys(MOCK_DATA_TABLES[tableName][0]);
    }
  });
  
  console.log('Data service initialized with MOCK data - tables:', tablesCache);
};

/**
 * Check if using real database schema
 * @returns {boolean} True if using real schema, false if using mock data
 */
export const isUsingRealSchema = () => {
  return usingRealSchema;
};

/**
 * Get schema information
 * @returns {Object} Schema info including type and table count
 */
export const getSchemaInfo = () => {
  return {
    type: usingRealSchema ? 'real' : 'mock',
    tableCount: tablesCache ? tablesCache.length : 0,
    tables: tablesCache || []
  };
};

/**
 * Get cached tables list
 * @returns {string[]} List of available table names
 */
export const getCachedTables = () => {
  return tablesCache || Object.keys(MOCK_DATA_TABLES);
};

/**
 * Get cached columns for a table
 * @param {string} tableName - Name of the table
 * @returns {string[]} List of column names
 */
export const getCachedColumns = (tableName) => {
  if (columnsCache[tableName]) {
    return columnsCache[tableName];
  }
  
  // Fallback to calculating from data
  const tableData = MOCK_DATA_TABLES[tableName];
  if (tableData?.length > 0) {
    const cols = Object.keys(tableData[0]);
    columnsCache[tableName] = cols;
    return cols;
  }
  return [];
};

/**
 * Get unique values for a specific column across all tables
 * @param {string} columnName - Name of the column
 * @returns {Array} Array of unique values
 */
export const getUniqueValuesForColumn = (columnName) => {
  if (uniqueValuesCache[columnName]) {
    return uniqueValuesCache[columnName];
  }
  
  const values = new Set();
  const tables = getCachedTables();
  
  tables.forEach((tableName) => {
    const cols = getCachedColumns(tableName);
    if (cols.includes(columnName)) {
      const tableData = MOCK_DATA_TABLES[tableName];
      tableData.forEach((row) => {
        if (row[columnName] !== undefined) {
          values.add(row[columnName]);
        }
      });
    }
  });
  
  const result = Array.from(values).sort();
  uniqueValuesCache[columnName] = result;
  return result;
};

/**
 * Simulates an Azure Function call to fetch data
 * @param {string} tableName - Name of the SQL table
 * @param {string} labelColumn - Column to use for labels
 * @param {string} valueColumn - Column to use for values
 * @param {Object} filters - Optional filter object { columnName: [values] }
 * @returns {Promise<Array<{label: string, value: number}>>} Formatted chart data
 */
export const fetchChartData = async (tableName, labelColumn, valueColumn, filters = null) => {
  // Simulate network delay (Azure Function latency)
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  if (usingRealSchema) {
    // For real database, make API call to fetch data
    console.log(`Fetching chart data from real database: ${tableName}`);
    
    // TODO: In production, make actual API call to Azure Function
    // const response = await fetch('/api/fetch-chart-data', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ tableName, labelColumn, valueColumn, filters })
    // });
    // return await response.json();
    
    // For now, return simulated real data structure
    const simulatedRealData = [
      { label: `Real ${labelColumn} 1`, value: Math.floor(Math.random() * 1000) },
      { label: `Real ${labelColumn} 2`, value: Math.floor(Math.random() * 1000) },
      { label: `Real ${labelColumn} 3`, value: Math.floor(Math.random() * 1000) },
      { label: `Real ${labelColumn} 4`, value: Math.floor(Math.random() * 1000) },
    ];
    
    console.log(`Real database data for ${tableName}:`, simulatedRealData);
    return simulatedRealData;
  }

  // Use mock data
  const tableData = MOCK_DATA_TABLES[tableName];
  
  if (!tableData) {
    console.warn(`Table "${tableName}" not found, returning empty data`);
    return [];
  }

  // Apply filters if provided
  let filteredData = tableData;
  if (filters && Object.keys(filters).length > 0) {
    filteredData = tableData.filter((row) => {
      // Check each filter column
      for (const [columnName, filterValues] of Object.entries(filters)) {
        // Skip empty filters
        if (!filterValues || !Array.isArray(filterValues) || filterValues.length === 0) {
          continue;
        }
        
        // Get the row value for this column
        const rowValue = row[columnName];
        
        // If the row's column value is not in the filter values, exclude it
        if (rowValue !== undefined && !filterValues.includes(rowValue)) {
          return false;
        }
      }
      return true;
    });
  }

  // Transform SQL result to chart-friendly format
  return filteredData.map((row) => ({
    label: row[labelColumn] || row[Object.keys(row)[0]],
    value: row[valueColumn] || row[Object.keys(row)[1]],
  }));
};

/**
 * Simulates an Azure Function call to fetch all table data
 * @param {string} tableName - Name of the SQL table
 * @param {string[]} columns - Array of column names to fetch (optional, fetches all if not provided)
 * @param {Object} filters - Optional filter object { columnName: [values] }
 * @returns {Promise<Array<Object>>} Raw table data with all columns
 */
export const fetchTableData = async (tableName, columns = null, filters = null) => {
  // Simulate network delay (Azure Function latency)
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  if (usingRealSchema) {
    // For real database, make API call to fetch data
    console.log(`Fetching table data from real database: ${tableName}`);
    
    // TODO: In production, make actual API call to Azure Function
    // const response = await fetch('/api/fetch-table-data', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ tableName, columns, filters })
    // });
    // return await response.json();
    
    // For now, return simulated real data structure
    const availableColumns = columnsCache[tableName] || [];
    const selectedColumns = columns || availableColumns;
    
    const simulatedRows = Array.from({ length: 5 }, (_, i) => {
      const row = {};
      selectedColumns.forEach(col => {
        // Generate realistic test data based on column names
        if (col.includes('id')) {
          row[col] = 1000 + i;
        } else if (col.includes('date')) {
          row[col] = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        } else if (col.includes('amount') || col.includes('price') || col.includes('revenue')) {
          row[col] = Math.floor(Math.random() * 10000) / 100;
        } else {
          row[col] = `Real ${col} ${i + 1}`;
        }
      });
      return row;
    });
    
    console.log(`Real database table data for ${tableName}:`, simulatedRows);
    return simulatedRows;
  }

  // Use mock data
  const tableData = MOCK_DATA_TABLES[tableName];
  
  if (!tableData) {
    console.warn(`Table "${tableName}" not found, returning empty data`);
    return [];
  }

  // Apply filters if provided
  let filteredData = tableData;
  if (filters && Object.keys(filters).length > 0) {
    filteredData = tableData.filter((row) => {
      // Check each filter column
      for (const [columnName, filterValues] of Object.entries(filters)) {
        // Skip empty filters
        if (!filterValues || !Array.isArray(filterValues) || filterValues.length === 0) {
          continue;
        }
        
        // Get the row value for this column
        const rowValue = row[columnName];
        
        // If the row's column value is not in the filter values, exclude it
        if (rowValue !== undefined && !filterValues.includes(rowValue)) {
          return false;
        }
      }
      return true;
    });
  }

  // If columns specified, return only those columns
  if (columns && Array.isArray(columns) && columns.length > 0) {
    return filteredData.map((row) => {
      const filteredRow = {};
      columns.forEach((col) => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });
  }

  // Otherwise return all columns
  return filteredData;
};

/**
 * Get available data tables
 * @returns {string[]} List of available table names
 */
export const getAvailableTables = () => getCachedTables();

/**
 * Get table columns for a given table
 * @param {string} tableName - Name of the table
 * @returns {string[]} List of column names
 */
export const getTableColumns = (tableName) => getCachedColumns(tableName);

export default {
  fetchChartData,
  fetchTableData,
  getAvailableTables,
  getTableColumns,
  initializeDataService,
  getCachedTables,
  getCachedColumns,
  getUniqueValuesForColumn,
  isUsingRealSchema,
  getSchemaInfo,
};
