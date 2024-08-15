import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.browser },
    rules: {
      camelcase: "off",
      "handle-callback-err": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-restricted-types": "warn",
      "promise/param-names": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  prettier,
  ...tseslint.configs.recommended,
];
