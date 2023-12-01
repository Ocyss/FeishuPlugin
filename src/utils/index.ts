import { type FieldType } from "@lark-base-open/js-sdk"
import { type RouteRecordRaw } from "vue-router/auto"

import type Layout from "@/components/layout.vue"
import { type FieldMaps } from "@/types"

export class Progress {
  total: number
  completed: number
  message: string
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


function getFieldMapValue(
  fieldId: string | null | undefined,
  map: FieldMaps | undefined,
  key: keyof FieldMaps
) {
  return map && fieldId ? map[key][fieldId] || null : null
}

export class Data {
  layout?: InstanceType<typeof Layout>
  tableId?: string | null
  viewId?: string | null
  input?: string | null
  output?: string | null
  tableMetaList?: ITableMeta[]
  viewMetaList?: IViewMeta[]
  fieldMetaList?: IFieldMeta[]
  fieldMap?: FieldMaps
  view?: boolean
  async init(layout: InstanceType<typeof Layout>, view = false) {
    this.layout = layout
    this.view = view
    return await this.getTable()
  }

  async getTable() {
    const data = await this.layout!.getTable()
    this.tableId = data.tableId
    this.tableMetaList = data.tableMetaList
    if (this.view) {
      return { ...data, ...(await this.getView(data.table)) }
    } else {
      return { ...data, ...(await this.getField(data.table)) }
    }
  }

  async getView(table?: ITable) {
    if (!this.tableId) {
      return null
    }
    const data = await this.layout!.getView(this.tableId, table)
    this.viewMetaList = data.viewMetaList
    this.viewId = data.viewId
    return { ...data, ...(await this.getField(data.table)) }
  }

  async getField(table?: ITable) {
    if (!this.tableId || (this.view && !this.viewId)) {
      return null
    }
    let data
    if (this.view && this.viewId) {
      data = await this.layout!.getViewField(this.tableId, this.viewId, table)
    } else {
      data = await this.layout!.getField(this.tableId, table)
    }
    this.fieldMap = data.fieldMap
    this.fieldMetaList = data.fieldMetaList
    return data
  }

  filterFields(
    filterTypeOrAction: FieldType | FieldType[] | any,
    actionTypeMap?: Record<number, any[]>
  ) {
    if (actionTypeMap) {
      return this.fieldMetaList?.filter((item) => {
        const actions = actionTypeMap[item.type]
        return actions ? actions.includes(filterTypeOrAction) : false
      })
    }
    const filterTypes = Array.isArray(filterTypeOrAction)
      ? filterTypeOrAction
      : [filterTypeOrAction]
    return this.fieldMetaList?.filter((item) =>
      filterTypes.includes(item.type)
    )
  }

  type(fieldId: string | null | undefined) {
    return getFieldMapValue(fieldId, this.fieldMap, "IdToType")
  }

  name(fieldId: string | null | undefined) {
    return getFieldMapValue(fieldId, this.fieldMap, "IdToName")
  }

  id(fieldId: string | null | undefined) {
    return getFieldMapValue(fieldId, this.fieldMap, "NameToId")
  }
  check(out = true): this is {
    tableId: string
    viewId: string
    input: string
    output: string
  } {
    return (
      !!this.tableId &&
      (!this.view || !!this.viewId) &&
      !!this.input &&
      (!out || !!this.output)
    )
  }
}

export const getRoutes = (routes: RouteRecordRaw[]) =>
  routes
    .filter(
      (v) =>
        v.path !== "/" &&
        v.path !== "/home" &&
        v.path !== "/_example" &&
        v.children &&
        v.children.length > 0
    )
    .map((v) => {
      const index = v.children![0]
      return index
    })

export * from "./browser.ts"
export * from "./field.ts"
export * from "./files.ts"
export * from "./format.ts"
