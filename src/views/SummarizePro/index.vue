<route lang="yaml">
name: SummarizePro
meta:
  title: SummarizePro
  desc: "SummarizePro (Intelligent Summarizer) is an intelligent tool based on the ChatGPT API, designed to assist users in summarizing text fields or articles intelligently. Leveraging advanced natural language processing, this plugin supports multi-field assignment, offering users high-quality summaries and abstracts."
  help:
  group:
  tags:
    - Personal
  avatar: <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 448 512"><path d="M224 373.12c-25.24-31.67-40.08-59.43-45-83.18c-22.55-88 112.61-88 90.06 0c-5.45 24.25-20.29 52-45 83.18zm138.15 73.23c-42.06 18.31-83.67-10.88-119.3-50.47c103.9-130.07 46.11-200-18.85-200c-54.92 0-85.16 46.51-73.28 100.5c6.93 29.19 25.23 62.39 54.43 99.5c-32.53 36.05-60.55 52.69-85.15 54.92c-50 7.43-89.11-41.06-71.3-91.09c15.1-39.16 111.72-231.18 115.87-241.56c15.75-30.07 25.56-57.4 59.38-57.4c32.34 0 43.4 25.94 60.37 59.87c36 70.62 89.35 177.48 114.84 239.09c13.17 33.07-1.37 71.29-37.01 86.64zm47-136.12C280.27 35.93 273.13 32 224 32c-45.52 0-64.87 31.67-84.66 72.79C33.18 317.1 22.89 347.19 22 349.81C-3.22 419.14 48.74 480 111.63 480c21.71 0 60.61-6.06 112.37-62.4c58.68 63.78 101.26 62.4 112.37 62.4c62.89.05 114.85-60.86 89.61-130.19c.02-3.89-16.82-38.9-16.82-39.58z" fill="currentColor"></path></svg>
</route>

<template>
  <Layout ref="layout">
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getField()" />
    <n-tabs type="segment">
      <n-tab-pane name="chap1" tab="总结" display-directive="show">
        <form-select
          :msg="t('选择总结内容')"
          v-model:value="input"
          multiple
          :options="store.fieldMetaList"
          @update:value="outputs = {}" />
        <form-select
          :msg="t('选择输出字段')"
          v-model:value="output"
          multiple
          :options="store.fieldMetaList" />
        <template v-for="id in output" :key="id">
          <n-form-item :label="store.name(id)! + ' 描述'">
            <n-input
              v-model:value="outputs[store.name(id)!]"
              style="width: 100%"
              placeholder=""></n-input>
          </n-form-item>
          <!-- <n-form-item :label="store.name(id)! + ' 示例'">
            <n-input
              v-model:value="outputss[store.name(id)!]"
              style="width: 100%"
              placeholder=""></n-input>
          </n-form-item> -->
        </template>

        <form-start @update:click="main" :disableds="disableds" />
      </n-tab-pane>
      <n-tab-pane name="chap2" tab="微调" display-directive="show">
        <form-input-number
          msg="模型参数"
          :data="parameter"
          vertical
          input-style="width: 100%"
          prefix />
      </n-tab-pane>
      <n-tab-pane name="chap3" tab="配置" display-directive="show">
        <form-input :data="conf" />
      </n-tab-pane>
    </n-tabs>
  </Layout>
</template>

<script setup lang="ts">
import {IMultiSelectField, ISingleSelectField} from "@lark-base-open/js-sdk"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {Progress, TextFieldToStr} from "@/utils"
import request from "@/utils/request"
const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)

const input = ref([])
const output = ref([])
const outputs = ref<Record<string, any>>({})

const disableds = computed<Array<[boolean, string]>>(() => [
  [input.value.length === 0, t("Input can not be empty")]
])

const conf = reactive<Record<string, any>>({
  "API请求地址": "https://api.chatanywhere.com.cn",
  "API Key": "",
  "model": "gpt-4"
})

const parameter = reactive<Record<string, undefined | number>>({
  "temperature": undefined,
  "top_p": undefined,
  "max_tokens": undefined,
  "frequency_penalty": undefined,
  "logit_bias": undefined
})

async function start(req: string, records: IRecord[], pr: Progress) {
  const processedRecords = await Promise.all(
    records.map(async record => {
      pr.add()
      const text = input.value
        .map(v => TextFieldToStr(record.fields[v]))
        .join("\t\t")
        .slice(0, 4000)
      const res = await request.post(
        conf["API请求地址"] + "/v1/chat/completions",
        {
          "model": conf.model,
          "messages": [
            {
              "role": "user",
              "content": `你叫做“智能总结大师”，是一款智能助手，接下来你会分析下面的文章：
"""
${text}
"""
设定：
1. 要求输出结构化 JSON 对象，符合下面 TypeScript：
interface Res {
  ${req}
}
`
            }
          ],
          "temperature": parameter["temperature"],
          "top_p": parameter["top_p"],
          "max_tokens": parameter["max_tokens"],
          "frequency_penalty": parameter["frequency_penalty"],
          "logit_bias": parameter["logit_bias"]
        },
        {
          "headers": {
            "Authorization": "Bearer " + conf["API Key"],
            "Content-Type": "application/json"
          },
          "timeout": 120000
        }
      )
      const reply = JSON.parse(res.data?.choices[0]?.message?.content)
      for (const key in reply) {
        const id = store.id(key)
        if (id) {
          record.fields[id] = reply[key]
        }
      }
      return record
    })
  )
  return processedRecords.filter(record => record !== null) as IRecord[]
}

function generator(name: string, field: IFieldMeta, options: Record<string, any>) {
  switch (field.type) {
    case FieldType.MultiSelect:
      if (field.id in options && Array.isArray(options[field.id])) {
        return `${name}?: {id:string,name:string}[] //多选多 ${JSON.stringify(
          options[field.id]
        ).replace(/\s+/g, "")} ${outputs.value[name]}`
      }
      break
    case FieldType.SingleSelect:
      if (field.id in options && Array.isArray(options[field.id])) {
        return `${name}?: {id:string,name:string} //多选一  ${JSON.stringify(
          options[field.id]
        ).replace(/\s+/g, "")} ${outputs.value[name]}`
      }
      break
    case FieldType.Text:
      return `${name}?: string // ${outputs.value[name]}`
    case FieldType.Number:
      return `${name}?: number // ${outputs.value[name]}`
    case FieldType.DateTime:
      return `${name}?: number //日期毫秒级时间戳  ${outputs.value[name]}`
    case FieldType.Checkbox:
      return `${name}?: boolean // ${outputs.value[name]}`
    case FieldType.Progress:
      return `${name}?: number // ${outputs.value[name]}`
    case FieldType.Rating:
      return `${name}?: number // ${outputs.value[name]}`
  }
  return "\n"
}

async function main(all?: boolean) {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.tableId && input.value.length > 0 && output.value.length > 0) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    const options: Record<string, any> = {}
    if (store.fieldMetaList) {
      for (const mate of store.fieldMetaList) {
        if (mate.type === FieldType.SingleSelect || mate.type === FieldType.MultiSelect) {
          const field = await table.getFieldById<ISingleSelectField | IMultiSelectField>(mate.id)
          options[mate.id] = await field.getOptions()
        }
      }
    }
    const req = output.value
      .map(item => {
        return generator(
          store.name(item) as string,
          store.fieldMetaList!.find(v => item === v.id)!,
          options
        )
      })
      .join("\n  ")
    console.log(req)

    await layout.value?.getRecords(
      table,
      async ({records, pr}) => {
        console.log(records)

        return table.setRecords(await start(req, records.records, pr))
      },
      all,
      10
    )
  }
  layout.value?.finish()
}

onMounted(() => {
  store.init(layout.value!)
})
</script>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped></style>
