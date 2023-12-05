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
import add from 'date-fns/add'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import set from 'date-fns/set'
import { NTime, type SelectOption } from 'naive-ui'
import { generateNumber } from 'random-ease'
import type { VNodeChild } from 'vue'
import { dateFormatterList } from '@/utils/format'
import { TextFieldToStr } from '@/utils/field'
import { useData } from '@/hooks/useData'

const { t, filterFields, getTable, layout, tableId, tableMetaList, table, onGetField, errorHandle, getRecords } = useData()
enum ActionType {
  Format = 0,
  Add = 1,
  Parse = 2,
  SetMonth = 3,
  Randomize = 4,
}
const formData = reactive<{
  'action': ActionType
  'dateKey': null | string
  'input': null | string
  'output': null | string
}>({
  action: ActionType.Format,
  dateKey: null,
  input: null,
  output: null,
})

onGetField(() => {
  formData.input = null
  formData.output = null
})

const radios = [
  { label: 'format', value: 0 },
  { label: 'add-subtract', value: 1 },
  { label: 'text to time', value: 2 },
  { label: 'settings', value: 3 },
  { label: 'random', value: 4 },
]

const dateAdd = reactive({
  days: 0,
  hours: 0,
  minutes: 0,
  months: 0,
  seconds: 0,
  weeks: 0,
  years: 0,
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!formData.input, t('Input can not be empty')],
  [!formData.output, t('Output can not be empty')],
])

const dateSet = reactive<{
  date?: number
  hours?: number
  minutes?: number
  month?: number
  seconds?: number
  year?: number
}>({
  date: undefined,
  hours: undefined,
  minutes: undefined,
  month: undefined,
  seconds: undefined,
  year: undefined,
})

const dateRand = reactive({
  date: false,
  hours: false,
  minutes: false,
  month: false,
  seconds: false,
  year: false,
})

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

function start(records: IRecord[]): IRecord[] {
  const actionOptions = {
    [ActionType.Format]: (val: number) => format(val, formData.dateKey!),
    [ActionType.Add]: (val: number) => add(val, dateAdd).getTime(),
    [ActionType.Parse]: (val: IOpenSegment[]) => {
      for (const format of dateFormatterList) {
        try {
          const result = parse(TextFieldToStr(val), format, 0).getTime()
          if (!Number.isNaN(result))
            return result
        }
        catch (err) {
          /* Ignore parsing errors */
        }
      }
      return null
    },
    [ActionType.SetMonth]: (val: number) => set(val, {
      ...dateSet,
      month: dateSet.month !== undefined ? dateSet.month - 1 : undefined,
    }).getTime(),
    [ActionType.Randomize]: (val: number) => set(val, {
      date: dateRand.date ? generateNumber(1, 28) : undefined,
      hours: dateRand.hours ? generateNumber(0, 23) : undefined,
      minutes: dateRand.minutes ? generateNumber(0, 59) : undefined,
      month: dateRand.month ? generateNumber(0, 11) : undefined,
      seconds: dateRand.seconds ? generateNumber(0, 59) : undefined,
      year: dateRand.year ? generateNumber(1971, 2030) : undefined,
    }).getTime(),
  }
  return records
    .map((item) => {
      if (
        formData.input && formData.output
        && formData.input in item.fields
        && formData.output in item.fields
        && item.fields[formData.input]
      ) {
        const val = item.fields[formData.input]
        item.fields[formData.output] = actionOptions[formData.action](val as number & IOpenSegment[])
        return item
      }
      return null
    })
    .filter(item => item !== null) as IRecord[]
}

function main(all?: boolean) {
  getRecords(
    ({ pr, records }) => {
      pr.add(records.records.length)
      return table.value!.setRecords(start(records.records))
    },
    all,
    5000,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}

onMounted(async () => {
  void getTable()
})
</script>

<template>
  <Layout ref="layout">
    <form-select v-model:value="tableId" :msg="t('Select Data Table')" :options="tableMetaList" />
    <form-radios
      v-model:value="formData.action" :msg="t('Select action')" :datas="radios" @update:value="() => {
        formData.output = null
        formData.input = null
      }
      "
    />
    <form-select
      v-model:value="formData.input" :msg="t('Select action field')" :options="filterFields(formData.action, {
        [FieldType.DateTime]: [0, 1, 3, 4],
        [FieldType.Text]: [2],
      })
      "
    />
    <form-select
      v-if="formData.action === 0" v-model:value="formData.dateKey" :msg="t('Select date format')" input
      :tooltip="`${t(
        `Select the date format, which can be entered manually. For the format, please refer to the document `,
      )
      }<a href=&quot;https://date-fns.org/v2.6.0/docs/format&quot; target=&quot;_blank&quot;>date-fns format</a>`
      " :options="dateFormatter" :render-label="dateRenderLabel"
    />
    <form-input-number
      v-else-if="formData.action === 1" :msg="t('Time addition and subtraction operations')"
      :data="dateAdd"
    />
    <form-input-number v-else-if="formData.action === 3" :msg="t('Time setting operation')" :data="dateSet" />
    <n-form-item v-else-if="formData.action === 4" :label="t('Time random operation')">
      <n-space item-style="display: flex;" align="center">
        <n-checkbox v-for="(_, key) in dateRand" :key="key" v-model:checked="dateRand[key]" :label="t(key)" />
      </n-space>
    </n-form-item>
    <form-select
      v-model:value="formData.output" :msg="t('Select Output Field')" :options="filterFields(formData.action, {
        [FieldType.DateTime]: [1, 2, 3, 4],
        [FieldType.Text]: [0],
      })
      "
    />
    <form-start :disableds="disableds" @update:click="main" />
  </Layout>
</template>
