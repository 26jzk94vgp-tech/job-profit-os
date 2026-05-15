import { createClient } from '../../../utils/supabase/server'
import Link from 'next/link'

export default async function MonthlyReport() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('job_entries')
    .select('*, jobs(name)')
    .order('entry_date', { ascending: false })

  const { data: jobs } = await supabase
    .from('job_summary')
    .select('*')

  if (!entries) return <div className="p-6">Loading...</div>

  // 按月分组
  const monthlyData: Record<string, {
    revenue: number
    labor: number
    material: number
    subcontract: number
    fuel: number
    other: number
    profit: number
    jobCount: Set<string>
  }> = {}

  entries.forEach((e: any) => {
    const date = new Date(e.entry_date || e.created_at)
    const key = date.toLocaleString('en-AU', { month: 'long', year: 'numeric' })

    if (!monthlyData[key]) {
      monthlyData[key] = { revenue: 0, labor: 0, material: 0, subcontract: 0, fuel: 0, other: 0, profit: 0, jobCount: new Set() }
    }

    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    if (e.job_id) monthlyData[key].jobCount.add(e.job_id)

    if (e.type === 'invoice') {
      monthlyData[key].revenue += amount
    } else if (e.type === 'labor') {
      monthlyData[key].labor += amount
    } else if (e.type === 'material') {
      monthlyData[key].material += amount
    } else if (e.type === 'subcontract') {
      monthlyData[key].subcontract += amount
    } else if (e.type === 'fuel') {
      monthlyData[key].fuel += amount
    } else {
      monthlyData[key].other += amount
    }
  })

  // 计算利润
  Object.keys(monthlyData).forEach(key => {
    const d = monthlyData[key]
    d.profit = d.revenue - d.labor - d.material - d.subcontract - d.fuel - d.other
  })

  // 年度汇总
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
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/reports" className="text-gray-500 hover:text-gray-700 text-sm">← Reports</Link>
            <h1 className="font-semibold text-gray-900">Monthly P&L</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Year to Date Summary</h2>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-gray-100">
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">${yearTotal.revenue.toLocaleString()}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-500 mt-1">${(yearTotal.labor + yearTotal.material + yearTotal.subcontract + yearTotal.fuel).toLocaleString()}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">Net Profit</p>
              <p className={yearTotal.profit >= 0 ? 'text-2xl font-bold text-green-600 mt-1' : 'text-2xl font-bold text-red-600 mt-1'}>${yearTotal.profit.toLocaleString()}</p>
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
                  <p className="text-gray-400 text-xs mt-0.5">{data.jobCount.size} job{data.jobCount.size !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <span className={data.profit >= 0 ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                    {data.profit >= 0 ? '+' : ''}${data.profit.toLocaleString()}
                  </span>
                  <p className="text-gray-400 text-xs mt-0.5">Margin: {margin}%</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="px-6 py-3 flex justify-between text-sm">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium text-green-600">${data.revenue.toLocaleString()}</span>
                </div>
                {data.labor > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">Labor</span><span className="text-red-400">-${data.labor.toLocaleString()}</span></div>}
                {data.material > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">Materials</span><span className="text-red-400">-${data.material.toLocaleString()}</span></div>}
                {data.subcontract > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">Subcontract</span><span className="text-red-400">-${data.subcontract.toLocaleString()}</span></div>}
                {data.fuel > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">Vehicle/Fuel</span><span className="text-red-400">-${data.fuel.toLocaleString()}</span></div>}
                {data.other > 0 && <div className="px-6 py-3 flex justify-between text-sm"><span className="text-gray-500">Other</span><span className="text-red-400">-${data.other.toLocaleString()}</span></div>}
                <div className="px-6 py-3 flex justify-between text-sm font-medium bg-gray-50">
                  <span className="text-gray-700">Total Expenses</span>
                  <span className="text-red-500">-${totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )
        })}

        {Object.keys(monthlyData).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center text-gray-400">
            No data yet. Add entries to see your monthly P&L.
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">📋 For your accountant</p>
          <p className="text-blue-600 text-xs mt-1">This report shows your profit & loss by month. Share this with your accountant at tax time along with the Tax Report for GST and ATO category breakdown.</p>
        </div>

      </main>
    </div>
  )
}