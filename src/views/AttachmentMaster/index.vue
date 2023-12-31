<route lang="yaml">
name: AttachmentMaster
meta:
  title: AttachmentMaster
  desc: AttachmentMaster allows users to directly map all or part of attachment fields to Windows File Explorer and manage them as normal files.
  help:
  group:
  tags:
    - Audit
  avatar: a
</route>

<script setup lang="ts">
import { useClipboard, useWebSocket } from '@vueuse/core'
import type { SelectRenderTag } from 'naive-ui'
import { NTag } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { Progress } from '@/hooks/useProgress'
import { useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'
import { TextFieldToStr } from '@/utils/field'
import clientUrl from '@/assets/AttachmentMasterClient.exe?url'

const {
  errorHandle,
  filterFields,
  getRecords,
  getTable,
  layout,
  message,
  onGetField,
  t,
  table,
  tableId,
  tableMetaList,
  viewId,
  viewMetaList,
} = useData()
const { store } = useStore()
const { copy } = useClipboard()

const { data: wsdata, send: _send, status, ws } = useWebSocket('ws://localhost:16666/ws', {
  autoReconnect: true,
})

function send(msg: { action: string, data?: any }) {
  console.log(msg)
  return _send(JSON.stringify(msg))
}

async function sendA(msg: { action: string, data?: any }) {
  let ok = send(msg)
  for (let err = 0; !ok && err < 3; err++) {
    await new Promise(r => setTimeout(r, 1500))
    ok = send(msg)
  }
  if (!ok || !ws.value) {
    message.error('Failed to send message')
    return
  }
  return await new Promise<any>((resolve) => {
    ws.value!.onmessage = (event) => {
      const data = JSON.parse(event.data)
      resolve(data)
    }
  })
}

const stat = computed(() => status.value === 'OPEN')

function testStat() {
  console.log(send({ action: 'ping' }), status.value, wsdata.value)
}

const modelData = reactive({
  disk: 'Z:',
  input: [] as string[],
  text: ['rid'],
})

const storeData = store('data', {
  WebDav: { id: '', url: '' },
})

const disks = Array.from({ length: 26 }, (_, i) => {
  const disk = `${String.fromCharCode(65 + i)}:`
  return { id: disk, name: disk }
})

onGetField(() => {
  modelData.input = []
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [
    modelData.input.length === 0,
    t('Input can not be empty'),
  ],
])

const fileNameOptions = computed(() => {
  const textFields = filterFields(FieldType.Text) ?? []
  return [
    { id: 'rid', name: t('recordId'), tag: 'info' },
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

function install() {
  const a = document.createElement('a')
  a.href = clientUrl
  // 路径中'/'为根目录，即index.html所在的目录
  a.download = 'AttachmentMasterClient.exe'
  a.click()
}

async function copyUrl() {
  await copy(storeData.value.WebDav.url)
  message.success(t('复制成功'))
}

function generateName(record: IRecord) {
  return modelData.text.map((item) => {
    if (item.startsWith('$BDAT$'))
      return item.slice(6)
    else if (item === 'rid')
      return record.recordId
    else if (item in record.fields)
      return TextFieldToStr(record.fields[item] as IOpenSegment[])
    return ''
  }).join('')
}

async function start(fields: IAttachmentField[], records: IRecord[], pr?: Progress, err = 0) {
  if (err > 3) {
    message.error(t('WebDav record add failed'))
    return
  }
  const res: {
    id: string
    name?: string
    urls: string[]
  }[] = []
  for (let i = 0; i < records.length; i++) {
    pr?.add()
    const record = records[i]
    for (let j = 0; j < fields.length; j++) {
      const field = fields[j]
      const val = record.fields[field.id]
      if (!Array.isArray(val) || val.length === 0)
        continue
      const urls = await field.getAttachmentUrls(record.recordId)
      res.push({
        id: record.recordId,
        name: generateName(record),
        urls,
      })
    }
  }
  const data = { records: res, webdav_id: storeData.value.WebDav.id }
  const msg = await sendA({ action: 'add', data })
  console.log(msg)

  if (msg.code !== 0)
    await start(fields, records, pr, err + 1)
}

async function main(all?: boolean) {
  if (!table.value)
    return
  let data = await sendA({ action: 'status', data: { webdav_id: storeData.value.WebDav.id } })
  if (data.code !== 0) {
    data = await sendA({
      action: 'create',
      data: {
        disk: modelData.disk,
        table_id: table.value.id,
        table_name: await table.value.getName(),
      },
    })
    if (data.code !== 0) {
      message.error(t('Failed to create WebDav'))
      return
    }
  }
  storeData.value.WebDav = data.data
  const fields = await Promise.all(modelData.input.map(item => table.value!.getField<IAttachmentField>(item)))
  getRecords(
    async ({ pr, records }) => {
      console.log(records)

      await start(fields, records.records, pr)
    },
    all,
    5000,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}

onMounted(() => {
  void getTable()
})
</script>

<template>
  <Layout ref="layout">
    <n-space justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
    </n-space>
    <form-select
      v-model:value="modelData.input" :msg="t('Select Attachment Field')"
      :options="filterFields(FieldType.Attachment)" multiple
    />
    <form-select
      v-model:value="modelData.text" :msg="t('record name')" input multiple :render-tag="fileNameTag"
      :render-label="fileNameLabel" :options="fileNameOptions" @create="fileNameCreate"
    />
    <form-select v-model:value="modelData.disk" :msg="t('盘符')" :options="disks" />
    <form-start :disableds="disableds" :buttons="[['安装插件', install], ['复制WebDav地址', copyUrl]]" @update:click="main">
      <n-button :type="stat ? 'success' : 'error'" strong round @click="testStat">
        {{ t("连接状态") }}
      </n-button>
    </form-start>
  </Layout>
  插件会自动挂载到Z盘，如果挂载不超过，请手动复制WebDav地址，到Windows资源管理器中手动添加网络位置
</template>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped></style>
