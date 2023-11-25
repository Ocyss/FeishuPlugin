<route lang="json">
{
  "name": "ID Info Extractor",
  "meta": {
    "desc": "By inputting an ID card number, this plugin intelligently extracts information such as age, gender, date of birth, zodiac sign, Chinese zodiac, and native place. This smart identification greatly simplifies the handling of ID card information.",
    "help": "According to the ID number, obtain age, gender, date of birth, constellation, zodiac sign, and place of origin information.",
    "group": "https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=06fj76e0-4524-4ec9-8d90-b9e85578d126",
    "tags": ["Audit"],
    "avatar": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 576 512\"><path d=\"M528 32H48C21.5 32 0 53.5 0 80v16h576V80c0-26.5-21.5-48-48-48zM0 432c0 26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V128H0v304zm352-232c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16zm0 64c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16zm0 64c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16zM176 192c35.3 0 64 28.7 64 64s-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64zM67.1 396.2C75.5 370.5 99.6 352 128 352h8.2c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h8.2c28.4 0 52.5 18.5 60.9 44.2c3.2 9.9-5.2 19.8-15.6 19.8H82.7c-10.4 0-18.8-10-15.6-19.8z\" fill=\"currentColor\"></path></svg>"
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
      :msg="t('Select ID field')"
      v-model:value="formData.input"
      :options="
        fieldMetaList.filter((item) => item.type == base.FieldType.Text)
      "
    />
    <Select
      :msg="t('Select Output Field')"
      v-model:value="formData.output"
      :options="
        fieldMetaList.filter(
          (item) =>
            item.type == base.FieldType.Text ||
            item.type == base.FieldType.Number
        )
      "
    />
    <Select
      :msg="t('Select output format')"
      v-model:value="formData.format"
      :options="outputFormat"
      multiple
      v-if="
        formData.output &&
        fieldMap.IdToType[formData.output] == base.FieldType.Text
      "
    />
    <Select
      :msg="t('Select output format')"
      :value="t('age')"
      disabled
      v-else-if="
        formData.output &&
        fieldMap.IdToType[formData.output] == base.FieldType.Number
      "
    />
    <n-space>
      <n-button
        type="primary"
        size="large"
        @click="start"
        :disabled="formData.input == '' || formData.output == ''"
      >
        {{ t("Start") }}
      </n-button>
    </n-space>
  </Layout>
</template>

<script setup lang="ts">
import idcard from "@fekit/idcard";
import Layout from "@/components/layout.vue";
import { TextFieldToStr } from "@/utils";
import { FieldMaps, Data } from "@/types";

const { t } = useI18n();

const layout = ref<InstanceType<typeof Layout> | null>(null);

const InfoFields = [
  "gender", // 性别
  "birthday", // 出生日期
  "age", // 年龄
  "adreass", // 籍贯
  "province", // 省
  "city", // 市
  "area", // 区县
  "zodiac", // 生肖
  "constellation", // 星座
] as const;

type InfoField = (typeof InfoFields)[number];
type FormData = Data<{ format?: InfoField[] }>;
const formData = reactive<FormData>({
  tableId: void 0,
  input: void 0,
  output: void 0,
  format: void 0,
});

const outputFormat = InfoFields.map((item) => {
  return { name: t(item), id: item };
});

const tableMetaList = ref<ITableMeta[]>([]);
const fieldMetaList = ref<IFieldMeta[]>([]);
let fieldMap: FieldMaps = { NameToId: {}, IdToName: {}, IdToType: {} };

function main(recordId: string, val: IOpenCellValue): string | number | null {
  const text = TextFieldToStr(val as IOpenSegment[]);
  const info = idcard(text);
  if (!info) {
    layout.value?.error(t("ID card format error"), {
      tableId: formData.tableId!,
      fieldId: formData.input!,
      recordId,
    });
    return null;
  }
  const getValueByField = (item: InfoField) => {
    const textFields = ["province", "area", "city"];
    if (textFields.includes(item)) {
      return typeof info[item] === "string" ? info[item] : info[item].text;
    }
    return info[item];
  };

  let res =
    fieldMap.IdToType[formData.output!] === base.FieldType.Text
      ? formData.format!.map((item) => getValueByField(item)).join(" ")
      : info.age;
  return res;
}

async function start() {
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
      pr.addTotal(records.records.length);
      const newVals = records.records
        .map((item) => {
          // 检查字段是否存在且不为null
          if (
            !formData.input ||
            !formData.output ||
            !item.fields.hasOwnProperty(formData.input) ||
            !item.fields.hasOwnProperty(formData.output) ||
            item.fields[formData.input] == null
          ) {
            return null;
          }
          const val = item.fields[formData.input];
          item.fields[formData.output] = main(item.recordId, val);
          return item;
        })
        .filter((item) => item !== null) as IRecord[]; // 过滤掉未定义的项
      promise.push(
        table.setRecords(newVals).then((res) => {
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
