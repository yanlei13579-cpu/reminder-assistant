import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * 语音识别 Hook — 基于 Web Speech API
 * 支持：开始识别、停止识别、实时文本输出
 * 自动将识别结果传入回调，供上层解析
 *
 * 增强功能：
 * - 错误状态管理（区分不可用/未授权/其他错误）
 * - 防止 not-allowed 时反复弹 alert 和重启
 * - 提供降级模式提示
 */
export function useSpeechRecognition(onResult) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [supported, setSupported] = useState(false)
  const [errorState, setErrorState] = useState(null) // 'not-allowed' | 'no-speech' | null
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  // 防止同一错误反复触发 alert/日志的节流标记
  const errorReportedRef = useRef(false)

  // 保持回调最新
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  // 初始化语音识别
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      setErrorState('unsupported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      if (interim) setInterimText(interim)
      if (final) {
        setInterimText('')
        onResultRef.current?.(final)
      }
    }

    recognition.onerror = (event) => {
      console.warn('[语音识别错误]', event.error)

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false)
        setErrorState('not-allowed')
        // 清理 shouldListen 标志，防止 onend 反复重启
        if (recognitionRef.current) {
          recognitionRef.current.__shouldListen = false
        }
        // 只报告一次错误
        if (!errorReportedRef.current) {
          errorReportedRef.current = true
        }
      } else if (event.error === 'no-speech') {
        // 无语音输入是正常的静默情况，不需要处理
        console.info('未检测到语音输入')
      } else if (event.error === 'network') {
        console.warn('语音服务网络错误，可能需要检查网络连接')
      } else {
        console.warn('语音识别异常:', event.error)
      }
    }

    recognition.onend = () => {
      if (recognitionRef.current?.__shouldListen && errorState !== 'not-allowed') {
        try {
          recognition.start()
        } catch (e) {
          // 可能权限已被撤销或其他原因无法启动
          setIsListening(false)
          recognitionRef.current.__shouldListen = false
        }
      } else {
        setIsListening(false)
        setInterimText('')
      }
    }

    recognitionRef.current = recognition
    setSupported(true)

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.__shouldListen = false
        try { recognitionRef.current.stop() } catch {}
      }
      recognitionRef.current = null
    }
  }, [errorState]) // 依赖 errorState 以便在错误时停止自动重启

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setErrorState('unsupported')
      return
    }
    // 重置错误状态和报告标记
    setErrorState(null)
    errorReportedRef.current = false
    try {
      recognitionRef.current.__shouldListen = true
      recognitionRef.current.start()
      setIsListening(true)
    } catch (e) {
      console.warn('启动语音识别失败:', e.message)
      setIsListening(false)
      // 如果是因为已经在运行，尝试先停再启
      try {
        recognitionRef.current.stop()
        setTimeout(() => {
          if (recognitionRef.current?.__shouldListen) {
            recognitionRef.current.start()
            setIsListening(true)
          }
        }, 100)
      } catch {}
    }
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.__shouldListen = false
    try {
      recognitionRef.current.stop()
    } catch {
      // 忽略
    }
    setIsListening(false)
    setInterimText('')
  }, [])

  const toggle = useCallback(() => {
    if (isListening) stop()
    else start()
  }, [isListening, start, stop])

  const resetError = useCallback(() => {
    setErrorState(null)
    errorReportedRef.current = false
  }, [])

  return { isListening, interimText, start, stop, toggle, supported, errorState, resetError }
}
