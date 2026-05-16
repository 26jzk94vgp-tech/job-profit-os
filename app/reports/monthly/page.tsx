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
    { label: 'Q1 (Jul-Sep)', start: '-07-01', end: '-09-30' },
    { label: 'Q2 (Oct-Dec)', start: '-10-01', end: '-12-31' },
    { label: 'Q3 (Jan-Mar)', start: '-01-01', end: '-03-31' },
    { label: 'Q4 (Apr-Jun)', start: '-04-01', end: '-06-30' },
  ]

  const currentYear = new Date().getFullYear()
  const financialYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1

  function getFilteredEntries() {
    if (filterType === 'all') return entries
    if (filterType === 'custom' && startDate && endDate) {
      return entries.filter(e => {
        const d = e.entry_date || e.created_at
        return d >= startDate && d <= endDate
      })
    }
    if (filterType.startsWith('q')) {
      const qIndex = parseInt(filterType[1]) - 1
      const q = quarters[qIndex]
      const year = qIndex >= 2 ? financialYear + 1 : financialYear
      const start = year + q.start
      const end = year + q.end
      return entries.filter(e => {
        const d = e.entry_date || e.created_at
        return d >= start && d <= end
      })
    }
    return entries
  }

  const filtered = getFilteredEntries()

  const monthlyData: Record<string, {
    revenue: number, labor: number, material: number,
    subcontract: number, fuel: number, other: number,
    profit: number, jobCount: Set<string>
  }> = {}

  filtered.forEach((e: any) => {
    const date = new Date(e.entry_date || e.created_at)
    const key = date.toLocaleString('en-AU', { month: 'long', year: 'numeric' })
    if (!monthlyData[key]) {
      monthlyData[key] = { revenue: 0, labor: 0, material: 0, subcontract: 0, fuel: 0, other: 0, profit: 0, jobCount: new Set() }
    }
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

  const yearTotal = Object.values(monthlyData).reduce((acc, d) => ({
    revenue: acc.revenue + d.revenue,
    labor: acc.labor + d.labor,
    material: acc.material + d.material,
    subcontract: acc.subcontract + d.subcontract,
    fuel: acc.fuel + d.fuel,
    profit: acc.profit + d.profit,
  }), { revenue: 0, labor: 0, material: 0, subcontract: 0, fuel: 0, profit: 0 })
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/reports" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '月度损益表' : 'Monthly P&L'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <Link href="/reports" className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '月度损益表' : 'Monthly P&L'}</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">{lang === 'zh' ? '筛选范围' : 'Filter Period'}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-full text-xs font-medium ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{lang === 'zh' ? '全部' : 'All Time'}</button>
            {quarters.map((q, i) => (
              <button key={i} onClick={() => setFilterType('q' + (i+1))} className={`px-3 py-1 rounded-full text-xs font-medium ${filterType === 'q' + (i+1) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{q.label}</button>
            ))}
            <button onClick={() => setFilterType('custom')} className={`px-3 py-1 rounded-full text-xs font-medium ${filterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{lang === 'zh' ? '自定义' : 'Custom'}</button>
          </div>
          {filterType === 'custom' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-gray-500 text-xs">{lang === 'zh' ? '开始日期' : 'Start Date'}</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 text-xs">{lang === 'zh' ? '结束日期' : 'End Date'}</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg p-2 mt-1 text-sm outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '期间汇总' : 'Period Summary'}</h2>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">{lang === 'zh' ? '总收入' : 'Total Revenue'}</p>
              <p className="text-2xl font-bold text-green-600">${yearTotal.revenue.toLocaleString()}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">{lang === 'zh' ? '总支出' : 'Total Expenses'}</p>
              <p className="text-2xl font-bold text-red-500">${(yearTotal.labor + yearTotal.material + yearTotal.subcontract + yearTotal.fuel).toLocaleString()}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">{lang === 'zh' ? '净利润' : 'Net Profit'}</p>
              <p className={yearTotal.profit >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600'}>${yearTotal.profit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {Object.entries(monthlyData).map(([month, data]) => {
          const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0'
          const totalExpenses = data.labor + data.material + data.subcontract + data.fuel + data.other
          return (
            <div key={month} className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{month}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{data.jobCount.size} {lang === 'zh' ? '个工程' : 'job(s)'}</p>
                </div>
                <div className="text-right">
                  <span className={data.profit >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                    {data.profit >= 0 ? '+' : ''}${data.profit.toLocaleString()}
                  </span>
                  <p className="text-gray-400 text-xs mt-0.5">{lang === 'zh' ? '利润率' : 'Margin'}: {margin}%</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="px-6 py-3 flex justify-between text-sm">
                  <span className="text-gray-600">{lang === 'zh' ? '收入' : 'Revenue'}</span>
                  <span className="font-medium text-green-600">${data.revenue.toLocaleString()}</span>
                </div>
                {data.labor > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">{lang === 'zh' ? '人工' : 'Labor'}</span><span className="text-red-400">-${data.labor.toLocaleString()}</span></div>}
                {data.material > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">{lang === 'zh' ? '材料' : 'Materials'}</span><span className="text-red-400">-${data.material.toLocaleString()}</span></div>}
                {data.subcontract > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">{lang === 'zh' ? '分包' : 'Subcontract'}</span><span className="text-red-400">-${data.subcontract.toLocaleString()}</span></div>}
                {data.fuel > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">{lang === 'zh' ? '车辆' : 'Vehicle/Fuel'}</span><span className="text-red-400">-${data.fuel.toLocaleString()}</span></div>}
                <div className="px-6 py-3 flex justify-between text-sm font-medium bg-gray-50">
                  <span className="text-gray-700">{lang === 'zh' ? '总支出' : 'Total Expenses'}</span>
                  <span className="text-red-500">-${totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )
        })}

        {Object.keys(monthlyData).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center text-gray-400">
            {lang === 'zh' ? '该时间段内没有数据' : 'No data for this period.'}
          </div>
        )}
      </main>
    </div>
  )
}