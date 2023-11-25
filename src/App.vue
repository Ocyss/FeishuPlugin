<template>
  <n-config-provider
    class="main"
    :theme="themes"
    :theme-overrides="
      themes === null ? lightThemeOverrides : darkThemeOverrides
    "
  >
    <n-message-provider>
      <DevTool
        @update:theme="
          (v) => {
            themes = v ? darkTheme : null;
          }
        "
      />
      <RouterView />
    </n-message-provider>
    <n-global-style />
  </n-config-provider>
</template>

<script lang="ts" setup>
import DevTool from "@/components/DevTool.vue";
import { NConfigProvider, darkTheme } from "naive-ui";
import type { GlobalTheme, GlobalThemeOverrides } from "naive-ui";
import { ThemeModeType, Language } from "@lark-base-open/js-sdk";

const props = defineProps<{ lang: Language; theme: ThemeModeType }>();
const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    bodyColor: "#1a1a1a",
  },
};
const lightThemeOverrides: GlobalThemeOverrides = {};
const themes = ref<GlobalTheme | null>(
  props.theme === ThemeModeType.DARK ? darkTheme : null
);
</script>

<style>
#app {
  padding: 0.75rem;
  box-sizing: border-box;
  min-height: 100vh;
}

*::-webkit-scrollbar {
  display: none;
}
.n-dropdown-menu {
  user-select: none;
}
.n-popover__content {
  white-space: pre-line;
  user-select: none;
  width: 150px;
}
</style>

<style scoped>
* {
  user-select: none;
}
</style>
