import { createApp } from "vue";
import App from "./App.vue";
import { createI18n } from "vue-i18n";
import { bitable } from "@lark-base-open/js-sdk";
import zh from "@/locales/zh.json";
import {
  createWebHistory,
  createRouter,
  setupDataFetchingGuard,
} from "vue-router/auto";

const router = createRouter({
  history: createWebHistory(),
});

setupDataFetchingGuard(router);

const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  legacy: false,
  allowComposition: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  formatFallbackMessages: true,
  messages: {
    en: {},
    zh,
    "zh-TW": {},
    "zh-HK": {},
    ja: {},
    fr: {},
    hi: {},
    id: {},
    it: {},
    ko: {},
    pt: {},
    ru: {},
    th: {},
    vi: {},
    de: {},
    es: {},
  },
});

const lang = await bitable.bridge.getLanguage();
const theme = await bitable.bridge.getTheme();
i18n.global.locale.value = lang;

const app = createApp(App, { lang, theme });

app.use(router).use(i18n).mount("#app");
