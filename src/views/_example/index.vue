<route lang="yaml">
name: 项目名
meta:
  title: 应用标题
  desc: 应用简介
  help: 应用帮助
  group: 应用交流群
  tags:
    - 应用标签
    - Develop
  avatar: 应用图标 html格式
</route>

<script setup lang="ts">
import type { Progress } from '@/utils'
import { useData } from '@/hooks/useData'

const { getRecords, errorHandle, layout, t, table, tableId, onGetField, getTable, tableMetaList, filterFields } = useData()

const formData = reactive<ModelType>({
  input: null,
  output: null,
})

onGetField(() => {
  formData.input = null
  formData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!formData.input, t('Input can not be empty')],
  [!formData.output, t('Output can not be empty')],
])

async function start(records: IRecord[], pr?: Progress) {
  return records
    .map((record) => {
      // 逻辑代码
      pr?.add()
      return record
    })
    .filter(record => record !== null)
}

function main(all?: boolean) {
  getRecords(
    async ({ pr, records }) => {
      return table.value!.setRecords(await start(records.records, pr))
    },
    all,
    100,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
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
    <form-select
      v-model:value="tableId"
      :msg="t('Select Data Table')"
      :options="tableMetaList"
    />
    <form-select
      v-model:value="formData.input"
      :msg="t('Select Source Field')"
      :options="filterFields(FieldType.Text)"
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

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped></style>
