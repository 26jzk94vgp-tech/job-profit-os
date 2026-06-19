'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { HOME_OFFICE_RATE } from '../../lib/tax'

export default function HomeOffice() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [logs, setLogs] = useState<any[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const RATE_PER_HOUR = HOME_OFFICE_RATE

  async function loadLogs() {
    const { data } = await supabase.from('home_office_logs').select('*').order('log_date', { ascending: false })
    setLogs(data || [])
  }

  async function handleAdd() {
    if (!hours) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('home_office_logs').insert({ owner_id: user?.id, log_date: date, hours: Number(hours), description })
    if (error) { console.error(error); alert('保存失败,请重试 / Save failed, please try again') } else { setHours(''); setDescription(''); loadLogs() }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('home_office_logs').delete().eq('id', id)
    loadLogs()
  }

  useEffect(() => { loadLogs() }, [])
  useEffect(() => setMounted(true), [])

  const hoNow = new Date()
  const fyStartYear = hoNow.getMonth() >= 6 ? hoNow.getFullYear() : hoNow.getFullYear() - 1
  const fyStart = new Date(fyStartYear, 6, 1)
  const fyEnd = new Date(fyStartYear + 1, 5, 30, 23, 59, 59)
  const fyLabel = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`
  const fyLogs = mounted ? logs.filter(l => { const d = new Date(l.log_date); return d >= fyStart && d <= fyEnd }) : logs
  const totalHours = fyLogs.reduce((sum, l) => sum + Number(l.hours), 0)
  const totalDeduction = totalHours * RATE_PER_HOUR

  const byMonth: Record<string, { hours: number, logs: any[] }> = {}
  fyLogs.forEach(l => {
    const key = new Date(l.log_date).toLocaleString('en-AU', { month: 'long', year: 'numeric' })
    if (!byMonth[key]) byMonth[key] = { hours: 0, logs: [] }
    byMonth[key].hours += Number(l.hours)
    byMonth[key].logs.push(l)
  })

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/tax" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">← {lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '家庭办公室' : 'Home Office'}</h1>
        </div>
      </nav>
      <div className="md:hidden flex items-center gap-2 px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60">
        <Link href="/tax" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
        <span className="text-[#3A3A3C]">/</span>
        <h1 className="font-semibold text-gray-900 dark:text-white text-sm">{lang === 'zh' ? '家庭办公室' : 'Home Office'}</h1>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5">
          <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">💡 ATO Fixed Rate Method · {fyLabel}</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">{lang === 'zh' ? '记录在家工作工时 × 70¢。已含电/气/电话/网络/文具，不能再单独抵；家具设备折旧可另抵。' : 'Hours worked from home x 70c. Covers electricity, gas, phone, internet, stationery (no separate claim); furniture/equipment depreciation claimable separately.'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-5">
            <p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '今年总工时' : 'Total Hours'}</p>
            <p className="text-3xl font-bold text-[#0A84FF] mt-1">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-5">
            <p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '可抵扣金额' : 'Total Deduction'}</p>
            <p className="text-3xl font-bold text-[#30D158] mt-1">${totalDeduction.toFixed(2)}</p>
            <p className="text-[#8E8E93] text-xs mt-1">@ 70c/hr</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '记录工时' : 'Add Hours'}</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '日期' : 'Date'}</label>
              <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="w-32">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '工时' : 'Hours'}</label>
              <input type="number" step="0.5" min="0" max="24" className={inputCls} placeholder="e.g. 2" value={hours} onChange={e => setHours(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '描述' : 'Description'}</label>
            <input className={inputCls} placeholder={lang === 'zh' ? '处理发票和报价单' : 'Processing invoices and quotes'} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {hours && <p className="text-[#30D158] text-sm">{lang === 'zh' ? '可抵扣' : 'Deduction'}: ${(Number(hours) * RATE_PER_HOUR).toFixed(2)}</p>}
          <button onClick={handleAdd} disabled={loading || !hours} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '添加记录' : 'Add Entry')}
          </button>
        </div>

        {Object.entries(byMonth).map(([month, data]) => (
          <div key={month} className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C] flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">{month}</h3>
              <div className="text-right">
                <p className="text-sm font-medium text-[#0A84FF]">{data.hours.toFixed(1)}h</p>
                <p className="text-xs text-[#30D158]">${(data.hours * RATE_PER_HOUR).toFixed(2)}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {data.logs.map((log: any) => (
                <div key={log.id} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div>
                    <p className="text-gray-900 dark:text-[#F2F2F7] text-sm">{log.log_date} — {log.hours}h</p>
                    {log.description && <p className="text-[#8E8E93] text-xs">{log.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#30D158] text-sm">${(Number(log.hours) * RATE_PER_HOUR).toFixed(2)}</span>
                    <button onClick={() => handleDelete(log.id)} className="text-[#FF453A] text-xs hover:text-red-400 transition-colors">{lang === 'zh' ? '删除' : 'Delete'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent px-6 py-16 text-center text-[#8E8E93]">
            {lang === 'zh' ? '还没有记录，开始追踪工时吧！' : 'No entries yet. Start tracking your home office hours!'}
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-2xl p-5">
          <p className="text-yellow-800 dark:text-yellow-300 font-medium text-sm">⚠️ ATO {lang === 'zh' ? '要求' : 'Requirements'}</p>
          <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">{lang === 'zh' ? '使用固定费率法需保留全年工时记录至少 5 年。CIMO 是记账计算工具，非注册税务/BAS 代理；以上为估算，报税前请核对 ATO 或咨询代理。' : 'Keep hourly records for at least 5 years. CIMO is a bookkeeping tool, not a registered tax/BAS agent. Estimates only - verify with the ATO or a registered agent before lodging.'}</p>
        </div>
      </main>
    </div>
  )
}
