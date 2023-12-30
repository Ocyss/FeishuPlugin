/*
 * @Author: liliguo
 * @Url: https://www.npmjs.com/package/@fekit/idcard
 * @Date: 2023-12-08 05:06:13
 * @Last Modified by: Ocyss_04
 * @Last Modified time: 2023-12-08 08:02:29
 */
import { areaObj, cityObj, provinceObj } from './constant'

const _provinceObj: Record<string, string> = provinceObj
const _cityObj: Record<string, string> = cityObj
const _areaObj: Record<string, string> = areaObj

const zodiacEnums = [
  '猴',
  '鸡',
  '狗',
  '猪',
  '鼠',
  '牛',
  '虎',
  '兔',
  '龙',
  '蛇',
  '马',
  '羊',
]
const constellationEnums = [
  '',
  '水瓶座',
  '双鱼座',
  '白羊座',
  '金牛座',
  '双子座',
  '巨蟹座',
  '狮子座',
  '处女座',
  '天秤座',
  '天蝎座',
  '射手座',
  '摩羯座',
]
const constellationEnum = [
  { max: 218, min: 120 },
  { max: 320, min: 219 },
  { max: 419, min: 321 },
  { max: 520, min: 420 },
  { max: 621, min: 521 },
  { max: 722, min: 622 },
  { max: 822, min: 723 },
  { max: 922, min: 823 },
  { max: 1023, min: 923 },
  { max: 1122, min: 1024 },
  { max: 1221, min: 1123 },
]
const re1 = /(\d{2})(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})(\d{1})(\d|X)/
const re2 = /^[1-9][0-9]{5}([1][9][0-9]{2}|[2][0][0-2][0-9])([0][1-9]|[1][0|1|2])([0][1-9]|[1|2][0-9]|[3][0|1])[0-9]{3}([0-9]|[X])$/

// 获取生日,年龄,星座
function getBirth(year: string, month: string, day: string) {
  // 生日
  const birthday = `${year}-${month}-${day}`
  const date = new Date()
  const curMonth = date.getMonth() + 1
  const curDay = date.getDate()
  const years = Number.parseInt(year)
  const months = Number.parseInt(month)
  // 年龄
  let age = date.getFullYear() - years
  if (curMonth < months || (curMonth === months && curDay < Number.parseInt(day)))
    age--

  // 生肖
  const zodiac = zodiacEnums[years % 12]
  // 星座

  let constellation = 12
  const md = Number.parseInt(month + day)
  constellationEnum.forEach((item, idx) => {
    const { max, min } = item
    if (md >= min && md <= max)
      constellation = idx + 1
  })

  // 星座
  return { age, birthday, constellation: constellationEnums[constellation || 0], zodiac }
}

// 获取省市区
function getArea(p: string, c: string, a: string) {
  const areaCode = p + c + a
  const province = {
    code: `${p}0000`,
    text: _provinceObj[p] || '',
  }
  const city = {
    code: `${p + c}00`,
    text: _cityObj[p + c] || '',
  }
  const area = {
    code: areaCode,
    text: _areaObj[areaCode] || '',
  }
  const adreass: string = province.text + city.text + area.text
  return { adreass, area, city, province }
}

function isValidChineseID(idNumber: string, verify: 0 | 1 | 2 | 3 | 4) {
  if (verify < 1)
    return ''
  if (!re2.test(idNumber))
    return 'Regex does not pass'
  if (verify < 2)
    return ''
  const year = Number.parseInt(idNumber.substring(6, 10), 10)
  const month = Number.parseInt(idNumber.substring(10, 12), 10)
  const day = Number.parseInt(idNumber.substring(12, 14), 10)
  const birthday = new Date(year, month - 1, day)

  if (birthday.getFullYear() !== year
    || birthday.getMonth() !== month - 1
    || birthday.getDate() !== day)
    return 'Date is incorrect'
  if (verify < 4)
    return ''
  const weightFactors = [
    7,
    9,
    10,
    5,
    8,
    4,
    2,
    1,
    6,
    3,
    7,
    9,
    10,
    5,
    8,
    4,
    2,
  ]
  const checkCode = [
    '1',
    '0',
    'X',
    '9',
    '8',
    '7',
    '6',
    '5',
    '4',
    '3',
    '2',
  ]

  let sum = 0
  for (let i = 0; i < 17; i++)
    sum += Number.parseInt(idNumber[i]) * weightFactors[i]

  return idNumber[17].toUpperCase() === checkCode[sum % 11] ? '' : 'Checksum does not pass'
}

function idcard(id: string = '', verify: 0 | 1 | 2 | 3 | 4 = 4) {
  // 判断是一代还是二代身份证并格式化
  const _id = id.length === 15 ? `${id.substring(0, 6)}19${id.substring(6)}0` : id
  const info = _id.match(re1)
  if (!info)
    return 'Format does not pass'

  const { adreass, area, city, province } = getArea(info[1], info[2], info[3])
  if (verify >= 3 && (Number(!!area.text) + Number(!!city.text) + Number(!!province.text) < 2))
    return 'Native place is incorrect'

  const msg = isValidChineseID(_id, verify)
  if (msg)
    return msg

  const { age, birthday, constellation, zodiac } = getBirth(info[4], info[5], info[6])
  const gender = Number.parseInt(info[8]) & 1 ? '男' : '女'

  return {
    adreass, // 籍贯
    age, // 年龄
    area, // 区县
    birthday, // 出生日期
    city, // 市
    constellation, // 星座
    gender, // 性别
    province, // 省
    zodiac, // 生肖

  }
}

export default idcard
