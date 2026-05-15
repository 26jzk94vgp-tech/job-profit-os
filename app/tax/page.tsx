import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function TaxHub() {
  const supabase = await createClient()

  const { data: entries } = await supabase.from('job_entries').select('*')
  const { data: jobs } = await supabase.from('job_summary').select('*')
  const { data: homeOfficeLogs } = await supabase.from('home_office_logs').select('*')
  const { data: overdueInvoices } = await supabase.from('overdue_invoices').select('*')

  const totalRevenue = jobs?.reduce((sum, j) => sum + Number(j.revenue), 0) || 0
  const totalProfit = jobs?.reduce((sum, j) => sum + Number(j.profit), 0) || 0

  const gstCollected = (entries || []).filter(e => e.type === 'invoice' && e.gst_status === 'inclusive').reduce((sum, e) => sum + Number(e.amount) / 11, 0)
  const gstPaid = (entries || []).filter(e => e.type !== 'invoice' && e.gst_status === 'inclusive').reduce((sum, e) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    return sum + amount / 11
  }, 0)
  const netGst = gstCollected - gstPaid

  const fuelEntries = (entries || []).filter(e => e.type === 'fuel')
  const totalFuelDeduction = fuelEntries.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalKm = fuelEntries.filter(e => e.ato_method === 'cents_per_km').reduce((sum, e) => sum + Number(e.kilometers || 0), 0)

  const totalHomeOfficeHours = homeOfficeLogs?.reduce((sum, l) => sum + Number(l.hours), 0) || 0
  const homeOfficeDeduction = totalHomeOfficeHours * 0.67

  const categorised = (entries || []).filter(e => e.tax_category).length
  const categoryCompleteness = entries?.length ? Math.round((categorised / entries.length) * 100) : 0

  const badDebts = overdueInvoices?.filter((e: any) => e.days_overdue > 90) || []
  const badDebtTotal = badDebts.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

  const superReminder = totalProfit > 45001

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← 首页 / Home</Link>
          <h1 className="font-semibold text-gray-900">税务中心 / Tax Hub</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">

        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">总收入 / Revenue</p>
            <p className="text-xl font-bold text-green-600 mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">净利润 / Net Profit</p>
            <p className={totalProfit >= 0 ? 'text-xl font-bold text-green-600 mt-1' : 'text-xl font-bold text-red-600 mt-1'}>${totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">ATO分类完整度 / Category</p>
            <p className={categoryCompleteness >= 80 ? 'text-xl font-bold text-green-600 mt-1' : 'text-xl font-bold text-yellow-500 mt-1'}>{categoryCompleteness}%</p>
          </div>
        </div>

        {superReminder && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-purple-800 text-sm">💰 Super 供款节税提醒 / Super Tax Tip</p>
              <p className="text-purple-600 text-xs mt-1">利润超过 $45,001，考虑在6月30日前增加 Super 供款 / Profit exceeds threshold — top up super before 30 June</p>
            </div>
            <span className="text-purple-700 font-bold text-sm whitespace-nowrap ml-4">15% vs 32.5%</span>
          </div>
        )}

        {badDebts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-red-800 text-sm">🚨 坏账预警 / Bad Debt Warning</p>
              <p className="text-red-600 text-xs mt-1">{badDebts.length} 张发票逾期90天，可申报坏账抵扣 / invoices 90+ days overdue</p>
            </div>
            <span className="text-red-700 font-bold text-sm whitespace-nowrap ml-4">-${badDebtTotal.toLocaleString()}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">季度申报 / Quarterly</p>
          </div>
          <Link href="/reports" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">GST & BAS 申报</p>
                <p className="text-gray-400 text-xs">净应缴GST / Net GST Payable: ${netGst.toFixed(2)}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/reports/monthly" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">月度损益表 / Monthly P&L</p>
                <p className="text-gray-400 text-xs">按月查看收支明细 / Revenue & expenses by month</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">日常记录 / Daily Records</p>
          </div>
          <Link href="/home-office" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏠</span>
              <div>
                <p className="font-medium text-gray-900">家庭办公室 / Home Office</p>
                <p className="text-gray-400 text-xs">{totalHomeOfficeHours.toFixed(1)}h 已记录，可抵扣 / recorded — deduction: ${homeOfficeDeduction.toFixed(2)}</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚗</span>
              <div>
                <p className="font-medium text-gray-900">车辆行程 / Vehicle & Fuel</p>
                <p className="text-gray-400 text-xs">{totalKm.toFixed(0)}km 已记录，可抵扣 / recorded — deduction: ${totalFuelDeduction.toFixed(2)}</p>
              </div>
            </div>
            <span className="text-gray-400 text-xs">在工程条目中添加 / Add via Job Entries</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">年度汇总 / Annual</p>
          </div>
          <Link href="/tax-checklist" className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-gray-900">年度税务清单 / Year-End Checklist</p>
                <p className="text-gray-400 text-xs">给会计师的完整摘要 / Complete summary for your accountant</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 font-medium text-sm">⚠️ 免责声明 / Disclaimer</p>
          <p className="text-blue-600 text-xs mt-1">本页面仅供参考，不构成税务建议。请咨询注册税务代理或CPA。/ For reference only. Consult a registered tax agent or CPA.</p>
        </div>

      </main>
    </div>
  )
}