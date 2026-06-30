export function getMatchingRules(zone, rules, settings) {
  if (!rules || rules.length === 0) return [];

  const datasource = settings?.dataSource?.databaseName || '';
  const tableName  = zone?.dataSource?.tableName || '';
  const valueCols = zone?.dataSource?.valueColumns
    ?? (zone?.dataSource?.valueColumn ? [zone.dataSource.valueColumn] : []);
  const cols = [zone?.dataSource?.labelColumn, ...valueCols].filter(Boolean);

  return rules.filter((rule) => {
    if (rule.datasource !== datasource) return false;
    if (rule.tableName  !== null && rule.tableName  !== tableName)  return false;
    if (rule.columnName !== null && !cols.includes(rule.columnName)) return false;
    return true;
  });
}

export function canRoleAccessZone(zone, rules, settings, role) {
  const matching = getMatchingRules(zone, rules, settings);
  if (matching.length === 0) return true;
  return matching.some((rule) => rule.roles.includes(role));
}

export function getAllRoles(rules) {
  if (!rules || rules.length === 0) return [];
  return [...new Set(rules.flatMap((r) => r.roles))].sort();
}
