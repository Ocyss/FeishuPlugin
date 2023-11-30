<!-- eslint-disable vue/no-mutating-props -->
<template>
  <n-form-item :label="msg">
    <n-space :vertical="vertical" style="width: 100%">
      <n-input-number
        v-for="(_, key) in data"
        :key="key"
        v-model:value="data[key]"
        :style="inputStyle ?? 'width: 160px'"
        placeholder="">
        <template v-if="prefix" #prefix>{{ t(key) }}</template>
        <template v-else #suffix>{{ t(key) }}</template>
      </n-input-number>
    </n-space>
  </n-form-item>
</template>

<script lang="ts" setup>
const {t} = useI18n()
defineProps<{
  msg: string
  data: Record<string, number | null | undefined>
  vertical?: boolean
  inputStyle?: string
  prefix?: boolean
}>()
</script>

<style lang="scss" scoped></style>
