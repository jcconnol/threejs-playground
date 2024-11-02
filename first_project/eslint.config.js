// eslint.config.js
import { ESLint } from "eslint";

export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
