module.exports = {
  parser: "@typescript-eslint/parser",
  root: true, // Make sure eslint picks up the config at the root of the directory
  parserOptions: {
    ecmaVersion: 2020, // Use the latest ecmascript standard
    sourceType: "module", // Allows using import/export statements
    ecmaFeatures: {
      jsx: true // Enable JSX since we're using React
    }
  },
  settings: {
    react: {
      version: "detect" // Automatically detect the react version
    },
    "import/resolver": {
      "babel-module": {
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        paths: ["src"]
      }
    }
  },
  plugins: ["simple-import-sort", "@typescript-eslint", "react", "prettier"],
  env: {
    browser: true,
    node: true,
    es2020: true
  },
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:prettier/recommended" // Make this the last element so prettier config overrides other formatting rules
  ],
  rules: {
    // suppress errors for missing 'import React' in files
    "react/react-in-jsx-scope": "off",
    "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx", ".ts", ".tsx"] }],
    "import/extensions": "off",
    "react/prop-types": "off",
    "jsx-a11y/anchor-is-valid": "off",
    "react/jsx-props-no-spreading": ["error", { custom: "ignore" }],
    "prettier/prettier": "error",
    "react/no-unescaped-entities": "off",
    "import/no-cycle": [0, { ignoreExternal: true }],
    "prefer-const": "off",
    // needed because of https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md#how-to-use & https://stackoverflow.com/questions/63818415/react-was-used-before-it-was-defined
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": [
      "error",
      { functions: false, classes: false, variables: true }
    ]
  }
};
