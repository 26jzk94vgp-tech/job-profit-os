import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function TaxChecklist() {
  const supabase = await createClient()

  const { data: entries } = await supabase.from('job_entries').select('*, jobs(name)').order('created_at', { ascending: false })
  const { data: jobs } = await supabase.from('job_summary').select('*')
  const { data: homeOfficeLogs } = await supabase.from('home_office_logs').select('*')
  const { data: overdueInvoices } = await supabase.from('overdue_invoices').select('*')

  if (!entries) return <div className="p-6">Loading...</div>

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
  const SUPER_CAP = 30000

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← 首页 / Home</Link>
            <h1 className="font-semibold text-gray-900">年度税务清单 / Year-End Tax Checklist</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">📊 年度财务概览 / Annual Summary</h2>
            <p className="text-gray-400 text-xs mt-1">财政年度 / Financial Year 2024-25</p>
          </div>
          <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">总收入 / Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-500 text-sm">净利润 / Net Profit</p>
              <p className={totalProfit >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600'}>${totalProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">✅ 税务清单 / Tax Checklist</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={gstCollected > 0 ? 'text-green-500 text-xl' : 'text-gray-300 text-xl'}>✓</span>
                <div>
                  <p className="font-medium text-gray-900">GST 申报 / GST BAS</p>
                  <p className="text-gray-400 text-xs">净应缴GST / Net GST: ${(gstCollected - gstPaid).toFixed(2)}</p>
                </div>
              </div>
              <Link href="/reports" className="text-blue-500 text-sm">查看 / View →</Link>
            </div>

            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={fuelEntries.length > 0 ? 'text-green-500 text-xl' : 'text-yellow-400 text-xl'}>{fuelEntries.length > 0 ? '✓' : '!'}</span>
                <div>
                  <p className="font-medium text-gray-900">车辆费用 / Vehicle Expenses</p>
                  <p className="text-gray-400 text-xs">{totalKm.toFixed(0)}km 记录 / recorded — 可抵扣 / deduction: ${totalFuelDeduction.toFixed(2)}</p>
                </div>
              </div>
              <Link href="/jobs" className="text-blue-500 text-sm">添加 / Add →</Link>
            </div>

            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={totalHomeOfficeHours > 0 ? 'text-green-500 text-xl' : 'text-yellow-400 text-xl'}>{totalHomeOfficeHours > 0 ? '✓' : '!'}</span>
                <div>
                  <p className="font-medium text-gray-900">家庭办公室 / Home Office</p>
                  <p className="text-gray-400 text-xs">{totalHomeOfficeHours.toFixed(1)}h @ 67c = ${homeOfficeDeduction.toFixed(2)} 可抵扣 / deduction</p>
                </div>
              </div>
              <Link href="/home-office" className="text-blue-500 text-sm">查看 / View →</Link>
            </div>

            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={categoryCompleteness >= 80 ? 'text-green-500 text-xl' : 'text-yellow-400 text-xl'}>{categoryCompleteness >= 80 ? '✓' : '!'}</span>
                <div>
                  <p className="font-medium text-gray-900">ATO 分类完整度 / ATO Categories</p>
                  <p className="text-gray-400 text-xs">{categoryCompleteness}% 完整 ({categorised}/{entries.length} 已分类 / categorised)</p>
                </div>
              </div>
              <span className={categoryCompleteness >= 80 ? 'text-green-600 text-sm font-medium' : 'text-yellow-600 text-sm font-medium'}>{categoryCompleteness}%</span>
            </div>

            {badDebts.length > 0 && (
              <div className="px-6 py-4 flex justify-between items-center bg-red-50">
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-xl">!</span>
                  <div>
                    <p className="font-medium text-red-800">坏账抵扣 / Bad Debt Write-off</p>
                    <p className="text-red-500 text-xs">{badDebts.length} 张逾期90天 / invoices 90+ days overdue: ${badDebtTotal.toLocaleString()}</p>
                  </div>
                </div>
                <Link href="/cashflow" className="text-red-500 text-sm">查看 / View →</Link>
              </div>
            )}

            {superReminder && (
              <div className="px-6 py-4 flex justify-between items-center bg-purple-50">
                <div className="flex items-center gap-3">
                  <span className="text-purple-500 text-xl">!</span>
                  <div>
                    <p className="font-medium text-purple-800">Super 供款 / Super Contributions</p>
                    <p className="text-purple-600 text-xs">利润超阈值，考虑供款至 ${SUPER_CAP.toLocaleString()} / Profit exceeds threshold — top up super to $30,000 cap</p>
                  </div>
                </div>
                <span className="text-purple-600 text-sm font-medium">15% vs 32.5%</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">📋 给会计师的摘要 / Summary for Your Accountant</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">总收入 / Total Revenue</span><span className="font-medium">${totalRevenue.toLocaleString()}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">车辆抵扣 / Vehicle Deduction</span><span className="font-medium text-green-600">-${totalFuelDeduction.toFixed(2)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">家庭办公室 / Home Office</span><span className="font-medium text-green-600">-${homeOfficeDeduction.toFixed(2)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">坏账抵扣 / Bad Debt</span><span className="font-medium text-green-600">-${badDebtTotal.toLocaleString()}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-600">净GST / Net GST Payable</span><span className="font-medium text-red-500">${(gstCollected - gstPaid).toFixed(2)}</span></div>
            <div className="flex justify-between py-2 font-bold"><span className="text-gray-900">调整后净利润 / Adjusted Net Profit</span><span className={totalProfit - totalFuelDeduction - homeOfficeDeduction - badDebtTotal >= 0 ? 'text-green-600' : 'text-red-600'}>${(totalProfit - totalFuelDeduction - homeOfficeDeduction - badDebtTotal).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">⚠️ 免责声明 / Disclaimer</p>
          <p className="text-blue-600 text-xs mt-1">本清单仅供参考，不构成税务建议。请咨询注册税务代理或CPA。/ For reference only. Consult a registered tax agent or CPA before lodging.</p>
        </div>

      </main>
    </div>
  )
}