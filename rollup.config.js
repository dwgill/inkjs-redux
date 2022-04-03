import typescript from "rollup-plugin-typescript2";
import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: "./src/index.ts",
    output: {
      file: "./lib/index.esm.js",
      format: "esm",
    },
    plugins: [typescript(), resolve({
      browser: true
    })],
    external: ["@reduxjs/toolkit", "inkjs", "react", "react-redux"],
  },
  {
    input: "./src/index.ts",
    output: {
      file: "./lib/index.js",
      format: "cjs",
    },
    plugins: [typescript(), resolve({
      browser: true
    })],
    external: ["@reduxjs/toolkit", "inkjs", "react", "react-redux"],
  },
];
