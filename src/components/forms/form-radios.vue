<template>
  <n-form-item :label="msg">
    <n-radio-group :value="value" @update:value="emitUpdate">
      <n-radio-button
        v-for="data in datas"
        :key="data.value"
        :value="data.value"
        :label="t(data.label)"
      />
    </n-radio-group>
  </n-form-item>
</template>

<script lang="ts" setup>
const { t } = useI18n()

defineProps<{
  value?: any
  datas?: Array<{ value: any, label: string }>
  msg: string
}>()

const emit = defineEmits(["update:value"])
const emitUpdate = (newValue: any) => {
  emit("update:value", newValue)
}
</script>

<style lang="scss" scoped></style>
