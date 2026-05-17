'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function AnnualReport() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [entries, setEntries] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [sortBy, setSortBy] = useState('profit')

  useEffect(() => {
    supabase.from('job_entries').select('*, jobs(name, client_name)').then(({ data }) => setEntries(data || []))
    supabase.from('job_summary').select('*').then(({ data }) => setJobs(data || []))
  }, [])

  const years = [...new Set(entries.map(e => new Date(e.entry_date || e.created_at).getFullYear()))].sort((a, b) => b - a)

  const filtered = entries.filter(e => new Date(e.entry_date || e.created_at).getFullYear() === selectedYear)

  const revenue = filtered.filter(e => e.type === 'invoice').reduce((sum, e) => sum + Number(e.amount), 0)
  const laborCost = filtered.filter(e => e.type === 'labor').reduce((sum, e) => sum + Number(e.hours) * Number(e.hourly_rate), 0)
  const materialCost = filtered.filter(e => e.type === 'material').reduce((sum, e) => sum + Number(e.amount), 0)
  const subcontractCost = filtered.filter(e => e.type === 'subcontract').reduce((sum, e) => sum + Number(e.amount), 0)
  const fuelCost = filtered.filter(e => e.type === 'fuel').reduce((sum, e) => sum + Number(e.amount), 0)
  const totalExpenses = laborCost + materialCost + subcontractCost + fuelCost
  const profit = revenue - totalExpenses
  const margin = revenue > 0 ? (profit / revenue * 100).toFixed(1) : '0'

  const gstCollected = filtered.filter(e => e.type === 'invoice' && e.gst_status === 'inclusive').reduce((sum, e) => sum + Number(e.amount) / 11, 0)
  const gstPaid = filtered.filter(e => e.type !== 'invoice' && e.gst_status === 'inclusive').reduce((sum, e) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    return sum + amount / 11
  }, 0)
  const netGst = gstCollected - gstPaid

  // 工单盈亏排名
  const jobStats = jobs.map(j => ({
    id: j.id,
    name: j.name,
    client: j.client_name,
    revenue: Number(j.revenue),
    profit: Number(j.profit),
    margin: j.revenue > 0 ? (Number(j.profit) / Number(j.revenue) * 100).toFixed(1) : '0'
  })).sort((a, b) => {
    if (sortBy === 'profit') return b.profit - a.profit
    if (sortBy === 'revenue') return b.revenue - a.revenue
    if (sortBy === 'margin') return Number(b.margin) - Number(a.margin)
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return b.profit - a.profit
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/finance" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '财务中心' : 'Finance'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '年度汇总报表' : 'Annual Report'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <Link href="/finance" className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '年度汇总报表' : 'Annual Report'}</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {years.length === 0 && <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">{selectedYear}</span>}
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)} className={`px-3 py-1 rounded-full text-xs font-medium ${y === selectedYear ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{y}</button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '年度收入' : 'Annual Revenue'}</p>
            <p className="text-xl font-bold text-green-600 mt-1">${revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '年度支出' : 'Annual Expenses'}</p>
            <p className="text-xl font-bold text-red-500 mt-1">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '年度利润' : 'Annual Profit'}</p>
            <p className={`text-xl font-bold mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${profit.toLocaleString()}</p>
            <p className="text-gray-400 text-xs">{lang === 'zh' ? '利润率' : 'Margin'}: {margin}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '支出明细' : 'Expense Breakdown'}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 flex justify-between">
              <span className="text-gray-600 text-sm">{lang === 'zh' ? '人工' : 'Labor'}</span>
              <span className="text-red-500 text-sm font-medium">${laborCost.toLocaleString()}</span>
            </div>
            <div className="px-6 py-3 flex justify-between">
              <span className="text-gray-600 text-sm">{lang === 'zh' ? '材料' : 'Materials'}</span>
              <span className="text-red-500 text-sm font-medium">${materialCost.toLocaleString()}</span>
            </div>
            <div className="px-6 py-3 flex justify-between">
              <span className="text-gray-600 text-sm">{lang === 'zh' ? '分包' : 'Subcontract'}</span>
              <span className="text-red-500 text-sm font-medium">${subcontractCost.toLocaleString()}</span>
            </div>
            <div className="px-6 py-3 flex justify-between">
              <span className="text-gray-600 text-sm">{lang === 'zh' ? '车辆/油费' : 'Vehicle/Fuel'}</span>
              <span className="text-red-500 text-sm font-medium">${fuelCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? 'GST 年度汇总' : 'Annual GST Summary'}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 flex justify-between">
              <span className="text-gray-600 text-sm">{lang === 'zh' ? '已收GST' : 'GST Collected'}</span>
              <span className="text-green-600 text-sm font-medium">${gstCollected.toFixed(2)}</span>
            </div>
            <div className="px-6 py-3 flex justify-between">
              <span className="text-gray-600 text-sm">{lang === 'zh' ? '已付GST (可抵扣)' : 'GST Paid (Credits)'}</span>
              <span className="text-red-500 text-sm font-medium">-${gstPaid.toFixed(2)}</span>
            </div>
            <div className="px-6 py-3 flex justify-between bg-gray-50">
              <span className="text-gray-900 text-sm font-bold">{lang === 'zh' ? '净应缴ATO' : 'Net GST to ATO'}</span>
              <span className={`text-sm font-bold ${netGst >= 0 ? 'text-red-600' : 'text-green-600'}`}>${Math.abs(netGst).toFixed(2)} {netGst >= 0 ? (lang === 'zh' ? '(应缴)' : '(payable)') : (lang === 'zh' ? '(退税)' : '(refund)')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工单盈亏排名' : 'Job Profitability Ranking'}</h2>
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="profit">{lang === 'zh' ? '按利润' : 'By Profit'}</option>
                <option value="revenue">{lang === 'zh' ? '按收入' : 'By Revenue'}</option>
                <option value="margin">{lang === 'zh' ? '按利润率' : 'By Margin'}</option>
                <option value="name">{lang === 'zh' ? '按名称' : 'By Name'}</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {jobStats.map((job, i) => (
              <Link href={'/jobs/' + job.id} key={job.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>{i + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{job.name}</p>
                    <p className="text-gray-400 text-xs">{job.client}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${job.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{job.profit >= 0 ? '+' : ''}${job.profit.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">{job.margin}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-xs">{lang === 'zh' ? '💡 本报表可作为向会计师提交的年度财务摘要。建议在财年结束（6月30日）后生成。' : '💡 This report can be used as an annual financial summary for your accountant. Generate after financial year end (30 June).'}</p>
        </div>
      </main>
    </div>
  )
}