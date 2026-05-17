'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Finance() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [entries, setEntries] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    supabase.from('job_entries').select('*, jobs(name)').then(({ data }: { data: any }) => setEntries(data || []))
    supabase.from('job_summary').select('*').then(({ data }: { data: any }) => setJobs(data || []))
  }, [])

  const totalRevenue = jobs.reduce((sum, j) => sum + Number(j.revenue), 0)
  const totalProfit = jobs.reduce((sum, j) => sum + Number(j.profit), 0)
  const totalCosts = totalRevenue - totalProfit

  const unpaidInvoices = entries.filter(e => e.type === 'invoice' && e.payment_status !== 'paid')
  const totalReceivable = unpaidInvoices.reduce((sum, e) => sum + Number(e.amount), 0)
  const overdueInvoices = unpaidInvoices.filter(e => e.payment_due_date && new Date(e.payment_due_date) < new Date())

  const today = new Date()
  const months: Record<string, { income: number, expenses: number }> = {}
  for (let i = 0; i < 3; i++) {
    const d = new Date(today)
    d.setMonth(d.getMonth() + i)
    const key = d.toLocaleString('en-AU', { month: 'long', year: 'numeric' })
    months[key] = { income: 0, expenses: 0 }
  }
  entries.forEach((e: any) => {
    const date = new Date(e.entry_date || e.created_at)
    const key = date.toLocaleString('en-AU', { month: 'long', year: 'numeric' })
    if (!months[key]) return
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    if (e.type === 'invoice') months[key].income += amount
    else months[key].expenses += amount
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '财务中心' : 'Finance'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <Link href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '财务中心' : 'Finance'}</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '总收入' : 'Revenue'}</p>
            <p className="text-xl font-bold text-green-600 mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '总支出' : 'Expenses'}</p>
            <p className="text-xl font-bold text-red-500 mt-1">${totalCosts.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '净利润' : 'Net Profit'}</p>
            <p className={totalProfit >= 0 ? 'text-xl font-bold text-green-600 mt-1' : 'text-xl font-bold text-red-600 mt-1'}>${totalProfit.toLocaleString()}</p>
          </div>
        </div>

        {totalReceivable > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-semibold text-yellow-800 text-sm">💰 {lang === 'zh' ? '应收账款' : 'Accounts Receivable'}</p>
                <p className="text-yellow-600 text-xs mt-0.5">
                  {unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}
                  {overdueInvoices.length > 0 && <span className="text-red-600 font-medium ml-2">· {overdueInvoices.length} {lang === 'zh' ? '张逾期' : 'overdue'}</span>}
                </p>
              </div>
              <span className="text-xl font-bold text-yellow-800">${totalReceivable.toLocaleString()}</span>
            </div>
            {unpaidInvoices.slice(0, 3).map((e: any) => (
              <div key={e.id} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2 mt-2">
                <span className="text-gray-700">{e.jobs?.name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}</span>
                <div className="flex items-center gap-2">
                  {e.payment_due_date && <span className={new Date(e.payment_due_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-400'}>{lang === 'zh' ? '到期' : 'Due'}: {e.payment_due_date}</span>}
                  <span className="font-medium text-yellow-800">${Number(e.amount).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '财务报告' : 'Reports'}</p>
          </div>
          <Link href="/tax" className="md:hidden flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '税务中心' : 'Tax Hub'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? 'GST、BAS、ATO分类、家庭办公室' : 'GST, BAS, ATO Categories, Home Office'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/reports/annual" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '年度汇总报表' : 'Annual Report'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '全年收支利润+工单排名' : 'Full year P&L + job ranking'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/reports/monthly" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '月度损益表' : 'Monthly P&L'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '按月查看收支明细' : 'Revenue & expenses by month'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/cashflow" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '现金流预测' : 'Cash Flow Forecast'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '3个月收支预测' : '3-month income & expense forecast'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/import-materials" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{lang === 'zh' ? '导入材料清单' : 'Import Materials'}</p>
                <p className="text-gray-400 text-xs">{lang === 'zh' ? '从Bunnings等Excel文件批量导入' : 'Bulk import from Bunnings Excel files'}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '3个月预测' : '3-Month Forecast'}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(months).map(([month, data]) => {
              const net = data.income - data.expenses
              return (
                <div key={month} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{month}</p>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className="text-green-600">{lang === 'zh' ? '收' : 'In'}: ${data.income.toLocaleString()}</span>
                      <span className="text-red-500">{lang === 'zh' ? '支' : 'Out'}: ${data.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={net >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                    {net >= 0 ? '+' : ''}${net.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}