<route lang="yaml">
name: TemplateRendering
meta:
  title: Template Renderer
  desc: >-
    Template rendering is a powerful tool that automatically passes field values
    to templates for flexible rendering. Supporting pipeline symbols allows
    users to perform advanced operations easily, enabling highly customized data
    processing.
  help: >-
    Wrap field names with {'{'}{'{'} and {'}'}{'}'} to automatically generate
    corresponding text<br/>Supports pipeline like {'{'}{'{'} username {'|'}
    append: ", welcome to LiquidJS!" {'|'} capitalize{'}'}{'}'}, for more
    syntax, please see https://liquidjs.com/
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=06fj76e0-4524-4ec9-8d90-b9e85578d126
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round"><rect x="4" y="4" width="16" height="4"
    rx="1"></rect><rect x="4" y="12" width="6" height="8" rx="1"></rect><path
    d="M14 12h6"></path><path d="M14 16h6"></path><path d="M14
    20h6"></path></g></svg>
</route>

<script setup lang="ts">
import { Liquid } from 'liquidjs'
import Layout from '@/components/layout.vue'
import type { Progress } from '@/utils'
import { TextFieldToStr } from '@/utils/field'
import { useData } from '@/hooks/useData'

const { viewId, viewMetaList, getRecords, errorHandle, layout, t, table, tableId, onGetField, getTable, tableMetaList, filterFields, fieldName, fieldType } = useData()

const engine = new Liquid()

const modelData = reactive<ModelType>({
  input: null,
  output: null,
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!modelData.input, t('Input can not be empty')],
  [!modelData.output, t('Output can not be empty')],
])

async function start(records: IRecord[], pr?: Progress) {
  return records
    .map((record) => {
      pr?.add()
      if (!modelData.input || !(modelData.input in record.fields))
        return null

      const text = TextFieldToStr(record.fields[modelData.input] as IOpenSegment[])
      const engineData: any = {}
      for (const field in record.fields) {
        const name = fieldName(field)
        if (name) {
          engineData[name] = record.fields[field]
          switch (fieldType(field)) {
            case FieldType.DateTime:
              engineData[name] /= 1000
              break
          }
        }
      }
      const res = engine.parseAndRenderSync(text, engineData)
      record.fields[modelData.output!] = res
      return record
    })
    .filter(record => record !== null) as IRecord[]
}

function main(all?: boolean) {
  getRecords(
    async ({ pr, records }) => {
      return table.value?.setRecords(await start(records.records, pr))
    },
    all,
    1000,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}
onMounted(() => {
  getTable()
})
</script>

<template>
  <Layout ref="layout">
    <n-space justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
    </n-space>
    <form-select
      v-model:value="modelData.input"
      :msg="t('Select Source Field')"
      :options="filterFields(FieldType.Text)"
    />
    <form-select
      v-model:value="modelData.output"
      :msg="t('Select Output Field')"
      :options="filterFields(FieldType.Text)"
    />
    <form-start
      :disableds="disableds"
      @update:click="main"
    />
  </Layout>
</template>
