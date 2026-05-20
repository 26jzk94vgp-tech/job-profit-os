'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function MonthlyReport() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [entries, setEntries] = useState<any[]>([])
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    supabase.from('job_entries').select('*, jobs(name)').order('entry_date', { ascending: false }).then(({ data }) => setEntries(data || []))
  }, [])

  const quarters = [
    { label: lang === 'zh' ? 'Q1 (7-9月)' : 'Q1 (Jul-Sep)', start: '-07-01', end: '-09-30' },
    { label: lang === 'zh' ? 'Q2 (10-12月)' : 'Q2 (Oct-Dec)', start: '-10-01', end: '-12-31' },
    { label: lang === 'zh' ? 'Q3 (1-3月)' : 'Q3 (Jan-Mar)', start: '-01-01', end: '-03-31' },
    { label: lang === 'zh' ? 'Q4 (4-6月)' : 'Q4 (Apr-Jun)', start: '-04-01', end: '-06-30' },
  ]
  const currentYear = new Date().getFullYear()
  const financialYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1

  function getFilteredEntries() {
    if (filterType === 'all') return entries
    if (filterType === 'custom' && startDate && endDate) return entries.filter(e => { const d = e.entry_date || e.created_at; return d >= startDate && d <= endDate })
    if (filterType.startsWith('q')) {
      const qIndex = parseInt(filterType[1]) - 1
      const q = quarters[qIndex]
      const year = qIndex >= 2 ? financialYear + 1 : financialYear
      return entries.filter(e => { const d = e.entry_date || e.created_at; return d >= year + q.start && d <= year + q.end })
    }
    return entries
  }

  const filtered = getFilteredEntries()
  const monthlyData: Record<string, { revenue: number, labor: number, material: number, subcontract: number, fuel: number, other: number, profit: number, jobCount: Set<string> }> = {}

  filtered.forEach((e: any) => {
    const key = new Date(e.entry_date || e.created_at).toLocaleString('en-AU', { month: 'long', year: 'numeric' })
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, labor: 0, material: 0, subcontract: 0, fuel: 0, other: 0, profit: 0, jobCount: new Set() }
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    if (e.job_id) monthlyData[key].jobCount.add(e.job_id)
    if (e.type === 'invoice') monthlyData[key].revenue += amount
    else if (e.type === 'labor') monthlyData[key].labor += amount
    else if (e.type === 'material') monthlyData[key].material += amount
    else if (e.type === 'subcontract') monthlyData[key].subcontract += amount
    else if (e.type === 'fuel') monthlyData[key].fuel += amount
    else monthlyData[key].other += amount
  })
  Object.keys(monthlyData).forEach(key => {
    const d = monthlyData[key]
    d.profit = d.revenue - d.labor - d.material - d.subcontract - d.fuel - d.other
  })

  const yearTotal = Object.values(monthlyData).reduce((acc, d) => ({ revenue: acc.revenue + d.revenue, labor: acc.labor + d.labor, material: acc.material + d.material, subcontract: acc.subcontract + d.subcontract, fuel: acc.fuel + d.fuel, profit: acc.profit + d.profit }), { revenue: 0, labor: 0, material: 0, subcontract: 0, fuel: 0, profit: 0 })

  const btnCls = (active: boolean) => `px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-[#0A84FF] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/finance" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '月度损益表' : 'Monthly P&L'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="md:hidden flex items-center gap-2 mb-2">
          <Link href="/finance" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <span className="text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '月度损益表' : 'Monthly P&L'}</h1>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{lang === 'zh' ? '筛选范围' : 'Filter Period'}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setFilterType('all')} className={btnCls(filterType === 'all')}>{lang === 'zh' ? '全部' : 'All Time'}</button>
            {quarters.map((q, i) => <button key={i} onClick={() => setFilterType('q' + (i+1))} className={btnCls(filterType === 'q' + (i+1))}>{q.label}</button>)}
            <button onClick={() => setFilterType('custom')} className={btnCls(filterType === 'custom')}>{lang === 'zh' ? '自定义' : 'Custom'}</button>
          </div>
          {filterType === 'custom' && (
            <div className="flex gap-3">
              <div className="flex-1"><label className="text-[#8E8E93] text-xs">{lang === 'zh' ? '开始日期' : 'Start'}</label><input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 mt-1 text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="flex-1"><label className="text-[#8E8E93] text-xs">{lang === 'zh' ? '结束日期' : 'End'}</label><input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 mt-1 text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '期间汇总' : 'Period Summary'}</h2>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-[#3A3A3C]">
            <div className="px-6 py-4"><p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '总收入' : 'Revenue'}</p><p className="text-2xl font-bold text-[#30D158]">${yearTotal.revenue.toLocaleString()}</p></div>
            <div className="px-6 py-4"><p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '总支出' : 'Expenses'}</p><p className="text-2xl font-bold text-[#FF453A]">${(yearTotal.labor + yearTotal.material + yearTotal.subcontract + yearTotal.fuel).toLocaleString()}</p></div>
            <div className="px-6 py-4"><p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '净利润' : 'Net Profit'}</p><p className={`text-2xl font-bold ${yearTotal.profit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>${yearTotal.profit.toLocaleString()}</p></div>
          </div>
        </div>

        {Object.entries(monthlyData).map(([month, data]) => {
          const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0'
          const totalExpenses = data.labor + data.material + data.subcontract + data.fuel + data.other
          return (
            <div key={month} className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C] flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{month}</h3>
                  <p className="text-[#8E8E93] text-xs mt-0.5">{data.jobCount.size} {lang === 'zh' ? '个工单' : 'job(s)'}</p>
                </div>
                <div className="text-right">
                  <span className={data.profit >= 0 ? 'font-bold text-[#30D158]' : 'font-bold text-[#FF453A]'}>{data.profit >= 0 ? '+' : ''}${data.profit.toLocaleString()}</span>
                  <p className="text-[#8E8E93] text-xs mt-0.5">{lang === 'zh' ? '利润率' : 'Margin'}: {margin}%</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-[#3A3A3C]">
                <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-700 dark:text-gray-300 font-medium">{lang === 'zh' ? '收入' : 'Revenue'}</span><span className="font-medium text-[#30D158]">${data.revenue.toLocaleString()}</span></div>
                {data.labor > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-700 dark:text-gray-300">{lang === 'zh' ? '人工' : 'Labor'}</span><span className="text-[#FF453A]">-${data.labor.toLocaleString()}</span></div>}
                {data.material > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-700 dark:text-gray-300">{lang === 'zh' ? '材料' : 'Materials'}</span><span className="text-[#FF453A]">-${data.material.toLocaleString()}</span></div>}
                {data.subcontract > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-700 dark:text-gray-300">{lang === 'zh' ? '分包' : 'Subcontract'}</span><span className="text-[#FF453A]">-${data.subcontract.toLocaleString()}</span></div>}
                {data.fuel > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-700 dark:text-gray-300">{lang === 'zh' ? '车辆' : 'Vehicle'}</span><span className="text-[#FF453A]">-${data.fuel.toLocaleString()}</span></div>}
                <div className="px-6 py-3 flex justify-between text-sm font-medium bg-gray-50 dark:bg-[#1C1C1E]"><span className="text-gray-700 dark:text-gray-300">{lang === 'zh' ? '总支出' : 'Total Expenses'}</span><span className="text-[#FF453A]">-${totalExpenses.toLocaleString()}</span></div>
              </div>
            </div>
          )
        })}

        {Object.keys(monthlyData).length === 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent px-6 py-16 text-center text-[#8E8E93]">
            {lang === 'zh' ? '该时间段内没有数据' : 'No data for this period.'}
          </div>
        )}
      </main>
    </div>
  )
}
