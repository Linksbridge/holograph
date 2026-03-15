/**
 * Holograph Dashboard Schema
 * 
 * A framework-agnostic package containing the dashboard schema types,
 * constants, and factory functions.
 * 
 * @package @holograph/dashboard-schema
 */

// Re-export all constants
export * from './constants.js';

// Re-export all types and factory functions
export * from './types.js';

// Default export for convenience
import * as Constants from './constants.js';
import * as Types from './types.js';

export default {
  ...Constants,
  ...Types,
};
