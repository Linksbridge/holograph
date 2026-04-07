/**
 * CRACO (Create React App Configuration Override)
 *
 * Extends CRA's webpack config so that workspace packages under packages/
 * are processed by the same babel-loader (with JSX support) as files in src/.
 *
 * Without this, CRA uses a limited babel preset for node_modules that lacks
 * the React JSX transform, causing errors when consuming raw JSX source from
 * local workspace packages like @holograph/dashboard-viewer.
 */

const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const packagesDir = path.resolve(__dirname, 'packages');

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
            !Array.isArray(r.include) // the node_modules rule has no include
        );

        if (babelSourceRule) {
          // Extend include to also cover the local packages/ directory
          babelSourceRule.include = [babelSourceRule.include, packagesDir];
        }
      }

      return webpackConfig;
    },
  },
};
