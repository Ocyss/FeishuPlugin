import 'vue-router/auto'

declare module 'vue-router/auto' {
  interface RouteMeta {
    title?: string
    desc?: string
    help?: string
    group?: string
    tags?: string[]
    avatar?: string
  }
}
