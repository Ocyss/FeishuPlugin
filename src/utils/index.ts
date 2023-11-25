import Layout from "@/components/layout.vue";
import { FieldMaps } from "@/types";
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

export class Data {
  layout?: InstanceType<typeof Layout>;
  formData?: any;
  tableMetaList?: Array<ITableMeta>;
  viewMetaList?: Array<IViewMeta>;
  fieldMetaList?: Array<IFieldMeta>;
  fieldMap?: FieldMaps;
  async init(formData: any, layout: InstanceType<typeof Layout>, view = false) {
    this.formData = formData;
    this.layout = layout;
    await this.getTable(view);
  }
  async getTable(view = false) {
    const data = await this.layout!.getTable(this.formData);
    this.tableMetaList = data.tableMetaList;
    if (view) {
      await this.getView();
    } else {
      await this.getField();
    }
  }
  async getViewTable() {
    const data = await this.layout!.getTable(this.formData);
    this.tableMetaList = data.tableMetaList;
    await this.getView();
  }

  async getView() {
    const data = await this.layout!.getView(this.formData);
    this.viewMetaList = data.viewMetaList;
    await this.getViewField(data.table);
  }

  async getViewField(table?: ITable) {
    const data = await this.layout!.getViewField(this.formData, table);
    this.fieldMap = data.fieldMap;
    this.fieldMetaList = data.fieldMetaList;
  }

  async getField() {
    const data = await this.layout!.getField(this.formData);
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
}

export * from "./field.ts";
export * from "./format.ts";
export * from "./browser.ts";
