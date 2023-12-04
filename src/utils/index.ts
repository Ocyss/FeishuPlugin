import type { RouteRecordRaw } from 'vue-router/auto'

export class Progress {
  completed: number
  message: string
  total: number
  constructor(message: string, total: number, completed = 0) {
    this.total = total
    this.completed = completed
    this.message = message
  }

  add(n = 1) {
    this.completed += n
  }

  addTotal(n = 1) {
    this.total += n
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
