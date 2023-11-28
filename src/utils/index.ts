import { type FieldType } from "@lark-base-open/js-sdk"
import { type RouteRecordRaw } from "vue-router/auto"

import type Layout from "@/components/layout.vue"
import { type FieldMaps } from "@/types"

export class Progress{
  total: number
  completed: number
  message: string
  constructor(message: string, total: number, completed = 0){
    this.total = total
    this.completed = completed
    this.message = message
  }

  add(n = 1){
    this.completed += n
  }

  addTotal(n = 1){
    this.total += n
  }
}
function getFieldMapValue(
  fieldId: string | null | undefined,
  map: FieldMaps | undefined,
  key: keyof FieldMaps
){
  return map && fieldId ? map[key][fieldId] || null : null
}
export class Data{
  layout?: InstanceType<typeof Layout>
  formData?: any
  tableMetaList?: ITableMeta[]
  viewMetaList?: IViewMeta[]
  fieldMetaList?: IFieldMeta[]
  fieldMap?: FieldMaps
  view?: boolean
  async init(formData: any, layout: InstanceType<typeof Layout>, view = false){
    this.formData = formData
    this.layout = layout
    this.view = view
    return await this.getTable()
  }

  async getTable(){
    const data = await this.layout!.getTable(this.formData)
    this.tableMetaList = data.tableMetaList
    if (this.view) {
      return { ...data, ...(await this.getView(data.table)) }
    } else {
      return { ...data, ...(await this.getField(data.table)) }
    }
  }

  async getView(table?: ITable){
    const data = await this.layout!.getView(this.formData, table)
    this.viewMetaList = data.viewMetaList
    return { ...data, ...(await this.getField(data.table)) }
  }

  async getField(table?: ITable){
    const method = this.view ? "getViewField" : "getField"
    const data = await this.layout![method](this.formData, table)
    this.fieldMap = data.fieldMap
    this.fieldMetaList = data.fieldMetaList
    return data
  }

  filterFields(
    filterTypeOrAction: FieldType | FieldType[] | any,
    actionTypeMap?: Record<number, any[]>
  ){
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

  type(fieldId: string | null | undefined){
    return getFieldMapValue(fieldId, this.fieldMap, "IdToType")
  }

  name(fieldId: string | null | undefined){
    return getFieldMapValue(fieldId, this.fieldMap, "IdToName")
  }

  id(fieldId: string | null | undefined){
    return getFieldMapValue(fieldId, this.fieldMap, "NameToId")
  }
}

export const getRoutes = (routes: RouteRecordRaw[]) =>
  routes
    .filter(
      (v) =>
        v.path !== "/" &&
        v.path !== "/home" &&
        v.children &&
        v.children.length > 0
    )
    .map((v) => {
      const index = v.children![0]
      return index
    })
export * from "./browser.ts"
export * from "./field.ts"
export * from "./format.ts"
