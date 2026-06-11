'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function SuperTracker() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [rows, setRows] = useState<any[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [fund, setFund] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const CAP = 30000

  async function loadRows() {
    const { data } = await supabase.from('super_contributions').select('*').order('paid_date', { ascending: false })
    setRows(data || [])
  }

  async function handleAdd() {
    if (!amount) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('super_contributions').insert({ owner_id: user?.id, paid_date: date, amount: Number(amount), fund_name: fund })
    if (error) { console.error(error); alert('保存失败,请重试 / Save failed, please try again') } else { setAmount(''); loadRows() }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('super_contributions').delete().eq('id', id)
    loadRows()
  }

  useEffect(() => { loadRows() }, [])
  useEffect(() => setMounted(true), [])

  const now = new Date()
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  const fyStart = new Date(fyStartYear, 6, 1)
  const fyEnd = new Date(fyStartYear + 1, 5, 30, 23, 59, 59)
  const fyLabel = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`
  const fyRows = mounted ? rows.filter(r => { const d = new Date(r.paid_date); return d >= fyStart && d <= fyEnd }) : []
  const total = fyRows.reduce((s, r) => s + Number(r.amount), 0)
  const pct = Math.min(100, (total / CAP) * 100)
  const remaining = Math.max(0, CAP - total)
  const over = total > CAP

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/tax" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">← {lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? 'Super 供款' : 'Super Contributions'}</h1>
        </div>
      </nav>
      <div className="md:hidden flex items-center gap-2 px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60">
        <Link href="/tax" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
        <span className="text-[#3A3A3C]">/</span>
        <h1 className="font-semibold text-gray-900 dark:text-white text-sm">{lang === 'zh' ? 'Super 供款' : 'Super'}</h1>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5">
          <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">💡 {lang === 'zh' ? `优惠供款上限 $30,000 · ${fyLabel}` : `Concessional cap $30,000 · ${fyLabel}`}</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">{lang === 'zh' ? '含雇主 SG(12%)+个人可抵扣供款,基金内按 15% 计税。以基金收到日为准。' : 'Includes employer SG (12%) + personal deductible contributions; taxed 15% in fund. Counts when received by the fund.'}</p>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-5 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[#8E8E93] text-sm">{lang === 'zh' ? '本财年已供' : 'Contributed this FY'}</p>
              <p className="text-3xl font-bold text-[#0A84FF] mt-1">${total.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '距上限' : 'Remaining'}</p>
              <p className={over ? 'text-xl font-bold text-[#FF453A]' : 'text-xl font-bold text-[#30D158]'}>{over ? (lang === 'zh' ? '已超限' : 'Over cap') : `$${remaining.toLocaleString()}`}</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-[#3A3A3C] overflow-hidden">
            <div className={over ? 'h-full bg-[#FF453A]' : 'h-full bg-[#30D158]'} style={{ width: pct + '%' }}></div>
          </div>
          {mounted && over && (
            <p className="text-xs text-[#FF453A]">⚠️ {lang === 'zh' ? `超出 $${(total - CAP).toLocaleString()}。超限部分按边际税率补税,可能另有超额费;近5年未用上限或可结转(总余额<$50万)。` : `Over by $${(total - CAP).toLocaleString()}. Excess taxed at marginal rate; carry-forward of unused cap from prior 5 years may apply (TSB < $500k).`}</p>
          )}
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '记一笔供款' : 'Add Contribution'}</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '到账日期' : 'Date received'}</label>
              <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="w-36">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '金额' : 'Amount'}</label>
              <input type="number" min="0" className={inputCls} placeholder="e.g. 1000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '基金(可选)' : 'Fund (optional)'}</label>
            <input className={inputCls} placeholder="e.g. AustralianSuper" value={fund} onChange={e => setFund(e.target.value)} />
          </div>
          <button onClick={handleAdd} disabled={loading || !amount} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '添加' : 'Add')}
          </button>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A3A3C]"><h3 className="font-semibold text-gray-900 dark:text-white">{fyLabel}</h3></div>
          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            {fyRows.map((r: any) => (
              <div key={r.id} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                <div>
                  <p className="text-gray-900 dark:text-[#F2F2F7] text-sm">{r.paid_date}{r.fund_name ? ' — ' + r.fund_name : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#0A84FF] text-sm font-medium">${Number(r.amount).toLocaleString()}</span>
                  <button onClick={() => handleDelete(r.id)} className="text-[#FF453A] text-xs hover:text-red-400 transition-colors">{lang === 'zh' ? '删除' : 'Delete'}</button>
                </div>
              </div>
            ))}
            {mounted && fyRows.length === 0 && (
              <div className="px-6 py-10 text-center text-[#8E8E93] text-sm">{lang === 'zh' ? '本财年还没有记录' : 'No contributions this FY yet.'}</div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-2xl p-5">
          <p className="text-yellow-800 dark:text-yellow-300 font-medium text-sm">⚠️ {lang === 'zh' ? '要点' : 'Notes'}</p>
          <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">{lang === 'zh' ? '个体户要抵扣个人供款,须在报税前向基金提交 Notice of Intent 并取得确认。雇主注意:2026年7月1日起 Payday Super,随每次发薪 7 个工作日内到账。CIMO 是记账计算工具,非注册税务/BAS 代理;以上为估算。' : 'To claim a deduction, lodge a Notice of Intent with your fund and get acknowledgement before lodging your return. Employers: Payday Super from 1 Jul 2026 (within 7 business days of payday). CIMO is a bookkeeping tool, not a registered tax/BAS agent.'}</p>
        </div>
      </main>
    </div>
  )
}
