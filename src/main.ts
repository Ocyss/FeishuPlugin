import { bitable } from '@lark-base-open/js-sdk'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import {
  createRouter,
  createWebHashHistory,
  setupDataFetchingGuard,
} from 'vue-router/auto'

import App from '@/App.vue'
import zh from '@/locales/zh.json'

const router = createRouter({
  history: createWebHashHistory(),
})

setupDataFetchingGuard(router)

const i18n = createI18n({
  allowComposition: true,
  fallbackLocale: 'en',
  formatFallbackMessages: true,
  legacy: false,
  locale: 'en',
  messages: {
    'de': {},
    'en': {},
    'es': {},
    'fr': {},
    'hi': {},
    'id': {},
    'it': {},
    'ja': {},
    'ko': {},
    'pt': {},
    'ru': {},
    'th': {},
    'vi': {},
    zh,
    'zh-HK': {},
    'zh-TW': {},
  },
  silentFallbackWarn: true,
  silentTranslationWarn: true,
})

bitable.bridge.getLanguage().then((language) => {
  i18n.global.locale.value = language
})

const app = createApp(App)

app.use(router).use(i18n).mount('#app')
