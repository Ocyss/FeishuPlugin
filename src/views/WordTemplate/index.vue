<route lang="yaml">
name: WordTemplate
meta:
  title: WordTemplate
  desc: "WordTemplate allows users to upload a Word template file and automatically replace placeholders with table data. This plugin supports various operations, including inserting images and more."
  help:
  group:
  tags:
    - Develop
  avatar: d
</route>

<template>
  <Layout ref="layout">
    <n-upload
      directory-dnd
      keep-file-after-finish
      :custom-request="customRequest"
      @remove="wordFile = undefined"
      style="margin-bottom: 12px">
      <n-upload-dragger>
        <div>
          <n-icon size="48" :depth="3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 24 24">
              <path
                d="M19.41 7.41l-4.83-4.83c-.37-.37-.88-.58-1.41-.58H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8.83c0-.53-.21-1.04-.59-1.42zM14.8 15H13v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H9.21c-.45 0-.67-.54-.35-.85l2.8-2.79c.2-.19.51-.19.71 0l2.79 2.79c.3.31.08.85-.36.85zM14 9c-.55 0-1-.45-1-1V3.5L18.5 9H14z"
                fill="currentColor"></path>
            </svg>
          </n-icon>
        </div>
        <n-text style="font-size: 16px"> 请选择Word模板文件 </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          必须是docx后缀名，模板标记语言为 { 文本 }, 使用尖括号包裹字段名将自动使用对应的值替换
        </n-p>
      </n-upload-dragger>
    </n-upload>
    <form-select
      :msg="t('Select Source Field')"
      v-model:value="store.input"
      multiple
      :options="store.fieldMetaList" />
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="store.output"
      :options="store.filterFields(FieldType.Attachment)" />
    <form-start @update:click="main" :disableds="disableds">
      <n-button type="warning" @click="savePreview"> 下载预览 </n-button>
    </form-start>
    <n-spin :show="wordPreviewSpin">
      <vue-office-docx
        style="margin-top: 15px"
        :src="wordPreview"
        :options="{ignoreWidth: true, ignoreHeight: true, useBase64URL: true}" />
    </n-spin>
  </Layout>
</template>

<script setup lang="ts">
import VueOfficeDocx from "@vue-office/docx"
import format from "date-fns/format"
import {ImageRun, patchDocument, PatchType, TextRun} from "docx"
import {saveAs} from "file-saver"
import {UploadCustomRequestOptions} from "naive-ui"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {blobToFile, fileToBlob, Progress, TextFieldToStr} from "@/utils"
import request from "@/utils/request"

const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)
let table: ITable
let attachments: Record<string, IAttachmentField> = {}
const wordFile = ref<
  | {
      id: string
      name: string
      batchId?: string | null
      percentage?: number | null
      status: "pending" | "uploading" | "finished" | "removed" | "error"
      url?: string | null
      file?: File | null
      thumbnailUrl?: string | null
      type?: string | null
      fullPath?: string | null
    }
  | undefined
>()
const wordPreview = ref<Blob>()
const wordPreviewSpin = ref(false)
const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!wordFile, t("Template can not be empty")],
  [!store.output, t("Output can not be empty")]
])

async function start(records: IRecord[], pr?: Progress) {
  await Promise.all(
    records.map(async record => {
      const file = blobToFile(
        await create(record.fields, record.recordId),
        `WordTemplate_${record.recordId}.docx`
      )
      await attachments[store.output as string].setValue(record.recordId, file)
      pr?.add()
    })
  )
}

async function main(all?: boolean) {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.check()) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    await layout.value?.getRecords(
      table,
      ({records, pr}) => {
        return start(records.records, pr)
      },
      all,
      10
    )
  }
  layout.value?.finish()
}

function savePreview() {
  if (wordPreview.value) {
    saveAs(wordPreview.value, "testtt.docx")
  }
}

const customRequest = async ({file, onFinish}: UploadCustomRequestOptions) => {
  wordPreviewSpin.value = true
  wordFile.value = file
  wordPreview.value = await create()
  wordPreviewSpin.value = false
  onFinish()
}

async function create(
  fields?: {
    [fieldId: string]: IOpenCellValue
  },
  recordId?: string
) {
  const patches: Record<string, any> = {}
  if (fields && recordId) {
    await Promise.all(
      (store.input as string[]).map(async id => {
        let children: any
        const val = fields[id]
        if (!val) {
          return
        }
        switch (store.type(id)) {
          case FieldType.Text:
          case FieldType.Url:
          case FieldType.User:
          case FieldType.GroupChat:
            children = [new TextRun(TextFieldToStr(val))]
            break
          case FieldType.DateTime:
            children = [new TextRun(format(val as number, "yyyy-MM-dd HH:mm"))]
            break
          case FieldType.Attachment:
            children = await Promise.all(
              ((await attachments[id].getAttachmentUrls(recordId)) ?? []).map(async url => {
                const res = await request.get(url, {"responseType": "arraybuffer"})
                return new ImageRun({
                  "data": res.data,
                  "transformation": {"width": 100, "height": 100}
                })
              })
            )
            break
          default:
            return
        }
        patches[store.name(id)!] = {
          "type": PatchType.PARAGRAPH,
          children
        }
      })
    )
  }
  const document = await patchDocument(fileToBlob(wordFile.value?.file as File), {
    "patches": patches,
    "keepOriginalStyles": true
  })
  return new Blob([document], {"type": "application/octet-stream"})
}

onMounted(async () => {
  const data = await store.init(layout.value!)
  table = data.table

  store.input = store.fieldMetaList?.map(item => {
    if (item.type === FieldType.Attachment) {
      table.getFieldById<IAttachmentField>(item.id).then(field => {
        attachments[item.id] = field
      })
    }
    return item.id
  })

  const off = bitable.base.onSelectionChange(async ({data}) => {
    wordPreviewSpin.value = true
    if (data.tableId && data.fieldId && data.recordId) {
      const record = await table.getRecordById(data.recordId)
      wordPreview.value = await create(record.fields, data.recordId)
    }
    wordPreviewSpin.value = false
  })
  onBeforeUnmount(() => {
    off()
  })
})
</script>

<i18n locale="zh" lang="json">
{
  "Template can not be empty": "模板不能为空"
}
</i18n>

<style lang="scss" scoped></style>
