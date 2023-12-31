import type { CurrencyCode, IAutonumberField, IBarcodeField, ICheckBoxField, ICreateTimeField, ICreateUserField, ICurrencyField, IDateTimeField, IDuplexLinkField, IEmailField, IField, IFieldMeta, IFormulaField, IGroupField, ILocationField, ILookupField, IModifiedTimeField, IModifiedUserField, IMultiSelectField, INotSupportField, INumberField, IOpenAutoNumber, IOpenCheckbox, IOpenFormulaCellValue, IOpenMultiSelect, IOpenNumber, IOpenPhone, IOpenSegment, IOpenTimestamp, IPhoneField, IProgressField, IRatingField, ISingleLinkField, ISingleSelectField, ITextField, IUrlField, IUserField } from '@lark-base-open/js-sdk'
import { FieldType, NumberFormatter, RatingIconType } from '@lark-base-open/js-sdk'
import type { FieldMaps } from '@/types'

function _TextFieldToStr(item: any): string {
  switch (typeof item) {
    case 'string':
      return item
    case 'number':
      return item.toString()
    case 'object':
      return item.text ?? item.fullAddress ?? item.name ?? item.enName ?? item.link ?? item.value ?? ''
  }
  return ''
}

// 多行文本转文本
export function TextFieldToStr(val: IOpenCellValue | IOpenSegment[], separator = '') {
  if (!Array.isArray(val) || !val)
    return _TextFieldToStr(val)
  return val.map(_TextFieldToStr).join(separator)
}

export function NumberFieldFormat(value: number, formatter: NumberFormatter): string {
  switch (formatter) {
    case NumberFormatter.INTEGER:
      return value.toFixed(0)
    case NumberFormatter.DIGITAL_ROUNDED_1:
      return value.toFixed(1)
    case NumberFormatter.DIGITAL_ROUNDED_2:
      return value.toFixed(2)
    case NumberFormatter.DIGITAL_ROUNDED_3:
      return value.toFixed(3)
    case NumberFormatter.DIGITAL_ROUNDED_4:
      return value.toFixed(4)
    case NumberFormatter.DIGITAL_THOUSANDS:
      return value.toLocaleString()
    case NumberFormatter.DIGITAL_THOUSANDS_DECIMALS:
      return value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
    case NumberFormatter.PERCENTAGE_ROUNDED:
      return `${(value * 100).toFixed(0)}%`
    case NumberFormatter.PERCENTAGE:
      return `${(value * 100).toFixed(2)}%`
    default:
      return value.toString()
  }
}

const currencySymbols: Record<CurrencyCode, string> = {
  AED: 'د.إ',
  AUD: '$',
  BRL: 'R$',
  CAD: '$',
  CHF: 'CHF',
  CNY: '￥',
  EUR: '€',
  GBP: '£',
  HKD: '$',
  IDR: 'Rp',
  INR: '₹',
  JPY: '¥',
  KRW: '₩',
  MOP: 'MOP$',
  MXN: 'Mex$',
  MYR: 'RM',
  PHP: '₱',
  PLN: 'zł',
  RUB: '₽',
  SGD: '$',
  THB: '฿',
  TRY: '₺',
  TWD: 'NT$',
  USD: '$',
  VND: '₫',
}

export function CurrencyFieldFormat(val: number, code: CurrencyCode, digits: number) {
  return `${currencySymbols[code]}${val.toFixed(digits)}`
}

/* eslint-disable perfectionist/sort-objects */
const ratingIcon: Record<RatingIconType, string> = {
  [RatingIconType.STAR]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingStarColorful"><path d="M10.74 1.951a1.5 1.5 0 0 1 2.52 0l2.863 4.434a1 1 0 0 0 .578.423l5.088 1.378a1.5 1.5 0 0 1 .777 2.386l-3.32 4.14a1 1 0 0 0-.219.677l.271 5.303a1.5 1.5 0 0 1-2.037 1.477l-4.901-1.891a1 1 0 0 0-.72 0l-4.9 1.89a1.5 1.5 0 0 1-2.04-1.475l.271-5.303a1 1 0 0 0-.218-.677l-3.32-4.14a1.5 1.5 0 0 1 .777-2.386l5.087-1.378a1 1 0 0 0 .579-.423L10.74 1.95Z" fill="#FFC60A"></path></svg>',
  [RatingIconType.HEART]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingLikeColorful"><path d="M16.233 3c-.809 0-1.54.192-2.2.544-1.204.645-2.857.646-4.061 0A4.574 4.574 0 0 0 7.776 3C4.591 3 2 5.9 2 9.475c0 2.133.93 3.628 1.674 4.825 2.151 3.498 7.35 7.256 7.577 7.44.226.182.478.26.743.26.264 0 .516-.092.744-.26.227-.184 5.423-3.954 7.588-7.44C21.07 13.103 22 11.608 22 9.475 21.998 5.914 19.404 3 16.233 3Z" fill="#F54A45"></path></svg>',
  [RatingIconType.THUMBSUP]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingThumbsupColorful"><path d="M21.108 13.371c-.01-.55.099-1.112.297-1.625.127-.332.195-.687.195-1.05 0-1.046-.603-2.036-1.572-2.588a1.914 1.914 0 0 0-.823-.217h-3.976a2 2 0 0 1-1.997-2.1l.038-.763c.034-.692-.125-1.518-.473-1.875-.24-.247-.442-.418-.763-.552a2.626 2.626 0 0 0-1.018-.201c-1.248 0-2.352.815-2.683 1.983l-2.061 7.242a.004.004 0 0 1-.004.003.004.004 0 0 0-.004.004V19.6a2 2 0 0 0 2 2h9.335c.22 0 .437-.042.636-.126 1.143-.473 1.88-1.556 1.88-2.758 0-.549.102-1.11.3-1.62a2.94 2.94 0 0 0 .196-1.053c0-.548.103-1.109.3-1.62.13-.333.197-.688.197-1.052ZM2.4 12.374v8.48c0 .413.343.746.768.746a1.56 1.56 0 0 0 1.56-1.56v-6.852a1.56 1.56 0 0 0-1.56-1.56.756.756 0 0 0-.768.746Z" fill="#FF811A"></path></svg>',
  [RatingIconType.FIRE]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingHotColorful"><path d="M19.874 10.975a8.39 8.39 0 0 0-2.001-2.78l-.703-.645a.195.195 0 0 0-.313.08l-.314.9c-.196.565-.555 1.142-1.065 1.709a.151.151 0 0 1-.099.048.133.133 0 0 1-.104-.036.142.142 0 0 1-.048-.116c.09-1.453-.345-3.092-1.296-4.877-.787-1.482-1.881-2.638-3.248-3.445l-.997-.586a.193.193 0 0 0-.29.176l.054 1.159c.036.792-.056 1.492-.273 2.074a6.885 6.885 0 0 1-1.135 1.967c-.343.415-.726.79-1.146 1.113a8.513 8.513 0 0 0-2.422 2.933 8.396 8.396 0 0 0-.205 7.009 8.483 8.483 0 0 0 4.524 4.48 8.495 8.495 0 0 0 3.305.662 8.536 8.536 0 0 0 3.305-.659 8.415 8.415 0 0 0 2.702-1.803 8.36 8.36 0 0 0 2.491-5.961 8.31 8.31 0 0 0-.722-3.402Z" fill="#F54A45"></path></svg>',
  [RatingIconType.SMILE]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingSmileColorful"><path d="M12 22.955c6.075 0 11-4.925 11-11s-4.925-11-11-11-11 4.925-11 11 4.925 11 11 11Zm-4-16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Zm7 1a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0v-2Zm-7.966 5.999c-.037-.274.19-.499.466-.499h9c.276 0 .503.225.466.499-.307 2.262-2.664 4.001-4.966 4.001s-4.659-1.74-4.966-4.001Z" fill="#FF811A"></path></svg>',
  [RatingIconType.LIGHTNING]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingSpeedColorful"><path d="M19 2h-8.335a.992.992 0 0 0-.926.626l-4.165 9.998c-.114.376-.114.616.146.996.23.29.53.38.78.38H10l-2.436 8.931c-.064.249.006.448.236.599.226.122.48.06.63-.125L18.477 12.2c.353-.399.353-.819.153-1.199-.173-.328-.56-.5-.85-.5H14.5l5.258-6.876c.242-.334.302-.714.062-1.154A.985.985 0 0 0 19 2Z" fill="#25B0E7"></path></svg>',
  [RatingIconType.FLOWER]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingFlowerColorful"><path d="M12 1a4.99 4.99 0 0 1 3.926 1.904 3.977 3.977 0 0 0 1.92 1.301 4.502 4.502 0 0 1 1.67 7.635c-.326.295-.516.72-.516 1.16a4.5 4.5 0 0 1-4.5 4.5c-.505 0-.984.341-1.034.844l-.366 3.661a1.105 1.105 0 0 1-2.2 0l-.366-3.661c-.05-.503-.529-.844-1.034-.844A4.5 4.5 0 0 1 5 13c0-.44-.19-.865-.516-1.16a4.502 4.502 0 0 1 1.669-7.635 3.977 3.977 0 0 0 1.92-1.301A4.991 4.991 0 0 1 12 1Zm0 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="#BF3DBF"></path><path d="M19.456 17.695c.846 0 1.404.834 1.08 1.615a5.502 5.502 0 0 1-5.08 3.385 1.157 1.157 0 0 1-1.078-1.615 5.502 5.502 0 0 1 5.078-3.385Zm-14.913 0c-.845 0-1.404.834-1.078 1.615a5.502 5.502 0 0 0 5.079 3.385c.845 0 1.404-.835 1.078-1.615a5.502 5.502 0 0 0-5.079-3.385Z" fill="#BF3DBF"></path></svg>',
  [RatingIconType.NUMBER]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="RatingNpsColorful"><path d="M1 7.4c0-2.24 0-3.36.436-4.216a4 4 0 0 1 1.748-1.748C4.04 1 5.16 1 7.4 1h9.2c2.24 0 3.36 0 4.216.436a4 4 0 0 1 1.748 1.748C23 4.04 23 5.16 23 7.4v9.2c0 2.24 0 3.36-.436 4.216a4 4 0 0 1-1.748 1.748C19.96 23 18.84 23 16.6 23H7.4c-2.24 0-3.36 0-4.216-.436a4 4 0 0 1-1.748-1.748C1 19.96 1 18.84 1 16.6V7.4Z" fill="#5B65F5"></path><path d="M4.983 15.833h1.558l.554-7.443H5.748c-.194.767-.911 1.355-1.987 1.376l-.079 1.06h1.674l-.373 5.007Zm2.929 0h5.4l.1-1.333H9.895c.093-.263.3-.504.652-.704l1.548-.86c.999-.546 1.542-1.334 1.613-2.289.098-1.312-.841-2.414-2.473-2.414-1.674 0-2.77 1.155-2.867 2.456-.014.19-.01.42.013.536l1.491.042a1.429 1.429 0 0 1-.022-.41c.054-.724.554-1.217 1.28-1.217.632 0 1.04.45.996 1.039-.04.546-.319.892-.989 1.27l-1.285.714c-1.383.766-1.834 1.879-1.941 3.17Zm8.76.157c1.726 0 2.874-1.133 2.972-2.446.104-1.396-.824-2.225-1.906-2.256l1.973-1.617.096-1.28h-4.98l-.098 1.333h3.02l-2.055 1.732.593 1.08c.176-.094.454-.157.675-.157.632 0 1.153.357 1.096 1.123-.046.61-.527 1.134-1.296 1.134-.747 0-1.223-.535-1.197-1.301l-1.518.314c.012 1.25.951 2.341 2.625 2.341Z" fill="#fff"></path></svg>',
}
/* eslint-enable */

export function RatingFieldIcon(type: RatingIconType) {
  return ratingIcon[type]
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
    [P in AllProperties<T>]: T extends { [K in P]?: infer U } ? U : never
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

export interface FieldTypeHandlers extends Record<FieldType, IField> {
  [FieldType.NotSupport]: INotSupportField
  [FieldType.Text]: ITextField
  [FieldType.Number]: INumberField
  [FieldType.SingleSelect]: ISingleSelectField
  [FieldType.MultiSelect]: IMultiSelectField
  [FieldType.DateTime]: IDateTimeField
  [FieldType.Checkbox]: ICheckBoxField
  [FieldType.User]: IUserField
  [FieldType.Phone]: IPhoneField
  [FieldType.Url]: IUrlField
  [FieldType.Attachment]: IAttachmentField
  [FieldType.SingleLink]: ISingleLinkField
  [FieldType.Lookup]: ILookupField
  [FieldType.Formula]: IFormulaField
  [FieldType.DuplexLink]: IDuplexLinkField
  [FieldType.Location]: ILocationField
  [FieldType.GroupChat]: IGroupField
  [FieldType.CreatedTime]: ICreateTimeField
  [FieldType.ModifiedTime]: IModifiedTimeField
  [FieldType.CreatedUser]: ICreateUserField
  [FieldType.ModifiedUser]: IModifiedUserField
  [FieldType.AutoNumber]: IAutonumberField
  [FieldType.Barcode]: IBarcodeField
  [FieldType.Progress]: IProgressField
  [FieldType.Currency]: ICurrencyField
  [FieldType.Rating]: IRatingField
  [FieldType.Email]: IEmailField
}

export interface FieldValueHandlers extends Record<FieldType, IOpenCellValue> {
  [FieldType.NotSupport]: null
  [FieldType.Text]: IOpenSegment[]
  [FieldType.Number]: IOpenNumber
  [FieldType.SingleSelect]: IOpenSingleSelect
  [FieldType.MultiSelect]: IOpenMultiSelect
  [FieldType.DateTime]: IOpenTimestamp
  [FieldType.Checkbox]: IOpenCheckbox
  [FieldType.User]: IOpenUser[]
  [FieldType.Phone]: IOpenPhone
  [FieldType.Url]: IOpenUrlSegment[]
  [FieldType.Attachment]: IOpenAttachment[]
  [FieldType.SingleLink]: IOpenLink
  [FieldType.Lookup]: IOpenFormulaCellValue
  [FieldType.Formula]: IOpenFormulaCellValue
  [FieldType.DuplexLink]: IOpenLink
  [FieldType.Location]: IOpenLocation
  [FieldType.GroupChat]: IOpenGroupChat[]
  [FieldType.CreatedTime]: IOpenTimestamp
  [FieldType.ModifiedTime]: IOpenTimestamp
  [FieldType.CreatedUser]: IOpenUser[]
  [FieldType.ModifiedUser]: IOpenUser[]
  [FieldType.AutoNumber]: IOpenAutoNumber
  [FieldType.Barcode]: IOpenSegment[]
  [FieldType.Progress]: IOpenNumber
  [FieldType.Currency]: number
  [FieldType.Rating]: IOpenNumber
  [FieldType.Email]: string
  [FieldType.Denied]: null
}

const icons: Record<FieldType, string> = {
  [FieldType.Attachment]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="AttachmentOutlined"><path d="M12.304 7.315a1 1 0 0 1 1.414 1.414L8.13 14.317a1.485 1.485 0 0 0 0 2.1l.01.011a1.5 1.5 0 0 0 2.117-.005l7.43-7.43a3.5 3.5 0 0 0 0-4.95l-.036-.037a3.5 3.5 0 0 0-4.95 0l-7.778 7.777a5.521 5.521 0 0 0 7.808 7.809l7.07-7.07a1 1 0 0 1 1.415 1.414l-7.07 7.07A7.521 7.521 0 0 1 3.509 10.37l7.778-7.778a5.5 5.5 0 0 1 7.778 0l.037.037a5.5 5.5 0 0 1 0 7.778l-7.43 7.43a3.5 3.5 0 0 1-4.939.012l-.006-.006-.012-.012a3.485 3.485 0 0 1 0-4.928l5.589-5.588Z" fill="currentColor"></path></svg>',
  [FieldType.AutoNumber]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="NumberedListNewOutlined"><path d="M3.1 7.5V3.824l-.58.41a.9.9 0 1 1-1.04-1.469l1.528-1.08a1.2 1.2 0 0 1 1.892.98V7.5a.9.9 0 0 1-1.8 0Zm.9 3.586a1 1 0 0 0-1 1V17H1.37a.5.5 0 0 0-.431.752l2.63 4.508a.5.5 0 0 0 .863 0l2.63-4.508A.5.5 0 0 0 6.63 17H5v-4.914a1 1 0 0 0-1-1Zm6 8a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H10Zm-1-7a1 1 0 0 1 1-1h12a1 1 0 0 1 0 2H10a1 1 0 0 1-1-1ZM10 3a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H10Z" fill="currentColor"></path></svg>',
  [FieldType.Barcode]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="BarcodeOutlined"><path d="M1 5a2 2 0 0 1 2-2h3a1 1 0 0 1 0 2H3v3a1 1 0 0 1-2 0V5Zm22 0a2 2 0 0 0-2-2h-3a1 1 0 1 0 0 2h3v3a1 1 0 1 0 2 0V5Zm-2 16a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3h-3a1 1 0 1 0 0 2h3ZM1 19a2 2 0 0 0 2 2h3a1 1 0 1 0 0-2H3v-3a1 1 0 1 0-2 0v3ZM9 8a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V8ZM6 7a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm11 1a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V8Zm-3-1a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Z" fill="currentColor"></path></svg>',
  [FieldType.Checkbox]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="TodoOutlined"><path d="M17.207 10.207a1 1 0 0 0-1.414-1.414L11 13.586l-2.293-2.293a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l5.5-5.5Z" fill="currentColor"></path><path d="M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm2 0v16h16V4H4Z" fill="currentColor"></path></svg>',
  [FieldType.CreatedTime]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CalendarLineOutlined"><path d="M7 2a1 1 0 0 1 1 1h8a1 1 0 1 1 2 0h2a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a1 1 0 0 1 1-1Zm9 3H8a1 1 0 0 1-2 0H4v15h16V5h-2a1 1 0 1 1-2 0ZM9 15a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3 5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3-5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Z" fill="currentColor"></path></svg>',
  [FieldType.CreatedUser]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MemberOutlined"><path d="M9 13h6c2.761 0 6 1.929 6 5.4V20c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-1.6C3 14.932 6.239 13 9 13Zm10 7v-1.667C19 16.232 16.871 15 15 15H9c-1.83 0-4 1.172-4 3.333V20h14Zm-7-8a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"></path></svg>',
  [FieldType.Currency]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CurrencyYuanOutlined"><path d="M15.772 7.463a.9.9 0 0 0-1.544-.926l-2.084 3.473a1.004 1.004 0 0 0-.288 0L9.772 6.537a.9.9 0 0 0-1.544.926L10.05 10.5H7.9a.9.9 0 1 0 0 1.8H11V14H7.9a.9.9 0 1 0 0 1.8H11V18a1 1 0 0 0 1.999 0v-2.2H16.1a.9.9 0 1 0 0-1.8H13v-1.7h3.1a.9.9 0 1 0 0-1.8h-2.15l1.822-3.037Z" fill="currentColor"></path><path d="M23.5 12c0 6.351-5.149 11.5-11.5 11.5S.5 18.351.5 12 5.649.5 12 .5 23.5 5.649 23.5 12Zm-21 0a9.5 9.5 0 1 0 19 0 9.5 9.5 0 0 0-19 0Z" fill="currentColor"></path></svg>',
  [FieldType.DateTime]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CalendarLineOutlined"><path d="M7 2a1 1 0 0 1 1 1h8a1 1 0 1 1 2 0h2a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a1 1 0 0 1 1-1Zm9 3H8a1 1 0 0 1-2 0H4v15h16V5h-2a1 1 0 1 1-2 0ZM9 15a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3 5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3-5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Z" fill="currentColor"></path></svg>',
  [FieldType.Denied]: 'D',
  [FieldType.DuplexLink]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="SheetDatareferenceOutlined"><path d="M12 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V4Zm2 0v6h6V4h-6ZM2 14a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Zm2 0v6h6v-6H4Zm17 .993V17a5 5 0 0 1-5 5h-1a1 1 0 1 1 0-2h1a3 3 0 0 0 2.987-2.724l-1.453-.161a.5.5 0 0 1-.298-.85l2.91-2.911a.5.5 0 0 1 .854.353v1.286ZM3 9.02V7a5 5 0 0 1 5-5h1a1 1 0 0 1 0 2H8a3 3 0 0 0-2.986 2.701l1.86.186a.5.5 0 0 1 .285.87l-3.325 2.992A.5.5 0 0 1 3 10.377V9.02Z" fill="currentColor"></path></svg>',
  [FieldType.Email]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MailOutlined"><path d="M5.558 10.214a1 1 0 0 1 .925-1.77l5.481 2.861 5.481-2.862a1 1 0 0 1 .925 1.772l-5.887 3.074a.995.995 0 0 1-.52.112.994.994 0 0 1-.518-.112l-5.887-3.075Z" fill="currentColor"></path><path d="M21.009 3C22.113 3 23 3.895 23 5v14c0 1.105-.888 2-1.992 2H2.99A1.993 1.993 0 0 1 1 19V5c0-1.104.888-2 1.992-2H21.01ZM21 5H3v14h18V5Z" fill="currentColor"></path></svg>',
  [FieldType.Formula]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="FormulaOutlined"><path d="M11 6.5C11 4.011 13.028 2 15.51 2 17.98 2 20 4.002 20 6.48v.02a1 1 0 1 1-2 0v-.02A2.489 2.489 0 0 0 15.51 4 2.508 2.508 0 0 0 13 6.5V10h4a1 1 0 1 1 0 2h-4v5.5c0 2.489-2.028 4.5-4.51 4.5A4.489 4.489 0 0 1 4 17.52v-.02a1 1 0 1 1 2 0v.02A2.489 2.489 0 0 0 8.49 20 2.508 2.508 0 0 0 11 17.5V12H8a1 1 0 1 1 0-2h3V6.5Z" fill="currentColor"></path></svg>',
  [FieldType.GroupChat]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="GroupOutlined"><path d="M8.5 5a2.5 2.5 0 1 0 .001 5.001A2.5 2.5 0 0 0 8.5 5ZM4 7.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM5.835 15C4.015 15 2.5 16.498 2.5 18.4V20h12v-1.6c0-1.901-1.515-3.4-3.335-3.4h-5.33ZM.5 18.4c0-2.982 2.39-5.4 5.335-5.4h5.33c2.945 0 5.335 2.418 5.335 5.4V20c0 1.1-.9 2-2 2h-12c-1.1 0-2-.9-2-2v-1.6Zm22 2.6h-4.135v-2H21.5v-.6c0-1.002-.845-1.9-2-1.9h-1.31a5.46 5.46 0 0 0-.985-2H19.5c2.21 0 4 1.746 4 3.9V20c.025.535-.49 1.02-1 1Zm-6-11a1.001 1.001 0 1 1 1 1c-.55 0-1-.447-1-1Zm1-3a3.001 3.001 0 0 0 0 6 3.001 3.001 0 0 0 0-6Z" fill="currentColor"></path></svg>',
  [FieldType.Location]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="LocalOutlined"><path d="M20 10.5a8 8 0 1 0-16 0c0 3.283 2.582 6.844 8.001 10.593C17.42 17.352 20 13.793 20 10.5Zm-7.443 12.633a1 1 0 0 1-1.113 0C5.148 18.911 2 14.7 2 10.5 2 4.977 6.477.5 12 .5s10 4.477 10 10c0 4.211-3.148 8.422-9.443 12.633ZM12 14.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor"></path></svg>',
  [FieldType.Lookup]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="LookupOutlined"><path d="M20 4H4v16h7v2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6h-2V4Z" fill="currentColor"></path><path d="M7 6.5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H7Zm-1 5a1 1 0 0 1 1-1h3.5a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h2.5a1 1 0 1 0 0-2H7Zm13.939 4.58a5 5 0 1 0-1.522 1.298l1.698 1.953a1 1 0 0 0 1.51-1.312l-1.686-1.939ZM17 19a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor"></path></svg>',
  [FieldType.ModifiedTime]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CalendarLineOutlined"><path d="M7 2a1 1 0 0 1 1 1h8a1 1 0 1 1 2 0h2a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a1 1 0 0 1 1-1Zm9 3H8a1 1 0 0 1-2 0H4v15h16V5h-2a1 1 0 1 1-2 0ZM9 15a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3 5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Zm1.5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1Zm3-5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1Z" fill="currentColor"></path></svg>',
  [FieldType.ModifiedUser]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MemberOutlined"><path d="M9 13h6c2.761 0 6 1.929 6 5.4V20c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-1.6C3 14.932 6.239 13 9 13Zm10 7v-1.667C19 16.232 16.871 15 15 15H9c-1.83 0-4 1.172-4 3.333V20h14Zm-7-8a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"></path></svg>',
  [FieldType.MultiSelect]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="GroupSelectionOutlined"><path d="M6.707 3.707a1 1 0 0 0-1.414-1.414L3 4.586l-.793-.793A1 1 0 0 0 .793 5.207l1.5 1.5a1 1 0 0 0 1.414 0l3-3ZM10 3a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H10Zm0 8a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H10Zm0 8a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H10Zm-3.293-.293a1 1 0 1 0-1.414-1.414L3 19.586l-.793-.793a1 1 0 0 0-1.414 1.414l1.5 1.5a1 1 0 0 0 1.414 0l3-3Zm0-8.914a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414 0l-1.5-1.5a1 1 0 1 1 1.414-1.414l.793.793 2.293-2.293a1 1 0 0 1 1.414 0Z" fill="currentColor"></path></svg>',
  [FieldType.NotSupport]: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="ButtonOutlined"><path d="M21 6.133H3V16.8h9.662l1.214 3.2H3c-1.105 0-2-.955-2-2.133V6.133C1 4.955 1.895 4 3 4h18c1.105 0 2 .955 2 2.133v7.786l-2-.91V6.132Z" fill="currentColor"></path><path d="M23.172 18.16a1 1 0 0 0 .182-1.883l-8.366-3.808a1 1 0 0 0-1.35 1.265l3.26 8.595a1 1 0 0 0 1.89-.06l1.018-3.307 3.366-.802Z" fill="currentColor"></path></svg>',
  [FieldType.Number]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="NumberOutlined"><path d="M8.774 2.14a1 1 0 0 1 .85 1.129L9.242 6h6.98l.423-3.01a1 1 0 1 1 1.98.279L18.242 6H22a1 1 0 1 1 0 2h-4.04l-.984 7H20a1 1 0 1 1 0 2h-3.305l-.575 4.093a1 1 0 1 1-1.98-.278L14.674 17h-6.98l-.575 4.093a1 1 0 1 1-1.98-.278L5.674 17H2a1 1 0 1 1 0-2h3.956l.984-7H4a1 1 0 1 1 0-2h3.221l.423-3.01a1 1 0 0 1 1.13-.85ZM14.956 15l.984-7H8.96l-.984 7h6.98Z" fill="currentColor"></path></svg>',
  [FieldType.Phone]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CallOutlined"><path d="M16.341 15.332c-.726.574-2.054 1.092-3.386.367-.816-.445-1.67-1.17-2.536-2.035-.87-.87-1.596-1.726-2.04-2.546-.717-1.322-.21-2.638.353-3.361l.215-.277-1.675-3.909L3.754 5.02c.15 2.762.926 6.583 4.827 10.483 3.9 3.9 7.72 4.677 10.482 4.826l1.45-3.518-3.915-1.682-.257.204ZM2.961 3.183 6.51 1.722a2 2 0 0 1 2.6 1.061l1.675 3.91a2 2 0 0 1-.26 2.016l-.215.276c-.267.344-.381.796-.173 1.18.306.565.872 1.26 1.696 2.084.822.822 1.514 1.386 2.079 1.693.386.211.843.094 1.188-.179l.257-.204a2 2 0 0 1 2.031-.269l3.914 1.682a2 2 0 0 1 1.06 2.599l-1.463 3.551c-.308.75-1.038 1.249-1.848 1.208-3.116-.155-7.5-1.03-11.885-5.414-4.384-4.384-5.259-8.768-5.414-11.885-.04-.81.459-1.539 1.208-1.848Z" fill="currentColor"></path></svg>',
  [FieldType.Progress]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="BitableProgressOutlined"><path d="M16.5 6.5c1.49 0 1.943.01 2.28.077a4 4 0 0 1 3.143 3.143c.067.337.077.79.077 2.28 0 1.49-.01 1.943-.077 2.28a4 4 0 0 1-3.143 3.143c-.337.067-.79.077-2.28.077h-9c-1.49 0-1.943-.01-2.28-.077a4 4 0 0 1-3.143-3.143C2.01 13.943 2 13.49 2 12c0-1.49.01-1.943.077-2.28A4 4 0 0 1 5.22 6.577c.337-.067.79-.077 2.28-.077h9ZM.115 9.33C0 9.91 0 10.605 0 12s0 2.09.115 2.67a6 6 0 0 0 4.714 4.715c.58.115 1.277.115 2.671.115h9c1.394 0 2.09 0 2.67-.115a6 6 0 0 0 4.715-4.715C24 14.09 24 13.395 24 12s0-2.09-.115-2.67a6 6 0 0 0-4.715-4.715C18.59 4.5 17.895 4.5 16.5 4.5h-9c-1.394 0-2.091 0-2.67.115A6 6 0 0 0 .114 9.33Z" fill="currentColor"></path><path d="M16.818 8h-2.74L10.6 16h2.74l3.478-8ZM9.703 8h2.74l-3.479 8H7.5c-.565 0-.958 0-1.266-.023L9.703 8ZM8.067 8H7.5c-.93 0-1.395 0-1.776.102a3 3 0 0 0-2.122 2.121C3.5 10.605 3.5 11.07 3.5 12c0 .93 0 1.395.102 1.777a3 3 0 0 0 1.212 1.705L8.067 8Z" fill="currentColor"></path></svg>',
  [FieldType.Rating]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="CollectionOutlined"><path d="m12 3.687 2.443 3.783a3 3 0 0 0 1.735 1.268l4.35 1.179-2.842 3.543a3 3 0 0 0-.656 2.03l.232 4.535-4.182-1.613a3 3 0 0 0-2.16 0l-4.182 1.613.232-4.534a3 3 0 0 0-.656-2.03L3.47 9.916l4.35-1.18A3 3 0 0 0 9.557 7.47L12 3.687Zm1.26-1.736a1.5 1.5 0 0 0-2.52 0L7.877 6.385a1 1 0 0 1-.579.422L2.211 8.186a1.5 1.5 0 0 0-.778 2.386l3.32 4.14a1 1 0 0 1 .22.677L4.7 20.692a1.5 1.5 0 0 0 2.038 1.476l4.901-1.89a1 1 0 0 1 .72 0l4.9 1.89a1.5 1.5 0 0 0 2.038-1.476l-.27-5.303a1 1 0 0 1 .218-.677l3.32-4.14a1.5 1.5 0 0 0-.777-2.386L16.7 6.807a1 1 0 0 1-.578-.422L13.26 1.95Z" fill="currentColor"></path></svg>',
  [FieldType.SingleLink]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="SheetOnedatareferenceOutlined"><path d="M4 1a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4Zm10 2v13H4V3h10Zm8.982 13.513a.504.504 0 0 0 .018-.136V11.5a.5.5 0 0 0-.9-.3l-3.135 4.18a.5.5 0 0 0 .292.788l1.713.38A5 5 0 0 1 16 21h-2.5a1 1 0 1 0 0 2H16a7 7 0 0 0 6.982-6.487Z" fill="currentColor"></path></svg>',
  [FieldType.SingleSelect]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="DownRoundOutlined"><path d="M7.755 11.658a1 1 0 0 1 1.416-1.415L12 13.07l2.828-2.829a1 1 0 0 1 1.416 1.416c-1.181 1.189-2.356 2.386-3.553 3.56a.987.987 0 0 1-1.383 0c-1.196-1.175-2.371-2.371-3.553-3.56Z" fill="currentColor"></path><path d="M12 23C5.925 23 1 18.075 1 12S5.925 1 12 1s11 4.925 11 11-4.925 11-11 11Zm0-2a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" fill="currentColor"></path></svg>',
  [FieldType.Text]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="StyleOutlined"><path d="M14 5a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-8Zm1 7a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-6a1 1 0 0 1-1-1Zm3 5a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Zm-3.201 4.223-2.449-5.946H4.77a1.16 1.16 0 0 1-.187-.016L2.498 21.17a1.105 1.105 0 1 1-2.084-.736L6.562 3.013c.507-1.435 2.517-1.486 3.096-.08l7.184 17.448a1.105 1.105 0 0 1-2.043.841ZM8.165 5.113l-2.808 7.954h6.083L8.165 5.112Z" fill="currentColor"></path></svg>',
  [FieldType.Url]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="GlobalLinkOutlined"><path d="M18.849 2.699a5.037 5.037 0 0 0-7.1.97L8.97 7.372a4.784 4.784 0 0 0 .957 6.699l.972.729a1 1 0 0 0 1.2-1.6l-.972-.73a2.784 2.784 0 0 1-.557-3.898l2.777-3.703a3.037 3.037 0 1 1 4.8 3.72l-1.429 1.786a1 1 0 1 0 1.562 1.25l1.43-1.788a5.037 5.037 0 0 0-.862-7.138Z" fill="currentColor"></path><path d="M5.152 21.301a5.037 5.037 0 0 0 7.1-.97l2.777-3.703a4.784 4.784 0 0 0-.957-6.699L13.1 9.2a1 1 0 0 0-1.2 1.6l.973.73a2.784 2.784 0 0 1 .556 3.898l-2.777 3.703a3.037 3.037 0 1 1-4.8-3.72l1.429-1.786a1 1 0 0 0-1.562-1.25l-1.43 1.787a5.037 5.037 0 0 0 .863 7.14Z" fill="currentColor"></path></svg>',
  [FieldType.User]:
    '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-icon="MemberOutlined"><path d="M9 13h6c2.761 0 6 1.929 6 5.4V20c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-1.6C3 14.932 6.239 13 9 13Zm10 7v-1.667C19 16.232 16.871 15 15 15H9c-1.83 0-4 1.172-4 3.333V20h14Zm-7-8a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor"></path></svg>',
}
export function fieldIcon(type: FieldType) {
  return icons[type]
}
