<route lang="yaml">
name: ScreenshotGenerator
meta:
  title: ScreenshotGenerator
  desc: ScreenshotGenerator allows users to select specific records for which it automatically generates card-like screenshots, facilitating easy sharing of these records.
  help:
  group:
  tags:
    - Audit
  avatar: 应用图标 html格式
</route>

<script setup lang="ts">
import { NAvatar, NButton, NCheckbox, NProgress, NRate, NSpace, NTag, darkTheme } from 'naive-ui'
import { useClipboardItems } from '@vueuse/core'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { domToJpeg } from 'modern-screenshot'
import type { ICurrencyField, IDateTimeField, IGridView, INumberField, IRatingField, ISelectOptionColor, ISingleSelectField } from '@lark-base-open/js-sdk'
import { FieldType } from '@lark-base-open/js-sdk'
import type { VNodeChild } from 'vue'
import format from 'date-fns/format'
import { useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'
import { base64ToBlob } from '@/utils/files'
import type { FieldValueHandlers } from '@/utils/field'
import { CurrencyFieldFormat, NumberFieldFormat, RatingFieldIcon, TextFieldToStr, fieldIcon } from '@/utils/field'

const { copy } = useClipboardItems()
const {
  fieldMetaList,
  filterFields,
  getTable,
  layout,
  message,
  onFieldTraverse,
  onGetField,
  t,
  table,
  tableId,
  tableMetaList,
  view,
  viewId,
  viewMetaList,
} = useData()

const { store } = useStore()
const box = ref()
const modelData = reactive({
  input: [] as string[],
})

const qrRecordVal = ref('https://feishu.cn/drive/home')
const qrRecordCode = useQRCode(qrRecordVal)
const qrViewVal = ref('https://feishu.cn/drive/home')
const qrViewCode = useQRCode(qrViewVal)
const storeDef = {
  alpha: 80,
  color: 'backgroundColor-1',
  inLeft: 20,
  inTop: 20,
  line: 1,
  outLeft: 40,
  outTop: 40,
  radius: 10,
  recordQr: false,
  theme: false,
  viewQr: false,
  watermark: true,
}
const storeData = store('data', storeDef)

function reset() {
  for (const key in storeDef)
    // @ts-expect-error yes
    storeData.value[key] = storeDef[key]
}

const theme = computed(() => (storeData.value.theme ? darkTheme : null))
const fieldValList = computed(() =>
  fieldMetaList.value.filter(item => !modelData.input.includes(item.id) && item.type !== FieldType.NotSupport),
)
const recordValList = ref<IRecord[]>([])
let selectOptColorInfo: Record<number, ISelectOptionColor> = []
let fieldMode: Record<string, any> = {}
let fieldWidth: Record<string, number> = {}

onGetField(() => {
  fieldMode = {}
  fieldWidth = {}
  modelData.input.length = 0
})

onFieldTraverse(async (item) => {
  if (!table.value || !view.value)
    return
  const field = await table.value.getField(item.id)
  fieldWidth[item.id] = await (view.value as IGridView).getFieldWidth(item.id)

  switch (item.type) {
    case FieldType.DateTime:
    case FieldType.CreatedTime:
    case FieldType.ModifiedTime:
      fieldMode[item.id] = await (field as IDateTimeField).getDateFormat()
      break
    case FieldType.SingleSelect:
    case FieldType.MultiSelect:
      fieldMode[item.id] = (await (field as ISingleSelectField).getOptions()).reduce((acc, cur) => {
        acc[cur.id] = { ...selectOptColorInfo[cur.color], name: cur.name }
        return acc
      }, {} as Record<string, ISelectOptionColor & { name: string }>)
      break
    case FieldType.Number:
      fieldMode[item.id] = await (field as INumberField).getFormatter()
      break
    case FieldType.Currency:{
      const [
        code,
        digits,
      ] = await Promise.all([
        (field as ICurrencyField).getCurrencyCode(),
        (field as ICurrencyField).getDecimalDigits(),
      ])
      fieldMode[item.id] = { code, digits }
      break
    }
    case FieldType.Rating:{
      const [
        min,
        max,
        icon,
      ] = await Promise.all([
        (field as IRatingField).getMin(),
        (field as IRatingField).getMax(),
        (field as IRatingField).getRatingIcon(),
      ])
      fieldMode[item.id] = { icon, max, min }
      break
    }
  }
})

async function main() {
  if (!table.value || !tableId.value || !viewId.value)
    return
  const recordIdList = await bitable.ui.selectRecordIdList(tableId.value, viewId.value)
  recordValList.value.length = 0
  if (recordIdList.length > 0)
    qrRecordVal.value = await table.value.getRecordShareLink(recordIdList[0])

  for (const recordId of recordIdList) {
    const val = await table.value.getRecordById(recordId)
    recordValList.value.push({ fields: val.fields, recordId })
  }
}

async function start(_copy = false) {
  if (_copy) {
    message.error(t('iframe被阻止，无法复制图片'))
    return
  }

  const mime = 'image/jpeg'
  const data = await domToJpeg(box.value, {
    scale: 2,
  })
  if (_copy) {
    await copy([
      new ClipboardItem({
        [mime]: base64ToBlob(data),
      }),
    ])
    message.success(t('已复制到剪切板'))
  }
  else {
    const a = document.createElement('a')
    a.download = 'ScreenshotGenerator.jpeg'
    a.href = data
    a.dispatchEvent(new MouseEvent('click'))
    message.success(t('开始下载'))
  }
}

type ExtractFieldHandlers<T> = {
  [K in keyof T]?: ({ fid, rid, vals }: { rid: string, fid: string, vals: T[K] }) => VNodeChild
}

const conv: ExtractFieldHandlers<FieldValueHandlers> = {
  [FieldType.Attachment]({ vals }) {
    const icon = `<svg t="1703862651962" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2509" width="25" height="25"><path d="M96 1024V0h448v384h384v640H96z m416-544a32 32 0 0 0-32-32H192a32 32 0 0 0-32 32v96a32 32 0 0 0 32 32h288a32 32 0 0 0 32-32v-96z m352 224a32 32 0 0 0-32-32H192a32 32 0 0 0-32 32v96a32 32 0 0 0 32 32h640a32 32 0 0 0 32-32v-96z" fill="#3CC451" p-id="2510"></path><path d="M608 0l320 320H608V0z" fill="#B0E7B8" p-id="2511"></path></svg>`
    return h('span', { innerHTML: vals.map(_val => icon).join(', ') })
  },
  [FieldType.AutoNumber]() {

  },
  [FieldType.Barcode]() {

  },
  [FieldType.Checkbox]({ vals }) {
    return h(NCheckbox, { defaultChecked: vals, size: 'large' })
  },
  [FieldType.CreatedTime]() {

  },
  [FieldType.CreatedUser]() {

  },
  [FieldType.Currency]({ fid, vals }) {
    if (fieldMode[fid])
      return h('span', {}, CurrencyFieldFormat(vals, fieldMode[fid].code, fieldMode[fid].digits))
  },
  [FieldType.DateTime]({ fid, vals }) {
    if (fieldMode[fid])
      return h('span', {}, format(vals, fieldMode[fid]))
  },
  [FieldType.DuplexLink]({ vals }) {
    return h(NSpace, { size: 'small' }, vals.text.split(',').map(val => h(NTag, { bordered: false, size: 'small' }, val)))
  },
  [FieldType.Email]() {

  },
  [FieldType.Formula]() {

  },
  [FieldType.GroupChat]({ vals }) {
    return h('span', { }, vals.map(val => h('span', { class: 'flexCenter' }, [
      h(NAvatar, { round: true, size: 'small', src: val.avatarUrl }),
      val.name,
    ])))
  },
  [FieldType.Location]() {

  },
  [FieldType.Lookup]() {

  },
  [FieldType.ModifiedTime]() {

  },
  [FieldType.ModifiedUser]() {

  },
  [FieldType.MultiSelect]({ fid, vals }) {
    if (fieldMode[fid])
      return h(NSpace, { size: 'small' }, vals.map(val => h(NTag, { color: { borderColor: fieldMode[fid][val.id].bgColor, color: fieldMode[fid][val.id].bgColor, textColor: fieldMode[fid][val.id].textColor }, round: true, size: 'small' }, fieldMode[fid][val.id].name)))
  },
  [FieldType.NotSupport]() {
  },
  [FieldType.Number]({ fid, vals }) {
    if (fieldMode[fid])
      return h('span', {}, NumberFieldFormat(vals, fieldMode[fid]))
  },
  [FieldType.Phone]() {

  },
  [FieldType.Progress]({ fid, vals }) {
    return h(NProgress, { percentage: vals * 100, style: { width: `${fieldWidth[fid]}px` }, type: 'line' })
  },
  [FieldType.Rating]({ fid, vals }) {
    if (fieldMode[fid])
      return h(NRate, { count: fieldMode[fid].max - fieldMode[fid].min + 1, readonly: true, value: vals }, h('span', { innerHTML: RatingFieldIcon(fieldMode[fid].icon) }))
  },
  [FieldType.SingleLink]({ vals }) {
    return h(NSpace, { size: 'small' }, vals.text.split(',').map(val => h(NTag, { bordered: false, size: 'small' }, val)))
  },
  [FieldType.SingleSelect]({ fid, vals }) {
    if (fieldMode[fid] && fieldMode[fid][vals.id])
      return h(NTag, { color: { borderColor: fieldMode[fid][vals.id].bgColor, color: fieldMode[fid][vals.id].bgColor, textColor: fieldMode[fid][vals.id].textColor }, round: true, size: 'small' }, fieldMode[fid][vals.id].name)
  },
  [FieldType.Url]({ vals }) {
    return h('span', {}, vals.map(item => item.link).join('\n'))
  },
  [FieldType.User]({ vals }) {
    return h('span', {}, vals.map(val => h('span', { class: 'flexCenter' }, [
      h(NAvatar, { round: true, size: 'small' }, val.name),
      val.name,
    ])))
  },
}

function convF(type: FieldType, fid: string, rid: string, vals: IOpenCellValue) {
  const f = conv[type]
  const flag = (vals !== null && vals !== undefined) || type === FieldType.Rating
  if (flag && f && typeof f === 'function') {
    const res = f({ fid, rid, vals } as never)
    if (res)
      return res
  }
  return h('span', {}, TextFieldToStr(vals))
}

onMounted(async () => {
  const _selectOptColorInfo = await bitable.ui.getSelectOptionColorInfoList()
  selectOptColorInfo = _selectOptColorInfo.reduce((acc: Record<number, ISelectOptionColor>, item) => {
    acc[item.id] = item
    return acc
  }, {})
  await getTable()
  console.log(fieldMetaList.value)

  // try {
  //   qrViewVal.value = await view.value?.getShareLink() ?? ''
  // }
  // catch (e) {
  // }

  // console.log(qrViewVal.value)
})
</script>

<template>
  <Layout ref="layout">
    <NSpace justify="space-between">
      <form-tags v-model:value="tableId" :msg="t('Table')" :tags="tableMetaList" />
      <form-tags v-model:value="viewId" :msg="t('View')" :tags="viewMetaList" />
    </NSpace>
    <n-config-provider :theme="theme" style="width: 100%; max-height: 60vh">
      <div
        ref="box"
        class="box"
        :style="{
          padding: `0px ${storeData.outLeft}px`,
          paddingTop: `${Math.max(storeData.outTop, storeData.watermark ? 45 : 0)}px`,
          paddingBottom: `${Math.max(storeData.outTop, storeData.viewQr || storeData.recordQr ? 88 : 0)}px`,
        }"
        :class="storeData.color"
      >
        <div v-if="storeData.watermark" class="watermark">
          <a class="brand__logo"><span class="universe-icon"><svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            data-icon="LarkLogoColorful"
          >
            <path
              d="m12.924 12.803.056-.054c.038-.034.076-.072.11-.11l.077-.076.23-.227 1.334-1.319.335-.331c.063-.063.13-.123.195-.183a7.777 7.777 0 0 1 1.823-1.24 7.607 7.607 0 0 1 1.014-.4 13.177 13.177 0 0 0-2.5-5.013 1.203 1.203 0 0 0-.94-.448h-9.65c-.173 0-.246.224-.107.325a28.23 28.23 0 0 1 8 9.098c.007-.006.016-.013.023-.022Z"
              fill="#00D6B9"
            />
            <path
              d="M9.097 21.299a13.258 13.258 0 0 0 11.821-7.247c-.113.22-.243.43-.378.625a5.219 5.219 0 0 1-1.098 1.152 3.777 3.777 0 0 1-.262.185 5.117 5.117 0 0 1-.353.218 4.643 4.643 0 0 1-.726.331 5.317 5.317 0 0 1-1.883.312 5.892 5.892 0 0 1-.524-.031 6.509 6.509 0 0 1-.729-.126c-.06-.016-.12-.029-.18-.044-.167-.044-.33-.092-.495-.14-.082-.024-.164-.046-.246-.072-.123-.038-.246-.072-.366-.11l-.3-.095-.284-.094-.192-.067a4.955 4.955 0 0 1-.233-.082 3.452 3.452 0 0 1-.168-.06c-.11-.04-.22-.079-.328-.12l-.189-.072-.252-.098c-.089-.035-.18-.07-.269-.107l-.173-.07c-.073-.028-.142-.06-.215-.088l-.164-.07-.17-.075-.148-.066-.136-.06-.139-.063a90.183 90.183 0 0 1-.142-.066 4.808 4.808 0 0 0-.18-.083c-.063-.028-.123-.06-.186-.088a5.697 5.697 0 0 1-.198-.098 27.762 27.762 0 0 1-8.067-5.969.18.18 0 0 0-.313.123l.007 9.21c0 .4.198.779.533 1a13.177 13.177 0 0 0 7.325 2.205Z"
              fill="#3370FF"
            />
            <path
              d="M23.732 9.295a7.55 7.55 0 0 0-3.35-.776 7.521 7.521 0 0 0-2.284.35c-.054.016-.107.035-.158.05a8.297 8.297 0 0 0-.855.35 7.14 7.14 0 0 0-.552.297 6.716 6.716 0 0 0-.533.347c-.123.089-.243.18-.363.275-.13.104-.252.211-.375.321-.067.06-.13.123-.196.184l-.334.328-1.338 1.321-.23.228-.076.075c-.038.038-.076.073-.11.11l-.057.054a1.914 1.914 0 0 1-.085.08c-.032.028-.063.06-.095.088a13.286 13.286 0 0 1-2.748 1.946c.06.028.12.057.18.082l.142.066c.044.022.091.041.139.063l.135.06.149.067.17.075.164.07c.073.031.142.06.215.088.056.025.116.047.173.07.088.034.177.072.268.107.085.031.168.066.253.098l.189.072c.11.041.218.082.328.12.057.019.11.041.167.06.08.028.155.053.234.082l.192.066.284.095.3.095c.123.037.243.075.366.11l.246.072c.164.048.331.095.495.14.06.015.12.03.18.043.114.029.227.05.34.07.13.022.26.04.389.057a5.815 5.815 0 0 0 .994.019 5.172 5.172 0 0 0 1.413-.3 5.405 5.405 0 0 0 .726-.334c.06-.035.122-.07.182-.108a7.96 7.96 0 0 0 .432-.297 5.362 5.362 0 0 0 .577-.517 5.285 5.285 0 0 0 .37-.429 5.797 5.797 0 0 0 .527-.827l.13-.258 1.166-2.325-.003.006a7.391 7.391 0 0 1 1.527-2.186Z"
              fill="#133C9A"
            /></svg></span></a><span class="brand__product bold ellipsis"><a class="router-link bold ellipsis">飞书云文档</a></span>
        </div>
        <n-table
          class="card"
          :style="{
            borderRadius: `${storeData.radius}px`,
            opacity: storeData.alpha / 100,
          }"
          :bordered="false"
          :single-line="false"
        >
          <thead>
            <tr>
              <th v-for="field in fieldValList" :key="field.id">
                <div class="flexCenter" :style="`width:${fieldWidth[field.id] ?? 150}px`" v-html="fieldIcon(field.type) + field.name" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in recordValList" :key="record.recordId">
              <td
                v-for="field in fieldValList"
                :key="record.recordId + field.id"
              >
                <div class="td" :style="{ '-webkit-line-clamp': storeData.line }">
                  <component :is="convF(field.type, field.id, record.recordId, record.fields[field.id])" />
                </div>
              </td>
            </tr>
          </tbody>
        </n-table>
        <div class="qr">
          <img v-if="storeData.viewQr" :src="qrViewCode">
          <img v-if="storeData.recordQr" :src="qrRecordCode">
        </div>
      </div>
    </n-config-provider>
    <n-collapse style="margin-bottom: 15px">
      <n-collapse-item title="配置" name="1">
        <form-select
          v-model:value="modelData.input"
          :msg="t('选择不显示的字段')"
          multiple
          :options="filterFields()"
        />
        <n-form-item label="最大行数：">
          <n-slider v-model:value="storeData.line" :min="1" :max="10" :step="1" />
        </n-form-item>
        <n-form-item label="水印：">
          <n-switch v-model:value="storeData.watermark" />
        </n-form-item>
        <n-form-item label="视图二维码：">
          <n-switch v-model:value="storeData.viewQr" disabled />
        </n-form-item>
        <n-form-item label="记录二维码：">
          <n-switch v-model:value="storeData.recordQr" />
        </n-form-item>
        <div>
          <n-h3>外边距：</n-h3>
          <n-form-item label="上下边距：">
            <n-slider v-model:value="storeData.outTop" :min="25" :max="150" :step="1" />
          </n-form-item>
          <n-form-item label="左右边距：">
            <n-slider v-model:value="storeData.outLeft" :min="25" :max="150" :step="1" />
          </n-form-item>
        </div>
        <div>
          <n-h3>卡片：</n-h3>
          <n-form-item label="深色模式：">
            <n-switch v-model:value="storeData.theme" />
          </n-form-item>
          <n-form-item label="透明度：">
            <n-slider v-model:value="storeData.alpha" :min="0" :max="100" :step="1" />
          </n-form-item>
          <n-form-item label="圆角：">
            <n-slider v-model:value="storeData.radius" :min="0" :max="50" :step="1" />
          </n-form-item>
        </div>
        <div>
          <n-h3>背景：</n-h3>
          <NSpace class="options-img">
            <div
              v-for="item in 8"
              :key="item"
              :class="`op backgroundColor-${item} ${
                storeData.color === `backgroundColor-${item}` ? 'checked' : ''
              }`"
              @click="storeData.color = `backgroundColor-${item}`"
            />
          </NSpace>
        </div>
        <NButton style="margin: 15px 0;" type="warning" @click="reset">
          重置
        </NButton>
      </n-collapse-item>
    </n-collapse>
    <form-start
      msg="选择分享记录"
      operate
      :buttons="[
        ['复制', () => start(true)],
        ['下载', () => start(false)],
      ]"
      @update:click="main"
    />
  </Layout>
</template>

<i18n locale="zh" lang="json">
{}
</i18n>

<style lang="scss" scoped>
.box {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: -moz-fit-content;
  width: fit-content;
  position: relative;
  .card {
    box-sizing: border-box;
  }
  .td {
    display: -webkit-inline-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    .n-rate :deep(.n-rate__item:not(.n-rate__item--active) svg path) {
      fill: rgba(255, 255, 255, 0.2);
    }
  }
}

.n-config-provider {
  overflow: scroll;
  margin: 15px 0;
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    display: unset;
  }
  &::-webkit-scrollbar-corner {
    display: none;
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(
      135deg,
      #ff00cc,
      #ffcc00,
      #00ffcc,
      #ff0066
    ) !important;
    border-radius: 10px;
  }
}

.n-h {
  margin: 10px 0px;
  font-weight: 600;
}
.watermark {
  margin: 0 12px;
  padding: 5px 8px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  overflow: hidden;
  width: 132px;
  position: absolute;
  top: 5px;
  left: -5px;
  .brand__logo {
    -webkit-box-flex: 0;
    -ms-flex: none;
    flex: none;
    display: -webkit-inline-box;
    display: -ms-inline-flexbox;
    display: inline-flex;
  }

  .brand__logo svg {
    width: 30px;
    height: 30px;
    margin-right: 12px;
    vertical-align: middle;
  }

  .brand__product {
    line-height: 24px;
    color: var(--text-title);
    font-size: 14px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    overflow: hidden;
  }

  .brand__product .router-link {
    display: inline-block;
    font-weight: 700;
  }

  .brand__ee-log {
    height: 20px;
    margin-top: 1px;
    padding-left: 15px;
    border-left: 1px solid var(--text-link-disabled);
  }
}
.qr {
  position: absolute;
  bottom: 5px;
  right: 5px;
  img {
    width: 65px;
    height: 65px;
  }
}
.options-img .op {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid #ffffff;
  cursor: pointer;
  &.checked {
    border: 3px solid rgb(42, 148, 125);
  }
}

.n-radio-group .n-radio-button.n-radio-button--checked {
  background: unset;
}
</style>

<style scoped>
.backgroundColor-1 {
  background-image: linear-gradient(
    310deg,
    rgb(214, 233, 255),
    rgb(214, 229, 255),
    rgb(209, 214, 255),
    rgb(221, 209, 255),
    rgb(243, 209, 255),
    rgb(255, 204, 245),
    rgb(255, 204, 223),
    rgb(255, 200, 199),
    rgb(255, 216, 199),
    rgb(255, 221, 199)
  );
}

.backgroundColor-2 {
  background-image: linear-gradient(
    160deg,
    rgb(204, 251, 252),
    rgb(197, 234, 254),
    rgb(189, 211, 255)
  );
}

.backgroundColor-3 {
  background-image: linear-gradient(
    150deg,
    rgb(255, 242, 158),
    rgb(255, 239, 153),
    rgb(255, 231, 140),
    rgb(255, 217, 121),
    rgb(255, 197, 98),
    rgb(255, 171, 75),
    rgb(255, 143, 52),
    rgb(255, 115, 33),
    rgb(255, 95, 20),
    rgb(255, 87, 15)
  );
}

.backgroundColor-4 {
  background-image: linear-gradient(
    345deg,
    rgb(211, 89, 255),
    rgb(228, 99, 255),
    rgb(255, 123, 247),
    rgb(255, 154, 218),
    rgb(255, 185, 208),
    rgb(255, 209, 214),
    rgb(255, 219, 219)
  );
}

.backgroundColor-5 {
  background-image: linear-gradient(
    150deg,
    rgb(0, 224, 245),
    rgb(31, 158, 255),
    rgb(51, 85, 255)
  );
}

.backgroundColor-6 {
  background-image: linear-gradient(
    330deg,
    rgb(255, 25, 125),
    rgb(45, 13, 255),
    rgb(0, 255, 179)
  );
}

.backgroundColor-7 {
  background-image: linear-gradient(
    150deg,
    rgb(0, 176, 158),
    rgb(19, 77, 93),
    rgb(16, 23, 31)
  );
}

.backgroundColor-8 {
  background-image: linear-gradient(
    150deg,
    rgb(95, 108, 138),
    rgb(48, 59, 94),
    rgb(14, 18, 38)
  );
}
</style>
