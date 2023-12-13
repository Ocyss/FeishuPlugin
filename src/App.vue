<script lang="ts" setup>
import type { Language } from '@lark-base-open/js-sdk'
import { ThemeModeType } from '@lark-base-open/js-sdk'
import type { GlobalTheme, GlobalThemeOverrides, NDateLocale, NLocale } from 'naive-ui'
import { darkTheme, dateEnUS, dateZhCN, enUS,	zhCN } from 'naive-ui'
import DevTool from '@/components/DevTool.vue'

const { t } = useI18n()
const darkThemeOverrides: GlobalThemeOverrides = {
  List: {
    color: '#1a1a1a',
  },
  common: {
    bodyColor: '#1a1a1a',
    primaryColor: '#4C88FF',
  },
}

const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#4C88FF',
  },
}
const themes = ref<GlobalTheme | null>(darkTheme)
const locale = ref<[NLocale, NDateLocale]>([enUS, dateEnUS])
const localeMaps: Partial<Record<Language, [NLocale, NDateLocale]>> = {
  en: [enUS, dateEnUS],
  zh: [zhCN, dateZhCN],
}

bitable.bridge.getTheme().then((theme) => {
  themes.value = theme === ThemeModeType.DARK ? darkTheme : null
})

bitable.bridge.getLanguage().then((language) => {
  if (language in localeMaps)
    locale.value = localeMaps[language]!
})

onMounted(() => {
  console.log(
`    ______     _      __          ____  __            _     \n`,
'   / ____/__  (_)____/ /_  __  __/ __ \\/ /_  ______ _(_)___ \n',
'  / /_  / _ \\/ / ___/ __ \\/ / / / /_/ / / / / / __ `/ / __ \\\n',
' / __/ /  __/ (__  ) / / / /_/ / ____/ / /_/ / /_/ / / / / /\n',
'/_/    \\___/_/____/_/ /_/\\__,_/_/   /_/\\__,_/\\__, /_/_/ /_/ \n',
'                                            /____/          \n',
'Url: https://github.com/Ocyss/FeishuPlugin \n',
'Author: Ocyss_04 <feishu@ocyss.icu>',
  )

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
  <n-config-provider
    :theme="themes"
    :theme-overrides="themes === null ? lightThemeOverrides : darkThemeOverrides"
    :locale="locale[0]" :date-locale="locale[1]"
  >
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <DevTool
            @update:theme="
              v => {
                themes = v ? darkTheme : null
              }
            "
          />
          <RouterView />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
    <n-global-style />
  </n-config-provider>
</template>

<style>
#app {
  padding: 0.75rem;
  box-sizing: border-box;
  min-height: 100vh;
}

body{
  font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Tahoma,PingFang SC,Microsoft Yahei,Arial,Hiragino Sans GB,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;
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
