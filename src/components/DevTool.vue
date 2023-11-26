<template>
  <n-popover placement="left-start" :show="show">
    <template #trigger>
      <n-button
        class="popover-button"
        size="small"
        type="info"
        style="width: auto"
        @click="show = !show"
      >
        DevTool
      </n-button>
    </template>
    <n-space vertical align="center">
      <n-h4 prefix="bar">开发工具</n-h4>
      <!-- <n-ellipsis>userId:{{ state.bridge.userId }}</n-ellipsis> -->
      <!-- <n-ellipsis>theme:{{ state.bridge.theme }}</n-ellipsis> -->
      <!-- <n-ellipsis>locale:{{ state.bridge.locale }}</n-ellipsis> -->
      <!-- <n-ellipsis>lang:{{ state.bridge.lang }}</n-ellipsis> -->
      <!-- <n-ellipsis>tenantKey:{{ state.bridge.tenantKey }}</n-ellipsis> -->
      <n-dropdown
        trigger="click"
        :options="routes as DropdownOption[]"
        @select="(path:keyof RouteNamedMap)=>router.push({ name: path })"
        key-field="name"
        label-field="name"
      >
        <n-button>路由跳转</n-button>
      </n-dropdown>
      <n-dropdown
        trigger="click"
        :options="apis"
        @select="(_:string,option:DropdownOption)=>{
          if (typeof option.f=== 'function'){option.f()}
          }"
        key-field="label"
      >
        <n-button>Api测试</n-button>
      </n-dropdown>
      <n-dropdown
        trigger="click"
        :options="themes"
        @select="(key:number)=>{
          state.theme = key===1?'浅色' : '深色';$emit('update:theme', key===1)}"
      >
        <n-button>主题切换({{ state.theme }})</n-button>
      </n-dropdown>
      <n-dropdown
        trigger="click"
        :options="lang"
        @select="(v:any) => {state.lang = v; locale = v}"
        key-field="label"
      >
        <n-button>语言切换({{ state.lang }})</n-button>
      </n-dropdown>
    </n-space>
  </n-popover>
</template>

<script lang="ts" setup>
import { getRoutes } from "@/utils";
import { bitable, ThemeModeType } from "@lark-base-open/js-sdk";
import type { DropdownOption } from "naive-ui";
import { useI18n } from "vue-i18n";
import { routes as _routes, RouteNamedMap } from "vue-router/auto/routes";
const { locale } = useI18n();
const router = useRouter();
const show = ref(false);
const routes = [{ name: "home" }, ...getRoutes(_routes)];

const apis: DropdownOption[] = [
  {
    label: "alert",
    f: () => {
      alert("Test!");
    },
  },
  //   {
  //     label: "showToast",
  //     f: () => {
  //       bitable.ui.showToast({
  //         toastType: ToastType.info,
  //         message: "hello world",
  //       });
  //     },
  //   },
];
const state = reactive({
  theme: "",
  lang: "",
  bridge: {
    userId: "",
    theme: "",
    lang: "",
    locale: "",
    tenantKey: "",
  },
});
const themes = ref<DropdownOption[]>([
  { label: state.bridge.theme, disabled: true },
  { label: "浅色", key: 0 },
  { label: "深色", key: 1 },
]);

const lang = ref<DropdownOption[]>([
  { label: state.bridge.lang, disabled: true },
  { label: state.bridge.locale, disabled: true },
  { label: "zh" },
  { label: "en" },
  { label: "jp" },
]);

onMounted(() => {
  bitable.bridge.getTheme().then((theme) => {
    state.theme = theme === ThemeModeType.LIGHT ? "浅色" : "深色";
    state.bridge.theme = theme;
    themes.value[0].label = theme;
  });
  bitable.bridge.getLanguage().then((language) => {
    state.lang = language;
    state.bridge.lang = language;
    lang.value[0].label = language;
  });
  bitable.bridge.getUserId().then((userId) => {
    state.bridge.userId = userId;
  });
  bitable.bridge.getLocale().then((locale) => {
    state.bridge.locale = locale;
    lang.value[1].label = locale;
  });
  bitable.bridge.getTenantKey().then((tenantKey) => {
    state.bridge.tenantKey = tenantKey;
  });
});
</script>

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
