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
import { eventBucket, useData } from '@/hooks/useData'

const {
  fieldType,
  getTable,
  layout,
  onFieldTraverse,
  t,
  table,
  tableId,
} = useData()

const fileUrl = ref('')
const attachments: Record<string, IAttachmentField> = {}

onFieldTraverse(async (item) => {
  if (table.value && item.type === FieldType.Attachment)
    attachments[item.id] = await table.value.getField<IAttachmentField>(item.id)
})

const start: (e: IEventCbCtx<Selection>) => void = async ({ data }) => {
  layout.value?.update(true, '加载文件')
  if (tableId.value !== data.tableId)
    getTable()
  const type = fieldType(data.fieldId)
  if (
    type === FieldType.Attachment
      || type === FieldType.Url
  ) {
    const [
      cellValue,
      urls,
    ] = await Promise.all([
      table.value!.getCellValue(data.fieldId!, data.recordId!) as Promise<IOpenAttachment[] | IOpenUrlSegment[]>,
      attachments[data.fieldId!]?.getAttachmentUrls(data.recordId!),
    ])
    if (cellValue && cellValue.length > 0) {
      if (urls && urls.length > 0 && 'name' in cellValue[0])
        fileUrl.value = `${urls[0]}&fullfilename=${cellValue[0].name}`
      else if ('link' in cellValue[0])
        fileUrl.value = cellValue[0].link
    }
  }
  layout.value?.update(false)
}

onMounted(async () => {
  await getTable()
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
    <n-result v-else status="404" style="--n-title-font-size: 18px;" :title="t('You need to select an attachment cell')" :description="t('Life is always a little ridiculous')" />
  </Layout>
</template>

<i18n locale="zh" lang="json">
{
  "You need to select the Url or Attachment field": "你需要选择Url或者附件字段",
  "full screen": "全屏"
}
</i18n>

<style lang="scss" scoped></style>
