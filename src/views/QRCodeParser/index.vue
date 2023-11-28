<route lang="yaml">
name: QRCodeParser
meta:
  title: Code Scanner
  desc: >-
    This plugin identifies and decodes QR codes/barcodes within attachments,
    supporting camera invocation as a scanner. It offers multiple ways for users
    to decode, enhancing flexibility in content interpretation.
  help: >-
    Using the camera will automatically create a record, supporting copying
    specific records and overwriting content (not yet implemented)
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=bfbu40c9-5d89-47f7-9999-674b8790b42a
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M9.5
    6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11
    13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5
    1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5
    1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0
    3H19V19h-1.5v-1.5zM22 7h-2V4h-3V2h5v5zm0 15v-5h-2v3h-3v2h5zM2
    22h5v-2H4v-3H2v5zM2 2v5h2V4h3V2H2z" fill="currentColor"></path></svg>
</route>
<template>
  <Layout ref="layout">
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getField()" />
    <form-select
      :msg="t('Select QR Code / Barcode Attachment Field')"
      v-model:value="store.input"
      :options="store.filterFields(FieldType.Attachment)" />
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="store.output"
      :options="store.filterFields(FieldType.Text)" />
    <form-start @update:click="main" :disableds="disableds" />
  </Layout>
</template>

<script setup lang="ts">
import {BrowserMultiFormatReader} from "@zxing/library"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"

const {t} = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!store.output, t("Output can not be empty")]
])

async function decode(srcCell: string[], dstCell: ICell, err = 0) {
  if (err > 10) {
    return
  }
  try {
    let content = ""
    for (const item of srcCell) {
      const img = new Image()
      img.crossOrigin = ""
      img.src = item
      const reader = new BrowserMultiFormatReader()
      const res = await reader.decodeFromImage(img)
      content += res.getText() + "\n"
    }
    content = content.slice(0, -1)
    await dstCell.setValue(content)
  } catch {
    await decode(srcCell, dstCell, err + 1)
  }
}

async function start(table: ITable, record: IRecordType) {
  if (store.check()) {
    const [srcCell, dstCell] = await Promise.all([
      (await table.getField<IAttachmentField>(store.input)).getAttachmentUrls(record),
      record.getCellByField(store.output)
    ])
    await decode(srcCell, dstCell)
  }
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.check()) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    const recordList = await table.getRecordList()
    const promises: Array<Promise<unknown>> = []
    for (const record of recordList) {
      promises.push(start(table, record))
    }
    await Promise.all(promises)
  }
  layout.value?.finish()
}

onMounted(async () => {
  store.init(layout.value!)
})
</script>
