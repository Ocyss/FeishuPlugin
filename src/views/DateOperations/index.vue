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
    <form-select
      :msg="t('Select Data Table')"
      v-model:value="store.tableId"
      :options="store.tableMetaList"
      @update:value="() => store.getField()" />
    <form-radios
      :msg="t('Select action')"
      v-model:value="formData.action"
      @update:value="
        () => {
          store.output = null
          store.input = null
        }
      "
      :datas="radios" />
    <form-select
      :msg="t('Select action field')"
      v-model:value="store.input"
      :options="
        store.filterFields(formData.action, {
          [FieldType.DateTime]: [0, 1, 3, 4],
          [FieldType.Text]: [2]
        })
      " />
    <form-select
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
      :render-label="dateRenderLabel" />
    <form-input-number
      v-else-if="formData.action == 1"
      :msg="t('Time addition and subtraction operations')"
      :data="dateAdd" />
    <form-input-number
      v-else-if="formData.action == 3"
      :msg="t('Time setting operation')"
      :data="dateSet" />
    <n-form-item v-else-if="formData.action == 4" :label="t('Time random operation')">
      <n-space item-style="display: flex;" align="center">
        <n-checkbox
          v-for="(_, key) in dateRand"
          :key="key"
          :label="t(key)"
          v-model:checked="dateRand[key]" />
      </n-space>
    </n-form-item>
    <form-select
      :msg="t('Select Output Field')"
      v-model:value="store.output"
      :options="
        store.filterFields(formData.action, {
          [FieldType.DateTime]: [1, 2, 3, 4],
          [FieldType.Text]: [0]
        })
      "
      @update:value="updateOutput" />
    <form-start @update:click="main" :disableds="disableds" />
  </Layout>
</template>

<script setup lang="ts">
import add from "date-fns/add"
import format from "date-fns/format"
import parse from "date-fns/parse"
import set from "date-fns/set"
import {NTime, type SelectOption} from "naive-ui"
import {generateNumber} from "random-ease"
import {type VNodeChild} from "vue"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {dateFormatterList, TextFieldToStr} from "@/utils"
const {t} = useI18n()

const layout = ref<InstanceType<typeof Layout>>()

const formData = reactive({
  "action": 0,
  "dateKey": null
})

const radios = [
  {"label": "format", "value": 0},
  {"label": "add-subtract", "value": 1},
  {"label": "text to time", "value": 2},
  {"label": "settings", "value": 3},
  {"label": "random", "value": 4}
]
const dateAdd = reactive({
  "years": 0,
  "months": 0,
  "weeks": 0,
  "days": 0,
  "hours": 0,
  "minutes": 0,
  "seconds": 0
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, t("Input can not be empty")],
  [!store.output, t("Output can not be empty")]
])

const dateSet = reactive<{
  year?: number
  month?: number
  date?: number
  hours?: number
  minutes?: number
  seconds?: number
}>({
  "year": undefined,
  "month": undefined,
  "date": undefined,
  "hours": undefined,
  "minutes": undefined,
  "seconds": undefined
})

const dateRand = reactive({
  "year": false,
  "month": false,
  "date": false,
  "hours": false,
  "minutes": false,
  "seconds": false
})

const dateFormatter = computed(() =>
  dateFormatterList.map(item => {
    return {"name": item, "id": item}
  })
)

const dateRenderLabel = (option: SelectOption): VNodeChild => [
  h(NTime, {"format": option.name as string, "timeZone": "UTC"}),
  option.label as string
]

function start(records: IRecord[]): IRecord[] {
  const rand = () => {
    return {
      "year": dateRand.year ? generateNumber(1971, 2030) : undefined,
      "month": dateRand.month ? generateNumber(0, 11) : undefined,
      "date": dateRand.date ? generateNumber(1, 28) : undefined,
      "hours": dateRand.hours ? generateNumber(0, 23) : undefined,
      "minutes": dateRand.minutes ? generateNumber(0, 59) : undefined,
      "seconds": dateRand.seconds ? generateNumber(0, 59) : undefined
    }
  }
  return records
    .map(item => {
      if (
        store.check() &&
        store.input in item.fields &&
        store.output in item.fields &&
        item.fields[store.input]
      ) {
        const val = item.fields[store.input]
        let res: any
        switch (formData.action) {
          case 0:
            res = format(val as number, formData.dateKey!)
            break
          case 1:
            res = add(val as number, dateAdd).getTime()
            break
          case 2:
            for (const f of dateFormatterList) {
              try {
                res = parse(TextFieldToStr(val as IOpenSegment[]), f, 0).getTime()
                if (!isNaN(res)) break
              } catch (err) {
                /* empty */
              }
            }
            if (typeof res !== "number" || isNaN(res)) {
              return null
            }
            break
          case 3:
            res = set(val as number, {
              ...dateSet,
              "month": dateSet.month !== undefined ? dateSet.month - 1 : undefined
            }).getTime()
            break
          case 4:
            res = set(val as number, rand()).getTime()
            break
        }
        item.fields[store.output] = res
        return item
      }
      return null
    })
    .filter(item => item !== null) as IRecord[]
}

async function main(all?: boolean) {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.check()) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    await layout.value?.getRecords(
      table,
      ({records, pr}) => {
        pr.add(records.records.length)
        return table.setRecords(start(records.records))
      },
      all,
      5000
    )
  }
  layout.value?.finish()
}

function updateOutput() {}

onMounted(async () => {
  store.init(layout.value!)
})
</script>
