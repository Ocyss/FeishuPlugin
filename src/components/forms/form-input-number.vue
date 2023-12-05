<script lang="ts" setup>
import { tKey } from '@/keys'

defineProps<{
  data: Record<string, null | number | undefined>
  inputStyle?: string
  msg: string
  prefix?: boolean
  vertical?: boolean
}>()
const t = inject(tKey, () => useI18n().t, true)
</script>

<template>
  <n-form-item :label="msg">
    <n-space
      :vertical="vertical"
      style="width: 100%"
    >
      <n-input-number
        v-for="(_, key) in data"
        :key="key"
        v-model:value="data[key]"
        :style="inputStyle ?? 'width: 160px'"
        placeholder=""
      >
        <template
          v-if="prefix"
          #prefix
        >
          {{ t(key) }}
        </template>
        <template
          v-else
          #suffix
        >
          {{ t(key) }}
        </template>
      </n-input-number>
    </n-space>
  </n-form-item>
</template>

<style lang="scss" scoped></style>
