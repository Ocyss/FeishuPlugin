<route lang="yaml">
name: JsonParser
meta:
  title: JSON Parser
  desc: >-
    This parser intelligently interprets data from JSON strings, allocating data
    to corresponding cells based on key-value pairs or array sequences. Such
    functionality makes handling complex JSON data easy and efficient.
  help: >-
    Supports parsing objects & arrays into respective cells. Array length and
    output length must match. Provide timestamps for date fields instead of
    strings. Refer to documentation for more field details.
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=1faj62f2-b373-4442-a8a7-c53a08bf67a4
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M31
    11v10h-2l-2-6v6h-2V11h2l2 6v-6h2z" fill="currentColor"></path><path
    d="M21.334 21h-2.667A1.668 1.668 0 0 1 17 19.334v-6.667A1.668 1.668 0 0 1
    18.666 11h2.667A1.668 1.668 0 0 1 23 12.666v6.667A1.668 1.668 0 0 1 21.334
    21zM19 19h2v-6h-2z" fill="currentColor"></path><path d="M13.334
    21H9v-2h4v-2h-2a2.002 2.002 0 0 1-2-2v-2.334A1.668 1.668 0 0 1 10.666
    11H15v2h-4v2h2a2.002 2.002 0 0 1 2 2v2.333A1.668 1.668 0 0 1 13.334 21z"
    fill="currentColor"></path><path d="M5.333 21H2.667A1.668 1.668 0 0 1 1
    19.334V17h2v2h2v-8h2v8.334A1.668 1.668 0 0 1 5.333 21z"
    fill="currentColor"></path></svg>
</route>

<script lang="ts" setup>
import type { SelectOption } from 'naive-ui'
import { useClipboard } from '@vueuse/core'
import type { Progress } from '@/utils'
import { TextFieldToStr, fieldDefault } from '@/utils/field'
import { useData } from '@/hooks/useData'

const { getRecords, errorHandle, layout, t, table, tableId, viewId, viewMetaList, fieldMetaList, onFieldTraverse, fieldName, onGetField, fieldId, fieldType, getTable, tableMetaList, filterFields, message } = useData()

const { copy } = useClipboard()

const modelData = reactive< ModelType & { fieldList: string[] }>({
  input: null,
  fieldList: [],
})

onGetField(() => {
  modelData.input = null
  modelData.fieldList = []
})

onFieldTraverse((item) => {
  modelData.fieldList.push(item.id)
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!modelData.input, t('Input can not be empty')],
  [!viewId.value, t('View can not be empty')],
])

function start(records: IRecord[], pr: Progress) {
  return records
    .map((record) => {
      pr.add()
      if (modelData.input && modelData.input in record.fields) {
        const text = TextFieldToStr(record.fields[modelData.input])
        const track = {
          recordId: record.recordId,
          tableId: tableId.value,
          viewId: viewId.value,
        }
        try {
          const obj = JSON.parse(text)
          if (Array.isArray(obj)) {
            if (modelData.fieldList.length === obj.length) {
              obj.forEach((value: any, index: number) => {
                record.fields[modelData.fieldList[index]] = value
              })
            }
            else {
              layout.value?.error(t('Array Length Error'), track)
            }
          }
          else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
              const id = fieldId(key) as string
              if (id && modelData.fieldList.includes(id))
                record.fields[id] = obj[key]
            }
          }
          return record
        }
        catch (e) {
          layout.value?.error(t('Not in JSON Format'), track)
        }
      }
      return null
    })
    .filter(record => record !== null) as IRecord[]
}

function main(all?: boolean) {
  getRecords(
    ({ pr, records }) => {
      return table.value!.setRecords(start(records.records, pr))
    },
    all,
    3000,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}

function inputUpdate() {
  modelData.fieldList = fieldMetaList.value?.map(item => item.id).filter(item => item !== modelData.input) ?? []
}

function fieldUpdate() {
  const orderMap: any = {}
  fieldMetaList.value?.forEach((element, index) => {
    orderMap[element.id] = index
  })
  modelData.fieldList.sort((a, b) => {
    return orderMap[a] - orderMap[b]
  })
}

async function toCopy(flag = true) {
  const res: Record<string, any> = {}
  for (const field of modelData.fieldList) {
    const name = fieldName(field)
    if (name)
      res[name] = fieldDefault(fieldType(field))
  }
  if (flag)
    await copy(JSON.stringify(res, null, '  '))
  else
    await copy(JSON.stringify(Object.values(res), null, '  '))
  message.success(t('Copy Successful'))
}

onMounted(async () => {
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
      :msg="t('Select Input Field')"
      :options="filterFields(FieldType.Text)"
      @update:value="inputUpdate"
    />
    <form-select
      v-model:value="modelData.fieldList"
      :msg="t('Select Output Field')"
      :options="
        fieldMetaList?.map(item => {
          // 拷贝防止影响其他值
          const val: SelectOption = { ...item }
          if (val.id === modelData.input) {
            val.disabled = true
          }
          return val
        })
      "
      multiple
      @update:value="fieldUpdate"
    />
    <form-start
      :disableds="disableds"
      @update:click="main"
    >
      <n-button
        type="info"
        size="large"
        @click="() => toCopy(true)"
      >
        {{ t("Copy as Object") }}
      </n-button>
      <n-button
        type="info"
        size="large"
        @click="() => toCopy(false)"
      >
        {{ t("Copy as Array") }}
      </n-button>
    </form-start>
  </Layout>
</template>
