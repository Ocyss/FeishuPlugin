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

<template>
  <Layout ref="layout">
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getField()" />
    <form-select
      :msg="t('Select Source Field')"
      v-model:value="store.input"
      :options="store.filterFields(FieldType.Text)" />
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="store.output"
      :options="store.filterFields(FieldType.Text)" />
    <form-start @update:click="main" :disableds="disableds" />
  </Layout>
</template>

<script setup lang="ts">
import {Liquid} from "liquidjs"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {Progress, TextFieldToStr} from "@/utils"

const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)
const engine = new Liquid()

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!store.output, t("Output can not be empty")]
])

async function start(records: IRecord[], pr?: Progress) {
  return records
    .map(record => {
      pr?.add()
      if (!store.input || !(store.input in record.fields)) {
        return null
      }
      const text = TextFieldToStr(record.fields[store.input] as IOpenSegment[])
      const engineData: any = {}
      for (const field in record.fields) {
        const name = store.name(field)
        if (name) {
          engineData[name] = record.fields[field]
          switch (store.type(field)) {
            case FieldType.DateTime:
              engineData[name] /= 1000
              break
          }
        }
      }
      const res = engine.parseAndRenderSync(text, engineData)
      record.fields[store.output!] = res
      return record
    })
    .filter(record => record !== null) as IRecord[]
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.check()) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    await layout.value?.getRecords(
      table,
      async ({records, pr}) => {
        return table.setRecords(await start(records.records, pr))
      },
      30
    )
  }
  layout.value?.finish()
}

onMounted(() => {
  store.init(layout.value!)
})
</script>
