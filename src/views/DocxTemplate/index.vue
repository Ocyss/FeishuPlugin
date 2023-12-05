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

<script setup lang="ts">
import VueOfficeDocx from '@vue-office/docx'
import format from 'date-fns/format'
import { createReport } from 'docx-templates'
import { saveAs } from 'file-saver'
import type { UploadCustomRequestOptions } from 'naive-ui'
import type { SettledFileInfo } from 'naive-ui/es/upload/src/interface'
import type { Progress } from '@/utils'
import { TextFieldToStr } from '@/utils/field'
import { blobToFile, fileToBuf } from '@/utils/files'
import request from '@/utils/request'
import { useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'

const { getRecords, errorHandle, table, layout, t, fieldName, fieldType, onGetField, tableId, fieldMetaList, filterFields, getTable, onFieldTraverse } = useData()
const { IDB } = useStore()

const attachments: Record<string, IAttachmentField> = {}
const wordFile = IDB< SettledFileInfo | object>(
  'wordFile',
  { foo: 'bar' },
  {
    deep: false,
    shallow: true,
  },
)
const wordPreview = ref<Blob>()
const wordPreviewSpin = ref(false)
const openPreviewDisabled = ref(false)

const modelData = reactive<ModelType<string[]>>({
  input: null,
  output: null,
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
})

onFieldTraverse((item) => {
  if (item.type === FieldType.Attachment) {
    void table.value?.getFieldById<IAttachmentField>(item.id).then((field) => {
      attachments[item.id] = field
    })
  }
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!modelData.input, t('Input can not be empty')],
  [!wordFile.data.value, t('Template can not be empty')],
  [!modelData.output, t('Output can not be empty')],
])

async function start(records: IRecord[], pr?: Progress) {
  await Promise.all(
    records.map(async (record) => {
      const file = blobToFile(
        await create(record.fields, record.recordId),
        `WordTemplate_${record.recordId}.docx`,
      )
      await attachments[modelData.output as string].setValue(record.recordId, file)
      pr?.add()
    }),
  )
}

function main(all?: boolean) {
  getRecords(
    ({ pr, records }) => {
      pr.add(records.records.length)
      return start(records.records, pr)
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

function savePreview() {
  if (wordPreview.value)
    saveAs(wordPreview.value, 'WordTemplate_Preview.docx')
}

function openPreview() {
  const docwindow = window.open(
    '',
    '_blank',
    'width=920, height=675, top=100, left=100, popup=yes, toolbar=no, menubar=no, location=no, status=no',
  )
  if (!docwindow)
    return

  openPreviewDisabled.value = true
  docwindow.document.body.style.margin = '0px'
  docwindow.document.title = 'DocxTemplate PreviewWindow'
  createApp({
    render() {
      return h(VueOfficeDocx, {
        options: { useBase64URL: true },
        src: wordPreview.value,
      })
    },
  }).mount(docwindow.document.body)
}

async function customRequest({ file, onFinish }: UploadCustomRequestOptions) {
  wordPreviewSpin.value = true
  await wordFile.set(file)
  wordPreview.value = await create(undefined, undefined, false)
  wordPreviewSpin.value = false
  onFinish()
}

async function create(
  fields?: {
    [fieldId: string]: IOpenCellValue
  },
  recordId?: string,
  log = true,
) {
  const base: Record<string, any> = {
    json: (obj: object) => JSON.stringify(obj),
  }
  if (fields && recordId && modelData.input) {
    await Promise.all(
      modelData.input.map(async (id) => {
        const val = fields[id]
        const name = fieldName(id)
        if (!name)
          return

        let data: any = 'null'
        if (val) {
          switch (fieldType(id)) {
            case FieldType.Text:
            case FieldType.Url:
            case FieldType.User:
            case FieldType.GroupChat:
              data = (v?: string) => TextFieldToStr(val, v)
              break
            case FieldType.DateTime:
              data = (f = 'yyyy-MM-dd HH:mm') => format(val as number, f)
              break
            case FieldType.Attachment:
              {
                const temp = await Promise.all(
                  (await attachments[id].getAttachmentUrls(recordId)).map(async (url, index) => {
                    const res = await request.get(url, { responseType: 'arraybuffer' })
                    const name = (val as IOpenAttachment[])[index].name
                    let extension = name.substring(name.lastIndexOf('.'))
                    if (extension === '.webp')
                      extension = '.png'

                    return { data: res.data, extension, height: 6, width: 6 }
                  }),
                )
                data = (
                  width?: number,
                  height?: number,
                  rotation?: number,
                  caption?: string,
                  alt?: string,
                  extension?: string,
                ) => {
                  return temp.map((item) => {
                    const newItem: Record<string, any> = { ...item }
                    if (width) {
                      height = height ?? width
                      newItem.width = width
                      newItem.height = height
                    }
                    newItem.rotation = rotation
                    newItem.caption = caption
                    newItem.alt = alt
                    if (extension)
                      newItem.extension = extension

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
        base[`${name}Raw`] = val
      }),
    )
  }
  const t = performance.now()
  const document = await createReport({
    additionalJsContext: base,
    cmdDelimiter: ['{{', '}}'],
    errorHandler: (e: Error, raw_code?: string) => {
      if (fields && recordId && modelData.input)
        console.log(e, raw_code)
      if (log) {
        layout.value?.error(raw_code ?? 'err', {
          recordId,
          tableId: tableId.value,
        })
      }
      return 'nil'
    },
    failFast: false,
    // @ts-expect-error not Buffer
    template: await fileToBuf(wordFile.data.value.file),
  })
  console.log(`createReport ${recordId}: ${performance.now() - t} ms`)
  return new Blob([document], { type: 'application/octet-stream' })
}

onMounted(async () => {
  void getTable()
  // if (wordFile.data.value)
  //   wordPreview.value = await create(undefined, undefined, false)
  console.log(wordFile.data.value)

  const off = bitable.base.onSelectionChange(async ({ data }) => {
    wordPreviewSpin.value = true
    if (table.value && data.tableId && data.fieldId && data.recordId) {
      const record = await table.value.getRecordById(data.recordId)
      wordPreview.value = await create(record.fields, data.recordId, false)
    }
    wordPreviewSpin.value = false
  })
  onBeforeUnmount(() => {
    off()
  })
})
</script>

<template>
  <Layout ref="layout">
    <n-upload
      directory-dnd
      keep-file-after-finish
      :custom-request="customRequest"
      style="margin-bottom: 12px"
      accept=".docx"
    >
      <n-upload-dragger>
        <div>
          <n-icon
            size="48"
            :depth="3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 24 24"
            >
              <path
                d="M19.41 7.41l-4.83-4.83c-.37-.37-.88-.58-1.41-.58H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8.83c0-.53-.21-1.04-.59-1.42zM14.8 15H13v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H9.21c-.45 0-.67-.54-.35-.85l2.8-2.79c.2-.19.51-.19.71 0l2.79 2.79c.3.31.08.85-.36.85zM14 9c-.55 0-1-.45-1-1V3.5L18.5 9H14z"
                fill="currentColor"
              />
            </svg>
          </n-icon>
        </div>
        <n-text style="font-size: 16px">
          {{ t("Please select Word(.docx) template file") }}
        </n-text>
        <n-p
          depth="3"
          style="margin: 8px 0 0 0"
        >
          {{
            t(
              "The template markup language is {'{'}{'{'} text() {'}'}{'}'}. Using angle brackets to wrap the field name will automatically replace it with the corresponding value.",
            )
          }}
        </n-p>
      </n-upload-dragger>
    </n-upload>
    <form-select
      v-model:value="modelData.input"
      :msg="t('Select Source Field')"
      multiple
      :options="fieldMetaList"
    />
    <form-select
      v-model:value="modelData.output"
      :msg="t('Select Output Field')"
      :options="filterFields(FieldType.Attachment)"
    />
    <form-start
      :disableds="disableds"
      @update:click="main"
    >
      <n-button
        type="warning"
        :disabled="openPreviewDisabled"
        @click="openPreview"
      >
        {{ t("preview window") }}
      </n-button>
      <n-button
        type="warning"
        @click="savePreview"
      >
        {{ t("Download preview") }}
      </n-button>
    </form-start>
  </Layout>
</template>

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
