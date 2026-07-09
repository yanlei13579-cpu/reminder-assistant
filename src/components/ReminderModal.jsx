import { useState, useEffect } from 'react'
import { TAG_COLORS, getTagColor, contactTypeLabel } from '../utils/helpers'

/**
 * 提醒设置弹窗 — 响应式双模式
 * - 移动端：底部滑出式 (MobileReminderModal)
 * - PC端：居中对话框 (DesktopReminderModal)
 */
export default function ReminderModal({ prefill, editing, customTags, onAddTag, onSave, onClose }) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // 仅客户端执行，SSR 安全
    setIsDesktop(window.innerWidth >= 1024)
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  if (isDesktop) {
    return <DesktopReminderModal prefill={prefill} editing={editing} customTags={customTags} onAddTag={onAddTag} onSave={onSave} onClose={onClose} />
  }
  return <MobileReminderModal prefill={prefill} editing={editing} customTags={customTags} onAddTag={onAddTag} onSave={onSave} onClose={onClose} />
}

/* ============================================================
 * 共享逻辑 Hook — 两个模式共用相同的表单状态和操作
 * ============================================================ */
function useReminderForm({ prefill, editing, onSave }) {
  const isAutoParse = !editing && prefill && (prefill.rawText || prefill.text)

  const [form, setForm] = useState({
    customerName: '', contactType: 'phone', contactValue: '',
    tags: [], reminderType: 'custom', triggerDate: '', triggerTime: '09:00',
    monthlyDay: 1, note: '',
  })
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editing) {
      setForm({
        customerName: editing.customerName || '',
        contactType: editing.contact?.type || 'phone',
        contactValue: editing.contact?.value || '',
        tags: editing.tags || [],
        reminderType: editing.reminderType || 'custom',
        triggerDate: editing.triggerDate || '',
        triggerTime: editing.triggerTime || '09:00',
        monthlyDay: editing.monthlyDay || 1,
        note: editing.note || '',
        chatId: editing.chatId, messageId: editing.messageId,
      })
    } else if (prefill) {
      setForm({
        customerName: prefill.customerName || '',
        contactType: prefill.contact?.type || 'phone',
        contactValue: prefill.contact?.value || '',
        tags: prefill.tags || [],
        reminderType: prefill.reminderType || 'custom',
        triggerDate: prefill.triggerDate || '',
        triggerTime: prefill.triggerTime || '09:00',
        monthlyDay: prefill.monthlyDay || 1,
        note: prefill.note || '',
        chatId: prefill.chatId, messageId: prefill.messageId,
      })
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setForm(prev => ({ ...prev, triggerDate: tomorrow.toISOString().slice(0, 10) }))
    }
  }, [prefill, editing])

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleAddTag = () => {
    const tag = newTag.trim()
    if (!tag) return
    if (!form.tags.includes(tag)) toggleTag(tag)
    onAddTag(tag)
    setNewTag('')
  }

  const validate = () => {
    const errs = {}
    if (!form.customerName.trim()) errs.customerName = '请输入客户姓名'
    if (!form.contactValue.trim()) errs.contactValue = '请输入联系方式'
    if (form.reminderType === 'custom' && !form.triggerDate) errs.triggerDate = '请选择提醒日期'
    if (form.reminderType === 'monthly' && (!form.monthlyDay || form.monthlyDay < 1 || form.monthlyDay > 31)) errs.monthlyDay = '请输入有效的日期 (1-31)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      customerName: form.customerName.trim(),
      contact: { type: form.contactType, value: form.contactValue.trim() },
      tags: form.tags,
      reminderType: form.reminderType,
      triggerDate: form.reminderType === 'custom' ? form.triggerDate : '',
      triggerTime: form.triggerTime,
      monthlyDay: form.reminderType === 'monthly' ? form.monthlyDay : null,
      note: form.note.trim(),
      chatId: form.chatId, messageId: form.messageId,
    })
  }

  const allTags = [...Object.keys(TAG_COLORS), ...customTags.filter(t => !TAG_COLORS[t])]

  return { form, errors, isAutoParse, newTag, setNewTag, update, toggleTag, handleAddTag, validate, handleSave, allTags }
}

/* ============================================================
 * MobileReminderModal — 底部滑出式（原有实现）
 * ============================================================ */
function MobileReminderModal(props) {
  const { onClose } = props
  const { form, errors, isAutoParse, newTag, setNewTag, update, toggleTag, handleAddTag, handleSave, allTags } = useReminderForm(props)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* 顶部把手 */}
        <div className="sticky top-0 bg-white z-10 pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2" />

          {/* 自动解析提示 */}
          {isAutoParse && (
            <div className="mx-4 mb-2 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🤖</span>
                <span className="text-sm font-semibold text-blue-700">智能识别结果 — 请确认</span>
              </div>
              {props.prefill?.rawText && (
                <p className="text-xs text-blue-600/70 bg-white/60 rounded px-2 py-1 truncate mt-1">
                  原文：{props.prefill.rawText}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {props.prefill?.customerName && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                    👤 {props.prefill.customerName}
                  </span>
                )}
                {props.prefill?.contact?.value && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200">
                    📱 {contactTypeLabel(props.prefill.contact.type)} {props.prefill.contact.value}
                  </span>
                )}
                {props.prefill?.triggerDate && props.prefill.reminderType === 'custom' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    📅 {props.prefill.triggerDate} {props.prefill.triggerTime}
                  </span>
                )}
                {props.prefill?.reminderType === 'monthly' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    🔄 每月{props.prefill.monthlyDay}号
                  </span>
                )}
                {props.prefill?.tags?.map(tag => (
                  <span key={tag} className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)}`}>
                    🏷️ {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
            <button onClick={onClose} className="text-sm text-gray-500">取消</button>
            <h3 className="text-base font-semibold text-gray-800">
              {props.editing ? '编辑提醒' : isAutoParse ? '确认提醒' : '新建提醒'}
            </h3>
            <button onClick={handleSave} className="text-sm text-wechat-green font-medium">保存</button>
          </div>
        </div>

        {/* 表单 - 单列 */}
        <div className="px-5 py-4 space-y-5">
          <FormFields form={form} errors={errors} newTag={newTag} setNewTag={setNewTag}
            update={update} toggleTag={toggleTag} handleAddTag={handleAddTag} allTags={allTags} />
          <PreviewSection form={form} />
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3">
          {isAutoParse ? (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200">跳过</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-wechat-green text-white rounded-lg font-medium hover:bg-wechat-green-dark">✓ 确认创建</button>
            </div>
          ) : (
            <button onClick={handleSave} className="w-full py-3 bg-wechat-green text-white rounded-lg font-medium hover:bg-wechat-green-dark">
              {props.editing ? '保存修改' : '创建提醒'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * DesktopReminderModal — 居中对话框（PC端新增）
 * ============================================================ */
function DesktopReminderModal(props) {
  const { onClose, editing } = props
  const { form, errors, isAutoParse, newTag, setNewTag, update, toggleTag, handleAddTag, handleSave, allTags } = useReminderForm(props)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />

      {/* 对话框主体 */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl animate-fade-in max-h-[85vh] flex flex-col overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {editing ? '编辑提醒' : isAutoParse ? '确认提醒信息' : '新建提醒'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 自动解析提示条（桌面版） */}
        {isAutoParse && (
          <div className="mx-6 mt-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex-shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">🤖</span>
              <span className="text-sm font-semibold text-blue-700">智能识别结果</span>
              <span className="text-xs text-blue-500 ml-auto">请确认后保存</span>
            </div>
            {props.prefill?.rawText && (
              <p className="text-xs text-blue-600/70 bg-white/70 rounded px-2.5 py-1 truncate mb-2">
                原文：{props.prefill.rawText}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {props.prefill?.customerName && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                  👤 {props.prefill.customerName}
                </span>
              )}
              {props.prefill?.contact?.value && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200">
                  📱 {contactTypeLabel(props.prefill.contact.type)} {props.prefill.contact.value}
                </span>
              )}
              {props.prefill?.triggerDate && props.prefill.reminderType === 'custom' && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  📅 {props.prefill.triggerDate} {props.prefill.triggerTime}
                </span>
              )}
              {props.prefill?.reminderType === 'monthly' && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  🔄 每月{props.prefill.monthlyDay}号
                </span>
              )}
              {props.prefill?.tags?.map(tag => (
                <span key={tag} className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)}`}>🏷️ {tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* 表单区域 - 双列布局 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* 左列 */}
            <div className="space-y-5">
              <FormField label="客户姓名" required error={errors.customerName}>
                <input type="text" value={form.customerName} onChange={e => update('customerName', e.target.value)}
                  placeholder="如：张先生、李女士、王总"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${
                    errors.customerName ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-wechat-green'
                  }`} />
              </FormField>

              <FormField label="联系方式" required error={errors.contactValue}>
                <div className="flex gap-2">
                  <select value={form.contactType} onChange={e => update('contactType', e.target.value)}
                    className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-wechat-green bg-white">
                    <option value="phone">手机</option>
                    <option value="wechat">微信</option>
                  </select>
                  <input type="text" value={form.contactValue} onChange={e => update('contactValue', e.target.value)}
                    placeholder={form.contactType === 'phone' ? '手机号' : '微信号'}
                    className={`flex-1 px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${
                      errors.contactValue ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-wechat-green'
                    }`} />
                </div>
              </FormField>

              <FormField label="标签">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allTags.map(tag => {
                    const selected = form.tags.includes(tag)
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                          selected ? getTagColor(tag) + ' font-medium' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}>
                        {selected ? '✓ ' : ''}{tag}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="自定义标签..."
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-wechat-green" />
                  <button onClick={handleAddTag} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">+ 添加</button>
                </div>
              </FormField>
            </div>

            {/* 右列 */}
            <div className="space-y-5">
              <FormField label="提醒类型">
                <div className="grid grid-cols-3 gap-2">
                  <TypeButton active={form.reminderType === 'custom'} onClick={() => update('reminderType', 'custom')} icon="📅" label="自定义" />
                  <TypeButton active={form.reminderType === 'monthly'} onClick={() => update('reminderType', 'monthly')} icon="🔄" label="每月" />
                  <TypeButton active={form.reminderType === 'fixed135'} onClick={() => update('reminderType', 'fixed135')} icon="📌" label="1/3/5日" />
                </div>
              </FormField>

              {form.reminderType === 'custom' && (
                <FormField label="提醒日期" required error={errors.triggerDate}>
                  <div className="flex gap-2">
                    <input type="date" value={form.triggerDate} onChange={e => update('triggerDate', e.target.value)}
                      className={`flex-1 px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${
                        errors.triggerDate ? 'border-red-300' : 'border-gray-200 focus:border-wechat-green'
                      }`} />
                    <QuickDateButtons onPick={(date) => update('triggerDate', date)} />
                  </div>
                </FormField>
              )}

              {form.reminderType === 'monthly' && (
                <FormField label="每月提醒日" required error={errors.monthlyDay}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">每月</span>
                    <input type="number" min="1" max="31" value={form.monthlyDay} onChange={e => update('monthlyDay', parseInt(e.target.value) || 1)}
                      className="w-16 px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:border-wechat-green" />
                    <span className="text-sm text-gray-500">号</span>
                  </div>
                </FormField>
              )}

              {form.reminderType === 'fixed135' && (
                <div className="px-3 py-2.5 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">将在每月 <strong>1日、3日、5日</strong> 自动提醒</p>
                </div>
              )}

              <FormField label="提醒时间">
                <input type="time" value={form.triggerTime} onChange={e => update('triggerTime', e.target.value)}
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-wechat-green" />
              </FormField>
            </div>
          </div>

          {/* 备注 - 跨两列 */}
          <div className="mt-5">
            <FormField label="备注">
              <textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="补充说明..." rows={2}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-wechat-green" />
            </FormField>
          </div>

          {/* 预览 */}
          <PreviewSection form={form} />
        </div>

        {/* 底部按钮栏 */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            取消
          </button>
          {isAutoParse ? (
            <button onClick={handleSave} className="px-5 py-2.5 bg-wechat-green text-white rounded-lg text-sm font-medium hover:bg-wechat-green-dark transition-colors">
              ✓ 确认创建
            </button>
          ) : (
            <button onClick={handleSave} className="px-5 py-2.5 bg-wechat-green text-white rounded-lg text-sm font-medium hover:bg-wechat-green-dark transition-colors">
              {editing ? '保存修改' : '创建提醒'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * 共享子组件
 * ============================================================ */

/** 表单字段集合（供 Mobile 单列使用） */
function FormFields({ form, errors, newTag, setNewTag, update, toggleTag, handleAddTag, allTags }) {
  return (
    <>
      <FormField label="客户姓名" required error={errors.customerName}>
        <input type="text" value={form.customerName} onChange={e => update('customerName', e.target.value)}
          placeholder="如：张先生、李女士、王总"
          className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${
            errors.customerName ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-wechat-green'
          }}`} />
      </FormField>

      <FormField label="联系方式" required error={errors.contactValue}>
        <div className="flex gap-2">
          <select value={form.contactType} onChange={e => update('contactType', e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-wechat-green bg-white">
            <option value="phone">📱 手机</option>
            <option value="wechat">💬 微信</option>
          </select>
          <input type="text" value={form.contactValue} onChange={e => update('contactValue', e.target.value)}
            placeholder={form.contactType === 'phone' ? '请输入手机号' : '请输入微信号'}
            className={`flex-1 px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${
              errors.contactValue ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-wechat-green'
            }`} />
        </div>
      </FormField>

      <FormField label="标签">
        <div className="flex flex-wrap gap-2 mb-2">
          {allTags.map(tag => {
            const selected = form.tags.includes(tag)
            return (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  selected ? getTagColor(tag) + ' font-medium' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {selected ? '✓ ' : ''}{tag}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="自定义标签..."
            className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-wechat-green" />
          <button onClick={handleAddTag} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">+ 添加</button>
        </div>
      </FormField>

      <FormField label="提醒类型">
        <div className="grid grid-cols-3 gap-2">
          <TypeButton active={form.reminderType === 'custom'} onClick={() => update('reminderType', 'custom')} icon="📅" label="自定义日期" />
          <TypeButton active={form.reminderType === 'monthly'} onClick={() => update('reminderType', 'monthly')} icon="🔄" label="每月提醒" />
          <TypeButton active={form.reminderType === 'fixed135'} onClick={() => update('reminderType', 'fixed135')} icon="📌" label="1/3/5日" />
        </div>
      </FormField>

      {form.reminderType === 'custom' && (
        <FormField label="提醒日期" required error={errors.triggerDate}>
          <div className="flex gap-2">
            <input type="date" value={form.triggerDate} onChange={e => update('triggerDate', e.target.value)}
              className={`flex-1 px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${
                errors.triggerDate ? 'border-red-300' : 'border-gray-200 focus:border-wechat-green'
              }`} />
            <QuickDateButtons onPick={(date) => update('triggerDate', date)} />
          </div>
        </FormField>
      )}

      {form.reminderType === 'monthly' && (
        <FormField label="每月提醒日" required error={errors.monthlyDay}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">每月</span>
            <input type="number" min="1" max="31" value={form.monthlyDay} onChange={e => update('monthlyDay', parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:border-wechat-green" />
            <span className="text-sm text-gray-500">号</span>
          </div>
        </FormField>
      )}

      {form.reminderType === 'fixed135' && (
        <div className="px-3 py-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>系统将在每月 <strong>1日、3日、5日</strong> 自动提醒</span>
          </div>
        </div>
      )}

      <FormField label="提醒时间">
        <input type="time" value={form.triggerTime} onChange={e => update('triggerTime', e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-wechat-green" />
      </FormField>

      <FormField label="备注">
        <textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="补充说明..." rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-wechat-green" />
      </FormField>
    </>
  )
}

/** 预览区域（两个模式共享） */
function PreviewSection({ form }) {
  return (
    <div className="px-4 py-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-400 mb-1.5">预览</p>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">{form.customerName || '客户姓名'}</span>
            {form.contactValue && (
              <span className="text-xs text-gray-400">{contactTypeLabel(form.contactType)}: {form.contactValue}</span>
            )}
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {form.tags.map(tag => (
                <span key={tag} className={`px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)}`}>{tag}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            {form.reminderType === 'custom' && `📅 ${form.triggerDate || '日期'} ${form.triggerTime}`}
            {form.reminderType === 'monthly' && `🔄 每月${form.monthlyDay}号 ${form.triggerTime}`}
            {form.reminderType === 'fixed135' && `📌 每月1/3/5日 ${form.triggerTime}`}
          </p>
          {form.note && <p className="text-xs text-gray-400 mt-1">📝 {form.note}</p>}
        </div>
      </div>
    </div>
  )
}

/* 表单字段包装 */
function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

/* 提醒类型按钮 */
function TypeButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border-2 transition-all ${
        active ? 'border-wechat-green bg-green-50 text-wechat-green' : 'border-gray-200 text-gray-500 hover:border-gray-300'
      }`}>
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

/* 快捷日期按钮 */
function QuickDateButtons({ onPick }) {
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  const in3days = new Date(); in3days.setDate(today.getDate() + 3)
  const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7)
  const fmt = (d) => d.toISOString().slice(0, 10)

  return (
    <div className="flex gap-1">
      <QuickBtn label="明天" date={fmt(tomorrow)} onPick={onPick} />
      <QuickBtn label="3天后" date={fmt(in3days)} onPick={onPick} />
      <QuickBtn label="下周" date={fmt(nextWeek)} onPick={onPick} />
    </div>
  )
}

function QuickBtn({ label, date, onPick }) {
  return (
    <button onClick={() => onPick(date)}
      className="px-2 py-2.5 text-xs bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 whitespace-nowrap">
      {label}
    </button>
  )
}
