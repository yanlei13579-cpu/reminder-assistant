import { useState, useMemo } from 'react'
import {
  getReminderDateText,
  getTagColor,
  isOverdue,
  contactTypeLabel,
  friendlyDate,
  getUpcomingReminders,
  formatDate,
} from '../utils/helpers'
import StatCard from './StatCard'

/**
 * 提醒列表视图 — 全部提醒管理，支持筛选
 */
export default function ReminderListView({ reminders, onToggleComplete, onEditReminder, onDeleteReminder, onCreateReminder }) {
  const [filter, setFilter] = useState('upcoming') // all | upcoming | completed | overdue
  const [tagFilter, setTagFilter] = useState(null)
  const [search, setSearch] = useState('')

  // 收集所有标签
  const allTags = useMemo(() => {
    const tags = new Set()
    reminders.forEach(r => r.tags.forEach(t => tags.add(t)))
    return Array.from(tags)
  }, [reminders])

  // 筛选
  const filteredReminders = useMemo(() => {
    let result = [...reminders]

    // 状态筛选
    switch (filter) {
      case 'upcoming':
        result = getUpcomingReminders(reminders)
        break
      case 'completed':
        result = result.filter(r => r.completed)
        break
      case 'overdue':
        result = result.filter(r => isOverdue(r))
        break
      case 'all':
      default:
        break
    }

    // 标签筛选
    if (tagFilter) {
      result = result.filter(r => r.tags.includes(tagFilter))
    }

    // 搜索
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        r.customerName?.toLowerCase().includes(q) ||
        r.contact?.value?.toLowerCase().includes(q) ||
        r.note?.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    // 排序：未完成在前，按日期排序
    result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const aDate = a.triggerDate || formatDate(new Date())
      const bDate = b.triggerDate || formatDate(new Date())
      return aDate.localeCompare(bDate)
    })

    return result
  }, [reminders, filter, tagFilter, search])

  // 统计
  const stats = useMemo(() => ({
    total: reminders.length,
    upcoming: getUpcomingReminders(reminders).length,
    completed: reminders.filter(r => r.completed).length,
    overdue: reminders.filter(r => isOverdue(r)).length,
  }), [reminders])

  const filterTabs = [
    { key: 'upcoming', label: '即将到期', count: stats.upcoming },
    { key: 'overdue', label: '已过期', count: stats.overdue },
    { key: 'all', label: '全部', count: stats.total },
    { key: 'completed', label: '已完成', count: stats.completed },
  ]

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-6 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 lg:text-xl">提醒列表</h2>
          <button
            onClick={() => onCreateReminder()}
            className="px-3 py-1.5 text-sm bg-wechat-green text-white rounded-lg flex items-center gap-1 hover:bg-wechat-green-dark transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            新建
          </button>
        </div>

        {/* 搜索框 + 筛选标签 PC端横排 */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-2">
          {/* 搜索框 */}
          <div className="relative lg:w-72 flex-shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索客户、联系方式、备���..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-wechat-green/20"
            />
          </div>

          {/* 筛选标签 */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${
                  filter === tab.key
                    ? 'bg-wechat-green text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 ${filter === tab.key ? 'text-white/80' : 'text-gray-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 mt-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setTagFilter(null)}
              className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                !tagFilter ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              全部标签
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={`px-2 py-0.5 text-xs rounded-full border whitespace-nowrap ${
                  tagFilter === tag ? getTagColor(tag) + ' font-medium' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 统计概览卡片 — 仅PC端显示 */}
      <div className="hidden lg:grid grid-cols-4 gap-3 px-6 py-4 bg-gray-50/80 border-b border-gray-100">
        <StatCard label="总计" value={stats.total} color="gray" icon="📋" />
        <StatCard label="即将到期" value={stats.upcoming} color="green" icon="⏰" />
        <StatCard label="已过期" value={stats.overdue} color="red" icon="⚠️" />
        <StatCard label="已完成" value={stats.completed} color="gray" icon="✅" />
      </div>

      {/* 提醒列表 — 移动端单列 / PC端多列网格 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 lg:px-6 py-3">
        {filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">
              {search ? '没有匹配的提醒' : filter === 'completed' ? '还没有完成的提醒' : '暂无提醒'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3">
            {filteredReminders.map(reminder => (
              <ListReminderCard
                key={reminder.id}
                reminder={reminder}
                onToggleComplete={() => onToggleComplete(reminder.id)}
                onEdit={() => onEditReminder(reminder)}
                onDelete={() => onDeleteReminder(reminder.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* 列表中的提醒卡片 */
function ListReminderCard({ reminder, onToggleComplete, onEdit, onDelete }) {
  const overdue = isOverdue(reminder)
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        reminder.completed
          ? 'bg-gray-50 border-gray-100 opacity-60'
          : overdue
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 完成按钮 */}
        <button
          onClick={onToggleComplete}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            reminder.completed
              ? 'bg-wechat-green border-wechat-green'
              : 'border-gray-300 hover:border-wechat-green'
          }`}
        >
          {reminder.completed && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* 主内容 */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-medium ${reminder.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {reminder.customerName || '未命名客户'}
              </span>
              {overdue && !reminder.completed && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                  过期
                </span>
              )}
              {reminder.reminderType === 'monthly' && (
                <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-full">月度</span>
              )}
              {reminder.reminderType === 'fixed135' && (
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-600 rounded-full">1/3/5</span>
              )}
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* 标签 */}
          {reminder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {reminder.tags.map(tag => (
                <span key={tag} className={`px-1.5 py-0.5 text-xs rounded-full border ${getTagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 时间 */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
            {getReminderDateText(reminder)}
          </div>

          {/* 展开详情 */}
          {expanded && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5 animate-fade-in">
              {reminder.contact?.value && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-gray-400">{contactTypeLabel(reminder.contact.type)}:</span>
                  <span>{reminder.contact.value}</span>
                </div>
              )}
              {reminder.note && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5">
                  📝 {reminder.note}
                </div>
              )}
              <div className="text-xs text-gray-400">
                创建于 {friendlyDate(reminder.createdAt)}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                  className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  ✏️ 编辑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('确定删除这个提醒？')) onDelete()
                  }}
                  className="flex-1 py-1.5 text-xs border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
