<script lang="ts" setup>
import type { DropdownOption } from 'naive-ui'

import { ThemeModeType, bitable } from '@lark-base-open/js-sdk'
import { useI18n } from 'vue-i18n'
import { type RouteNamedMap, routes as _routes } from 'vue-router/auto/routes'
import { useClipboard } from '@vueuse/core'
import { getRoutes } from '@/utils'
import { eventBucket } from '@/hooks/useData'

defineEmits(['update:theme'])
const message = useMessage()
const dialog = useDialog()
const { copy } = useClipboard()
const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const routes = [
  { name: 'home' },
  ...getRoutes(_routes),
]
const apis: DropdownOption[] = [
  {
    f: () => {
      void copy(window.location.href)
    },
    label: 'copy url',
  },
  {
    f: () => {
      location.reload()
    },
    label: 'location.reload',
  },
  {
    f: () => {
      console.log(toRaw(route))
    },
    label: 'printRoute',
  },
  {
    f: () => {
      console.log(toRaw(_routes))
    },
    label: 'printRoutes',
  },
  {
    f: async () => {
      const selection = await bitable.base.getSelection()
      if (!selection.tableId || !selection.recordId)
        return
      const table = await bitable.base.getTableById(selection.tableId)
      console.log(await table.getRecordById(selection.recordId))
    },
    label: 'PrintRecord',
  },
  {
    f: () => {
      const d = dialog.warning({
        content: '将删除除了焦点外的全部数据表\nAll data tables except the focus will be deleted',
        negativeText: '取消/Cancel',
        onPositiveClick: async () => {
          d.loading = true
          const [
            tableMetaList,
            selection,
          ] = await Promise.all([
            bitable.base.getTableMetaList(),
            bitable.base.getSelection(),
          ])
          if (!selection.tableId) {
            d.loading = false
            message.error('未有选中表')
            return
          }
          await Promise.all(tableMetaList.map(async (tableMeta) => {
            if (tableMeta.id !== selection.tableId)
              await bitable.base.deleteTable(tableMeta.id)
          }))
          d.destroy()
        },
        positiveText: '确定/Sure',
        title: '危险/Danger',
      })
    },
    label: '删除其他表（Danger!）',
  },
]

const state = reactive({
  bridge: {
    lang: '',
    locale: '',
    tenantKey: '',
    theme: '',
    userId: '',
  },
  lang: '',
  theme: '',
})
const themes = ref<DropdownOption[]>([
  { disabled: true, label: state.bridge.theme },
  { key: 0, label: '浅色' },
  { key: 1, label: '深色' },
])

const lang = ref<DropdownOption[]>([
  { disabled: true, label: state.bridge.lang },
  { disabled: true, label: state.bridge.locale },
  { label: 'zh' },
  { label: 'en' },
  { label: 'jp' },
])

const storeConf: DropdownOption[] = [
  {
    f: () => {
      message.warning('配置导入 未实现')
    },
    label: '配置导入',
  },
  {
    f: () => {
      message.warning('配置导出 未实现')
    },
    label: '配置导出',
  },
  {
    f: () => {
      localStorage.clear()
      message.success('存储清空成功')
    },
    label: '存储清空',
  },
]

function clickRun(_: string, option: DropdownOption) {
  if (typeof option.f === 'function')
    option.f()
}
onMounted(() => {
  void bitable.bridge.getTheme().then((theme) => {
    state.theme = theme === ThemeModeType.LIGHT ? '浅色' : '深色'
    state.bridge.theme = theme
    themes.value[0].label = theme
  })
  void bitable.bridge.getLanguage().then((language) => {
    state.lang = language
    state.bridge.lang = language
    lang.value[0].label = language
  })
  void bitable.bridge.getUserId().then((userId) => {
    state.bridge.userId = userId
  })
  void bitable.bridge.getLocale().then((locale) => {
    state.bridge.locale = locale
    lang.value[1].label = locale
  })
  void bitable.bridge.getTenantKey().then((tenantKey) => {
    state.bridge.tenantKey = tenantKey
  })
})
</script>

<template>
  <n-popover placement="left-start" trigger="click">
    <template #trigger>
      <n-button class="popover-button" size="small" type="info" style="width: auto">
        DevTool
      </n-button>
    </template>
    <n-space vertical align="center">
      <n-h4 prefix="bar">
        开发工具
      </n-h4>
      <!-- <n-ellipsis>userId:{{ state.bridge.userId }}</n-ellipsis> -->
      <!-- <n-ellipsis>theme:{{ state.bridge.theme }}</n-ellipsis> -->
      <!-- <n-ellipsis>locale:{{ state.bridge.locale }}</n-ellipsis> -->
      <!-- <n-ellipsis>lang:{{ state.bridge.lang }}</n-ellipsis> -->
      <!-- <n-ellipsis>tenantKey:{{ state.bridge.tenantKey }}</n-ellipsis> -->
      <n-dropdown
        trigger="click"
        :options="routes as DropdownOption[]"
        key-field="name"
        label-field="name"
        @select="(path: keyof RouteNamedMap) => router.push({ name: path })"
      >
        <n-button>路由跳转</n-button>
      </n-dropdown>
      <n-dropdown trigger="click" :options="apis" key-field="label" @select="clickRun">
        <n-button>Api测试</n-button>
      </n-dropdown>
      <n-dropdown
        trigger="click"
        :options="themes"
        @select="
          (key: number) => {
            state.theme = key === 1 ? '浅色' : '深色'
            $emit('update:theme', key === 1)
          }
        "
      >
        <n-button>主题切换({{ state.theme }})</n-button>
      </n-dropdown>
      <n-dropdown
        trigger="click"
        :options="lang"
        key-field="label"
        @select="
          (v: any) => {
            state.lang = v
            locale = v
          }
        "
      >
        <n-button>语言切换({{ state.lang }})</n-button>
      </n-dropdown>
      <n-dropdown trigger="click" :options="storeConf" key-field="label" @select="clickRun">
        <n-button>存储配置</n-button>
      </n-dropdown>
      <n-button @click="() => eventBucket.clear()">
        清空监听({{ eventBucket.length }})
      </n-button>
    </n-space>
  </n-popover>
</template>

<style lang="scss" scoped>
.popover-button {
  position: fixed;
  right: -65px;
}
.n-space {
  width: 150px;
  :deep(> div) {
    width: 100%;
  }
}
.n-button {
  width: 100%;
}
</style>
