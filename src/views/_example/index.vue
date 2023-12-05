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

const { viewId, viewMetaList, getRecords, errorHandle, layout, t, table, tableId, onGetField, getTable, tableMetaList, filterFields } = useData()
// const { store } = useStore()

const modelData = reactive<ModelType>({
  input: null,
  output: null,
})

// const storeData = store<{
//   action: 0 | 1
// }>('data', {
//   action: 0,
// })

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

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped></style>
