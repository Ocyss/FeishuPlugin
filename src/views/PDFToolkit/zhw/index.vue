<route lang="yaml">
name: PDFToolkitZhw
meta:
  title: PDFToolkitZhw定制版
  desc: PDFToolkit enables seamless splitting and merging operations on PDF files based on specified page numbers, offering convenient manipulation of PDF documents.
  help: 很方便的将PDF文件按照页码进行拆分，也能很方便的将多个PDF附件合并成一个
  group:
  tags:
    - Audit
  avatar: 应用图标 html格式
</route>

<script setup lang="ts">
import type { IDuplexLinkField } from '@lark-base-open/js-sdk'
import { PDFMerger } from '../pdf-merger'
import { EventBucket, type Progress } from '@/utils'
import { useData } from '@/hooks/useData'
import { TextFieldToStr, fieldMaps } from '@/utils/field'
import { useStore } from '@/hooks/useStore'
import type { FieldMaps } from '@/types'

const {
  errorHandle,
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
  viewMetaList,
} = useData()
const { store } = useStore()

const offCalls = new EventBucket()
const table2 = shallowRef<ITable | null>(null)
const view2 = shallowRef<IView | null>(null)
const view2MetaList = shallowRef<IViewMeta[]>([])
const field2MetaList = shallowRef<IFieldMeta[]>([])
const fieldMap = shallowRef<FieldMaps>()

async function _setTable(tableId: string | null) {
  if (tableId) {
    layout.value?.getTablePermission(tableId)
    table2.value = await bitable.base.getTableById(tableId)
    offCalls.clear()
    offCalls.add(
      table2.value.onFieldAdd(getView),
      table2.value.onFieldDelete(getView),
      table2.value.onFieldModify(getView),
    )
    await getView()
  }
}

async function _setView(viewId: string | null) {
  if (viewId && table.value) {
    view2.value = await table2.value!.getViewById(viewId)
    await getField()
  }
}

const table2Id = computed({
  get() {
    return table2.value?.id ?? null
  },
  set(tableId) {
    _setTable(tableId)
  },
})

const view2Id = computed({
  get() { return view2.value?.id ?? null },
  set(viewId) {
    _setView(viewId)
  },
})

async function getView() {
  layout.value?.update(true, t('Update view data'))
  if (!tableId.value || !table2.value)
    throw new Error('table is empty')
  const views = await table2.value.getViewMetaList()
  view2MetaList.value = views.filter(item => item.type === base.ViewType.Grid)
  if (view2MetaList.value.length > 0)
    await _setView(view2MetaList.value[0].id)
}

async function getField() {
  layout.value?.update(true, t('Update field data'))
  if (!table.value || !view2.value)
    throw new Error('table or view is empty')
  field2MetaList.value = await view2.value.getFieldMetaList()
  fieldMap.value = fieldMaps(field2MetaList.value)
  layout.value?.update(false)
}

const storeData = store(`data`, {
  input: null as null | string,
  link: null as null | string,
  output: null as null | string,
  pages: null as null | string,
})

onGetField(() => {
  storeData.value.input = null
  storeData.value.pages = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [
    !storeData.value.input,
    t('Input can not be empty'),
  ],
  [
    !storeData.value.output,
    t('Output can not be empty'),
  ],
  [
    !storeData.value.pages,
    t('拆分符不能为空'),
  ],
])

function pagesCreate(name: string, f: (v: { id: string, name: string }) => void) {
  f({ id: `$BDAT$${name}`, name })
}

function start(
  records: IRecord[],
  pr: Progress,
  inField: IAttachmentField,
  outField: IAttachmentField,
  linkField: IDuplexLinkField,
) {
  return Promise.all(
    records
      .map(async (record) => {
        try {
          const val = record.fields[storeData.value.input!] as IOpenAttachment[]
          if (!val)
            return
          const urls = await inField.getAttachmentUrls(record.recordId)
          if (urls.length === 0)
            return
          let text = storeData.value.pages
          if (!text) {
            text = '1'
          }
          else if (text.startsWith('$BDAT$')) {
            text = text.slice(6)
          }
          else if (text in record.fields) {
            if (!record.fields[text])
              return
            text = TextFieldToStr(record.fields[text])
          }

          const news = text.replaceAll(/\b(?:end|e(?:nd)?)\b/gi, '1000').replaceAll(/\b(?:start|s(?:tart)?)\b/gi, '1')
            .split(',')
          console.log(record.recordId, text, news)
          for (const n of news) {
            const files: File[] = []
            const pages = n.split('/')
            for (const page of pages) {
              const merger = new PDFMerger()
              await merger.add(urls[0], page)
              const blob = await merger.saveAsBlob()
              files.push(new File([blob], val[0].name))
            }
            const cell = await Promise.all([
              outField.createCell(files),
              // @ts-expect-error deprecated val
              linkField.createCell({
                recordIds: [record.recordId],
                tableId: tableId.value!,
                text: '',
              }),
            ])
            await table2.value!.addRecord(cell)
          }
          // await outField.setValue(record.recordId, files)
        }
        catch (e) {
          layout.value?.error('未知错误', {
            recordId: record.recordId,
            tableId: tableId.value,
            viewId: viewId.value,
          })
          console.error(e)
        }
        finally {
          pr?.add()
        }
      }),
  )
}

async function main(all?: boolean) {
  if (!table.value || !table2.value || !storeData.value.input || !storeData.value.output || !storeData.value.link)
    return
  layout.value?.update(true, '获取字段信息')
  const [
    inField,
    outField,
    linkField,
  ] = await Promise.all([
    table.value.getFieldById<IAttachmentField>(storeData.value.input),
    table2.value.getFieldById<IAttachmentField>(storeData.value.output),
    table2.value.getFieldById<IDuplexLinkField>(storeData.value.link),
  ])

  getRecords(
    ({ pr, records }) => {
      return start(records.records, pr, inField, outField, linkField)
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

onMounted(async () => {
  await getTable()
  table2.value = table.value
  await getView()
})

onBeforeUnmount(() => {
  offCalls.clear()
})
</script>

<template>
  <Layout ref="layout">
    <n-space justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
    </n-space>
    <form-select
      v-model:value="storeData.input"
      :msg="t('Select Source Field')"
      :options="filterFields(FieldType.Attachment)"
    />
    <form-select
      v-model:value="storeData.pages"
      :msg="t('配置拆分符')"
      input
      :options="filterFields(FieldType.Text)"
      @create="pagesCreate"
    >
      <template #tooltip>
        可以手动输入，也可以指定字段
        <n-ul>
          <n-li>使用`,`表示创建一个新记录。</n-li>
          <n-li>使用`-`或`to`表示一个区间</n-li>
          <n-li>使用`/`表示创建一个文件</n-li>
          <n-li>使用`start/s`或`end/e`来代表起始页码或结束页码</n-li>
        </n-ul>
      </template>
    </form-select>
    <n-space justify="space-between">
      <form-tags v-model:value="table2Id" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="view2Id" :msg="t('View')" :tags="view2MetaList" />
    </n-space>
    <form-select
      v-model:value="storeData.link"
      :msg="t('选择关联字段')"
      :options="field2MetaList.filter(item => item.type === FieldType.DuplexLink)"
    />
    <form-select
      v-model:value="storeData.output"
      :msg="t('Select Output Field')"
      :options="field2MetaList.filter(item => item.type === FieldType.Attachment)"
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
