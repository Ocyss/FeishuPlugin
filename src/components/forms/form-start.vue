<template>
  <n-space>
    <n-popover
      trigger="hover"
      :disabled="!disabled.isDisabled"
      placement="bottom-start"
      :keep-alive-on-hover="false"
    >
      <template #trigger>
        <n-button
          type="info"
          size="large"
          @click="$emit('update:click')"
          :disabled="disabled.isDisabled"
        >
          {{ t(props.msg) }}
        </n-button>
      </template>
      <n-list clickable>
        <n-list-item v-for="item in disabled.reasons" :key="item">
          {{ t(item) }}
        </n-list-item>
      </n-list>
    </n-popover>
    <slot></slot>
  </n-space>
</template>

<script lang="ts" setup>
const { t } = useI18n()

interface Props {
  msg: string
  disableds: Array<[boolean, string]>
}

const props = withDefaults(defineProps<Props>(), {
  "msg": "Start"
})

const disabled = computed(() => {
  const isDisabled = props.disableds?.some((disabled) => disabled[0])
  const reasons = props.disableds
    ?.filter((disabled) => disabled[0])
    ?.map((disabled) => disabled[1])
  return {
    isDisabled,
    reasons
  }
})
</script>

<style lang="scss" scoped></style>
