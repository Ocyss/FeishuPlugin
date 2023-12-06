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
      avatar: route.meta.avatar ?? '',
      desc: route.meta.desc ?? '',
      group: route.meta.group ?? '',
      help: route.meta.help ?? '',
      name: route.name,
      tags: route.meta.tags ?? [],
      title: route.meta.title ?? '',
    }
  })
  return { app }
}
