<template>
  <n-form-item :label="msg">
    <n-space>
      <n-input-number
        v-for="(_, key) in data"
        v-model:value="data[key]"
        style="width: 160px"
        placeholder=""
      >
        <template #suffix>{{ t(key) }}</template>
      </n-input-number>
    </n-space>
  </n-form-item>
</template>

<script lang="ts" setup>
const { t } = useI18n();
defineProps<{ msg: string; data: Record<string, number | null | undefined> }>();
</script>

<style lang="scss" scoped></style>
