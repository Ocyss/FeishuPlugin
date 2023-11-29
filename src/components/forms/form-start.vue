<template>
  <n-space>
    <n-popover
      trigger="hover"
      :disabled="!disabled.isDisabled"
      placement="bottom-start"
      :keep-alive-on-hover="false">
      <template #trigger>
        <n-button
          v-if="operate"
          type="info"
          size="large"
          @click="emit('update:click')"
          :disabled="disabled.isDisabled">
          {{ t("Start") }}
        </n-button>
        <n-button-group size="large" v-else>
          <n-button type="info" ghost @click="() => click(true)" :disabled="disabled.isDisabled">
            {{ t("all") }}
          </n-button>
          <n-button type="info" ghost @click="() => click(false)" :disabled="disabled.isDisabled">
            {{ t("part") }}
          </n-button>
        </n-button-group>
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
const {t} = useI18n()
const dialog = useDialog()

interface Props {
  msg: string
  disableds?: Array<[boolean, string]>
  operate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  "msg": "Start",
  "operate": false
})

const emit = defineEmits<{(e: "update:click", all?: boolean): void}>()
const disabled = computed(() => {
  const isDisabled = props.disableds?.some(disabled => disabled[0])
  const reasons = props.disableds?.filter(disabled => disabled[0])?.map(disabled => disabled[1])
  return {
    isDisabled,
    reasons
  }
})

function click(all: boolean) {
  dialog.warning({
    "title": t("warning"),
    "content": t(
      "Your current selection ({msg})\n\nall: The operation will be performed on all records. Each operation is 5000 or smaller, which is faster.\npart: The user selects the operation records, one is processed at a time, and the speed is slow.",
      {"msg": `${t(all ? "arr" : "part")} | ${all ? "arr" : "part"}`}
    ),
    "positiveText": t("confirm"),
    "negativeText": t("cancel"),
    "onPositiveClick": () => {
      emit("update:click", all)
    },
    "onNegativeClick": () => {}
  })
}
</script>

<style lang="scss" scoped></style>
