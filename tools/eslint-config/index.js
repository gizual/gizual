const ERROR = 2;
const WARN = 1;
const OFF = 0;

module.exports = {
  root: true,
  ignorePatterns: ["**/.eslintrc.js", "**/dist/*", "**/build/*"],
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["react", "@typescript-eslint", "simple-import-sort", "unused-imports", "unicorn"],
  extends: [
    "turbo",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:unicorn/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  overrides: [
    {
      files: ["*.js", "*.jsx", "*.ts", "*.tsx"],
      rules: {
        "simple-import-sort/imports": [
          "error",
          {
            groups: [
              // side effects which start with @giz
              ["^\\u0000@giz/"],
              // Node.js builtins prefixed with `node:`.
              // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
              ["^node:", "^@?\\w"],
              // Internal packages or imports from parent directories
              ["^@giz", "^\\.\\.\\/"],
              // Anything not matched in another group.
              // Relative imports.
              // Anything that starts with a dot.
              ["^", "^\\.\\/"],
              // Side effect imports without @giz
              ["^\\u0000"],
            ],
          },
        ],
      },
    },
  ],
  rules: {
    indent: OFF,
    "linebreak-style": OFF,
    quotes: OFF,
    semi: OFF,

    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
    ],

    "simple-import-sort/imports": WARN,
    "simple-import-sort/exports": WARN,

    "react/react-in-jsx-scope": OFF,
    "react/jsx-key": OFF,
    "react/prop-types": OFF,
    "react/display-name": OFF,

    "@typescript-eslint/no-this-alias": OFF,
    "@typescript-eslint/no-non-null-assertion": OFF,
    "@typescript-eslint/ban-types": OFF,
    "@typescript-eslint/no-empty-function": OFF,

    "no-unused-vars": OFF,
    "@typescript-eslint/no-unused-vars": OFF,

    "no-return-await": OFF,
    "@typescript-eslint/return-await": OFF,

    "@typescript-eslint/no-explicit-any": OFF,
    "@typescript-eslint/no-empty-interface": OFF,
    "@typescript-eslint/no-floating-promises": OFF,
    "no-empty-pattern": OFF,

    "unicorn/prevent-abbreviations": OFF,
    "unicorn/prefer-module": OFF,

    "unicorn/prefer-add-event-listener": OFF,

    "unicorn/prefer-ternary": OFF,

    "unicorn/no-useless-undefined": OFF,

    "unicorn/consistent-function-scoping": OFF,
  },
};
