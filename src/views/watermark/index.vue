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
      :options="store.filterFields(FieldType.Attachment)" />
    <form-radios
      :msg="t('Select action')"
      v-model:value="formData.action"
      :datas="actions"
      @update:value="
        val => {
          if (val === 2) {
            upDecodePreview()
          }
        }
      " />
    <div v-if="formData.action === 0 || formData.action === 1">
      <form-select
        :msg="t('watermark text')"
        v-model:value="formData.text"
        input
        multiple
        :render-tag="fileNameTag"
        :render-label="fileNameLabel"
        :options="fileNameOptions"
        @create="fileNameCreate"
        @update:value="upPreview" />
      <n-form-item :label="t('水印颜色')">
        <n-color-picker v-model:value="formData.options.color" @update:value="upPreview" />
      </n-form-item>
      <n-form-item :label="t('水印大小')">
        <n-slider
          v-model:value="formData.options.fontSize"
          :step="1"
          :min="2"
          @update:value="upPreview" />
      </n-form-item>
      <n-form-item :label="t('横向间距')">
        <n-slider v-model:value="formData.options.cSpace" :step="1" @update:value="upPreview" />
      </n-form-item>
      <n-form-item :label="t('纵向间距')">
        <n-slider v-model:value="formData.options.vSpace" :step="1" @update:value="upPreview" />
      </n-form-item>
      预览:
      <div ref="previewDiv">
        <n-carousel class="preview" draggable>
          <img v-for="item in formData.urls" :key="item" :src="item" />
        </n-carousel>
      </div>
    </div>
    <div v-if="formData.action === 2">
      解密内容:
      <n-carousel class="preview" draggable>
        <div v-for="(item, index) in formData.decodeUrls" :key="item" style="position: relative">
          <img :src="formData.urls[index]" />
          <img class="watermark" :src="item" />
        </div>
      </n-carousel>
    </div>
    <n-alert v-if="formData.action === 3" type="error"> 未完成 </n-alert>
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="store.output"
      :options="store.filterFields(FieldType.Attachment)" />
    <form-start @update:click="main" :disableds="disableds" />
  </Layout>
</template>

<script setup lang="ts">
import {IRecordValue} from "@lark-base-open/js-sdk"
import WaterMark from "l-watermark"
import {NTag, type SelectRenderTag} from "naive-ui"
import {type VNodeChild} from "vue"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {base64ToBlob, blobToFile, Progress, TextFieldToStr} from "@/utils"

let page: any

const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)

const record = ref<IRecordValue>({
  "fields": {}
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!store.output, t("Output can not be empty")],
  [!!store.input && store.output === store.input, "Input and output cannot be the same"]
])
const previewDiv = ref()
const formData = reactive({
  "action": 0,
  "text": ["i"],
  "urls": [""],
  "decodeUrls": [""],
  "options": {
    "color": "rgba(222, 222, 222, 0.35)",
    "fontSize": 13,
    "cSpace": 0,
    "vSpace": 0
  }
})

const actions = [
  {"label": "watermark", "value": 0},
  {"label": "blind watermark", "value": 1},
  {"label": "decode watermark", "value": 2},
  {"label": "Steganography", "value": 3}
]

const fileNameOptions = computed(() => {
  const textFields = store.filterFields(FieldType.Text) ?? []
  return [
    {"name": t("For xxx verification only"), "id": "i", "tag": "info"},
    ...textFields.map(item => {
      return {...item, "tag": "error"}
    })
  ]
})

const fileNameCreate = (name: string, f: (v: {name: string; id: string; tag: string}) => void) => {
  f({name, "id": "$BDAT$" + name, "tag": "info"})
}

const fileNameLabel = (option: {name: string; id: string; tag: "info" | "error"}): VNodeChild => {
  return [
    h(
      NTag,
      {
        "type": option.tag,
        "bordered": false,
        "round": true,
        "style": {"marginRight": "5px"}
      },
      option.tag === "error" ? "F" : "M"
    ),
    option.name
  ]
}

const fileNameTag: SelectRenderTag = ({option, handleClose}) => {
  return h(
    NTag,
    {
      "type": option.tag as "error" | "info",
      "closable": true,
      "onMousedown": (e: FocusEvent) => {
        e.preventDefault()
      },
      "onClose": (e: MouseEvent) => {
        e.stopPropagation()
        handleClose()
      }
    },
    {"default": () => option.name}
  )
}
async function start(
  records: IRecord[],
  fieldI: IAttachmentField,
  fieldO: IAttachmentField,
  pr?: Progress
) {
  await Promise.all(
    records.map(async record => {
      if (store.check() && record.fields[store.input]) {
        const urls = await fieldI.getAttachmentUrls(record.recordId)
        const list: File[] = []
        const files = record.fields[store.input] as IOpenAttachment[]
        for (const index in urls) {
          const url = urls[index]
          const text = formData.text
            .map(item => {
              if (item.startsWith("$BDAT$")) {
                return item.slice(6)
              } else if (item === "i") {
                return t("For xxx verification only")
              } else if (item in record.fields) {
                return TextFieldToStr(record.fields[item] as IOpenSegment[])
              }
              return ""
            })
            .join("")
          await WaterMark.image({
            "target": url,
            "text": text,
            "color": formData.options.color,
            "fontSize": formData.options.fontSize,
            "vSpace": formData.options.vSpace,
            "cSpace": formData.options.cSpace,
            "secret": formData.action === 1,
            "success": data => {
              list.push(blobToFile(base64ToBlob(data), files[index].name))
            }
          })
        }
        await fieldO.setValue(record.recordId, list)
      }
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
    const fieldI = await table.getFieldById<IAttachmentField>(store.input)
    const fieldO = await table.getFieldById<IAttachmentField>(store.output)
    await layout.value?.getRecords(
      table,
      ({records, pr}) => {
        return start(records.records, fieldI, fieldO, pr)
      },
      all,
      1000 // 每次处理多少条记录 max:5000
    )
  }
  layout.value?.finish()
}

function upPreview() {
  if (page) {
    page.remove()
  }
  if (formData.action > 1) {
    return
  }
  page = WaterMark.page({
    "target": previewDiv.value,
    "text": formData.text
      .map(item => {
        if (item.startsWith("$BDAT$")) {
          return item.slice(6)
        } else if (item === "i") {
          return t("For xxx verification only")
        } else if (item in record.value.fields) {
          return TextFieldToStr(record.value.fields[item] as IOpenSegment[])
        }
        return ""
      })
      .join(""),
    "color": formData.options.color,
    "fontSize": formData.options.fontSize,
    "vSpace": formData.options.vSpace,
    "cSpace": formData.options.cSpace
  })
}

async function upDecodePreview() {
  formData.decodeUrls = (
    await Promise.all(
      formData.urls.map(async item => {
        if (item) {
          return await WaterMark.utils.decodeImage(item)
        }
        return null
      })
    )
  ).filter(item => item !== null) as string[]
}

onMounted(() => {
  store.init(layout.value!)
  let table: ITable
  const off = bitable.base.onSelectionChange(async ({data}) => {
    if (data.tableId && data.fieldId && data.recordId) {
      if (!table || table?.id !== data.tableId) {
        table = await bitable.base.getTableById(data.tableId)
      }
      const field = await table.getFieldById<IAttachmentField>(data.fieldId)
      if ((await field.getType()) === FieldType.Attachment) {
        const cellValue = (await table.getCellValue(
          data.fieldId,
          data.recordId
        )) as IOpenAttachment[]
        if (cellValue && cellValue.length > 0) {
          record.value = await table.getRecordById(data.recordId)
          formData.urls = await field.getAttachmentUrls(data.recordId)
          if (formData.action === 2) {
            await upDecodePreview()
          }
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
    object-fit: contain;
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
