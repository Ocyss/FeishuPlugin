<route lang="yaml">
name: IDcardWithdrawal
meta:
  title: ID Info Extractor
  desc: >-
    By inputting an ID card number, this plugin intelligently extracts
    information such as age, gender, date of birth, zodiac sign, Chinese zodiac,
    and native place. This smart identification greatly simplifies the handling
    of ID card information.
  help: >-
    According to the ID number, obtain age, gender, date of birth,
    constellation, zodiac sign, and place of origin information.
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
import idcard from '@fekit/idcard'
import parse from 'date-fns/parse'
import { TextFieldToStr } from '@/utils/field'
import { useData } from '@/hooks/useData'

const { getRecords, errorHandle, layout, t, table, tableId, onGetField, fieldType, getTable, tableMetaList, filterFields } = useData()

const modelData = reactive< ModelType & { format?: InfoField[] }>({
  input: null,
  output: null,
  format: [],
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!modelData.input, t('Input can not be empty')],
  [!modelData.output, t('Output can not be empty')],
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
  const info = idcard(text)
  if (!info) {
    layout.value?.error(t('ID card format error'), {
      fieldId: modelData.input as string,
      recordId,
      tableId: tableId.value,
    })
    return null
  }
  const getValueByField = (item: InfoField) => {
    const textFields = ['province', 'area', 'city']
    if (textFields.includes(item))
      return typeof info[item] === 'string' ? info[item] : info[item].text

    return info[item]
  }

  let res: any
  switch (fieldType(modelData.output as string)) {
    case FieldType.Text:
      res = modelData.format!.map(item => getValueByField(item)).join(' ')
      break

    case FieldType.Number:
      res = info.age
      break
    case FieldType.DateTime:
      res = parse(info.birthday, 'yyyy-MM-dd', 0).getTime()
  }
  return res
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
    5000,
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
    <form-select
      v-model:value="tableId"
      :msg="t('Select Data Table')"
      :options="tableMetaList"
    />
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
      v-if="modelData.output && fieldType(modelData.output) === FieldType.Text"
      v-model:value="modelData.format"
      :msg="t('Select output format')"
      :options="outputFormat"
      multiple
    />
    <form-select
      v-else-if="modelData.output && fieldType(modelData.output) === FieldType.Number"
      :msg="t('Select output format')"
      :value="t('age')"
      disabled
    />
    <form-select
      v-else-if="modelData.output && fieldType(modelData.output) === FieldType.DateTime"
      :msg="t('Select output format')"
      :value="t('birthday')"
      disabled
    />
    <n-form-item label="强校验">
      <n-switch />
    </n-form-item>
    <form-start
      :disableds="disableds"
      @update:click="main"
    />
  </Layout>
</template>
