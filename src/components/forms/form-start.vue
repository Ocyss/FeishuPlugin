<script lang="ts" setup>
import { tKey } from '@/keys'

const props = withDefaults(defineProps<Props>(), {
  msg: 'Start',
  operate: false,
})
const emit = defineEmits<{ (e: 'update:click', all?: boolean): void }>()
const t = inject(tKey, () => useI18n().t, true)
const dialog = useDialog()

interface Props {
  disableds?: Array<[boolean, string]>
  msg: string
  operate?: boolean
}

const disabled = computed(() => {
  const isDisabled = props.disableds?.some(disabled => disabled[0])
  const reasons = props.disableds?.filter(disabled => disabled[0])?.map(disabled => disabled[1])
  return {
    isDisabled,
    reasons,
  }
})

function click(all: boolean) {
  dialog.warning({
    content: t(
      'Your current selection ({msg})\n\nall: The operation will be performed on all records. Each operation is 5000 or smaller, which is faster.\npart: The user selects the operation records, one is processed at a time, and the speed is slow.',
      { msg: `${t(all ? 'arr' : 'part')} | ${all ? 'arr' : 'part'}` },
    ),
    negativeText: t('cancel'),
    onNegativeClick: () => {},
    onPositiveClick: () => {
      emit('update:click', all)
    },
    positiveText: t('confirm'),
    title: t('warning'),
  })
}
</script>

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
          v-if="operate"
          type="info"
          size="large"
          :disabled="disabled.isDisabled"
          @click="emit('update:click')"
        >
          {{ t("Process") }}
        </n-button>
        <n-button-group
          v-else
          size="large"
        >
          <n-button
            type="info"
            strong
            :disabled="disabled.isDisabled"
            @click="() => click(true)"
          >
            {{ t("Process all") }}
          </n-button>
          <n-button
            type="info"
            strong
            :disabled="disabled.isDisabled"
            @click="() => click(false)"
          >
            {{ t("Process part") }}
          </n-button>
        </n-button-group>
      </template>
      <n-list clickable>
        <n-list-item
          v-for="item in disabled.reasons"
          :key="item"
        >
          {{ t(item) }}
        </n-list-item>
      </n-list>
    </n-popover>
    <slot />
  </n-space>
</template>

<style lang="scss" scoped></style>
