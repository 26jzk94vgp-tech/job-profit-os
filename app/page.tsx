
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase/client'
import Link from 'next/link'
import { useLanguage, LangToggle } from '../lib/i18n/LanguageContext'
import { formatDate } from '../lib/utils'

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [badDebts, setBadDebts] = useState<any[]>([])
  const [showImportTip, setShowImportTip] = useState(true)
  const [sortBy, setSortBy] = useState("date")
  const [user, setUser] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const supabase = createClient()
  const { t, lang } = useLanguage()

  function sortJobs(jobList: any[], byDue = false) {
    return [...jobList].sort((a: any, b: any) => {
      if (byDue || sortBy === "due") {
        const aDue = a.earliest_due_date || "9999-12-31"
        const bDue = b.earliest_due_date || "9999-12-31"
        return new Date(aDue).getTime() - new Date(bDue).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data: jobData } = await supabase.from('job_summary').select('*')
    setJobs(jobData || [])
    const { data: entryData } = await supabase.from('job_entries').select('*, jobs(name)').in('type', ['invoice', 'material', 'subcontract', 'labor', 'fuel'])
    setEntries(entryData || [])
    const { data: overdueData } = await supabase.from('overdue_invoices').select('*')
    setBadDebts(overdueData || [])
  }

  useEffect(() => { loadData() }, [])

  function toCSV(headers: string[], rows: string[][]): string {
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    return [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
  }
  function downloadCSV(filename: string, csv: string) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }
  function exportJobs() {
    const headers = lang === 'zh' ? ['工单名称', '客户', '状态', '收入', '成本', '利润', '利润率', '创建日期'] : ['Job Name', 'Client', 'Status', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Created']
    const rows = jobs.map(j => { const revenue = Number(j.revenue); const profit = Number(j.profit); const cost = revenue - profit; const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'; return [j.name || '', j.client_name || '', j.status || '', revenue.toFixed(2), cost.toFixed(2), profit.toFixed(2), margin, j.created_at ? new Date(j.created_at).toLocaleDateString('en-AU') : ''] })
    downloadCSV(`jobs-${new Date().toISOString().split('T')[0]}.csv`, toCSV(headers, rows))
    setShowExport(false)
  }
  function exportEntries() {
    const headers = lang === 'zh' ? ['工单', '类型', '描述', '日期', '数量', '单位', '单价', '金额', '付款状态', '到期日'] : ['Job', 'Type', 'Description', 'Date', 'Qty', 'Unit', 'Unit Price', 'Amount', 'Payment Status', 'Due Date']
    const rows = entries.map(e => { const amount = e.type === 'labor' ? (Number(e.hours) * Number(e.hourly_rate)).toFixed(2) : Number(e.amount).toFixed(2); return [e.jobs?.name || '', e.type || '', e.description || e.worker_name || '', e.entry_date ? new Date(e.entry_date).toLocaleDateString('en-AU') : '', e.quantity || e.hours || '', e.unit || '', e.unit_price || e.hourly_rate || '', amount, e.payment_status || '', e.payment_due_date ? new Date(e.payment_due_date).toLocaleDateString('en-AU') : ''] })
    downloadCSV(`entries-${new Date().toISOString().split('T')[0]}.csv`, toCSV(headers, rows))
    setShowExport(false)
  }

  const totalProfit = jobs.reduce((sum, j) => sum + Number(j.profit), 0)
  const totalRevenue = jobs.reduce((sum, j) => sum + Number(j.revenue), 0)
  const totalCost = totalRevenue - totalProfit
  const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'
  const activeJobs = jobs.filter(j => j.status === 'active').length
  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const unpaidInvoices = entries.filter(e => e.type === 'invoice' && e.payment_status !== 'paid')
  const totalReceivable = unpaidInvoices.reduce((sum, e) => sum + Number(e.amount), 0)
  const overdueInvoices = unpaidInvoices.filter(e => e.payment_due_date && new Date(e.payment_due_date) < new Date())
  const TAX_THRESHOLD = 45001
  const superReminder = totalProfit > TAX_THRESHOLD
  const visibleJobs = jobs.filter(j => !['archived'].includes(j.status))

  function toggleSelect(id: string) { setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next }) }
  function exitEditMode() { setEditMode(false); setSelected(new Set()); setConfirmDelete(false) }
  async function bulkUpdateStatus(status: string) { if (!selected.size) return; setBulkLoading(true); await Promise.all([...selected].map(id => supabase.from('jobs').update({ status }).eq('id', id))); await loadData(); exitEditMode(); setBulkLoading(false) }
  async function bulkDelete() { if (!selected.size) return; setBulkLoading(true); await Promise.all([...selected].map(id => supabase.from('jobs').delete().eq('id', id))); await loadData(); exitEditMode(); setBulkLoading(false) }

  const statusLabel = (status: string) => { if (lang === 'zh') return status === 'active' ? '进行中' : status === 'completed' ? '已完成' : '暂停'; return status }
  const allSelected = visibleJobs.length > 0 && selected.size === visibleJobs.length

  // Stat card — 手机横条，桌面竖排
  const StatCard = ({ label, value, sub, valueClass = 'text-gray-900 dark:text-white' }: { label: string, value: string, sub?: React.ReactNode, valueClass?: string }) => (
    <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4 flex md:block items-center justify-between gap-3">
      <p className="text-[12px] font-medium text-[#8E8E93] uppercase tracking-wide shrink-0">{label}</p>
      <div className="text-right md:text-left md:mt-1">
        <p className={`text-[28px] md:text-[34px] font-bold leading-tight ${valueClass}`}>{value}</p>
        {sub && <p className="text-[11px] md:text-[13px] text-[#8E8E93] mt-0.5">{sub}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">JP</span></div>
            <span className="font-semibold text-gray-900 dark:text-white">Job Profit OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/clients" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">{t.clients}</Link>
            <Link href="/quotes" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">{t.quotes}</Link>
            <Link href="/finance" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">{lang === 'zh' ? '财务中心' : 'Finance'}</Link>
            <Link href="/tax" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">{lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
            <Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">💳 {lang === 'zh' ? '订阅' : 'Pricing'}</Link>
            <Link href="/settings" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">⚙️ {lang === 'zh' ? '设置' : 'Settings'}</Link>
            <Link href="/jobs/new" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">{t.newJob}</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8 md:pt-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">{t.dashboard}</h1>
          <p className="text-[15px] text-gray-400 dark:text-[#8E8E93] mt-1">{user?.email}</p>
        </div>

        {/* Stats — 手机单列横条，桌面3列 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label={lang === 'zh' ? '总工单' : 'Total Jobs'}
            value={String(jobs.length)}
            sub={`${activeJobs} ${lang === 'zh' ? '进行中' : 'active'} · ${completedJobs} ${lang === 'zh' ? '已完成' : 'done'}`}
          />
          <StatCard
            label={lang === 'zh' ? '总收入' : 'Revenue'}
            value={`$${totalRevenue.toLocaleString()}`}
            sub={`${lang === 'zh' ? '成本' : 'Cost'} $${totalCost.toLocaleString()}`}
          />
          <StatCard
            label={lang === 'zh' ? '总利润' : 'Profit'}
            value={`${totalProfit >= 0 ? '+' : '-'}$${Math.abs(totalProfit).toLocaleString()}`}
            sub={`${lang === 'zh' ? '利润率' : 'Margin'} ${marginPct}%`}
            valueClass={totalProfit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}
          />
          <StatCard
            label={lang === 'zh' ? '未收款' : 'Receivable'}
            value={`$${totalReceivable.toLocaleString()}`}
            sub={<>{unpaidInvoices.length} {lang === 'zh' ? '张未付' : 'unpaid'}{overdueInvoices.length > 0 && <span className="text-[#FF453A] ml-1">· {overdueInvoices.length} {lang === 'zh' ? '逾期' : 'overdue'}</span>}</>}
            valueClass={totalReceivable > 0 ? 'text-[#FF9F0A]' : 'text-gray-900 dark:text-white'}
          />
          <StatCard
            label={lang === 'zh' ? '平均利润' : 'Avg Profit'}
            value={`$${jobs.length > 0 ? Math.round(totalProfit / jobs.length).toLocaleString() : '0'}`}
            sub={lang === 'zh' ? '每工单' : 'per job'}
          />
          <StatCard
            label={lang === 'zh' ? '坏账风险' : 'Bad Debt Risk'}
            value={`$${badDebts.filter(e => e.days_overdue > 90).reduce((sum: number, e: any) => sum + Number(e.amount), 0).toLocaleString()}`}
            sub={`${badDebts.filter(e => e.days_overdue > 90).length} ${lang === 'zh' ? '张逾期90天+' : 'invoices 90d+'}`}
            valueClass="text-[#FF453A]"
          />
        </div>

        {/* Import tip */}
        {showImportTip && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <p className="text-white font-medium text-sm">{lang === 'zh' ? '告别手动录入！批量导入收据，GST自动计算' : 'Skip the paperwork — import receipts instantly!'}</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/import-materials" className="bg-white text-green-600 text-xs font-semibold px-3 py-1.5 rounded-xl">{lang === 'zh' ? '立即使用 →' : 'Try it →'}</a>
              <button onClick={() => setShowImportTip(false)} className="text-green-100 hover:text-white text-lg">✕</button>
            </div>
          </div>
        )}

        {/* Bad debt */}
        {badDebts.filter(e => e.days_overdue > 90).length > 0 && (
          <div className="bg-red-50 dark:bg-[#2C1A1A] border border-red-200 dark:border-[#FF453A]/20 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-semibold text-red-800 dark:text-[#FF6961]">🚨 {lang === 'zh' ? '潜在坏账警告' : 'Potential Bad Debt Warning'}</p>
                <p className="text-red-600 dark:text-[#FF453A] text-sm mt-1">{badDebts.filter(e => e.days_overdue > 90).length} {lang === 'zh' ? '张发票逾期超过90天' : 'invoices overdue 90+ days'}</p>
              </div>
              <span className="text-xl font-bold text-red-800 dark:text-[#FF6961]">${badDebts.filter(e => e.days_overdue > 90).reduce((sum: number, e: any) => sum + Number(e.amount), 0).toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {badDebts.filter(e => e.days_overdue > 90).map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm bg-white dark:bg-[#3A3A3C] rounded-xl px-3 py-2">
                  <span className="text-gray-500 dark:text-[#8E8E93]">{e.job_name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#FF453A] font-medium text-xs">{e.days_overdue} {lang === 'zh' ? '天逾期' : 'days overdue'}</span>
                    <span className="font-medium dark:text-[#FF6961]">${Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Super reminder */}
        {superReminder && (
          <div className="bg-purple-50 dark:bg-[#1E1A2E] border border-purple-200 dark:border-purple-700/30 rounded-2xl p-5">
            <p className="font-semibold text-purple-800 dark:text-purple-300">💰 {lang === 'zh' ? 'Super 供款节税提醒' : 'Super Contribution Tax Tip'}</p>
            <p className="text-purple-600 dark:text-purple-400 text-sm mt-1">{lang === 'zh' ? '您的利润已超过税务门槛，增加 Super 供款可节税' : `Profit exceeds $${TAX_THRESHOLD.toLocaleString()}. Top up super to reduce tax.`}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-[#2C2C2E] rounded-xl p-3"><p className="text-xs text-[#8E8E93]">{lang === 'zh' ? '2024-25 供款上限' : '2024-25 Cap'}</p><p className="font-bold text-purple-700 dark:text-purple-300">$30,000</p></div>
              <div className="bg-white dark:bg-[#2C2C2E] rounded-xl p-3"><p className="text-xs text-[#8E8E93]">{lang === 'zh' ? 'Super 税率 vs 个人税率' : 'Super vs Personal Tax'}</p><p className="font-bold text-purple-700 dark:text-purple-300">15% vs 32.5%+</p></div>
            </div>
          </div>
        )}

        {/* Receivables */}
        {totalReceivable > 0 && (
          <div className="bg-yellow-50 dark:bg-[#2C2100] border border-yellow-200 dark:border-[#FF9F0A]/20 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-semibold text-yellow-800 dark:text-[#FF9F0A]">💰 {lang === 'zh' ? '应收账款到期提醒' : 'Accounts Receivable Due'}</p>
                <p className="text-yellow-700 dark:text-[#FF9F0A]/70 text-sm mt-1">
                  {unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}
                  {overdueInvoices.length > 0 && <span className="text-[#FF453A] font-medium ml-2">· {overdueInvoices.length} {lang === 'zh' ? '张已逾期' : 'overdue'}</span>}
                </p>
              </div>
              <span className="text-xl font-bold text-yellow-800 dark:text-[#FF9F0A]">${totalReceivable.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {unpaidInvoices.slice(0, 3).map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm bg-white dark:bg-[#3A3A3C] rounded-xl px-3 py-2">
                  <span className="text-gray-500 dark:text-[#8E8E93]">{e.jobs?.name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}</span>
                  <div className="flex items-center gap-3">
                    {e.payment_due_date && (
                      <span className={new Date(e.payment_due_date) < new Date() ? 'text-[#FF453A] font-medium text-sm' : 'text-[#8E8E93] text-sm'}>
                        {lang === 'zh' ? '到期' : 'Due'}: {formatDate(e.payment_due_date)}
                        {new Date(e.payment_due_date) < new Date() && ' ⚠️'}
                      </span>
                    )}
                    <span className="font-medium text-gray-800 dark:text-[#F2F2F7]">${Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jobs list */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '工单列表' : 'Jobs'}</h2>
                {editMode && (
                  <button onClick={() => setSelected(prev => prev.size === visibleJobs.length ? new Set() : new Set(visibleJobs.map(j => j.id)))} className="text-xs text-[#0A84FF] font-medium">
                    {allSelected ? (lang === 'zh' ? '取消全选' : 'Deselect All') : (lang === 'zh' ? '全选' : 'Select All')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!editMode && (
                  <>
                    <select className="text-xs border border-gray-200 dark:border-[#3A3A3C] rounded-lg px-2 py-1 outline-none text-gray-600 dark:text-[#8E8E93] bg-white dark:bg-[#3A3A3C]" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="date">{lang === 'zh' ? '最新创建' : 'Newest First'}</option>
                      <option value="due">{lang === 'zh' ? '到期日最近' : 'Due Date'}</option>
                    </select>
                    <button onClick={() => setShowExport(true)} className="text-[#0A84FF] hover:text-blue-400 transition-colors" title={lang === 'zh' ? '导出数据' : 'Export'}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                    </button>
                  </>
                )}
                <button onClick={() => editMode ? exitEditMode() : setEditMode(true)} className="text-sm font-medium text-[#0A84FF] hover:text-blue-400 transition-colors">
                  {editMode ? (lang === 'zh' ? '完成' : 'Done') : (lang === 'zh' ? '编辑' : 'Edit')}
                </button>
              </div>
            </div>
          </div>

          {jobs.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-[#8E8E93]">{t.noJobs}</p>
              <Link href="/jobs/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">{t.newJob}</Link>
            </div>
          )}

          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            {sortJobs(jobs.filter((j: any) => ['active', 'paused'].includes(j.status))).map((job: any) => {
              const profit = Number(job.profit); const isSelected = selected.has(job.id)
              return (
                <div key={job.id} className={`flex items-center px-6 py-4 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-[#0A84FF]/10' : 'hover:bg-gray-50 dark:hover:bg-[#3A3A3C]'}`}>
                  {editMode && (
                    <button onClick={() => toggleSelect(job.id)} className="mr-4 shrink-0">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-gray-300 dark:border-[#8E8E93]'}`}>
                        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                    </button>
                  )}
                  <Link href={'/jobs/' + job.id} className="flex-1 flex justify-between items-center">
                    <div><p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{job.name}</p><p className="text-[#8E8E93] text-sm">{job.client_name}</p></div>
                    <div className="text-right">
                      <p className={profit >= 0 ? 'font-semibold text-[#30D158]' : 'font-semibold text-[#FF453A]'}>{profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}</p>
                      <span className="text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF] px-2 py-0.5 rounded-full">{statusLabel(job.status)}</span>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          {sortJobs(jobs.filter((j: any) => j.status === 'completed')).length > 0 && (
            <>
              <div className="px-6 py-2 bg-green-50 dark:bg-[#1C2E1C] border-t border-gray-100 dark:border-[#3A3A3C]">
                <p className="text-xs font-bold text-green-700 dark:text-[#30D158] uppercase tracking-wider">{lang === 'zh' ? '已完成' : 'Completed'}</p>
              </div>
              {sortJobs(jobs.filter((j: any) => j.status === 'completed'), true).map((job: any) => {
                const profit = Number(job.profit); const unpaid = Number(job.unpaid_amount || 0); const isSelected = selected.has(job.id)
                return (
                  <div key={job.id} className={`flex items-center px-6 py-4 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-[#0A84FF]/10' : 'hover:bg-gray-50 dark:hover:bg-[#3A3A3C]'} ${unpaid > 0 && !isSelected ? 'border-l-4 border-[#FF453A]' : ''}`}>
                    {editMode && (
                      <button onClick={() => toggleSelect(job.id)} className="mr-4 shrink-0">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-gray-300 dark:border-[#8E8E93]'}`}>
                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                      </button>
                    )}
                    <Link href={'/jobs/' + job.id} className={`flex-1 flex justify-between items-center ${!isSelected && unpaid === 0 ? 'opacity-80' : ''}`}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{job.name}</p>
                        <p className="text-[#8E8E93] text-sm">{job.client_name}</p>
                        {unpaid > 0 && <p className="text-[#FF453A] text-xs mt-0.5">💰 {lang === 'zh' ? `未收款 $${unpaid.toLocaleString()}` : `Unpaid $${unpaid.toLocaleString()}`}</p>}
                      </div>
                      <div className="text-right">
                        <p className={profit >= 0 ? 'font-semibold text-[#30D158]' : 'font-semibold text-[#FF453A]'}>{profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}</p>
                        <span className="text-xs bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158] px-2 py-0.5 rounded-full">{statusLabel(job.status)}</span>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </>
          )}

          <Link href="/archive" className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-[#3A3A3C] border-t border-gray-200 dark:border-[#3A3A3C] rounded-b-2xl transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">📦</span>
              <div>
                <p className="font-medium text-gray-500 dark:text-[#8E8E93] text-sm">{lang === 'zh' ? '工单历史' : 'Job History'}</p>
                <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '查看已归档和已暂停的工单' : 'View archived & paused jobs'}</p>
              </div>
            </div>
            <span className="text-[#8E8E93] text-sm">→</span>
          </Link>
        </div>
      </main>

      {/* 批量操作浮动栏 */}
      {editMode && selected.size > 0 && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 z-50">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#3A3A3C] p-3 flex items-center gap-2 max-w-lg w-full">
            <span className="text-xs text-[#8E8E93] px-2 shrink-0">{selected.size} {lang === 'zh' ? '已选' : 'selected'}</span>
            <div className="flex-1 flex items-center gap-2 flex-wrap justify-center">
              <button onClick={() => bulkUpdateStatus('active')} disabled={bulkLoading} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-700 dark:text-[#0A84FF] hover:bg-blue-200 disabled:opacity-50 transition-colors">{lang === 'zh' ? '→ 进行中' : '→ Active'}</button>
              <button onClick={() => bulkUpdateStatus('completed')} disabled={bulkLoading} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-100 dark:bg-[#30D158]/20 text-green-700 dark:text-[#30D158] hover:bg-green-200 disabled:opacity-50 transition-colors">{lang === 'zh' ? '→ 已完成' : '→ Done'}</button>
              <button onClick={() => bulkUpdateStatus('archived')} disabled={bulkLoading} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] hover:bg-gray-200 disabled:opacity-50 transition-colors">📦 {lang === 'zh' ? '归档' : 'Archive'}</button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} disabled={bulkLoading} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 dark:bg-[#FF453A]/20 text-red-600 dark:text-[#FF453A] hover:bg-red-200 disabled:opacity-50 transition-colors">🗑 {lang === 'zh' ? '删除' : 'Delete'}</button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-[#FF453A]/10 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-[#FF453A] font-medium">{lang === 'zh' ? `删除 ${selected.size} 个？` : `Delete ${selected.size}?`}</span>
                  <button onClick={bulkDelete} disabled={bulkLoading} className="text-xs font-bold text-[#FF453A] disabled:opacity-50">{lang === 'zh' ? '确认' : 'Yes'}</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#8E8E93]">{lang === 'zh' ? '取消' : 'No'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 导出面板 */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowExport(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-4 mb-8 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C] text-center">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{lang === 'zh' ? '导出数据' : 'Export Data'}</p>
                <p className="text-xs text-[#8E8E93] mt-0.5">{lang === 'zh' ? '选择要导出的内容' : 'Choose what to export'}</p>
              </div>
              <button onClick={exportJobs} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors border-b border-gray-100 dark:border-[#3A3A3C]">
                <div className="w-10 h-10 bg-blue-100 dark:bg-[#0A84FF]/20 rounded-xl flex items-center justify-center shrink-0"><span className="text-lg">📋</span></div>
                <div className="text-left"><p className="font-medium text-gray-900 dark:text-white text-sm">{lang === 'zh' ? '工单列表' : 'Jobs List'}</p><p className="text-xs text-[#8E8E93]">{lang === 'zh' ? `${jobs.length} 个工单` : `${jobs.length} jobs`} · CSV</p></div>
                <span className="ml-auto text-[#8E8E93] text-xs">CSV</span>
              </button>
              <button onClick={exportEntries} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                <div className="w-10 h-10 bg-green-100 dark:bg-[#30D158]/20 rounded-xl flex items-center justify-center shrink-0"><span className="text-lg">📊</span></div>
                <div className="text-left"><p className="font-medium text-gray-900 dark:text-white text-sm">{lang === 'zh' ? '条目明细' : 'Entry Details'}</p><p className="text-xs text-[#8E8E93]">{lang === 'zh' ? `${entries.length} 条记录` : `${entries.length} entries`} · CSV</p></div>
                <span className="ml-auto text-[#8E8E93] text-xs">CSV</span>
              </button>
            </div>
            <button onClick={() => setShowExport(false)} className="w-full bg-white dark:bg-[#2C2C2E] rounded-2xl py-4 font-semibold text-[#0A84FF] hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors shadow-xl">
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


