<script lang="ts" setup>
import { ThemeModeType } from '@lark-base-open/js-sdk'
import type { GlobalTheme, GlobalThemeOverrides } from 'naive-ui'
import { NConfigProvider, darkTheme } from 'naive-ui'
import DevTool from '@/components/DevTool.vue'

const { t } = useI18n()
const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    bodyColor: '#1a1a1a',
    primaryColor: '#1E90FF',
  },
}

const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1E90FF',
  },
}
const themes = ref<GlobalTheme | null>(darkTheme)

void bitable.bridge.getTheme().then((theme) => {
  themes.value = theme === ThemeModeType.DARK ? darkTheme : null
})

onMounted(() => {
  window.$t = t
  const themeOff = bitable.bridge.onThemeChange((event) => {
    themes.value = event.data.theme === ThemeModeType.DARK ? darkTheme : null
  })
  onBeforeUnmount(() => {
    themeOff()
  })
})
</script>

<template>
  <NConfigProvider
    class="main"
    :theme="themes"
    :theme-overrides="themes === null ? lightThemeOverrides : darkThemeOverrides"
  >
    <n-message-provider>
      <n-dialog-provider>
        <DevTool
          @update:theme="
            v => {
              themes = v ? darkTheme : null
            }
          "
        />
        <RouterView />
      </n-dialog-provider>
    </n-message-provider>
    <n-global-style />
  </NConfigProvider>
</template>

<style>
#app {
  padding: 0.75rem;
  box-sizing: border-box;
  min-height: 100vh;
}

* {
    font-family: "PingFang SC";
}

*::-webkit-scrollbar {
  display: none;
}
a {
  color: var(--n-text-color);
}

.n-dropdown-menu {
  user-select: none;
}
.n-popover__content {
  white-space: pre-line;
  user-select: none;
  width: 150px;
}
.n-dialog .n-dialog__content {
  white-space: pre-line;
}

img{
  -webkit-user-drag: none;
}
</style>

<style scoped>
* {
  user-select: none;
}
</style>
