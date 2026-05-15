const fs = require('fs')
const part1 = `import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function Cashflow() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('job_entries')
    .select('*, jobs(name)')
    .order('entry_date', { ascending: true })

  if (!entries) return <div className="p-6">Loading...</div>

  const today = new Date()

  const unpaidInvoices = entries.filter((e: any) =>
    e.type === 'invoice' && e.payment_status !== 'paid'
  )

  const months: Record<string, { income: number, expenses: number, entries: any[] }> = {}

  for (let i = 0; i < 3; i++) {
    const d = new Date(today)
    d.setMonth(d.getMonth() + i)
    const key = d.toLocaleString('en-AU', { month: 'long', year: 'numeric' })
    months[key] = { income: 0, expenses: 0, entries: [] }
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
    months[key].entries.push(e)
  })

  const totalUnpaid = unpaidInvoices.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
`

fs.writeFileSync('app/cashflow/page.tsx', part1)
console.log('part1 done')
const part2 = `  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← 首页 / Home</Link>
            <h1 className="font-semibold text-gray-900">现金流 / Cash Flow</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {totalUnpaid > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-yellow-800">💰 未收款项 / Outstanding Receivables</p>
                <p className="text-yellow-600 text-sm mt-1">{unpaidInvoices.length} 张未付发票，请跟进！/ unpaid invoice{unpaidInvoices.length > 1 ? 's' : ''} — chase these up!</p>
              </div>
              <span className="text-2xl font-bold text-yellow-800">\${totalUnpaid.toLocaleString()}</span>
            </div>
            <div className="mt-4 space-y-2">
              {unpaidInvoices.map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm">
                  <span className="text-yellow-700">{e.jobs?.name || '未知工程 / Unknown job'} — {e.description || '发票 / Invoice'}</span>
                  <div className="flex items-center gap-3">
                    {e.payment_due_date && <span className={new Date(e.payment_due_date) < new Date() ? 'text-red-600 font-medium' : 'text-yellow-600'}>到期 / Due: {e.payment_due_date}</span>}
                    <span className="font-medium text-yellow-800">\${Number(e.amount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">3个月预测 / 3-Month Forecast</h2>
            <p className="text-gray-400 text-xs mt-1">基于已录入条目 / Based on recorded entries</p>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(months).map(([month, data]) => {
              const net = data.income - data.expenses
              return (
                <div key={month} className="px-6 py-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">{month}</h3>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const monthKeys = Object.keys(months)
                        const currentIndex = monthKeys.indexOf(month)
                        if (currentIndex > 0) {
                          const prevNet = months[monthKeys[currentIndex - 1]].income - months[monthKeys[currentIndex - 1]].expenses
                          if (prevNet !== 0) {
                            const change = ((net - prevNet) / Math.abs(prevNet)) * 100
                            return (
                              <span className={change >= 0 ? 'text-sm text-green-600 font-medium' : 'text-sm text-red-500 font-medium'}>
                                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}% 环比 / vs last month
                              </span>
                            )
                          }
                        }
                        return null
                      })()}
                      <span className={net >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                        净额 / Net: {net >= 0 ? '+' : '-'}\${Math.abs(net).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-500">收入 / Income</span>
                      <span className="font-medium text-green-600">\${data.income.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-gray-500">支出 / Expenses</span>
                      <span className="font-medium text-red-500">\${data.expenses.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: data.income > 0 ? Math.min(100, (data.income / (data.income + data.expenses)) * 100) + '%' : '0%' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">💡 提示 / Tip</p>
          <p className="text-blue-600 text-xs mt-1">保持发票付款日期更新，可以获得更准确的现金流预测。收款后请将发票标记为已付款。/ Keep your invoice payment dates up to date to get a more accurate cash flow forecast.</p>
        </div>
      </main>
    </div>
  )
}`

const existing = require('fs').readFileSync('app/cashflow/page.tsx', 'utf8')
require('fs').writeFileSync('app/cashflow/page.tsx', existing + part2)
console.log('part2 done')
