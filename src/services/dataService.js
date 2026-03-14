/**
 * Mock Data Service
 * 
 * Simulates an Azure Function that returns data from SQL sources.
 * In production, this would be replaced with actual API calls to Azure Functions.
 */

// Simulated SQL data tables
const MOCK_DATA_TABLES = {
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

/**
 * Simulates an Azure Function call to fetch data
 * @param {string} tableName - Name of the SQL table
 * @param {string} labelColumn - Column to use for labels
 * @param {string} valueColumn - Column to use for values
 * @returns {Promise<Array<{label: string, value: number}>>} Formatted chart data
 */
export const fetchChartData = async (tableName, labelColumn, valueColumn) => {
  // Simulate network delay (Azure Function latency)
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  const tableData = MOCK_DATA_TABLES[tableName];
  
  if (!tableData) {
    console.warn(`Table "${tableName}" not found, returning empty data`);
    return [];
  }

  // Transform SQL result to chart-friendly format
  return tableData.map((row) => ({
    label: row[labelColumn] || row[Object.keys(row)[0]],
    value: row[valueColumn] || row[Object.keys(row)[1]],
  }));
};

/**
 * Simulates an Azure Function call to fetch all table data
 * @param {string} tableName - Name of the SQL table
 * @param {string[]} columns - Array of column names to fetch (optional, fetches all if not provided)
 * @returns {Promise<Array<Object>>} Raw table data with all columns
 */
export const fetchTableData = async (tableName, columns = null) => {
  // Simulate network delay (Azure Function latency)
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  const tableData = MOCK_DATA_TABLES[tableName];
  
  if (!tableData) {
    console.warn(`Table "${tableName}" not found, returning empty data`);
    return [];
  }

  // If columns specified, return only those columns
  if (columns && Array.isArray(columns) && columns.length > 0) {
    return tableData.map((row) => {
      const filteredRow = {};
      columns.forEach((col) => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });
  }

  // Otherwise return all columns
  return tableData;
};

/**
 * Get available data tables
 * @returns {string[]} List of available table names
 */
export const getAvailableTables = () => Object.keys(MOCK_DATA_TABLES);

/**
 * Get table columns for a given table
 * @param {string} tableName - Name of the table
 * @returns {string[]} List of column names
 */
export const getTableColumns = (tableName) => {
  const tableData = MOCK_DATA_TABLES[tableName];
  if (!tableData || tableData.length === 0) return [];
  return Object.keys(tableData[0]);
};

export default {
  fetchChartData,
  getAvailableTables,
  getTableColumns,
};
