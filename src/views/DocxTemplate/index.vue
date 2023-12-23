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
import { NTag } from 'naive-ui'
import type { SelectRenderTag, UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'
import type { FileInfo, SettledFileInfo } from 'naive-ui/es/upload/src/interface'
import type { VNodeChild } from 'vue'
import { reject } from 'lodash-es'
import type { Progress } from '@/utils'
import { TextFieldToStr } from '@/utils/field'
import { blobToFile, fileToBlob, fileToBuf } from '@/utils/files'
import request from '@/utils/request'
import { eventBucket, useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'

const { errorHandle, fieldMetaList, fieldName, fieldType, filterFields, getRecords, getTable, layout, onFieldTraverse, onGetField, t, table, tableId } = useData()
const { IDB, store } = useStore()

const attachments: Record<string, IAttachmentField> = {}
const wordFile = IDB< SettledFileInfo | object>(
  'wordFile',
  {},
  {
    deep: false,
    shallow: true,
  },
)
const now = new Date()
let docwindow: Window | null
const wordPreview = ref<Blob>()
const openPreviewDisabled = ref(false)
const defaultFileList = computed<FileInfo[]>(() => {
  return Object.keys(wordFile.data.value).length === 0 ? [] : [wordFile.data.value as FileInfo]
})

const modelData = reactive<ModelType<string[]> & {
  fileName: string[]
}>({
  fileName: ['recordID', '$ESUF$.docx'],
  input: null,
  output: null,
})

const storeData = store('data', {
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
})

watch(wordFile.data, async (val) => {
  if (Object.keys(val).length !== 0 && 'status' in val && val.status === 'finished') {
    layout.value?.update(true, t('Start rendering document'))
    wordPreview.value = await create(undefined, undefined, false)
    layout.value?.update(false)
  }
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

const outputFields = computed(() => {
  return [{ id: '_save', name: '保存到本地' }, ...filterFields(FieldType.Attachment)]
})

const fileNameType = {
  error: 'F', // "FREF", Field REFerence
  info: 'M', // "MVAL", Manually VALue
  success: 'B', // "BDAT", Built-in DATa
  warning: 'E', // "ESUF", End SUFfix
}

function updateFileName(v: string[]) {
  const docxIndex = v.findIndex(item => item === '$ESUF$.docx')
  if (docxIndex !== -1) {
    const docxValue = v.splice(docxIndex, 1)
    v.push(docxValue[0])
  }
  modelData.fileName = v
}

const fileNameOptions = computed(() => {
  const textFields = filterFields(FieldType.Text) ?? []
  return [
    ...textFields.map((item) => {
      return { ...item, tag: 'error' }
    }),
    { id: 'num0', name: t('AscendingNumbers(0)'), tag: 'success' },
    { id: 'num1', name: t('AscendingNumbers(1)'), tag: 'success' },
    { id: 'recordID', name: t('RecordID'), tag: 'success' },
    { id: 'fieldID', name: t('FieldID'), tag: 'success' },
    { id: 'date0', name: t('Timestamp(Seconds)'), tag: 'success' },
    { id: 'date1', name: 'yyyy-MM-dd_HH-mm-ss-SSS', tag: 'success' },
    { id: 'date2', name: 'HH-mm-ss-SSS', tag: 'success' },
    { id: 'date3', name: 'yyMMddHHmmss', tag: 'success' },
    { id: '$ESUF$.docx', disabled: true, name: '.docx', tag: 'warning' },
  ]
})

function fileNameCreate(name: string, f: (v: { id: string, name: string, tag: string }) => void) {
  const [id, tag] = ['$BDAT$', 'info']
  const res = { id: id + name, name, tag }
  f(res)
}

function fileNameLabel(option: {
  id: string
  name: string
  tag: keyof typeof fileNameType
}): VNodeChild {
  return [
    h(
      NTag,
      {
        bordered: false,
        round: true,
        style: { marginRight: '5px' },
        type: option.tag,
      },
      fileNameType[option.tag],
    ),
    option.name,
  ]
}

const fileNameTag: SelectRenderTag = ({ handleClose, option }) => {
  return h(
    NTag,
    {
      closable: option.id !== '$ESUF$.docx',
      onClose: (e: MouseEvent) => {
        e.stopPropagation()
        handleClose()
      },
      onMousedown: (e: FocusEvent) => {
        e.preventDefault()
      },
      type: option.tag as 'error' | 'info' | 'success' | 'warning',
    },
    { default: () => option.name },
  )
}

function generateFileName(index: number, record: IRecord): string {
  const f = (index: number, record: IRecord, item: string) => {
    if (item.startsWith('$ESUF$') || item.startsWith('$BDAT$'))
      return item.slice(6)
    switch (item) {
      case 'num0':
        return index.toString()
      case 'num1':
        return (index + 1).toString()
      case 'recordID':
        return record.recordId
      case 'date0':
        return now.getTime().toString()
      case 'date1':
        return format(now, 'yyyy-MM-dd_HH-mm-ss-SSS')
      case 'date2':
        return format(now, 'HH-mm-ss-SSS')
      case 'date3':
        return format(now, 'yyMMddHHmmss')
    }
    if (item in record.fields)
      return TextFieldToStr(record.fields[item] as IOpenSegment[])
    return ''
  }
  return modelData.fileName
    .map((item) => {
      let name = f(index, record, item)
      const invalidFileNameRegex = /[<>:"/\\|?*]/g
      if (invalidFileNameRegex.test(name))
        name = name.replace(invalidFileNameRegex, '')
      return name
    }).join('')
}

async function main(all?: boolean) {
  let directoryHandle: FileSystemDirectoryHandle
  let saveWindow: Window | null
  if (modelData.output === '_save') {
    const iTop = (window.screen.height - 30 - 150) / 2
    const iLeft = (window.screen.width - 10 - 320) / 2
    saveWindow = window.open(
      '',
      '_blank',
      `width=320, height=150, top=${iTop}, left=${iLeft}, popup=yes, toolbar=no, menubar=no, location=no, status=no`,
    )
    if (!saveWindow)
      return
    saveWindow.onbeforeunload = function (event) {
      event.returnValue = ''
      return 'Hello'
    }
    saveWindow.document.body.style.margin = '0px'
    saveWindow.document.title = 'DocxTemplate SaveWindow'
    directoryHandle = await new Promise((reject) => {
      const button = saveWindow!.document.createElement('input')
      button.type = 'button'
      button.value = '选择保存目录'
      button.style.cssText = 'width: 100vw;height: 100vh;font-size: 10vw;'
      button.onclick = async () => {
        reject(await saveWindow!.showDirectoryPicker())
      }
      saveWindow!.document.body.appendChild(button)
    })
  }
  let index = 0
  getRecords(
    ({ pr, records }) => {
      return Promise.all(
        records.records.map(async (record) => {
          const name = generateFileName(index, record)
          const file = blobToFile(
            await create(record.fields, record.recordId),
            name,
          )
          if (modelData.output && modelData.output !== '_save') {
            await attachments[modelData.output].setValue(record.recordId, file)
          }
          else {
            const fileHandle = await directoryHandle.getFileHandle(file.name, { create: true })
            const writable = await fileHandle.createWritable()
            await writable.write(file)
            await writable.close()
          }
          pr?.add()
          index++
        }),
      )
    },
    all,
    10,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
      saveWindow?.close()
    })
}

function savePreview() {
  if (wordPreview.value)
    saveAs(wordPreview.value, 'WordTemplate_Preview.docx')
}

function openPreview() {
  if (docwindow) {
    docwindow.focus()
    return
  }
  docwindow = window.open(
    '',
    '_blank',
    'width=920, height=675, top=100, left=100, popup=yes, toolbar=no, menubar=no, location=no, status=no',
  )
  if (!docwindow) {
    errorHandle('openPreview', new Error('Failed to open preview window'))
    return
  }
  // openPreviewDisabled.value = true
  docwindow.document.body.style.margin = '0px'
  docwindow.document.title = 'DocxTemplate PreviewWindow'
  // docwindow.addEventListener('beforeunload', () => {
  //   openPreviewDisabled.value = false
  // })
  createApp({
    render() {
      return h(VueOfficeDocx, {
        options: { useBase64URL: true },
        src: wordPreview.value,
      })
    },
  }).mount(docwindow.document.body)
  docwindow.focus()
}

function download() {
  if (Object.keys(wordFile.data.value).length !== 0 && 'file' in wordFile.data.value)
    saveAs(fileToBlob(wordFile.data.value.file as File), wordFile.data.value.name)
}

async function customRequest({ onFinish }: UploadCustomRequestOptions) {
  onFinish()
}

function updateFile(fileList: UploadFileInfo[]) {
  if (fileList.length === 1)
    wordFile.set(fileList[0])
  else if (fileList.length >= 2)
    wordFile.set(fileList[1])
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
  const off = bitable.base.onSelectionChange(async ({ data }) => {
    layout.value?.update(true, t('Start rendering document'))
    if (table.value && data.tableId && data.fieldId && data.recordId) {
      const record = await table.value.getRecordById(data.recordId)
      wordPreview.value = await create(record.fields, data.recordId, false)
    }
    layout.value?.update(false)
  })
  eventBucket.add(off)
})
</script>

<template>
  <Layout ref="layout">
    <n-upload
      :custom-request="customRequest"
      style="margin-bottom: 12px"
      accept=".docx"
      :file-list="defaultFileList"
      show-download-button
      @download="download"
      @update:file-list="updateFile"
      @remove="wordFile.set({})"
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
      :value="modelData.fileName"
      :msg="t('file name')"
      input
      multiple
      :render-tag="fileNameTag"
      :render-label="fileNameLabel"
      :options="fileNameOptions"
      :clearable="false"
      @create="fileNameCreate"
      @update:value="updateFileName"
    >
      <template #tooltip>
        红色
        <NTag type="error">
          F
        </NTag>
        为字段名将引用记录值
        <br>
        黄色
        <NTag type="warning">
          E
        </NTag>
        为后缀名以.开头
        <br>
        蓝色
        <NTag type="info">
          M
        </NTag>
        为手动输入数据
        <br>
        绿色
        <NTag type="success">
          B
        </NTag>
        为内置数据
      </template>
    </form-select>
    <form-select
      v-model:value="modelData.output"
      :msg="t('Select Output Field')"
      :options="outputFields"
    />
    <n-switch v-if="modelData.output === '_save'" style="margin-bottom: 25px;" :default-value="true" disabled>
      <template #checked>
        使用文件系统Api(快)
      </template>
      <template #unchecked>
        调用浏览器下载(慢)
      </template>
    </n-switch>
    <form-start
      :disableds="disableds"
      @update:click="main"
    >
      <n-button
        type="info"
        :disabled="openPreviewDisabled"
        @click="openPreview"
      >
        {{ t("preview window") }}
      </n-button>
      <n-button
        type="info"
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
  "Download preview": "下载预览",
  "Start rendering document":"开始渲染文档"
}
</i18n>

<style lang="scss" scoped></style>
