import add from 'date-fns/add'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import set from 'date-fns/set'
import { generateNumber } from 'random-ease'
import { dateFormatterList } from '@/utils/format'
import { TextFieldToStr } from '@/utils/field'
import { useStore } from '@/hooks/useStore'

interface StoreData {
  action: ActionType
  dateKey: null | string
  add: {
    days: number
    hours: number
    minutes: number
    months: number
    seconds: number
    weeks: number
    years: number
  }
  set: {
    date: undefined | number
    hours: undefined | number
    minutes: undefined | number
    month: undefined | number
    seconds: undefined | number
    year: undefined | number
  }
  rand: {
    date: boolean
    hours: boolean
    minutes: boolean
    month: boolean
    seconds: boolean
    year: boolean
  }
}

export enum ActionType {
  Format = 0,
  Add = 1,
  Parse = 2,
  SetMonth = 3,
  Randomize = 4,
}

export function useAction() {
  const modelData = reactive<ModelType>({
    input: null,
    output: null,
  })
  const { store } = useStore()
  /* eslint-disable perfectionist/sort-objects */
  const storeData = store<StoreData>('data', {
    action: ActionType.Format,
    add: {
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
    dateKey: null,
    rand: {
      year: false,
      month: false,
      date: false,
      hours: false,
      minutes: false,
      seconds: false,
    },
    set: {
      year: undefined,
      month: undefined,
      date: undefined,
      hours: undefined,
      minutes: undefined,
      seconds: undefined,
    },
  })
  function createActionOptions(addVal = storeData.value.add, dateKey = storeData.value.dateKey!, randVal = storeData.value.rand, setVal = storeData.value.set) {
    return {
      [ActionType.Add]: (val: number) => add(val, addVal).getTime(),
      [ActionType.Format]: (val: number) => format(val, dateKey),
      [ActionType.Parse]: (val: IOpenSegment[]) => {
        for (const format of dateFormatterList) {
          try {
            const result = parse(TextFieldToStr(val), format, 0).getTime()
            if (!Number.isNaN(result))
              return result
          }
          catch (err) {
            /* Ignore parsing errors */
          }
        }
        return null
      },
      [ActionType.Randomize]: (val: number) => set(val, {
        date: randVal.date ? generateNumber(1, 28) : undefined,
        hours: randVal.hours ? generateNumber(0, 23) : undefined,
        minutes: randVal.minutes ? generateNumber(0, 59) : undefined,
        month: randVal.month ? generateNumber(0, 11) : undefined,
        seconds: randVal.seconds ? generateNumber(0, 59) : undefined,
        year: randVal.year ? generateNumber(1971, 2030) : undefined,
      }).getTime(),
      [ActionType.SetMonth]: (val: number) => set(val, {
        ...setVal,
        month: setVal.month !== undefined ? setVal.month - 1 : undefined,
      }).getTime(),
    }
  }
  function start(record: IRecord, action: ReturnType<typeof createActionOptions>, input = modelData.input, output = modelData.output): IRecord | null {
    if (
      input && output
      && input in record.fields
      && output in record.fields
      && record.fields[input]
    ) {
      const val = record.fields[input]
      record.fields[output] = action[storeData.value.action](val as number & IOpenSegment[])
      return record
    }
    return null
  }
  return {
    createActionOptions,
    modelData,
    start,
    storeData,
  }
}
