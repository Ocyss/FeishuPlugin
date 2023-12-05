import { useRoute } from 'vue-router/auto'

interface AppInfo {
  name: string
  title: string
  desc: string
  help: string
  group: string
  tags: string[]
  avatar: string
}

export function useInfo() {
  const route = useRoute()
  const app = computed<AppInfo>(() => {
    return {
      name: route.name,
      title: route.meta.title ?? '',
      desc: route.meta.desc ?? '',
      help: route.meta.help ?? '',
      group: route.meta.group ?? '',
      tags: route.meta.tags ?? [],
      avatar: route.meta.avatar ?? '',
    }
  })
  return { app }
}
