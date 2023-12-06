<script lang="ts" setup>
import type { DropdownOption } from 'naive-ui'

import { ThemeModeType, ToastType, bitable } from '@lark-base-open/js-sdk'
import { useI18n } from 'vue-i18n'
import { type RouteNamedMap, routes as _routes } from 'vue-router/auto/routes'
import { useClipboard } from '@vueuse/core'
import { getRoutes } from '@/utils'

defineEmits(['update:theme'])
const { copy } = useClipboard()
const { locale } = useI18n()
const router = useRouter()
const routes = [{ name: 'home' }, ...getRoutes(_routes)]
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
      void bitable.ui.showToast({
        message: 'hello world',
        toastType: ToastType.info,
      })
    },
    label: 'showToast',
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
  <n-popover
    placement="left-start"
    trigger="click"
  >
    <template #trigger>
      <n-button
        class="popover-button"
        size="small"
        type="info"
        style="width: auto"
      >
        DevTool
      </n-button>
    </template>
    <n-space
      vertical
      align="center"
    >
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
      <n-dropdown
        trigger="click"
        :options="apis"
        key-field="label"
        @select="
          (_: string, option: DropdownOption) => {
            if (typeof option.f === 'function') {
              option.f()
            }
          }
        "
      >
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
