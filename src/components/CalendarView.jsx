import { useState, useMemo } from 'react'
import {
  getMonthGrid,
  formatDate,
  isToday,
  isReminderOnDate,
  getReminderDateText,
  getTagColor,
  isOverdue,
  contactTypeLabel,
  friendlyDate,
} from '../utils/helpers'

/**
 * 日历视图 — 月历展示，点击日期查看当天提醒
 */
export default function CalendarView({ reminders, onToggleComplete, onEditReminder, onDeleteReminder, onCreateReminder }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(formatDate(today))

  const cells = useMemo(() => getMonthGrid(year, month), [year, month])

  const goPrevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1)
      setMonth(11)
    } else {
      setMonth(m => m - 1)
    }
  }

  const goNextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1)
      setMonth(0)
    } else {
      setMonth(m => m + 1)
    }
  }

  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDate(formatDate(today))
  }

  // 选中日期的提醒
  const selectedReminders = reminders.filter(r =>
    isReminderOnDate(r, selectedDate) || (r.reminderType === 'custom' && r.triggerDate === selectedDate)
  )

  // 每个日期格子的提醒数量
  const getDayReminders = (dateStr) => {
    return reminders.filter(r => isReminderOnDate(r, dateStr))
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="h-full flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* ===== 左侧日历区域 (移动端全宽 / PC端60%) ===== */}
      <div className="flex-1 lg:w-3/5 lg:border-r lg:border-gray-100 overflow-y-auto scrollbar-thin">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800 lg:text-xl">
              {year}年{month + 1}月
            </h2>
            <button
              onClick={goToday}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
            >
              今天
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 日历表格 */}
      <div className="px-3 py-2 lg:px-6 lg:py-4 lg:max-w-lg lg:mx-auto">
        {/* 星期表头 */}
        <div className="grid grid-cols-7 mb-1">
          {weekdays.map(wd => (
            <div key={wd} className="text-center text-xs text-gray-400 py-2 font-medium">
              {wd}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1 lg:gap-2">
          {cells.map((cell, idx) => {
            const cellDate = new Date(year, cell.month, cell.day)
            const dateStr = formatDate(cellDate)
            const dayReminders = getDayReminders(dateStr)
            const isCurrentDay = isToday(cellDate)
            const isSelected = dateStr === selectedDate
            const hasReminders = dayReminders.length > 0
            const hasUncompleted = dayReminders.some(r => !r.completed)

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`calendar-day-cell rounded-lg text-sm relative transition-all ${
                  cell.otherMonth ? 'text-gray-300' : 'text-gray-700'
                } ${
                  isSelected
                    ? 'bg-wechat-green text-white shadow-sm shadow-wechat-green/30'
                    : isCurrentDay
                    ? 'bg-green-50 text-wechat-green font-bold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="calendar-day-cell__content">
                  <span className={isCurrentDay && !isSelected ? 'text-wechat-green' : ''}>
                    {cell.day}
                  </span>
                  {/* 提醒指示点 */}
                  {hasReminders && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayReminders.slice(0, 3).map((r, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full ${
                            isSelected ? 'bg-white' :
                            r.completed ? 'bg-gray-300' :
                            isOverdue(r) ? 'bg-red-400' : 'bg-wechat-green'
                          }`}
                        />
                      ))}
                      {dayReminders.length > 3 && (
                        <span className={`text-[8px] ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          +
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      </div>

      {/* ===== 右侧详情区域 (移动端全宽 / PC端40%) ===== */}
      <div className="flex-1 lg:w-2/5 lg:flex-none lg:overflow-y-auto scrollbar-thin border-t lg:border-t-0 border-gray-100 mt-0">
        <div className="px-4 py-3 lg:px-5 lg:py-4 flex items-center justify-between bg-white lg:bg-gray-50/50 sticky top-0 lg:border-b lg:border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 lg:text-base">
              {friendlyDate(selectedDate)}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedReminders.length} 个提醒
            </p>
          </div>
          <button
            onClick={() => {
              const prefill = { triggerDate: selectedDate, reminderType: 'custom' }
              onCreateReminder(prefill)
            }}
            className="px-3 py-1.5 text-xs bg-wechat-green text-white rounded-lg hover:bg-wechat-green-dark transition-colors"
          >
            + 添加
          </button>
        </div>

        {selectedReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">这天没有提醒</p>
          </div>
        ) : (
          <div className="px-3 lg:px-4 pb-4 space-y-2">
            {selectedReminders.map(reminder => (
              <ReminderCard
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

/* 提醒卡片 */
function ReminderCard({ reminder, onToggleComplete, onEdit, onDelete }) {
  return (
    <div className={`rounded-xl border p-3 transition-all ${
      reminder.completed
        ? 'bg-gray-50 border-gray-100 opacity-60'
        : isOverdue(reminder)
        ? 'bg-red-50 border-red-200'
        : 'bg-white border-gray-200'
    }`}>
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

        {/* 内容 */}
        <div className="flex-1 min-w-0" onClick={onEdit}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${reminder.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {reminder.customerName || '未命名客户'}
            </span>
            {reminder.contact?.value && (
              <span className="text-xs text-gray-400">
                {contactTypeLabel(reminder.contact.type)}: {reminder.contact.value}
              </span>
            )}
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

          {/* 备注 */}
          {reminder.note && (
            <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 rounded px-2 py-1">
              📝 {reminder.note}
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (confirm('确定删除这个提醒？')) onDelete()
            }}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.9 12.1a2 2 0 01-2 1.9H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
