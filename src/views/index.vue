<template>
  <div style="padding: 6px 20px">
    <n-h2 prefix="bar" align-text>
      <n-text type="primary">Ocyss_04 的插件库</n-text>
    </n-h2>
  </div>
  <n-list hoverable bordered clickable style="--n-color: none">
    <n-list-item v-for="route in routes" @click="router.push(route.path)">
      <n-thing>
        <template #header>
          <n-h3 style="margin-bottom: 3px">{{ t(route.name as string) }}</n-h3>
        </template>
        <template v-if="route.meta?.avatar" #avatar>
          <n-avatar>
            <n-icon size="28" v-html="route.meta?.avatar" />
          </n-avatar>
        </template>
        <template #description>
          <n-space size="small" style="margin-top: 4px">
            <n-tag
              v-for="tag in route.meta?.tags"
              :bordered="false"
              type="info"
              size="small"
            >
              {{ t(tag) }}
            </n-tag>
          </n-space>
        </template>
        {{ t(route.meta?.desc as string) }}
      </n-thing>
    </n-list-item>
  </n-list>
</template>

<script lang="ts" setup>
import { routes as _routes } from "vue-router/auto/routes";
const { t } = useI18n();
const router = useRouter();

const routes = _routes
  .filter((v) => v.path !== "/")
  .map((v) => {
    const index = v.children![0];
    index.path = v.path;
    return index;
  });
</script>

<style lang="scss" scoped></style>
