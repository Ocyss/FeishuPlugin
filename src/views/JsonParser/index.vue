<route lang="json">
{
  "name": "JSON Parser",
  "meta": {
    "desc": "This parser intelligently interprets data from JSON strings, allocating data to corresponding cells based on key-value pairs or array sequences. Such functionality makes handling complex JSON data easy and efficient.",
    "help": "Supports parsing objects & arrays into respective cells. Array length and output length must match. Provide timestamps for date fields instead of strings. Refer to documentation for more field details.",
    "group": "https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=1faj62f2-b373-4442-a8a7-c53a08bf67a4",
    "tags": ["Audit"],
    "avatar": "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 32 32\"><path d=\"M31 11v10h-2l-2-6v6h-2V11h2l2 6v-6h2z\" fill=\"currentColor\"></path><path d=\"M21.334 21h-2.667A1.668 1.668 0 0 1 17 19.334v-6.667A1.668 1.668 0 0 1 18.666 11h2.667A1.668 1.668 0 0 1 23 12.666v6.667A1.668 1.668 0 0 1 21.334 21zM19 19h2v-6h-2z\" fill=\"currentColor\"></path><path d=\"M13.334 21H9v-2h4v-2h-2a2.002 2.002 0 0 1-2-2v-2.334A1.668 1.668 0 0 1 10.666 11H15v2h-4v2h2a2.002 2.002 0 0 1 2 2v2.333A1.668 1.668 0 0 1 13.334 21z\" fill=\"currentColor\"></path><path d=\"M5.333 21H2.667A1.668 1.668 0 0 1 1 19.334V17h2v2h2v-8h2v8.334A1.668 1.668 0 0 1 5.333 21z\" fill=\"currentColor\"></path></svg>"
  }
}
</route>
<template>
  <Layout ref="layout">
    <Select
      :msg="t('Select Data Table')"
      v-model:value="formData.tableId"
      :options="tableMetaList"
      @update:value="getView"
    />
    <Select
      :msg="t('Select View')"
      v-model:value="formData.viewId"
      :options="viewMetaList"
      @update:value="getField"
    />
    <Select
      :msg="t('Select Input Field')"
      v-model:value="formData.input"
      :options="
        fieldMetaList?.filter((item) => item.type === base.FieldType.Text)
      "
      @update:value="inputUpdate"
    />
    <Select
      :msg="t('Select Output Field')"
      v-model:value="formData.fieldList"
      :options="
          fieldMetaList?.map((item) => {
            // 拷贝防止影响其他值
            const val:SelectOption = { ...item };
            if (val.id === formData.input) {
              val.disabled = true;
            }
            return val;
          })
        "
      multiple
      @update:value="fieldUpdate"
    />
    <n-space>
      <n-button
        type="primary"
        :disabled="
          formData.tableId == '' ||
          formData.viewId == '' ||
          formData.input == ''
        "
        size="large"
        @click="main"
      >
        {{ t("Parse") }}
      </n-button>
      <n-button type="info" size="large" @click="() => toCopy(true)">
        {{ t("Copy as Object") }}
      </n-button>
      <n-button type="info" size="large" @click="() => toCopy(false)">
        {{ t("Copy as Array") }}
      </n-button>
    </n-space>
  </Layout>
</template>

<script lang="ts" setup>
import useClipboard from "vue-clipboard3";
import { useI18n } from "vue-i18n";
import { SelectOption } from "naive-ui";
import { TextFieldToStr, fieldDefault } from "@/utils";
import { Progress } from "@/types";
import type { Data, FieldMaps } from "@/types";
import Layout from "@/components/layout.vue";

const { t } = useI18n();
const layout = ref<InstanceType<typeof Layout> | null>(null);

const { toClipboard } = useClipboard();

const formData = reactive<
  Data<{
    fieldList: string[];
  }>
>({
  tableId: "",
  viewId: "",
  input: "",
  fieldList: [],
});

const tableMetaList = ref<Array<ITableMeta>>([]);
const viewMetaList = ref<Array<IViewMeta>>([]);
const fieldMetaList = ref<Array<IFieldMeta>>([]);

let fieldMap: FieldMaps = { NameToId: {}, IdToName: {}, IdToType: {} };

const main = async () => {
  layout.value?.update(true, t("Step 1 - Get the data table"));
  layout.value?.init();
  const tableId = formData.tableId;
  if (tableId) {
    const table = await bitable.base.getTableById(tableId);
    layout.value?.update(true, t("Step 2 - Get the record list"));
    const recordList = await table.getRecordList();
    const promises = [];
    const pr = layout.value?.spin(t("Record"), 0);
    const pc = layout.value?.spin(t("Cell"), 0);
    if (!pr || !pc) {
      return;
    }
    for (const record of recordList) {
      pr?.addTotal();
      promises.push(start(record, pr, pc));
    }
    await Promise.all(promises);
    layout.value?.finish();
  }
  layout.value?.update(false);
};

const start = async (record: IRecordType, pr: Progress, pc: Progress) => {
  const inputCell = await record.getCellByField(formData.input as string);
  const val = await inputCell.getValue();
  if (!val) {
    return;
  }
  const text = TextFieldToStr(val);
  const track = {
    tableId: formData.tableId,
    viewId: formData.viewId,
    recordId: record.id,
  };
  try {
    const obj = JSON.parse(text);
    const temp = [];
    if (Array.isArray(obj)) {
      if (formData.fieldList.length === obj.length) {
        obj.forEach((value: any, index: number) => {
          pc.addTotal();
          temp.push(setValue(record, formData.fieldList[index], value, pc));
        });
      } else {
        layout.value?.error(t("Array Length Error"), track);
      }
    } else if (typeof obj === "object" && obj !== null) {
      for (const key in obj) {
        pc.addTotal();
        const fieldId = fieldMap.NameToId[key];
        if (formData.fieldList.some((item) => item == fieldId)) {
          temp.push(setValue(record, fieldId, obj[key], pc));
        }
      }
    }
    await Promise.all(temp);
  } catch (e) {
    layout.value?.error(t("Not in JSON Format"), track);
  } finally {
    pr.add();
  }
};

const setValue = async (
  record: IRecordType,
  fieldId: string,
  value: any,
  pc: Progress
) => {
  const cell = await record.getCellByField(fieldId);
  const track = {
    tableId: formData.tableId,
    viewId: formData.viewId,
    recordId: record.id,
    fieldId,
  };
  if (cell.editable) {
    try {
      const res = await cell.setValue(value);
      if (!res) {
        layout.value?.error(t("Unknown Cell Error"), track);
      }
    } catch (e) {
      layout.value?.error(t("Cell Type Error"), track);
    }
  } else {
    layout.value?.error(t("Cell Not Editable"), track);
  }
  pc.add();
};

function inputUpdate() {
  formData.fieldList = fieldMetaList.value
    ?.map((item) => item.id)
    .filter((item) => item !== formData.input) as string[];
}

function fieldUpdate() {
  const orderMap: any = {};
  fieldMetaList.value?.forEach((element, index) => {
    orderMap[element.id] = index;
  });
  formData.fieldList.sort((a, b) => {
    return orderMap[a] - orderMap[b];
  });
}

async function toCopy(flag = true) {
  const res: Record<string, any> = {};
  for (const field of formData.fieldList) {
    res[fieldMap.IdToName[field]] = fieldDefault(fieldMap.IdToType[field]);
  }
  if (flag) {
    await toClipboard(JSON.stringify(res, null, "  "));
  } else {
    await toClipboard(JSON.stringify(Object.values(res), null, "  "));
  }
  alert(t("Copy Successful"));
}

async function getField(table?: ITable) {
  const data = await layout.value!.getViewField(formData, table);
  fieldMap = data.fieldMap;
  fieldMetaList.value = data.fieldMetaList;
  formData.fieldList = data.fieldMetaList.map((item) => item.id);
}

async function getView() {
  const data = await layout.value!.getView(formData);
  viewMetaList.value = data.viewMetaList;
  await getField(data.table);
}

onMounted(async () => {
  const data = await layout.value!.getTable(formData);
  tableMetaList.value = data.tableMetaList;
  await getView();
});
</script>
