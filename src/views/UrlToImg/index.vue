<route lang="yaml">
name: UrlToImg
meta:
  title: Web to Attachment
  desc: >-
    This powerful plugin easily converts web pages into images and uploads them
    as preview images in attachments. This convenient conversion method provides
    users with more display options.
  help: >-
    According to the ID number, obtain age, gender, date of birth,
    constellation, zodiac sign, and place of origin information.
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=ce0u68e4-9348-492a-b0f3-ed122c47aad7
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M26
    2h4v4h-4z" fill="currentColor"></path><path d="M26 8h4v4h-4z"
    fill="currentColor"></path><path d="M20 2h4v4h-4z"
    fill="currentColor"></path><path d="M20 8h4v4h-4z"
    fill="currentColor"></path><path d="M28 16v6H4V6h12V4H4a2 2 0 0 0-2 2v16a2 2
    0 0 0 2 2h8v4H8v2h16v-2h-4v-4h8a2 2 0 0 0 2-2v-6zM18 28h-4v-4h4z"
    fill="currentColor"></path></svg>
</route>
<template>
  <Layout ref="layout">
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getField()" />
    <form-select
      :msg="t('Select Url Field')"
      v-model:value="store.input"
      :options="store.filterFields(FieldType.Url)" />
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="store.output"
      :options="store.filterFields(FieldType.Attachment)" />
    <form-start @update:click="main" :disableds="disableds" />
  </Layout>
</template>

<script setup lang="ts">
import axios from "axios"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {Progress} from "@/utils"

const layout = ref<InstanceType<typeof Layout> | null>(null)
const {t} = useI18n()

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!store.output, t("Output can not be empty")]
])

async function urlTofile(url: string, err = 0): Promise<File | undefined> {
  if (err > 5) {
    return undefined
  }
  let errFlag = false
  const res = await axios
    .get(`https://s0.wp.com/mshots/v1/${url}?w=1280&h=960`, {
      "responseType": "arraybuffer",
      "maxRedirects": 0
    })
    .catch(() => {
      errFlag = true
    })
  if (
    errFlag ||
    res?.headers["Content-Type"] === "image/gif" ||
    res?.headers["content-type"] === "image/gif"
  ) {
    await new Promise(resolve =>
      setTimeout(() => {
        resolve(undefined)
      }, 3000)
    )
    return await urlTofile(url, err + 1)
  }
  const blob = new Blob([res?.data], {
    "type": res?.headers["content-type"]
  })
  const f = new File([blob], Date.now() + ".jpeg", {
    "type": res?.headers["content-type"]
  })
  return f
}

function isValidHttpUrl(s: string) {
  try {
    const newUrl = new URL(s)
    return newUrl.protocol === "http:" || newUrl.protocol === "https:"
  } catch (err) {
    return false
  }
}

async function start(field: IAttachmentField, records: IRecord[], pr: Progress | undefined) {
  await Promise.all(
    records.map(async record => {
      if (
        store.check() &&
        record.fields[store.input] &&
        (!record.fields[store.output] ||
          (record.fields[store.output] as IOpenAttachment[])?.length === 0)
      ) {
        const urls = record.fields[store.input] as IOpenUrlSegment[]
        const files: File[] = []

        for (const url of urls) {
          if (isValidHttpUrl(url.link)) {
            const f = await urlTofile(url.link)
            if (f) {
              files.push(f)
            }
          }
        }
        await field.setValue(record.recordId, files)
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
    const field = await table.getFieldById<IAttachmentField>(store.output)
    await layout.value?.getRecords(
      table,
      ({records, pr}) => {
        return start(field, records.records, pr)
      },
      all,
      50
    )
  }
  layout.value?.finish()
}

onMounted(() => {
  store.init(layout.value!)
})
</script>
