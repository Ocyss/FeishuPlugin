import { bitable } from "@lark-base-open/js-sdk"
import { createApp } from "vue"
import { createI18n } from "vue-i18n"
import {
  createRouter,
  createWebHashHistory,
  setupDataFetchingGuard
} from "vue-router/auto"

import zh from "@/locales/zh.json"

import App from "./App.vue"

const router = createRouter({
  "history": createWebHashHistory()
})

setupDataFetchingGuard(router)

const i18n = createI18n({
  "locale": "en",
  "fallbackLocale": "en",
  "legacy": false,
  "allowComposition": true,
  "silentTranslationWarn": true,
  "silentFallbackWarn": true,
  "formatFallbackMessages": true,
  "messages": {
    "en": {},
    zh,
    "zh-TW": {},
    "zh-HK": {},
    "ja": {},
    "fr": {},
    "hi": {},
    "id": {},
    "it": {},
    "ko": {},
    "pt": {},
    "ru": {},
    "th": {},
    "vi": {},
    "de": {},
    "es": {}
  }
})

const lang = await bitable.bridge.getLanguage()
const theme = await bitable.bridge.getTheme()
i18n.global.locale.value = lang

const app = createApp(App, { lang, theme })

app.use(router).use(i18n).mount("#app")
