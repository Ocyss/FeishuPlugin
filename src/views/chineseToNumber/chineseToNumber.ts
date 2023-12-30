// https://github.com/gdx1231/chineseToNumber
// https://www.npmjs.com/package/zwsz
const chnNumChar: Record<string, number> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'O': 0,
  'o': 0,
  '一': 1,
  '七': 7,
  '三': 3,
  '两': 2,
  '九': 9,
  '二': 2,
  '五': 5,
  '伍': 5,
  '俩': 2,
  '八': 8,
  '六': 6,
  '叁': 3,
  '四': 4,
  '壹': 1,
  '捌': 8,
  '柒': 7,
  '玖': 9,
  '肆': 4,
  '贰': 2,
  '陆': 6,
  '零': 0,
  '０': 0,
  '１': 1,
  '２': 2,
  '３': 3,
  '４': 4,
  '５': 5,
  '６': 6,
  '７': 7,
  '８': 8,
  '９': 9,
}

const chnNameValue: Record<string, { stop?: boolean, value?: number, first?: boolean }> = {
  B: { stop: true, value: 1000 * 1000 * 1000 },
  K: { stop: true, value: 1000 },
  M: { stop: true, value: 1000 * 1000 }, // million

  W: { stop: true, value: 10000 },
  b: { stop: true, value: 1000 * 1000 * 1000 }, // billion
  k: { stop: true, value: 1000 },

  m: { stop: true, value: 1000 * 1000 },
  w: { stop: true, value: 10000 },
  万: { stop: true, value: 10000 },
  亿: { stop: true, value: 100000000 },
  什: { first: true, value: 10 },

  仟: { value: 1000 },
  佰: { value: 100 },
  十: { first: true, value: 10 },
  千: { value: 1000 },

  拾: { first: true, value: 10 },
  百: { value: 100 },

  萬: { stop: true, value: 10000 },

  阡: { value: 1000 },
  陌: { value: 100 },
}
const negatives: Record<string, boolean> = {
  '-': true,
  '负': true,
  '－': true,
}
const positives: Record<string, boolean> = {
  '+': true,
  '正': true,
}
const skipTails: Record<string, boolean> = {
  整: true,
}
function newPart() {
  return { items: [] as [string, { stop?: boolean, value?: number, first?: boolean }, number][], number: 0, scale: 1 }
}

function convertToParts(strs: string[]) {
  const parts = [newPart()]
  let prevName = null
  for (let i = 0; i < strs.length; i++) {
    const alpha = strs[i]

    const name = chnNameValue[alpha]
    const num = chnNumChar[alpha]
    parts[parts.length - 1].items.push([
      alpha,
      name,
      num,
    ])
    if (name) {
      if ((i === 0) && name.first) { // 十
        const number = 10
        parts[parts.length - 1].number = number
      }
      else if (name.stop) {
        parts[parts.length - 1].scale = name.value || 1
        // 创建新的片段
        parts.push(newPart())
        prevName = null
      }
      else {
        if (i === strs.length - 1 && name.value) {
          // console.log(name)
          parts[parts.length - 1].scale = name.value
        }
        prevName = name
      }
      continue
    }

    const nextChar = i === strs.length - 1 ? null : strs[i + 1]

    let nextName = i === strs.length - 1 ? null : chnNameValue[nextChar!]

    if (nextName && nextName.stop)
      nextName = null

    const lastNum = parts[parts.length - 1].number
    let number

    const items = parts[parts.length - 1].items
    const itemPre = items[items.length - 2]// 上一个
    const itemPrePre = items[items.length - 3]// 上上个
    if (nextName == null) {
      if (prevName == null) { // 连续的数字，例如 203
        let skipTen = false
        if (itemPre && itemPre[2] === 0) {
          if (itemPrePre && itemPrePre[1] != null/* 是单位 */) { // 捌仟零六 的零
            skipTen = true
          }
        }
        else if (itemPre && itemPre[1] && itemPre[1].value === 10) { // 十六
          skipTen = true
        }

        if (skipTen)
          number = lastNum + num

        else
          number = lastNum * 10 + num
      }
      else { // 例如 二千五，运算到五
        if (
          itemPre && itemPre[1] && itemPre[1].value === 10
          && (itemPrePre == null || itemPrePre[2] === 0 || itemPrePre[1] != null)
        ) { // 十六
          number = lastNum + num + 10
        }
        else {
          number = lastNum + num
        }
      }
    }
    else {
      if (prevName == null) { // 例如 二千零五十
        number = lastNum + num * (nextName.value ?? 1)
      }
      else {
        number = lastNum + num * (nextName.value ?? 1)
      }
    }
    parts[parts.length - 1].number = number
    prevName = null
    // console.log(`num=${num},  number=${number}`);
  }
  // console.log(parts)
  return parts
}
function convertJflhNum(strs: string[], alpha: string, loc: number) {
  const fenv = strs[loc - 1]
  const fenNum = chnNumChar[fenv]
  if (!fenNum)
    return -1

  // 一元=10角，一元=100分，一元=1000厘，一元=10000毫
  if (alpha === '角')
    return Number(`0.${fenNum}`) * 1

  else if (alpha === '分')
    return Number(`0.0${fenNum}`) * 1

  else if (alpha === '厘')
    return Number(`0.00${fenNum}`) * 1

  else if (alpha === '毫')
    return Number(`0.000${fenNum}`) * 1

  else
    return -1
}
function convertJflh(strs: string[]) { // 角分厘毫
  let sum = 0
  let inc = 0
  for (let i = strs.length - 1; i >= 0; i -= 2) {
    const alpha = strs[i]
    const num = convertJflhNum(strs, alpha, i)
    if (num === -1) {
      break
    }
    else {
      sum += num
      inc++
    }
  }
  return {
    inc,
    strs: strs.splice(0, strs.length - inc * 2),
    sum,
  }
}
/**
 * 处理整数部分
 * @param {*} strs 字符串
 * @returns 整数
 */
function convert(strs: string[]) {
  const jiaofen = convertJflh(strs)
  // console.log(jiaofen);

  strs = jiaofen.strs

  const parts = convertToParts(strs)
  let last = 0
  let scale1 = 1
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    const p = part.number
    scale1 = scale1 * part.scale
    last += p * scale1
  }
  return last + jiaofen.sum
}
/**
 * 处理·小数部分
 * @param {*} strs 字符串
 * @returns 小数
 */
function convertDot(strs: string[]): [number, number, number] {
  let scale = 1
  let skip = 0
  for (let i = strs.length - 1; i >= 0; i--) {
    const alpha = strs[i]
    const name = chnNameValue[alpha] // 结尾的连续单位，例如 0.35百万
    if (!name)
      break

    scale *= name.value ?? 1
    skip++
  }
  const newStrs = scale === 1 ? strs : strs.splice(0, strs.length - skip)

  const parts = convertToParts(newStrs)
  let last = 0
  let scale1 = 1
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    const p = part.number
    scale1 = scale1 * part.scale
    last += p * scale1
  }
  const last1 = Number(`0.${last}`) * 1

  return [
    last1,
    scale,
    newStrs.length,
  ]
}
function chineseToNumber(chnStr: string) {
  if (!chnStr)
    return chnStr

  const chnStrs = chnStr.replace(/，|,| |元|圆/ig, '').replace(/点|。/ig, '.')
    .split('.')
  if (chnStrs.length > 2)
    throw new Error(`非数字表达式：${chnStr}`)

  let strs = chnStrs[0].split('')
  let dots = (chnStrs.length === 2 ? chnStrs[1] : '').split('')

  let isNegative = false
  const alpha = strs[0]
  if (negatives[alpha]) { // 负，-
    isNegative = true
    strs = strs.splice(1)
  }
  else if (positives[alpha]) { // 正，+
    isNegative = false
    strs = strs.splice(1)
  }

  let lastAlpha = strs[strs.length - 1]
  if (skipTails[lastAlpha]) { // 整
    strs = strs.splice(0, strs.length - 1)
  }
  else if (dots.length > 1) {
    lastAlpha = dots[dots.length - 1]
    if (skipTails[lastAlpha]) { // 整
      dots = dots.splice(0, dots.length - 1)
    }
  }

  const number = convert(strs) //
  const number1 = dots.length > 0 ? convertDot(dots) : 0
  if (number1 === 0) { // 没有小数
    return number * (isNegative ? -1 : 1)
  }

  // console.log(number, number1)

  const fixed = number1[2] < 0 ? 0 : number1[2]
  const scale = number1[1]
  return Number(((number + number1[0]) * scale).toFixed(fixed)) * (isNegative ? -1 : 1)
}

export default chineseToNumber
