import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function TaxChecklist() {
  const supabase = await createClient()
  const { data: entries } = await supabase.from('job_entries').select('*, jobs(name)').order('created_at', { ascending: false })
  const { data: jobs } = await supabase.from('job_summary').select('*')
  const { data: homeOfficeLogs } = await supabase.from('home_office_logs').select('*')
  const { data: overdueInvoices } = await supabase.from('overdue_invoices').select('*')

  if (!entries) return <div className="p-6 text-gray-900 dark:text-white">Loading...</div>

  const totalRevenue = jobs?.reduce((sum, j) => sum + Number(j.revenue), 0) || 0
  const totalProfit = jobs?.reduce((sum, j) => sum + Number(j.profit), 0) || 0
  const gstCollected = entries.filter(e => e.type === 'invoice' && e.gst_status === 'inclusive').reduce((sum, e) => sum + Number(e.amount) / 11, 0)
  const gstPaid = entries.filter(e => e.type !== 'invoice' && e.gst_status === 'inclusive').reduce((sum, e) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    return sum + amount / 11
  }, 0)
  const fuelEntries = entries.filter(e => e.type === 'fuel')
  const totalFuelDeduction = fuelEntries.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalKm = fuelEntries.filter(e => e.ato_method === 'cents_per_km').reduce((sum, e) => sum + Number(e.kilometers || 0), 0)
  const totalHomeOfficeHours = homeOfficeLogs?.reduce((sum, l) => sum + Number(l.hours), 0) || 0
  const homeOfficeDeduction = totalHomeOfficeHours * 0.67
  const categorised = entries.filter(e => e.tax_category).length
  const categoryCompleteness = entries.length > 0 ? Math.round((categorised / entries.length) * 100) : 0
  const badDebts = overdueInvoices?.filter((e: any) => e.days_overdue > 90) || []
  const badDebtTotal = badDebts.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
  const superReminder = totalProfit > 45001

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/tax" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">← Tax Hub</Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">Year-End Tax Checklist</h1>
        </div>
      </nav>
      <div className="md:hidden flex items-center gap-2 px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60">
        <Link href="/tax" className="text-[#8E8E93] text-sm">← 返回</Link>
        <span className="text-[#3A3A3C]">/</span>
        <h1 className="font-semibold text-gray-900 dark:text-white text-sm">Tax Checklist</h1>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Summary */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <h2 className="font-semibold text-gray-900 dark:text-white">📊 年度财务概览 / Annual Summary</h2>
            <p className="text-[#8E8E93] text-xs mt-1">Financial Year 2024-25</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-[#3A3A3C]">
            <div className="px-6 py-4">
              <p className="text-[#8E8E93] text-sm">总收入 / Revenue</p>
              <p className="text-2xl font-bold text-[#30D158]">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-[#8E8E93] text-sm">净利润 / Net Profit</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>${totalProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <h2 className="font-semibold text-gray-900 dark:text-white">✅ 税务清单 / Tax Checklist</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={gstCollected > 0 ? 'text-[#30D158] text-xl' : 'text-[#3A3A3C] text-xl'}>✓</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">GST 申报 / GST BAS</p>
                  <p className="text-[#8E8E93] text-xs">净应缴GST: ${(gstCollected - gstPaid).toFixed(2)}</p>
                </div>
              </div>
              <Link href="/reports" className="text-[#0A84FF] text-sm">查看 →</Link>
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={fuelEntries.length > 0 ? 'text-[#30D158] text-xl' : 'text-[#FF9F0A] text-xl'}>{fuelEntries.length > 0 ? '✓' : '!'}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">车辆费用 / Vehicle Expenses</p>
                  <p className="text-[#8E8E93] text-xs">{totalKm.toFixed(0)}km · 可抵扣: ${totalFuelDeduction.toFixed(2)}</p>
                </div>
              </div>
              <Link href="/vehicle-log" className="text-[#0A84FF] text-sm">查看 →</Link>
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={totalHomeOfficeHours > 0 ? 'text-[#30D158] text-xl' : 'text-[#FF9F0A] text-xl'}>{totalHomeOfficeHours > 0 ? '✓' : '!'}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">家庭办公室 / Home Office</p>
                  <p className="text-[#8E8E93] text-xs">{totalHomeOfficeHours.toFixed(1)}h @ 67c = ${homeOfficeDeduction.toFixed(2)}</p>
                </div>
              </div>
              <Link href="/home-office" className="text-[#0A84FF] text-sm">查看 →</Link>
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={categoryCompleteness >= 80 ? 'text-[#30D158] text-xl' : 'text-[#FF9F0A] text-xl'}>{categoryCompleteness >= 80 ? '✓' : '!'}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">ATO 分类完整度</p>
                  <p className="text-[#8E8E93] text-xs">{categoryCompleteness}% 完整 ({categorised}/{entries.length})</p>
                </div>
              </div>
              <span className={categoryCompleteness >= 80 ? 'text-[#30D158] text-sm font-medium' : 'text-[#FF9F0A] text-sm font-medium'}>{categoryCompleteness}%</span>
            </div>
            {badDebts.length > 0 && (
              <div className="px-6 py-4 flex justify-between items-center bg-red-50 dark:bg-[#2C1A1A]">
                <div className="flex items-center gap-3">
                  <span className="text-[#FF453A] text-xl">!</span>
                  <div>
                    <p className="font-medium text-red-800 dark:text-[#FF6961]">坏账抵扣 / Bad Debt</p>
                    <p className="text-[#FF453A] text-xs">{badDebts.length} 张逾期90天: ${badDebtTotal.toLocaleString()}</p>
                  </div>
                </div>
                <Link href="/finance/cashflow" className="text-[#FF453A] text-sm">查看 →</Link>
              </div>
            )}
            {superReminder && (
              <div className="px-6 py-4 flex justify-between items-center bg-purple-50 dark:bg-[#1E1A2E]">
                <div className="flex items-center gap-3">
                  <span className="text-purple-500 dark:text-purple-400 text-xl">!</span>
                  <div>
                    <p className="font-medium text-purple-800 dark:text-purple-300">Super 供款</p>
                    <p className="text-purple-600 dark:text-purple-400 text-xs">利润超阈值，考虑供款至 $30,000</p>
                  </div>
                </div>
                <span className="text-purple-600 dark:text-purple-300 text-sm font-medium">15% vs 32.5%</span>
              </div>
            )}
          </div>
        </div>

        {/* Accountant summary */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">📋 给会计师的摘要</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: '总收入 / Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '' },
              { label: '车辆抵扣', value: `-$${totalFuelDeduction.toFixed(2)}`, color: 'text-[#30D158]' },
              { label: '家庭办公室', value: `-$${homeOfficeDeduction.toFixed(2)}`, color: 'text-[#30D158]' },
              { label: '坏账抵扣', value: `-$${badDebtTotal.toLocaleString()}`, color: 'text-[#30D158]' },
              { label: '净GST应缴', value: `$${(gstCollected - gstPaid).toFixed(2)}`, color: 'text-[#FF453A]' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-[#3A3A3C]">
                <span className="text-[#8E8E93]">{row.label}</span>
                <span className={`font-medium ${row.color || 'text-gray-900 dark:text-[#F2F2F7]'}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold">
              <span className="text-gray-900 dark:text-white">调整后净利润</span>
              <span className={(totalProfit - totalFuelDeduction - homeOfficeDeduction - badDebtTotal) >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}>
                ${(totalProfit - totalFuelDeduction - homeOfficeDeduction - badDebtTotal).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5">
          <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">⚠️ 免责声明</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">本清单仅供参考，不构成税务建议。请咨询注册税务代理或CPA。</p>
        </div>
      </main>
    </div>
  )
}
