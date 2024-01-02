<route lang="yaml">
name: DateOperations
meta:
  title: Date/Time Tools
  desc: >-
    This plugin offers convenient date and time manipulation functions, allowing
    flexible formatting, performing addition and subtraction operations with
    dates, and even converting text dates into date fields. It also allows
    direct setting of time attributes like hour, minute, and second,
    streamlining time handling for greater convenience and efficiency.
  help: >-
    Allows operations such as adding or subtracting any time to the time field,
    formatting output, etc.
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=04bj6841-6a19-4a65-9daa-195ed2150ed8
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M19
    4h-1V3c0-.55-.45-1-1-1s-1 .45-1 1v1H8V3c0-.55-.45-1-1-1s-1 .45-1 1v1H5c-1.11
    0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0
    15c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1V9h14v10zM7 11h2v2H7zm4 0h2v2h-2zm4
    0h2v2h-2z" fill="currentColor"></path></svg>
</route>

<script setup lang="ts">
import { NTime, type SelectOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import { ActionType, useAction } from './action'
import { dateFormatterList } from '@/utils/format'
import { useData } from '@/hooks/useData'

const props = withDefaults(defineProps<{
  autoRun?: boolean
}>(), {
  autoRun: false,
})
const emit = defineEmits<{
  (e: 'save', value: any): void
}>()

const {
  filterFields,
  getRecordss,
  getTable,
  layout,
  onGetField,
  t,
  tableId,
  tableMetaList,
  viewId,
  viewMetaList,
} = useData()
const { createActionOptions, modelData, start, storeData } = useAction()
onGetField(() => {
  modelData.input = null
  modelData.output = null
})

const radios = [
  { label: 'format', value: ActionType.Format },
  { label: 'add-subtract', value: ActionType.Add },
  { label: 'text to time', value: ActionType.Parse },
  { label: 'settings', value: ActionType.SetMonth },
  { label: 'random', value: ActionType.Randomize },
]

const disableds = computed<Array<[boolean, string]>>(() => [
  [
    !modelData.input,
    t('Input can not be empty'),
  ],
  [
    !modelData.output,
    t('Output can not be empty'),
  ],
])

const dateFormatter = computed(() =>
  dateFormatterList.map((item) => {
    return { id: item, name: item }
  }),
)

function dateRenderLabel(option: SelectOption): VNodeChild {
  return [
    h(NTime, { format: option.name as string, timeZone: 'UTC' }),
    option.label as string,
  ]
}

const actionOptions = createActionOptions()

function main(all?: boolean) {
  getRecordss(
    {
      all,
      func: async (record) => {
        return start(record, actionOptions)
      },
      update: true,
    },
  )
}

onMounted(async () => {
  void getTable()
})
</script>

<template>
  <Layout ref="layout">
    <n-space v-if="!props.autoRun" justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
    </n-space>

    <form-radios
      v-model:value="storeData.action" :msg="t('Select action')" :datas="radios" @update:value="() => {
        modelData.output = null
        modelData.input = null
      }
      "
    />
    <form-select
      v-model:value="modelData.input" :msg="t('Select action field')" :options="filterFields(storeData.action, {
        [FieldType.DateTime]: [0, 1, 3, 4],
        [FieldType.Text]: [2],
      })
      "
    />
    <form-select
      v-if="storeData.action === 0" v-model:value="storeData.dateKey" :msg="t('Select date format')" input
      :options="dateFormatter" :render-label="dateRenderLabel"
    >
      <template #tooltip>
        {{ t(
          `Select the date format, which can be entered manually. For the format, please refer to the document `,
        ) }}
        <a href="&quot;https://date-fns.org/v2.6.0/docs/format&quot;" target="&quot;_blank&quot;">date-fns format</a>
      </template>
    </form-select>
    <form-input-number
      v-else-if="storeData.action === 1" :msg="t('Time addition and subtraction operations')"
      :data="storeData.add"
    />
    <form-input-number v-else-if="storeData.action === 3" :msg="t('Time setting operation')" :data="storeData.set" />
    <n-form-item v-else-if="storeData.action === 4" :label="t('Time random operation')">
      <n-space item-style="display: flex;" align="center">
        <n-checkbox
          v-for="(_, key) in storeData.rand" :key="key"
          v-model:checked="storeData.rand[key]"
          :label="t(key)"
        />
      </n-space>
    </n-form-item>
    <form-select
      v-model:value="modelData.output" :msg="t('Select Output Field')" :options="filterFields(storeData.action, {
        [FieldType.DateTime]: [1, 2, 3, 4],
        [FieldType.Text]: [0],
      })
      "
    />
    <form-start v-if="!props.autoRun" :disableds="disableds" @update:click="main" />
    <form-start v-else operate :disableds="disableds" msg="Save" @update:click="emit('save', { ...toRaw(modelData), ...toRaw(storeData) })" />
  </Layout>
</template>
