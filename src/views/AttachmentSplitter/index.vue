<route lang="yaml">
name: AttachmentSplitter
meta:
  title: AttachmentSplitter
  desc: AttachmentSplitter allows convenient splitting of fields containing multiple attachments into multiple rows based on specified formats.
  help:
  group:
  tags:
    - Develop
  avatar: 应用图标 html格式
</route>

<script setup lang="ts">
import type { TreeSelectOption } from 'naive-ui'
import type { Progress } from '@/utils'
import { useData } from '@/hooks/useData'
const { errorHandle, fieldId, filterFields, getRecords, getTable, layout, onGetField, t, table, tableId, tableMetaList, viewId, viewMetaList } = useData()
// const { store } = useStore()

const modelData = reactive({
  input: null,
  neglect: [] as string[],
  options: [] as string[],
})

const flag = computed(() => modelData.options.reduce((acc: Record<string, boolean>, val) => {
  acc[val] = true
  return acc
}, {}))

const options: TreeSelectOption[] = [
  {
    key: 'notUpdate',
    label: '不修改当前记录',
  },
  {
    children: [
      {
        key: 'a0',
        label: '仅添加关联',
      },
      {
        disabled: true,
        key: 'a1',
        label: '创建关联视图',
      },
      {
        disabled: true,
        key: 'a2',
        label: '隐藏关联字段',
      },
    ],
    key: 'addLink',
    label: '单向关联',
  },
]

// const storeData = store<{
//   action: 0 | 1
// }>('data', {
//   action: 0,
// })

onGetField(() => {
  modelData.input = null
  modelData.neglect.length = 0
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!modelData.input, t('Input can not be empty')],
])
let linkId: string
function start(records: IRecord[], pr?: Progress, linkFlag = false) {
  return Promise.all(records
    .map(async (record) => {
      if (!modelData.input || !table.value)
        return
      const val = record.fields[modelData.input] as IOpenAttachment[] | null
      if (!val || val.length === 0)
        return

      for (let i = flag.value.notUpdate ? 0 : 1; i < val.length; i++) {
        const newRecord: IRecordValue = {
          fields: {
            ...record.fields,
          },
        }
        for (const id of modelData.neglect) {
          if (newRecord.fields[id])
            delete newRecord.fields[id]
        }
        newRecord.fields[modelData.input] = [val[i]]
        if (linkFlag && linkId) {
          newRecord.fields[linkId] = {
            recordIds: [record.recordId],
            tableId: tableId.value!,
          } as unknown as IOpenLink
        }
        await table.value.addRecord(newRecord)
      }
      if (!flag.value.notUpdate) {
        record.fields[modelData.input] = [val[0]]
        await table.value.setRecord(record.recordId, record)
      }
      let vId: string | null | undefined = viewId.value
      if (linkFlag && flag.value.a1) {
        vId = viewMetaList.value.find(item => item.name === '附件拆分多行关联视图')?.id
        if (!vId)
          vId = (await table.value.addView({ name: '附件拆分多行关联视图', type: ViewType.Grid })).viewId
      }
      pr?.add()
    }))
}

async function main(all?: boolean) {
  linkId = fieldId('附件拆分多行') as string
  const linkFlag = flag.value.a0 || flag.value.a1 || flag.value.a2
  if (!linkId && linkFlag && table.value)
    linkId = await table.value.addField({ name: '附件拆分多行', property: { multiple: false, tableId: tableId.value! }, type: FieldType.SingleLink })
  getRecords(
    ({ pr, records }) => {
      return start(records.records, pr, linkFlag)
    },
    all,
    200,
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
      :msg="t('选择需要拆分的附件字段')"
      :options="filterFields(FieldType.Attachment)"
    />
    <n-form-item label="拆分选项">
      <n-tree-select
        v-model:value="modelData.options"
        check-strategy="child"
        multiple
        cascade
        checkable
        clearable
        :options="options"
      />
    </n-form-item>
    <form-select
      v-model:value="modelData.neglect"
      multiple
      :msg="t('忽略同步的字段')"
      :options="filterFields().filter(item => item.id !== modelData.input)"
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
