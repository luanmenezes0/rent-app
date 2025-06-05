import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginCypress from "eslint-plugin-cypress/flat";
import stylistic from "@stylistic/eslint-plugin";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  },
  {
    plugins: {
      "@stylistic": stylistic,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  { ignores: ["cypress/.eslintrc.js", "build", "public"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginCypress.configs.recommended,
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat["jsx-runtime"],
];
