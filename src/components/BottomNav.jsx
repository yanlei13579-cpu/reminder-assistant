/**
 * 底部导航栏 — 三视图切换：聊天 / 日历 / 提醒列表
 */
export default function BottomNav({ current, onChange, reminderCount, onQuickAdd }) {
  const tabs = [
    { key: 'chat', label: '聊天', icon: ChatIcon },
    { key: 'calendar', label: '日历', icon: CalendarIcon },
    { key: 'list', label: '提醒', icon: BellIcon, badge: reminderCount },
  ]

  return (
    <div className="flex items-center justify-around border-t border-gray-200 bg-white px-2 py-1.5 safe-area-bottom">
      {tabs.map(tab => {
        const Icon = tab.icon
        const active = current === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors relative ${
              active ? 'text-wechat-green' : 'text-gray-400'
            }`}
          >
            <Icon active={active} />
            <span className="text-xs">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="absolute top-0 right-1/4 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        )
      })}

      {/* 中间快速创建按钮 */}
      <button
        onClick={onQuickAdd}
        className="flex-1 flex flex-col items-center gap-0.5 py-1.5 text-wechat-green"
      >
        <div className="w-8 h-8 rounded-full bg-wechat-green text-white flex items-center justify-center text-xl leading-none">
          +
        </div>
      </button>
    </div>
  )
}

function ChatIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 8h5m-9 4a8 8 0 1116 0 8 8 0 01-16 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l2-4" />
    </svg>
  )
}

function CalendarIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function BellIcon({ active }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
    </svg>
  )
}
