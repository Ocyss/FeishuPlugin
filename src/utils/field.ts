import { FieldType, type IFieldMeta, type IOpenSegment } from '@lark-base-open/js-sdk'
import type { FieldMaps } from '@/types'

// 多行文本转文本
export function TextFieldToStr(val: IOpenCellValue | IOpenSegment[], separator = '') {
  if (!Array.isArray(val) || !val)
    return ''

  return val
    .map((item: any) => item.text ?? item.name ?? item.enName ?? item.link)
    .join(separator)
}

export function fieldMaps(fieldMetaList: IFieldMeta[]) {
  return fieldMetaList.reduce(
    (acc: FieldMaps, obj: IFieldMeta) => {
      acc.NameToId[obj.name] = obj.id
      acc.IdToName[obj.id] = obj.name
      acc.IdToType[obj.id] = obj.type
      return acc
    },
    { IdToName: {}, IdToType: {}, NameToId: {} },
  )
}

export function fieldDefault(val: FieldType | null | string) {
  if (!val || typeof val === 'string')
    return ''
  switch (val) {
    case FieldType.SingleSelect:
    case FieldType.Phone:
    case FieldType.Url:
    case FieldType.Text:
      return ''
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
        id: '',
      }
    default:
      return ''
  }
}

export const FieldInfos: (
  type: FieldType
) => Array<{ id: string, name?: string }> = (type) => {
  const f: <T extends object>(
    obj: Required<T>
  ) => Array<{
    id: string
  }> = (obj) => {
    return Object.keys(obj).map(key => ({
      id: key,
    }))
  }
  type AllProperties<T> = T extends any ? keyof T : never
  type AllPropertiesTypes<T> = {
    [P in AllProperties<T>]: T extends { [K in P]?: infer U } ? U : never;
  }
  switch (type) {
    case FieldType.Text:
      return f<AllPropertiesTypes<IOpenSegment>>({
        en_name: '',
        enName: '',
        id: '',
        link: '',
        mentionType: 'User',
        name: '',
        text: '',
        token: '',
        type: base.IOpenSegmentType.Text,
      })
    case FieldType.Number:
    case FieldType.DateTime:
    case FieldType.Checkbox:
    case FieldType.Phone:
      return []
    case FieldType.SingleSelect:
    case FieldType.MultiSelect:
      return f<IOpenSingleSelect>({
        id: '',
        text: '',
      })
    case FieldType.User:
      return f<IOpenUser>({
        email: '',
        en_name: '',
        enName: '',
        id: '',
        name: '',
      })
    case FieldType.Url:
      return f<IOpenUrlSegment>({
        link: '',
        text: '',
        type: base.IOpenSegmentType.Url,
      })
    case FieldType.Attachment:
      return f<IOpenAttachment>({
        name: '',
        size: 0,
        timeStamp: 0,
        token: '',
        type: '',
      })
    case FieldType.DuplexLink:
      return f<IOpenLink>({
        record_ids: [],
        recordIds: [],
        table_id: '',
        tableId: '',
        text: '',
        type: '',
      })
    case FieldType.Location:
      return f<IOpenLocation>({
        address: '',
        adname: '',
        cityname: '',
        full_address: '',
        fullAddress: '',
        location: '',
        name: '',
        pname: '',
      })
    case FieldType.GroupChat:
      return f<IOpenGroupChat>({
        avatarUrl: '',
        en_name: '',
        enName: '',
        id: '',
        linkToken: '',
        name: '',
      })
  }
  return [{ id: '暂未支持该字段，请在交流群内反馈' }]
}

export function FieldName(type: FieldType) {
  const fieldTypeStrings: Record<number, string> = {
    [FieldType.Attachment]: 'Attachment',
    [FieldType.AutoNumber]: 'AutoNumber',
    [FieldType.Barcode]: 'Barcode',
    [FieldType.Checkbox]: 'Checkbox',
    [FieldType.CreatedTime]: 'CreatedTime',
    [FieldType.CreatedUser]: 'CreatedUser',
    [FieldType.Currency]: 'Currency',
    [FieldType.DateTime]: 'DateTime',
    [FieldType.Denied]: 'Denied',
    [FieldType.DuplexLink]: 'DuplexLink',
    [FieldType.Formula]: 'Formula',
    [FieldType.GroupChat]: 'GroupChat',
    [FieldType.Location]: 'Location',
    [FieldType.Lookup]: 'Lookup',
    [FieldType.ModifiedTime]: 'ModifiedTime',
    [FieldType.ModifiedUser]: 'ModifiedUser',
    [FieldType.MultiSelect]: 'MultiSelect',
    [FieldType.NotSupport]: 'NotSupport',

    [FieldType.Number]: 'Number',
    [FieldType.Phone]: 'Phone',
    [FieldType.Progress]: 'Progress',
    [FieldType.Rating]: 'Rating',
    [FieldType.SingleLink]: 'SingleLink',
    [FieldType.SingleSelect]: 'SingleSelect',
    [FieldType.Text]: 'Text',
    [FieldType.Url]: 'Url',
    [FieldType.User]: 'User',
  }
  return fieldTypeStrings[type]
}

export function FieldEmptyMsg(type: FieldType | FieldType[]) {
  const text = (Array.isArray(type) ? type : [type])
    .map((item) => {
      return FieldName(item)
    })
    .join(', ')
  return `Only {${text}} fields are supported`
}
