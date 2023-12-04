<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts" setup>
import { NInput, NInputNumber } from 'naive-ui'

defineProps<{
  data: Record<string, V>
  msg?: string
}>()
const { t } = useI18n()
type V = null | number | string | undefined
function getComponentType(item: V): Component {
  if (typeof item === 'number')
    return NInputNumber

  return NInput
}
</script>

<template>
  <n-form-item
    v-for="(item, key) in data"
    :key="key"
    :label="t(key)"
  >
    <component
      :is="getComponentType(item)"
      v-model:value="data[key]"
      style="width: 100%"
      placeholder=""
    />
  </n-form-item>
</template>

<style lang="scss" scoped></style>
