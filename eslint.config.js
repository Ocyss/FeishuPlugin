// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    rules: {
      'vue/no-v-text-v-html-on-component': 'off',
      'vue/no-mutating-props': 'off',
      'no-console': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-misused-promises': 'off',
      'ts/no-unsafe-return': 'off',
      'ts/no-floating-promises': 'off',
    },
    formatters: {
      css: true, // by default use Prettier
      html: true, // by default use Prettier
      toml: 'dprint', // use dprint for TOML
      markdown: 'prettier', // use prettier for markdown
    },
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    exclude: ['vite.config.js'],
  },
)
