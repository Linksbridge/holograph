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
let queryDataCache = {}; // tableName -> rows[], populated by fetchQueryData

// Named join data sources registered from dashboard config
let joinDefinitions = {}; // name -> { id, name, baseTable, joins: [] }

// File sources uploaded to the backend: name -> { id, columns, fileDataUrl }
let fileSourceRegistry = {};

// Track whether we're using real schema or mock data
let usingRealSchema = false;
let realSchemaData = null;

// Real data query endpoint (derived from schema URL)
let dataQueryUrl = null;
let datasourceName = null;

/**
 * Initialize the data service cache
 * In production, this would fetch schema info from the SQL database
 * @param {string} connectionString - Optional database connection string
 */
export const initializeDataService = async (connectionString = null, schemaUrl = null, databaseName = null, explicitDataQueryUrl = null) => {
  console.log('Initializing data service...');

  // Reset caches on re-init
  queryDataCache = {};
  uniqueValuesCache = {};

  const resolvedSchemaUrl = schemaUrl || process.env.REACT_APP_DATABASE_SCHEMA_URL;

  // Await global settings so we don't race against the startup fetch
  const globalSettings = await globalSettingsService.getAllSettings();
  const globalDb = globalSettings.database || {};
  const globalWh = globalSettings.webhooks || {};
  const resolvedConnectionString = connectionString || globalDb.connectionStringTemplate || null;
  const resolvedDatabaseName = databaseName || globalDb.defaultDatabaseName || null;

  if (resolvedSchemaUrl) {
    try {
      const url = resolvedDatabaseName ? `${resolvedSchemaUrl}/${resolvedDatabaseName}` : resolvedSchemaUrl;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Schema endpoint returned ${response.status}`);
      }

      realSchemaData = await response.json();

      const tablesArray = realSchemaData.tables || [];
      tablesCache = tablesArray.map(t => t.name);
      columnsCache = {};
      tablesArray.forEach(t => {
        columnsCache[t.name] = t.columns.map(c => c.name);
      });
      uniqueValuesCache = {};
      usingRealSchema = true;
      // Priority: explicit param > global settings > env var > derived from schema URL
      const derivedDataQueryUrl = resolvedSchemaUrl.replace(/\/schema(\/|$)/, '/data$1').replace(/\/$/, '');
      dataQueryUrl = explicitDataQueryUrl || globalWh.dataQueryUrl || process.env.REACT_APP_DATA_QUERY_URL || derivedDataQueryUrl;
      datasourceName = resolvedDatabaseName || null;

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
 * Update the data query URL without re-initializing the service.
 * Useful when only the URL changes (e.g. saved from settings).
 * @param {string} url - New base data query URL
 */
export const setDataQueryUrl = (url) => {
  if (url) dataQueryUrl = url;
};

/**
 * Register uploaded file sources so charts can reference them by name.
 * @param {Array} fileSources - Array of { id, name, columns, rowCount } from settings
 * @param {string} fileDataUrl - Base URL for fetching rows: GET fileDataUrl?id={id}
 */
export const setDashboardFileSources = (fileSources = [], fileDataUrl = null) => {
  fileSourceRegistry = {};
  fileSources.forEach((fs) => {
    fileSourceRegistry[fs.name] = { id: fs.id, columns: fs.columns || [], fileDataUrl };
    delete queryDataCache[fs.name];
    delete columnsCache[fs.name];
  });
  uniqueValuesCache = {};
};

/**
 * Register named join data sources from a dashboard document.
 * Call this whenever the dashboard loads or its dataSources array changes.
 */
export const setDashboardDataSources = (dataSources = []) => {
  joinDefinitions = {};
  dataSources.forEach((ds) => {
    joinDefinitions[ds.name] = ds;
    // Evict stale cached results so they re-resolve with current definition
    delete queryDataCache[ds.name];
    delete columnsCache[ds.name];
  });
  uniqueValuesCache = {};
};

// --- Client-side join engine ---

const parseKey = (keyStr) => (keyStr.includes('.') ? keyStr.split('.').pop() : keyStr);

const performJoin = (leftRows, rightRows, rightTable, joinType, on) => {
  const leftKey = parseKey(on.left);
  const rightKey = parseKey(on.right);

  const rightMap = new Map();
  rightRows.forEach((row) => {
    const k = String(row[rightKey] ?? '');
    if (!rightMap.has(k)) rightMap.set(k, []);
    rightMap.get(k).push(row);
  });

  const prefixRight = (row) => {
    const out = {};
    Object.entries(row).forEach(([k, v]) => { out[`${rightTable}.${k}`] = v; });
    return out;
  };

  const nullRight = rightRows.length > 0
    ? prefixRight(Object.fromEntries(Object.keys(rightRows[0]).map((k) => [k, null])))
    : {};

  const results = [];
  const matchedKeys = new Set();

  leftRows.forEach((leftRow) => {
    const k = String(leftRow[leftKey] ?? '');
    const matches = rightMap.get(k);
    if (matches?.length) {
      matches.forEach((rightRow) => {
        results.push({ ...leftRow, ...prefixRight(rightRow) });
      });
      matchedKeys.add(k);
    } else if (joinType === 'LEFT' || joinType === 'FULL') {
      results.push({ ...leftRow, ...nullRight });
    }
  });

  if (joinType === 'RIGHT' || joinType === 'FULL') {
    const nullLeft = leftRows.length > 0
      ? Object.fromEntries(Object.keys(leftRows[0]).map((k) => [k, null]))
      : {};
    rightRows.forEach((rightRow) => {
      const k = String(rightRow[rightKey] ?? '');
      if (!matchedKeys.has(k)) {
        results.push({ ...nullLeft, ...prefixRight(rightRow) });
      }
    });
  }

  return results;
};

const executeJoin = async (def) => {
  let rows = await fetchQueryData(def.baseTable);
  for (const join of (def.joins || [])) {
    const rightRows = await fetchQueryData(join.table);
    rows = performJoin(rows, rightRows, join.table, join.type, join.on);
  }
  return rows;
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
  const real = tablesCache || Object.keys(MOCK_DATA_TABLES);
  return [...real, ...Object.keys(joinDefinitions), ...Object.keys(fileSourceRegistry)];
};

/**
 * Get cached columns for a table
 * @param {string} tableName - Name of the table
 * @returns {string[]} List of column names
 */
export const getCachedColumns = (tableName) => {
  if (columnsCache[tableName]) return columnsCache[tableName];

  // File source: columns stored in registry, no network call needed
  if (fileSourceRegistry[tableName]) {
    const cols = fileSourceRegistry[tableName].columns || [];
    columnsCache[tableName] = cols;
    return cols;
  }

  // Join definition: derive columns from constituent tables
  if (joinDefinitions[tableName]) {
    const def = joinDefinitions[tableName];
    const baseCols = getCachedColumns(def.baseTable);
    const joinCols = (def.joins || []).flatMap((j) =>
      getCachedColumns(j.table).map((c) => `${j.table}.${c}`)
    );
    const cols = [...baseCols, ...joinCols];
    columnsCache[tableName] = cols;
    return cols;
  }

  // Fallback to mock data
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

  if (usingRealSchema) {
    Object.values(queryDataCache).forEach((rows) => {
      rows.forEach((row) => {
        if (row[columnName] !== undefined) values.add(row[columnName]);
      });
    });
  } else {
    getCachedTables().forEach((tableName) => {
      const tableData = MOCK_DATA_TABLES[tableName];
      if (tableData) {
        tableData.forEach((row) => {
          if (row[columnName] !== undefined) values.add(row[columnName]);
        });
      }
    });
  }

  const result = Array.from(values).sort();
  uniqueValuesCache[columnName] = result;
  return result;
};

const interpolateDataUrl = (template, context) =>
  template.replace(/\{(\w+)\}/g, (match, key) =>
    key in context ? encodeURIComponent(context[key]) : match
  );

const applyFilterToRow = (row, filters) => {
  for (const [columnName, filterValues] of Object.entries(filters)) {
    if (!filterValues || !Array.isArray(filterValues) || filterValues.length === 0) continue;
    const rowValue = row[columnName];
    if (rowValue !== undefined && !filterValues.includes(rowValue)) return false;
  }
  return true;
};

const fetchQueryData = async (tableName) => {
  if (queryDataCache[tableName]) return queryDataCache[tableName];

  // File source — fetch rows from backend by ID
  if (fileSourceRegistry[tableName]) {
    const { id, fileDataUrl: fsUrl } = fileSourceRegistry[tableName];
    if (!fsUrl) throw new Error(`No fileDataUrl configured for file source "${tableName}"`);
    const url = `${fsUrl}/${encodeURIComponent(id)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`File data fetch failed: ${response.status} ${response.statusText}`);
    const result = await response.json();
    const rows = result.rows || [];
    queryDataCache[tableName] = rows;
    if (rows.length > 0) columnsCache[tableName] = Object.keys(rows[0]);
    uniqueValuesCache = {};
    return rows;
  }

  // Resolve named join data source
  if (joinDefinitions[tableName]) {
    const rows = await executeJoin(joinDefinitions[tableName]);
    queryDataCache[tableName] = rows;
    if (rows.length > 0) columnsCache[tableName] = Object.keys(rows[0]);
    uniqueValuesCache = {};
    return rows;
  }

  const context = { datasource: datasourceName || '', table: tableName };
  const base = /\{(datasource|table)\}/.test(dataQueryUrl)
    ? interpolateDataUrl(dataQueryUrl, context)
    : (datasourceName ? `${dataQueryUrl}/${datasourceName}/${tableName}` : `${dataQueryUrl}/${tableName}`);
  const url = `${base}?limit=1000`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Data query failed: ${response.status} ${response.statusText}`);
  const result = await response.json();
  const rows = result.rows || [];
  queryDataCache[tableName] = rows;
  uniqueValuesCache = {}; // invalidate so next call re-derives from fresh data
  return rows;
};

/**
 * Fetch chart data from real database or mock
 * @param {string} tableName - Name of the SQL table
 * @param {string} labelColumn - Column to use for labels
 * @param {string} valueColumn - Column to use for values
 * @param {Object} filters - Optional filter object { columnName: [values] }
 * @returns {Promise<Array<{label: string, value: number}>>} Formatted chart data
 */
export const fetchChartData = async (tableName, labelColumn, valueColumn, filters = null) => {
  if (usingRealSchema && dataQueryUrl || fileSourceRegistry[tableName] || joinDefinitions[tableName]) {
    const rows = await fetchQueryData(tableName);
    let filtered = rows;
    if (filters && Object.keys(filters).length > 0) {
      filtered = rows.filter((row) => applyFilterToRow(row, filters));
    }
    return filtered.map((row) => ({
      label: row[labelColumn],
      value: row[valueColumn],
    }));
  }

  // Simulate network delay for mock data
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  if (usingRealSchema) {
    return [];
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
  if (usingRealSchema && dataQueryUrl || fileSourceRegistry[tableName] || joinDefinitions[tableName]) {
    const rows = await fetchQueryData(tableName);
    let filtered = rows;
    if (filters && Object.keys(filters).length > 0) {
      filtered = rows.filter((row) => applyFilterToRow(row, filters));
    }
    if (columns && columns.length > 0) {
      return filtered.map((row) => {
        const projected = {};
        columns.forEach((col) => { projected[col] = row[col]; });
        return projected;
      });
    }
    return filtered;
  }

  // Simulate network delay for mock data
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

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
  setDataQueryUrl,
  setDashboardDataSources,
  setDashboardFileSources,
  getCachedTables,
  getCachedColumns,
  getUniqueValuesForColumn,
  isUsingRealSchema,
  getSchemaInfo,
};
