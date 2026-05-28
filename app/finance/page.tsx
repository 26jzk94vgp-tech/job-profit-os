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
    if (localStorage.getItem('darkMode') === 'true') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-12 md:pt-0">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 dark:text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '财务中心' : 'Finance'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <Link href="/" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '财务中心' : 'Finance'}</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4">
            <p className="text-gray-500 dark:text-[#8E8E93] text-xs">{lang === 'zh' ? '总收入' : 'Revenue'}</p>
            <p className="text-xl font-bold text-[#30D158] mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4">
            <p className="text-gray-500 dark:text-[#8E8E93] text-xs">{lang === 'zh' ? '总支出' : 'Expenses'}</p>
            <p className="text-xl font-bold text-[#FF453A] mt-1">${totalCosts.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4">
            <p className="text-gray-500 dark:text-[#8E8E93] text-xs">{lang === 'zh' ? '净利润' : 'Net Profit'}</p>
            <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>${totalProfit.toLocaleString()}</p>
          </div>
        </div>

        {totalReceivable > 0 && (
          <div className="bg-yellow-50 dark:bg-[#2C2100] border border-yellow-200 dark:border-[#FF9F0A]/20 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-semibold text-yellow-800 dark:text-[#FF9F0A] text-sm">💰 {lang === 'zh' ? '应收账款' : 'Accounts Receivable'}</p>
                <p className="text-yellow-600 dark:text-[#FF9F0A]/70 text-xs mt-0.5">
                  {unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}
                  {overdueInvoices.length > 0 && (
                    <span className="text-[#FF453A] font-medium ml-2">· {overdueInvoices.length} {lang === 'zh' ? '张逾期' : 'overdue'}</span>
                  )}
                </p>
              </div>
              <span className="text-xl font-bold text-yellow-800 dark:text-[#FF9F0A]">${totalReceivable.toLocaleString()}</span>
            </div>
            {unpaidInvoices.slice(0, 3).map((e: any) => (
              <div key={e.id} className="flex justify-between text-sm bg-white dark:bg-[#3A3A3C] rounded-xl px-3 py-2 mt-2 border border-gray-100 dark:border-transparent">
                <span className="text-gray-900 dark:text-[#F2F2F7] font-medium truncate mr-2">{e.jobs?.name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {e.payment_due_date && (
                    <span className={new Date(e.payment_due_date) < new Date() ? 'text-[#FF453A] font-medium' : 'text-[#8E8E93]'}>
                      {lang === 'zh' ? '到期' : 'Due'}: {e.payment_due_date}
                    </span>
                  )}
                  <span className="font-medium text-yellow-800 dark:text-[#FF9F0A]">${Number(e.amount).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#3A3A3C]">
            <p className="text-xs font-semibold text-gray-500 dark:text-[#8E8E93] uppercase tracking-wide">{lang === 'zh' ? '财务报告' : 'Reports'}</p>
          </div>
          {[
            { href: '/reports/monthly', icon: '📅', label: lang === 'zh' ? '月度损益表' : 'Monthly P&L', sub: lang === 'zh' ? '按月查看收支明细' : 'Revenue & expenses by month' },
            { href: '/cashflow', icon: '📈', label: lang === 'zh' ? '现金流预测' : 'Cash Flow Forecast', sub: lang === 'zh' ? '3个月收支预测' : '3-month income & expense forecast' },
            { href: '/tax/bas', icon: '📋', label: 'BAS Report', sub: lang === 'zh' ? '季度GST汇总，直接给会计师' : 'Quarterly GST summary for ATO' },
            { href: '/reports/annual', icon: '📊', label: lang === 'zh' ? '年度汇总报表' : 'Annual Report', sub: lang === 'zh' ? '全年收支利润+工单排名' : 'Full year P&L + job ranking' },
            { href: '/import-materials', icon: '📥', label: lang === 'zh' ? '导入材料清单' : 'Import Materials', sub: lang === 'zh' ? '从Bunnings等Excel文件批量导入' : 'Bulk import from Bunnings Excel files' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] border-b border-gray-100 dark:border-[#3A3A3C] transition-colors last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{item.label}</p>
                  <p className="text-gray-400 dark:text-[#8E8E93] text-xs">{item.sub}</p>
                </div>
              </div>
              <span className="text-gray-400 dark:text-[#8E8E93]">→</span>
            </Link>
          ))}
          <Link href="/tax" className="md:hidden flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧾</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{lang === 'zh' ? '税务中心' : 'Tax Hub'}</p>
                <p className="text-gray-400 dark:text-[#8E8E93] text-xs">{lang === 'zh' ? 'GST、BAS、ATO分类、家庭办公室' : 'GST, BAS, ATO Categories, Home Office'}</p>
              </div>
            </div>
            <span className="text-gray-400 dark:text-[#8E8E93]">→</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '3个月预测' : '3-Month Forecast'}</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            {Object.entries(months).map(([month, data]) => {
              const net = data.income - data.expenses
              return (
                <div key={month} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[#F2F2F7] text-sm">{month}</p>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className="text-[#30D158]">{lang === 'zh' ? '收' : 'In'}: ${data.income.toLocaleString()}</span>
                      <span className="text-[#FF453A]">{lang === 'zh' ? '支' : 'Out'}: ${data.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`font-bold ${net >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
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
