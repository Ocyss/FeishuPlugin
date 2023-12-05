<route lang="yaml">
name: FieldExtraction
meta:
  title: Field Extractor
  desc: >-
    This plugin easily extracts desired attributes from various fields—whether
    it's link fields for links/text, personnel fields for ID/name/email, or
    attachment fields for type/size—streamlining information processing
    workflows.
  help: ""
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=595mb5bd-1d13-4cc6-9d41-223e4b4619ae
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M20
    7h-5V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2
    2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9-3h2v5h-2V4zm0
    12H9v2H7v-2H5v-2h2v-2h2v2h2v2zm2-1.5V13h6v1.5h-6zm0 3V16h4v1.5h-4z"
    fill="currentColor"></path></svg>
</route>

<script setup lang="ts">
import { FieldType } from '@lark-base-open/js-sdk'
import format from 'date-fns/format'
import { NTime, type SelectOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import { dateFormatterList, delimiterList } from '@/utils/format'
import { FieldInfos } from '@/utils/field'
import { useData } from '@/hooks/useData'

const { getRecords, errorHandle, t, tableId, table, tableMetaList, layout, fieldMetaList, onGetField, fieldType, getTable, filterFields } = useData()

const formData = reactive({
  input: '',
  output: '',
  dateKey: '',
  delimiter: '\n',
  key: '',
})

onGetField(() => {
  formData.input = ''
  formData.output = ''
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!formData.input, t('Input can not be empty')],
  [!formData.output, t('Output can not be empty')],
])

const delimiter = computed(() =>
  delimiterList.map((item) => {
    item.name = t(item.name)
    return item
  }),
)

const fieldInfos = computed(() =>
  FieldInfos(fieldType(formData.input) as FieldType).map((item) => {
    item.name = t(item.id)
    return item
  }),
)

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
  return records
    .map((item) => {
      const val = item.fields[formData.input]
      let res = ''
      if (fieldType(formData.input) === FieldType.DateTime)
        res = format(val as number, formData.dateKey)
      else
        res = processValue(val)
      item.fields[formData.output] = res
      return item
    })
    .filter(item => item !== null)
}

function processValue(val: any): string {
  if (Array.isArray(val)) {
    return val
      .map(item => (formData.key in item ? item[formData.key] : ''))
      .join(formData.delimiter)
  }
  else {
    return formData.key === '' ? String(val) : formData.key in val ? val[formData.key] : ''
  }
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
  getTable()
})
</script>

<template>
  <Layout ref="layout">
    <form-select
      v-model:value="tableId"
      :msg="t('Select Data Table')"
      :options="tableMetaList"
    />
    <form-select
      v-model:value="formData.input"
      :msg="t('Select Extraction Field')"
      :options="fieldMetaList"
    />
    <form-select
      v-if="fieldType(formData.input) !== FieldType.DateTime"
      v-model:value="formData.key"
      :msg="t('Select Extraction Attribute')"
      input
      :tooltip="
        t(
          'Select the attributes that need to be extracted. If there are no attributes in the table, they can be entered manually. Some fields have no attributes that can be extracted',
        )
      "
      :options="fieldInfos"
    />
    <form-select
      v-else-if="fieldType(formData.input) === FieldType.DateTime"
      v-model:value="formData.dateKey"
      :msg="t('Select date format')"
      input
      :tooltip="
        `${t(
          `Select the date format, which can be entered manually. For the format, please refer to the document `,
        )
        }<a href=&quot;https://date-fns.org/v2.6.0/docs/format&quot; target=&quot;_blank&quot;>date-fns format</a>`
      "
      :options="dateFormatter"
      :render-label="dateRenderLabel"
    />
    <form-select
      v-model:value="formData.delimiter"
      :msg="t('Select Separator')"
      input
      :tooltip="
        t(
          'Select the delimiter for multi-line text, which can be entered manually. \n\\n is a newline, \\t is a tab character',
        )
      "
      :options="delimiter"
    />
    <form-select
      v-model:value="formData.output"
      :msg="t('Select Output Field')"
      :options="filterFields(FieldType.Text)"
    />
    <form-start
      :disableds="disableds"
      @update:click="main"
    />
  </Layout>
</template>
