import type { FieldType } from '@lark-base-open/js-sdk'
import { useInfo } from '@/hooks/useInfo'
import type Layout from '@/components/layout.vue'
import type { FieldMaps } from '@/types'
import { fieldMaps } from '@/utils/field'
import { EventBucket, type Progress } from '@/utils'
import { tKey } from '@/keys'

function getFieldMapValue(
  fieldId: null | string | undefined,
  map: FieldMaps | undefined,
  key: keyof FieldMaps,
) {
  return map && fieldId ? map[key][fieldId] || null : null
}

export const eventBucket = new EventBucket()

export function useData() {
  const { app } = useInfo()
  const { t } = useI18n()
  provide(tKey, t)
  const layout = ref<InstanceType<typeof Layout> | null>(null)
  const fieldMap = ref<FieldMaps>({
    IdToName: {},
    IdToType: {},
    NameToId: {},
  })
  const offCalls = new EventBucket()
  const table = shallowRef<ITable | null>(null)
  const tableId = computed<string | null>({
    get() { return table.value?.id ?? null },
    async set(tableId: string | null) {
      if (tableId) {
        layout.value?.getTablePermission(tableId)
        table.value = await bitable.base.getTableById(tableId)
        offCalls.clear()
        offCalls.add(
          table.value.onFieldAdd(getView),
          table.value.onFieldDelete(getView),
          table.value.onFieldModify(getView),
        )
        await getView()
      }
    },
  })
  const view = shallowRef<IView | null>(null)
  const viewId = computed({
    get() { return view.value?.id ?? null },
    async set(viewId: string | null) {
      if (viewId && table.value) {
        view.value = await table.value.getViewById(viewId)
        await getField()
      }
    },
  })
  const fieldMetaList = shallowRef<IFieldMeta[]>([])
  const tableMetaList = shallowRef<ITableMeta[]>([])
  const viewMetaList = shallowRef<IViewMeta[]>([])
  const hooks: Record<string, (...args: any[]) => void> = {}
  const message = useMessage()

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
  function errorHandle(msg: string, error: Error): void {
    const errorMessage = error?.message || 'Unknown error occurred'
    message.error(`${msg}: ${errorMessage}`, {
      closable: true,
      duration: 0,
    })
    console.log(`${app.value.title}${msg}:`, error)
  }
  async function handleAsyncError(msg: string, func: () => Promise<any>) {
    try {
      await func()
    }
    catch (error: any) {
      errorHandle(msg, error)
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

  function getTable() {
    return handleAsyncError('Failed to get table data', async () => {
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

  function getView() {
    return handleAsyncError('get View Failed', async () => {
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

  function getField() {
    return handleAsyncError('get Field Failed', async () => {
      layout.value?.update(true, t('Update field data'))
      callHook('beforeGetField')
      if (!table.value || !view.value)
        throw new Error('table or view is empty')
      fieldMetaList.value = await view.value.getFieldMetaList()
      fieldMap.value = fieldMaps(fieldMetaList.value)
      callHook('getField')
      fieldMetaList.value.forEach(item => callHook('fieldTraverse', item))
      layout.value?.update(false)
    })
  }

  async function getRecords(f: (val: { pr: Progress, records: IGetRecordsResponse }) => Promise<any>, all = false, pageSize = 1000): Promise<void> {
    if (layout.value) {
      layout.value.update(true, t('Step 1 - Getting Table'))
      layout.value.init()
      if (table.value) {
        layout.value.update(true, t('Step 2 - Getting Records'))
        let records: IGetRecordsResponse = {
          hasMore: true,
          records: [],
          total: 0,
        }
        let promise: any[] = []
        const pr = layout.value.spin(t('Record'), 0)
        if (all) {
          while (records.hasMore) {
            records = await table.value.getRecords({
              pageSize,
              pageToken: records.pageToken,
            })
            if (pr.total === 0)
              pr.addTotal(records.total)
            await f({ pr, records })
          }
        }
        else {
          let vid = viewId.value
          if (!vid) {
            const selection = await bitable.base.getSelection()
            if (selection.viewId && selection.tableId === tableId.value) {
              vid = selection.viewId
            }
            else {
              const views = (await table.value.getViewMetaList()).filter(item => item.type === ViewType.Grid)
              vid = views[0].id
            }
          }

          const recordIdList = await bitable.ui.selectRecordIdList(tableId.value!, vid)
          pr.addTotal(recordIdList.length)
          promise = recordIdList.map(async (item) => {
            const record = await table.value!.getRecordById(item)
            await f({
              pr,
              records: {
                hasMore: false,
                records: [{ fields: record.fields, recordId: item }],
                total: 0,
              },
            })
          })
        }
        await Promise.all(promise)
      }
      else {
        throw new Error('table not loaded')
      }
    }
    else {
      throw new Error('layout not loaded')
    }
  }

  const fieldId = (fieldId: null | string | undefined) => getFieldMapValue(fieldId, fieldMap.value, 'NameToId')
  const fieldName = (fieldId: null | string | undefined) => getFieldMapValue(fieldId, fieldMap.value, 'IdToName')
  const fieldType = (fieldId: null | string | undefined) => getFieldMapValue(fieldId, fieldMap.value, 'IdToType')
  onMounted(() => {
    eventBucket.add(bitable.base.onTableAdd(() => {
      void getTable()
    }))
    eventBucket.add(bitable.base.onTableDelete(() => {
      void getTable()
    }))
  })
  onBeforeUnmount(() => {
    eventBucket.clear()
    offCalls.clear()
  })
  return {
    errorHandle,
    fieldId,
    fieldMap,
    fieldMetaList,
    fieldName,
    fieldType,
    filterFields,
    getField,
    getRecords,
    getTable,
    getView,
    layout,
    message,
    onBeforeGetField,
    onBeforeGetTable,
    onBeforeGetView,
    onFieldTraverse,
    onGetField,
    onGetTable,
    onGetView,
    t,
    table,
    tableId,
    tableMetaList,
    viewId,
    viewMetaList,
  }
}
