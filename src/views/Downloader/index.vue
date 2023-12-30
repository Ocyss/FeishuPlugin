<route lang="yaml">
name: Downloader
meta:
  title: AriaLink Batch Downloader
  desc: >-
    AriaLink Batch Downloader is a powerful plugin that allows users to
    efficiently perform batch file downloads using Aria2. Leveraging the
    advantages of Aria2, users can download multiple files faster and more
    conveniently.
  help: ""
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=61ci3d06-d3c2-40dd-a2e9-00232cda2417
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M12
    2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2zm-1
    8V6h2v4h3l-4 4l-4-4h3zm6 7H7v-2h10v2z" fill="currentColor"></path></svg>
</route>

<script setup lang="ts">
import type { AxiosRequestConfig } from 'axios'
import format from 'date-fns/format'
import { NTag, type SelectRenderTag } from 'naive-ui'
import type { VNodeChild } from 'vue'

import { FieldEmptyMsg, TextFieldToStr } from '@/utils/field'
import request from '@/utils/request'
import { useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'

const { store } = useStore()
const {
  errorHandle,
  fieldType,
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

const now = new Date()

const message = useMessage()

const aria = ref(false)
const ariaDisabled = ref(false)
interface StoreData {
  AriaConf: {
    aria2Url: string
    secret: string
  }
  DownloadConf: {
    dir: null | string
    maxSize: number
    size: number
    userAgent: string
  }
  action: number
  illegal: boolean
}

const modelData = reactive<ModelType & { fileName: string[] }>({
  fileName: [],
  input: null,
})

const storeData = store<StoreData>('data', {
  AriaConf: {
    aria2Url: 'http://localhost:6800/jsonrpc',
    secret: '',
  },
  DownloadConf: {
    dir: null,
    maxSize: 0,
    size: 0,
    userAgent: '',
  },
  action: -1,

  illegal: false,
})

const tempRecords = ref<IRecord[]>([])

onGetField(() => {
  modelData.input = ''
  table.value!.getRecords({ pageSize: 5 }).then((res) => {
    tempRecords.value = res.records
  })
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [
    !modelData.input,
    t('Input can not be empty'),
  ],
  [
    !aria.value,
    t('Aria connection failed!'),
  ],
])
let count = 0
const actions = [
  { label: '🤩', value: -1 },
  { label: 'File configuration', value: 0 },
  { label: 'Download configuration', value: 1 },
  { label: 'Aria configuration', value: 2 },
]

const fileNameType = {
  error: 'F', // "FREF", Field REFerence
  info: 'M', // "MVAL", Manually VALue
  success: 'B', // "BDAT", Built-in DATa
  warning: 'E', // "ESUF", End SUFfix
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
  ]
})

function fileNameCreate(name: string, f: (v: { id: string, name: string, tag: string }) => void) {
  const [
    id,
    tag,
  ] = name.startsWith('.')
    ? [
        '$ESUF$',
        'warning',
      ]
    : [
        '$BDAT$',
        'info',
      ]
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
      closable: true,
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

function generateFileName(index: number, record: IRecord, item: string): string {
  if (item.startsWith('$ESUF$') || item.startsWith('$BDAT$'))
    return item.slice(6)

  switch (item) {
    case 'num0':
      return index.toString()
    case 'num1':
      return (index + 1).toString()
    case 'recordID':
      return record.recordId
    case 'fieldID':
      return (modelData.input) ?? ''
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

function generate(url: string, record: IRecord, index = 0) {
  count++
  let errFlag = false
  const out
    = modelData.fileName
      .map((item) => {
        let name = generateFileName(count, record, item)
        const invalidFileNameRegex = /[<>:"/\\|?*]/g
        if (invalidFileNameRegex.test(name)) {
          if (storeData.value.illegal) {
            name = name.replace(invalidFileNameRegex, '')
          }
          else {
            // throw new Error("File names do not allow illegal characters")
            layout.value?.error(t('File names do not allow illegal characters'), {
              fieldId: item,
              recordId: record.recordId,
              tableId: tableId.value,
            })
            errFlag = true
          }
        }
        return name
      })
      .join('') || undefined
  if (errFlag)
    return

  return {
    id: record.recordId + modelData.input + index,
    jsonrpc: '2.0',
    method: 'aria2.addUri',
    params: [
      `token:${storeData.value.AriaConf.secret}`,
      [url],
      {
        dir: storeData.value.DownloadConf.dir,
        out,
        referer: '*',
      },
    ],
  }
}

async function startAttachment(field: IAttachmentField, records: IRecord[]) {
  const res: any = []
  await Promise.all(
    records.map(async (record) => {
      const val = record.fields[modelData.input!]
      if (!val || !Array.isArray(val) || val.length === 0)
        return

      const urls = await field.getAttachmentUrls(record.recordId)
      if (urls && Array.isArray(urls))
        res.push(...urls.map((v, index) => generate(v, record, index)))
    }),
  )
  return await port(storeData.value.AriaConf.aria2Url, res)
}

async function startUrl(records: IRecord[]) {
  const res = records
    .map((record) => {
      const val = record.fields[modelData.input!]
      if (
        Array.isArray(val)
        && val.length > 0
        && typeof val[0] === 'object'
        && 'link' in val[0]
      )
        return generate(val[0].link, record)
      return null
    })
    .filter(v => v !== null)
  return await port(storeData.value.AriaConf.aria2Url, res)
}

function main(all?: boolean) {
  count = 0
  let field: IAttachmentField
  aria2Stat(true).then(() => {
    return getRecords(
      async ({ pr, records }) => {
        switch (fieldType(modelData.input)) {
          case FieldType.Url:
            await startUrl(records.records).catch((err) => {
              message.error(err)
            })
            break
          case FieldType.Attachment:
            if (!field)
              field = await table.value!.getField<IAttachmentField>(modelData.input!)
            await startAttachment(field, records.records).catch((err) => {
              message.error(err)
            })
            break
        }
        message.success(`${t('Pushed')} - ${records.records.length}`)
        pr.add(records.records.length)
      },
      all,
      15,
    )
  })
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}

async function aria2Stat(msg = false, url = '') {
  ariaDisabled.value = msg
  url = url === '' ? storeData.value.AriaConf.aria2Url : url
  const res = await port(
    url,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'aria2.getGlobalStat',
      params: [`token:${storeData.value.AriaConf.secret}`],
    },
    { timeout: 3000 },
  )

  aria.value = !!res.data?.result
  if (msg) {
    ariaDisabled.value = false
    message[!res.data ? 'error' : 'success'](
      t(`Aria connection ${!res.data ? 'failed' : 'successful'}!`),
    )
  }
  return aria.value || !!res?.response?.data?.error
}

async function port(url: string, data: any, config?: AxiosRequestConfig): Promise<any> {
  const res: any = await request.post(url, data, config)

  if (res?.response?.data?.error?.message)
    message.error(t(res.response.data.error.message))

  return res
}

onMounted(async () => {
  void getTable()
  await aria2Stat()
  if (!aria.value) {
    const urls = [
      'http://localhost:16800/jsonrpc',
      'http://localhost:6800/rpc',
    ]
    for (const url of urls) {
      if (await aria2Stat(false, url)) {
        storeData.value.AriaConf.aria2Url = url
        break
      }
    }
  }
  const timer = setInterval(() => {
    void aria2Stat()
  }, 5000)
  onBeforeUnmount(() => {
    clearInterval(timer)
  })
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
      :msg="t('Select Download file')"
      :empty-msg="FieldEmptyMsg([FieldType.Attachment, FieldType.Url])"
      :options="filterFields([FieldType.Attachment, FieldType.Url])"
    />
    <form-radios
      v-model:value="storeData.action"
      :msg="t('Select action')"
      :datas="actions"
    />
    <div v-show="storeData.action === 0">
      <n-blockquote>
        AriaLink 一般会使用服务器提供的文件名，你也可以手动配置，预览示例不按视图排序
      </n-blockquote>
      <n-blockquote>
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
      </n-blockquote>
      <form-select
        v-model:value="modelData.fileName"
        :msg="t('file name')"
        input
        multiple
        :render-tag="fileNameTag"
        :render-label="fileNameLabel"
        :options="fileNameOptions"
        @create="fileNameCreate"
      />
      <n-form-item label="非法字符">
        <n-switch
          v-model:value="storeData.illegal"
          :round="false"
        >
          <template #checked>
            删除
          </template>
          <template #unchecked>
            报错
          </template>
        </n-switch>
        &lt;>:"/\|?*
      </n-form-item>
      <div
        v-if="modelData.fileName.length > 0"
        class="file-name-preview"
      >
        <p
          v-for="(record, index) in tempRecords"
          :key="record.recordId"
        >
          <span
            v-for="item in modelData.fileName"
            :key="item"
          >
            {{ generateFileName(index, record, item) }}
          </span>
        </p>
      </div>
    </div>
    <div v-show="storeData.action === 1">
      <form-input :data="storeData.DownloadConf" />
    </div>
    <div v-show="storeData.action === 2">
      <form-input :data="storeData.AriaConf" />
    </div>
    <form-start
      :disableds="disableds"
      @update:click="main"
    >
      <n-button
        :type="aria ? 'success' : 'error'"
        :disabled="ariaDisabled"
        strong
        round @click="() => aria2Stat(true)"
      >
        {{ t("Aria state") }}
      </n-button>
    </form-start>
  </Layout>
</template>

<i18n locale="zh" lang="json">
{
  "Step 1 - Verification Aria2 status": "第一步·验证Aria2状态",
  "Step 2 - Getting Table": "第二步·获取数据表",
  "Step 3 - Getting Records": "第三部·获取记录",
  "Aria connection failed!": "Aria 连接失败~",
  "Aria connection successful!": "Aria 连接成功!",
  "Unauthorized": "未经授权, 需要Token(secret)鉴权",
  "Pushed":"已推送"
}
</i18n>

<style lang="scss" scoped>
.file-name-preview {
  p {
    margin: 2px;
  }

  margin-bottom: 15px;
}
</style>
