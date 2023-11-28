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
<template>
  <Layout ref="layout">
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getView()" />
    <form-select
      :msg="t('Select View')"
      v-model:value="store.viewId"
      :options="store.viewMetaList"
      @update:value="() => store.getField()" />
    <form-select
      :msg="t('Select Input Field')"
      v-model:value="store.input"
      :options="store.filterFields(FieldType.Text)"
      @update:value="inputUpdate" />
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="formData.fieldList"
      :options="
        store.fieldMetaList?.map(item => {
          // 拷贝防止影响其他值
          const val: SelectOption = {...item}
          if (val.id === store.input) {
            val.disabled = true
          }
          return val
        })
      "
      multiple
      @update:value="fieldUpdate" />
    <form-start @update:click="main" :disableds="disableds">
      <n-button type="info" size="large" @click="() => toCopy(true)">
        {{ t("Copy as Object") }}
      </n-button>
      <n-button type="info" size="large" @click="() => toCopy(false)">
        {{ t("Copy as Array") }}
      </n-button>
    </form-start>
  </Layout>
</template>

<script lang="ts" setup>
import {type SelectOption} from "naive-ui"
import useClipboard from "vue-clipboard3"
import {useI18n} from "vue-i18n"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {fieldDefault, type Progress, TextFieldToStr} from "@/utils"

const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)

const {toClipboard} = useClipboard()

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!store.viewId, t("View can not be empty")]
])

const formData = reactive<{fieldList: string[]}>({
  "fieldList": []
})

function start(records: IRecord[], pr: Progress) {
  return records
    .map(record => {
      pr.add()
      if (store.check(false) && store.input in record.fields) {
        const text = TextFieldToStr(record.fields[store.input])
        const track = {
          "tableId": store.tableId,
          "viewId": store.viewId,
          "recordId": record.recordId
        }
        try {
          const obj = JSON.parse(text)
          if (Array.isArray(obj)) {
            if (formData.fieldList.length === obj.length) {
              obj.forEach((value: any, index: number) => {
                record.fields[formData.fieldList[index]] = value
              })
            } else {
              layout.value?.error(t("Array Length Error"), track)
            }
          } else if (typeof obj === "object" && obj !== null) {
            for (const key in obj) {
              const fieldId = store.id(key)
              if (fieldId && formData.fieldList.some(item => item === fieldId)) {
                record.fields[fieldId] = obj[key]
              }
            }
          }
          return record
        } catch (e) {
          layout.value?.error(t("Not in JSON Format"), track)
        }
      }
      return null
    })
    .filter(record => record !== null) as IRecord[]
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.check(false)) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    await layout.value?.getRecords(
      table,
      ({records, pr}) => {
        return table.setRecords(start(records.records, pr))
      },
      3000
    )
  }
  layout.value?.finish()
}

function inputUpdate() {
  formData.fieldList =
    store.fieldMetaList?.map(item => item.id).filter(item => item !== store.input) ?? []
}

function fieldUpdate() {
  const orderMap: any = {}
  store.fieldMetaList?.forEach((element, index) => {
    orderMap[element.id] = index
  })
  formData.fieldList.sort((a, b) => {
    return orderMap[a] - orderMap[b]
  })
}

async function toCopy(flag = true) {
  const res: Record<string, any> = {}
  for (const field of formData.fieldList) {
    const name = store.name(field)
    if (name) {
      res[name] = fieldDefault(store.type(field))
    }
  }
  if (flag) {
    await toClipboard(JSON.stringify(res, null, "  "))
  } else {
    await toClipboard(JSON.stringify(Object.values(res), null, "  "))
  }
  alert(t("Copy Successful"))
}

onMounted(async () => {
  const data = await store.init(layout.value!, true)
  const ids = data.fieldMetaList?.map(item => item.id)
  if (ids) {
    formData.fieldList = [...ids]
  }
})
</script>
