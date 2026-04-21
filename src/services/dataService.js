/**
 * Mock Data Service
 * 
 * Simulates an Azure Function that returns data from SQL sources.
 * In production, this would be replaced with actual API calls to Azure Functions.
 */

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
  // Sample data for bubble/point maps — lat/lng in decimal degrees, value for bubble size
  us_cities: [
    { city: 'New York',       lat: 40.7128, lng: -74.0060,  population: 8336817 },
    { city: 'Los Angeles',    lat: 34.0522, lng: -118.2437, population: 3979576 },
    { city: 'Chicago',        lat: 41.8781, lng: -87.6298,  population: 2693976 },
    { city: 'Houston',        lat: 29.7604, lng: -95.3698,  population: 2320268 },
    { city: 'Phoenix',        lat: 33.4484, lng: -112.0740, population: 1608139 },
    { city: 'Philadelphia',   lat: 39.9526, lng: -75.1652,  population: 1603797 },
    { city: 'San Antonio',    lat: 29.4241, lng: -98.4936,  population: 1434625 },
    { city: 'San Diego',      lat: 32.7157, lng: -117.1611, population: 1386932 },
    { city: 'Dallas',         lat: 32.7767, lng: -96.7970,  population: 1304379 },
    { city: 'San Jose',       lat: 37.3382, lng: -121.8863, population: 1013240 },
    { city: 'Austin',         lat: 30.2672, lng: -97.7431,  population:  961855 },
    { city: 'Jacksonville',   lat: 30.3322, lng: -81.6557,  population:  949611 },
    { city: 'San Francisco',  lat: 37.7749, lng: -122.4194, population:  883305 },
    { city: 'Columbus',       lat: 39.9612, lng: -82.9988,  population:  905748 },
    { city: 'Charlotte',      lat: 35.2271, lng: -80.8431,  population:  885708 },
    { city: 'Indianapolis',   lat: 39.7684, lng: -86.1581,  population:  887642 },
    { city: 'Seattle',        lat: 47.6062, lng: -122.3321, population:  744955 },
    { city: 'Denver',         lat: 39.7392, lng: -104.9903, population:  715522 },
    { city: 'Nashville',      lat: 36.1627, lng: -86.7816,  population:  689447 },
    { city: 'Oklahoma City',  lat: 35.4676, lng: -97.5164,  population:  655057 },
  ],
  // Sample data for choropleth maps — state_code matches US state ISO 3166-2 codes
  // Use labelColumn: state_code, valueColumn: population (or sales_index)
  us_states: [
    { state_code: 'US-CA', state_name: 'California',     population: 39538223, sales_index: 95 },
    { state_code: 'US-TX', state_name: 'Texas',          population: 29145505, sales_index: 88 },
    { state_code: 'US-FL', state_name: 'Florida',        population: 21538187, sales_index: 82 },
    { state_code: 'US-NY', state_name: 'New York',       population: 20201249, sales_index: 91 },
    { state_code: 'US-PA', state_name: 'Pennsylvania',   population: 13002700, sales_index: 74 },
    { state_code: 'US-IL', state_name: 'Illinois',       population: 12812508, sales_index: 78 },
    { state_code: 'US-OH', state_name: 'Ohio',           population: 11799448, sales_index: 71 },
    { state_code: 'US-GA', state_name: 'Georgia',        population: 10711908, sales_index: 69 },
    { state_code: 'US-NC', state_name: 'North Carolina', population: 10439388, sales_index: 67 },
    { state_code: 'US-MI', state_name: 'Michigan',       population: 10037773, sales_index: 65 },
    { state_code: 'US-NJ', state_name: 'New Jersey',     population:  9288994, sales_index: 80 },
    { state_code: 'US-VA', state_name: 'Virginia',       population:  8631393, sales_index: 76 },
    { state_code: 'US-WA', state_name: 'Washington',     population:  7693612, sales_index: 84 },
    { state_code: 'US-AZ', state_name: 'Arizona',        population:  7276316, sales_index: 62 },
    { state_code: 'US-MA', state_name: 'Massachusetts',  population:  6981974, sales_index: 87 },
    { state_code: 'US-TN', state_name: 'Tennessee',      population:  6910840, sales_index: 59 },
    { state_code: 'US-IN', state_name: 'Indiana',        population:  6785528, sales_index: 57 },
    { state_code: 'US-MO', state_name: 'Missouri',       population:  6196540, sales_index: 55 },
    { state_code: 'US-MD', state_name: 'Maryland',       population:  6177224, sales_index: 72 },
    { state_code: 'US-WI', state_name: 'Wisconsin',      population:  5893718, sales_index: 61 },
  ],
};

// Cache for tables, columns, and unique values
let tablesCache = null;
let columnsCache = {};
let uniqueValuesCache = {};

/**
 * Initialize the data service cache
 * In production, this would fetch schema info from the SQL database
 */
export const initializeDataService = async () => {
  // Simulate fetching table list from SQL
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  tablesCache = Object.keys(MOCK_DATA_TABLES);
  columnsCache = {};
  uniqueValuesCache = {};
  
  // Pre-populate columns cache for each table
  tablesCache.forEach((tableName) => {
    if (MOCK_DATA_TABLES[tableName]?.length > 0) {
      columnsCache[tableName] = Object.keys(MOCK_DATA_TABLES[tableName][0]);
    }
  });
  
  console.log('Data service initialized with tables:', tablesCache);
  return tablesCache;
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
 * Get unique values for a specific column within a single table
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column
 * @returns {Array} Array of unique values sorted appropriately
 */
export const getUniqueValuesForTableColumn = (tableName, columnName) => {
  const tableData = MOCK_DATA_TABLES[tableName];
  if (!tableData) return [];
  const values = new Set();
  tableData.forEach((row) => {
    if (row[columnName] !== undefined) values.add(row[columnName]);
  });
  return Array.from(values).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });
};

/**
 * Evaluate a single advanced filter condition against a row value
 * @param {*} rowValue - The row's value for the filtered column
 * @param {{ operator: string, value: string }} condition - Condition to evaluate
 * @returns {boolean}
 */
const applyCondition = (rowValue, condition) => {
  const { operator, value } = condition;
  const str = String(rowValue ?? '').toLowerCase();
  const cond = String(value ?? '').toLowerCase();
  const numRow = parseFloat(rowValue);
  const numCond = parseFloat(value);

  switch (operator) {
    case 'is':             return str === cond;
    case 'isNot':          return str !== cond;
    case 'contains':       return str.includes(cond);
    case 'doesNotContain': return !str.includes(cond);
    case 'startsWith':     return str.startsWith(cond);
    case 'endsWith':       return str.endsWith(cond);
    case 'isBlank':        return rowValue === null || rowValue === undefined || rowValue === '';
    case 'isNotBlank':     return rowValue !== null && rowValue !== undefined && rowValue !== '';
    case 'eq':             return numRow === numCond;
    case 'neq':            return numRow !== numCond;
    case 'gt':             return numRow > numCond;
    case 'gte':            return numRow >= numCond;
    case 'lt':             return numRow < numCond;
    case 'lte':            return numRow <= numCond;
    default:               return true;
  }
};

const isNoValueOp = (op) => op === 'isBlank' || op === 'isNotBlank';

/**
 * Test whether a single row passes a filter definition for one column.
 * Handles both the legacy array format and the new { mode, ... } format.
 * @param {Object} row - Data row
 * @param {string} columnName - Column being filtered
 * @param {Array|Object} filterDef - Filter definition
 * @returns {boolean}
 */
const applyFilterToRow = (row, columnName, filterDef) => {
  const rowValue = row[columnName];

  // Legacy format: plain array = include filter
  if (Array.isArray(filterDef)) {
    if (filterDef.length === 0) return true;
    return filterDef.includes(rowValue);
  }

  if (!filterDef || typeof filterDef !== 'object') return true;

  const { mode, filterType, values, logicalOperator, conditions } = filterDef;

  if (mode === 'basic') {
    if (!values || values.length === 0) return true;
    const included = values.includes(rowValue);
    return filterType === 'exclude' ? !included : included;
  }

  if (mode === 'advanced') {
    const active = (conditions || []).filter(
      (c) => isNoValueOp(c.operator) || (c.value !== '' && c.value !== null && c.value !== undefined)
    );
    if (active.length === 0) return true;
    const results = active.map((c) => applyCondition(rowValue, c));
    return logicalOperator === 'or' ? results.some(Boolean) : results.every(Boolean);
  }

  return true;
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

  const tableData = MOCK_DATA_TABLES[tableName];
  
  if (!tableData) {
    console.warn(`Table "${tableName}" not found, returning empty data`);
    return [];
  }

  // Apply filters if provided
  let filteredData = tableData;
  if (filters && Object.keys(filters).length > 0) {
    filteredData = tableData.filter((row) => {
      for (const [columnName, filterDef] of Object.entries(filters)) {
        if (!filterDef) continue;
        if (!applyFilterToRow(row, columnName, filterDef)) return false;
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

  const tableData = MOCK_DATA_TABLES[tableName];
  
  if (!tableData) {
    console.warn(`Table "${tableName}" not found, returning empty data`);
    return [];
  }

  // Apply filters if provided
  let filteredData = tableData;
  if (filters && Object.keys(filters).length > 0) {
    filteredData = tableData.filter((row) => {
      for (const [columnName, filterDef] of Object.entries(filters)) {
        if (!filterDef) continue;
        if (!applyFilterToRow(row, columnName, filterDef)) return false;
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
  getUniqueValuesForTableColumn,
};
