import Layout from "@/components/layout.vue";
import { FieldMaps } from "@/types";
import { RouteRecordRaw } from "vue-router/auto";
import { FieldType } from "@lark-base-open/js-sdk";

export class Progress {
  total: number;
  completed: number;
  message: string;
  constructor(message: string, total: number, completed = 0) {
    this.total = total;
    this.completed = completed;
    this.message = message;
  }
  add(n = 1) {
    this.completed += n;
  }
  addTotal(n = 1) {
    this.total += n;
  }
}
function getFieldMapValue(
  fieldId: string | null | undefined,
  map: FieldMaps | undefined,
  key: keyof FieldMaps
) {
  return map && fieldId ? map[key][fieldId] || null : null;
}
export class Data {
  layout?: InstanceType<typeof Layout>;
  formData?: any;
  tableMetaList?: Array<ITableMeta>;
  viewMetaList?: Array<IViewMeta>;
  fieldMetaList?: Array<IFieldMeta>;
  fieldMap?: FieldMaps;
  view?: boolean;
  async init(formData: any, layout: InstanceType<typeof Layout>, view = false) {
    this.formData = formData;
    this.layout = layout;
    this.view = view;
    this.getTable();
  }

  async getTable() {
    const data = await this.layout!.getTable(this.formData);
    this.tableMetaList = data.tableMetaList;
    if (this.view) {
      await this.getView(data.table);
    } else {
      await this.getField(data.table);
    }
  }

  async getView(table?: ITable) {
    const data = await this.layout!.getView(this.formData, table);
    this.viewMetaList = data.viewMetaList;
    await this.getField(data.table);
  }

  async getField(table?: ITable) {
    const data = this.view
      ? await this.layout!.getViewField(this.formData, table)
      : await this.layout!.getField(this.formData, table);
    this.fieldMap = data.fieldMap;
    this.fieldMetaList = data.fieldMetaList;
  }

  filterFields(
    filterTypeOrAction: FieldType | FieldType[] | any,
    actionTypeMap?: Record<number, any[]>
  ) {
    if (actionTypeMap) {
      return this.fieldMetaList?.filter((item) => {
        const actions = actionTypeMap[item.type];
        return actions ? actions.includes(filterTypeOrAction) : false;
      });
    }
    const filterTypes = Array.isArray(filterTypeOrAction)
      ? filterTypeOrAction
      : [filterTypeOrAction];
    return this.fieldMetaList?.filter((item) =>
      filterTypes.includes(item.type)
    );
  }
  type(fieldId: string | null | undefined) {
    return getFieldMapValue(fieldId, this.fieldMap, "IdToType");
  }

  name(fieldId: string | null | undefined) {
    return getFieldMapValue(fieldId, this.fieldMap, "IdToName");
  }

  id(fieldId: string | null | undefined) {
    return getFieldMapValue(fieldId, this.fieldMap, "NameToId");
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
      const index = v.children![0];
      return index;
    });
export * from "./field.ts";
export * from "./format.ts";
export * from "./browser.ts";
