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
    - 重构中，不可用
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M12
    2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2zm-1
    8V6h2v4h3l-4 4l-4-4h3zm6 7H7v-2h10v2z" fill="currentColor"></path></svg>
</route>
<template>
  <Layout ref="layout">
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getField()" />
    <form-select
      :msg="t('Select Download file')"
      v-model:value="store.input"
      :emptyMsg="FieldEmptyMsg([FieldType.Attachment, FieldType.Url])"
      :options="store.filterFields([FieldType.Attachment, FieldType.Url])" />
    <form-radios :msg="t('Select action')" v-model:value="formData.action" :datas="actions" />
    <div v-show="formData.action === 0">
      <n-blockquote>
        AriaLink 一般会使用服务器提供的文件名，你也可以手动配置，预览示例不按视图排序
      </n-blockquote>
      <n-blockquote>
        红色
        <n-tag type="error">F</n-tag>
        为字段名将引用记录值
        <br />
        黄色
        <n-tag type="warning">E</n-tag>
        为后缀名以.开头
        <br />
        蓝色
        <n-tag type="info">M</n-tag>
        为手动输入数据
        <br />
        绿色
        <n-tag type="success">B</n-tag>
        为内置数据
      </n-blockquote>
      <form-select
        :msg="t('file name')"
        v-model:value="formData.fileName"
        input
        multiple
        :render-tag="fileNameTag"
        :render-label="fileNameLabel"
        :options="fileNameOptions"
        @create="fileNameCreate" />
      <n-form-item :label="'非法字符'">
        <n-switch :round="false" v-model:value="formData.illegal">
          <template #checked>删除</template>
          <template #unchecked>报错</template>
        </n-switch>
        &lt;>:"/\|?*
      </n-form-item>
      <div class="file-name-preview" v-if="formData.fileName.length > 0">
        <p v-for="(record, index) in tempRecords" :key="record.recordId">
          <span v-for="item in formData.fileName" :key="item">
            {{ generateFileName(index, record, item) }}
          </span>
        </p>
      </div>
    </div>
    <div v-show="formData.action === 1">
      <form-input :data="formData.DownloadConf" />
    </div>
    <div v-show="formData.action === 2">
      <form-input :data="formData.AriaConf" />
    </div>
    <form-start @update:click="main" :disableds="disableds">
      <n-button
        :type="aria ? 'success' : 'error'"
        size="large"
        @click="() => aria2Stat(true)"
        :disabled="ariaDisabled">
        {{ t("Aria state") }}
      </n-button>
    </form-start>
  </Layout>
</template>

<script setup lang="ts">
import {AxiosRequestConfig} from "axios"
import format from "date-fns/format"
import {NTag, type SelectRenderTag} from "naive-ui"
import {type VNodeChild} from "vue"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {FieldEmptyMsg, TextFieldToStr} from "@/utils"
import request from "@/utils/request"
const {t} = useI18n()
const now = new Date()

const message = useMessage()
const layout = ref<InstanceType<typeof Layout>>()
const aria = ref(false)
const ariaDisabled = ref(false)
const formData = reactive({
  "action": -1,
  "dateKey": null,
  "fileName": [],
  "illegal": false,
  "DownloadConf": {
    "dir": undefined,
    "user-agent": "",
    "size": 0,
    "maxSize": 0
  },
  "AriaConf": {
    "aria2Url": "http://localhost:6800/jsonrpc",
    "secret": ""
  }
})
const tempRecords = ref<IRecord[]>([])
const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!aria.value, t("Aria connection failed!")]
])
let count = 0
const actions = [
  {"label": "🤩", "value": -1},
  {"label": "File configuration", "value": 0},
  {"label": "Download configuration", "value": 1},
  {"label": "Aria configuration", "value": 2}
]

const fileNameType = {
  "error": "F", // "FREF", Field REFerence
  "warning": "E", // "ESUF", End SUFfix
  "info": "M", // "MVAL", Manually VALue
  "success": "B" // "BDAT", Built-in DATa
}

const fileNameOptions = computed(() => {
  const textFields = store.filterFields(FieldType.Text) ?? []
  return [
    ...textFields.map(item => {
      return {...item, "tag": "error"}
    }),
    {"name": t("AscendingNumbers(0)"), "id": "num0", "tag": "success"},
    {"name": t("AscendingNumbers(1)"), "id": "num1", "tag": "success"},
    {"name": t("RecordID"), "id": "recordID", "tag": "success"},
    {"name": t("FieldID"), "id": "fieldID", "tag": "success"},
    {"name": t("Timestamp(Seconds)"), "id": "date0", "tag": "success"},
    {"name": "yyyy-MM-dd_HH-mm-ss-SSS", "id": "date1", "tag": "success"},
    {"name": "HH-mm-ss-SSS", "id": "date2", "tag": "success"},
    {"name": "yyMMddHHmmss", "id": "date3", "tag": "success"}
  ]
})

const fileNameCreate = (name: string, f: (v: {name: string; id: string; tag: string}) => void) => {
  const [id, tag] = name.startsWith(".") ? ["$ESUF$", "warning"] : ["$BDAT$", "info"]
  const res = {name, "id": id + name, tag}
  f(res)
}
const fileNameLabel = (option: {
  name: string
  id: string
  tag: keyof typeof fileNameType
}): VNodeChild => {
  return [
    h(
      NTag,
      {
        "type": option.tag,
        "bordered": false,
        "round": true,
        "style": {"marginRight": "5px"}
      },
      fileNameType[option.tag]
    ),
    option.name
  ]
}

const fileNameTag: SelectRenderTag = ({option, handleClose}) => {
  return h(
    NTag,
    {
      "type": option.tag as "error" | "warning" | "info" | "success",
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

function generateFileName(index: number, record: IRecord, item: string): string {
  if (item.startsWith("$ESUF$") || item.startsWith("$BDAT$")) {
    return item.slice(6)
  }
  switch (item) {
    case "num0":
      return index.toString()
    case "num1":
      return (index + 1).toString()
    case "recordID":
      return record.recordId
    case "fieldID":
      return store.input || ""
    case "date0":
      return now.getTime().toString()
    case "date1":
      return format(now, "yyyy-MM-dd_HH-mm-ss-SSS")
    case "date2":
      return format(now, "HH-mm-ss-SSS")
    case "date3":
      return format(now, "yyMMddHHmmss")
  }
  if (item in record.fields) {
    return TextFieldToStr(record.fields[item] as IOpenSegment[])
  }
  return ""
}

function generate(url: string, record: IRecord, index = 0) {
  count++
  let errFlag = false
  const out =
    formData.fileName
      .map(item => {
        let name = generateFileName(count, record, item)
        const invalidFileNameRegex = /[<>:"/\\|?*]/g
        if (invalidFileNameRegex.test(name)) {
          if (formData.illegal) {
            name = name.replace(invalidFileNameRegex, "")
          } else {
            // throw new Error("File names do not allow illegal characters")
            layout.value?.error(t("File names do not allow illegal characters"), {
              "tableId": store.tableId,
              "recordId": record.recordId,
              "fieldId": item
            })
            errFlag = true
          }
        }
        return name
      })
      .join("") || undefined
  if (errFlag) {
    return
  }
  return {
    "jsonrpc": "2.0",
    "method": "aria2.addUri",
    "id": record.recordId + store.input + index,
    "params": [
      ["token:" + formData.AriaConf.secret],
      [url],
      {
        out,
        "dir": formData.DownloadConf.dir,
        "referer": "*"
      }
    ]
  }
}

async function startAttachment(field: IAttachmentField, records: IRecord[]) {
  const res: any = []
  await Promise.all(
    records.map(async record => {
      if (store.check(false)) {
        const val = record.fields[store.input]
        if (!val || !Array.isArray(val) || val.length === 0) {
          return
        }
        const urls = await field.getAttachmentUrls(record.recordId)
        if (urls && Array.isArray(urls)) {
          res.push(...urls.map((v, index) => generate(v, record, index)))
        }
      }
    })
  )
  return await port(formData.AriaConf.aria2Url, res)
}

async function startUrl(records: IRecord[]) {
  const res = records
    .map(record => {
      if (store.check(false) && store.input in record.fields && record.fields[store.input]) {
        const val = record.fields[store.input]
        if (
          Array.isArray(val) &&
          val.length > 0 &&
          typeof val[0] === "object" &&
          "link" in val[0]
        ) {
          return generate(val[0].link, record)
        }
        return null
      }
      return null
    })
    .filter(v => v !== null)
  return await port(formData.AriaConf.aria2Url, res)
}

async function main() {
  layout.value?.update(true, t("Step 1 - Verification Aria2 status"))
  await aria2Stat()
  if (store.check(false)) {
    layout.value?.update(true, t("Step 2 - Getting Table"))
    layout.value?.init()
    count = 0
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 3 - Getting Records"))
    let field: IAttachmentField // 性能优化，只在需要时取一次

    await layout.value?.getRecords(
      table,
      async ({records, pr}) => {
        switch (store.type(store.input)) {
          case FieldType.Url:
            await startUrl(records.records).catch(err => {
              message.error(err)
            })
            break
          case FieldType.Attachment:
            if (!field) {
              field = await table.getField<IAttachmentField>(store.input!)
            }
            await startAttachment(field, records.records).catch(err => {
              message.error(err)
            })
            break
        }
        pr.add(records.records.length)
      },
      15
    )
    layout.value?.finish()
  }
  layout.value?.update(false)
}

async function aria2Stat(msg = false, url = "") {
  ariaDisabled.value = msg
  url = url === "" ? formData.AriaConf.aria2Url : url
  const res = await port(
    url,
    {
      "jsonrpc": "2.0",
      "method": "aria2.getGlobalStat",
      "id": 1,
      "params": ["token:" + formData.AriaConf.secret]
    },
    {"timeout": 3000}
  )

  aria.value = !!res.data?.result
  if (msg) {
    ariaDisabled.value = false
    message[!res.data ? "error" : "success"](
      t(`Aria connection ${!res.data ? "failed" : "successful"}!`)
    )
  }
  return aria.value || !!res?.response?.data?.error
}

async function port(url: string, data: any, config?: AxiosRequestConfig) {
  const res: any = await request.post(url, data, config)

  if (res?.response?.data?.error?.message) {
    message.error(t(res.response.data.error.message))
  }
  return res
}

onMounted(async () => {
  const {table} = await store.init(layout.value!)
  table.getRecords({"pageSize": 5}).then(res => {
    tempRecords.value = res.records
  })
  await aria2Stat()
  if (!aria.value) {
    const urls = ["http://localhost:16800/jsonrpc", "http://localhost:6800/rpc"]
    for (const url of urls) {
      if (await aria2Stat(false, url)) {
        formData.AriaConf.aria2Url = url
        break
      }
    }
  }
  const timer = setInterval(() => {
    aria2Stat
  }, 5000)
  onBeforeUnmount(() => {
    clearInterval(timer)
  })
})
</script>

<i18n locale="zh" lang="json">
{
  "Step 1 - Verification Aria2 status": "第一步·验证Aria2状态",
  "Step 2 - Getting Table": "第二步·获取数据表",
  "Step 3 - Getting Records": "第三部·获取记录",
  "Aria connection failed!": "Aria 连接失败~",
  "Aria connection successful!": "Aria 连接成功!",
  "File names do not allow illegal characters": "文件名不允许包含非法字符",
  "AscendingNumbers(0)": "递增数字(0)",
  "AscendingNumbers(1)": "递增数字(1)",
  "RecordID": "记录ID",
  "FieldID": "字段ID",
  "Timestamp(Seconds)": "时间戳(秒)",
  "Unauthorized": "未经授权, 需要Token(secret)鉴权"
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
