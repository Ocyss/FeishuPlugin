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
      v-model:value="formData.tableId"
      :options="data.tableMetaList"
      @update:value="() => data.getField()" />
    <form-select
      :msg="t('Select Download file')"
      v-model:value="formData.input"
      :emptyMsg="FieldEmptyMsg([FieldType.Attachment, FieldType.Url])"
      :options="data.filterFields([FieldType.Attachment, FieldType.Url])" />
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
        :render-tag="fileNameLabel"
        :render-label="fileNameTag"
        :options="fileNameOptions"
        @create="fileNameCreate" />
      <n-form-item :label="'非法字符'">
        <n-switch :round="false" v-model:value="formData.illegal">
          <template #checked>替换</template>
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
      <Input :data="formData.DownloadConf" />
    </div>
    <div v-show="formData.action === 2">
      <Input :data="formData.AriaConf" />
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
import format from "date-fns/format"
import {NTag, type SelectRenderTag} from "naive-ui"
import {type VNodeChild} from "vue"

import Layout from "@/components/layout.vue"
import {Data, FieldEmptyMsg, TextFieldToStr} from "@/utils"
import request from "@/utils/request"

const {t} = useI18n()
const now = new Date()
const data = reactive(new Data())
const message = useMessage()
const layout = ref<InstanceType<typeof Layout>>()
const aria = ref(false)
const ariaDisabled = ref(false)
const formData = reactive({
  "tableId": "",
  "viewId": "",
  "input": null,
  "action": -1,
  "dateKey": null,
  "fileName": [],
  "illegal": false,
  "DownloadConf": {
    "dir": undefined,
    "size": 0,
    "maxSize": 0,
    "user-agent": ""
  },
  "AriaConf": {
    "aria2Url": "http://localhost:6800/jsonrpc",
    "secret": ""
  }
})
const tempRecords = ref<IRecord[]>([])
const disableds = computed<Array<[boolean, string]>>(() => [
  [!formData.input, "输入不能为空"],
  [!aria.value, "Aria 未连接成功"]
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
  const textFields = data.filterFields(FieldType.Text) || []
  return [
    ...textFields.map(item => {
      return {...item, "tag": "error"}
    }),
    {"name": "递增数字(0)", "id": "num0", "tag": "success"},
    {"name": "递增数字(1)", "id": "num1", "tag": "success"},
    {"name": "记录ID", "id": "recordID", "tag": "success"},
    {"name": "字段ID", "id": "fieldID", "tag": "success"},
    {"name": "时间戳(秒)", "id": "date0", "tag": "success"},
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
    t(option.name)
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
      return formData.input || ""
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
  const out =
    formData.fileName
      .map(item => {
        let name = generateFileName(count, record, item)
        const invalidFileNameRegex = /[<>:"/\\|?*]/g
        if (invalidFileNameRegex.test(name)) {
          if (formData.illegal) {
            name = name.replace(invalidFileNameRegex, "")
          } else {
            throw new Error("File names do not allow illegal characters")
          }
        }
        return name
      })
      .join("") || undefined
  return {
    "jsonrpc": "2.0",
    "method": "aria2.addUri",
    "id": record.recordId + formData.input + index,
    "params": [
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
      const val = record.fields[formData.input!]
      if (!val || !Array.isArray(val) || val.length === 0) {
        return
      }
      const urls = await field.getAttachmentUrls(record.recordId)
      if (urls && Array.isArray(urls)) {
        res.push(...urls.map((v, index) => generate(v, record, index)))
      }
    })
  )
  return await request.post(formData.AriaConf.aria2Url, res)
}

async function startUrl(records: IRecord[]) {
  const res = records
    .map(record => {
      if (
        !formData.input ||
        !(formData.input in record.fields) ||
        record.fields[formData.input] === null
      ) {
        return null
      }
      const val = record.fields[formData.input]
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && "link" in val[0]) {
        return generate(val[0].link, record)
      }
      return null
    })
    .filter(v => v !== null)
  return await request.post(formData.AriaConf.aria2Url, res)
}

async function main() {
  layout.value?.update(true, t("Step 1 - Verification Aria2 status"))
  await aria2Stat()
  const tableId = formData.tableId
  if (tableId && aria.value && formData.input) {
    layout.value?.update(true, t("Step 2 - Getting Table"))
    layout.value?.init()
    count = 0
    const table = await bitable.base.getTableById(tableId)
    layout.value?.update(true, t("Step 3 - Getting Records"))
    let field: IAttachmentField // 性能优化，只在需要时取一次
    await layout.value?.getRecords(
      table,
      async ({records, pr}) => {
        switch (data.type(formData.input)) {
          case FieldType.Url:
            await startUrl(records.records)
            break
          case FieldType.Attachment:
            if (!field) {
              field = await table.getField<IAttachmentField>(formData.input!)
            }
            await startAttachment(field, records.records)
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
  url = url ?? formData.AriaConf.aria2Url
  return await request
    .post(
      url,
      {
        "jsonrpc": "2.0",
        "method": "aria2.getGlobalStat",
        "id": 1,
        "params": []
      },
      {"timeout": 2000}
    )
    .then(res => {
      aria.value = !!res.data
      if (msg) {
        ariaDisabled.value = false
        message[!res.data ? "error" : "success"](
          t(`Aria connection ${!res.data ? "failed" : "successful"}!`)
        )
      }
      if (res.data) {
        return url
      }
    })
    .catch(error => {
      message.error(t("Aria connection failed!"))
      return Promise.reject(error)
    })
}

onMounted(async () => {
  const {table} = await data.init(formData, layout.value!)
  table.getRecords({"pageSize": 5}).then(res => {
    tempRecords.value = res.records
  })
  await aria2Stat()
  if (!aria.value) {
    const urls = ["http://localhost:16800/jsonrpc", "http://localhost:6800/rpc"]
    Promise.race(urls.map(url => aria2Stat(false, url))).then(url => {
      if (url) {
        formData.AriaConf.aria2Url = url
      }
    })
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
  "Aria connection successful!": "Aria 连接成功!"
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
