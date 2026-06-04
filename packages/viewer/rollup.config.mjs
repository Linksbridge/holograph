import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

const ignoreCss = {
    name: 'ignore-css',
    transform(_, id) {
        if (id.endsWith('.css')) return { code: '', map: null };
    }
};

const external = [
    'react',
    'react-dom',
    /^@nivo\//,
    'd3',
    'chart.js',
    'react-chartjs-2',
    'chartjs-chart-geo',
    'react-grid-layout'
];

export default {
    input: 'src/index.js',
    external,
    output: [
        { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true, inlineDynamicImports: true },
        { file: 'dist/index.esm.js', format: 'esm', sourcemap: true, inlineDynamicImports: true }
    ],
    plugins: [
        ignoreCss,
        resolve({ extensions: ['.js', '.jsx'] }),
        babel({
            babelHelpers: 'bundled',
            presets: ['@babel/preset-react'],
            extensions: ['.js', '.jsx']
        }),
        commonjs()
    ]
};
