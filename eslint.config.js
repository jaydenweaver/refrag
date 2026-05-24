import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactCompilerPlugin from "eslint-plugin-react-compiler";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

const tsRules = {
  files: ["src/**/*.{ts,tsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
    globals: globals.browser,
  },
  plugins: {
    "@typescript-eslint": tsPlugin,
    react: reactPlugin,
    "react-compiler": reactCompilerPlugin,
    "react-hooks": reactHooksPlugin,
  },
  rules: {
    ...tsPlugin.configs.recommended.rules,
    ...reactPlugin.configs.recommended.rules,
    ...reactHooksPlugin.configs.recommended.rules,
    "react-compiler/react-compiler": "error",
    "react/react-in-jsx-scope": "off",
    // TypeScript's compiler catches undefined references; ESLint's no-undef
    // doesn't understand TypeScript types (e.g. WebGL2RenderingContext, GLenum).
    "no-undef": "off",
  },
  settings: {
    react: { version: "detect" },
  },
};

const testOverrides = {
  files: ["src/**/*.test.{ts,tsx}", "src/test-setup.ts"],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.jest, // vitest is jest-compatible
      vi: "readonly",
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
};

export default [js.configs.recommended, tsRules, testOverrides];
