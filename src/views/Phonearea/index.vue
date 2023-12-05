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

<script setup lang="ts">
import axios from 'axios'
import { TextFieldToStr } from '@/utils/field'

import { useData } from '@/hooks/useData'

const { getRecords, errorHandle, layout, t, table, tableId, onGetField, getTable, tableMetaList, filterFields } = useData()

const formData = reactive<ModelType>({
  input: null,
  output: null,
  format: 1,
})

onGetField(() => {
  formData.input = null
  formData.output = null
})

const formats = computed(() => [
  { id: 1, name: t('Province/City (Carrier)') },
  { id: 2, name: t('Province/City') },
  { id: 3, name: t('Province') },
  { id: 4, name: t('City') },
  { id: 5, name: t('Carrier') },
  { id: 6, name: t('Card Type') },
])

const disableds = computed<Array<[boolean, string]>>(() => [
  [!formData.input, t('Input can not be empty')],
  [!formData.output, t('Output can not be empty')],
])

async function request(phone: string, err = 0) {
  if (err > 2)
    return ''

  try {
    // 来源： https://api.aa1.cn/doc/phone-location-songzixian.html
    // ICP备2022049398号-1
    const res = await axios.get(
      `https://api.songzixian.com/api/phone-location?dataSource=PHONE_NUMBER_LOCATION&phoneNumber=${
      phone}`,
    )
    if (res.status !== 200 || res.data.code !== 200) {
      if (res.data.code === 10001 || res.data.code === 500)
        return t('Wrong mobile number')

      throw new Error('status error')
    }
    const { carrier, city, province, simType } = res.data.data
    switch (formData.format) {
      case 1:
        return `${province}${city}(${carrier})`
      case 2:
        return `${province}${city}`
      case 3:
        return province
      case 4:
        return city
      case 5:
        return carrier
      case 6:
        return simType
    }
  }
  catch {
    await new Promise(resolve =>
      setTimeout(() => {
        resolve(void 0)
      }, 2000),
    )
    return request(phone, err + 1)
  }
  return ''
}

async function start(records: IRecord[], pr: any) {
  const processedRecords = await Promise.all(
    records.map(async (record) => {
      pr.add()
      if (formData.input && formData.output && formData.input in record.fields && formData.output in record.fields) {
        const phone = TextFieldToStr(record.fields[formData.input] as IOpenSegment[])
        const expression
          = /^(?:13\d|14[014-9]|15[0-35-9]|16[2567]|17[0-8]|18\d|19[0-35-9])\d{8}$/
        if (!expression.test(phone))
          return null

        record.fields[formData.output] = await request(phone)
        return record
      }
      return null
    }),
  )
  return processedRecords.filter(record => record !== null) as IRecord[]
}

function main(all?: boolean) {
  getRecords(
    async ({ pr, records }) => {
      return table.value!.setRecords(await start(records.records, pr))
    },
    all,
    30,
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
      v-model:value="formData.input"
      :msg="t('Select PhoneNumber field')"
      :options="filterFields(FieldType.Text)"
    />
    <form-select
      v-model:value="formData.format"
      :msg="t('Select output format')"
      :options="formats"
    />
    <form-select
      v-model:value="formData.output"
      :msg="t('Select Output Field')"
      :options="filterFields(FieldType.Text)"
    />
    <form-start
      :disableds="disableds"
      @update:click="main"
    />
  </Layout>
</template>

<i18n locale="zh" lang="json">
{
  "Wrong mobile number": "无效的手机号码"
}
</i18n>
