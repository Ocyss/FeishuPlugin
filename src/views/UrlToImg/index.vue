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
    - 重构中，不可用
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
    <Select
      :msg="t('Select Data Table')"
      v-model:value="formData.tableId"
      :options="tableMetaList"
      @update:value="getField"
    />
    <Select
      :msg="t('Select Url Field')"
      v-model:value="formData.input"
      :options="fieldMetaList.filter((item) => item.type === FieldType.Url)"
    />
    <Select
      :msg="t('Select Output Field')"
      v-model:value="formData.input"
      :options="
        fieldMetaList.filter((item) => item.type === FieldType.Attachment)
      "
    />
    <n-space>
      <n-button
        type="primary"
        size="large"
        @click="main"
        :disabled="formData.input == '' || formData.output == ''"
      >
        {{ t("Start") }}
      </n-button>
    </n-space>
  </Layout>
</template>

<script setup lang="ts">
import axios from "axios";
import { reactive } from "vue";
import { Progress } from "@/utils";
import Layout from "@/components/layout.vue";

const layout = ref<InstanceType<typeof Layout> | null>(null);
const { t } = useI18n();

const formData = reactive({
  tableId: "",
  input: null,
  output: null,
  action: 0,
  dateKey: null,
});
const tableMetaList = ref<ITableMeta[]>([]);
const fieldMetaList = ref<IFieldMeta[]>([]);

async function urlTofile(url: string, err = 0): Promise<File | undefined> {
  if (err > 5) {
    return undefined;
  }
  const res = await axios.get(
    `https://s0.wp.com/mshots/v1/${url}?w=1024&h=768`,
    { responseType: "arraybuffer" }
  );
  if (res.headers["Content-Type"] == "image/gif") {
    await new Promise((resolve) => setTimeout(() => resolve(void 0), 2000));
    return await urlTofile(url, err + 1);
  }
  const blob = new Blob([res.data], {
    type: res.headers["content-type"],
  });
  const f = new File([blob], Date.now() + ".jpeg", {
    type: res.headers["content-type"],
  });
  return f;
}

async function start(records: IRecord[], pr: Progress) {
  const dstContent = await dstCell.getValue();
  if (dstContent) {
    return;
  }
  const urls = await srcCell.getValue();
  const expression = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/;
  const files: File[] = [];
  for (const url of urls) {
    if (expression.test(url.link)) {
      const f = await urlTofile(url.link);
      if (f) {
        files.push(f);
      }
    }
  }
  await dstCell.setValue(files);
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"));
  layout.value?.init();
  const tableId = formData.tableId;
  if (tableId) {
    const table = await bitable.base.getTableById(tableId);
    layout.value?.update(true, t("Step 2 - Getting Records"));
    let records: IGetRecordsResponse = {
      total: 0,
      hasMore: true,
      records: [],
    };
    const promise: any[] = [];
    const pr = layout.value?.spin(t("Record"), 0)!;
    while (records.hasMore) {
      records = await table.getRecords({
        pageSize: 1000,
        pageToken: records.pageToken,
      });
      pr.addTotal(records.total);
      promise.push(start(records.records, pr));
    }
    await Promise.all(promise);
    layout.value?.finish();
  }
  layout.value?.update(false);
}

async function getField() {
  const data = await layout.value!.getField(formData);
  fieldMetaList.value = data.fieldMetaList;
}

onMounted(async () => {
  const data = await layout.value!.getTable(formData);
  tableMetaList.value = data.tableMetaList;
  await getField();
});
</script>
