<template>
  <n-form-item :label="props.msg" size="large">
    <template #label>
      <labelVue :msg="msg" :tooltip="tooltip" />
    </template>
    <n-select
      :value="value"
      :options="options"
      :label-field="labelField"
      :value-field="valueField"
      :placeholder="msg"
      @update:value="emitUpdate"
      :multiple="multiple"
      style="width: 100%"
      :render-label="renderLabel"
      :filterable="input"
      :tag="input"
      :clearable="clearable"
      :disabled="disabled"
    />
  </n-form-item>
</template>

<script lang="ts" setup>
import { VNodeChild } from "vue";
import labelVue from "./label.vue";

type Props = {
  msg: string;
  value: any;
  options?: Array<any>;
  multiple?: boolean;
  labelField?: string;
  valueField?: string;
  input?: boolean;
  tooltip?: string;
  clearable?: boolean;
  disabled?: boolean;
  renderLabel?: (SelectOption: any) => VNodeChild;
};

const props = withDefaults(defineProps<Props>(), {
  msg: "",
  multiple: false,
  labelField: "name",
  valueField: "id",
  clearable: true,
});

const emit = defineEmits(["update:value"]);
const emitUpdate = (newValue: any) => {
  emit("update:value", newValue);
};
</script>

<style lang="scss" scoped>
.n-form-item :deep(.n-form-item-label__text) {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
