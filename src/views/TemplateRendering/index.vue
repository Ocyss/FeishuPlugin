<route lang="yaml">
name: TemplateRendering
meta:
  title: Template Renderer
  desc: >-
    Template rendering is a powerful tool that automatically passes field values
    to templates for flexible rendering. Supporting pipeline symbols allows
    users to perform advanced operations easily, enabling highly customized data
    processing.
  help: >-
    Wrap field names with {'{'}{'{'} and {'}'}{'}'} to automatically generate
    corresponding text<br/>Supports pipeline like {'{'}{'{'} username {'|'}
    append: ", welcome to LiquidJS!" {'|'} capitalize{'}'}{'}'}, for more
    syntax, please see https://liquidjs.com/
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=06fj76e0-4524-4ec9-8d90-b9e85578d126
  tags:
    - Audit
    - 重构中，不可用
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round"><rect x="4" y="4" width="16" height="4"
    rx="1"></rect><rect x="4" y="12" width="6" height="8" rx="1"></rect><path
    d="M14 12h6"></path><path d="M14 16h6"></path><path d="M14
    20h6"></path></g></svg>
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
      :msg="t('Select Source Field')"
      v-model:value="formData.input"
      :options="fieldMetaList.filter((item) => item.type === FieldType.Text)"
    />
    <Select
      :msg="t('Select Output Field')"
      v-model:value="formData.output"
      :options="fieldMetaList.filter((item) => item.type === FieldType.Text)"
    />
    <n-space>
      <n-button
        type="primary"
        size="large"
        @click="main"
        :disabled="formData.input == '' || formData.output == ''"
      >
        {{ t("开始渲染") }}
      </n-button>
    </n-space>
  </Layout>
</template>

<script setup lang="ts">
import { Liquid } from "liquidjs";
import Layout from "@/components/layout.vue";
import { FieldMaps } from "@/types";

const { t } = useI18n();
const layout = ref<InstanceType<typeof Layout> | null>(null);
const engine = new Liquid();
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
let fieldMap: FieldMaps = { NameToId: {}, IdToName: {}, IdToType: {} };

function start(record: IRecordType) {
  return new Promise(async (resolve) => {
    const [srcCell, dstCell, cellList] = await Promise.all([
      record.getCellByField(formData.input!),
      record.getCellByField(formData.output!),
      record.getCellList(),
    ]);
    const src = await srcCell.getValue();
    if (src != null) {
      const text = src.map((item: any) => item.text).join("");
      const data: any = {};
      for (const cell of cellList) {
        data[fieldMap.IdToName[cell.getFieldId()]] = await cell.getValue();
      }
      const res = engine.parseAndRenderSync(text, data);
      dstCell.setValue(res);
    }
    resolve(void 0);
  });
}

async function main() {
  lock.value = true;
  spinContent.value = t("第一步-获取表格中");
  const tableId = formData.tableId;
  if (tableId) {
    const table = await bitable.base.getTableById(tableId);
    spinContent.value = t("第二步-获取记录中");
    const recordList = await table.getRecordList();
    spinContent.value = t("第三步-开始渲染，请耐心等待");
    const promises: Promise<unknown>[] = [];
    for (const record of recordList) {
      promises.push(start(record));
    }
    await Promise.all(promises);
  }
  lock.value = false;
}

async function getField() {
  const data = await layout.value!.getField(formData);
  fieldMetaList.value = data.fieldMetaList;
  fieldMap = data.fieldMap;
}

onMounted(async () => {
  const data = await layout.value!.getTable(formData);
  tableMetaList.value = data.tableMetaList;
  await getField();
});
</script>
