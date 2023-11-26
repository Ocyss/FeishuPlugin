<route lang="yaml">
name: Phonearea
meta:
  title: Phone Location Lookup
  desc: >-
    This plugin effortlessly retrieves location and carrier information based on
    a mobile phone number. This querying function allows quick access to
    associated information behind the phone number.
  help: >-
    1. The public third-party API will be used for query (domestic registration
    is preferred)<br> 2. Query failure will be empty<br> 3. The data is for
    reference only, non-operator interface
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=964h4312-c75e-484d-86f9-6b082a1c899a
  tags:
    - Audit
    - 重构中，不可用
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 448 512"><path
    d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h352a48 48 0 0 0
    48-48V80a48 48 0 0 0-48-48zm-16.39 307.37l-15 65A15 15 0 0 1 354 416C194 416
    64 286.29 64 126a15.7 15.7 0 0 1 11.63-14.61l65-15A18.23 18.23 0 0 1 144
    96a16.27 16.27 0 0 1 13.79 9.09l30 70A17.9 17.9 0 0 1 189 181a17 17 0 0
    1-5.5 11.61l-37.89 31a231.91 231.91 0 0 0 110.78 110.78l31-37.89A17 17 0 0 1
    299 291a17.85 17.85 0 0 1 5.91 1.21l70 30A16.25 16.25 0 0 1 384 336a17.41
    17.41 0 0 1-.39 3.37z" fill="currentColor"></path></svg>
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
      :msg="t('Select PhoneNumber field')"
      v-model:value="formData.input"
      :options="fieldMetaList.filter((item) => item.type == FieldType.Text)"
    />
    <Select
      :msg="t('Select output format')"
      v-model:value="formData.format"
      :options="formats"
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
        {{ t("Start") }}
      </n-button>
    </n-space>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import axios from "axios";
import Layout from "@/components/layout.vue";

const layout = ref<InstanceType<typeof Layout> | null>(null);

const { t } = useI18n();

const formData = reactive<{
  tableId: string | null;
  input: string | null;
  output: string | null;
  format: number;
}>({
  tableId: null,
  input: null,
  output: null,
  format: 1,
});

const tableMetaList = ref<ITableMeta[]>([]);
const fieldMetaList = ref<IFieldMeta[]>([]);

const formats = computed(() => [
  { label: t("Province/City (Carrier)"), value: 1 },
  { label: t("Province/City"), value: 2 },
  { label: t("Province"), value: 3 },
  { label: t("City"), value: 4 },
  { label: t("Carrier"), value: 5 },
  { label: t("Card Type"), value: 6 },
]);
async function request(phone: string, err = 0): Promise<string> {
  if (err > 2) {
    return "";
  }
  try {
    // 来源： https://api.aa1.cn/doc/phone-location-songzixian.html
    // ICP备2022049398号-1
    const res = await axios.get(
      `https://api.songzixian.com/api/phone-location?dataSource=PHONE_NUMBER_LOCATION&phoneNumber=` +
        phone
    );
    if (res.status != 200 || res.data.code != 200) {
      if (res.data.code == 10001) {
        return t("无效的手机号码");
      }
      throw new Error("status error");
    }
    const { province, city, carrier, simType } = res.data.data;
    switch (formData.format) {
      case 1:
        return `${province}${city}(${carrier})`;
      case 2:
        return `${province}${city}`;
      case 3:
        return province;
      case 4:
        return city;
      case 5:
        return carrier;
      case 6:
        return simType;
    }
  } catch {
    await new Promise((resolve) => setTimeout(() => resolve(void 0), 2000));
    return await request(phone, err + 1);
  }
  return "";
}

async function start(record: IRecordType, pr: any) {
  const [srcCell, dstCell] = await Promise.all([
    record.getCellByField(formData.input!),
    record.getCellByField(formData.output!),
  ]);
  const dstContent = await dstCell.getValue();
  if (dstContent) {
    return;
  }
  const srcval = await srcCell.getValue();
  if (!srcval) {
    return;
  }
  const phone = srcval.map((item: any) => item.text).join("");
  const expression =
    /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
  if (!expression.test(phone)) {
    await dstCell.setValue(t("无效的手机号码"));
    return;
  }
  await dstCell.setValue(await request(phone));
  pr.add();
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"));
  layout.value?.init();
  const tableId = formData.tableId;
  if (tableId) {
    const table = await bitable.base.getTableById(tableId);
    layout.value?.update(true, t("Step 2 - Getting Records"));
    const recordList = await table.getRecordList();
    const pr = layout.value?.spin(t("Record"), 0)!;
    const promises: Promise<unknown>[] = [];
    for (const record of recordList) {
      pr.addTotal();
      promises.push(start(record, pr));
    }
    await Promise.all(promises);
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
