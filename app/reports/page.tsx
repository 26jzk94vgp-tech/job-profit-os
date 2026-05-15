import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function Reports() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('job_entries')
    .select('*, jobs(name)')
    .order('created_at', { ascending: false })

  if (!entries) return <div className="p-6">Loading...</div>

  // GST 计算
  const gstCollected = entries
    .filter(e => e.type === 'invoice' && e.gst_status === 'inclusive')
    .reduce((sum, e) => sum + Number(e.amount) / 11, 0)

  const gstPaid = entries
    .filter(e => e.type !== 'invoice' && e.gst_status === 'inclusive')
    .reduce((sum, e) => {
      const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
      return sum + amount / 11
    }, 0)

  const netGst = gstCollected - gstPaid

  // ATO 分类汇总
  const categoryTotals: Record<string, number> = {}
  entries.forEach(e => {
    if (!e.tax_category) return
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    categoryTotals[e.tax_category] = (categoryTotals[e.tax_category] || 0) + amount
  })

  const categoryLabels: Record<string, string> = {
    other_income: 'Job Revenue / Income',
    cogs_material: 'Materials (COGS)',
    cogs_labour: 'Direct Labour (COGS)',
    subcontractor: 'Subcontractor Costs',
    vehicle: 'Vehicle & Travel',
    tools_equipment: 'Tools & Equipment',
    insurance: 'Insurance',
    wages: 'Wages & Salary',
    super: 'Superannuation',
    other_expense: 'Other Expense',
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Home</Link>
            <h1 className="font-semibold text-gray-900">Tax Reports</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">GST Summary (BAS)</h2>
            <p className="text-gray-400 text-xs mt-1">Based on all entries marked as GST Inclusive</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">GST Collected</p>
                <p className="text-gray-400 text-xs">From invoices (1/11 of revenue)</p>
              </div>
              <span className="font-semibold text-green-600">${gstCollected.toFixed(2)}</span>
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">GST Paid (Input Tax Credits)</p>
                <p className="text-gray-400 text-xs">From expenses (1/11 of costs)</p>
              </div>
              <span className="font-semibold text-red-500">-${gstPaid.toFixed(2)}</span>
            </div>
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
              <div>
                <p className="font-bold text-gray-900">Net GST Payable to ATO</p>
                <p className="text-gray-400 text-xs">Amount to remit in BAS</p>
              </div>
              <span className={netGst >= 0 ? 'font-bold text-lg text-red-600' : 'font-bold text-lg text-green-600'}>
                ${Math.abs(netGst).toFixed(2)} {netGst >= 0 ? '(payable)' : '(refund)'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">ATO Category Breakdown</h2>
            <p className="text-gray-400 text-xs mt-1">For income tax return preparation</p>
          </div>
          {Object.keys(categoryTotals).length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              <p>No categorised entries yet.</p>
              <p className="text-xs mt-1">Add ATO Tax Category when entering costs.</p>
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <div key={cat} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{categoryLabels[cat] || cat}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cat}</span>
                </div>
                <span className={cat === 'other_income' ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                  {cat === 'other_income' ? '+' : '-'}${total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-blue-800 font-medium text-sm">⚠️ Disclaimer</p>
          <p className="text-blue-600 text-xs mt-1">This report is for reference only. Please consult a registered tax agent or CPA before lodging your BAS or tax return. Tax laws change and individual circumstances vary.</p>
        </div>
      </main>
    </div>
  )
}