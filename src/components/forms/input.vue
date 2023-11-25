<template>
  <n-form-item v-for="(item, key) in data" :label="t(key)">
    <component
      :is="getComponentType(item)"
      v-model:value="data[key]"
      style="width: 100%"
      placeholder=""
    ></component>
  </n-form-item>
</template>

<script lang="ts" setup>
import { NInput, NInputNumber } from "naive-ui";

const { t } = useI18n();
type V = string | number | null | undefined;
defineProps<{
  msg?: string;
  data: Record<string, V>;
}>();

function getComponentType(item: V): Component {
  if (typeof item == "number") {
    return NInputNumber;
  }
  return NInput;
}
</script>

<style lang="scss" scoped></style>
