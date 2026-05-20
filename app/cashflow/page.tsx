'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { formatDate } from '../../lib/utils'

export default function Cashflow() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    supabase.from('job_entries').select('*, jobs(name)').order('entry_date', { ascending: true }).then(({ data }) => setEntries(data || []))
  }, [])

  const today = new Date()

  const unpaidInvoices = entries.filter((e: any) => e.type === 'invoice' && e.payment_status !== 'paid')
  const totalUnpaid = unpaidInvoices.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

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
    if (e.type === 'invoice') {
      months[key].income += amount
    } else {
      months[key].expenses += amount
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/finance" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors">
            ← {lang === 'zh' ? '财务中心' : 'Finance'}
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '现金流' : 'Cash Flow'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="md:hidden flex items-center gap-2 mb-2">
          <Link href="/finance" className="text-gray-400 dark:text-gray-500 text-sm">
            ← {lang === 'zh' ? '财务中心' : 'Finance'}
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '现金流' : 'Cash Flow'}</h1>
        </div>

        {/* Unpaid invoices */}
        {totalUnpaid > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  💰 {lang === 'zh' ? '未收款项' : 'Outstanding Receivables'}
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                  {unpaidInvoices.length} {lang === 'zh' ? '张未付发票' : 'unpaid invoice(s)'}
                </p>
              </div>
              <span className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">
                ${totalUnpaid.toLocaleString()}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {unpaidInvoices.map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm">
                  <span className="text-yellow-600 dark:text-yellow-300">
                    {e.jobs?.name} — {e.description || (lang === 'zh' ? '发票' : 'Invoice')}
                  </span>
                  <div className="flex items-center gap-3">
                    {e.payment_due_date && (
                      <span className={new Date(e.payment_due_date) < new Date()
                        ? 'text-red-500 dark:text-red-400 font-medium text-xs'
                        : 'text-yellow-500 dark:text-yellow-400 text-xs'}>
                        {lang === 'zh' ? '到期' : 'Due'}: {formatDate(e.payment_due_date)}
                      </span>
                    )}
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      ${Number(e.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-month forecast */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {lang === 'zh' ? '3个月预测' : '3-Month Forecast'}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {lang === 'zh' ? '基于已录入条目' : 'Based on recorded entries'}
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Object.entries(months).map(([month, data]) => {
              const net = data.income - data.expenses
              return (
                <div key={month} className="px-6 py-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">{month}</h3>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const monthKeys = Object.keys(months)
                        const currentIndex = monthKeys.indexOf(month)
                        if (currentIndex > 0) {
                          const prevNet = months[monthKeys[currentIndex - 1]].income - months[monthKeys[currentIndex - 1]].expenses
                          if (prevNet !== 0) {
                            const change = ((net - prevNet) / Math.abs(prevNet)) * 100
                            return (
                              <span className={change >= 0
                                ? 'text-sm text-green-500 dark:text-green-400 font-medium'
                                : 'text-sm text-red-500 dark:text-red-400 font-medium'}>
                                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}% {lang === 'zh' ? '环比' : 'vs last month'}
                              </span>
                            )
                          }
                        }
                        return null
                      })()}
                      <span className={net >= 0
                        ? 'font-bold text-green-600 dark:text-green-400'
                        : 'font-bold text-red-600 dark:text-red-400'}>
                        {lang === 'zh' ? '净额' : 'Net'}: {net >= 0 ? '+' : '-'}${Math.abs(net).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-500 dark:text-gray-400">{lang === 'zh' ? '收入' : 'Income'}</span>
                      <span className="font-medium text-green-600 dark:text-green-400">${data.income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-gray-500 dark:text-gray-400">{lang === 'zh' ? '支出' : 'Expenses'}</span>
                      <span className="font-medium text-red-500 dark:text-red-400">${data.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: data.income > 0 ? Math.min(100, (data.income / (data.income + data.expenses)) * 100) + '%' : '0%' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5">
          <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">
            💡 {lang === 'zh' ? '提示' : 'Tip'}
          </p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
            {lang === 'zh' ? '保持发票付款日期更新，可以获得更准确的现金流预测。' : 'Keep your invoice payment dates up to date for a more accurate forecast.'}
          </p>
        </div>
      </main>
    </div>
  )
}
