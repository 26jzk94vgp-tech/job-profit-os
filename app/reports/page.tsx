'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Reports() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [entries, setEntries] = useState<any[]>([])
  const [hoLogs, setHoLogs] = useState<any[]>([])
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('job_entries')
        .select('*, jobs(name)')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
      setEntries(data || [])
      const { data: ho } = await supabase.from('home_office_logs').select('*').eq('owner_id', user?.id)
      setHoLogs(ho || [])
    }
    load()
  }, [])

  const quarters = [
    { label: lang === 'zh' ? 'Q1 (7-9月)' : 'Q1 (Jul-Sep)', start: '-07-01', end: '-09-30' },
    { label: lang === 'zh' ? 'Q2 (10-12月)' : 'Q2 (Oct-Dec)', start: '-10-01', end: '-12-31' },
    { label: lang === 'zh' ? 'Q3 (1-3月)' : 'Q3 (Jan-Mar)', start: '-01-01', end: '-03-31' },
    { label: lang === 'zh' ? 'Q4 (4-6月)' : 'Q4 (Apr-Jun)', start: '-04-01', end: '-06-30' },
  ]

  const currentYear = new Date().getFullYear()
  const financialYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1

  function getFilteredEntries() {
    if (filterType === 'all') return entries
    if (filterType === 'custom' && startDate && endDate) {
      return entries.filter(e => { const d = e.entry_date || e.created_at; return d >= startDate && d <= endDate })
    }
    if (filterType.startsWith('q')) {
      const qIndex = parseInt(filterType[1]) - 1
      const q = quarters[qIndex]
      const year = qIndex >= 2 ? financialYear + 1 : financialYear
      return entries.filter(e => { const d = e.entry_date || e.created_at; return d >= year + q.start && d <= year + q.end })
    }
    return entries
  }

  const filtered = getFilteredEntries()
  const HO_RATE = 0.70
  const hoFiltered = (() => {
    if (filterType === 'all') return hoLogs
    if (filterType === 'custom' && startDate && endDate) return hoLogs.filter((l:any) => l.log_date >= startDate && l.log_date <= endDate)
    if (filterType.startsWith('q')) { const qi = parseInt(filterType[1]) - 1; const q = quarters[qi]; const yr = qi >= 2 ? financialYear + 1 : financialYear; return hoLogs.filter((l:any) => l.log_date >= yr + q.start && l.log_date <= yr + q.end) }
    return hoLogs
  })()
  const homeOfficeHours = hoFiltered.reduce((s:number, l:any) => s + Number(l.hours || 0), 0)
  const homeOfficeDeduction = homeOfficeHours * HO_RATE

  const gstCollected = filtered.filter(e => e.type === 'invoice').reduce((sum: number, e: any) => {
    if (e.gst_status === 'inclusive') return sum + Number(e.amount) / 11
    if (e.gst_status === 'exclusive') return sum + Number(e.amount) * 0.1
    return sum
  }, 0)

  const gstPaid = filtered.filter(e => e.type !== 'invoice').reduce((sum: number, e: any) => {
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    if (e.gst_status === 'inclusive') return sum + amount / 11
    if (e.gst_status === 'exclusive') return sum + amount * 0.1
    return sum
  }, 0)
  const netGst = gstCollected - gstPaid

  const categoryTotals: Record<string, number> = {}
  filtered.forEach((e: any) => {
    if (!e.tax_category) return
    if (e.tax_category === 'other_income' && e.type !== 'invoice') return
    const amount = e.type === 'labor' ? Number(e.hours) * Number(e.hourly_rate) : Number(e.amount)
    categoryTotals[e.tax_category] = (categoryTotals[e.tax_category] || 0) + amount
  })

  const categoryLabels: Record<string, { en: string, zh: string }> = {
    other_income: { en: 'Job Revenue', zh: '工单收入' },
    cogs_material: { en: 'Materials (Cost of Goods Sold)', zh: '材料成本' },
    cogs_labour: { en: 'Direct Labour (Cost of Goods Sold)', zh: '直接人工' },
    subcontractor: { en: 'Subcontractor Costs', zh: '分包费用' },
    vehicle: { en: 'Vehicle & Travel', zh: '车辆交通' },
    tools_equipment: { en: 'Tools & Equipment', zh: '工具设备' },
    insurance: { en: 'Insurance', zh: '保险' },
    wages: { en: 'Wages & Salary', zh: '工资薪酬' },
    super: { en: 'Superannuation', zh: '养老金' },
    other_expense: { en: 'Other Expense', zh: '其他支出' },
  }

  function exportCSV() {
    const periodLabel = filterType === 'all'
      ? (lang === 'zh' ? '全部时间' : 'All Time')
      : filterType === 'custom'
        ? `${startDate} ~ ${endDate}`
        : quarters[parseInt(filterType[1]) - 1]?.label || filterType

    const lines: string[] = []
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

    lines.push(`${escape(lang === 'zh' ? '税务报告' : 'Tax Report')},${escape(periodLabel)}`)
    lines.push(`${escape(lang === 'zh' ? '生成日期' : 'Generated')},${escape(new Date().toLocaleDateString('en-AU'))}`)
    lines.push('')
    lines.push(escape(lang === 'zh' ? 'GST 汇总（商品及服务税）' : 'GST (Goods and Services Tax) Summary'))
    lines.push([escape(lang === 'zh' ? '项目' : 'Item'), escape(lang === 'zh' ? '金额' : 'Amount')].join(','))
    lines.push([escape(lang === 'zh' ? '已收 GST（来自发票）' : 'GST Collected (from invoices)'), escape(`$${gstCollected.toFixed(2)}`)].join(','))
    lines.push([escape(lang === 'zh' ? '已付 GST（进项税抵扣）' : 'GST Paid (input tax credits)'), escape(`-$${gstPaid.toFixed(2)}`)].join(','))
    lines.push([escape(lang === 'zh' ? `净 GST ${netGst >= 0 ? '（应缴）' : '（退税）'}` : `Net GST ${netGst >= 0 ? '(payable)' : '(refund)'}`), escape(`$${Math.abs(netGst).toFixed(2)}`)].join(','))
    lines.push('')
    lines.push(escape(lang === 'zh' ? '税务分类明细' : 'Tax Category Breakdown'))
    lines.push([escape(lang === 'zh' ? '分类' : 'Category'), escape(lang === 'zh' ? '金额' : 'Amount')].join(','))
    Object.entries(categoryTotals).filter(([cat]) => cat === 'other_income').forEach(([cat, total]) => {
      lines.push([escape(lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat), escape(`$${total.toLocaleString()}`)].join(','))
    })
    Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').forEach(([cat, total]) => {
      lines.push([escape(lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat), escape(`-$${total.toLocaleString()}`)].join(','))
    })
    const taxableProfit = ((categoryTotals['other_income'] || 0) - Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').reduce((sum, [, v]) => sum + v, 0) - homeOfficeDeduction)
    lines.push('')
    lines.push([escape(lang === 'zh' ? '应税利润' : 'Taxable Profit'), escape(`$${taxableProfit.toLocaleString()}`)].join(','))
    lines.push('')
    lines.push(escape(lang === 'zh' ? '* 本报告仅供参考，提交申报前请咨询注册税务代理或 CPA。' : '* For reference only. Consult a registered tax agent or CPA before lodging.'))

    lines.push('')
    lines.push(escape(lang === 'zh' ? '逐笔明细' : 'Transaction Detail'))
    lines.push([escape(lang==='zh'?'日期':'Date'), escape(lang==='zh'?'类型':'Type'), escape(lang==='zh'?'工单':'Job'), escape(lang==='zh'?'说明':'Description'), escape(lang==='zh'?'金额':'Amount'), escape('GST'), escape(lang==='zh'?'GST 额':'GST $'), escape(lang==='zh'?'税务分类':'Category')].join(','))
    ;[...filtered].sort((a:any,b:any)=> new Date(a.entry_date||a.created_at).getTime() - new Date(b.entry_date||b.created_at).getTime()).forEach((e:any)=>{
      const amt = e.type === 'labor' ? (Number(e.hours)||0)*(Number(e.hourly_rate)||0) : (Number(e.amount)||0)
      const gst = e.gst_status === 'inclusive' ? amt/11 : e.gst_status === 'exclusive' ? amt*0.1 : 0
      lines.push([escape(new Date(e.entry_date||e.created_at).toLocaleDateString('en-AU')), escape(e.type||''), escape(e.jobs?.name||''), escape(e.description||e.note||''), escape(amt.toFixed(2)), escape(e.gst_status||''), escape(gst.toFixed(2)), escape(e.tax_category||'')].join(','))
    })
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `tax-report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const cardCls = "bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/tax" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">
              ← {lang === 'zh' ? '税务中心' : 'Tax Hub'}
            </Link>
            <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '税务报告' : 'Tax Report'}</h1>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-gray-100 dark:bg-[#3A3A3C] hover:bg-gray-200 dark:hover:bg-[#48484A] text-gray-700 dark:text-[#F2F2F7] px-3 py-2 rounded-xl text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            {lang === "zh" ? "导出报告（给会计师）" : "Export for Accountant"}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="md:hidden flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link href="/tax" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
            <span className="text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '税务报告' : 'Tax Report'}</h1>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#3A3A3C] text-gray-700 dark:text-[#F2F2F7] px-3 py-1.5 rounded-xl text-xs font-medium">
            ↑ {lang === 'zh' ? '导出' : 'Export'}
          </button>
        </div>

        {/* Filter */}
        <div className={cardCls + ' p-5'}>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {lang === 'zh' ? '筛选范围（BAS 季度）' : 'Filter Period (BAS Quarter)'}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === 'all' ? 'bg-[#0A84FF] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
              {lang === 'zh' ? '全部' : 'All Time'}
            </button>
            {quarters.map((q, i) => (
              <button key={i} onClick={() => setFilterType('q' + (i+1))} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === 'q' + (i+1) ? 'bg-[#0A84FF] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
                {q.label}
              </button>
            ))}
            <button onClick={() => setFilterType('custom')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === 'custom' ? 'bg-[#0A84FF] text-white' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93]'}`}>
              {lang === 'zh' ? '自定义' : 'Custom'}
            </button>
          </div>
          {filterType === 'custom' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[#8E8E93] text-xs">{lang === 'zh' ? '开始日期' : 'Start Date'}</label>
                <input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 mt-1 text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-[#8E8E93] text-xs">{lang === 'zh' ? '结束日期' : 'End Date'}</label>
                <input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 mt-1 text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          )}
          <p className="text-[#8E8E93] text-xs mt-3">{lang === 'zh' ? `当前筛选: ${filtered.length} 条记录` : `Showing: ${filtered.length} entries`}</p>
        </div>

        {/* GST Summary */}
        <div className={cardCls}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {lang === 'zh' ? 'GST 汇总（商品及服务税）' : 'GST (Goods and Services Tax) Summary'}
            </h2>
            <p className="text-[#8E8E93] text-xs mt-1">
              {lang === 'zh' ? '用于季度 BAS（商业税务申报表）申报' : 'Used for your quarterly BAS (Business Activity Statement)'}
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{lang === 'zh' ? '已收 GST' : 'GST Collected'}</p>
                <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '来自发票收入（金额 ÷ 11）' : 'From invoices (amount ÷ 11)'}</p>
              </div>
              <span className="font-semibold text-[#30D158]">${gstCollected.toFixed(2)}</span>
            </div>
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{lang === 'zh' ? '已付 GST（进项税抵扣）' : 'GST Paid (Input Tax Credits)'}</p>
                <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '来自支出（金额 ÷ 11），可从应缴 GST 中扣除' : 'From expenses (amount ÷ 11) — deducted from GST owed'}</p>
              </div>
              <span className="font-semibold text-[#FF453A]">-${gstPaid.toFixed(2)}</span>
            </div>
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-[#1C1C1E]">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {lang === 'zh' ? '净 GST — 向 ATO 申报金额' : 'Net GST — Amount to Report to ATO'}
                </p>
                <p className="text-[#8E8E93] text-xs">
                  {lang === 'zh' ? '在 BAS（商业税务申报表）中填写此金额' : 'Enter this amount in your BAS (Business Activity Statement)'}
                </p>
              </div>
              <span className={`font-bold text-lg ${netGst >= 0 ? 'text-[#FF453A]' : 'text-[#30D158]'}`}>
                ${Math.abs(netGst).toFixed(2)} {netGst >= 0 ? (lang === 'zh' ? '（应缴）' : '(payable)') : (lang === 'zh' ? '（退税）' : '(refund)')}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className={cardCls}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {lang === 'zh' ? '税务分类明细' : 'Tax Category Breakdown'}
            </h2>
            <p className="text-[#8E8E93] text-xs mt-1">
              {lang === 'zh' ? '用于年度所得税申报，由 ATO（澳洲税务局）要求' : 'For your annual income tax return, as required by the ATO (Australian Taxation Office)'}
            </p>
          </div>
          {Object.keys(categoryTotals).length === 0 && (
            <div className="px-6 py-8 text-center text-[#8E8E93]">
              <p>{lang === 'zh' ? '还没有分类条目' : 'No categorised entries yet.'}</p>
              <p className="text-xs mt-1">{lang === 'zh' ? '添加条目时选择税务分类' : 'Select a tax category when adding entries.'}</p>
            </div>
          )}
          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            <div className="px-6 py-3 bg-green-50 dark:bg-[#1C2E1C]">
              <p className="text-xs font-bold text-green-700 dark:text-[#30D158] uppercase tracking-wider">📥 {lang === 'zh' ? '收入' : 'Income'}</p>
            </div>
            {Object.entries(categoryTotals).filter(([cat]) => cat === 'other_income').map(([cat, total]) => (
              <div key={cat} className="px-6 py-4 flex justify-between items-center">
                <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat}</p>
                <span className="font-semibold text-[#30D158]">${total.toLocaleString()}</span>
              </div>
            ))}
            {Object.entries(categoryTotals).filter(([cat]) => cat === 'other_income').length === 0 && (
              <div className="px-6 py-3 text-[#8E8E93] text-sm italic">{lang === 'zh' ? '无收入记录' : 'No income recorded'}</div>
            )}
            <div className="px-6 py-3 bg-red-50 dark:bg-[#2C1A1A]">
              <p className="text-xs font-bold text-red-700 dark:text-[#FF453A] uppercase tracking-wider">📤 {lang === 'zh' ? '支出' : 'Expenses'}</p>
            </div>
            {Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').map(([cat, total]) => (
              <div key={cat} className="px-6 py-4 flex justify-between items-center">
                <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{lang === 'zh' ? categoryLabels[cat]?.zh : categoryLabels[cat]?.en || cat}</p>
                <span className="font-semibold text-[#FF453A]">-${total.toLocaleString()}</span>
              </div>
            ))}
            {Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').length === 0 && (
              <div className="px-6 py-3 text-[#8E8E93] text-sm italic">{lang === 'zh' ? '无支出记录' : 'No expenses recorded'}</div>
            )}
            {homeOfficeDeduction > 0 && (
              <div className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{lang === 'zh' ? '家庭办公抵扣' : 'Home Office'}</p>
                  <p className="text-[#8E8E93] text-xs">{homeOfficeHours.toFixed(1)}h × 70c</p>
                </div>
                <span className="font-semibold text-[#FF453A]">-${homeOfficeDeduction.toLocaleString()}</span>
              </div>
            )}
            {Object.keys(categoryTotals).length > 0 && (
              <div className="px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-[#1C1C1E]">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">💰 {lang === 'zh' ? '应税利润' : 'Taxable Profit'}</p>
                  <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '收入 − 支出' : 'Income minus expenses'}</p>
                </div>
                <span className={(() => {
                  const profit = ((categoryTotals['other_income'] || 0) - Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').reduce((sum, [, v]) => sum + v, 0) - homeOfficeDeduction)
                  return profit >= 0 ? 'font-bold text-lg text-[#30D158]' : 'font-bold text-lg text-[#FF453A]'
                })()}>
                  ${(((categoryTotals['other_income'] || 0) - Object.entries(categoryTotals).filter(([cat]) => cat !== 'other_income').reduce((sum, [, v]) => sum + v, 0) - homeOfficeDeduction)).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5">
          <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">⚠️ {lang === 'zh' ? '免责声明' : 'Disclaimer'}</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
            {lang === 'zh'
              ? '本报告仅供参考。提交 BAS（商业税务申报表）或所得税申报前，请咨询注册税务代理或 CPA（注册会计师）。'
              : 'This report is for reference only. Please consult a registered tax agent or CPA (Certified Practising Accountant) before lodging your BAS or income tax return.'}
          </p>
        </div>
      </main>
    </div>
  )
}
