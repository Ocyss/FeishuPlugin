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
import { useData } from '@/hooks/useData'

let page: any

const { layout, t, table, tableId, onGetField, getTable, tableMetaList, filterFields } = useData()
const record = ref<IRecordValue>({
  fields: {},
})

const formData = reactive<ModelType & {
  urls: string[]
  text: string[]
}>({
  input: null,
  output: null,
  action: 0,
  decodeUrls: [''],
  options: {
    cSpace: 0,
    color: 'rgba(222, 222, 222, 0.35)',
    fontSize: 13,
    vSpace: 0,
  },
  text: ['i'],
  urls: [''],
})

onGetField(() => {
  formData.input = null
  formData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!formData.input, t('Input can not be empty')],
  [!formData.output, t('Output can not be empty')],
  [!!formData.input && formData.output === formData.input, 'Input and output cannot be the same'],
])

const previewDiv = ref()

const actions = [
  { label: 'watermark', value: 0 },
  { label: 'blind watermark', value: 1 },
  { label: 'decode watermark', value: 2 },
  { label: 'Steganography', value: 3 },
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
      if (formData.input && record.fields[formData.input]) {
        const urls = await fieldI.getAttachmentUrls(record.recordId)
        const list: File[] = []
        const files = record.fields[formData.input] as IOpenAttachment[]
        for (const index in urls) {
          const url = urls[index]
          const text = formData.text
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
            cSpace: formData.options.cSpace,
            color: formData.options.color,
            fontSize: formData.options.fontSize,
            secret: formData.action === 1,
            success: (data) => {
              list.push(blobToFile(base64ToBlob(data), files[index].name))
            },
            target: url,
            text,
            vSpace: formData.options.vSpace,
          })
        }
        await fieldO.setValue(record.recordId, list)
      }
      pr?.add()
    }),
  )
}

async function main(all?: boolean) {
  layout.value?.update(true, t('Step 1 - Getting Table'))
  layout.value?.init()
  if (table.value && formData.input && formData.output) {
    layout.value?.update(true, t('Step 2 - Getting Records'))
    const fieldI = await table.value.getFieldById<IAttachmentField>(formData.input)
    const fieldO = await table.value.getFieldById<IAttachmentField>(formData.output)
    await layout.value?.getRecords(
      table.value,
      ({ pr, records }) => {
        return start(records.records, fieldI, fieldO, pr)
      },
      all,
      1000, // 每次处理多少条记录 max:5000
    )
  }
  layout.value?.finish()
}

function upPreview() {
  if (page)
    page.remove()

  if (formData.action > 1)
    return

  page = WaterMark.page({
    cSpace: formData.options.cSpace,
    color: formData.options.color,
    fontSize: formData.options.fontSize,
    target: previewDiv.value,
    text: formData.text.map((item) => {
      if (item.startsWith('$BDAT$'))
        return item.slice(6)
      else if (item === 'i')
        return t('For xxx verification only')
      else if (item in record.value.fields)
        return TextFieldToStr(record.value.fields[item] as IOpenSegment[])
      return ''
    }).join(''),
    vSpace: formData.options.vSpace,
    zIndex: 500,
  })
}

async function upDecodePreview() {
  formData.decodeUrls = (
    await Promise.all(
      formData.urls.map(async (item) => {
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
    if (table.value && data.tableId && data.fieldId && data.recordId) {
      const field = await table.value.getFieldById<IAttachmentField>(data.fieldId)
      if ((await field.getType()) === FieldType.Attachment) {
        const cellValue = (await table.value.getCellValue(
          data.fieldId,
          data.recordId,
        )) as IOpenAttachment[]
        if (cellValue && cellValue.length > 0) {
          record.value = await table.value.getRecordById(data.recordId)
          formData.urls = await field.getAttachmentUrls(data.recordId)
          if (formData.action === 2)
            await upDecodePreview()
          upPreview()
        }
      }
    }
  })
  onBeforeUnmount(() => {
    off()
    page?.remove()
  })
})
</script>

<template>
  <Layout ref="layout">
    <form-select
      v-model:value="tableId"
      :msg="t('Select Data Table')"
      :options="tableMetaList"
    />
    <form-select
      v-model:value="formData.input"
      :msg="t('Select Source Field')"
      :options="filterFields(FieldType.Attachment)"
    />
    <form-radios
      v-model:value="formData.action"
      :msg="t('Select action')"
      :datas="actions"
      @update:value="val => {
        if (val === 2) {
          upDecodePreview()
        }
      }
      "
    />
    <div v-if="formData.action === 0 || formData.action === 1">
      <form-select
        v-model:value="formData.text"
        :msg="t('watermark text')"
        input
        multiple
        :render-tag="fileNameTag"
        :render-label="fileNameLabel"
        :options="fileNameOptions"
        @create="fileNameCreate"
        @update:value="upPreview"
      />
      <n-form-item :label="t('水印颜色')">
        <n-color-picker
          v-model:value="formData.options.color"
          @update:value="upPreview"
        />
      </n-form-item>
      <n-form-item :label="t('水印大小')">
        <n-slider
          v-model:value="formData.options.fontSize"
          :step="1"
          :min="2"
          @update:value="upPreview"
        />
      </n-form-item>
      <n-form-item :label="t('横向间距')">
        <n-slider
          v-model:value="formData.options.cSpace"
          :step="1"
          @update:value="upPreview"
        />
      </n-form-item>
      <n-form-item :label="t('纵向间距')">
        <n-slider
          v-model:value="formData.options.vSpace"
          :step="1"
          @update:value="upPreview"
        />
      </n-form-item>
      预览:
      <div ref="previewDiv">
        <n-carousel
          class="preview"
        >
          <img
            v-for="item in formData.urls"
            :key="item"
            :src="item"
          >
        </n-carousel>
      </div>
    </div>
    <div v-if="formData.action === 2">
      解密内容:
      <n-carousel
        class="preview"
        draggable
      >
        <div
          v-for="(item, index) in formData.decodeUrls"
          :key="item"
          style="position: relative"
        >
          <img :src="formData.urls[index]">
          <img
            class="watermark"
            :src="item"
          >
        </div>
      </n-carousel>
    </div>
    <n-alert
      v-if="formData.action === 3"
      type="error"
    >
      未完成
    </n-alert>
    <form-select
      v-model:value="formData.output"
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
  "For xxx verification only": "仅供 xxx 验证使用"
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
