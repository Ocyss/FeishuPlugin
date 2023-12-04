// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu(
  { rules: {
    'vue/no-v-text-v-html-on-component': 'off',
    'vue/no-mutating-props': 'off',
    'no-console': 'off',
  } },
)
