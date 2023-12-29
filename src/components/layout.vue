<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NTag } from 'naive-ui'
import { LogType } from '@/types'
import type { LogRowData } from '@/types'
import { Progress } from '@/utils'
import { useInfo } from '@/hooks/useInfo'
import { tKey } from '@/keys'

const t = inject(tKey, () => useI18n().t, true)
const columns: DataTableColumns<LogRowData> = [
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
    width: 75,
  },
  {
    key: 'recordId',
    resizable: true,
    title: 'RecordId',
  },
  {
    key: 'log',
    resizable: true,
    title: 'Log',
  },
]
const form = ref()
const lock = ref(true)
const permission = ref(true)
const spinMsg = ref('')
const message = useMessage()
const progress = ref<Progress[]>([])
const { app } = useInfo()

// 错误日志等信息，等后续UI模块完善，再实现右键选中错误的单元格，方便查找问题
const data = ref<LogRowData[]>([])

function rowProps(row: LogRowData) {
  return {
    onClick: () => {
      message.info(`选择单元格${row.recordId}~ (待api完善)`)
    },
    style: 'cursor: pointer;',
  }
}
let createView: (data: LogRowData[]) => any = () => {
  message.error('未定义')
}

function upCreateView(val: (data: LogRowData[]) => any) {
  createView = val
}

function _log(type: LogType, log: string, track?: Track) {
  data.value.push({
    log,
    ...track,
    type,
  })
}

// 更新加载状态
function update(lk: boolean, text = '') {
  spinMsg.value = text
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
function spin(spinMsg: string, n = 0) {
  lock.value = true
  const p = reactive(new Progress(spinMsg, n))
  progress.value.push(p)
  return p
}

function getTablePermission(tableId: string) {
  bitable.base.getPermission({
    entity: base.PermissionEntity.Table,
    param: {
      tableId,
    },
    type: base.OperationType.Editable,
  }).then((e) => {
    permission.value = e
  })
}

onMounted(async () => {
  window.$message = message
})

defineExpose({
  error: (log: string, track?: Track) => {
    _log(LogType.Error, log, track)
  },
  finish,
  form,
  getTablePermission,
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
  upCreateView,
  update,
  warning: (log: string, track?: Track) => {
    _log(LogType.Warning, log, track)
  },
})
</script>

<template>
  <n-alert v-if="!permission" :title="t('Permissions')" type="error" style="margin-bottom: 15px;" closable>
    {{ t('You currently do not have permission to this data table, please consider whether to create a copy for use') }}
  </n-alert>
  <n-collapse v-if="app.help" style="margin-bottom: 15px;">
    <n-collapse-item
      :title="t('Help')"
      name="1"
    >
      <n-blockquote
        align-text
        v-html="t(app.help as string)"
      />
    </n-collapse-item>
  </n-collapse>
  <n-spin
    :show="lock"
    class="layout-spin"
  >
    <template #description>
      <div v-if="progress.reduce((sum, e) => sum + e.total, 0) === 0">
        {{ spinMsg }}
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
      ref="form"
      class="form"
      labn-placement="top"
      style="position: relative;"
    >
      <slot />
    </n-form>
  </n-spin>
  <n-data-table
    v-if="data.length > 0"
    style="margin-top: 20px;height: 350px;"
    :columns="columns"
    :data="data"
    flex-height
    :row-props="rowProps"
  />
  <form-start v-if="data.length > 0" style="margin-top: 15px;" no-handle :buttons="[['清空全部', init], ['创建视图', () => createView(data)]]" />
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
