/**
 * CRACO (Create React App Configuration Override)
 *
 * Extends the main babel-loader's `include` to cover:
 *   - packages/          local workspace source (real path after junction resolution)
 *   - node_modules/@holograph/   workspace packages as seen via Yarn junctions on Windows
 *
 * Also removes ModuleScopePlugin so imports from workspace packages aren't blocked.
 */

const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const packagesDir = path.resolve(__dirname, 'packages');
      const holographDir = path.resolve(__dirname, 'node_modules', '@holograph');

      // Alias @holograph/dashboard-viewer to viewer source so no dist build is needed.
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@holograph/dashboard-viewer': path.resolve(__dirname, 'packages/viewer/src'),
      };

      // Remove ModuleScopePlugin so imports from workspace packages aren't blocked.
      webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );

      // CRA puts all loader rules inside a single { oneOf: [...] } rule.
      const oneOfRule = webpackConfig.module.rules.find((r) => Array.isArray(r.oneOf));

      if (oneOfRule) {
        // Find the main babel-loader — identified by having an `include` pointing at src/
        const babelSourceRule = oneOfRule.oneOf.find(
          (r) =>
            r.include &&
            r.loader &&
            typeof r.loader === 'string' &&
            r.loader.includes('babel-loader') &&
            !Array.isArray(r.include)
        );

        if (babelSourceRule) {
          babelSourceRule.include = [babelSourceRule.include, packagesDir, holographDir];
        }
      }

      return webpackConfig;
    },
  },
};
