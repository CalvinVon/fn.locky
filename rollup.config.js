import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@rollup/plugin-typescript";
import terser from '@rollup/plugin-terser';

/** @type {import('rollup').RollupOptions} */
export default {
  input: "./src/index.ts",
  output: [
    {
      name: 'Lock',
      format: 'umd',
      file: './dist/fn-lock.min.js'
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      noEmit: true,
      declaration: false,
      compilerOptions: {
        target: "es5",
      },
    }),
    terser()
  ],
};
