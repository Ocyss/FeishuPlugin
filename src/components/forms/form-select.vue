<template>
  <n-form-item :label="props.msg" size="large">
    <template #label>
      <form-select-label :msg="msg" :tooltip="tooltip" />
    </template>
    <n-select
      style="width: 100%"
      :value="value"
      :options="options"
      :label-field="labelField"
      :value-field="valueField"
      :placeholder="msg"
      :multiple="multiple"
      :filterable="input"
      :tag="input"
      :clearable="clearable"
      :disabled="disabled"
      :render-label="renderLabel"
      :render-tag="renderTag"
      @update:value="emitUpdate"
      @create="emitCreate">
      <template #empty>
        <n-empty :description="emptyMsg">
          <template #extra>
            <n-button size="small" @click="emptyRefresh">
              {{ t("refresh") }}
            </n-button>
          </template>
        </n-empty>
      </template>
    </n-select>
  </n-form-item>
</template>

<script lang="ts" setup>
const {t} = useI18n()

interface Props {
  msg: string
  value: any
  options?: any[]
  multiple?: boolean
  labelField?: string
  valueField?: string
  input?: boolean
  tooltip?: string
  clearable?: boolean
  disabled?: boolean
  renderTag?: any
  renderLabel?: any
  emptyMsg?: string
  emptyRefresh?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  "msg": "",
  "multiple": false,
  "labelField": "name",
  "valueField": "id",
  "clearable": true,
  "emptyRefresh": () => {
    window.$message?.info(window.$t("Invalid, refresh method not defined"))
  },
  "emptyMsg": window.$t(
    "There is no data. There is a high probability that the field type has been filtered. Please check whether there are related types."
  )
})

const emit = defineEmits<{
  (e: "update:value", value: any, option: any): void
  (e: "create", label: string, f: (v: any) => void): void
}>()

const emitUpdate = (value: any, option: any) => {
  emit("update:value", value, option)
}

const emitCreate = (label: string) => {
  let res: any
  emit("create", label, (v: any) => {
    res = v
  })
  return res
}
</script>

<style lang="scss" scoped>
.n-form-item :deep(.n-form-item-label__text) {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>