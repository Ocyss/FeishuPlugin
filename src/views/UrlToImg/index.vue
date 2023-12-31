<route lang="yaml">
name: UrlToImg
meta:
  title: Web to Attachment
  desc: >-
    This powerful plugin easily converts web pages into images and uploads them
    as preview images in attachments. This convenient conversion method provides
    users with more display options.
  help:
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

<script setup lang="ts">
import axios from 'axios'
import type { Progress } from '@/hooks/useProgress'
import { useData } from '@/hooks/useData'

const {
  errorHandle,
  filterFields,
  getRecords,
  getTable,
  layout,
  onGetField,
  t,
  table,
  tableId,
  tableMetaList,
  viewId,
  viewMetaList,
} = useData()

const modelData = reactive<ModelType>({
  input: null,
  output: null,
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
})
const disableds = computed<Array<[boolean, string]>>(() => [
  [
    !modelData.input,
    t('Input can not be empty'),
  ],
  [
    !modelData.output,
    t('Output can not be empty'),
  ],
])

async function urlTofile(url: string, err = 0): Promise<File | undefined> {
  if (err > 5)
    return undefined

  let errFlag = false
  const res = await axios
    .get(`https://s0.wp.com/mshots/v1/${url}?w=1280&h=960`, {
      maxRedirects: 0,
      responseType: 'arraybuffer',
    })
    .catch(() => {
      errFlag = true
    })
  if (
    errFlag
    || res?.headers['Content-Type'] === 'image/gif'
    || res?.headers['content-type'] === 'image/gif'
  ) {
    await new Promise(resolve =>
      setTimeout(() => {
        resolve(undefined)
      }, 3000),
    )
    return await urlTofile(url, err + 1)
  }
  const blob = new Blob([res?.data], {
    type: res?.headers['content-type'],
  })
  const f = new File([blob], `${Date.now()}.jpeg`, {
    type: res?.headers['content-type'],
  })
  return f
}

function isValidHttpUrl(s: string) {
  try {
    const newUrl = new URL(s)
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:'
  }
  catch (err) {
    return false
  }
}

async function start(field: IAttachmentField, records: IRecord[], pr: Progress) {
  await Promise.all(
    records.map(async (record) => {
      if (
        modelData.input && modelData.output
        && record.fields[modelData.input]
        && (!record.fields[modelData.output]
        || (record.fields[modelData.output] as IOpenAttachment[])?.length === 0)
      ) {
        const urls = record.fields[modelData.input] as IOpenUrlSegment[]
        const files: File[] = []

        for (const url of urls) {
          if (isValidHttpUrl(url.link)) {
            const f = await urlTofile(url.link)
            if (f)
              files.push(f)
          }
        }
        await field.setValue(record.recordId, files)
      }
      pr?.add()
    }),
  )
}

async function main(all?: boolean) {
  if (modelData.output && table.value) {
    const field = await table.value.getFieldById<IAttachmentField>(modelData.output)
    getRecords(
      ({ pr, records }) => {
        return start(field, records.records, pr)
      },
      all,
      3000,
    )
      .catch((error: Error) => {
        errorHandle('main', error)
      })
      .finally(() => {
        layout.value?.finish()
      })
  }
  else {
    errorHandle('main', new Error('output or table is null'))
  }
}

onMounted(() => {
  getTable()
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
      :msg="t('Select Url Field')"
      :options="filterFields(FieldType.Url)"
    />
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
