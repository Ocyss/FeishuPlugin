<script lang="ts" setup>
import { NIcon } from 'naive-ui'
import type { VNodeChild } from 'vue'
import { viewIcon } from '@/utils/view'
import { tableIcon } from '@/utils/table'

interface Props {
  msg: string
  value: string | null
  labelField?: string
  valueField?: string
  icon?: string
  tags?: any[]
  renderIcon?: any
}

const props = withDefaults(defineProps<Props>(), {
  labelField: 'name',
  renderIcon: () => {
    const createIcon = (svg: string): VNodeChild => {
      return h(
        NIcon,
        null,
        h('svg', {
          innerHTML: svg,
        }),
      )
    }
    return (option: ITableMeta | IViewMeta): VNodeChild => {
      if ('id' in option && 'name' in option) {
        if ('property' in option)
          return createIcon(viewIcon(option.type))
        else if ('isSync' in option)
          return createIcon(tableIcon())
      }
    }
  },
  tags: () => [Object],
  valueField: 'id',
})
const emit = defineEmits<{
  (e: 'update:value', value: any, option: any): void
}>()
const hover = ref(false)
const type = computed(() => hover.value ? 'warning' : 'info')
</script>

<template>
  <div style="margin: 3px 0px 15px 2px;">
    {{ props.msg }}:
    <n-dropdown
      trigger="click" :options="tags" :key-field="props.valueField"
      :label-field="props.labelField"
      :render-icon="renderIcon"
      @select="(v, o) => emit('update:value', v, o)"
    >
      <n-tag round :bordered="false" size="small" :type="type" style="cursor:pointer;" @mouseover="hover = true" @mouseleave="hover = false">
        {{ tags.find(tag => tag[props.valueField] === props.value)?.[props.labelField] }}
      </n-tag>
    </n-dropdown>
  </div>
</template>

<style lang="scss" scoped>

</style>
