<route lang="yaml">
name: RandomRecord
meta:
  title: RandomRecord
  desc: RandomRecord is a practical tool designed to test plugin performance, allowing bulk generation of random records containing data for various fields. Users can customize field types and quantities as needed, facilitating performance testing and data simulation.
  help:
  group: 应用交流群
  tags:
    - Personal
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path opacity=".3" d="M20 14v-4h-4v2.89L17.11 14zm-10-1.45V14h1.45zM14 10h-.89l.89.89zm5.11 6l.89.89V16zM8 4h-.89l.89.89zm6 4V4h-4v2.89L11.11 8zm2-4h4v4h-4zm-6 12v4h4v-3.45l-.55-.55zm-6-6v4h4v-3.45L7.45 10zm12 10h1.45L16 18.55zM4 16h4v4H4zm0-9.45V8h1.45z" fill="currentColor"></path><path d="M8 4v.89l2 2V4h4v4h-2.89l2 2H14v.89l2 2V10h4v4h-2.89l2 2H20v.89l2 2V4c0-1.1-.9-2-2-2H5.11l2 2H8zm8 0h4v4h-4V4zM1.41 1.14L0 2.55l2 2V20c0 1.1.9 2 2 2h15.45l2.01 2.01l1.41-1.41L1.41 1.14zM10 12.55L11.45 14H10v-1.45zm-6-6L5.45 8H4V6.55zM8 20H4v-4h4v4zm0-6H4v-4h3.45l.55.55V14zm6 6h-4v-4h3.45l.55.55V20zm2 0v-1.45L17.45 20H16z" fill="currentColor"></path></svg>
</route>

<script setup lang="ts">
import type {
  IMultiSelectField,
  IRecordValue,
  ISingleSelectField,
} from '@lark-base-open/js-sdk'
import {
  IOpenSegmentType,
} from '@lark-base-open/js-sdk'
import * as randomEase from 'random-ease'
import { useData } from '@/hooks/useData'

const { errorHandle, fieldMetaList, getRecords, getTable, layout, onGetField, t, table, tableId, tableMetaList, viewId, viewMetaList } = useData()

const modelData = reactive<ModelType & { total: number }>({
  input: null,
  output: null,
  total: 0,
})

onGetField(() => {
  modelData.input = null
  modelData.output = null
  modelData.total = 0
})

function generator(options: Record<string, any>): IRecordValue {
  const record: {
    fields: {
      [fieldId: string]: any
    }
  } = {
    fields: {},
  }
  const MultiSelect = (op: any[]) => {
    const shuffled = op.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, randomEase.generateNumber(0, op.length))
  }
  if (fieldMetaList.value.length > 0) {
    for (const field of fieldMetaList.value) {
      let val: any
      switch (field.type) {
        case FieldType.SingleSelect:
          if (field.id in options && Array.isArray(options[field.id]))
            val = randomEase.generateRandomElement(options[field.id])

          break
        case FieldType.Phone:
          val = randomEase.generatePhoneNumber().replaceAll('-', '')
          break
        case FieldType.Url:
          val = {
            link: randomEase.generateURL(),
            text: randomEase.generateMovieTitle(),
            type: IOpenSegmentType.Url,
          }
          break
        case FieldType.Text:
          val = randomEase.generateParagraph(3, 8)
          break
        case FieldType.Number:
          val = randomEase.generateNumber(-10000000, 10000000)
          break
        case FieldType.MultiSelect:
          if (field.id in options && Array.isArray(options[field.id]))
            val = MultiSelect(options[field.id])

          break
        case FieldType.DateTime:
          val = randomEase.generateNumber(0, 1922110536000)
          break
        case FieldType.Checkbox:
          val = randomEase.generateBoolean()
          break
        case FieldType.Progress:
          val = randomEase.generateNumber(0, 100)
          break
        case FieldType.Rating:
          if ('min' in field.property && field.property.max)
            val = randomEase.generateNumber(field.property.min, field.property.max)

          break
        case FieldType.Currency:
          val = randomEase.generateFloat(0, 100000)
          break
        case FieldType.Email:
          val = randomEase.generateEmailAddress()
          break
        case FieldType.Barcode:
          val = randomEase.generatePassword(32, true, true, false)
          break
        default:
          continue
      }
      record.fields[field.id] = val
    }
  }
  return record
}

async function main() {
  layout.value?.update(true, t('Step 1 - Getting Table'))
  layout.value?.init()
  if (table.value) {
    layout.value?.update(true, t('Step 2 - Getting Records'))
    const options: Record<string, any> = {}
    if (fieldMetaList.value.length > 0) {
      for (const mate of fieldMetaList.value) {
        if (mate.type === FieldType.SingleSelect || mate.type === FieldType.MultiSelect) {
          const field = await table.value?.getFieldById<IMultiSelectField | ISingleSelectField>(mate.id)
          options[mate.id] = await field.getOptions()
        }
      }
    }
    const numRecords = modelData.total
    const pr = layout.value?.spin('正在生成', numRecords)
    const records: IRecordValue[] = []
    for (let i = 0; i < numRecords; i++) {
      records.push(generator(options))
      if (records.length === 5000) {
        await table.value?.addRecords(records)
        records.length = 0
      }
      pr?.add()
    }
    if (records.length > 0)
      await table.value?.addRecords(records)
  }
  layout.value?.finish()
}

function delMain() {
  getRecords(
    ({ pr, records }) => {
      pr.add(records.records.length)
      return table.value!.deleteRecords(
        records.records
          .filter(record => Object.values(record.fields).every(value => value === null))
          .map(record => record.recordId),
      )
    },
    true,
    1000,
  )
    .catch((error: Error) => {
      errorHandle('main', error)
    })
    .finally(() => {
      layout.value?.finish()
    })
}

onMounted(() => {
  getTable()
})
</script>

<template>
  <Layout ref="layout">
    <n-space justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
    </n-space>
    <n-form-item :label="t('number of generated')">
      <n-input-number
        v-model:value="modelData.total"
        style="width: 100%"
        :min="0"
        :max="20000"
        :step="100"
        placeholder=""
        clearable
      />
    </n-form-item>
    <form-start
      operate
      :buttons="[[t('delEmpty'), delMain]]"
      @update:click="main"
    />
  </Layout>
</template>

<i18n locale="zh" lang="json">
{"number of generated": "生成个数"}
</i18n>

<style lang="scss" scoped></style>
