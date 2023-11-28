/* eslint-env node */
module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-essential",
    ".eslintrc-auto-import.json",
    "prettier"
  ],
  "ignorePatterns": ["build/", "dist/", "*.md", "*.py", "*.json"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "parser": "@typescript-eslint/parser",
    "sourceType": "module",
    "project": "./tsconfig.json",
    "extraFileExtensions": [".vue"]
  },
  "plugins": ["simple-import-sort", "@typescript-eslint", "vue"],
  "rules": {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "sort-imports": "off",
    "sort-vars": "error",
    "no-self-compare": "error",
    "array-callback-return": ["error", {"checkForEach": true, "allowImplicit": true}],
    "quote-props": ["error", "always"],
    "lines-around-comment": ["error", {"beforeBlockComment": true}],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "double"],
    "no-new-native-nonconstructor": "error",
    "no-unmodified-loop-condition": "error",
    "no-unreachable-loop": "error",
    "default-param-last": ["error"],
    "eqeqeq": ["error", "always"],
    "func-name-matching": "error",
    "no-floating-decimal": "error",
    "no-useless-return": "error",
    "semi": ["error", "never"],
    "no-duplicate-imports": ["error", {"includeExports": true}],
    "spaced-comment": ["error", "always", {"exceptions": ["-", "+", "*"]}],
    "semi-style": ["error", "last"],
    "semi-spacing": ["error", {"before": false, "after": true}],
    "vue/multi-word-component-names": ["error", {"ignores": ["index", "layout"]}],
    "vue/no-v-text-v-html-on-component": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-explicit-any": "off"
  }
}
