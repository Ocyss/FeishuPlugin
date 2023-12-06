<route lang="yaml">
name: kkview
meta:
  title: UniversalPreviewer
  desc: "UniversalPreviewer is a multifunctional plugin that allows users to effortlessly preview file contents by selecting cells or links. This tool supports previews for almost all commonly used file formats, offering users a comprehensive viewing experience for file content."
  help:
  group: 应用交流群
  tags:
    - Audit
  avatar: K
</route>

<script setup lang="ts">
import type { IEventCbCtx, Selection } from '@lark-base-open/js-sdk'
import { FieldType } from '@lark-base-open/js-sdk'
import { Base64 } from 'js-base64'
import screenfull from 'screenfull'
import { fieldMaps } from '@/utils/field'
import Layout from '@/components/layout.vue'
import { eventBucket } from '@/hooks/useData'

const { t } = useI18n()
const layout = ref<InstanceType<typeof Layout> | null>(null)
const fileUrl = ref('')
let table: ITable
let fieldIdType: Record<string, FieldType>
let attachments: Record<string, IAttachmentField> = {}

const start: (e: IEventCbCtx<Selection>) => void = async ({ data }) => {
  if (data.tableId && data.fieldId && data.recordId) {
    if (!table || table?.id !== data.tableId) {
      table = await bitable.base.getTableById(data.tableId)
      const fieldMetaList = await table.getFieldMetaList()
      fieldIdType = fieldMaps(fieldMetaList).IdToType
      attachments = {}
      for (const item of fieldMetaList) {
        if (item.type === FieldType.Attachment)
          attachments[item.id] = await table.getField<IAttachmentField>(item.id)
      }
    }
    if (
      fieldIdType[data.fieldId] === FieldType.Attachment
      || fieldIdType[data.fieldId] === FieldType.Url
    ) {
      const cellValue = (await table.getCellValue(data.fieldId, data.recordId)) as
        | IOpenAttachment[]
        | IOpenUrlSegment[]

      if (cellValue && cellValue.length > 0) {
        if (fieldIdType[data.fieldId] === FieldType.Attachment) {
          const urls = await attachments[data.fieldId].getAttachmentUrls(data.recordId)
          if (urls && urls.length > 0 && 'name' in cellValue[0])
            fileUrl.value = `${urls[0]}&fullfilename=${cellValue[0].name}`
        }
        else if ('link' in cellValue[0]) {
          fileUrl.value = cellValue[0].link
        }
      }
    }
  }
}

onMounted(() => {
  layout.value?.update(false)
  const off = bitable.base.onSelectionChange(start)
  eventBucket.add(off)
})
</script>

<template>
  <Layout ref="layout">
    <template #header>
      <n-button
        type="success"
        @click="
          () => {
            if (screenfull.isEnabled) {
              screenfull.toggle()
            }
          }
        "
      >
        {{ t("full screen") }}
      </n-button>
    </template>
    <iframe
      v-if="fileUrl.length > 0"
      :src="
        `https://file.kkview.cn/onlinePreview?url=${encodeURIComponent(Base64.encode(fileUrl))}`
      "
      frameborder="0"
      style="width: 100%; height: 98vh"
    />
    <h1 v-else>
      {{ t("You need to select the Url or Attachment field") }}
    </h1>
  </Layout>
</template>

<i18n locale="zh" lang="json">
{
  "You need to select the Url or Attachment field": "你需要选择Url或者附件字段",
  "full screen": "全屏"
}
</i18n>

<style lang="scss" scoped></style>
