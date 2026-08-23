const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**", "dummy_data/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // `next` is ignored by name rather than switching args off entirely:
      // Express identifies an error handler purely by arity (`fn.length !== 4`
      // in router/lib/layer.js), so the parameter must stay even when unused.
      // Every other unused argument is still reported.
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^(next|_)",
          caughtErrors: "none",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];
