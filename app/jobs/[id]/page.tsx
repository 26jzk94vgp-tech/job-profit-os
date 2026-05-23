'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../utils/supabase/client'
import Link from 'next/link'
import JobStatusToggle from './JobStatusToggle'
import DeleteEntry from './DeleteEntry'
import { useLanguage } from '../../../lib/i18n/LanguageContext'
import { formatDate } from '../../../lib/utils'

export default function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [job, setJob] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'entries' ? 'entries' : 'overview')
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [jobDates, setJobDates] = useState<{ start: string | null, end: string | null }>({ start: null, end: null })
  const [editingDates, setEditingDates] = useState(false)
  const [draftStart, setDraftStart] = useState('')
  const [draftEnd, setDraftEnd] = useState('')

  useEffect(() => {
    supabase.from('job_summary').select('*').eq('id', id).single().then(({ data }) => setJob(data))
    supabase.from('jobs').select('notes, start_date, end_date').eq('id', id).single().then(({ data }: { data: any }) => {
      if (data) {
        setNotes(data.notes || '')
        setJobDates({ start: data.start_date, end: data.end_date })
        setDraftStart(data.start_date || '')
        setDraftEnd(data.end_date || '')
      }
    })
    supabase.from('job_entries').select('*').eq('job_id', id).order('created_at', { ascending: false }).then(({ data }) => setEntries(data || []))
  }, [id])

  if (!job) return <div className="p-6">Loading...</div>

  const revenue = Number(job.revenue)
  const labor = Number(job.labor_cost)
  const fuel = Number(job.fuel_cost || 0)
  const material = Number(job.material_cost)
  const subcontract = Number(job.subcontract_cost)
  const profit = Number(job.profit)
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  async function updatePaymentStatus(entryId: string, status: string, received?: number) {
    const update: Record<string, unknown> = { payment_status: status }
    if (received !== undefined) update.payment_received = received
    await supabase.from('job_entries').update(update).eq('id', entryId)
    setEntries((prev: any[]) => prev.map((e: any) => e.id === entryId ? { ...e, payment_status: status, payment_received: received ?? e.payment_received } : e))
  }

  async function saveDates() {
    await supabase.from('jobs').update({ start_date: draftStart || null, end_date: draftEnd || null }).eq('id', id)
    setJobDates({ start: draftStart || null, end: draftEnd || null })
    setEditingDates(false)
  }

  function addToCalendar() {
    const start = jobDates.start || new Date().toISOString().split('T')[0]
    const end = jobDates.end || start
    const icsStart = start.replace(/-/g, '')
    const icsEnd = (() => {
      const d = new Date(end + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0].replace(/-/g, '')
    })()
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const clientInfo = job.client_name ? `Client: ${job.client_name}` : ''
    const profitInfo = `Profit: $${profit.toLocaleString()} (${margin}%)`
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CIMO//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${icsStart}`, `DTEND;VALUE=DATE:${icsEnd}`,
      `DTSTAMP:${now}`, `UID:job-${id}@jobprofitos`,
      `SUMMARY:${job.name}`,
      `DESCRIPTION:${[clientInfo, profitInfo, notes].filter(Boolean).join('\\n')}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.name.replace(/[^a-z0-9]/gi, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const unpaidInvoices = entries.filter((e: any) => e.type === 'invoice' && e.payment_status !== 'paid')
  const unpaidTotal = unpaidInvoices.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

  const typeLabel = (type: string) => {
    if (lang !== 'zh') return type
    const labels: Record<string, string> = { invoice: '发票', labor: '人工', material: '材料', subcontract: '分包', fuel: '油费' }
    return labels[type] || type
  }

  const statusLabel = (status: string) => {
    if (lang !== 'zh') {
      const enLabels: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue', partial: 'Partial' }
      return enLabels[status] || status
    }
    const labels: Record<string, string> = { paid: '已付', unpaid: '未付', overdue: '逾期', partial: '部分付款' }
    return labels[status] || status
  }

  const timelineProgress = (() => {
    if (!jobDates.start || !jobDates.end) return null
    const start = new Date(jobDates.start)
    const end = new Date(jobDates.end)
    const today = new Date()
    const total = end.getTime() - start.getTime()
    const elapsed = today.getTime() - start.getTime()
    const pct = total > 0 ? Math.max(0, Math.min(100, (elapsed / total) * 100)) : 0
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = daysLeft < 0
    const totalDays = Math.ceil(total / (1000 * 60 * 60 * 24))
    return { pct, daysLeft, isOverdue, totalDays }
  })()

  const inputCls = "border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-[#F2F2F7] bg-white dark:bg-[#3A3A3C] outline-none text-sm focus:ring-2 focus:ring-blue-500/40 transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 dark:text-[#8E8E93] hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900 dark:text-white">{job.name}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={addToCalendar} className="bg-gray-100 dark:bg-[#3A3A3C] hover:bg-gray-200 text-gray-700 dark:text-[#F2F2F7] px-3 py-2 rounded-lg text-sm font-medium">📅 {lang === 'zh' ? '加入日历' : 'Add to Calendar'}</button>
            <Link href={'/jobs/' + id + '/invoice'} className="bg-gray-100 dark:bg-[#3A3A3C] hover:bg-gray-200 text-gray-700 dark:text-[#F2F2F7] px-3 py-2 rounded-lg text-sm font-medium">🧾 {lang === 'zh' ? '发票' : 'Invoice'}</Link>
            <Link href={'/jobs/' + id + '/edit'} className="bg-gray-100 dark:bg-[#3A3A3C] hover:bg-gray-200 text-gray-700 dark:text-[#F2F2F7] px-3 py-2 rounded-lg text-sm font-medium">✏️ {lang === 'zh' ? '编辑' : 'Edit'}</Link>
            <Link href={'/jobs/' + id + '/add'} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '添加条目' : 'Add Entry'}</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-16 pb-8 md:pt-8">
        <div className="md:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-gray-500 dark:text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900 dark:text-white">{job.name}</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowMore(!showMore)} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-[#3A3A3C] rounded-full text-gray-600 dark:text-[#8E8E93] font-bold text-sm">•••</button>
            <Link href={'/jobs/' + id + '/add'} className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold">+ {lang === 'zh' ? '添加' : 'Add'}</Link>
          </div>
        </div>
        {showMore && (
          <div className="md:hidden bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-[#3A3A3C] shadow-lg mb-4 overflow-hidden">
            <button onClick={() => { addToCalendar(); setShowMore(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] text-sm text-gray-700 dark:text-[#F2F2F7]">📅 <span>{lang === 'zh' ? '加入日历' : 'Add to Calendar'}</span></button>
            <div className="border-t border-gray-100 dark:border-[#3A3A3C]"><Link href={'/jobs/' + id + '/invoice'} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] text-sm text-gray-700 dark:text-[#F2F2F7]">🧾 <span>{lang === 'zh' ? '查看发票' : 'Invoice'}</span></Link></div>
            <div className="border-t border-gray-100 dark:border-[#3A3A3C]"><Link href={'/jobs/' + id + '/edit'} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] text-sm text-gray-700 dark:text-[#F2F2F7]">✏️ <span>{lang === 'zh' ? '编辑工单' : 'Edit Job'}</span></Link></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-600 dark:text-[#8E8E93] font-medium">{job.client_name}</p>
            {(jobDates.start || jobDates.end) && (
              <p className="text-[#8E8E93] text-xs mt-0.5">
                📅 {jobDates.start || ''}{jobDates.end && jobDates.end !== jobDates.start ? ` → ${jobDates.end}` : ''}
              </p>
            )}
          </div>
          <JobStatusToggle jobId={id} currentStatus={job.status} />
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-[#2C2C2E] p-1 rounded-xl">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#8E8E93]'}`}>{lang === 'zh' ? '概览' : 'Overview'}</button>
          <button onClick={() => setActiveTab('entries')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'entries' ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#8E8E93]'}`}>{lang === 'zh' ? '条目' : 'Entries'}</button>
          <button onClick={() => setActiveTab('invoice')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'invoice' ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#8E8E93]'}`}>{lang === 'zh' ? '发票' : 'Invoice'}</button>
        </div>

        {activeTab === 'overview' && (<>
          {unpaidTotal > 0 && (
            <div className="bg-yellow-50 dark:bg-[#2C2100] border border-yellow-200 dark:border-[#FF9F0A]/20 rounded-xl p-4 mb-6 flex justify-between items-center">
              <div>
                <p className="font-medium text-yellow-800 dark:text-[#FF9F0A]">💰 {lang === 'zh' ? '未收款项' : 'Outstanding Payments'}</p>
                <p className="text-yellow-600 dark:text-[#FF9F0A]/70 text-sm">{unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}</p>
              </div>
              <span className="font-bold text-yellow-800 dark:text-[#FF9F0A]">${unpaidTotal.toLocaleString()}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent p-5">
              <p className="text-gray-500 dark:text-[#8E8E93] text-sm">{lang === 'zh' ? '收入' : 'Revenue'}</p>
              <p className={`text-2xl font-bold mt-1 ${revenue > 0 ? "text-[#30D158]" : "text-[#8E8E93]"}`}>${revenue.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent p-5">
              <p className="text-gray-500 dark:text-[#8E8E93] text-sm">{lang === 'zh' ? '利润' : 'Profit'}</p>
              <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>${profit.toLocaleString()} ({margin}%)</p>
            </div>
          </div>

          {revenue > 0 && (
            <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent p-5 mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-500 dark:text-[#8E8E93] text-sm">{lang === 'zh' ? '收款进度' : 'Payment Progress'}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-[#F2F2F7]">${(revenue - unpaidTotal).toLocaleString()} / ${revenue.toLocaleString()}</p>
              </div>
              <div className="w-full bg-gray-100 dark:bg-[#3A3A3C] rounded-full h-3">
                <div className="bg-[#30D158] h-3 rounded-full transition-all" style={{ width: `${Math.min(100, ((revenue - unpaidTotal) / revenue) * 100).toFixed(0)}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-[#30D158]">{lang === 'zh' ? '已收' : 'Received'}: ${(revenue - unpaidTotal).toLocaleString()}</p>
                {unpaidTotal > 0 && <p className="text-xs text-[#FF453A]">{lang === 'zh' ? '未收' : 'Unpaid'}: ${unpaidTotal.toLocaleString()}</p>}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent p-5 mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-500 dark:text-[#8E8E93] text-sm">{lang === 'zh' ? '工期' : 'Timeline'}</p>
              <button onClick={() => { setEditingDates(!editingDates); setDraftStart(jobDates.start || ''); setDraftEnd(jobDates.end || '') }} className="text-[#0A84FF] text-xs font-medium">
                {editingDates ? (lang === 'zh' ? '取消' : 'Cancel') : (lang === 'zh' ? '编辑' : 'Edit')}
              </button>
            </div>

            {editingDates ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-[#8E8E93] mb-1 block">{lang === 'zh' ? '开始日期' : 'Start Date'}</label>
                    <input type="date" className={inputCls + ' w-full'} value={draftStart} onChange={e => setDraftStart(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-[#8E8E93] mb-1 block">{lang === 'zh' ? '结束日期' : 'End Date'}</label>
                    <input type="date" className={inputCls + ' w-full'} value={draftEnd} onChange={e => setDraftEnd(e.target.value)} />
                  </div>
                </div>
                <button onClick={saveDates} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {lang === 'zh' ? '保存日期' : 'Save Dates'}
                </button>
              </div>
            ) : jobDates.start && jobDates.end && timelineProgress ? (
              <div>
                <div className="flex justify-between text-xs text-[#8E8E93] mb-2">
                  <span>{jobDates.start}</span>
                  <span className={timelineProgress.isOverdue ? 'text-[#FF453A] font-semibold' : timelineProgress.daysLeft <= 7 ? 'text-[#FF9F0A] font-semibold' : 'text-[#8E8E93]'}>
                    {timelineProgress.isOverdue
                      ? (lang === 'zh' ? `逾期 ${Math.abs(timelineProgress.daysLeft)} 天` : `${Math.abs(timelineProgress.daysLeft)}d overdue`)
                      : timelineProgress.daysLeft === 0
                      ? (lang === 'zh' ? '今天到期' : 'Due today')
                      : (lang === 'zh' ? `剩余 ${timelineProgress.daysLeft} 天` : `${timelineProgress.daysLeft}d left`)}
                  </span>
                  <span>{jobDates.end}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#3A3A3C] rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${timelineProgress.isOverdue ? 'bg-[#FF453A]' : timelineProgress.daysLeft <= 7 ? 'bg-[#FF9F0A]' : 'bg-[#0A84FF]'}`}
                    style={{ width: `${timelineProgress.pct.toFixed(0)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-xs text-[#8E8E93]">{timelineProgress.pct.toFixed(0)}% {lang === 'zh' ? '已过' : 'elapsed'}</p>
                  <p className="text-xs text-[#8E8E93]">{lang === 'zh' ? `共 ${timelineProgress.totalDays} 天` : `${timelineProgress.totalDays}d total`}</p>
                </div>
              </div>
            ) : (
              <p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '点击编辑设置工期' : 'Tap Edit to set timeline'}</p>
            )}
          </div>

          <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent mb-4">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
              <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '成本明细' : 'Cost Breakdown'}</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              <div className="px-6 py-3 flex justify-between"><span className="text-gray-600 dark:text-[#8E8E93]">{lang === 'zh' ? '人工' : 'Labor'}</span><span className={labor > 0 ? "text-[#FF453A]" : "text-[#8E8E93]"}>${labor.toLocaleString()}</span></div>
              <div className="px-6 py-3 flex justify-between"><span className="text-gray-600 dark:text-[#8E8E93]">{lang === 'zh' ? '材料' : 'Materials'}</span><span className={material > 0 ? "text-[#FF453A]" : "text-[#8E8E93]"}>${material.toLocaleString()}</span></div>
              <div className="px-6 py-3 flex justify-between"><span className="text-gray-600 dark:text-[#8E8E93]">{lang === 'zh' ? '分包' : 'Subcontract'}</span><span className={subcontract > 0 ? "text-[#FF453A]" : "text-[#8E8E93]"}>${subcontract.toLocaleString()}</span></div>
              {fuel > 0 && <div className="px-6 py-3 flex justify-between"><span className="text-gray-600 dark:text-[#8E8E93]">{lang === 'zh' ? '车辆/油费' : 'Vehicle/Fuel'}</span><span className="text-[#FF453A]">${fuel.toLocaleString()}</span></div>}
            </div>
          </div>

          <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C] flex justify-between items-center">
              <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '备注' : 'Notes'}</h2>
              <button onClick={() => setEditingNotes(!editingNotes)} className="text-[#0A84FF] text-xs">{editingNotes ? (lang === 'zh' ? '取消' : 'Cancel') : (lang === 'zh' ? '编辑' : 'Edit')}</button>
            </div>
            <div className="px-6 py-4">
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea className="w-full border border-gray-200 dark:border-[#3A3A3C] rounded-xl p-3 text-gray-900 dark:text-[#F2F2F7] dark:bg-[#3A3A3C] outline-none text-sm" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={lang === 'zh' ? '添加备注...' : 'Add notes...'} />
                  <button onClick={async () => { await supabase.from('jobs').update({ notes }).eq('id', id); setEditingNotes(false) }} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">{lang === 'zh' ? '保存' : 'Save'}</button>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-[#8E8E93] text-sm">{notes || <span className="text-gray-400">{lang === 'zh' ? '暂无备注，点击编辑添加' : 'No notes yet. Click Edit to add.'}</span>}</p>
              )}
            </div>
          </div>
        </>)}

        {activeTab === 'entries' && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
              <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '条目' : 'Entries'}</h2>
            </div>
            {!entries.length && <div className="px-6 py-8 text-center text-gray-400">{lang === 'zh' ? '还没有条目。' : 'No entries yet.'}</div>}
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {entries.map((entry: any) => (
                <div key={entry.id} className="px-6 py-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] px-2 py-0.5 rounded-full uppercase">{typeLabel(entry.type)}</span>
                      {entry.type === 'invoice' && (
                        <span className={
                          entry.payment_status === 'paid' ? 'text-xs bg-green-100 dark:bg-[#30D158]/20 text-green-700 dark:text-[#30D158] px-2 py-0.5 rounded-full' :
                          entry.payment_status === 'overdue' ? 'text-xs bg-red-100 dark:bg-[#FF453A]/20 text-red-700 dark:text-[#FF453A] px-2 py-0.5 rounded-full' :
                          entry.payment_status === 'partial' ? 'text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-700 dark:text-[#0A84FF] px-2 py-0.5 rounded-full' :
                          'text-xs bg-yellow-100 dark:bg-[#FF9F0A]/20 text-yellow-700 dark:text-[#FF9F0A] px-2 py-0.5 rounded-full'
                        }>{statusLabel(entry.payment_status || 'unpaid')}</span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-[#F2F2F7] mt-1">{entry.description || entry.worker_name || entry.type}</p>
                    {entry.type === 'fuel' && entry.trip_from && <p className="text-gray-400 text-xs">{entry.trip_from} → {entry.trip_to} {entry.kilometers && entry.kilometers + 'km'}</p>}
                    {entry.type === 'invoice' && entry.payment_due_date && <p className="text-gray-400 text-xs">{lang === 'zh' ? '到期' : 'Due'}: {formatDate(entry.payment_due_date)}</p>}
                    {entry.type === 'invoice' && entry.payment_status !== 'paid' && (
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => updatePaymentStatus(entry.id, 'paid')} className="text-xs bg-green-100 dark:bg-[#30D158]/20 text-green-700 dark:text-[#30D158] px-2 py-0.5 rounded-full hover:bg-green-200">✓ {lang === 'zh' ? '标记已付' : 'Mark Paid'}</button>
                        <button onClick={() => { const amt = prompt(lang === 'zh' ? '输入已收金额：' : 'Enter amount received:'); if (amt) updatePaymentStatus(entry.id, 'partial', Number(amt)) }} className="text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-700 dark:text-[#0A84FF] px-2 py-0.5 rounded-full hover:bg-blue-200">{lang === 'zh' ? '部分付款' : 'Partial'}</button>
                      </div>
                    )}
                    {entry.type === 'invoice' && entry.payment_status === 'partial' && entry.payment_received > 0 && (
                      <p className="text-[#0A84FF] text-xs">{lang === 'zh' ? '已收' : 'Received'}: ${Number(entry.payment_received).toLocaleString()} · {lang === 'zh' ? '未收' : 'Outstanding'}: ${(Number(entry.amount) - Number(entry.payment_received)).toLocaleString()}</p>
                    )}
                    {entry.notes === 'QUOTE_ESTIMATE' && <p className="text-yellow-600 text-xs mt-1">⚠️ {lang === 'zh' ? '报价估算，请确认实际采购价格' : 'Quote estimate — update with actual purchase price'}</p>}
                    <p className="text-gray-400 text-sm">{formatDate(entry.entry_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={entry.type === 'invoice' ? 'text-[#30D158] font-medium' : 'text-[#FF453A] font-medium'}>
                      {entry.type === 'invoice' ? '+' : ''}${entry.type === 'labor' ? (Number(entry.hours) * Number(entry.hourly_rate)).toLocaleString() : Number(entry.amount).toLocaleString()}
                    </span>
                    <Link href={'/jobs/' + id + '/entry/' + entry.id + '/edit'} className="text-[#0A84FF] text-sm">{lang === 'zh' ? '编辑' : 'Edit'}</Link>
                    <DeleteEntry entryId={entry.id} jobId={id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-transparent">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
              <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '发票条目' : 'Invoice Entries'}</h2>
            </div>
            {entries.filter((e: any) => e.type === 'invoice').length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400">
                <p>{lang === 'zh' ? '还没有发票条目' : 'No invoice entries yet.'}</p>
                {/* ✅ 修复：跳转时带 ?type=invoice，自动预选收入+发票 */}
                <Link href={'/jobs/' + id + '/add?type=invoice'} className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ {lang === 'zh' ? '添加发票' : 'Add Invoice'}</Link>
              </div>
            )}
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {entries.filter((e: any) => e.type === 'invoice').map((entry: any) => (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{entry.description || (lang === 'zh' ? '发票' : 'Invoice')}</p>
                      {entry.payment_due_date && <p className="text-gray-400 text-xs">{lang === 'zh' ? '到期' : 'Due'}: {formatDate(entry.payment_due_date)}</p>}
                      <span className={
                        entry.payment_status === 'paid' ? 'text-xs bg-green-100 dark:bg-[#30D158]/20 text-green-700 dark:text-[#30D158] px-2 py-0.5 rounded-full' :
                        entry.payment_status === 'partial' ? 'text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-700 dark:text-[#0A84FF] px-2 py-0.5 rounded-full' :
                        'text-xs bg-yellow-100 dark:bg-[#FF9F0A]/20 text-yellow-700 dark:text-[#FF9F0A] px-2 py-0.5 rounded-full'
                      }>{statusLabel(entry.payment_status || 'unpaid')}</span>
                    </div>
                    <span className="text-[#30D158] font-bold">${Number(entry.amount).toLocaleString()}</span>
                  </div>
                  {entry.payment_status !== 'paid' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updatePaymentStatus(entry.id, 'paid')} className="text-xs bg-green-100 dark:bg-[#30D158]/20 text-green-700 dark:text-[#30D158] px-3 py-1 rounded-full hover:bg-green-200">✓ {lang === 'zh' ? '标记已付' : 'Mark Paid'}</button>
                      <button onClick={() => { const amt = prompt(lang === 'zh' ? '输入已收金额：' : 'Enter amount received:'); if (amt) updatePaymentStatus(entry.id, 'partial', Number(amt)) }} className="text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-700 dark:text-[#0A84FF] px-3 py-1 rounded-full hover:bg-blue-200">{lang === 'zh' ? '部分付款' : 'Partial'}</button>
                    </div>
                  )}
                  {entry.payment_status === 'partial' && entry.payment_received > 0 && (
                    <p className="text-[#0A84FF] text-xs mt-1">{lang === 'zh' ? '已收' : 'Received'}: ${Number(entry.payment_received).toLocaleString()} · {lang === 'zh' ? '未收' : 'Outstanding'}: ${(Number(entry.amount) - Number(entry.payment_received)).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
            {entries.filter((e: any) => e.type === 'invoice').length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-[#3A3A3C] flex gap-3">
                {/* ✅ 有发票时也显示添加按钮 */}
                <Link href={'/jobs/' + id + '/add?type=invoice'} className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-medium transition-colors">
                  + {lang === 'zh' ? '添加发票' : 'Add Invoice'}
                </Link>
                <Link href={'/jobs/' + id + '/invoice'} className="flex-1 block text-center bg-gray-100 dark:bg-[#3A3A3C] hover:bg-gray-200 text-gray-700 dark:text-[#F2F2F7] py-3 rounded-xl text-sm font-medium transition-colors">
                  🧾 {lang === 'zh' ? '查看完整发票 / 打印 PDF' : 'View Full Invoice / Print PDF'}
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
