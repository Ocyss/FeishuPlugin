import { type FieldType } from "@lark-base-open/js-sdk"
export enum LogType {
  Default = "default",
  Primary = "primary",
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}
export interface Track {
  tableId?: string | null
  viewId?: string | null
  recordId?: string | null
  fieldId?: string | null
  cellId?: string | null
}

export interface LogRowData {
  type: LogType
  log: string
  track?: Track
}

export type Data<T = object> = {
  tableId?: string | null
  viewId?: string | null
  input?: string | null
  output?: string | null
} & T

export interface FieldMaps {
  NameToId: Record<string, string>
  IdToName: Record<string, string>
  IdToType: Record<string, FieldType>
}
