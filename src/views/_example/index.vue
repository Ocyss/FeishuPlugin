<route lang="yaml">
name: 项目名
meta:
  title: 应用标题
  desc: 应用简介
  help: 应用帮助
  group: 应用交流群
  tags:
    - 应用标签
  avatar: 应用图标 html格式
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
    <form-start @update:click="main" :disableds="[]" />
  </Layout>
</template>

<script setup lang="ts">
import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {Progress} from "@/utils"

const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)

async function start(records: IRecord[], pr?: Progress) {
  return records
    .map(record => {
      // 逻辑代码
      pr?.add()
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
      1000 // 每次处理多少条记录 max:5000
    )
    layout.value?.finish()
  }
  layout.value?.update(false)
}

onMounted(() => {
  store.init(layout.value!)
})
</script>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped></style>
