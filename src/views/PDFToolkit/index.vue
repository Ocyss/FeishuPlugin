<route lang="yaml">
name: PDFToolkit
meta:
  title: PDFToolkit
  desc: PDFToolkit enables seamless splitting and merging operations on PDF files based on specified page numbers, offering convenient manipulation of PDF documents.
  help:
  group:
  tags:
    - Audit
  avatar: 应用图标 html格式
</route>

<script setup lang="ts">
import { PDFMerger } from './pdf-merger'
import type { Progress } from '@/hooks/useProgress'
import { useData } from '@/hooks/useData'
import { TextFieldToStr } from '@/utils/field'

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
// const { store } = useStore()

const modelData = reactive<ModelType & {
  pages: string | null
  model: boolean
}>({
  input: null,
  model: false,
  output: null,
  pages: null,
})

// const storeData = store<{
//   action: 0 | 1
// }>('data', {
//   action: 0,
// })

onGetField(() => {
  modelData.input = null
  modelData.pages = null
  modelData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [
    !modelData.input,
    t('Input can not be empty'),
  ],
  [
    !modelData.output,
    t('Output can not be empty'),
  ],
  [
    !modelData.model && !modelData.pages,
    t('The split notes cannot be empty'),
  ],
])

function pagesCreate(name: string, f: (v: { id: string, name: string }) => void) {
  f({ id: `$BDAT$${name}`, name })
}

function start(records: IRecord[], pr: Progress, inField: IAttachmentField, outField: IAttachmentField) {
  return Promise.all(
    records
      .map(async (record) => {
        try {
          const val = record.fields[modelData.input!] as IOpenAttachment[]
          if (!val)
            return
          const urls = await inField.getAttachmentUrls(record.recordId)
          if (urls.length === 0)
            return
          const files: File[] = []
          if (modelData.model) {
            const merger = new PDFMerger()
            for (const url of urls)
              await merger.add(url)
            const blob = await merger.saveAsBlob()
            files.push(new File([blob], val[0].name))
          }
          else {
            let text = modelData.pages
            if (!text)
              text = '1'
            else if (text.startsWith('$BDAT$'))
              text = text.slice(6)
            else if (text in record.fields)
              text = TextFieldToStr(record.fields[text])

            const pages = text.replaceAll(/\b(?:end|e(?:nd)?)\b/gi, '1000').replaceAll(/\b(?:start|s(?:tart)?)\b/gi, '1')
              .split('/')
            console.log(record.recordId, text, pages)

            for (const page of pages) {
              const merger = new PDFMerger()
              await merger.add(urls[0], page)
              const blob = await merger.saveAsBlob()
              files.push(new File([blob], val[0].name))
            }
          }
          await outField.setValue(record.recordId, files)
        }
        catch (e) {
          layout.value?.error(t('unknown mistake'), {
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
  if (!table.value || !modelData.input || !modelData.output)
    return
  layout.value?.update(true, t('Get field information'))
  const [
    inField,
    outField,
  ] = await Promise.all([
    table.value.getFieldById<IAttachmentField>(modelData.input),
    table.value.getFieldById<IAttachmentField>(modelData.output),
  ])

  getRecords(
    ({ pr, records }) => {
      return start(records.records, pr, inField, outField)
    },
    all,
    3,
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
    <n-switch v-model:value="modelData.model" style="margin-bottom: 15px;">
      <template #checked>
        {{ t('Merge Mode') }}
      </template>
      <template #unchecked>
        {{ t('Split Mode') }}
      </template>
    </n-switch>
    <form-select
      v-model:value="modelData.input"
      :msg="t('Select Source Field')"
      :options="filterFields(FieldType.Attachment)"
    />
    <form-select
      v-if="!modelData.model"
      v-model:value="modelData.pages"
      :msg="t('Configuration split')"
      input
      :options="filterFields(FieldType.Text)"
      @create="pagesCreate"
    >
      <template #tooltip>
        {{ t('Can be entered manually or specified by fields') }}
        <n-ul style="--n-text-color:unset;">
          <n-li>{{ t("Use `,` to separate individual page numbers, such as 3,5,8, to split and merge into one file for pages 3, 5, and 8.") }}</n-li>
          <n-li>{{ t("Use `-` or `to` to indicate a range, such as 3-7, to split and merge into one file from page 3 to page 7.") }}</n-li>
          <n-li>{{ t("Use `/` to create an additional file, such as 1/2-5, to split into two files, the first with only page 1, and the second from page 2 to page 5.") }}</n-li>
          <n-li>{{ t("Use `start/s` or `end/e` to represent the starting page or ending page, such as 5-end, to split from page 5 to the last page, and start-5, to split from the first page to page 5.") }}</n-li>
        </n-ul>
      </template>
    </form-select>
    <form-select
      v-model:value="modelData.output"
      :msg="t('Select Output Field')"
      :options="filterFields(FieldType.Attachment)"
    />
    <form-start
      :disableds="disableds"
      @update:click="main"
    />
  </Layout>
</template>

<i18n locale="zh" lang="json">
{
  "Merge Mode": "合并模式",
  "Split Mode": "拆分模式",
  "Can be entered manually or specified by fields": "可以手动输入，也可以指定字段",
  "Use `,` to separate individual page numbers, such as 3,5,8, to split and merge into one file for pages 3, 5, and 8.": "使用`,`来分隔单个页码，如 3,5,8 将按3,5,8页进行拆分合并为一个文件。",
  "Use `-` or `to` to indicate a range, such as 3-7, to split and merge into one file from page 3 to page 7.": "使用`-`或`to`来表示一个区间，如 3-7 将从第3页开始到第7页进行拆分合并为一个文件。",
  "Use `/` to create an additional file, such as 1/2-5, to split into two files, the first with only page 1, and the second from page 2 to page 5.": "使用`/`额外创建一个文件，如 1/2-5 将拆分为两个文件，第一个文件只有第一页，第二个文件从第2页到第5页。",
  "Use `start/s` or `end/e` to represent the starting page or ending page, such as 5-end, to split from page 5 to the last page, and start-5, to split from the first page to page 5.": "使用`start/s`或`end/e`来代表起始页码或结束页码，如 5-end 将从第5页拆分到最后一页，start-5 将从第1页拆分到第5页。",
  "Configuration split":"配置拆分符",
  "The split notes cannot be empty":"拆分符不能为空",
  "unknown mistake":"未知错误",
  "Get field information":"获取字段信息"
}
</i18n>

<style lang="scss" scoped></style>
