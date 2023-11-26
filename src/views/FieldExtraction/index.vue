<route lang="yaml">
name: FieldExtraction
meta:
  title: Field Extractor
  desc: >-
    This plugin easily extracts desired attributes from various fields—whether
    it's link fields for links/text, personnel fields for ID/name/email, or
    attachment fields for type/size—streamlining information processing
    workflows.
  help: ""
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=595mb5bd-1d13-4cc6-9d41-223e4b4619ae
  tags:
    - Audit
    - 重构中，不可用
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M20
    7h-5V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2
    2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9-3h2v5h-2V4zm0
    12H9v2H7v-2H5v-2h2v-2h2v2h2v2zm2-1.5V13h6v1.5h-6zm0 3V16h4v1.5h-4z"
    fill="currentColor"></path></svg>
</route>
<template>
  <Layout ref="spin">
    <Select
      :msg="t('Select Data Table')"
      v-model:value="formData.tableId"
      :options="tableMetaList"
      @update:value="getField"
    />
    <Select
      :msg="t('Select Extraction Field')"
      v-model:value="formData.input"
      :options="fieldMetaList"
    />
    <Select
      :msg="t('Select Extraction Attribute')"
      v-model:value="formData.key"
      input
      :tooltip="
        t(
          'Select the attributes that need to be extracted. If there are no attributes in the table, they can be entered manually. Some fields have no attributes that can be extracted'
        )
      "
      v-show="
        fieldMap.IdToType[formData.input] &&
        fieldMap.IdToType[formData.input] != FieldType.DateTime
      "
      :options="fieldInfos"
    />
    <Select
      :msg="t('Select date format')"
      v-model:value="formData.dateKey"
      input
      :tooltip="
        t(
          `Select the date format, which can be entered manually. For the format, please refer to the document `
        ) +
        `<a href=&quot;https://date-fns.org/v2.6.0/docs/format&quot; target=&quot;_blank&quot;>date-fns format</a>`
      "
      v-show="fieldMap.IdToType[formData.input] == FieldType.DateTime"
      :options="dateFormatter"
      :render-label="dateRenderLabel"
    />
    <Select
      :msg="t('Select Separator')"
      v-model:value="formData.delimiter"
      input
      :tooltip="
        t(
          'Select the delimiter for multi-line text, which can be entered manually. \n\\n is a newline, \\t is a tab character'
        )
      "
      :options="delimiter"
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
        {{ t("开始提取") }}
      </n-button>
    </n-space>
  </Layout>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { delimiterList, FieldInfos, dateFormatterList } from "@/utils";
import type { FieldMaps } from "@/types";
import Layout from "@/components/layout.vue";

import { SelectOption, NTime } from "naive-ui";
import format from "date-fns/format";
import { VNodeChild } from "vue";

const { t } = useI18n();
const layout = ref<InstanceType<typeof Layout> | null>(null);

const formData = reactive({
  tableId: "",
  input: "",
  output: "",
  delimiter: "\n",
  key: "",
  dateKey: "",
});

const tableMetaList = ref<ITableMeta[]>([]);
const fieldMetaList = ref<IFieldMeta[]>([]);
const delimiter = computed(() =>
  delimiterList.map((item) => {
    item.name = t(item.name);
    return item;
  })
);

const fieldInfos = computed(() =>
  FieldInfos(fieldMap.IdToType[formData.input]).map((item) => {
    item.name = t(item.id);
    return item;
  })
);

const dateFormatter = computed(() =>
  dateFormatterList.map((item) => {
    return { name: item, id: item };
  })
);
const dateRenderLabel = (option: SelectOption): VNodeChild => [
  h(NTime, { format: option.name as string, timeZone: "UTC" }),
  option.label as string,
];

let fieldMap: FieldMaps = { NameToId: {}, IdToName: {}, IdToType: {} };

function start(records: IRecord[]): IRecord[] {
  return records
    .map((item) => {
      // 检查字段是否存在且不为null
      if (
        !item.fields.hasOwnProperty(formData.input) ||
        !item.fields.hasOwnProperty(formData.output) ||
        item.fields[formData.input] == null
      ) {
        return null;
      }

      const val = item.fields[formData.input];
      let res = "";

      if (fieldMap.IdToType[formData.input] === FieldType.DateTime) {
        res = format(val as number, formData.dateKey);
      } else {
        res = processValue(val);
      }

      item.fields[formData.output] = res;
      return item;
    })
    .filter((item) => item !== null) as IRecord[]; // 过滤掉未定义的项
}

function processValue(val: any): string {
  if (Array.isArray(val)) {
    return val
      .map((item) => (formData.key in item ? item[formData.key] : ""))
      .join(formData.delimiter);
  } else {
    return formData.key === ""
      ? String(val)
      : formData.key in val
      ? val[formData.key]
      : "";
  }
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
      promise.push(
        table.setRecords(start(records.records)).then((res) => {
          pr.add(res.length);
        })
      );
    }
    await Promise.all(promise);
    layout.value?.finish();
  }
  layout.value?.update(false);
}

async function getField() {
  const data = await layout.value!.getField(formData);
  fieldMap = data.fieldMap;
  fieldMetaList.value = data.fieldMetaList;
}

onMounted(async () => {
  const data = await layout.value!.getTable(formData);
  tableMetaList.value = data.tableMetaList;
  await getField();
});
</script>
