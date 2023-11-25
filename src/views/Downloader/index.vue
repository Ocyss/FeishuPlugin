<route lang="json">
{
  "name": "AriaLink Batch Downloader",
  "meta": {
    "desc": "AriaLink Batch Downloader is a powerful plugin that allows users to efficiently perform batch file downloads using Aria2. Leveraging the advantages of Aria2, users can download multiple files faster and more conveniently.",
    "help": "",
    "group": "https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=04bj6841-6a19-4a65-9daa-195ed2150ed8",
    "tags": ["Audit"],
    "avatar": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 24 24\"><path d=\"M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10s10-4.49 10-10S17.51 2 12 2zm-1 8V6h2v4h3l-4 4l-4-4h3zm6 7H7v-2h10v2z\" fill=\"currentColor\"></path></svg>"
  }
}
</route>
<template>
  <Layout ref="layout">
    <Select
      :msg="t('Select Data Table')"
      v-model:value="formData.tableId"
      :options="data.tableMetaList"
      @update:value="() => data.getView()"
    />
    <Select
      :msg="t('Select Download file')"
      v-model:value="formData.input"
      :options="
        data.filterFields([base.FieldType.Attachment, base.FieldType.Url])
      "
    />

    <Radios
      :msg="t('Select action')"
      v-model:value="formData.action"
      :datas="actions"
    />
    <div v-if="formData.action === 0">
      <n-alert type="warning">未完成</n-alert>
      <n-blockquote>
        AriaLink 一般会使用服务器提供的文件名，如果您需要更改文件夹请手动配置
        <n-divider />
        红色为字段名将引用记录值，黄色为后缀名最后一位且已.开头，蓝色为手动输入数据，绿色则为内置数据(时间戳，数字递增，记录ID，字段ID)
        <n-divider />
        AriaLink 无法识别您的格式，如果你需要使用该功能，则需要手动输入后缀名
      </n-blockquote>
      <Select
        :msg="t('file name')"
        v-model:value="formData.fileName"
        input
        multiple
        :options="data.filterFields(base.FieldType.Text)"
      />
    </div>
    <div v-else-if="formData.action === 1">
      <n-alert type="warning">未完成</n-alert>
      <Input :data="formData.DownloadConf" />
    </div>
    <div v-else-if="formData.action === 2">
      <n-alert type="warning">未完成</n-alert>
      <Input :data="formData.AriaConf" />
    </div>
    <Start @update:click="main" :disableds="disableds">
      <n-button
        :type="aria ? 'success' : 'error'"
        size="large"
        @click="() => aria2Stat(true)"
        :disabled="ariaDisabled"
      >
        {{ t("Aria state") }}
      </n-button>
    </Start>
  </Layout>
</template>

<script setup lang="ts">
import Layout from "@/components/layout.vue";
import { Data } from "@/utils";
import request from "@/utils/request";
const { t } = useI18n();

const layout = ref<InstanceType<typeof Layout>>();
const aria = ref(false);
const ariaDisabled = ref(false);
const formData = reactive({
  tableId: "",
  viewId: "",
  input: null,
  action: -1,
  dateKey: null,
  fileName: [],
  DownloadConf: {
    size: 0,
    maxSize: 0,
    "user-agent": "",
  },
  AriaConf: {
    aria2Url: "http://localhost:6800/jsonrpc",
    dir: "",
    secret: "",
  },
});
const disableds = computed<[boolean, string][]>(() => [
  [!formData.input, "输入不能为空"],
  [!aria.value, "Aria 未连接成功"],
]);
const data = reactive(new Data());
const message = useMessage();
const actions = [
  { label: "File configuration", value: 0 },
  { label: "Download configuration", value: 1 },
  { label: "Aria configuration", value: 2 },
];

function post(res: any[]) {
  return request.post(formData.AriaConf.aria2Url, res);
}

function generate(url: string, record: IRecord, index = 0) {
  // let fileName = TextFieldToStr(
  //   record.fields[formData.fileName[0]] as IOpenSegment[]
  // );
  return {
    jsonrpc: "2.0",
    method: "aria2.addUri",
    id: record.recordId + formData.input + index,
    params: [
      [url],
      {
        // out: fileName,
        // dir: "./下载3/jquer1y",
        referer: "*",
      },
    ],
  };
}

async function startAttachment(field: IAttachmentField, records: IRecord[]) {
  const res: any = [];
  await Promise.all(
    records.map(async (record) => {
      const urls = await field.getAttachmentUrls(record.recordId);
      res.push(...urls.map((v, index) => generate(v, record, index)));
    })
  );
  return post(res);
}

async function startUrl(records: IRecord[]) {
  return post(
    records
      .map((record) => {
        if (
          !formData.input ||
          !record.fields.hasOwnProperty(formData.input) ||
          record.fields[formData.input] == null
        ) {
          return null;
        }
        const val = record.fields[formData.input];
        if (Array.isArray(val) && val.length > 0) {
          // @ts-ignore
          return generate(val[0].link, record);
        }
        return null;
      })
      .filter((v) => v !== null)
  );
}

async function main() {
  layout.value?.update(true, t("Step 1 - Verification Aria2 status"));
  await aria2Stat();
  const tableId = formData.tableId;
  if (tableId && aria.value && formData.input) {
    layout.value?.update(true, t("Step 2 - Getting Table"));
    layout.value?.init();
    const table = await bitable.base.getTableById(tableId);
    layout.value?.update(true, t("Step 3 - Getting Records"));
    let field: IAttachmentField; // 性能优化，只在需要时取一次
    await layout.value?.getRecords(
      table,
      async ({ records, pr }) => {
        switch (data.fieldMap?.IdToType[formData.input!]) {
          case base.FieldType.Url:
            await startUrl(records.records);
            break;
          case base.FieldType.Attachment:
            if (!field) {
              field = await table.getField<IAttachmentField>(formData.input!);
            }
            await startAttachment(field, records.records);
            break;
        }
        pr.add(records.records.length);
      },
      15
    );
    layout.value?.finish();
  }
  layout.value?.update(false);
}

async function aria2Stat(msg = false) {
  ariaDisabled.value = msg;
  const res = await request.post(
    formData.AriaConf.aria2Url,
    {
      jsonrpc: "2.0",
      method: "aria2.getGlobalStat",
      id: 1,
      params: [],
    },
    { timeout: 2000 }
  );

  aria.value = !!res.data;

  if (msg) {
    ariaDisabled.value = false;
    message[!res.data ? "error" : "success"](
      t(`Aria connection ${!res.data ? "failed" : "successful"}!`)
    );
  }
}

onMounted(async () => {
  await data.init(formData, layout.value!);
  await aria2Stat();
  const timer = setInterval(() => {
    aria2Stat;
  }, 5000);
  onBeforeUnmount(() => {
    clearInterval(timer);
  });
});
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
