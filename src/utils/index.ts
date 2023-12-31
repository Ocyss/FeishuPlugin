import type { RouteRecordRaw } from 'vue-router/auto'


export class EventBucket {
  value: ((...args: any[]) => any)[] = []
  get length() {
    return this.value.length
  }

  add(...fn: ((...args: any[]) => any)[]) {
    this.value.push(...fn)
  }

  clear() {
    this.value.forEach(v => v())
    this.value = []
  }
}

export function getRoutes(routes: RouteRecordRaw[]) {
  return routes
    .filter(
      v =>
        v.path !== '/'
        && v.path !== '/home'
        && v.path !== '/_example'
        && v.children
        && v.children.length > 0,
    )
    .map((v) => {
      const index = v.children![0]
      return index
    })
}
