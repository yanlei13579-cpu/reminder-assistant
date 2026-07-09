import { useState, useRef, useEffect } from 'react'
import VoiceButton from './VoiceButton'
import { isWeChatBrowser } from '../hooks/useSpeechRecognition'
import { parseReminderFromText, getReminderDateText, getTagColor, isOverdue, contactTypeLabel } from '../utils/helpers'

/**
 * 右侧聊天窗口 — 微信风格
 *
 * 增强功能：
 * - 发送文字消息后自动解析文本
 * - 如果检测到提醒相关信息（客户名/联系方式/日期），自动弹出提醒确认弹窗
 */
export default function ChatView({ chat, messages, onSendMessage, onCreateReminder, onVoiceCreateReminder, onBack, reminders, onToggleComplete }) {
  const [inputText, setInputText] = useState('')
  const [inputMode, setInputMode] = useState('text') // text | voice
  const messagesEndRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  /**
   * 发送消息 — 核心增强：
   * 1. 先将消息发出（保证对话流畅）
   * 2. 自动解析消息文本中的提醒信息
   * 3. 如果检测到有效信息（客户名、联系方式或日期），自动弹出提醒确认弹窗
   */
  const handleSend = () => {
    if (!inputText.trim()) return
    const text = inputText.trim()
    onSendMessage(text)
    setInputText('')

    // 自动解析文本，检测是否需要创建提醒
    const parsed = parseReminderFromText(text)
    const hasContent =
      parsed.customerName ||
      (parsed.contact && parsed.contact.value) ||
      (parsed.triggerDate && parsed.triggerDate !== '') ||
      parsed.tags.length > 0

    if (hasContent) {
      // 稍微延迟让消息先渲染出来，再弹窗
      setTimeout(() => {
        onCreateReminder({ text, ...parsed })
      }, 300)
    }
  }

  const handleVoiceResult = (text) => {
    // 语音识别后，将文本作为消息发送（同样走自动解析流程）
    if (!text.trim()) return
    onSendMessage(text, true)

    // 同样自动解析语音转文字的内容
    const parsed = parseReminderFromText(text)
    const hasContent =
      parsed.customerName ||
      (parsed.contact && parsed.contact.value) ||
      (parsed.triggerDate && parsed.triggerDate !== '') ||
      parsed.tags.length > 0

    if (hasContent) {
      setTimeout(() => {
        onCreateReminder({ text, isVoice: true, ...parsed })
      }, 300)
    }
  }

  return (
    <div className="h-full flex flex-col chat-bg">
      {/* 顶部标题栏 */}
      <div className="flex items-center gap-3 px-4 py-2.5 lg:px-6 lg:py-3 bg-white border-b border-gray-200">
        <button
          onClick={onBack}
          className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-gray-600"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-800 lg:text-base">{chat.name}</h2>
          <p className="text-xs text-gray-400">{messages.length} 条消息</p>
        </div>
        <VoiceButton onResult={onVoiceCreateReminder} variant="green" label="语音提醒" />
      </div>

      {/* 本对话的提醒卡片 */}
      {reminders.length > 0 && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 mb-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
            </svg>
            <span className="font-medium">本对话提醒 ({reminders.length})</span>
          </div>
          <div className="flex gap-2 lg:gap-3 overflow-x-auto scrollbar-hide">
            {reminders.map(r => (
              <div
                key={r.id}
                onClick={() => onToggleComplete(r.id)}
                className={`flex-shrink-0 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm border cursor-pointer transition-all ${
                  r.completed
                    ? 'bg-green-100 border-green-200 text-green-600'
                    : isOverdue(r)
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <span className="font-medium">{r.customerName || '未命名'}</span>
                <span className="mx-1 text-gray-300">|</span>
                {getReminderDateText(r)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">开始对话吧</p>
            <p className="text-xs mt-1">发送消息后可长按消息创建提醒</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onCreateReminder={() => onCreateReminder(msg)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 底部输入栏 */}
      <div className="border-t border-gray-200 bg-white px-3 py-2">
        {inputMode === 'voice' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputMode('text')}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <div className="flex-1">
              <VoiceButton onResult={handleVoiceResult} variant="full" placeholder="点击说话，发送消息" />
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                if (isWeChatBrowser()) return
                setInputMode('voice')
              }}
              disabled={isWeChatBrowser()}
              className={`w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 ${
                isWeChatBrowser()
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={isWeChatBrowser() ? '微信浏览器不支持语音输入' : '切换语音输入'}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v3" />
              </svg>
            </button>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入消息内容..."
              rows={1}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-wechat-green max-h-24 lg:min-w-[400px]"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-wechat-green text-white text-sm rounded-lg disabled:opacity-40 flex-shrink-0"
            >
              发送
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* 消息气泡组件 */
function MessageBubble({ message, onCreateReminder }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showLongPressHint, setShowLongPressHint] = useState(false)
  const longPressTimer = useRef(null)

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true)
      setShowLongPressHint(true)
    }, 500)
  }

  const handleLongPressEnd = () => {
    clearTimeout(longPressTimer.current)
  }

  const time = new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[75%] lg:max-w-[60%] ${message.isUser ? 'flex-row-reverse' : ''}`}>
        {/* 头像 */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0 ${
          message.isUser ? 'bg-wechat-green' : 'bg-gray-400'
        }`}>
          {message.isUser ? '我' : 'AI'}
        </div>

        {/* 气泡 */}
        <div
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onContextMenu={(e) => {
            e.preventDefault()
            setShowMenu(true)
          }}
          className="relative"
        >
          <div className={`px-3 py-2 rounded-lg text-sm break-words ${
            message.isUser
              ? 'bg-wechat-green text-white rounded-tr-sm'
              : 'bg-white text-gray-800 rounded-tl-sm'
          }`}>
            {message.isVoice && (
              <div className="flex items-center gap-1 text-xs mb-1 opacity-70">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v3" />
                </svg>
                语音转文字
              </div>
            )}
            {message.text}
          </div>

          {/* 时间 */}
          <div className={`text-xs text-gray-400 mt-0.5 ${message.isUser ? 'text-right' : 'text-left'}`}>
            {time}
          </div>

          {/* 长按菜单 */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setShowMenu(false); setShowLongPressHint(false) }} />
              <div className={`absolute z-20 top-0 ${message.isUser ? 'right-full mr-2' : 'left-full ml-2'} bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden whitespace-nowrap`}>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowLongPressHint(false)
                    onCreateReminder()
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm hover:bg-gray-700 w-full"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
                  </svg>
                  创建提醒
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowLongPressHint(false) }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm hover:bg-gray-700 w-full border-t border-gray-700"
                >
                  取消
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
