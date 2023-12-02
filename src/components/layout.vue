<template>
  <n-h4 style="margin-top: 0px">
    <n-avatar @contextmenu.prevent.stop="router.push({name: 'home'})">
      <n-icon v-html="route.meta.avatar" />
    </n-avatar>
    {{ t(route.meta.title as string) }}
    <n-a
      :title="t('Join the feedback group')"
      v-if="route.meta.group"
      :href="route.meta.group"
      target="_blank">
      <n-icon size="30">
        <svg viewBox="0 0 1024 1024">
          <path
            d="M534.4 489.6c-9.6-9.6-22.4-12.8-35.2-6.4-12.8 3.2-19.2 16-19.2 28.8 0 3.2 0 9.6 3.2 12.8 3.2 3.2 3.2 6.4 6.4 9.6 3.2 3.2 6.4 6.4 9.6 6.4 3.2 3.2 9.6 3.2 12.8 3.2 9.6 0 16-3.2 22.4-9.6 3.2-3.2 6.4-6.4 6.4-9.6 3.2-6.4 3.2-16 0-25.6 0-3.2-3.2-6.4-6.4-9.6zM406.4 489.6c-9.6-9.6-22.4-12.8-35.2-6.4-12.8 3.2-19.2 16-19.2 28.8 0 3.2 0 9.6 3.2 12.8 3.2 3.2 3.2 6.4 6.4 9.6 3.2 3.2 6.4 6.4 9.6 6.4 3.2 3.2 9.6 3.2 12.8 3.2 9.6 0 16-3.2 22.4-9.6 3.2-3.2 6.4-6.4 6.4-9.6 3.2-6.4 3.2-16 0-25.6 0-3.2-3.2-6.4-6.4-9.6z"></path>
          <path
            d="M768 288H256c-19.2 0-32 12.8-32 32v352c0 19.2 12.8 32 32 32h147.2l86.4 86.4c6.4 6.4 12.8 9.6 22.4 9.6 9.6 0 16-3.2 22.4-9.6l86.4-86.4H768c19.2 0 32-12.8 32-32V320c0-19.2-12.8-32-32-32z m-32 352h-128c-9.6 0-16 3.2-22.4 9.6L512 723.2l-73.6-73.6c-6.4-6.4-12.8-9.6-22.4-9.6H288v-288h448v288z"></path>
          <path
            d="M608 512c0 3.2 0 9.6 3.2 12.8 3.2 3.2 3.2 6.4 6.4 9.6 3.2 3.2 6.4 6.4 9.6 6.4 3.2 3.2 9.6 3.2 12.8 3.2 9.6 0 16-3.2 22.4-9.6 3.2-3.2 6.4-6.4 6.4-9.6 3.2-6.4 3.2-16 0-25.6 0-3.2-3.2-6.4-6.4-9.6-9.6-9.6-22.4-12.8-35.2-6.4-12.8 3.2-19.2 16-19.2 28.8z"></path>
        </svg>
      </n-icon>
    </n-a>
    <slot name="header"></slot>
  </n-h4>
  <n-collapse v-if="route.meta.help">
    <n-collapse-item title="Help" name="1">
      <n-blockquote align-text v-html="t(route.meta.help as string)"></n-blockquote>
    </n-collapse-item>
  </n-collapse>
  <n-spin :show="lock" class="layout-spin">
    <template #description>
      <div v-if="progress.length === 0">
        {{ message }}
      </div>
      <div v-else v-for="item in progress" :key="item.message">
        {{ `${item.message}: ${item.completed}/${item.total}` }}
      </div>
    </template>
    <template #icon>
      <!-- https://uiverse.io/Galahhad/cold-yak-10 -->
      <div class="ui-abstergo">
        <div class="abstergo-loader">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </template>
    <n-form class="form" labn-placement="top" style="margin-top: 30px">
      <slot></slot>
    </n-form>
  </n-spin>
  <n-data-table
    v-show="data.length > 0"
    style="margin-top: 20px"
    :columns="columns"
    :data="data"
    striped />
</template>

<script lang="ts" setup>
import {ViewType} from "@lark-base-open/js-sdk"
import {DataTableColumns, NTag} from "naive-ui"

import {LogRowData, LogType, Track} from "@/types"
import {fieldMaps, Progress} from "@/utils"

const router = useRouter()
const {t} = useI18n()
const columns: DataTableColumns<LogRowData> = [
  {
    "type": "selection"
  },
  {
    "title": "Type",
    "key": "type",
    render(row) {
      return h(
        NTag,
        {
          "type": row.type,
          "bordered": false
        },
        {
          "default": () => row.type
        }
      )
    }
  },
  {
    "title": "Log",
    "key": "log"
  }
]
// 错误日志等信息，等后续UI模块完善，再实现右键选中错误的单元格，方便查找问题
const data = ref<LogRowData[]>([])
const lock = ref(true)
const message = ref("")
const progress = ref<Progress[]>([])
const route = useRoute()

function _log(type: LogType, log: string, track?: Track) {
  data.value.push({
    type,
    log,
    track
  })
}

async function getField(tableId: string, table?: ITable) {
  update(true, t("Update field data"))
  if (!table) {
    table = await bitable.base.getTableById(tableId)
  }
  const fieldMetaList = await table.getFieldMetaList()
  const fieldMap = fieldMaps(fieldMetaList)
  update(false)
  return {fieldMetaList, fieldMap, table}
}

async function getViewField(tableId: string, viewId: string, table?: ITable) {
  update(true, t("Update field data"))
  if (!table) {
    table = await bitable.base.getTableById(tableId)
  }
  const view = await table.getViewById(viewId)
  const fieldMetaList = await view.getFieldMetaList()
  const fieldMap = fieldMaps(fieldMetaList)
  update(false)
  return {fieldMap, fieldMetaList, view, table}
}

async function getView(tableId: string, table?: ITable) {
  update(true, t("Update view data"))
  if (!table) {
    table = await bitable.base.getTableById(tableId)
  }
  const views = await table.getViewMetaList()
  const viewMetaList = views.filter(item => item.type === base.ViewType.Grid)
  let viewId = undefined
  if (viewMetaList.length > 0) {
    viewId = viewMetaList[0].id
  }
  return {"viewId": viewId, viewMetaList, table, views}
}

async function getTable() {
  update(true, t("initializing"))
  const [tableMetaList, selection] = await Promise.all([
    bitable.base.getTableMetaList(),
    bitable.base.getSelection()
  ])
  const table = await bitable.base.getTableById(selection.tableId!)
  return {...selection, tableMetaList, table}
}

async function getRecords(
  table: ITable,
  f: (val: {records: IGetRecordsResponse; pr: Progress}) => Promise<any>,
  all = false,
  pageSize = 1000,
  viewId = ""
) {
  let records: IGetRecordsResponse = {
    "total": 0,
    "hasMore": true,
    "records": []
  }
  let promise: any[] = []
  const pr = spin(t("Record"), 0)
  if (all) {
    while (records.hasMore) {
      records = await table.getRecords({
        pageSize,
        "pageToken": records.pageToken
      })
      if (pr.total === 0) {
        pr.addTotal(records.total)
      }
      promise.push(f({records, pr}))
    }
  } else {
    if (!viewId) {
      const selection = await bitable.base.getSelection()
      if (selection.viewId && selection.tableId === table.id) {
        viewId = selection.viewId
      } else {
        const views = (await table.getViewMetaList()).filter(item => item.type === ViewType.Grid)
        viewId = views[0].id
      }
    }
    const recordIdList = await bitable.ui.selectRecordIdList(table.id, viewId)
    pr.addTotal(recordIdList.length)
    promise = recordIdList.map(async item => {
      const record = await table.getRecordById(item)
      return f({
        "records": {
          "total": 0,
          "hasMore": false,
          "records": [{"recordId": item, "fields": record.fields}]
        },
        pr
      })
    })
  }
  await Promise.all(promise)
}

// 更新加载状态
const update = (lk: boolean, text = "") => {
  message.value = text
  lock.value = lk
}

// 清楚加载状态
const finish = () => {
  progress.value = []
  lock.value = false
}

// 日志初始化
const init = () => {
  data.value = []
}

// 新建一个加载进度
const spin = (message: string, n = 0) => {
  lock.value = true
  const p = reactive(new Progress(message, n))
  progress.value.push(p)
  return p
}

defineExpose({
  update,
  finish,
  init,
  spin,
  getViewField,
  getView,
  getField,
  getTable,
  getRecords,
  // 日志记录
  "send": (log: string, track?: Track) => {
    _log(LogType.Default, log, track)
  },
  "primary": (log: string, track?: Track) => {
    _log(LogType.Primary, log, track)
  },
  "info": (log: string, track?: Track) => {
    _log(LogType.Info, log, track)
  },
  "success": (log: string, track?: Track) => {
    _log(LogType.Success, log, track)
  },
  "warning": (log: string, track?: Track) => {
    _log(LogType.Warning, log, track)
  },
  "error": (log: string, track?: Track) => {
    _log(LogType.Error, log, track)
  }
})
onMounted(() => {
  window.$message = useMessage()
})
</script>

<style lang="scss" scoped>
.n-h4 {
  display: flex;
  align-items: center;
  span {
    margin-right: 8px;
  }
}
.layout-spin > :deep(.n-spin-body) > .n-spin {
  height: auto;
  margin-bottom: 20px;
  display: block;
  &.n-spin--rotate {
    animation: none;
  }
}
.ui-abstergo {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 30px;
  scale: 1;
}

@mixin animation-style($rotate, $animation) {
  rotate: $rotate;
  -webkit-animation: $animation 1.2s linear infinite alternate;
  animation: $animation 1.2s linear infinite alternate;
}
.abstergo-loader {
  width: 103px;
  height: 90px;
  position: relative;
  div {
    width: 50px;
    border-right: 12px solid transparent;
    border-left: 12px solid transparent;
    border-top: 21px solid var(--n-color);
    position: absolute;
    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.3));
    &:nth-child(1) {
      @include animation-style(-60deg, line1);
      top: 27px;
      left: 7px;
    }
    &:nth-child(2) {
      @include animation-style(180deg, line2);
      bottom: 2px;
      left: 0;
    }
    &:nth-child(3) {
      @include animation-style(60deg, line3);
      bottom: 16px;
      right: -9px;
    }
  }
}

@keyframes line1 {
  0%,
  40% {
    top: 27px;
    left: 7px;
    rotate: -60deg;
  }
  60%,
  100% {
    top: 22px;
    left: 14px;
    rotate: 60deg;
  }
}

@keyframes line2 {
  0%,
  40% {
    bottom: 2px;
    left: 0;
    rotate: 180deg;
  }
  60%,
  100% {
    bottom: 5px;
    left: -8px;
    rotate: 300deg;
  }
}

@keyframes line3 {
  0%,
  40% {
    bottom: 16px;
    right: -9px;
    rotate: 60deg;
  }
  60%,
  100% {
    bottom: 7px;
    right: -11px;
    rotate: 180deg;
  }
}
</style>
