import { bitable } from '@lark-base-open/js-sdk'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import {
  createRouter,
  createWebHashHistory,
} from 'vue-router/auto'
import App from '@/App.vue'
import zh from '@/locales/zh.json'
import en from '@/locales/en.json'

const router = createRouter({
  history: createWebHashHistory(),
})

const i18n = createI18n({
  allowComposition: true,
  fallbackLocale: 'en',
  fallbackWarn: false,
  formatFallbackMessages: true,
  legacy: false,
  locale: 'zh',
  messages: {
    'id': {},
    'de': {},
    en,
    'es': {},
    'fr': {},
    'hi': {},
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
  missingWarn: false,
  silentFallbackWarn: true,
  silentTranslationWarn: true,
})

bitable.bridge.getLanguage().then((language) => {
  i18n.global.locale.value = language
})

const app = createApp(App)

app.use(router).use(i18n)

app.config.errorHandler = (err, vm, info) => {
  console.error(err, vm, info)
}

app.mount('#app')
