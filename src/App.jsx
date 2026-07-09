import { useState, useCallback } from 'react'
import { useLocalStorage, genId } from './hooks/useLocalStorage'
import { parseReminderFromText, createReminder } from './utils/helpers'
import { seedChats, seedMessages, seedReminders, seedCustomTags } from './utils/seedData'
import Sidebar from './components/Sidebar'
import PcSidebarNav from './components/PcSidebarNav'
import ChatView from './components/ChatView'
import CalendarView from './components/CalendarView'
import ReminderListView from './components/ReminderListView'
import ReminderModal from './components/ReminderModal'
import BottomNav from './components/BottomNav'
import VoiceButton from './components/VoiceButton'

export default function App() {
  // ====== 全局数据（首次打开填充示例数据） ======
  const [chats, setChats] = useLocalStorage('ra_chats', seedChats)
  const [messagesByChat, setMessagesByChat] = useLocalStorage('ra_messages', seedMessages)
  const [reminders, setReminders] = useLocalStorage('ra_reminders', seedReminders)
  const [customTags, setCustomTags] = useLocalStorage('ra_tags', seedCustomTags)

  // ====== UI 状态 ======
  const [currentView, setCurrentView] = useState('chat') // chat | calendar | list
  const [currentChatId, setCurrentChatId] = useState(null)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [prefillData, setPrefillData] = useState(null)

  // ====== 对话操作 ======
  const createChat = useCallback((name) => {
    const chat = {
      id: genId(),
      name: name || '新对话',
      avatar: name ? name.charAt(0) : '💬',
      createdAt: new Date().toISOString(),
    }
    setChats(prev => [chat, ...prev])
    return chat
  }, [setChats])

  const selectChat = useCallback((chatId) => {
    setCurrentChatId(chatId)
    setCurrentView('chat')
  }, [])

  const deleteChat = useCallback((chatId) => {
    setChats(prev => prev.filter(c => c.id !== chatId))
    setMessagesByChat(prev => {
      const next = { ...prev }
      delete next[chatId]
      return next
    })
    if (currentChatId === chatId) setCurrentChatId(null)
  }, [setChats, setMessagesByChat, currentChatId])

  // ====== 消息操作 ======
  const sendMessage = useCallback((chatId, text, isVoice = false) => {
    const msg = {
      id: genId(),
      chatId,
      text,
      isVoice,
      isUser: true,
      createdAt: new Date().toISOString(),
    }
    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), msg]
    }))
    // 更新对话的 lastMessage
    setChats(prev => prev.map(c =>
      c.id === chatId
        ? { ...c, lastMessage: text, lastTime: msg.createdAt }
        : c
    ))
    return msg
  }, [setMessagesByChat, setChats])

  // ====== 提醒操作 ======
  const openReminderModal = useCallback((data = null, editReminder = null) => {
    setPrefillData(data)
    setEditingReminder(editReminder)
    setShowReminderModal(true)
  }, [])

  const closeReminderModal = useCallback(() => {
    setShowReminderModal(false)
    setPrefillData(null)
    setEditingReminder(null)
  }, [])

  const saveReminder = useCallback((data) => {
    if (editingReminder) {
      // 编辑模式
      setReminders(prev => prev.map(r =>
        r.id === editingReminder.id ? { ...r, ...data } : r
      ))
    } else {
      // 新建
      const reminder = createReminder(data)
      setReminders(prev => [reminder, ...prev])
    }
    closeReminderModal()
  }, [editingReminder, setReminders, closeReminderModal])

  const toggleReminderComplete = useCallback((id) => {
    setReminders(prev => prev.map(r =>
      r.id === id
        ? { ...r, completed: !r.completed, completedAt: !r.completed ? new Date().toISOString() : null }
        : r
    ))
  }, [setReminders])

  const deleteReminder = useCallback((id) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }, [setReminders])

  // ====== 标签操作 ======
  const addCustomTag = useCallback((tag) => {
    setCustomTags(prev => prev.includes(tag) ? prev : [...prev, tag])
  }, [setCustomTags])

  // ====== 语音创建提醒 ======
  const handleVoiceCreateReminder = useCallback((text) => {
    const parsed = parseReminderFromText(text)
    openReminderModal(parsed)
  }, [openReminderModal])

  // ====== 从消息创建提醒 ======
  const handleCreateReminderFromMessage = useCallback((message, chat) => {
    const parsed = parseReminderFromText(message.text)
    openReminderModal({
      ...parsed,
      chatId: chat.id,
      messageId: message.id,
    })
  }, [openReminderModal])

  const currentChat = chats.find(c => c.id === currentChatId)
  const currentMessages = currentChatId ? (messagesByChat[currentChatId] || []) : []

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ====== PC端布局 (lg+: ≥1024px) ====== */}
      <div className="lg:flex lg:h-full hidden">
        {/* 左侧持久化导航栏 */}
        <PcSidebarNav
          current={currentView}
          onChange={setCurrentView}
          reminderCount={reminders.filter(r => !r.completed).length}
          onQuickAdd={() => openReminderModal()}
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={selectChat}
          onCreateChat={createChat}
          onDeleteChat={deleteChat}
        />

        {/* 右侧主内容区 */}
        <main className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          {currentView === 'chat' && (
            <div className="h-full flex bg-white">
              <div className="flex-1 overflow-hidden">
                {currentChat ? (
                  <ChatView
                    chat={currentChat}
                    messages={currentMessages}
                    onSendMessage={(text, isVoice) => sendMessage(currentChat.id, text, isVoice)}
                    onCreateReminder={(msg) => handleCreateReminderFromMessage(msg, currentChat)}
                    onVoiceCreateReminder={handleVoiceCreateReminder}
                    onBack={() => setCurrentChatId(null)}
                    reminders={reminders.filter(r => r.chatId === currentChat.id)}
                    onToggleComplete={toggleReminderComplete}
                  />
                ) : (
                  <EmptyState
                    chats={chats}
                    onSelectChat={selectChat}
                    onCreateChat={createChat}
                    onVoiceCreateReminder={handleVoiceCreateReminder}
                  />
                )}
              </div>
            </div>
          )}

          {currentView === 'calendar' && (
            <CalendarView
              reminders={reminders}
              onToggleComplete={toggleReminderComplete}
              onEditReminder={(r) => openReminderModal(null, r)}
              onDeleteReminder={deleteReminder}
              onCreateReminder={() => openReminderModal()}
            />
          )}

          {currentView === 'list' && (
            <ReminderListView
              reminders={reminders}
              onToggleComplete={toggleReminderComplete}
              onEditReminder={(r) => openReminderModal(null, r)}
              onDeleteReminder={deleteReminder}
              onCreateReminder={() => openReminderModal()}
            />
          )}
        </main>
      </div>

      {/* ====== 移动端/平板布局 (< 1024px) ====== */}
      <div className="lg:hidden flex flex-col h-full">
        {/* 主体内容区 — 保持原有逻辑完全不变 */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'chat' && (
            <div className="h-full flex">
              {/* 左侧对话列表 - md+显示（平板也显示） */}
              <div className="hidden md:block w-80 border-r border-gray-200 bg-white overflow-hidden">
                <Sidebar
                  chats={chats}
                  currentChatId={currentChatId}
                  onSelectChat={selectChat}
                  onCreateChat={createChat}
                  onDeleteChat={deleteChat}
                  onVoiceCreateReminder={handleVoiceCreateReminder}
                />
              </div>
              {/* 右侧聊天窗口 */}
              <div className="flex-1 overflow-hidden">
                {currentChat ? (
                  <ChatView
                    chat={currentChat}
                    messages={currentMessages}
                    onSendMessage={(text, isVoice) => sendMessage(currentChat.id, text, isVoice)}
                    onCreateReminder={(msg) => handleCreateReminderFromMessage(msg, currentChat)}
                    onVoiceCreateReminder={handleVoiceCreateReminder}
                    onBack={() => setCurrentChatId(null)}
                    reminders={reminders.filter(r => r.chatId === currentChat.id)}
                    onToggleComplete={toggleReminderComplete}
                  />
                ) : (
                  <EmptyState
                    chats={chats}
                    onSelectChat={selectChat}
                    onCreateChat={createChat}
                    onVoiceCreateReminder={handleVoiceCreateReminder}
                  />
                )}
              </div>
            </div>
          )}

          {currentView === 'calendar' && (
            <CalendarView
              reminders={reminders}
              onToggleComplete={toggleReminderComplete}
              onEditReminder={(r) => openReminderModal(null, r)}
              onDeleteReminder={deleteReminder}
              onCreateReminder={() => openReminderModal()}
            />
          )}

          {currentView === 'list' && (
            <ReminderListView
              reminders={reminders}
              onToggleComplete={toggleReminderComplete}
              onEditReminder={(r) => openReminderModal(null, r)}
              onDeleteReminder={deleteReminder}
              onCreateReminder={() => openReminderModal()}
            />
          )}
        </div>

        {/* 底部导航栏 — 仅移动端/平板显示 */}
        <BottomNav
          current={currentView}
          onChange={setCurrentView}
          reminderCount={reminders.filter(r => !r.completed).length}
          onQuickAdd={() => openReminderModal()}
        />
      </div>

      {/* 提醒设置弹窗 — 全局共享，内部自适应 PC/Mobile */}
      {showReminderModal && (
        <ReminderModal
          prefill={prefillData}
          editing={editingReminder}
          customTags={customTags}
          onAddTag={addCustomTag}
          onSave={saveReminder}
          onClose={closeReminderModal}
        />
      )}
    </div>
  )
}

/* 空状态组件 */
function EmptyState({ chats, onSelectChat, onCreateChat, onVoiceCreateReminder }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="text-6xl mb-4">📋</div>
      <h2 className="text-lg font-semibold text-gray-700 mb-2">提醒助手</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        为对话任务设置提醒，支持语音输入、自定义标签、固定1/3/5日提醒
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => {
            const chat = onCreateChat('新客户对话')
            onSelectChat(chat.id)
          }}
          className="w-full py-3 bg-wechat-green text-white rounded-lg font-medium hover:bg-wechat-green-dark transition-colors"
        >
          + 新建对话
        </button>
        <div className="w-full">
          <VoiceButton onResult={onVoiceCreateReminder} variant="green" label="🎤 语音创建提醒" />
        </div>
      </div>

      {chats.length > 0 && (
        <div className="mt-8 w-full max-w-xs">
          <p className="text-xs text-gray-400 mb-2">最近对话</p>
          {chats.slice(0, 3).map(chat => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-wechat-green text-white flex items-center justify-center text-sm font-medium">
                {chat.avatar || '💬'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-700">{chat.name}</p>
                <p className="text-xs text-gray-400 truncate">{chat.lastMessage || '点击继续对话'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
