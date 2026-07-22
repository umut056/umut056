import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "android/**",
      "dist/**",
      "node_modules/**",
      "supabase/**",
      "tmp/**",
      "**/.gradle-local/**",
      "**/.codex-backups/**",
      "**/.codex-remote-attachments/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-constant-binary-expression": "off",
    },
  },
];
