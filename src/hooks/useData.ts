import type { FieldType } from '@lark-base-open/js-sdk'
import type Layout from '@/components/layout.vue'
import type { FieldMaps } from '@/types'
import { fieldMaps } from '@/utils/field'

function getFieldMapValue(
  fieldId: null | string | undefined,
  map: FieldMaps | undefined,
  key: keyof FieldMaps,
) {
  return map && fieldId ? map[key][fieldId] || null : null
}

export function useData(options = {
  view: false,
}) {
  const { t } = useI18n()
  const layout = ref<InstanceType<typeof Layout> | null>(null)
  const fieldMap = ref<FieldMaps>({
    IdToName: {},
    IdToType: {},
    NameToId: {},
  })
  const table = shallowRef<ITable | null>(null)
  const view = shallowRef<IView | null>(null)
  const viewId = ref<null | string>(null)
  const tableId = ref<null | string>(null)
  const fieldMetaList = ref<IFieldMeta[]>([])
  const tableMetaList = ref<ITableMeta[]>([])
  const viewMetaList = ref<IViewMeta[]>([])
  const hooks: Record<string, (...args: any[]) => void> = {}
  const message = useMessage()
  const offCalls: (() => void)[] = []
  function createHooks<T extends (...args: any[]) => any = () => void>(
    hookName: string,
  ) {
    return (fn: T) => {
      hooks[hookName] = fn
    }
  }

  function callHook(hookName: string, ...args: any[]) {
    if (hookName in hooks)
      hooks[hookName](...args)
  }

  async function handleAsyncError(msg: string, func: () => Promise<any>) {
    try {
      await func()
    }
    catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred'
      message.error(`${msg}: ${errorMessage}`, {
        closable: true,
        duration: 0,
      })
      console.error(`${msg}:`, error)
    }
  }

  const onBeforeGetTable = createHooks('beforeGetTable')
  const onGetTable = createHooks('getTable')
  const onBeforeGetView = createHooks('beforeGetView')
  const onGetView = createHooks('getView')
  const onBeforeGetField = createHooks('beforeGetField')
  const onGetField = createHooks('getField')
  const onFieldTraverse = createHooks<(item: IFieldMeta) => void>('fieldTraverse')

  function filterFields(
    filterTypeOrAction: FieldType | FieldType[] | any,
    actionTypeMap?: Record<number, any[]>,
  ) {
    if (actionTypeMap) {
      return fieldMetaList.value?.filter((item) => {
        const actions = actionTypeMap[item.type]
        return actions ? actions.includes(filterTypeOrAction) : false
      })
    }
    const filterTypes = Array.isArray(filterTypeOrAction)
      ? filterTypeOrAction
      : [filterTypeOrAction]
    return fieldMetaList.value?.filter(item =>
      filterTypes.includes(item.type),
    )
  }

  async function getTable() {
    handleAsyncError('Failed to get table data', async () => {
      layout.value?.update(true, t('Update Table data'))
      callHook('beforeGetTable')
      const [_tableMetaList, selection] = await Promise.all([
        bitable.base.getTableMetaList(),
        bitable.base.getSelection(),
      ])
      tableMetaList.value = _tableMetaList
      tableId.value = selection.tableId
      callHook('getTable')
    })
  }

  watch(tableId, async (newTableId, oldTableId) => {
    const get = async () => {
      if (options.view)
        await getView()
      else
        await getField()
    }
    handleAsyncError('Field or View Update Failed', async () => {
      if (newTableId && newTableId !== oldTableId) {
        table.value = await bitable.base.getTableById(newTableId)
        offCalls.push(
          table.value.onFieldAdd(get),
          table.value.onFieldDelete(get),
          table.value.onFieldModify(get),
        )
        await get()
      }
    })
  })

  async function getView() {
    handleAsyncError('get View Failed', async () => {
      layout.value?.update(true, t('Update view data'))
      callHook('beforeGetView')
      if (!tableId.value || !table.value)
        throw new Error('table is empty')
      const views = await table.value.getViewMetaList()
      viewMetaList.value = views.filter(item => item.type === base.ViewType.Grid)
      if (viewMetaList.value.length > 0)
        viewId.value = viewMetaList.value[0].id
      callHook('getView')
    })
  }

  watch(viewId, async (newViewId, oldViewId) => {
    handleAsyncError('Field Update Failed', async () => {
      if (table.value && newViewId && newViewId !== oldViewId) {
        view.value = await table.value.getViewById(newViewId)
        await getField()
      }
    })
  })

  async function getField() {
    handleAsyncError('get Field Failed', async () => {
      layout.value?.update(true, t('Update field data'))
      callHook('beforeGetField')
      if (!table.value || !tableId.value || (options.view && (!viewId.value || !view.value)))
        throw new Error('table or view is empty')
      if (options.view && viewId.value && view.value)
        fieldMetaList.value = await view.value.getFieldMetaList()
      else
        fieldMetaList.value = await table.value.getFieldMetaList()
      fieldMap.value = fieldMaps(fieldMetaList.value)
      callHook('getField')
      fieldMetaList.value.forEach(item => callHook('fieldTraverse', item))
      layout.value?.update(false)
    })
  }

  const fieldId = (fieldId: null | string | undefined) => getFieldMapValue(fieldId, fieldMap.value, 'NameToId')
  const fieldName = (fieldId: null | string | undefined) => getFieldMapValue(fieldId, fieldMap.value, 'IdToName')
  const fieldType = (fieldId: null | string | undefined) => getFieldMapValue(fieldId, fieldMap.value, 'IdToType')
  onMounted(() => {
    offCalls.push(bitable.base.onTableAdd(() => {
      getTable()
    }))
    offCalls.push(bitable.base.onTableDelete(() => {
      getTable()
    }))
  })
  onBeforeUnmount(() => {
    offCalls.forEach(call => call())
  })
  return {
    t,
    table,
    fieldId,
    fieldMap,
    fieldMetaList,
    fieldName,
    fieldType,
    filterFields,
    getField,
    getTable,
    getView,
    layout,
    tableId,
    tableMetaList,
    viewId,
    viewMetaList,
    onBeforeGetTable,
    onGetTable,
    onBeforeGetView,
    onGetView,
    onBeforeGetField,
    onGetField,
    message,
    onFieldTraverse,
  }
}
