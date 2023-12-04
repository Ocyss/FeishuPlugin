<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NTag } from 'naive-ui'
import { LogType } from '@/types'
import type { LogRowData } from '@/types'
import { Progress } from '@/utils'

const { t } = useI18n()
const columns: DataTableColumns<LogRowData> = [
  {
    type: 'selection',
  },
  {
    key: 'type',
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          type: row.type,
        },
        {
          default: () => row.type,
        },
      )
    },
    title: 'Type',
  },
  {
    key: 'log',
    title: 'Log',
  },
]
// 错误日志等信息，等后续UI模块完善，再实现右键选中错误的单元格，方便查找问题
const data = ref<LogRowData[]>([])
const lock = ref(true)
const message = ref('')
const progress = ref<Progress[]>([])
const route = useRoute()

function _log(type: LogType, log: string, track?: Track) {
  data.value.push({
    log,
    track,
    type,
  })
}

async function getRecords(
  table: ITable,
  f: (val: { pr: Progress, records: IGetRecordsResponse }) => Promise<any>,
  all = false,
  pageSize = 1000,
  viewId = '',
) {
  let records: IGetRecordsResponse = {
    hasMore: true,
    records: [],
    total: 0,
  }
  let promise: any[] = []
  const pr = spin(t('Record'), 0)
  if (all) {
    while (records.hasMore) {
      records = await table.getRecords({
        pageSize,
        pageToken: records.pageToken,
      })
      if (pr.total === 0)
        pr.addTotal(records.total)

      promise.push(f({ pr, records }))
    }
  }
  else {
    if (!viewId) {
      const selection = await bitable.base.getSelection()
      if (selection.viewId && selection.tableId === table.id) {
        viewId = selection.viewId
      }
      else {
        const views = (await table.getViewMetaList()).filter(item => item.type === ViewType.Grid)
        viewId = views[0].id
      }
    }

    const recordIdList = await bitable.ui.selectRecordIdList(table.id, viewId)
    pr.addTotal(recordIdList.length)
    promise = recordIdList.map(async (item) => {
      const record = await table.getRecordById(item)
      return f({
        pr,
        records: {
          hasMore: false,
          records: [{ fields: record.fields, recordId: item }],
          total: 0,
        },
      })
    })
  }
  await Promise.all(promise)
}

// 更新加载状态
function update(lk: boolean, text = '') {
  message.value = text
  lock.value = lk
}

// 清楚加载状态
function finish() {
  progress.value = []
  lock.value = false
}

// 日志初始化
function init() {
  data.value = []
}

// 新建一个加载进度
function spin(message: string, n = 0) {
  lock.value = true
  const p = reactive(new Progress(message, n))
  progress.value.push(p)
  return p
}

defineExpose({
  error: (log: string, track?: Track) => {
    _log(LogType.Error, log, track)
  },
  finish,
  getRecords,
  info: (log: string, track?: Track) => {
    _log(LogType.Info, log, track)
  },
  init,
  primary: (log: string, track?: Track) => {
    _log(LogType.Primary, log, track)
  },
  // 日志记录
  send: (log: string, track?: Track) => {
    _log(LogType.Default, log, track)
  },
  spin,
  success: (log: string, track?: Track) => {
    _log(LogType.Success, log, track)
  },
  update,
  warning: (log: string, track?: Track) => {
    _log(LogType.Warning, log, track)
  },
})
onMounted(() => {
  window.$message = useMessage()
})
</script>

<template>
  <n-collapse v-if="route.meta.help" style="margin-bottom: 15px;">
    <n-collapse-item
      :title="t('Help')"
      name="1"
    >
      <n-blockquote
        align-text
        v-html="t(route.meta.help as string)"
      />
    </n-collapse-item>
  </n-collapse>
  <n-spin
    :show="lock"
    class="layout-spin"
  >
    <template #description>
      <div v-if="progress.length === 0">
        {{ message }}
      </div>
      <div
        v-for="item in progress"
        v-else
        :key="item.message"
      >
        {{ `${item.message}: ${item.completed}/${item.total}` }}
      </div>
    </template>
    <template #icon>
      <!-- https://uiverse.io/Galahhad/cold-yak-10 -->
      <div class="ui-abstergo">
        <div class="abstergo-loader">
          <div />
          <div />
          <div />
        </div>
      </div>
    </template>
    <n-form
      class="form"
      labn-placement="top"
    >
      <slot />
    </n-form>
  </n-spin>
  <n-data-table
    v-show="data.length > 0"
    style="margin-top: 20px"
    :columns="columns"
    :data="data"
    striped
  />
</template>

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
