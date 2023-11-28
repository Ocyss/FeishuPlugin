<route lang="yaml">
name: IDcardWithdrawal
meta:
  title: ID Info Extractor
  desc: >-
    By inputting an ID card number, this plugin intelligently extracts
    information such as age, gender, date of birth, zodiac sign, Chinese zodiac,
    and native place. This smart identification greatly simplifies the handling
    of ID card information.
  help: >-
    According to the ID number, obtain age, gender, date of birth,
    constellation, zodiac sign, and place of origin information.
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=06fj76e0-4524-4ec9-8d90-b9e85578d126
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 576 512"><path
    d="M528 32H48C21.5 32 0 53.5 0 80v16h576V80c0-26.5-21.5-48-48-48zM0 432c0
    26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V128H0v304zm352-232c0-4.4 3.6-8
    8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16zm0
    64c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H360c-4.4
    0-8-3.6-8-8v-16zm0 64c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8
    8H360c-4.4 0-8-3.6-8-8v-16zM176 192c35.3 0 64 28.7 64 64s-28.7 64-64
    64s-64-28.7-64-64s28.7-64 64-64zM67.1 396.2C75.5 370.5 99.6 352 128
    352h8.2c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h8.2c28.4 0 52.5 18.5 60.9
    44.2c3.2 9.9-5.2 19.8-15.6 19.8H82.7c-10.4 0-18.8-10-15.6-19.8z"
    fill="currentColor"></path></svg>
</route>
<template>
  <Layout ref="layout">
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getField()" />
    <form-select
      :msg="t('Select ID field')"
      v-model:value="store.input"
      :options="store.filterFields(FieldType.Text)" />
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="store.output"
      :options="store.filterFields([FieldType.Text, FieldType.Number])" />
    <form-select
      :msg="t('Select output format')"
      v-model:value="formData.format"
      :options="outputFormat"
      multiple
      v-if="store.output && store.type(store.output) == FieldType.Text" />
    <form-select
      :msg="t('Select output format')"
      :value="t('age')"
      disabled
      v-else-if="store.output && store.type(store.output) == FieldType.Number" />
    <form-start @update:click="main" :disableds="disableds" />
  </Layout>
</template>

<script setup lang="ts">
import idcard from "@fekit/idcard"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {TextFieldToStr} from "@/utils"

const {t} = useI18n()

const layout = ref<InstanceType<typeof Layout> | null>(null)

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!store.output, t("Output can not be empty")]
])

const InfoFields = [
  "gender", // 性别
  "birthday", // 出生日期
  "age", // 年龄
  "adreass", // 籍贯
  "province", // 省
  "city", // 市
  "area", // 区县
  "zodiac", // 生肖
  "constellation" // 星座
] as const

type InfoField = (typeof InfoFields)[number]

const formData = reactive<{format?: InfoField[]}>({
  "format": []
})

const outputFormat = InfoFields.map(item => {
  return {"name": t(item), "id": item}
})

function start(recordId: string, val: IOpenCellValue): string | number | null {
  const text = TextFieldToStr(val as IOpenSegment[])
  const info = idcard(text)
  if (!info) {
    layout.value?.error(t("ID card format error"), {
      "tableId": store.tableId!,
      "fieldId": store.input!,
      recordId
    })
    return null
  }
  const getValueByField = (item: InfoField) => {
    const textFields = ["province", "area", "city"]
    if (textFields.includes(item)) {
      return typeof info[item] === "string" ? info[item] : info[item].text
    }
    return info[item]
  }

  const res =
    store.type(store.output) === FieldType.Text
      ? formData.format!.map(item => getValueByField(item)).join(" ")
      : info.age
  return res
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.check()) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    await layout.value?.getRecords(
      table,
      ({records, pr}) => {
        const newVals = records.records
          .map(item => {
            pr.add()
            if (
              store.check() &&
              store.input in item.fields &&
              store.output in item.fields &&
              item.fields[store.input]
            ) {
              const val = item.fields[store.input]
              item.fields[store.output] = start(item.recordId, val)
              return item
            }
            return null
          })
          .filter(item => item !== null) as IRecord[]
        return table.setRecords(newVals)
      },
      1000
    )
  }
  layout.value?.finish()
}

onMounted(async () => {
  store.init(layout.value!)
})
</script>
