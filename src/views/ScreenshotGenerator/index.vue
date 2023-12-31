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
import type { DataTableColumns } from 'naive-ui'
import { NAvatar, NButton, NCheckbox, NProgress, NRate, NSpace, NTag, darkTheme } from 'naive-ui'
import { useClipboardItems } from '@vueuse/core'
import { domToJpeg } from 'modern-screenshot'
import type { ICurrencyField, IDateTimeField, IGridView, INumberField, IRatingField, ISelectOptionColor, ISingleSelectField } from '@lark-base-open/js-sdk'
import { FieldType } from '@lark-base-open/js-sdk'
import type { VNodeChild } from 'vue'
import format from 'date-fns/format'
import QRCodeVue3 from 'qrcode-vue3'
import { useData } from '@/hooks/useData'
import { useStore } from '@/hooks/useStore'
import { base64ToBlob } from '@/utils/files'
import type { FieldValueHandlers } from '@/utils/field'
import { CurrencyFieldFormat, NumberFieldFormat, RatingFieldIcon, TextFieldToStr, fieldIcon } from '@/utils/field'
import logoSvg from '@/assets/logo.svg'

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
// const qrViewVal = ref('https://feishu.cn/drive/home')

const storeDef = {
  alpha: 80,
  color: 1,
  inLeft: 20,
  inTop: 20,
  line: 1,
  outLeft: 40,
  outTop: 40,
  qrWidth: 65,
  radius: 10,
  recordQr: false,
  singleColumn: true,
  singleLine: false,
  striped: false,
  tdPadding: 12,
  thPadding: 12,
  theme: false,
  viewQr: false,
  watermark: true,
}
const storeData = store('data', storeDef)

const scale = ref(1)

function reset() {
  for (const key in storeDef)
    // @ts-expect-error yes
    storeData.value[key] = storeDef[key]
}

const theme = computed(() => (storeData.value.theme ? darkTheme : null))

let selectOptColorInfo: Record<number, ISelectOptionColor> = []
let fieldMode: Record<string, any> = {}
const fieldWidth = ref<Record<string, number>>({})

onGetField(() => {
  fieldMode = {}
  fieldWidth.value = {}
  modelData.input.length = 0
})

onFieldTraverse(async (item) => {
  if (!table.value || !view.value)
    return
  const field = await table.value.getField(item.id)
  fieldWidth.value[item.id] = Object.freeze(await (view.value as IGridView).getFieldWidth(item.id))

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

type ExtractFieldHandlers<T> = {
  [K in keyof T]: ({ fid, rid, vals }: { rid: string, fid: string, vals: T[K] }) => VNodeChild
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
    return h(NCheckbox, { checked: vals, size: 'large' })
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
  [FieldType.Denied]() {
  },
  [FieldType.DuplexLink]({ vals }) {
    return h(NSpace, { size: 'small' }, vals.text.split(',').map(val => h(NTag, { bordered: false, size: 'small' }, val)))
  },
  [FieldType.Email]() {
  },
  [FieldType.Formula]() {
  },
  [FieldType.GroupChat]({ vals }) {
    return h('span', {}, vals.map(val => h('span', { class: 'flexCenter', style: { whiteSpace: 'nowrap' } }, [
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
    return h(NButton, { round: true, size: 'small', type: 'primary' }, '按钮')
  },
  [FieldType.Number]({ fid, vals }) {
    if (fieldMode[fid])
      return h('span', {}, NumberFieldFormat(vals, fieldMode[fid]))
  },
  [FieldType.Phone]() {
  },
  [FieldType.Progress]({ vals }) {
    return h(NProgress, { percentage: vals * 100, type: 'line' })
  },
  [FieldType.Rating]({ fid, vals }) {
    if (fieldMode[fid]) {
      let value = vals
      if ((value || value === 0) && fieldMode[fid].min === 0)
        value++
      return h(NRate, { count: fieldMode[fid].max - fieldMode[fid].min + 1, readonly: true, value }, h('span', { innerHTML: RatingFieldIcon(fieldMode[fid].icon) }))
    }
  },
  [FieldType.SingleLink]({ vals }) {
    return h(NSpace, { size: 'small' }, vals.text.split(',').map(val => h(NTag, { bordered: false, size: 'small' }, val)))
  },
  [FieldType.SingleSelect]({ fid, vals }) {
    if (fieldMode[fid] && fieldMode[fid][vals.id])
      return h(NTag, { color: { borderColor: fieldMode[fid][vals.id].bgColor, color: fieldMode[fid][vals.id].bgColor, textColor: fieldMode[fid][vals.id].textColor }, round: true, size: 'small' }, fieldMode[fid][vals.id].name)
  },
  [FieldType.Text]() {
  },
  [FieldType.Url]({ vals }) {
    return h('span', {}, vals.map(item => item.link).join('\n'))
  },
  [FieldType.User]({ vals }) {
    return h('span', {}, vals.map(val => h('span', { class: 'flexCenter', style: { whiteSpace: 'nowrap' } }, [
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

const tableColumns = computed<DataTableColumns>(() =>
  fieldMetaList.value
    .filter(item => !modelData.input.includes(item.id) && item.type !== FieldType.NotSupport)
    .map((item) => {
      const width = (fieldWidth.value[item.id] ?? 150)
        + Math.max(storeData.value.thPadding, storeData.value.tdPadding) * 2
      return {
        align: 'center',
        ellipsis: { lineClamp: storeData.value.line, tooltip: false },
        ellipsisComponent: 'performant-ellipsis',
        key: item.id,
        meta: item,
        minWidth: width,
        render: (raw: any) => convF(item.type, item.id, raw.rid, raw[item.id]),
        resizable: true,
        title: () => h('div', { class: 'flexCenter', innerHTML: `${fieldIcon(item.type)}&nbsp;${item.name}` }),
        width,
      }
    }),
)

const tableData = ref<{
  rid: string
  [fieldId: string]: IOpenCellValue
}[]>([])

async function main() {
  if (!table.value || !tableId.value || !viewId.value)
    return
  const recordIdList = await bitable.ui.selectRecordIdList(tableId.value, viewId.value)
  // recordValList.value.length = 0
  tableData.value.length = 0
  if (recordIdList.length > 0)
    qrRecordVal.value = await table.value.getRecordShareLink(recordIdList[0])

  for (const recordId of recordIdList) {
    const val = await table.value.getRecordById(recordId)
    tableData.value.push(Object.freeze({ rid: recordId, ...val.fields }))
    // recordValList.value.push({ fields: val.fields, recordId })
  }
}

async function start(_copy = false) {
  if (_copy) {
    message.error(t('iframe被阻止，无法复制图片'))
    return
  }
  scale.value = 1
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

onMounted(async () => {
  const _selectOptColorInfo = await bitable.ui.getSelectOptionColorInfoList()
  selectOptColorInfo = _selectOptColorInfo.reduce((acc: Record<number, ISelectOptionColor>, item) => {
    acc[item.id] = item
    return acc
  }, {})
  await getTable()
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
    <n-slider v-model:value="scale" :step="0.05" :min="0.1" :max="1.5" />
    <n-config-provider :theme="theme" style="width: 100%; max-height: 60vh">
      <div
        ref="box"
        class="box"
        :style="{
          padding: `0px ${storeData.outLeft}px`,
          paddingTop: `${Math.max(storeData.outTop, storeData.watermark ? 45 : 0)}px`,
          paddingBottom: `${Math.max(storeData.outTop, storeData.viewQr || storeData.recordQr ? storeData.qrWidth + 10 : 0)}px`,
          zoom: scale,
        }"
        :class="`backgroundColor-${storeData.color}`"
      >
        <div v-if="storeData.watermark" class="watermark">
          <a class="brand__logo"><span class="universe-icon"><img :src="logoSvg"></span></a><span class="brand__product bold ellipsis"><a class="router-link bold ellipsis">飞书云文档</a></span>
        </div>
        <n-data-table
          :columns="tableColumns"
          :data="tableData"
          class="card"
          :style="{
            'border-radius': `${storeData.radius}px`,
            'opacity': storeData.alpha / 100,
            '--n-th-padding': `${storeData.thPadding}px`,
            '--n-td-padding': `${storeData.tdPadding}px`,
          }"
          :single-column="!storeData.singleColumn"
          :single-line="!storeData.singleLine"
          :striped="storeData.striped"
        >
          <template #empty />
        </n-data-table>

        <!-- <QRCodeVue3 v-if="storeData.viewQr" /> -->
        <div class="qr" :style="`width:${storeData.qrWidth}px;height:${storeData.qrWidth}px;right:${storeData.outLeft}px;border-radius:${storeData.radius}px`">
          <QRCodeVue3
            v-if="storeData.recordQr"
            :key="qrRecordVal"
            :value="qrRecordVal"
            :margin="0"
            :image-options="{ crossOrigin: 'anonymous', imageSize: 0.5, margin: 0 }"
            :dots-options="{ color: '#133c9a', type: 'rounded' }"
            :corners-square-options="{ color: '#3370ff', type: 'rounded' }"
            :corners-dot-options="{ color: '#00d6b9', type: 'rounded' }"
            :image="logoSvg"
          />
        </div>
      </div>
    </n-config-provider>
    <n-collapse style="margin-bottom: 15px" accordion display-directive="show">
      <n-collapse-item title="配置">
        <form-select
          v-model:value="modelData.input"
          :msg="t('选择不显示的字段')"
          multiple
          :options="filterFields()"
        />
        <n-form-item label="最大行数：">
          <n-slider v-model:value="storeData.line" :min="1" :max="10" />
        </n-form-item>
        <n-form-item label-placement="left" label="水印：">
          <n-switch v-model:value="storeData.watermark" />
        </n-form-item>
        <n-form-item label-placement="left" label="视图二维码：">
          <n-switch v-model:value="storeData.viewQr" disabled />
        </n-form-item>
        <n-form-item label-placement="left" label="记录二维码：">
          <n-switch v-model:value="storeData.recordQr" />
        </n-form-item>
        <n-form-item label="二维码大小：">
          <n-slider v-model:value="storeData.qrWidth" :min="50" :max="300" />
        </n-form-item>
      </n-collapse-item>
      <n-collapse-item title="外观">
        <n-collapse class="style" accordion display-directive="show">
          <n-form-item style="margin-left: 14px" label-placement="left" label="深色模式：">
            <n-switch v-model:value="storeData.theme" />
          </n-form-item>
          <n-collapse-item title="边距：">
            <n-form-item label="上下边距：">
              <n-slider v-model:value="storeData.outTop" :min="25" :max="150" />
            </n-form-item>
            <n-form-item label="左右边距：">
              <n-slider v-model:value="storeData.outLeft" :min="25" :max="150" />
            </n-form-item>
          </n-collapse-item>
          <n-collapse-item title="表格：">
            <n-form-item label-placement="left" label="条纹：">
              <n-switch v-model:value="storeData.striped" />
            </n-form-item>
            <n-form-item label-placement="left" label="行分割线：">
              <n-switch v-model:value="storeData.singleColumn" />
            </n-form-item>
            <n-form-item label-placement="left" label="列分割线：">
              <n-switch v-model:value="storeData.singleLine" />
            </n-form-item>
            <n-form-item label="标题填充：">
              <n-slider v-model:value="storeData.thPadding" :min="0" :max="50" />
            </n-form-item>
            <n-form-item label="内容填充：">
              <n-slider v-model:value="storeData.tdPadding" :min="0" :max="50" />
            </n-form-item>
          </n-collapse-item>
          <n-collapse-item title="卡片：">
            <n-form-item label="透明度：">
              <n-slider v-model:value="storeData.alpha" :min="0" :max="100" />
            </n-form-item>
            <n-form-item label="圆角：">
              <n-slider v-model:value="storeData.radius" :min="0" :max="50" />
            </n-form-item>
          </n-collapse-item>
          <n-collapse-item title="背景：">
            <NSpace class="options-img">
              <div
                v-for="item in 8"
                :key="item"
                class="op" :class="{ checked: storeData.color === item, [`backgroundColor-${item}`]: true }"
                @click="storeData.color = item"
              />
            </NSpace>
          </n-collapse-item>
        </n-collapse>
      </n-collapse-item>
    </n-collapse>
    <form-start
      msg="选择分享记录"
      operate
      :buttons="[
        ['复制', () => start(true)],
        ['下载', () => start(false)],
        ['重置配置', reset],
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

    .brand__logo img {
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
    :deep(div) {
      width: 100%;
      height: 100%;
      img {
        width: 100%;
        height: 100%;
      }
    }
  }
}

.n-data-table {
  :deep(th svg) {
    width: 14px;
    height: 14px;
  }
  :deep(.n-ellipsis) {
    width: 100%;
  }
  :deep(.n-data-table-wrapper) {
    border-radius: v-bind('`${storeData.radius}px`');
  }
  :deep(.n-data-table-empty) {
    display: none;
  }
  :deep(.n-rate .n-rate__item:not(.n-rate__item--active) svg path) {
    fill: var(--n-item-color);
  }
  :deep(.n-data-table-th .n-data-table-resize-button) {
    right: calc(var(--n-resizable-container-size) / -2);
    cursor: pointer;
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

.n-collapse :deep(.n-collapse-item) {
  border-top: unset !important;
  --n-title-padding: 0 !important;
  .n-form-item-feedback-wrapper {
    display: none;
  }
  .style > div {
    margin-left: 8px;
  }
}

.options-img .op {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 3px solid #ffffff;
  cursor: pointer;
  &.checked {
    border: 3px solid rgb(42, 148, 125);
  }
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
