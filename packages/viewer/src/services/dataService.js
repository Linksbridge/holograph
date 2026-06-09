/**
 * Data Service for DashboardViewer
 *
 * Fetches live data from holograph-data-server when dataQueryUrl is set.
 * Also supports uploaded file sources via fileSourceRegistry.
 * Returns empty results when no data source is configured — no mock fallback.
 */

// Cache for columns, unique values, and fetched rows
let columnsCache = {};
let uniqueValuesCache = {};
let queryDataCache = {};

// Live data endpoint from dashboard JSON
let dataQueryUrl = null;
let dashboardId = null;

// File sources uploaded to the backend: name -> { id, columns, fileDataUrl }
let fileSourceRegistry = {};

export const setDataQueryUrl = (url, id = null) => {
  dataQueryUrl = url || null;
  dashboardId = id || null;
  queryDataCache = {};
  uniqueValuesCache = {};
};

export const setDashboardFileSources = (fileSources = [], fileDataUrl = null) => {
  fileSourceRegistry = {};
  fileSources.forEach((fs) => {
    fileSourceRegistry[fs.name] = { id: fs.id, columns: fs.columns || [], fileDataUrl };
    delete queryDataCache[fs.name];
    delete columnsCache[fs.name];
  });
  uniqueValuesCache = {};
};

export const clearQueryDataCache = () => {
  queryDataCache = {};
  uniqueValuesCache = {};
};

export const initializeDataService = async (url = null, id = null) => {
  dataQueryUrl = url || null;
  dashboardId = id || null;
  columnsCache = {};
  uniqueValuesCache = {};
  queryDataCache = {};
};

// --- Fetchers ---

const fetchLiveData = async (tableName) => {
  if (queryDataCache[tableName]) return queryDataCache[tableName];
  const params = new URLSearchParams({ table: tableName });
  if (dashboardId) params.set('dashboardId', dashboardId);
  const response = await fetch(`${dataQueryUrl}?${params}`);
  if (!response.ok) throw new Error(`Data fetch failed: ${response.status} ${response.statusText}`);
  const result = await response.json();
  const rows = result.data || result.rows || [];
  queryDataCache[tableName] = rows;
  if (rows.length > 0) columnsCache[tableName] = Object.keys(rows[0]);
  return rows;
};

const fetchFileSourceData = async (tableName) => {
  if (queryDataCache[tableName]) return queryDataCache[tableName];
  const { id, fileDataUrl } = fileSourceRegistry[tableName];
  if (!fileDataUrl) throw new Error(`No fileDataUrl configured for file source "${tableName}"`);
  const url = `${fileDataUrl}/${encodeURIComponent(id)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`File data fetch failed: ${response.status} ${response.statusText}`);
  const result = await response.json();
  const rows = result.rows || [];
  queryDataCache[tableName] = rows;
  return rows;
};

const fetchRows = async (tableName) => {
  if (fileSourceRegistry[tableName]) return fetchFileSourceData(tableName);
  if (dataQueryUrl) return fetchLiveData(tableName);
  return [];
};

const applyFilters = (rows, filters) => {
  if (!filters || Object.keys(filters).length === 0) return rows;
  return rows.filter((row) => {
    for (const [col, filterDef] of Object.entries(filters)) {
      if (!filterDef) continue;
      if (!applyFilterToRow(row, col, filterDef)) return false;
    }
    return true;
  });
};

// --- Schema helpers ---

export const getCachedTables = () => [...Object.keys(fileSourceRegistry)];

export const getCachedColumns = (tableName) => {
  if (columnsCache[tableName]) return columnsCache[tableName];
  if (fileSourceRegistry[tableName]) {
    const cols = fileSourceRegistry[tableName].columns || [];
    columnsCache[tableName] = cols;
    return cols;
  }
  return [];
};

export const getUniqueValuesForColumn = (columnName) => {
  if (uniqueValuesCache[columnName]) return uniqueValuesCache[columnName];
  return [];
};

export const getUniqueValuesForTableColumn = (tableName, columnName) => {
  const cached = queryDataCache[tableName];
  if (!cached) return [];
  const values = new Set();
  cached.forEach((row) => { if (row[columnName] !== undefined) values.add(row[columnName]); });
  return Array.from(values).sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  });
};

// --- Filter engine ---

const isNoValueOp = (op) => op === 'isBlank' || op === 'isNotBlank';

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

const applyFilterToRow = (row, columnName, filterDef) => {
  const rowValue = row[columnName];

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

// --- Public data fetchers ---

export const fetchChartData = async (tableName, labelColumn, valueColumn, filters = null) => {
  const rows = await fetchRows(tableName);
  const filtered = applyFilters(rows, filters);
  return filtered.map((row) => ({
    label: row[labelColumn] ?? row[Object.keys(row)[0]],
    value: row[valueColumn] ?? row[Object.keys(row)[1]],
  }));
};

export const fetchTableData = async (tableName, columns = null, filters = null) => {
  const rows = await fetchRows(tableName);
  const filtered = applyFilters(rows, filters);
  if (columns && columns.length > 0) {
    return filtered.map((row) => {
      const out = {};
      columns.forEach((c) => { out[c] = row[c]; });
      return out;
    });
  }
  return filtered;
};

export const getAvailableTables = () => getCachedTables();
export const getTableColumns = (tableName) => getCachedColumns(tableName);

export default {
  fetchChartData,
  fetchTableData,
  getAvailableTables,
  getTableColumns,
  initializeDataService,
  setDataQueryUrl,
  setDashboardFileSources,
  clearQueryDataCache,
  getCachedTables,
  getCachedColumns,
  getUniqueValuesForColumn,
};
