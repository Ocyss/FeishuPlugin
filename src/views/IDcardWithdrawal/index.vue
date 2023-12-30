<route lang="yaml">
name: IDcardWithdrawal
meta:
  title: ID Info Extractor
  desc: >-
    By inputting an ID card number, this plugin intelligently extracts
    information such as age, gender, date of birth, zodiac sign, Chinese zodiac,
    and native place. This smart identification greatly simplifies the handling
    of ID card information.
  help:
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=06fj76e0-4524-4ec9-8d90-b9e85578d126
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 576 512"><path
    d="M528 32H48C21.5 32 0 53.5 0 80v16h576V80c0-26.5-21.5-48-48-48zM0 432c0
    26.5 21.5 48 48 48h480c26.5 0 48-21.5 48-48V128H0v304zm352-232c0-4.4 3.6-8
    8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H360c-4.4 0-8-3.6-8-8v-16zm0
    64c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H360c-4.4
    0-8-3.6-8-8v-16zm0 64c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8
    8H360c-4.4 0-8-3.6-8-8v-16zM176 192c35.3 0 64 28.7 64 64s-28.7 64-64
    64s-64-28.7-64-64s28.7-64 64-64zM67.1 396.2C75.5 370.5 99.6 352 128
    352h8.2c12.3 5.1 25.7 8 39.8 8s27.6-2.9 39.8-8h8.2c28.4 0 52.5 18.5 60.9
    44.2c3.2 9.9-5.2 19.8-15.6 19.8H82.7c-10.4 0-18.8-10-15.6-19.8z"
    fill="currentColor"></path></svg>
</route>

<script setup lang="ts">
import parse from 'date-fns/parse'
import idcard from './idcard'
import { TextFieldToStr } from '@/utils/field'
import { useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'

const props = withDefaults(defineProps<{
  autoRun?: boolean
}>(), {
  autoRun: false,
})
const emit = defineEmits<{
  (e: 'save', value: any): void
}>()

const { store } = useStore()

const {
  errorHandle,
  fieldType,
  filterFields,
  getRecords,
  getTable,
  layout,
  onGetField,
  t,
  table,
  tableId,
  tableMetaList,
  viewId,
  viewMetaList,
} = useData()
const testVal = ref('')

const modelData = reactive< ModelType & { format?: InfoField[] }>({
  format: [],
  input: null,
  output: null,
})

const storeData = store('data', {
  opoutCell: false,
  verify: 0 as 0 | 1 | 2 | 3 | 4,
})

const testRes = computed(() => {
  if (testVal.value.length !== 18) {
    return {
      adreass: '',
      age: 0,
      birthday: '',
      constellation: '',
      gender: '',
      msg: 'Not long enough',
      zodiac: '',
    }
  }

  const info = idcard(testVal.value, storeData.value.verify)
  if (typeof info === 'string') {
    return {
      adreass: '',
      age: 0,
      birthday: '',
      constellation: '',
      gender: '',
      msg: info,
      zodiac: '',
    }
  }
  return { ...info }
})

function formatTooltip(value: number) {
  switch (value) {
    case 0:
      return t('Length verification')
    case 1:
      return t('Regular verification (exclude some illegal dates)')
    case 2:
      return t('Date verification (exclude all illegal dates)')
    case 3:
      return t('Regional verification (excluding all abnormal areas)')
    case 4:
      return t('Check code verification')
  }
  return ''
}

onGetField(() => {
  modelData.input = null
  modelData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [
    !modelData.input,
    t('Input can not be empty'),
  ],
  [
    !modelData.output,
    t('Output can not be empty'),
  ],
])

const InfoFields = [
  'gender', // 性别
  'birthday', // 出生日期
  'age', // 年龄
  'adreass', // 籍贯
  'province', // 省
  'city', // 市
  'area', // 区县
  'zodiac', // 生肖
  'constellation', // 星座
] as const

type InfoField = (typeof InfoFields)[number]

const outputFormat = InfoFields.map((item) => {
  return { id: item, name: t(item) }
})

function start(recordId: string, val: IOpenCellValue): null | number | string {
  const text = TextFieldToStr(val as IOpenSegment[])
  const info = idcard(text, storeData.value.verify)
  if (typeof info === 'string') {
    layout.value?.error(t(info), {
      fieldId: modelData.input,
      recordId,
      tableId: tableId.value,
      value: text,
    })
    return storeData.value.opoutCell && fieldType(modelData.output) === FieldType.Text ? t(info) : null
  }
  const getValueByField = (item: InfoField) => {
    if (item === 'province' || item === 'area' || item === 'city')
      return info[item].text
    return info[item]
  }

  switch (fieldType(modelData.output)) {
    case FieldType.Text:
      return modelData.format!.map(item => getValueByField(item)).join(' ')
    case FieldType.Number:
      return info.age
    case FieldType.DateTime:
      return parse(info.birthday, 'yyyy-MM-dd', 0).getTime()
  }
  return null
}

function main(all?: boolean) {
  getRecords(
    ({ pr, records }) => {
      const newVals = records.records
        .map((item) => {
          pr.add()
          if (
            modelData.input && modelData.output
            && modelData.input in item.fields
            && modelData.output in item.fields
            && item.fields[modelData.input]
          ) {
            const val = item.fields[modelData.input]
            item.fields[modelData.output] = start(item.recordId, val)
            return item
          }
          return null
        })
        .filter(item => item !== null) as IRecord[]
      return table.value!.setRecords(newVals)
    },
    all,
    storeData.value.verify ? 1000 : 5000,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}

onMounted(async () => {
  getTable()
})
</script>

<template>
  <Layout ref="layout">
    <n-space justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
    </n-space>
    <form-select
      v-model:value="modelData.input"
      :msg="t('Select ID field')"
      :options="filterFields(FieldType.Text)"
    />
    <form-select
      v-model:value="modelData.output"
      :msg="t('Select Output Field')"
      :options="filterFields([FieldType.Text, FieldType.Number, FieldType.DateTime])"
    />
    <form-select
      v-if="fieldType(modelData.output) === FieldType.Text"
      v-model:value="modelData.format"
      :msg="t('Select output format')"
      :options="outputFormat"
      multiple
    />
    <form-select
      v-else-if="fieldType(modelData.output) === FieldType.Number"
      :msg="t('Select output format')"
      :value="t('age')"
      disabled
    />
    <form-select
      v-else-if="fieldType(modelData.output) === FieldType.DateTime"
      :msg="t('Select output format')"
      :value="t('birthday')"
      disabled
    />

    <n-form-item :label="t('validation')">
      <n-slider v-model:value="storeData.verify" :min="0" :max="4" :format-tooltip="formatTooltip" />
    </n-form-item>
    <n-form-item v-if="storeData.verify" :label="t('Output to cell')">
      <n-switch v-model:value="storeData.opoutCell" />
    </n-form-item>

    <form-start
      v-if="!props.autoRun"
      :disableds="disableds"
      @update:click="main"
    />
    <form-start v-else operate :disableds="disableds" msg="Save" @update:click="emit('save', { ...toRaw(modelData), ...toRaw(storeData) })" />
  </Layout>
  <div>
    <n-input v-model:value="testVal" style="margin-top: 20px;" type="text" :placeholder="t('Test')" maxlength="18" show-count />
    <n-list v-if="testVal.length" hoverable clickable>
      <n-list-item>
        性别:&#9;{{ testRes.gender }}
      </n-list-item>
      <n-list-item>
        籍贯:&#9;{{ testRes.adreass }}
      </n-list-item>
      <n-list-item>
        生日:&#9;{{ `${testRes.birthday}\t<${testRes.age} ${t('ages')}>` }}
      </n-list-item>
      <n-list-item>
        生肖:&#9;{{ testRes.zodiac }}
      </n-list-item>
      <n-list-item>
        星座:&#9;{{ testRes.constellation }}
      </n-list-item>
      <n-list-item>
        校验:&#9;{{ testRes.msg ? `❌${t(testRes.msg)}` : t('pass') }}
      </n-list-item>
    </n-list>
  </div>
</template>

<i18n locale="zh" lang="json">
{
  "validation": "检验",
  "Format does not pass": "格式不通过",
  "Native place is incorrect": "籍贯不存在",
  "Regex does not pass": "正则不通过",
  "Date is incorrect": "年月日错误",
  "Checksum does not pass": "检验码不通过",
  "Not long enough": "长度不够",
  "ages":"岁",
  "Output to cell":"输出到单元格",
  "Length verification":"长度验证",
  "Regular verification (exclude some illegal dates)":"正则验证(排除部分非法日期)",
  "Date verification (exclude all illegal dates)":"日期验证(排除全部非法日期)",
  "Regional verification (excluding all abnormal areas)":"地区验证(排除全部异常地区)",
  "Check code verification":"校验码验证"
}
</i18n>
