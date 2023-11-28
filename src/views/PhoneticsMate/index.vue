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
<template>
  <Layout ref="layout">
    <n-tabs type="segment">
      <n-tab-pane name="chap1" tab="发音" display-directive="show">
        <form-select
          :msg="t('Select Voice')"
          v-model:value="formData.voiceUrl"
          :options="voice"
          label-field="name"
          value-field="voiceURI" />
        <n-form-item :label="t('pitch')">
          <n-slider v-model:value="formData.pitch" :min="0" :max="2" :step="0.1" />
        </n-form-item>
        <n-form-item :label="t('rate')">
          <n-slider v-model:value="formData.rate" :min="0.1" :max="2" :step="0.1" />
        </n-form-item>
        <n-form-item :label="t('volume')">
          <n-slider
            v-model:value="formData.volume"
            :min="0"
            :max="100"
            :step="1"
            :format-tooltip="(value: number) => `${value}%`" />
        </n-form-item>
      </n-tab-pane>
      <n-tab-pane name="chap2" tab="速查" display-directive="show">
        <n-dropdown
          trigger="click"
          :options="iframeOptions"
          @select="(_, option) => (iframeRef = option.value as string)">
          <n-button style="margin-bottom: 6px; width: 100%">换源</n-button>
        </n-dropdown>
        <iframe
          v-if="iframeRef === iframeOptions[0].value || word"
          :src="iframeRef === iframeOptions[0].value ? iframeRef : iframeRef + word"
          frameborder="0"
          style="width: 100%; height: 80vh" />
        <div v-else>不支持的单元格</div>
      </n-tab-pane>
      <n-tab-pane name="chap3" tab="转换" display-directive="show">
        <n-blockquote>英语转国际音标</n-blockquote>
        <form-select
          :msg="t('Select Data Table')"
          v-model:value="store.tableId"
          :options="store.tableMetaList"
          @update:value="() => store.getField()" />
        <form-select
          :msg="t('Select Input Field')"
          v-model:value="store.input"
          :options="store.filterFields(FieldType.Text)" />
        <form-select
          :msg="t('Select Output Field')"
          v-model:value="store.output"
          :options="store.filterFields(FieldType.Text)" />
        <form-start @update:click="main" :disableds="disableds" />
      </n-tab-pane>
    </n-tabs>
  </Layout>
</template>

<script setup lang="ts">
import EasySpeech from "easy-speech"

import Layout from "@/components/layout.vue"
import {store} from "@/store.js"
import {TextFieldToStr} from "@/utils"
import request from "@/utils/request"

const {t} = useI18n()

const voice = ref<SpeechSynthesisVoice[]>([])
const layout = ref<InstanceType<typeof Layout>>()
const word = ref("")
const formData = reactive({
  "voiceUrl": "",
  "pitch": 1,
  "rate": 1,
  "volume": 100
})

const disableds = computed<Array<[boolean, string]>>(() => [
  [!store.input, "输入不能为空"],
  [!store.output, "输出不能为空"],
  [!!store.input && store.output === store.input, "输入输出不能相同"]
])

const iframeOptions = [
  {
    "label": "国际音标",
    "value": "https://www.xdf.cn/zhuanti/bd-phonetic-alphabet-card/index.html?src=baidu"
  },
  {
    "label": "英汉词典",
    "value": "https://www.wordreference.com/enzh/"
  },
  {
    "label": "有道词典",
    "value": "https://dict.youdao.com/m/result?lang=en&word="
  }
]
const iframeRef = ref(iframeOptions[0].value)

async function start(records: IRecord[]) {
  const text = records.map(item => {
    return TextFieldToStr(item.fields[store.input!] as IOpenSegment[])
  })
  const res = await request.post("https://phoneticsmate.ocyss.repl.co/transcript/ipa", text, {
    "timeout": 20000
  })
  if (res.data.code === 0) {
    return []
  }
  const dict = res.data.data
  return records
    .map(item => {
      const text = TextFieldToStr(item.fields[store.input!] as IOpenSegment[])
      item.fields[store.output!] = dict[text]
      return item
    })
    .filter(item => item !== null)
}

async function main() {
  layout.value?.update(true, t("Step 1 - Getting Table"))
  layout.value?.init()
  if (store.check()) {
    const table = await bitable.base.getTableById(store.tableId)
    layout.value?.update(true, t("Step 2 - Getting Records"))
    await layout.value?.getRecords(
      table,
      async ({records}) => {
        return await table.setRecords(await start(records.records))
      },
      30
    )
  }
  layout.value?.finish()
}

onMounted(async () => {
  await store.init(layout.value!)
  EasySpeech.detect()
  let table: ITable
  await EasySpeech.init({"maxTimeout": 5000, "interval": 250, "quiet": true})
    .then(() => {
      console.debug("load complete")
    })
    .catch(e => {
      console.error(e)
    })
  voice.value = EasySpeech.voices().filter(item => item.lang === "en-US")
  formData.voiceUrl = voice.value[0].voiceURI
  const off = bitable.base.onSelectionChange(async ({data}) => {
    if (data.tableId && data.fieldId && data.recordId) {
      if (!table || table.id !== data.tableId) {
        table = await bitable.base.getTableById(data.tableId)
      }
      const cellValue = await table.getCellValue(data.fieldId, data.recordId)
      if (
        Array.isArray(cellValue) &&
        cellValue[0] &&
        typeof cellValue[0] === "object" &&
        "type" in cellValue[0] &&
        cellValue[0].type === "text" &&
        "text" in cellValue[0]
      ) {
        word.value = cellValue[0].text
        EasySpeech.cancel()
        await EasySpeech.speak({
          "text": word.value,
          "voice": voice.value.find(item => item.voiceURI === formData.voiceUrl),
          "pitch": formData.pitch,
          "rate": formData.rate,
          "volume": formData.volume / 100
        })
      } else {
        word.value = ""
      }
    }
  })
  onBeforeUnmount(() => {
    off()
  })
})
</script>

<i18n locale="zh" lang="json">
{
  "Select Voice": "声音",
  "pitch": "音高",
  "rate": "音速",
  "volume": "音量",
  "loop": "循环"
}
</i18n>
