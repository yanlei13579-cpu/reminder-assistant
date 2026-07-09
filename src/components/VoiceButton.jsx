import { useState, useRef, useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

/**
 * 语音输入按钮
 * variant:
 *   - compact: 小图标按钮（侧边栏/标题栏）
 *   - full: 完整宽度的语音输入条（聊天底部输入栏）
 *   - green: 绿色背景文字按钮（标题栏/空状态页）
 *
 * 增强功能：
 * - 不可用/未授权时显示明确的降级提示
 * - 支持手动文本模拟模式（当语音不可用时的替代方案）
 */
export default function VoiceButton({
  onResult,
  variant = 'full',
  label = '语音输入',
  placeholder = '点击说话，自动识别事项'
}) {
  const { isListening, interimText, toggle, supported, errorState, resetError } = useSpeechRecognition(onResult)
  // 文本模拟模式：语音不可用时允许手动输入文本模拟语音识别结果
  const [simulateMode, setSimulateMode] = useState(false)
  const [simulateText, setSimulateText] = useState('')
  const simulateInputRef = useRef(null)

  // 提交模拟文本
  const submitSimulate = () => {
    if (simulateText.trim()) {
      onResult?.(simulateText.trim())
      setSimulateText('')
      setSimulateMode(false)
    }
  }

  // 键盘提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitSimulate()
    }
  }

  // 进入模拟模式时自动聚焦
  useEffect(() => {
    if (simulateMode && simulateInputRef.current) {
      simulateInputRef.current.focus()
    }
  }, [simulateMode])

  const micIcon = (
    <svg className={variant === 'compact' ? 'w-5 h-5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v3" />
    </svg>
  )

  const waveIcon = (
    <div className={`voice-wave flex items-center gap-0.5 ${variant === 'compact' ? 'h-5' : 'h-4'}`}>
      <span style={{ height: variant === 'compact' ? '6px' : '4px' }}></span>
      <span style={{ height: variant === 'compact' ? '12px' : '10px' }}></span>
      <span style={{ height: variant === 'compact' ? '18px' : '16px' }}></span>
      <span style={{ height: variant === 'compact' ? '10px' : '8px' }}></span>
      <span style={{ height: variant === 'compact' ? '8px' : '6px' }}></span>
    </div>
  )

  // ====== 渲染错误/降级提示 ======
  const renderErrorHint = () => {
    if (!supported || errorState === 'unsupported') {
      return null
    }
    if (errorState === 'not-allowed') {
      return (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2 mt-1.5 leading-relaxed">
          <p className="font-medium mb-1">🎤 麦克风权限受限</p>
          <p>当前环境无法使用麦克风。可切换到<strong>文字模拟</strong>模式体验完整功能。</p>
        </div>
      )
    }
    return null
  }

  // ====== 渲染文本模拟输入框 ======
  const renderSimulateInput = () => (
    <div className={`mt-2 ${variant === 'green' ? '' : 'border-t pt-2'}`}>
      <div className="flex items-center gap-2">
        <textarea
          ref={simulateInputRef}
          value={simulateText}
          onChange={(e) => setSimulateText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="在此输入文字，模拟语音识别效果（如：明天提醒张女士13812345678做孕产回访）"
          rows={2}
          className="flex-1 text-sm border border-gray-200 rounded-lg p-2 resize-none focus:border-wechat-green focus:ring-1 focus:ring-wechat-green outline-none"
        />
        <button
          onClick={submitSimulate}
          disabled={!simulateText.trim()}
          className="px-3 py-1.5 bg-wechat-green text-white text-sm rounded-lg font-medium hover:bg-wechat-green-dark disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          解析
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        💡 支持自然语言，系统会自动解析客户姓名、联系方式、日期和标签
      </p>
    </div>
  )

  // compact 模式：小图标
  if (variant === 'compact') {
    return (
      <div>
        <button
          onClick={toggle}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isListening ? 'bg-red-100 text-red-500' : 'hover:bg-gray-200 text-gray-600'
          }`}
          title={
            !supported ? '浏览器不支持语音识别'
            : errorState === 'not-allowed' ? '麦克风权限受限'
            : label
          }
        >
          {isListening ? waveIcon : micIcon}
        </button>
        {(errorState === 'not-allowed') && (
          <button
            onClick={() => setSimulateMode(!simulateMode)}
            className="block w-full mt-1 text-xs text-wechat-green hover:underline"
            title="切换到文字模拟模式"
          >
            文字模拟
          </button>
        )}
      </div>
    )
  }

  // green 模式：绿色背景文字按钮
  if (variant === 'green') {
    return (
      <div className="relative">
        <button
          onClick={() => {
            if (errorState === 'not-allowed') {
              setSimulateMode(!simulateMode)
            } else {
              toggle()
            }
          }}
          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 font-medium transition-all ${
            isListening
              ? 'bg-red-500 text-white'
              : errorState === 'not-allowed'
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-wechat-green text-white hover:bg-wechat-green-dark'
          }`}
          title={
            errorState === 'not-allowed' ? '点击使用文字模拟模式'
            : supported ? label : '浏览器不支持语音识别'
          }
        >
          {isListening ? waveIcon : micIcon}
          {errorState === 'not-allowed'
            ? (simulateMode ? '取消模拟' : '📝 文字模拟')
            : isListening
              ? '聆听中...'
              : label
          }
        </button>

        {isListening && interimText && (
          <div className="absolute top-full mt-2 right-0 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-h-32 overflow-y-auto min-w-[200px] z-20">
            {interimText}
          </div>
        )}

        {/* 错误提示 */}
        {renderErrorHint()}

        {/* 文字模拟输入 */}
        {simulateMode && renderSimulateInput()}
      </div>
    )
  }

  // full 模式：完整宽度
  return (
    <div className="relative">
      <button
        onClick={() => {
          if (errorState === 'not-allowed') {
            setSimulateMode(!simulateMode)
          } else {
            toggle()
          }
        }}
        className={`w-full py-2.5 rounded-lg font-medium transition-all ${
          isListening
            ? 'bg-red-50 text-red-500 border-2 border-red-300'
            : errorState === 'not-allowed'
              ? 'bg-amber-50 text-amber-600 border-2 border-amber-300'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-wechat-green'
        }`}
      >
        {isListening ? (
          <span className="flex items-center justify-center gap-2">
            {waveIcon}
            正在聆听... 点击停止
          </span>
        ) : errorState === 'not-allowed' ? (
          <span className="flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path strokeLinecap="round" d="M8 12h8M12 8v8" />
            </svg>
            📝 切换到文字模拟模式（麦克风不可用）
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            {micIcon}
            {placeholder}
          </span>
        )}
      </button>

      {isListening && interimText && (
        <div className="absolute bottom-full mb-2 left-0 right-0 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-h-32 overflow-y-auto">
          {interimText}
        </div>
      )}

      {/* 错误提示 */}
      {renderErrorHint()}

      {/* 文字模拟输入 */}
      {simulateMode && renderSimulateInput()}
    </div>
  )
}
