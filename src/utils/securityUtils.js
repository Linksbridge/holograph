/**
 * Security Utilities
 *
 * Helpers for matching security rules against dashboard zones.
 * Rules are defined at datasource, table, or column granularity.
 * These helpers are used by both the editor (lock badges) and
 * the preview modal (role simulation).
 */

/**
 * Returns all security rules that apply to a given zone.
 *
 * Matching logic:
 *   - rule.datasource must match settings.dataSource.databaseName
 *   - if rule.tableName is set, it must match zone.dataSource.tableName
 *   - if rule.columnName is set, it must match zone.dataSource.labelColumn
 *     or zone.dataSource.valueColumn
 *
 * @param {Object} zone     - Zone schema object
 * @param {Array}  rules    - Full list of security rule objects
 * @param {Object} settings - App settings (settings.dataSource.databaseName used)
 * @returns {Array} Matching rules
 */
export function getMatchingRules(zone, rules, settings) {
  if (!rules || rules.length === 0) return [];

  const datasource = settings?.dataSource?.databaseName || '';
  const tableName  = zone?.dataSource?.tableName || '';
  const cols = [
    zone?.dataSource?.labelColumn,
    zone?.dataSource?.valueColumn,
  ].filter(Boolean);

  return rules.filter((rule) => {
    if (rule.datasource !== datasource) return false;
    if (rule.tableName  !== null && rule.tableName  !== tableName)  return false;
    if (rule.columnName !== null && !cols.includes(rule.columnName)) return false;
    return true;
  });
}

/**
 * Returns true if the given role is permitted to access the zone,
 * or if no security rules apply to it.
 *
 * A zone is blocked when at least one matching rule exists and
 * the role is absent from every matching rule's roles list.
 *
 * @param {Object} zone
 * @param {Array}  rules
 * @param {Object} settings
 * @param {string} role
 * @returns {boolean}
 */
export function canRoleAccessZone(zone, rules, settings, role) {
  const matching = getMatchingRules(zone, rules, settings);
  if (matching.length === 0) return true;
  return matching.some((rule) => rule.roles.includes(role));
}

/**
 * Returns all unique role names found across a rules list, sorted.
 *
 * @param {Array} rules
 * @returns {string[]}
 */
export function getAllRoles(rules) {
  if (!rules || rules.length === 0) return [];
  return [...new Set(rules.flatMap((r) => r.roles))].sort();
}
