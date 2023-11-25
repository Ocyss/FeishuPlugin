<route lang="json">
{
  "name": "Code Scanner",
  "meta": {
    "desc": "This plugin identifies and decodes QR codes/barcodes within attachments, supporting camera invocation as a scanner. It offers multiple ways for users to decode, enhancing flexibility in content interpretation.",
    "help": "Using the camera will automatically create a record, supporting copying specific records and overwriting content (not yet implemented)",
    "group": "https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=bfbu40c9-5d89-47f7-9999-674b8790b42a",
    "tags": ["Audit"],
    "avatar": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 24 24\"><path d=\"M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM22 7h-2V4h-3V2h5v5zm0 15v-5h-2v3h-3v2h5zM2 22h5v-2H4v-3H2v5zM2 2v5h2V4h3V2H2z\" fill=\"currentColor\"></path></svg>"
  }
}
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
      :msg="t('Select QR Code / Barcode Attachment Field')"
      v-model:value="formData.input"
      :options="
        fieldMetaList.filter((item) => item.type === base.FieldType.Attachment)
      "
    />
    <Select
      :msg="t('Select Output Field')"
      v-model:value="formData.output"
      :options="
        fieldMetaList.filter((item) => item.type === base.FieldType.Text)
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
import { BrowserMultiFormatReader } from "@zxing/library";
import Layout from "@/components/layout.vue";

const { t } = useI18n();
const layout = ref<InstanceType<typeof Layout> | null>(null);
const lock = ref(true);
const formData = reactive<{
  tableId: string | null;
  input: string | null;
  output: string | null;
}>({
  tableId: null,
  input: null,
  output: null,
});
const tableMetaList = ref<ITableMeta[]>([]);
const fieldMetaList = ref<IFieldMeta[]>([]);

const spinContent = ref(t("正在初始化~~"));

async function decode(srcCell: string[], dstCell: ICell, err = 0) {
  if (err > 8) {
    return;
  }
  try {
    let content = "";
    for (const item of srcCell) {
      const img = new Image();
      img.crossOrigin = "";
      img.src = item;
      const reader = new BrowserMultiFormatReader();
      const res = await reader.decodeFromImage(img);
      content += res.getText() + "\n";
    }
    content = content.slice(0, -1);
    await dstCell.setValue(content);
  } catch {
    await decode(srcCell, dstCell, err + 1);
  }
}

async function start(table: ITable, record: IRecordType) {
  const [srcCell, dstCell] = await Promise.all([
    (
      await table.getField<IAttachmentField>(formData.input!)
    ).getAttachmentUrls(record),
    record.getCellByField(formData.output!),
  ]);
  await decode(srcCell, dstCell);
}

async function main() {
  lock.value = true;
  spinContent.value = t("第一步-获取表格中");
  const tableId = formData.tableId;
  if (tableId) {
    const table = await bitable.base.getTableById(tableId);
    spinContent.value = t("第二步-获取记录中");
    const recordList = await table.getRecordList();
    spinContent.value = t("第三步-Start，请耐心等待");
    const promises: Promise<unknown>[] = [];
    for (const record of recordList) {
      promises.push(start(table, record));
    }
    await Promise.all(promises);
  }
  lock.value = false;
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