<script lang="ts" setup>
defineProps<{
  datas?: Array<{ label: string, value: any }>
  msg: string
  value?: any
}>()

const emit = defineEmits(['update:value'])

const { t } = useI18n()

function emitUpdate(newValue: any) {
  emit('update:value', newValue)
}
</script>

<template>
  <n-form-item :label="msg">
    <n-radio-group
      :value="value"
      @update:value="emitUpdate"
    >
      <n-radio-button
        v-for="data in datas"
        :key="data.value"
        :value="data.value"
        :label="t(data.label)"
      />
    </n-radio-group>
  </n-form-item>
</template>

<style lang="scss" scoped></style>
