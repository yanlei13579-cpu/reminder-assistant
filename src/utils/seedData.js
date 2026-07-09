/**
 * 示例数据 — 首次打开时填充，让用户立即看到效果
 * localStorage 已有数据时不会覆盖
 */

const now = new Date()
const today = now.toISOString().slice(0, 10)
const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10)
const in3days = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10)
const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)

export const seedChats = [
  {
    id: 'chat_001',
    name: '张女士 · 孕产',
    avatar: '张',
    createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
    lastMessage: '好的，我下周三来产检',
    lastTime: new Date(now.getTime() - 3600000 * 2).toISOString(),
  },
  {
    id: 'chat_002',
    name: '李先生 · 口腔',
    avatar: '李',
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    lastMessage: '种植牙的费用大概多少？',
    lastTime: new Date(now.getTime() - 86400000).toISOString(),
  },
  {
    id: 'chat_003',
    name: '王总 · 儿科',
    avatar: '王',
    createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    lastMessage: '宝宝疫苗预约好了吗',
    lastTime: new Date(now.getTime() - 86400000 * 2).toISOString(),
  },
]

export const seedMessages = {
  chat_001: [
    {
      id: 'msg_001',
      chatId: 'chat_001',
      text: '张女士您好，您预约的产检时间确认了吗？',
      isVoice: false,
      isUser: true,
      createdAt: new Date(now.getTime() - 3600000 * 3).toISOString(),
    },
    {
      id: 'msg_002',
      chatId: 'chat_001',
      text: '确认了，下周三下午两点',
      isVoice: false,
      isUser: false,
      createdAt: new Date(now.getTime() - 3600000 * 2.5).toISOString(),
    },
    {
      id: 'msg_003',
      chatId: 'chat_001',
      text: '好的，我下周三来产检，记得提醒我带之前的检查报告',
      isVoice: false,
      isUser: false,
      createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
    },
  ],
  chat_002: [
    {
      id: 'msg_004',
      chatId: 'chat_002',
      text: '李先生您好，您咨询的种植牙方案我整理好了',
      isVoice: false,
      isUser: true,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: 'msg_005',
      chatId: 'chat_002',
      text: '种植牙的费用大概多少？',
      isVoice: false,
      isUser: false,
      createdAt: new Date(now.getTime() - 86400000 + 3600000).toISOString(),
    },
  ],
  chat_003: [
    {
      id: 'msg_006',
      chatId: 'chat_003',
      text: '王总，宝宝下周该接种疫苗了，需要预约吗？',
      isVoice: false,
      isUser: true,
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      id: 'msg_007',
      chatId: 'chat_003',
      text: '宝宝疫苗预约好了吗',
      isVoice: false,
      isUser: false,
      createdAt: new Date(now.getTime() - 86400000 * 2 + 3600000).toISOString(),
    },
  ],
}

export const seedReminders = [
  {
    id: 'rem_001',
    customerName: '张女士',
    contact: { type: 'phone', value: '13800138001' },
    tags: ['孕产', '预约'],
    reminderType: 'custom',
    triggerDate: nextWeek,
    triggerTime: '13:30',
    monthlyDay: null,
    note: '产检提醒，记得带之前的检查报告',
    completed: false,
    completedAt: null,
    createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
    chatId: 'chat_001',
    messageId: 'msg_003',
  },
  {
    id: 'rem_002',
    customerName: '李先生',
    contact: { type: 'wechat', value: 'lisi_wx' },
    tags: ['口腔', '回访'],
    reminderType: 'custom',
    triggerDate: tomorrow,
    triggerTime: '10:00',
    monthlyDay: null,
    note: '发送种植牙方案报价，跟进意向',
    completed: false,
    completedAt: null,
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    chatId: 'chat_002',
    messageId: 'msg_005',
  },
  {
    id: 'rem_003',
    customerName: '王总',
    contact: { type: 'phone', value: '13900139002' },
    tags: ['儿科', '回访'],
    reminderType: 'monthly',
    triggerDate: '',
    triggerTime: '09:00',
    monthlyDay: 15,
    note: '每月15号提醒宝宝疫苗接种',
    completed: false,
    completedAt: null,
    createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    chatId: 'chat_003',
    messageId: null,
  },
  {
    id: 'rem_004',
    customerName: '赵女士',
    contact: { type: 'phone', value: '13700137003' },
    tags: ['妇科', '咨询'],
    reminderType: 'fixed135',
    triggerDate: '',
    triggerTime: '10:00',
    monthlyDay: null,
    note: '固定1/3/5日提醒，跟进妇科检查意向',
    completed: false,
    completedAt: null,
    createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    chatId: null,
    messageId: null,
  },
  {
    id: 'rem_005',
    customerName: '陈先生',
    contact: { type: 'wechat', value: 'chen_wx001' },
    tags: ['口腔', '预约'],
    reminderType: 'custom',
    triggerDate: yesterday,
    triggerTime: '14:00',
    monthlyDay: null,
    note: '洗牙预约确认',
    completed: true,
    completedAt: new Date(now.getTime() - 86400000).toISOString(),
    createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
    chatId: null,
    messageId: null,
  },
  {
    id: 'rem_006',
    customerName: '刘女士',
    contact: { type: 'phone', value: '13600136004' },
    tags: ['孕产', '回访'],
    reminderType: 'custom',
    triggerDate: in3days,
    triggerTime: '15:00',
    monthlyDay: null,
    note: '产后42天复查提醒',
    completed: false,
    completedAt: null,
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    chatId: null,
    messageId: null,
  },
]

export const seedCustomTags = ['预约', '复诊', '报价']
