<route lang="yaml">
name: DateOperations
meta:
  title: Date/Time Tools
  desc: >-
    This plugin offers convenient date and time manipulation functions, allowing
    flexible formatting, performing addition and subtraction operations with
    dates, and even converting text dates into date fields. It also allows
    direct setting of time attributes like hour, minute, and second,
    streamlining time handling for greater convenience and efficiency.
  help: >-
    Allows operations such as adding or subtracting any time to the time field,
    formatting output, etc.
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=04bj6841-6a19-4a65-9daa-195ed2150ed8
  tags:
    - Audit
    - 重构中，不可用
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M19
    4h-1V3c0-.55-.45-1-1-1s-1 .45-1 1v1H8V3c0-.55-.45-1-1-1s-1 .45-1 1v1H5c-1.11
    0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0
    15c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1V9h14v10zM7 11h2v2H7zm4 0h2v2h-2zm4
    0h2v2h-2z" fill="currentColor"></path></svg>
</route>
<template>
  <Layout ref="layout">
    <Select
      :msg="t('Select Data Table')"
      v-model:value="formData.tableId"
      :options="data.tableMetaList"
      @update:value="() => data.getField()"
    />
    <Radios
      :msg="t('Select action')"
      v-model:value="formData.action"
      @update-value="
        formData.output = null;
        formData.input = null;
      "
      :datas="radios"
    />
    <Select
      :msg="t('Select action field')"
      v-model:value="formData.input"
      :options="
        data.filterFields(formData.action, {
          [FieldType.DateTime]: [0, 1, 3],
          [FieldType.Text]: [2],
        })
      "
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
      v-if="formData.action == 0"
      :options="dateFormatter"
      :render-label="dateRenderLabel"
    />
    <InputNumbers
      v-else-if="formData.action == 1"
      :msg="t('Time addition and subtraction operations')"
      :data="dateAdd"
    />
    <InputNumbers
      v-else-if="formData.action == 3"
      :msg="t('Time setting operation')"
      :data="dateSet"
    />
    <Select
      :msg="t('Select Output Field')"
      v-model:value="formData.output"
      :options="
        data.filterFields(formData.action, {
          [FieldType.DateTime]: [1, 2, 3],
          [FieldType.Text]: [0],
        })
      "
      @update:value="updateOutput"
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
import { TextFieldToStr, dateFormatterList } from "@/utils";
import { SelectOption, NTime } from "naive-ui";
import format from "date-fns/format";
import add from "date-fns/add";
import parse from "date-fns/parse";
import set from "date-fns/set";
import Layout from "@/components/layout.vue";
import { VNodeChild } from "vue";
import { Data } from "@/utils";

const { t } = useI18n();

const layout = ref<InstanceType<typeof Layout>>();

const formData = reactive({
  tableId: "",
  input: null,
  output: null,
  action: 0,
  dateKey: null,
});

const data = reactive(new Data());

const radios = [
  { label: "format", value: 0 },
  { label: "add-subtract", value: 1 },
  { label: "text to time", value: 2 },
  { label: "settings", value: 3 },
];
const dateAdd = reactive({
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});
const dateSet = reactive({
  year: null,
  month: null,
  date: null,
  hours: null,
  minutes: null,
  seconds: null,
});

const dateFormatter = computed(() =>
  dateFormatterList.map((item) => {
    return { name: item, id: item };
  })
);

const dateRenderLabel = (option: SelectOption): VNodeChild => [
  h(NTime, { format: option.name as string, timeZone: "UTC" }),
  option.label as string,
];

function start(records: IRecord[]): IRecord[] {
  return records
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
      let res: any;
      switch (formData.action) {
        case 0:
          res = format(val as number, formData.dateKey!);
          break;
        case 1:
          res = add(val as number, dateAdd).getTime();
          break;
        case 2:
          for (let f of dateFormatterList) {
            res = parse(TextFieldToStr(val as IOpenSegment[]), f, 0).getTime();
            if (!isNaN(res)) break;
          }
          if (typeof res !== "number" || isNaN(res)) {
            return null;
          }
          break;
        case 3:
          // @ts-ignore
          res = set(val as number, dateSet).getTime();
          break;
      }
      item.fields[formData.output] = res;
      return item;
    })
    .filter((item) => item !== null) as IRecord[]; // 过滤掉未定义的项
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"));
  layout.value?.init();
  const tableId = formData.tableId;
  if (tableId) {
    const table = await bitable.base.getTableById(tableId);
    layout.value?.update(true, t("Step 2 - Getting Records"));
    await layout.value?.getRecords(table, async ({ records, pr }) =>
      table.setRecords(start(records.records)).then((res) => {
        pr.add(res.length);
      })
    );
    layout.value?.finish();
  }
  layout.value?.update(false);
}

function updateOutput() {}

onMounted(async () => {
  await data.init(formData, layout.value!);
});
</script>
