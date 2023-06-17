import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@rollup/plugin-typescript";
import terser from '@rollup/plugin-terser';

/** @type {import('rollup').RollupOptions[]} */
export default [
  {
    input: "./src/index.ts",
    output: {
      name: 'Lock',
      format: 'umd',
      file: './dist/fn-locky.min.js'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        noEmit: true,
        declaration: false,
      }),
      terser()
    ],
  },
  {
    input: "./src/lock.ts",
    output: {
      name: 'Lock',
      format: 'umd',
      file: './dist/lock.min.js'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        noEmit: true,
        declaration: false,
      }),
      terser()
    ],
  },
  {
    input: "./src/lockify.ts",
    output: {
      name: 'lockify',
      format: 'umd',
      file: './dist/lockify.min.js'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        noEmit: true,
        declaration: false,
      }),
      terser()
    ],
  }
];
