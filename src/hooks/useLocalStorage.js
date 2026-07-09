import { useState, useEffect, useCallback } from 'react'

/**
 * localStorage 持久化 Hook
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 存储满或隐私模式，静默失败
    }
  }, [key, value])

  return [value, setValue]
}

/**
 * 生成唯一 ID
 */
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
