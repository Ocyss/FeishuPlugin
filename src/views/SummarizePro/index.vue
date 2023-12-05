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

<script setup lang="ts">
import type { IMultiSelectField, ISingleSelectField } from '@lark-base-open/js-sdk'
import { useData } from '@/hooks/useData'
import type { Progress } from '@/utils'
import { TextFieldToStr } from '@/utils/field'
import request from '@/utils/request'
import { useStore } from '@/hooks/useStore'

const { store } = useStore()
const { getRecords, errorHandle, layout, t, table, tableId, onGetField, getTable, tableMetaList, fieldId, fieldName, fieldMetaList } = useData()

const modelData = reactive< ModelType<string[], string[]> & { outputs: Record<string, any> }>({
  input: [],
  output: [],
  outputs: {},
})

onGetField(() => {
  modelData.input = []
  modelData.output = []
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [modelData.input?.length === 0, t('Input can not be empty')],
])

const storeData = store<{
  conf: {
    APIKey: string
    API请求地址: string
    model: string
  }
  parameter: {
    frequency_penalty: null | number
    logit_bias: null | number
    max_tokens: null | number
    temperature: null | number
    top_p: null | number
  }
}>('data', {
  conf: {
    APIKey: '',
    API请求地址: 'https://api.chatanywhere.com.cn',
    model: 'gpt-4',
  },
  parameter: {
    frequency_penalty: null,
    logit_bias: null,
    max_tokens: null,
    temperature: null,
    top_p: null,
  },
})

async function start(req: string, records: IRecord[], pr: Progress) {
  const processedRecords = await Promise.all(
    records.map(async (record) => {
      pr.add()
      const text = modelData.input
        ?.map(v => TextFieldToStr(record.fields[v]))
        .join('\t\t')
        .slice(0, 4000)
      const res = await request.post(
        `${storeData.value.conf.API请求地址}/v1/chat/completions`,
        {
          frequency_penalty: storeData.value.parameter.frequency_penalty,
          logit_bias: storeData.value.parameter.logit_bias,
          max_tokens: storeData.value.parameter.max_tokens,
          messages: [
            {
              content: `你叫做“智能总结大师”，是一款智能助手，接下来你会分析下面的文章：
"""
${text}
"""
设定：
1. 要求输出结构化 JSON 对象，符合下面 TypeScript：
interface Res {
  ${req}
}
`,
              role: 'user',
            },
          ],
          model: storeData.value.conf.model,
          temperature: storeData.value.parameter.temperature,
          top_p: storeData.value.parameter.top_p,
        },
        {
          headers: {
            'Authorization': `Bearer ${storeData.value.conf.APIKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      )
      const reply = JSON.parse(res.data?.choices[0]?.message?.content)
      for (const key in reply) {
        const id = fieldId(key)
        if (id)
          record.fields[id] = reply[key]
      }
      return record
    }),
  )
  return processedRecords.filter(record => record !== null)
}

function generator(name: string, field: IFieldMeta, options: Record<string, any>) {
  switch (field.type) {
    case FieldType.MultiSelect:
      if (field.id in options && Array.isArray(options[field.id])) {
        return `${name}?: {id:string,name:string}[] //多选多 ${JSON.stringify(
          options[field.id],
        ).replace(/\s+/g, '')} ${modelData.outputs[name]}`
      }
      break
    case FieldType.SingleSelect:
      if (field.id in options && Array.isArray(options[field.id])) {
        return `${name}?: {id:string,name:string} //多选一  ${JSON.stringify(
          options[field.id],
        ).replace(/\s+/g, '')} ${modelData.outputs[name]}`
      }
      break
    case FieldType.Text:
      return `${name}?: string // ${modelData.outputs[name]}`
    case FieldType.Number:
      return `${name}?: number // ${modelData.outputs[name]}`
    case FieldType.DateTime:
      return `${name}?: number //日期毫秒级时间戳  ${modelData.outputs[name]}`
    case FieldType.Checkbox:
      return `${name}?: boolean // ${modelData.outputs[name]}`
    case FieldType.Progress:
      return `${name}?: number // ${modelData.outputs[name]}`
    case FieldType.Rating:
      return `${name}?: number // ${modelData.outputs[name]}`
  }
  return '\n'
}

async function main(all?: boolean) {
  const options: Record<string, any> = {}
  if (fieldMetaList.value) {
    for (const mate of fieldMetaList.value) {
      if (mate.type === FieldType.SingleSelect || mate.type === FieldType.MultiSelect) {
        const field = await table.value!.getFieldById<IMultiSelectField | ISingleSelectField>(mate.id)
        options[mate.id] = await field.getOptions()
      }
    }
  }
  const req = modelData.output!
    .map((item) => {
      return generator(
        fieldName(item) as string,
        fieldMetaList.value.find(v => item === v.id)!,
        options,
      )
    })
    .join('\n  ')
  console.log(req)
  getRecords(
    async ({ pr, records }) => {
      console.log(records)
      return table.value!.setRecords(await start(req, records.records, pr))
    },
    all,
    10,
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
    <form-select
      v-model:value="tableId"
      :msg="t('Select Data Table')"
      :options="tableMetaList"
    />
    <n-tabs type="segment">
      <n-tab-pane
        name="chap1"
        tab="总结"
        display-directive="show"
      >
        <form-select
          v-model:value="modelData.input"
          :msg="t('选择总结内容')"
          multiple
          :options="fieldMetaList"
          @update:value="modelData.outputs = {}"
        />
        <form-select
          v-model:value="modelData.output"
          :msg="t('选择输出字段')"
          multiple
          :options="fieldMetaList"
        />
        <template
          v-for="id in modelData.output"
          :key="id"
        >
          <n-form-item :label="`${fieldName(id)!} 描述`">
            <n-input
              v-model:value="modelData.outputs[fieldName(id)!]"
              style="width: 100%"
              placeholder=""
            />
          </n-form-item>
          <!-- <n-form-item :label="store.name(id)! + ' 示例'">
            <n-input
              v-model:value="outputss[store.name(id)!]"
              style="width: 100%"
              placeholder=""></n-input>
          </n-form-item> -->
        </template>

        <form-start
          :disableds="disableds"
          @update:click="main"
        />
      </n-tab-pane>
      <n-tab-pane
        name="chap2"
        tab="微调"
        display-directive="show"
      >
        <form-input-number
          msg="模型参数"
          :data="storeData.parameter"
          vertical
          input-style="width: 100%"
          prefix
        />
      </n-tab-pane>
      <n-tab-pane
        name="chap3"
        tab="配置"
        display-directive="show"
      >
        <form-input :data="storeData.conf" />
      </n-tab-pane>
    </n-tabs>
  </Layout>
</template>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped></style>
