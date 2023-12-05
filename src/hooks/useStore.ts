import type { MaybeRefOrGetter } from '@vueuse/core'
import { useStorage } from '@vueuse/core'
import type { UseIDBOptions } from '@vueuse/integrations/useIDBKeyval'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { useInfo } from '@/hooks/useInfo'

export function useStore() {
  const { app } = useInfo()
  function store<T>(key: string, data: MaybeRefOrGetter<T>, storage = localStorage) {
    return useStorage<T>(`${app.value.name}<${key}>`, data, storage, {
      mergeDefaults: true,
    })
  }
  function IDB<T>(key: string, data: MaybeRefOrGetter<T>, options?: UseIDBOptions) {
    return useIDBKeyval<T>(`${app.value.name}<${key}>`, data, options)
  }
  return { store, IDB }
}
