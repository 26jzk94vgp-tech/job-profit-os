'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function NewJob() {
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { lang } = useLanguage()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cn = params.get('client_name')
    const ci = params.get('client_id')
    if (cn) setClientName(decodeURIComponent(cn))
    if (ci) setClientId(ci)
  }, [])

  async function handleSubmit() {
    if (!name) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('jobs').insert({
      name,
      client_name: clientName,
      client_id: clientId || null,
      notes: notes || null,
      start_date: startDate || null,
      end_date: endDate || null,
      owner_id: user?.id
    })
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/' }
    setLoading(false)
  }

  const inputCls = "w-full border border-gray-200 dark:border-[#3A3A3C] rounded-xl p-3 mt-1 text-gray-900 dark:text-[#F2F2F7] dark:bg-[#3A3A3C] outline-none focus:ring-2 focus:ring-blue-500/40 transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1C1C1E] pt-12 md:pt-0">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-gray-400 dark:text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</button>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '新建工单' : 'New Job'}</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-4">
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{lang === 'zh' ? '工单名称 *' : 'Job Name *'}</label>
            <input className={inputCls} placeholder={lang === 'zh' ? '例如：厨房翻新' : 'e.g. Kitchen Renovation'} value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{lang === 'zh' ? '客户名称' : 'Client Name'}</label>
            <input className={inputCls} placeholder={lang === 'zh' ? '例如：张先生' : 'e.g. John Smith'} value={clientName} onChange={e => setClientName(e.target.value)} />
            {clientId && <p className="text-xs text-[#30D158] mt-1">✓ {lang === 'zh' ? '已关联客户档案' : 'Linked to client profile'}</p>}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{lang === 'zh' ? '开始日期' : 'Start Date'}</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{lang === 'zh' ? '结束日期' : 'End Date'}</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">{lang === 'zh' ? '备注' : 'Notes'}</label>
            <textarea className={inputCls + ' resize-none'} rows={3} placeholder={lang === 'zh' ? '例如：工程地址、特殊要求等' : 'e.g. Site address, special requirements...'} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button onClick={handleSubmit} disabled={loading || !name} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? (lang === 'zh' ? '创建中...' : 'Creating...') : (lang === 'zh' ? '创建工单' : 'Create Job')}
          </button>
        </div>
      </main>
    </div>
  )
}
