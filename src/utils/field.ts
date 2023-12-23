import { FieldType } from '@lark-base-open/js-sdk'
import type { IFieldMeta, IOpenSegment } from '@lark-base-open/js-sdk'
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

export function createFieldInfos() {
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
  const infos: Record<FieldType, Array<{ id: string, name?: string }>> = {
    [FieldType.Attachment]: f<IOpenAttachment>({
      name: '',
      size: 0,
      timeStamp: 0,
      token: '',
      type: '',
    }),
    [FieldType.AutoNumber]: [],
    [FieldType.Barcode]: f<AllPropertiesTypes<IOpenSegment>>({
      id: '',
      en_name: '',
      enName: '',
      link: '',
      mentionType: 'User',
      name: '',
      text: '',
      token: '',
      type: base.IOpenSegmentType.Text,
    }),
    [FieldType.Checkbox]: [],
    [FieldType.CreatedTime]: [],
    [FieldType.CreatedUser]: f<IOpenUser>({
      id: '',
      email: '',
      en_name: '',
      enName: '',
      name: '',
    }),
    [FieldType.Currency]: [],
    [FieldType.DateTime]: [],
    [FieldType.Denied]: [],
    [FieldType.DuplexLink]: f<IOpenLink>({
      record_ids: [],
      recordIds: [],
      table_id: '',
      tableId: '',
      text: '',
      type: '',
    }),
    [FieldType.Email]: [],
    [FieldType.Formula]: [],
    [FieldType.GroupChat]: f<IOpenGroupChat>({
      id: '',
      avatarUrl: '',
      en_name: '',
      enName: '',
      linkToken: '',
      name: '',
    }),
    [FieldType.Location]: f<IOpenLocation>({
      address: '',
      adname: '',
      cityname: '',
      full_address: '',
      fullAddress: '',
      location: '',
      name: '',
      pname: '',
    }),
    [FieldType.Lookup]: [],
    [FieldType.ModifiedTime]: [],
    [FieldType.ModifiedUser]: f<IOpenUser>({
      id: '',
      email: '',
      en_name: '',
      enName: '',
      name: '',
    }),
    [FieldType.MultiSelect]: f<IOpenSingleSelect>({
      id: '',
      text: '',
    }),
    [FieldType.NotSupport]: [],
    [FieldType.Number]: [],
    [FieldType.Phone]: [],
    [FieldType.Progress]: [],
    [FieldType.Rating]: [],
    [FieldType.SingleLink]: f<IOpenLink>({
      record_ids: [],
      recordIds: [],
      table_id: '',
      tableId: '',
      text: '',
      type: '',
    }),
    [FieldType.SingleSelect]: f<IOpenSingleSelect>({
      id: '',
      text: '',
    }),
    [FieldType.Text]: f<AllPropertiesTypes<IOpenSegment>>({
      id: '',
      en_name: '',
      enName: '',
      link: '',
      mentionType: 'User',
      name: '',
      text: '',
      token: '',
      type: base.IOpenSegmentType.Text,
    }),
    [FieldType.Url]: f<IOpenUrlSegment>({
      link: '',
      text: '',
      type: base.IOpenSegmentType.Url,
    }),
    [FieldType.User]: f<IOpenUser>({
      id: '',
      email: '',
      en_name: '',
      enName: '',
      name: '',
    }),
  }
  return (type: FieldType) => infos[type]
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

const icons: Record<FieldType, string> = {
  [FieldType.Attachment]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="AttachmentOutlined"><path d="M12.304 7.315a1 1 0 0 1 1.414 1.414L8.13 14.317a1.485 1.485 0 0 0 0 2.1l.01.011a1.5 1.5 0 0 0 2.117-.005l7.43-7.43a3.5 3.5 0 0 0 0-4.95l-.036-.037a3.5 3.5 0 0 0-4.95 0l-7.778 7.777a5.521 5.521 0 0 0 7.808 7.809l7.07-7.07a1 1 0 0 1 1.415 1.414l-7.07 7.07A7.521 7.521 0 0 1 3.509 10.37l7.778-7.778a5.5 5.5 0 0 1 7.778 0l.037.037a5.5 5.5 0 0 1 0 7.778l-7.43 7.43a3.5 3.5 0 0 1-4.939.012l-.006-.006-.012-.012a3.485 3.485 0 0 1 0-4.928l5.589-5.588Z" fill="currentColor"></path></svg>',
  [FieldType.AutoNumber]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="NumberedListNewOutlined"><path d="M3.1 7.5V3.824l-.58.41a.9.9 0 1 1-1.04-1.469l1.528-1.08a1.2 1.2 0 0 1 1.892.98V7.5a.9.9 0 0 1-1.8 0Zm.9 3.586a1 1 0 0 0-1 1V17H1.37a.5.5 0 0 0-.431.752l2.63 4.508a.5.5 0 0 0 .863 0l2.63-4.508A.5.5 0 0 0 6.63 17H5v-4.914a1 1 0 0 0-1-1Zm6 8a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H10Zm-1-7a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H10a1 1 0 0 1-1-1ZM10 3a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H10Z" fill="currentColor"></path></svg>',
  [FieldType.Barcode]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="BarcodeOutlined"><path d="M1 5a2 2 0 0 1 2-2h3a1 1 0 0 1 0 2H3v3a1 1 0 0 1-2 0V5Zm22 0a2 2 0 0 0-2-2h-3a1 1 0 1 0 0 2h3v3a1 1 0 1 0 2 0V5Zm-2 16a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3h-3a1 1 0 1 0 0 2h3ZM1 19a2 2 0 0 0 2 2h3a1 1 0 1 0 0-2H3v-3a1 1 0 1 0-2 0v3ZM9 8a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V8ZM6 7a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm11 1a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V8Zm-3-1a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Z" fill="currentColor"></path></svg>',
  [FieldType.Checkbox]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="TodoOutlined"><path d="M17.207 10.207a1 1 0 0 0-1.414-1.414L11 13.586l-2.293-2.293a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l5.5-5.5Z" fill="currentColor"></path><path d="M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm2 0v16h16V4H4Z" fill="currentColor"></path></svg>',
  [FieldType.CreatedTime]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CalendarLineOutlined"><path d="M7 2a1 1 0 0 1 1 1h8a1 1 0 1 1 2 0h2a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a1 1 0 0 1 1-1Zm9 3H8a1 1 0 0 1-2 0H4v15h16V5h-2a1 1 0 1 1-2 0ZM9 15a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3 5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3-5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Z" fill="currentColor"></path></svg>',
  [FieldType.CreatedUser]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MemberOutlined"><path d="M9 13h6c2.761 0 6 1.929 6 5.4V20c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-1.6C3 14.932 6.239 13 9 13Zm10 7v-1.667C19 16.232 16.871 15 15 15H9c-1.83 0-4 1.172-4 3.333V20h14Zm-7-8a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"></path></svg>',
  [FieldType.Currency]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CurrencyYuanOutlined"><path d="M15.772 7.463a.9.9 0 0 0-1.544-.926l-2.084 3.473a1.004 1.004 0 0 0-.288 0L9.772 6.537a.9.9 0 0 0-1.544.926L10.05 10.5H7.9a.9.9 0 1 0 0 1.8H11V14H7.9a.9.9 0 1 0 0 1.8H11V18a1 1 0 0 0 1.999 0v-2.2H16.1a.9.9 0 1 0 0-1.8H13v-1.7h3.1a.9.9 0 1 0 0-1.8h-2.15l1.822-3.037Z" fill="currentColor"></path><path d="M23.5 12c0 6.351-5.149 11.5-11.5 11.5S.5 18.351.5 12 5.649.5 12 .5 23.5 5.649 23.5 12Zm-21 0a9.5 9.5 0 1 0 19 0 9.5 9.5 0 0 0-19 0Z" fill="currentColor"></path></svg>',
  [FieldType.DateTime]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CalendarLineOutlined"><path d="M7 2a1 1 0 0 1 1 1h8a1 1 0 1 1 2 0h2a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a1 1 0 0 1 1-1Zm9 3H8a1 1 0 0 1-2 0H4v15h16V5h-2a1 1 0 1 1-2 0ZM9 15a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3 5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3-5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Z" fill="currentColor"></path></svg>',
  [FieldType.Denied]: 'D',
  [FieldType.DuplexLink]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="SheetDatareferenceOutlined"><path d="M12 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V4Zm2 0v6h6V4h-6ZM2 14a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Zm2 0v6h6v-6H4Zm17 .993V17a5 5 0 0 1-5 5h-1a1 1 0 1 1 0-2h1a3 3 0 0 0 2.987-2.724l-1.453-.161a.5.5 0 0 1-.298-.85l2.91-2.911a.5.5 0 0 1 .854.353v1.286ZM3 9.02V7a5 5 0 0 1 5-5h1a1 1 0 0 1 0 2H8a3 3 0 0 0-2.986 2.701l1.86.186a.5.5 0 0 1 .285.87l-3.325 2.992A.5.5 0 0 1 3 10.377V9.02Z" fill="currentColor"></path></svg>',
  [FieldType.Email]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MailOutlined"><path d="M5.558 10.214a1 1 0 0 1 .925-1.77l5.481 2.861 5.481-2.862a1 1 0 0 1 .925 1.772l-5.887 3.074a.995.995 0 0 1-.52.112.994.994 0 0 1-.518-.112l-5.887-3.075Z" fill="currentColor"></path><path d="M21.009 3C22.113 3 23 3.895 23 5v14c0 1.105-.888 2-1.992 2H2.99A1.993 1.993 0 0 1 1 19V5c0-1.104.888-2 1.992-2H21.01ZM21 5H3v14h18V5Z" fill="currentColor"></path></svg>',
  [FieldType.Formula]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="FormulaOutlined"><path d="M11 6.5C11 4.011 13.028 2 15.51 2 17.98 2 20 4.002 20 6.48v.02a1 1 0 1 1-2 0v-.02A2.489 2.489 0 0 0 15.51 4 2.508 2.508 0 0 0 13 6.5V10h4a1 1 0 1 1 0 2h-4v5.5c0 2.489-2.028 4.5-4.51 4.5A4.489 4.489 0 0 1 4 17.52v-.02a1 1 0 1 1 2 0v.02A2.489 2.489 0 0 0 8.49 20 2.508 2.508 0 0 0 11 17.5V12H8a1 1 0 1 1 0-2h3V6.5Z" fill="currentColor"></path></svg>',
  [FieldType.GroupChat]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="GroupOutlined"><path d="M8.5 5a2.5 2.5 0 1 0 .001 5.001A2.5 2.5 0 0 0 8.5 5ZM4 7.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM5.835 15C4.015 15 2.5 16.498 2.5 18.4V20h12v-1.6c0-1.901-1.515-3.4-3.335-3.4h-5.33ZM.5 18.4c0-2.982 2.39-5.4 5.335-5.4h5.33c2.945 0 5.335 2.418 5.335 5.4V20c0 1.1-.9 2-2 2h-12c-1.1 0-2-.9-2-2v-1.6Zm22 2.6h-4.135v-2H21.5v-.6c0-1.002-.845-1.9-2-1.9h-1.31a5.46 5.46 0 0 0-.985-2H19.5c2.21 0 4 1.746 4 3.9V20c.025.535-.49 1.02-1 1Zm-6-11a1.001 1.001 0 1 1 1 1c-.55 0-1-.447-1-1Zm1-3a3.001 3.001 0 0 0 0 6 3.001 3.001 0 0 0 0-6Z" fill="currentColor"></path></svg>',
  [FieldType.Location]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="LocalOutlined"><path d="M20 10.5a8 8 0 1 0-16 0c0 3.283 2.582 6.844 8.001 10.593C17.42 17.352 20 13.793 20 10.5Zm-7.443 12.633a1 1 0 0 1-1.113 0C5.148 18.911 2 14.7 2 10.5 2 4.977 6.477.5 12 .5s10 4.477 10 10c0 4.211-3.148 8.422-9.443 12.633ZM12 14.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor"></path></svg>',
  [FieldType.Lookup]: 'L',
  [FieldType.ModifiedTime]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CalendarLineOutlined"><path d="M7 2a1 1 0 0 1 1 1h8a1 1 0 1 1 2 0h2a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a1 1 0 0 1 1-1Zm9 3H8a1 1 0 0 1-2 0H4v15h16V5h-2a1 1 0 1 1-2 0ZM9 15a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3 5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3-5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Z" fill="currentColor"></path></svg>',
  [FieldType.ModifiedUser]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MemberOutlined"><path d="M9 13h6c2.761 0 6 1.929 6 5.4V20c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-1.6C3 14.932 6.239 13 9 13Zm10 7v-1.667C19 16.232 16.871 15 15 15H9c-1.83 0-4 1.172-4 3.333V20h14Zm-7-8a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"></path></svg>',
  [FieldType.MultiSelect]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="GroupSelectionOutlined"><path d="M6.707 3.707a1 1 0 0 0-1.414-1.414L3 4.586l-.793-.793A1 1 0 0 0 .793 5.207l1.5 1.5a1 1 0 0 0 1.414 0l3-3ZM10 3a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H10Zm0 8a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H10Zm0 8a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H10Zm-3.293-.293a1 1 0 1 0-1.414-1.414L3 19.586l-.793-.793a1 1 0 0 0-1.414 1.414l1.5 1.5a1 1 0 0 0 1.414 0l3-3Zm0-8.914a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0l-1.5-1.5a1 1 0 1 1 1.414-1.414l.793.793 2.293-2.293a1 1 0 0 1 1.414 0Z" fill="currentColor"></path></svg>',
  [FieldType.NotSupport]: 'N',
  [FieldType.Number]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="NumberOutlined"><path d="M8.774 2.14a1 1 0 0 1 .85 1.129L9.242 6h6.98l.423-3.01a1 1 0 1 1 1.98.279L18.242 6H22a1 1 0 1 1 0 2h-4.04l-.984 7H20a1 1 0 1 1 0 2h-3.305l-.575 4.093a1 1 0 1 1-1.98-.278L14.674 17h-6.98l-.575 4.093a1 1 0 1 1-1.98-.278L5.674 17H2a1 1 0 1 1 0-2h3.956l.984-7H4a1 1 0 1 1 0-2h3.221l.423-3.01a1 1 0 0 1 1.13-.85ZM14.956 15l.984-7H8.96l-.984 7h6.98Z" fill="currentColor"></path></svg>',
  [FieldType.Phone]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CallOutlined"><path d="M16.341 15.332c-.726.574-2.054 1.092-3.386.367-.816-.445-1.67-1.17-2.536-2.035-.87-.87-1.596-1.726-2.04-2.546-.717-1.322-.21-2.638.353-3.361l.215-.277-1.675-3.909L3.754 5.02c.15 2.762.926 6.583 4.827 10.483 3.9 3.9 7.72 4.677 10.482 4.826l1.45-3.518-3.915-1.682-.257.204ZM2.961 3.183 6.51 1.722a2 2 0 0 1 2.6 1.061l1.675 3.91a2 2 0 0 1-.26 2.016l-.215.276c-.267.344-.381.796-.173 1.18.306.565.872 1.26 1.696 2.084.822.822 1.514 1.386 2.079 1.693.386.211.843.094 1.188-.179l.257-.204a2 2 0 0 1 2.031-.269l3.914 1.682a2 2 0 0 1 1.06 2.599l-1.463 3.551c-.308.75-1.038 1.249-1.848 1.208-3.116-.155-7.5-1.03-11.885-5.414-4.384-4.384-5.259-8.768-5.414-11.885-.04-.81.459-1.539 1.208-1.848Z" fill="currentColor"></path></svg>',
  [FieldType.Progress]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="BitableProgressOutlined"><path d="M16.5 6.5c1.49 0 1.943.01 2.28.077a4 4 0 0 1 3.143 3.143c.067.337.077.79.077 2.28 0 1.49-.01 1.943-.077 2.28a4 4 0 0 1-3.143 3.143c-.337.067-.79.077-2.28.077h-9c-1.49 0-1.943-.01-2.28-.077a4 4 0 0 1-3.143-3.143C2.01 13.943 2 13.49 2 12c0-1.49.01-1.943.077-2.28A4 4 0 0 1 5.22 6.577c.337-.067.79-.077 2.28-.077h9ZM.115 9.33C0 9.91 0 10.605 0 12s0 2.09.115 2.67a6 6 0 0 0 4.714 4.715c.58.115 1.277.115 2.671.115h9c1.394 0 2.09 0 2.67-.115a6 6 0 0 0 4.715-4.715C24 14.09 24 13.395 24 12s0-2.09-.115-2.67a6 6 0 0 0-4.715-4.715C18.59 4.5 17.895 4.5 16.5 4.5h-9c-1.394 0-2.091 0-2.67.115A6 6 0 0 0 .114 9.33Z" fill="currentColor"></path><path d="M16.818 8h-2.74L10.6 16h2.74l3.478-8ZM9.703 8h2.74l-3.479 8H7.5c-.565 0-.958 0-1.266-.023L9.703 8ZM8.067 8H7.5c-.93 0-1.395 0-1.776.102a3 3 0 0 0-2.122 2.121C3.5 10.605 3.5 11.07 3.5 12c0 .93 0 1.395.102 1.777a3 3 0 0 0 1.212 1.705L8.067 8Z" fill="currentColor"></path></svg>',
  [FieldType.Rating]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CollectionOutlined"><path d="m12 3.687 2.443 3.783a3 3 0 0 0 1.735 1.268l4.35 1.179-2.842 3.543a3 3 0 0 0-.656 2.03l.232 4.535-4.182-1.613a3 3 0 0 0-2.16 0l-4.182 1.613.232-4.534a3 3 0 0 0-.656-2.03L3.47 9.916l4.35-1.18A3 3 0 0 0 9.557 7.47L12 3.687Zm1.26-1.736a1.5 1.5 0 0 0-2.52 0L7.877 6.385a1 1 0 0 1-.579.422L2.211 8.186a1.5 1.5 0 0 0-.778 2.386l3.32 4.14a1 1 0 0 1 .22.677L4.7 20.692a1.5 1.5 0 0 0 2.038 1.476l4.901-1.89a1 1 0 0 1 .72 0l4.9 1.89a1.5 1.5 0 0 0 2.038-1.476l-.27-5.303a1 1 0 0 1 .218-.677l3.32-4.14a1.5 1.5 0 0 0-.777-2.386L16.7 6.807a1 1 0 0 1-.578-.422L13.26 1.95Z" fill="currentColor"></path></svg>',
  [FieldType.SingleLink]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="SheetOnedatareferenceOutlined"><path d="M4 1a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4Zm10 2v13H4V3h10Zm8.982 13.513a.504.504 0 0 0 .018-.136V11.5a.5.5 0 0 0-.9-.3l-3.135 4.18a.5.5 0 0 0 .292.788l1.713.38A5 5 0 0 1 16 21h-2.5a1 1 0 1 0 0 2H16a7 7 0 0 0 6.982-6.487Z" fill="currentColor"></path></svg>',
  [FieldType.SingleSelect]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="DownRoundOutlined"><path d="M7.755 11.658a1 1 0 0 1 1.416-1.415L12 13.07l2.828-2.829a1 1 0 0 1 1.416 1.416c-1.181 1.189-2.356 2.386-3.553 3.56a.987.987 0 0 1-1.383 0c-1.196-1.175-2.371-2.371-3.553-3.56Z" fill="currentColor"></path><path d="M12 23C5.925 23 1 18.075 1 12S5.925 1 12 1s11 4.925 11 11-4.925 11-11 11Zm0-2a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" fill="currentColor"></path></svg>',
  [FieldType.Text]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="StyleOutlined"><path d="M14 5a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-8Zm1 7a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-6a1 1 0 0 1-1-1Zm3 5a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Zm-3.201 4.223-2.449-5.946H4.77a1.16 1.16 0 0 1-.187-.016L2.498 21.17a1.105 1.105 0 1 1-2.084-.736L6.562 3.013c.507-1.435 2.517-1.486 3.096-.08l7.184 17.448a1.105 1.105 0 0 1-2.043.841ZM8.165 5.113l-2.808 7.954h6.083L8.165 5.112Z" fill="currentColor"></path></svg>',
  [FieldType.Url]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="GlobalLinkOutlined"><path d="M18.849 2.699a5.037 5.037 0 0 0-7.1.97L8.97 7.372a4.784 4.784 0 0 0 .957 6.699l.972.729a1 1 0 0 0 1.2-1.6l-.972-.73a2.784 2.784 0 0 1-.557-3.898l2.777-3.703a3.037 3.037 0 1 1 4.8 3.72l-1.429 1.786a1 1 0 1 0 1.562 1.25l1.43-1.788a5.037 5.037 0 0 0-.862-7.138Z" fill="currentColor"></path><path d="M5.152 21.301a5.037 5.037 0 0 0 7.1-.97l2.777-3.703a4.784 4.784 0 0 0-.957-6.699L13.1 9.2a1 1 0 0 0-1.2 1.6l.973.73a2.784 2.784 0 0 1 .556 3.898l-2.777 3.703a3.037 3.037 0 1 1-4.8-3.72l1.429-1.786a1 1 0 0 0-1.562-1.25l-1.43 1.787a5.037 5.037 0 0 0 .863 7.14Z" fill="currentColor"></path></svg>',
  [FieldType.User]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MemberOutlined"><path d="M9 13h6c2.761 0 6 1.929 6 5.4V20c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-1.6C3 14.932 6.239 13 9 13Zm10 7v-1.667C19 16.232 16.871 15 15 15H9c-1.83 0-4 1.172-4 3.333V20h14Zm-7-8a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"></path></svg>',
}
export function fieldIcon(type: FieldType) {
  return icons[type]
}
