<script lang="ts" setup>
import { tKey } from '@/keys'

interface Props {
  disableds?: Array<[boolean, string]>
  msg: string
  operate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'Start',
  operate: false,
})
const emit = defineEmits<{ (e: 'update:click', all?: boolean): void }>()
const t = inject(tKey, () => useI18n().t, true)
const dialog = useDialog()

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
      { msg: `${t(all ? 'all' : 'part')} | ${all ? 'all' : 'part'}` },
    ),
    negativeText: t('cancel'),
    onNegativeClick: () => { },
    onPositiveClick: () => {
      emit('update:click', all)
    },
    positiveText: t('confirm'),
    title: t('warning'),
  })
}
const hover = ref(false)
</script>

<template>
  <n-space>
    <n-popover
      content-style="width: auto;" trigger="hover" width="trigger" :disabled="!disabled.isDisabled"
      placement="bottom-start" :keep-alive-on-hover="false" :show-arrow="false"
    >
      <template #trigger>
        <div v-if="operate" class="popover-button-group">
          <n-button :disabled="disabled.isDisabled" @click="emit('update:click')">
            {{ t("Process") }}
          </n-button>
          <n-button :disabled="disabled.isDisabled" @click="emit('update:click')">
            {{ t("Process") }}
          </n-button>
        </div>
        <div v-else class="popover-button-group" @mouseover="hover = true" @mouseleave="hover = false">
          <n-button :disabled="disabled.isDisabled" quaternary @click="() => click(true)">
            {{ t(`Process${hover ? " all" : ''}`) }}
          </n-button>
          <n-button :disabled="disabled.isDisabled" quaternary @click="() => click(false)">
            {{ t(`Process${hover ? " part" : ''}`) }}
          </n-button>
        </div>
      </template>
      <n-list clickable>
        <n-list-item v-for="item in disabled.reasons" :key="item">
          {{ t(item) }}
        </n-list-item>
      </n-list>
    </n-popover>
    <slot />
  </n-space>
</template>

<style lang="scss" scoped>
.popover-button-group {
  position: relative;
  width: 125px;
  height: 34px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, .25);
  border: none;
  --color1: #6FB9BF;
  --color2: #FAF8F2;

  .n-button {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: var(--color1);
    background: var(--color2);
    display: flex;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 22px;

    &.n-button--disabled {
      opacity: 1;
    }
  }

  .n-button:nth-child(2) {
    background: var(--color1);
    color: var(--color2);
    overflow: hidden;
    z-index: 2;
    transition: 1.3s;
    clip-path: polygon(50% 0%, 102% 0%, 100% 100%, 50% 100%, 50% 53%);
  }

  .n-button:nth-child(2):hover {
    clip-path: polygon(0% 0%, 102% 0%, 100% 100%, 0 100%, 0 50%);
  }

  .n-button:nth-child(1):hover~.n-button:nth-child(2) {
    clip-path: polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%, 100%50%);
  }
}
</style>
