// eslint.config.js
// https://github.com/antfu/eslint-config
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    exclude: ['vite.config.js'],
    formatters: {
      css: true, // by default use Prettier
      html: true, // by default use Prettier
      markdown: 'prettier', // use prettier for markdown
      toml: 'dprint', // use dprint for TOML
    },
    rules: {
      'no-console': 'off',
      'perfectionist/sort-objects': [
        'error',
        {
          'custom-groups': {
            id: 'id',
          },
          'groups': [
            'id',
            'unknown',
          ],
          'order': 'asc',
          'partition-by-comment': 'Part:**',
          'type': 'natural',
        },
      ],
      'style/array-bracket-newline': [
        'error',
        { minItems: 2, multiline: true },
      ],
      'style/func-call-spacing': [
        'error',
        'never',
      ],
      'style/newline-per-chained-call': [
        'error',
        { ignoreChainWithDepth: 2,
        },
      ],
      'style/no-confusing-arrow': ['error'],
      'style/no-extra-semi': 'error',
      'style/nonblock-statement-body-position': [
        'error',
        'below',
      ],
      'ts/no-floating-promises': 'off',
      'ts/no-misused-promises': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-return': 'off',
      'vue/max-len': [
        'error',
        {
          code: 120,
          ignoreComments: true,
          ignoreHTMLAttributeValues: true,
          ignoreHTMLTextContents: true,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreUrls: true,
          tabWidth: 2,
          template: 120,
        },
      ],
      'vue/no-mutating-props': 'off',
      'vue/no-v-text-v-html-on-component': 'off',
    },
    stylistic: true,
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    vue: true,
  },
)
