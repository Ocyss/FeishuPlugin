<route lang="yaml">
name: PhoneticsMate
meta:
  title: PhoneticsMate
  desc: >-
    PhoneticsMate is a convenient tool that converts English text into phonetic
    symbols and provides pronunciation previews in both American and British
    phonetic notation. Users can click on the symbols to listen to their
    pronunciation, effectively enhancing accuracy in English learning and
    communication.
  help: ""
  group: >-
    https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=8a5r8ede-3933-462c-b1e0-185fd598ddad
  tags:
    - Audit
  avatar: >-
    <svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 448 512"><path
    d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96
    96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7c-4.2-15.4-4.2-59.3
    0-74.7c5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6
    6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3
    0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7
    0-32-14.3-32-32c0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"
    fill="currentColor"></path></svg>
</route>

<script setup lang="ts">
import EasySpeech from 'easy-speech'
import { TextFieldToStr } from '@/utils/field'
import request from '@/utils/request'

import { eventBucket, useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'

const { store } = useStore()
const {
  errorHandle,
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

const voice = ref<SpeechSynthesisVoice[]>([])

const word = ref('')

const modelData = reactive<ModelType>({
  input: null,
  output: null,
})

const storeData = store<{ pitch: number, rate: number, volume: number, voiceUrl: string }>('data', {
  pitch: 1,
  rate: 1,
  voiceUrl: '',
  volume: 100,
})
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
  [
    !!modelData.input && modelData.output === modelData.input,
    'Input and output cannot be the same',
  ],
])

const iframeOptions = [
  {
    label: '国际音标',
    value: 'https://www.xdf.cn/zhuanti/bd-phonetic-alphabet-card/index.html?src=baidu',
  },
  {
    label: '英汉词典',
    value: 'https://www.wordreference.com/enzh/',
  },
  {
    label: '有道词典',
    value: 'https://dict.youdao.com/m/result?lang=en&word=',
  },
]
const iframeRef = ref(iframeOptions[0].value)

async function start(records: IRecord[]) {
  const text = records.map((item) => {
    return TextFieldToStr(item.fields[modelData.input!] as IOpenSegment[])
  })
  const res = await request.post('https://phoneticsmate.ocyss.repl.co/transcript/ipa', text, {
    timeout: 20000,
  })
  if (res.data.code === 0)
    return []

  const dict = res.data.data
  return records
    .map((item) => {
      const text = TextFieldToStr(item.fields[modelData.input!] as IOpenSegment[])
      item.fields[modelData.output!] = dict[text]
      return item
    })
    .filter(item => item !== null)
}

function main(all?: boolean) {
  getRecords(
    async ({ records }) => {
      return await table.value!.setRecords(await start(records.records))
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
  await getTable()
  EasySpeech.detect()
  let table: ITable
  await EasySpeech.init({ interval: 250, maxTimeout: 5000, quiet: true })
    .then(() => {
      console.debug('load complete')
    })
    .catch((e) => {
      console.error(e)
    })
  voice.value = EasySpeech.voices().filter(item => item.lang === 'en-US')
  storeData.value.voiceUrl = voice.value[0].voiceURI
  const off = bitable.base.onSelectionChange(async ({ data }) => {
    if (data.tableId && data.fieldId && data.recordId) {
      if (!table || table.id !== data.tableId)
        table = await bitable.base.getTableById(data.tableId)

      const cellValue = await table.getCellValue(data.fieldId, data.recordId)
      if (
        Array.isArray(cellValue)
        && cellValue[0]
        && typeof cellValue[0] === 'object'
        && 'type' in cellValue[0]
        && cellValue[0].type === 'text'
        && 'text' in cellValue[0]
      ) {
        word.value = cellValue[0].text
        EasySpeech.cancel()
        await EasySpeech.speak({
          pitch: storeData.value.pitch,
          rate: storeData.value.rate,
          text: word.value,
          voice: voice.value.find(item => item.voiceURI === storeData.value.voiceUrl),
          volume: storeData.value.volume / 100,
        })
      }
      else {
        word.value = ''
      }
    }
  })
  eventBucket.add(off)
})
</script>

<template>
  <Layout ref="layout">
    <n-tabs type="segment">
      <n-tab-pane
        name="chap1"
        tab="发音"
        display-directive="show"
      >
        <form-select
          v-model:value="storeData.voiceUrl"
          :msg="t('Select Voice')"
          :options="voice"
          label-field="name"
          value-field="voiceURI"
        />
        <n-form-item :label="t('pitch')">
          <n-slider
            v-model:value="storeData.pitch"
            :min="0"
            :max="2"
            :step="0.1"
          />
        </n-form-item>
        <n-form-item :label="t('rate')">
          <n-slider
            v-model:value="storeData.rate"
            :min="0.1"
            :max="2"
            :step="0.1"
          />
        </n-form-item>
        <n-form-item :label="t('volume')">
          <n-slider
            v-model:value="storeData.volume"
            :min="0"
            :max="100"
            :step="1"
            :format-tooltip="(value: number) => `${value}%`"
          />
        </n-form-item>
      </n-tab-pane>
      <n-tab-pane
        name="chap2"
        tab="速查"
        display-directive="show"
      >
        <n-dropdown
          trigger="click"
          :options="iframeOptions"
          @select="(_, option) => (iframeRef = option.value as string)"
        >
          <n-button style="margin-bottom: 6px; width: 100%">
            换源
          </n-button>
        </n-dropdown>
        <iframe
          v-if="iframeRef === iframeOptions[0].value || word"
          :src="iframeRef === iframeOptions[0].value ? iframeRef : iframeRef + word"
          frameborder="0"
          style="width: 100%; height: 80vh"
        />
        <div v-else>
          不支持的单元格
        </div>
      </n-tab-pane>
      <n-tab-pane
        name="chap3"
        tab="转换"
        display-directive="show"
      >
        <n-blockquote>英语转国际音标</n-blockquote>
        <n-space justify="space-between">
          <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
          <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
        </n-space>
        <form-select
          v-model:value="modelData.input"
          :msg="t('Select Input Field')"
          :options="filterFields(FieldType.Text)"
        />
        <form-select
          v-model:value="modelData.output"
          :msg="t('Select Output Field')"
          :options="filterFields(FieldType.Text)"
        />
        <form-start
          :disableds="disableds"
          @update:click="main"
        />
      </n-tab-pane>
    </n-tabs>
  </Layout>
</template>

<i18n locale="zh" lang="json">
{
  "Select Voice": "声音",
  "pitch": "音高",
  "rate": "音速",
  "volume": "音量",
  "loop": "循环"
}
</i18n>
