<route lang="yaml">
name: DocxTemplate
meta:
  title: DocxTemplate
  desc: "DocxTemplate allows users to upload a Word template file and automatically replace placeholders with table data. This plugin supports various operations, including inserting images and more."
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
      style="margin-bottom: 12px"
      accept=".docx">
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
        <n-text style="font-size: 16px">{{ t("Please select Word(.docx) template file") }}</n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          {{
            t(
              "The template markup language is {'{'}{'{'} text() {'}'}{'}'}. Using angle brackets to wrap the field name will automatically replace it with the corresponding value."
            )
          }}
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
      <n-button type="warning" @click="openPreview" :disabled="openPreviewDisabled">
        {{ t("preview window") }}
      </n-button>
      <n-button type="warning" @click="savePreview">{{ t("Download preview") }}</n-button>
    </form-start>
  </Layout>
</template>

<script setup lang="ts">
import VueOfficeDocx from "@vue-office/docx"
import format from "date-fns/format"
import {createReport} from "docx-templates"
import {saveAs} from "file-saver"
import {UploadCustomRequestOptions} from "naive-ui"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {blobToFile, fileToBuf, Progress, TextFieldToStr} from "@/utils"
import request from "@/utils/request"

const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)
let table: ITable
let attachments: Record<string, IAttachmentField> = {}
let wordFile: ArrayBuffer
const wordPreview = ref<Blob>()
const wordPreviewSpin = ref(false)
const openPreviewDisabled = ref(false)
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

function openPreview() {
  let docwindow = window.open(
    "",
    "_blank",
    "width=920, height=675, top=100, left=100, popup=yes, toolbar=no, menubar=no, location=no, status=no"
  )
  if (!docwindow) {
    return
  }
  openPreviewDisabled.value = true
  docwindow.document.body.style.margin = "0px"
  docwindow.document.title = "DocxTemplate PreviewWindow"
  createApp({
    render() {
      return h(VueOfficeDocx, {
        "src": wordPreview.value,
        "options": {"useBase64URL": true}
      })
    }
  }).mount(docwindow.document.body)
}

const customRequest = async ({file, onFinish}: UploadCustomRequestOptions) => {
  wordPreviewSpin.value = true
  wordFile = await fileToBuf(file.file as File)
  wordPreview.value = await create(undefined, undefined, false)
  wordPreviewSpin.value = false
  onFinish()
}

async function create(
  fields?: {
    [fieldId: string]: IOpenCellValue
  },
  recordId?: string,
  log = true
) {
  const base: Record<string, any> = {
    "json": (obj: object) => JSON.stringify(obj)
  }
  if (fields && recordId && store.input) {
    await Promise.all(
      (store.input as string[]).map(async id => {
        const val = fields[id]
        const name = store.name(id)
        if (!name) {
          return
        }
        let data: any = "null"
        if (val) {
          switch (store.type(id)) {
            case FieldType.Text:
            case FieldType.Url:
            case FieldType.User:
            case FieldType.GroupChat:
              data = (v?: string) => TextFieldToStr(val, v)
              break
            case FieldType.DateTime:
              data = (f = "yyyy-MM-dd HH:mm") => format(val as number, f)
              break
            case FieldType.Attachment:
              {
                const temp = await Promise.all(
                  (await attachments[id].getAttachmentUrls(recordId)).map(async (url, index) => {
                    const res = await request.get(url, {"responseType": "arraybuffer"})
                    const name = (val as IOpenAttachment[])[index].name
                    let extension = name.substring(name.lastIndexOf("."))
                    if (extension === ".webp") {
                      extension = ".png"
                    }
                    return {"width": 6, "height": 6, "data": res.data, extension}
                  })
                )
                data = (
                  width?: number,
                  height?: number,
                  rotation?: number,
                  caption?: string,
                  alt?: string,
                  extension?: string
                ) => {
                  return temp.map(item => {
                    const newItem: Record<string, any> = {...item}
                    if (width) {
                      height = height ?? width
                      newItem.width = width
                      newItem.height = height
                    }
                    newItem.rotation = rotation
                    newItem.caption = caption
                    newItem.alt = alt
                    if (extension) {
                      newItem.extension = extension
                    }
                    return newItem
                  })
                }
              }
              break
            default:
              data = val
          }
        }
        base[name] = data
        base[name + "Raw"] = val
      })
    )
  }
  const t = performance.now()
  const document = await createReport({
    // @ts-expect-error not Buffer
    "template": wordFile,
    "additionalJsContext": base,
    "cmdDelimiter": ["{{", "}}"],
    "failFast": false,
    "errorHandler": (e: Error, raw_code?: string) => {
      if (fields && recordId && store.input) {
        console.log(e, raw_code)
      }
      if (log) {
        layout.value?.error(raw_code ?? "err", {
          "tableId": store.tableId,
          recordId
        })
      }
      return "nil"
    }
  })
  console.log(`createReport ${recordId}: ${performance.now() - t} ms`)
  return new Blob([document], {"type": "application/octet-stream"})
}

onMounted(async () => {
  const data = await store.init(layout.value!)
  table = data.table
  store.fieldMetaList?.map(item => {
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
      wordPreview.value = await create(record.fields, data.recordId, false)
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
  "Template can not be empty": "模板不能为空",
  "Please select Word(.docx) template file": "请选择Word(.docx)模板文件 ",
  "The template markup language is {'{'}{'{'} text() {'}'}{'}'}. Using angle brackets to wrap the field name will automatically replace it with the corresponding value.": "模板标记语言为 {'{'}{'{'} 文本() {'}'}{'}'}, 使用尖括号包裹字段名将自动使用对应的值替换",
  "preview window": "预览窗口",
  "Download preview": "下载预览 "
}
</i18n>

<style lang="scss" scoped></style>
