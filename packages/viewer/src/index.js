/**
 * @holograph/dashboard-viewer
 * 
 * An embeddable React dashboard viewer component.
 * 
 * Usage:
 * 
 * import { DashboardViewer } from '@holograph/dashboard-viewer';
 * 
 * // With inline schema and data passed via props
 * const myData = {
 *   'zone-1': [
 *     { label: 'Jan', value: 100 },
 *     { label: 'Feb', value: 200 },
 *   ],
 *   'zone-2': [
 *     { label: 'Product A', value: 50 },
 *     { label: 'Product B', value: 75 },
 *   ],
 * };
 * 
 * <DashboardViewer 
 *   dashboard={myDashboardSchema} 
 *   data={myData}
 *   filters={{ region: ['North', 'South'] }}
 * />
 * 
 * // Or without data (will use dataSource from schema to fetch)
 * <DashboardViewer 
 *   dashboard={loadedSchema} 
 *   onFilterChange={(filters) => console.log(filters)}
 * />
 */

// Main component export
export { default as DashboardViewer } from './DashboardViewer.js';

// Re-export schema types for convenience
export * from '@holograph/dashboard-schema';

// Default export
import DashboardViewer from './DashboardViewer.js';

export default DashboardViewer;
