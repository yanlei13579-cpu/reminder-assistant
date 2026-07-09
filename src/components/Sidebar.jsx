import { useState } from 'react'
import VoiceButton from './VoiceButton'

/**
 * 左侧对话列表 — 微信风格
 */
export default function Sidebar({ chats, currentChatId, onSelectChat, onCreateChat, onDeleteChat, onVoiceCreateReminder }) {
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatName, setNewChatName] = useState('')

  const handleCreate = () => {
    if (!newChatName.trim()) return
    const chat = onCreateChat(newChatName.trim())
    onSelectChat(chat.id)
    setNewChatName('')
    setShowNewChat(false)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h1 className="text-base font-semibold text-gray-800">提醒助手</h1>
        <div className="flex items-center gap-2">
          <VoiceButton onResult={onVoiceCreateReminder} variant="compact" />
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* 新建对话输入框 */}
      {showNewChat && (
        <div className="px-3 py-2 border-b border-gray-100 bg-white animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={newChatName}
              onChange={e => setNewChatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="客户姓名或对话标题"
              autoFocus
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-wechat-green"
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 bg-wechat-green text-white text-sm rounded-lg"
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">还没有对话</p>
            <p className="text-xs mt-1">点击右上角 + 新建</p>
          </div>
        ) : (
          chats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              active={chat.id === currentChatId}
              onClick={() => onSelectChat(chat.id)}
              onDelete={() => onDeleteChat(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ChatListItem({ chat, active, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
        active ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      {/* 头像 */}
      <div className="w-11 h-11 rounded-lg bg-wechat-green text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
        {chat.avatar || chat.name?.charAt(0) || '💬'}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800 truncate">{chat.name}</span>
          {chat.lastTime && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {new Date(chat.lastTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {chat.lastMessage || '暂无消息'}
        </p>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (confirm(`确定删除"${chat.name}"的对话？`)) onDelete()
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
