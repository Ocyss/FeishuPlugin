<route lang="yaml">
name: chineseToNumber
meta:
  title: chineseToNumber
  desc: chineseToNumber converts mixed Chinese and English text into numerical fields, supporting Arabic numerals, Chinese numerals, and accounting numerals.
  help:
  group:
  tags:
    - Audit
  avatar: c
</route>

<script setup lang="ts">
import chineseToNumber from "./chineseToNumber"
import type {Progress} from "@/utils"
import {useData} from "@/hooks/useData"
import {TextFieldToStr} from "@/utils/field"

const {
  errorHandle,
  fieldType,
  filterFields,
  getRecords,
  getTable,
  layout,
  onGetField,
  t,
  table,
  tableId,
  tableMetaList,
  viewId,
  viewMetaList
} = useData()
// const { store } = useStore()

const modelData = reactive<ModelType>({
  input: null,
  output: null
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!modelData.input, t("Input can not be empty")],
  [!modelData.output, t("Output can not be empty")]
])

async function start(records: IRecord[], pr?: Progress) {
  return records
    .map(record => {
      if (!modelData.input || !modelData.output || record.fields[modelData.input] === null)
        return null
      const val = TextFieldToStr(record.fields[modelData.input])
      try {
        const out = chineseToNumber(val)
        if (fieldType(modelData.output) === FieldType.Text)
          record.fields[modelData.output] = String(out)
        else record.fields[modelData.output] = out
      } catch (err: any) {
        layout.value?.error(err?.message ?? "未知错误", {
          fieldId: modelData.input,
          recordId: record.recordId,
          tableId: tableId.value,
          viewId: viewId.value
        })
        return null
      }
      pr?.add()
      return record
    })
    .filter(record => record !== null) as IRecord[]
}

function main(all?: boolean) {
  getRecords(
    async ({pr, records}) => {
      return table.value!.setRecords(await start(records.records, pr))
    },
    all,
    5000
  )
    .catch((error: Error) => {
      errorHandle("main", error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}

onMounted(() => {
  void getTable()
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
      :options="filterFields(FieldType.Text)" />
    <form-select
      v-model:value="modelData.output"
      :msg="t('Select Output Field')"
      :options="filterFields([FieldType.Text, FieldType.Number, FieldType.Currency])" />
    <form-start :disableds="disableds" @update:click="main" />
  </Layout>
</template>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped></style>
