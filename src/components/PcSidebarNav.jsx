import { ChatIcon, CalendarIcon, BellIcon, PlusIcon, MessageSquareIcon } from './Icons'

/**
 * PC端左侧导航栏 — 替代移动端 BottomNav
 * 功能：视图切换 + 会话列表（聊天视图时）+ 快速创建提醒
 */
export default function PcSidebarNav({
  current,
  onChange,
  reminderCount,
  onQuickAdd,
  chats,
  currentChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
}) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      {/* 1. 品牌区域 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-wechat-green text-white flex items-center justify-center text-lg shadow-sm shadow-wechat-green/20">
            📋
          </div>
          <span className="text-lg font-semibold text-gray-800 tracking-tight">提醒助手</span>
        </div>
      </div>

      {/* 2. 主导航 */}
      <nav className="px-3 py-4 space-y-0.5">
        <NavItem
          icon={<ChatIcon />}
          label="智能聊天"
          active={current === 'chat'}
          onClick={() => onChange('chat')}
        />
        <NavItem
          icon={<CalendarIcon />}
          label="日历视图"
          active={current === 'calendar'}
          onClick={() => onChange('calendar')}
        />
        <NavItem
          icon={<BellIcon />}
          label="提醒列表"
          active={current === 'list'}
          onClick={() => onChange('list')}
          badge={reminderCount}
        />
      </nav>

      {/* 3. 分隔线 */}
      <div className="mx-3 border-t border-gray-100" />

      {/* 4. 会话列表（仅在聊天视图显示）*/}
      {current === 'chat' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 min-h-0">
          {/* 新建对话按钮 */}
          <button
            onClick={() => {
              const chat = onCreateChat('新对话')
              onSelectChat(chat.id)
            }}
            className="w-full mb-2 px-3 py-2 text-sm text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusIcon />
            新建对话
          </button>

          {/* 会话列表项 */}
          {chats.length > 0 ? (
            <div className="space-y-0.5">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${
                    chat.id === currentChatId
                      ? 'bg-wechat-green/8 text-wechat-green'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    chat.id === currentChatId
                      ? 'bg-wechat-green text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {chat.avatar || '💬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${chat.id === currentChatId ? 'text-wechat-green' : 'text-gray-700'}`}>
                      {chat.name}
                    </p>
                    {chat.lastMessage && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{chat.lastMessage}</p>
                    )}
                  </div>
                  {/* 删除按钮 - 悬停显示 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat(chat.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-300 transition-all"
                    title="删除对话"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquareIcon />
              <p className="text-xs text-gray-400 mt-2">暂无对话</p>
            </div>
          )}
        </div>
      )}

      {/* 5. 底部操作区 — 始终可见 */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={onQuickAdd}
          className="w-full py-2.5 bg-wechat-green text-white rounded-lg text-sm font-medium hover:bg-[#06ad56] active:bg-[#059a4c] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-wechat-green/20"
        >
          <PlusIcon />
          快速创建提醒
        </button>
      </div>
    </aside>
  )
}

/* 导航项组件 */
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-wechat-green/10 text-wechat-green'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`}
    >
      <span className={active ? 'text-wechat-green' : 'text-gray-400'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}
