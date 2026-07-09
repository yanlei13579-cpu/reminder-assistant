import { genId } from '../hooks/useLocalStorage'

/* ============================================================
 *  日期工具
 * ============================================================ */

/** 格式化日期 YYYY-MM-DD */
export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 格式化时间 HH:mm */
export function formatTime(date) {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 格式化日期时间 */
export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`
}

/** 友好的相对日期描述 */
export function friendlyDate(date) {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / 86400000)

  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  if (diff === -1) return '昨天'
  if (diff > 0 && diff <= 7) return `${diff}天后`
  if (diff < 0 && diff >= -7) return `${-diff}天前`
  return formatDate(d)
}

/** 获取月份日历网格 */
export function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay() // 0=周日
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  // 上月尾部
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, otherMonth: true, month: month - 1 })
  }
  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, otherMonth: false, month })
  }
  // 下月头部，补满 42 格 (6行)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, otherMonth: true, month: month + 1 })
  }
  return cells
}

/** 检查日期是否今天 */
export function isToday(date) {
  return formatDate(date) === formatDate(new Date())
}

/** 检查两个日期是否同一天 */
export function isSameDay(d1, d2) {
  return formatDate(d1) === formatDate(d2)
}

/** 检查是否过期 */
export function isOverdue(reminder) {
  if (reminder.completed) return false
  if (reminder.type === 'monthly' || reminder.type === 'fixed135') return false
  return new Date(reminder.triggerDate) < new Date()
}

/* ============================================================
 *  语音 / 文本智能解析
 *  从自然语言中提取：客户姓名、联系方式、提醒时间、备注
 * ============================================================ */

/** 提取手机号 */
function extractPhone(text) {
  // 匹配 11 位手机号
  const match = text.match(/1[3-9]\d{9}/)
  return match ? match[0] : null
}

/** 提取微信号 */
function extractWeChat(text) {
  // 匹配 "微信号xxx" / "微信xxx" / "vx xxx" / "v信 xxx"
  const patterns = [
    /(?:微信号?|威信|VX|vx|v信|加v)\s*[:：]?\s*([a-zA-Z0-9_-]{6,20})/,
    /(?:微信号?|威信|VX|vx|v信|加v)\s*[:：]?\s*(\S{6,20})/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  return null
}

/** 提取联系方式 */
export function extractContact(text) {
  const phone = extractPhone(text)
  if (phone) return { type: 'phone', value: phone }
  const wechat = extractWeChat(text)
  if (wechat) return { type: 'wechat', value: wechat }
  return null
}

/** 提取客户姓名 */
function extractCustomerName(text) {
  // 先清理常见的前缀干扰词（包括中间位置的"提醒"）
  let cleanText = text
    .replace(/^(帮我|请|麻烦)?\s*提醒(?:一下)?/, '')       // 开头的 "帮我提醒/提醒一下"
    .replace(/\s*(?:帮我|请|麻烦)?\s*提醒(?:一下)?\s*/, ' ') // 中间的 "提醒/帮我提醒"
    .replace(/^[，,、\s]+/, '')
    .trim()

  // 匹配 "张先生" "李女士" "王总" "赵姐" "客户张三" "张三客户" 等
  // 也匹配 "叫张三" "客户叫张三" "名字是张三" "姓张"
  const patterns = [
    /客户(?:叫|名字是|名为|姓名是)?\s*([\u4e00-\u9fa5]{2,4}(?:先生|女士|总|姐|哥|老板|医生|老师|宝妈|妈妈|爸爸)?)/,
    /(?:叫|名字是|姓名是|名为)\s*([\u4e00-\u9fa5]{2,4}(?:先生|女士|总|姐|哥|老板|医生|老师|宝妈|妈妈|爸爸)?)/,
    // 直接匹配 X先生/X女士 等 — 排除前面紧跟的数字/标点干扰字符
    /(?<![0-9a-zA-Z])([\u4e00-\u9fa5]{1,2}(?:先生|女士|总|姐|哥|老板|医生|老师|宝妈|妈妈|爸爸))/,
    /(?:姓)\s*([\u4e00-\u9fa5]{1,2})\s/,
  ]
  for (const p of patterns) {
    const m = cleanText.match(p)
    if (m) {
      let name = m[1].trim()
      // 如果只匹配到姓氏，加上"女士/先生"
      if (name.length <= 2 && !/(先生|女士|总|姐|哥|老板|医生|老师|宝妈|妈妈|爸爸)$/.test(name)) {
        // 检查上下文是否有"女士""先生"等
        const genderMatch = cleanText.match(/(女|男|先生|女士|小姐|太太)/)
        if (genderMatch) {
          if (genderMatch[0] === '女' || genderMatch[0] === '女士' || genderMatch[0] === '小姐' || genderMatch[0] === '太太') {
            name = name + '女士'
          } else {
            name = name + '先生'
          }
        }
      }
      return name
    }
  }
  return null
}

/** 解析自然语言日期 */
function parseNaturalDate(text) {
  const now = new Date()
  const today = new Date(now)
  today.setHours(9, 0, 0, 0) // 默认上午9点

  // 检查是否月度提醒
  const monthlyMatch = text.match(/(?:每月|每个月|月度)\s*(\d{1,2})\s*[号日]/)
  if (monthlyMatch) {
    return {
      type: 'monthly',
      day: parseInt(monthlyMatch[1]),
      date: null,
      time: '09:00'
    }
  }

  // 检查是否固定 1-3-5 日提醒
  if (/(?:1\s*[、,，/]\s*3\s*[、,，/]\s*5\s*[日天号]|一三五|固定.*1.*3.*5|135)/.test(text)) {
    return { type: 'fixed135', date: null, time: '09:00' }
  }

  // 相对日期
  let targetDate = null

  // 今天
  if (/今天|今日|today/i.test(text)) {
    targetDate = new Date(today)
  }
  // 明天
  if (/明天|明日|tomorrow/i.test(text)) {
    targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + 1)
  }
  // 后天
  if (/后天/.test(text)) {
    targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + 2)
  }
  // 大后天
  if (/大后天/.test(text)) {
    targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + 3)
  }
  // N天后 / N天后
  const daysLaterMatch = text.match(/(\d+)\s*天[后之後]/)
  if (daysLaterMatch && !targetDate) {
    targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + parseInt(daysLaterMatch[1]))
  }
  // 下周X
  const weekdayMap = { '日': 0, '天': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 }
  const nextWeekMatch = text.match(/下周(日|天|一|二|三|四|五|六)/)
  if (nextWeekMatch && !targetDate) {
    const target = weekdayMap[nextWeekMatch[1]]
    targetDate = new Date(today)
    const currentDay = targetDate.getDay()
    let diff = (target - currentDay + 7) % 7
    if (diff === 0) diff = 7
    targetDate.setDate(targetDate.getDate() + diff)
  }
  // 周X (本周)
  const weekdayMatch = text.match(/(?:本周|这周|周|星期)(日|天|一|二|三|四|五|六)/)
  if (weekdayMatch && !nextWeekMatch && !targetDate) {
    const target = weekdayMap[weekdayMatch[1]]
    targetDate = new Date(today)
    const currentDay = targetDate.getDay()
    let diff = target - currentDay
    if (diff <= 0) diff += 7
    targetDate.setDate(targetDate.getDate() + diff)
  }
  // X月X号/X日
  const monthDayMatch = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[号日]/)
  if (monthDayMatch && !targetDate) {
    const month = parseInt(monthDayMatch[1]) - 1
    const day = parseInt(monthDayMatch[2])
    targetDate = new Date(today)
    targetDate.setMonth(month)
    targetDate.setDate(day)
    // 如果已过去，设为明年
    if (targetDate < today) {
      targetDate.setFullYear(targetDate.getFullYear() + 1)
    }
  }
  // 单独 X号/X日 (当月)
  const dayMatch = text.match(/(?<!\d)(\d{1,2})\s*[号日](?!\s*[月])/)
  if (dayMatch && !targetDate && !monthlyMatch) {
    const day = parseInt(dayMatch[1])
    if (day >= 1 && day <= 31) {
      targetDate = new Date(today)
      targetDate.setDate(day)
      if (targetDate < today) {
        targetDate.setMonth(targetDate.getMonth() + 1)
      }
    }
  }

  // 解析时间
  let time = '09:00'
  // 上午/下午 X点 / X:XX
  const timePatterns = [
    /(?:上午)\s*(\d{1,2})\s*[点时:：](\d{0,2})/,
    /(?:下午)\s*(\d{1,2})\s*[点时:：](\d{0,2})/,
    /(?:晚上|晚间)\s*(\d{1,2})\s*[点时:：](\d{0,2})/,
    /(\d{1,2})\s*[点时:：]\s*(\d{1,2})\s*分?/,
    /(\d{1,2})\s*[点时]\s*半/,
  ]
  for (const p of timePatterns) {
    const m = text.match(p)
    if (m) {
      let hour = parseInt(m[1])
      const min = m[2] ? parseInt(m[2]) : 0
      if (p.source.includes('下午') && hour < 12) hour += 12
      if (p.source.includes('晚上') && hour < 12) hour += 12
      if (p.source.includes('半')) {
        time = `${String(hour).padStart(2, '0')}:30`
      } else {
        time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      }
      break
    }
  }

  // 设置时间到目标日期
  if (targetDate) {
    const [h, m] = time.split(':').map(Number)
    targetDate.setHours(h, m, 0, 0)
  }

  return {
    type: 'custom',
    date: targetDate ? formatDate(targetDate) : null,
    time,
    rawDate: targetDate
  }
}

/** 提取标签关键词 */
const TAG_KEYWORDS = {
  '孕产': ['孕产', '孕妇', '产检', '月子', '产后', '备孕', '孕期', '胎', '催乳', '通乳'],
  '妇科': ['妇科', '妇科检查', ' HPV', '宫颈', '盆底', '超声', 'B超', '产康'],
  '儿科': ['儿科', '儿童', '宝宝', '小孩', '婴儿', '新生儿', '儿保', '疫苗', '接种'],
  '口腔': ['口腔', '牙', '种植', '正畸', '洗牙', '拔牙', '补牙', '根管', '牙套', '义齿', '矫正'],
  '美容': ['美容', '皮肤', '抗衰', '水光', '玻尿酸', '瘦脸', '嫩肤'],
  '体检': ['体检', '健康检查', '筛查'],
  '回访': ['回访', '跟进', '跟进', '联系', '追回'],
  '咨询': ['咨询', '问诊', '咨询'],
  '预约': ['预约', '挂号', '预订', '约号'],
}

function extractTags(text) {
  const tags = []
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.push(tag)
    }
  }
  return tags
}

/**
 * 主解析函数 — 从自然语言文本中提取提醒信息
 */
export function parseReminderFromText(text) {
  const contact = extractContact(text)
  const name = extractCustomerName(text)
  const dateInfo = parseNaturalDate(text)
  const tags = extractTags(text)

  // 提取备注：去掉已识别的部分，剩余作为备注
  let note = text
  if (contact) {
    note = note.replace(contact.value, '').trim()
  }
  // 去掉多余的"提醒""帮我"等
  note = note.replace(/^(帮我|请|麻烦)?提醒(一下)?/, '').trim()
  note = note.replace(/\s{2,}/g, ' ').trim()

  return {
    customerName: name || '',
    contact: contact || { type: '', value: '' },
    reminderType: dateInfo.type || 'custom',
    triggerDate: dateInfo.date || '',
    triggerTime: dateInfo.time || '09:00',
    monthlyDay: dateInfo.type === 'monthly' ? dateInfo.day : null,
    tags,
    note,
    rawText: text,
  }
}

/* ============================================================
 *  提醒管理工具
 * ============================================================ */

/** 创建提醒对象 */
export function createReminder(data) {
  return {
    id: genId(),
    customerName: data.customerName || '',
    contact: data.contact || { type: 'phone', value: '' },
    tags: data.tags || [],
    reminderType: data.reminderType || 'custom', // custom | monthly | fixed135
    triggerDate: data.triggerDate || '',
    triggerTime: data.triggerTime || '09:00',
    monthlyDay: data.monthlyDay || null,
    note: data.note || '',
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    chatId: data.chatId || null,
    messageId: data.messageId || null,
  }
}

/** 获取提醒的触发日期文本 */
export function getReminderDateText(reminder) {
  switch (reminder.reminderType) {
    case 'monthly':
      return `每月${reminder.monthlyDay}号 ${reminder.triggerTime}`
    case 'fixed135':
      return `固定1/3/5日提醒 ${reminder.triggerTime}`
    case 'custom':
      return `${friendlyDate(reminder.triggerDate)} ${reminder.triggerTime}`
    default:
      return ''
  }
}

/** 获取提醒的完整日期 */
export function getReminderFullDate(reminder) {
  switch (reminder.reminderType) {
    case 'monthly':
      return `每月 ${reminder.monthlyDay} 日 ${reminder.triggerTime}`
    case 'fixed135':
      return `每月 1、3、5 日 ${reminder.triggerTime}`
    case 'custom':
      return formatDateTime(`${reminder.triggerDate}T${reminder.triggerTime}`)
    default:
      return ''
  }
}

/** 检查提醒是否在指定日期触发 */
export function isReminderOnDate(reminder, date) {
  const d = new Date(date)
  const day = d.getDate()
  const dateStr = formatDate(d)

  switch (reminder.reminderType) {
    case 'monthly':
      return day === reminder.monthlyDay
    case 'fixed135':
      return [1, 3, 5].includes(day)
    case 'custom':
      return reminder.triggerDate === dateStr
    default:
      return false
  }
}

/** 获取即将到期的提醒（今天或未来7天） */
export function getUpcomingReminders(reminders) {
  const today = formatDate(new Date())
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = formatDate(nextWeek)

  return reminders
    .filter(r => {
      if (r.completed) return false
      if (r.reminderType === 'custom') {
        return r.triggerDate >= today && r.triggerDate <= nextWeekStr
      }
      // 月度和固定提醒：检查未来7天是否有触发日
      for (let i = 0; i <= 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        if (isReminderOnDate(r, d)) return true
      }
      return false
    })
    .sort((a, b) => {
      const aDate = a.reminderType === 'custom' ? a.triggerDate : today
      const bDate = b.reminderType === 'custom' ? b.triggerDate : today
      return aDate.localeCompare(bDate)
    })
}

/** 预设标签颜色映射 */
export const TAG_COLORS = {
  '孕产': 'bg-pink-100 text-pink-700 border-pink-200',
  '妇科': 'bg-purple-100 text-purple-700 border-purple-200',
  '儿科': 'bg-blue-100 text-blue-700 border-blue-200',
  '口腔': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '美容': 'bg-rose-100 text-rose-700 border-rose-200',
  '体检': 'bg-green-100 text-green-700 border-green-200',
  '回访': 'bg-amber-100 text-amber-700 border-amber-200',
  '咨询': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '预约': 'bg-teal-100 text-teal-700 border-teal-200',
}

/** 自定义标签的随机颜色 */
const CUSTOM_TAG_COLORS = [
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-lime-100 text-lime-700 border-lime-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-red-100 text-red-700 border-red-200',
  'bg-violet-100 text-violet-700 border-violet-200',
]

export function getTagColor(tag) {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  // 基于标签名生成稳定的颜色索引
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i)
    hash |= 0
  }
  return CUSTOM_TAG_COLORS[Math.abs(hash) % CUSTOM_TAG_COLORS.length]
}

/** 联系方式类型图标 */
export function contactTypeLabel(type) {
  switch (type) {
    case 'phone': return '手机'
    case 'wechat': return '微信'
    default: return '联系方式'
  }
}
