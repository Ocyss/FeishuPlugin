import { FieldType } from "@lark-base-open/js-sdk";
export enum LogType {
  Default = "default",
  Primary = "primary",
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}
export type Track = {
  tableId?: string | null;
  viewId?: string | null;
  recordId?: string | null;
  fieldId?: string | null;
  cellId?: string | null;
};

export type LogRowData = {
  type: LogType;
  log: string;
  track?: Track;
};

export type Data<T = {}> = {
  tableId?: string | null;
  viewId?: string | null;
  input?: string | null;
  output?: string | null;
} & T;

export type FieldMaps = {
  NameToId: Record<string, string>;
  IdToName: Record<string, string>;
  IdToType: Record<string, FieldType>;
};
