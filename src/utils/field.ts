import { FieldType, type IFieldMeta, type IOpenSegment } from "@lark-base-open/js-sdk"

import type { FieldMaps } from "@/types"

// 多行文本转文本
export function TextFieldToStr(val: IOpenSegment[] | IOpenCellValue) {
  if (!Array.isArray(val) || !val) {
    return ""
  }
  return val
    .map((item: any) => item.text ?? item.name ?? item.enName ?? item.link)
    .join("")
}

export function fieldMaps(fieldMetaList: IFieldMeta[]) {
  return fieldMetaList.reduce(
    (acc: FieldMaps, obj: IFieldMeta) => {
      acc.NameToId[obj.name] = obj.id
      acc.IdToName[obj.id] = obj.name
      acc.IdToType[obj.id] = obj.type
      return acc
    },
    { "NameToId": {}, "IdToName": {}, "IdToType": {} }
  )
}

export function fieldDefault(val: FieldType | null | string) {
  if (!val || typeof val === "string") { return "" }
  switch (val) {
    case FieldType.SingleSelect:
    case FieldType.Phone:
    case FieldType.Url:
    case FieldType.Text:
      return ""
    case FieldType.Number:
      return 0
    case FieldType.MultiSelect:
      return []
    case FieldType.DateTime:
      return 0
    case FieldType.Checkbox:
      return false
    case FieldType.User:
      return {
        "id": ""
      }
    default:
      return ""
  }
}

export const FieldInfos: (
  type: FieldType
) => Array<{ name?: string, id: string }> = (type) => {
  const f: <T extends object>(
    obj: Required<T>
  ) => Array<{
    id: string
  }> = (obj) => {
    return Object.keys(obj).map((key) => ({
      "id": key
    }))
  }
  type AllProperties<T> = T extends any ? keyof T : never
  type AllPropertiesTypes<T> = {
    [P in AllProperties<T>]: T extends { [K in P]?: infer U } ? U : never;
  }
  switch (type) {
    case FieldType.Text:
      return f<AllPropertiesTypes<IOpenSegment>>({
        "id": "",
        "text": "",
        "name": "",
        "enName": "",
        "en_name": "",
        "type": base.IOpenSegmentType.Text,
        "link": "",
        "token": "",
        "mentionType": "User"
      })
    case FieldType.Number:
    case FieldType.DateTime:
    case FieldType.Checkbox:
    case FieldType.Phone:
      return []
    case FieldType.SingleSelect:
    case FieldType.MultiSelect:
      return f<IOpenSingleSelect>({
        "id": "",
        "text": ""
      })
    case FieldType.User:
      return f<IOpenUser>({
        "id": "",
        "name": "",
        "enName": "",
        "email": "",
        "en_name": ""
      })
    case FieldType.Url:
      return f<IOpenUrlSegment>({
        "type": base.IOpenSegmentType.Url,
        "text": "",
        "link": ""
      })
    case FieldType.Attachment:
      return f<IOpenAttachment>({
        "name": "",
        "size": 0,
        "type": "",
        "token": "",
        "timeStamp": 0
      })
    case FieldType.DuplexLink:
      return f<IOpenLink>({
        "text": "",
        "type": "",
        "recordIds": [],
        "tableId": "",
        "record_ids": [],
        "table_id": ""
      })
    case FieldType.Location:
      return f<IOpenLocation>({
        "address": "",
        "adname": "",
        "cityname": "",
        "name": "",
        "pname": "",
        "fullAddress": "",
        "location": "",
        "full_address": ""
      })
    case FieldType.GroupChat:
      return f<IOpenGroupChat>({
        "id": "",
        "name": "",
        "avatarUrl": "",
        "enName": "",
        "linkToken": "",
        "en_name": ""
      })
  }
  return [{ "id": "暂未支持该字段，请在交流群内反馈" }]
}


export const FieldName = (type: FieldType) => {
  const fieldTypeStrings: Record<number, string> = {
    [FieldType.NotSupport]: "NotSupport",
    [FieldType.Text]: "Text",
    [FieldType.Number]: "Number",
    [FieldType.SingleSelect]: "SingleSelect",
    [FieldType.MultiSelect]: "MultiSelect",
    [FieldType.DateTime]: "DateTime",
    [FieldType.Checkbox]: "Checkbox",
    [FieldType.User]: "User",
    [FieldType.Phone]: "Phone",
    [FieldType.Url]: "Url",
    [FieldType.Attachment]: "Attachment",
    [FieldType.SingleLink]: "SingleLink",
    [FieldType.Lookup]: "Lookup",
    [FieldType.Formula]: "Formula",
    [FieldType.DuplexLink]: "DuplexLink",
    [FieldType.Location]: "Location",
    [FieldType.GroupChat]: "GroupChat",
    [FieldType.Denied]: "Denied",

    [FieldType.CreatedTime]: "CreatedTime",
    [FieldType.ModifiedTime]: "ModifiedTime",
    [FieldType.CreatedUser]: "CreatedUser",
    [FieldType.ModifiedUser]: "ModifiedUser",
    [FieldType.AutoNumber]: "AutoNumber",
    [FieldType.Barcode]: "Barcode",
    [FieldType.Progress]: "Progress",
    [FieldType.Currency]: "Currency",
    [FieldType.Rating]: "Rating"
  }
  return fieldTypeStrings[type]
}

export function FieldEmptyMsg(type: FieldType | FieldType[]) {
  const text = (Array.isArray(type) ? type : [type])
    .map((item) => {
      return FieldName(item)
    })
    .join(", ")
  return `Only {${text}} fields are supported`
}
