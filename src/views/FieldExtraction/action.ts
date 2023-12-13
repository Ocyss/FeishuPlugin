import { FieldType } from '@lark-base-open/js-sdk'
import format from 'date-fns/format'

export function start(record: IRecord, data: ModelType & { dateKey: string, delimiter: string, key: string }, fieldType: (id: string) => FieldType): IRecord | null {
  const processValue = (val: any): string => {
    if (Array.isArray(val)) {
      return val
        .map(item => (data.key in item ? item[data.key] : ''))
        .join(data.delimiter)
    }
    else {
      return data.key === '' ? String(val) : data.key in val ? val[data.key] : ''
    }
  }
  const val = record.fields[data.input!]
  if (!val)
    return null
  let res = ''
  if (fieldType(data.input!) === FieldType.DateTime)
    res = format(val as number, data.dateKey)
  else
    res = processValue(val)
  record.fields[data.output!] = res
  return record
}
