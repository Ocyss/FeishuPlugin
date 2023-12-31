<route lang="yaml">
path: /home
name: home
</route>

<script lang="ts" setup>
import type { RouteRecordRaw } from 'vue-router/auto'
import type { RouteNamedMap } from 'vue-router/auto/routes'
import { routes as _routes } from 'vue-router/auto/routes'
import { isArray, isString } from 'lodash-es'
import { getRoutes } from '@/utils'

const { t } = useI18n()
const router = useRouter()
const search = ref('')
const routes = getRoutes(_routes)
const tag = ref('all')
const tags = ref(new Set(['all']))

function shouldDisplay(route: RouteRecordRaw) {
  const containsString = (text: string | unknown) => {
    return (
      text && typeof text === 'string' && text.toLowerCase().includes(search.value.toLowerCase())
    )
  }
  const { desc, tags, title } = route.meta || {}
  if (isString(desc) && isString(title) && isArray(tags)) {
    const searchMatches = !search.value || containsString(t(title)) || containsString(t(desc))
    const tagMatches = tag.value === 'all' || (Array.isArray(tags) && tags.includes(tag.value))
    return searchMatches && tagMatches
  }
  return false
}

function highlightSearch(s: string) {
  if (!search.value)
    return s

  const regex = new RegExp(search.value, 'gi')
  return s.replace(regex, '<span class="highlighted">$&</span>')
}

onMounted(() => {
  routes.forEach((route) => {
    if (route.meta?.tags && Array.isArray(route.meta?.tags)) {
      route.meta.tags.forEach((tag) => {
        tags.value.add(tag)
      })
    }
  })
})
</script>

<template>
  <div style="padding: 6px 20px">
    <n-h2
      prefix="bar"
      align-text
    >
      <n-text type="primary">
        <a
          style="color: var(--n-text-color); text-decoration: none"
          href="https://github.com/Ocyss"
          target="_blank"
        >Ocyss_04</a>
        的插件库
      </n-text>
    </n-h2>
  </div>
  <n-input-group style="width: 100%; display: flex; margin-bottom: 10px">
    <n-input
      v-model:value="search"
      style="width: 90%"
      :placeholder="t('search')"
    />
    <n-button
      style="flex: 1"
      type="primary"
    >
      {{ t("search") }}
    </n-button>
  </n-input-group>
  <n-tabs
    v-model:value="tag"
    type="line"
    animated
  >
    <n-tab-pane
      v-for="item in tags"
      :key="item"
      :name="item"
      :tab="t(item)"
    />
  </n-tabs>
  <n-list
    hoverable
    bordered
    clickable
    style="--n-color: none"
  >
    <template
      v-for="route in routes"
      :key="route.name"
    >
      <n-list-item
        v-show="shouldDisplay(route)"
        @click="router.push({ name: route.name as keyof RouteNamedMap })"
      >
        <n-thing>
          <template #header>
            <n-el
              tag="h3"
              style="margin: 3px 0"
              v-html="highlightSearch(t(route.meta?.title as string))"
            />
          </template>
          <template
            v-if="route.meta?.avatar"
            #avatar
          >
            <n-avatar size="large">
              <n-icon
                size="30"
                v-html="route.meta?.avatar"
              />
            </n-avatar>
          </template>
          <template #description>
            <n-space
              size="small"
              style="margin-top: 4px"
            >
              <n-tag
                v-for="item in route.meta?.tags"
                :key="item"
                :bordered="false"
                type="info"
                size="small"
              >
                {{ t(item) }}
              </n-tag>
            </n-space>
          </template>
          <n-el
            tag="div"
            v-html="highlightSearch(t(route.meta?.desc as string))"
          />
        </n-thing>
      </n-list-item>
    </template>
  </n-list>
</template>

<style lang="scss">
span.highlighted {
  background-color: var(--warning-color-suppl);
  border-radius: 3px;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: var(--error-color-suppl);
  }
}
</style>
