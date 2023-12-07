<route lang="yaml">
name: watermark
meta:
  title: WatermarkMaster
  desc: "WatermarkMaster is a tool that automatically adds watermarks to selected image fields. It supports multiple watermark schemes, including visible watermarks, invisible watermarks, steganography encryption and decryption, and more."
  help:
  group: 应用交流群
  tags:
    - Develop
  avatar: W
</route>

<script setup lang="ts">
import type { IRecordValue } from '@lark-base-open/js-sdk'
import WaterMark from 'l-watermark'
import { NTag, type SelectRenderTag } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { Progress } from '@/utils'
import { TextFieldToStr } from '@/utils/field'
import { base64ToBlob, blobToFile } from '@/utils/files'
import { eventBucket, useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'

let page: any
const { store } = useStore()
const { errorHandle, filterFields, getRecords, getTable, layout, onGetField, t, table, tableId, tableMetaList, viewId, viewMetaList } = useData()
const record = ref<IRecordValue>({
  fields: {},
})

const modelData = reactive<ModelType & {
  urls: string[]
  decodeUrls: string[]
}>({
  decodeUrls: [],
  input: null,
  output: null,
  urls: [],
})

const storeData = store<{
  text: string[]
  action: number
  options: {
    cSpace: number
    color: string
    fontSize: number
    vSpace: number
  }
}>('data', {
  action: 0,
  options: {
    cSpace: 0,
    color: 'rgba(222, 222, 222, 0.35)',
    fontSize: 13,
    vSpace: 0,
  },
  text: ['i'],
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!modelData.input, t('Input can not be empty')],
  [!modelData.output, t('Output can not be empty')],
  [!!modelData.input && modelData.output === modelData.input, 'Input and output cannot be the same'],
])

const previewDiv = ref()

const actions = [
  { label: 'watermark', value: 0 },
  { label: 'blind watermark', value: 1 },
  { label: 'decode watermark', value: 2 },
  // { label: 'Steganography', value: 3 },
]

const fileNameOptions = computed(() => {
  const textFields = filterFields(FieldType.Text) ?? []
  return [
    { id: 'i', name: t('For xxx verification only'), tag: 'info' },
    ...textFields.map((item) => {
      return { ...item, tag: 'error' }
    }),
  ]
})

function fileNameCreate(name: string, f: (v: { id: string, name: string, tag: string }) => void) {
  f({ id: `$BDAT$${name}`, name, tag: 'info' })
}

function fileNameLabel(option: { id: string, name: string, tag: 'error' | 'info' }): VNodeChild {
  return [
    h(
      NTag,
      {
        bordered: false,
        round: true,
        style: { marginRight: '5px' },
        type: option.tag,
      },
      option.tag === 'error' ? 'F' : 'M',
    ),
    option.name,
  ]
}

const fileNameTag: SelectRenderTag = ({ handleClose, option }) => {
  return h(
    NTag,
    {
      closable: true,
      onClose: (e: MouseEvent) => {
        e.stopPropagation()
        handleClose()
      },
      onMousedown: (e: FocusEvent) => {
        e.preventDefault()
      },
      type: option.tag as 'error' | 'info',
    },
    { default: () => option.name },
  )
}
async function start(
  records: IRecord[],
  fieldI: IAttachmentField,
  fieldO: IAttachmentField,
  pr?: Progress,
) {
  await Promise.all(
    records.map(async (record) => {
      if (modelData.input && record.fields[modelData.input]) {
        const urls = await fieldI.getAttachmentUrls(record.recordId)
        const list: File[] = []
        const files = record.fields[modelData.input] as IOpenAttachment[]

        for (let i = 0; i < urls.length; i++) {
          const url = urls[i]
          const text = storeData.value.text
            .map((item) => {
              if (item.startsWith('$BDAT$'))
                return item.slice(6)
              else if (item === 'i')
                return t('For xxx verification only')
              else if (item in record.fields)
                return TextFieldToStr(record.fields[item] as IOpenSegment[])

              return ''
            })
            .join('')
          await WaterMark.image({
            cSpace: storeData.value.options.cSpace,
            color: storeData.value.options.color,
            fontSize: storeData.value.options.fontSize,
            secret: storeData.value.action === 1,
            success: (data) => {
              list.push(blobToFile(base64ToBlob(data), files[i].name))
            },
            target: url,
            text,
            vSpace: storeData.value.options.vSpace,
          })
        }
        await fieldO.setValue(record.recordId, list)
      }
      pr?.add()
    }),
  )
}

async function main(all?: boolean) {
  if (table.value && modelData.input && modelData.output) {
    const fieldI = await table.value.getFieldById<IAttachmentField>(modelData.input)
    const fieldO = await table.value.getFieldById<IAttachmentField>(modelData.output)
    getRecords(
      ({ pr, records }) => {
        return start(records.records, fieldI, fieldO, pr)
      },
      all,
      2,
    )
      .catch((error: Error) => {
        errorHandle('main', error)
      })
      .finally(() => {
        layout.value?.finish()
      })
  }
  else {
    errorHandle('main', new Error('table or input or output is null'))
  }
}

function upPreview() {
  if (page)
    page.remove()

  if (storeData.value.action > 1)
    return

  page = WaterMark.page({
    cSpace: storeData.value.options.cSpace,
    color: storeData.value.options.color,
    fontSize: storeData.value.options.fontSize,
    target: previewDiv.value,
    text: storeData.value.text.map((item) => {
      if (item.startsWith('$BDAT$'))
        return item.slice(6)
      else if (item === 'i')
        return t('For xxx verification only')
      else if (item in record.value.fields)
        return TextFieldToStr(record.value.fields[item] as IOpenSegment[])
      return ''
    }).join(''),
    vSpace: storeData.value.options.vSpace,
    zIndex: 500,
  })
}

async function upDecodePreview() {
  modelData.decodeUrls = (
    await Promise.all(
      modelData.urls.map(async (item) => {
        if (item)
          return await WaterMark.utils.decodeImage(item)
        return null
      }),
    )
  ).filter(item => item !== null) as string[]
}

onMounted(async () => {
  await getTable()
  const off = bitable.base.onSelectionChange(async ({ data }) => {
    layout.value?.update(true, t('Parsing'))
    if (table.value && data.tableId && data.fieldId && data.recordId) {
      const field = await table.value.getFieldById<IAttachmentField>(data.fieldId)
      if ((await field.getType()) === FieldType.Attachment) {
        const cellValue = (await table.value.getCellValue(
          data.fieldId,
          data.recordId,
        )) as IOpenAttachment[]
        if (cellValue && cellValue.length > 0) {
          record.value = await table.value.getRecordById(data.recordId)
          modelData.urls = await field.getAttachmentUrls(data.recordId)
          if (storeData.value.action === 2)
            await upDecodePreview()
          upPreview()
        }
      }
    }
    layout.value?.update(false)
  })
  eventBucket.add(off)
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
      :options="filterFields(FieldType.Attachment)"
    />
    <form-radios
      v-model:value="storeData.action"
      :msg="t('Select action')"
      :datas="actions"
      @update:value="val => {
        if (val === 2) {
          upDecodePreview()
        }
      }
      "
    />
    <div v-if="storeData.action === 0 || storeData.action === 1">
      <form-select
        v-model:value="storeData.text"
        :msg="t('watermark text')"
        input
        multiple
        :render-tag="fileNameTag"
        :render-label="fileNameLabel"
        :options="fileNameOptions"
        @create="fileNameCreate"
        @update:value="upPreview"
      />
      <n-form-item :label="t('watermark color')">
        <n-color-picker
          v-model:value="storeData.options.color"
          @update:value="upPreview"
        />
      </n-form-item>
      <n-form-item :label="t('Watermark size')">
        <n-slider
          v-model:value="storeData.options.fontSize"
          :step="1"
          :min="2"
          @update:value="upPreview"
        />
      </n-form-item>
      <n-form-item :label="t('horizontal spacing')">
        <n-slider
          v-model:value="storeData.options.cSpace"
          :step="1"
          @update:value="upPreview"
        />
      </n-form-item>
      <n-form-item :label="t('Longitudinal spacing')">
        <n-slider
          v-model:value="storeData.options.vSpace"
          :step="1"
          @update:value="upPreview"
        />
      </n-form-item>
      {{ t('Preview:') }}
      <div v-show="modelData.urls.length > 0" ref="previewDiv">
        <n-carousel
          class="preview"
        >
          <img
            v-for="item in modelData.urls"
            :key="item"
            :src="item"
          >
        </n-carousel>
      </div>
      <n-result v-show="modelData.urls.length === 0" status="404" style="--n-title-font-size: 18px;" :title="t('You need to select an attachment cell')" :description="t('Life is always a little ridiculous')" />
    </div>
    <div v-if="storeData.action === 2">
      {{ t('Decrypted content:') }}
      <n-carousel
        class="preview"
        draggable
      >
        <div
          v-for="(item, index) in modelData.decodeUrls"
          :key="item"
          style="position: relative"
        >
          <img :src="modelData.urls[index]">
          <img
            class="watermark"
            :src="item"
          >
        </div>
      </n-carousel>
    </div>
    <n-alert
      v-if="storeData.action === 3"
      type="error"
    >
      未完成
    </n-alert>
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
  "watermark text": "水印文字",
  "For xxx verification only": "仅供 xxx 验证使用",
  "You need to select an attachment cell":"你需要选择某个附件单元格",
  "Life is always a little ridiculous":"生活总归带点荒谬",
  "watermark color":"水印颜色",
  "Watermark size":"水印大小",
  "horizontal spacing":"横向间距",
  "Longitudinal spacing":"纵向间距",
  "Preview:":"预览:",
  "Decrypted content:":"解密内容:"
}
</i18n>

<style lang="scss" scoped>
.preview {
  width: 100%;
  height: 300px;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
  }

  .watermark {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
  }
}
</style>
