import type { FieldType } from '@lark-base-open/js-sdk'

export enum LogType {
  Default = 'default',
  Error = 'error',
  Info = 'info',
  Primary = 'primary',
  Success = 'success',
  Warning = 'warning',
}

export interface LogRowData extends Track {
  log: string
  type: LogType
}

export interface FieldMaps {
  IdToName: Record<string, string>
  IdToType: Record<string, FieldType>
  NameToId: Record<string, string>
}
