'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { formatDate } from '../../lib/utils'

export default function VehicleLog() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [entries, setEntries] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [bizPct, setBizPct] = useState(90)
  const [logCost, setLogCost] = useState('')
  const [kmBiz, setKmBiz] = useState('')
  const [kmTotal, setKmTotal] = useState('')

  useEffect(() => {
    supabase.from('job_entries').select('*, jobs(name)').eq('type', 'fuel').order('created_at', { ascending: false }).then(({ data }) => setEntries(data || []))
  }, [])

  const RATE = 0.88, CAP = 5000
  const fyNow = new Date()
  const fyStartYear = fyNow.getMonth() >= 6 ? fyNow.getFullYear() : fyNow.getFullYear() - 1
  const fyStart = new Date(fyStartYear, 6, 1)
  const fyEnd = new Date(fyStartYear + 1, 5, 30, 23, 59, 59)
  const fyLabel = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`
  const fyEntries = mounted ? entries.filter(e => { const d = new Date(e.entry_date || e.created_at); return d >= fyStart && d <= fyEnd }) : []
  const centsPerKm = fyEntries.filter(e => e.ato_method === 'cents_per_km')
  const actualCost = fyEntries.filter(e => e.ato_method === 'actual_cost')
  const totalKm = centsPerKm.reduce((sum, e) => sum + Number(e.kilometers || 0), 0)
  const overCap = totalKm > CAP
  const claimableKm = Math.min(totalKm, CAP)
  const totalDeduction = claimableKm * RATE + actualCost.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const actualTotal = actualCost.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const logbookBase = Number(logCost) || actualTotal
  const kmTotalN = Number(kmTotal) || 0
  const kmBizN = Number(kmBiz) || totalKm
  const derivedPct = kmTotalN > 0 ? Math.min(100, (kmBizN / kmTotalN) * 100) : null
  const effPct = derivedPct != null ? derivedPct : (Number(bizPct) || 0)
  const logbookDeduction = logbookBase * effPct / 100
  const centsCapped = claimableKm * RATE
  const better = logbookDeduction >= centsCapped ? 'logbook' : 'cents'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/tax" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">← {lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">🚗 {lang === 'zh' ? '车辆行程记录' : 'Vehicle Log'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="md:hidden flex items-center gap-2 mb-2">
          <Link href="/tax" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <span className="text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">🚗 {lang === 'zh' ? '车辆行程记录' : 'Vehicle Log'}</h1>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-2xl p-4">
          <p className="text-green-800 dark:text-green-300 text-sm font-medium">{lang === 'zh' ? 'ATO 2025-26 标准：88分/公里' : 'ATO 2025-26 Rate: 88c/km'}</p>
          <p className="text-green-600 dark:text-green-400 text-xs mt-1">{lang === 'zh' ? '工地间行驶100%可抵税。请保留此记录备查。' : 'Travel between job sites is 100% deductible. Keep this log for ATO records.'}</p>
        </div>

        {mounted && (
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900 dark:text-white">{lang==='zh'?'行车日志法（实际成本）':'Logbook (actual cost)'}</p>
              {better==='logbook' && <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{lang==='zh'?'通常更高':'usually higher'}</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-[#8E8E93] leading-relaxed">{lang==='zh'?'抵扣 = 全年车辆开销（油费+保险+注册+维修+折旧）× 商业用途%。无 5000km 上限。%来自连续 12 周行车日志（商业 km÷总 km），可沿用 5 年。':'Deduction = annual vehicle costs (fuel + insurance + rego + repairs + depreciation) x business-use %. No 5,000km cap.'}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs text-gray-500 dark:text-[#8E8E93]">{lang==='zh'?'商业里程 km':'Business km'}</span>
                <input type="number" value={kmBiz} placeholder={totalKm.toFixed(0)} onChange={e=>setKmBiz(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#3A3A3C] bg-transparent px-3 py-2 text-gray-900 dark:text-white" /></label>
              <label className="block"><span className="text-xs text-gray-500 dark:text-[#8E8E93]">{lang==='zh'?'全年总里程 km':'Total km'}</span>
                <input type="number" value={kmTotal} onChange={e=>setKmTotal(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#3A3A3C] bg-transparent px-3 py-2 text-gray-900 dark:text-white" /></label>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-[#8E8E93]">{derivedPct != null ? (lang==='zh'?`→ 商业用途 ${derivedPct.toFixed(0)}%（由里程自动算）`:`→ ${derivedPct.toFixed(0)}% business use`) : (lang==='zh'?'填总里程可自动算 %，否则用下方手填':'Enter total km to auto-calc %')}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-xs text-gray-500 dark:text-[#8E8E93]">{lang==='zh'?'商业用途 %':'Business %'}</span>
                <input type="number" value={bizPct} onChange={e=>setBizPct(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#3A3A3C] bg-transparent px-3 py-2 text-gray-900 dark:text-white" /></label>
              <label className="block"><span className="text-xs text-gray-500 dark:text-[#8E8E93]">{lang==='zh'?'全年车辆开销 $':'Annual costs $'}</span>
                <input type="number" value={logCost} placeholder={actualTotal.toFixed(0)} onChange={e=>setLogCost(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#3A3A3C] bg-transparent px-3 py-2 text-gray-900 dark:text-white" /></label>
            </div>
            <div className="flex items-end justify-between">
              <div><p className="text-xs text-gray-500 dark:text-[#8E8E93]">{lang==='zh'?'日志法可抵':'Logbook'}</p><p className="text-2xl font-bold text-gray-900 dark:text-white">${logbookDeduction.toFixed(0)}</p></div>
              <div className="text-right"><p className="text-xs text-gray-500 dark:text-[#8E8E93]">{lang==='zh'?'里程法（封顶）':'Cents/km (cap)'}</p><p className="text-lg font-semibold text-gray-400">${centsCapped.toFixed(0)}</p></div>
            </div>
            <p className="text-[11px] text-gray-400">{lang==='zh'?'每车每年两种方法只能二选一。':'Pick one method per car per year.'}</p>
          </div>
        )}
        {mounted && overCap && (
          <div className="bg-amber-50 dark:bg-[#3A2E00]/40 border border-amber-200 dark:border-[#5C4A00] rounded-2xl p-4">
            <p className="text-amber-800 dark:text-[#E3B341] text-xs leading-relaxed">⚠️ {lang === 'zh' ? `本年度业务里程 ${totalKm.toFixed(0)}km 已超 5000km 上限，cents-per-km 法最多抵 $4,400；里程多建议改用行车日志法。` : `Business km this FY (${totalKm.toFixed(0)}km) exceeds the 5,000km cap; cents-per-km maxes at $4,400. Consider the logbook method (no cap).`}</p>
          </div>
        )}
        {mounted && (
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl p-5 space-y-2">
            <p className="font-semibold text-gray-900 dark:text-white">{lang==='zh'?'建筑行业常见商业用途 %':'Typical business-use %'}</p>
            <div className="text-xs text-gray-600 dark:text-[#C7C7CC] divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              <div className="flex justify-between py-1.5"><span>{lang==='zh'?'公司专用工具车':'Company tool vehicle'}</span><span className="font-medium">100%</span></div>
              <div className="flex justify-between py-1.5"><span>{lang==='zh'?'工程监督车':'Site supervisor car'}</span><span className="font-medium">80-95%</span></div>
              <div className="flex justify-between py-1.5"><span>Sole Trader Builder</span><span className="font-medium">70-90%</span></div>
              <div className="flex justify-between py-1.5"><span>{lang==='zh'?'兼家庭用车':'Also family car'}</span><span className="font-medium">50-80%</span></div>
            </div>
            <p className="text-[11px] text-gray-400">{lang==='zh'?'仅供参考，实际以你的行车日志为准。':'Reference only; use your own logbook.'}</p>
          </div>
        )}
        {mounted && (
          <div className="bg-amber-50 dark:bg-[#3A2E00]/40 border border-amber-200 dark:border-[#5C4A00] rounded-2xl p-4">
            <p className="text-amber-800 dark:text-[#E3B341] text-xs leading-relaxed">{lang==='zh'?'100% 抵扣需同时满足：公司拥有 + 无私人用途 + 有记录证明。开车回家通常算私人里程，会拉低比例。':'100% needs: company-owned + no private use + records. Home-to-work counts as private travel.'}</p>
          </div>
        )}
        <div className="bg-gray-100/60 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl px-4 py-3">
          <p className="text-[11px] text-gray-500 dark:text-[#8E8E93] leading-relaxed">{lang === 'zh' ? 'CIMO 是记账计算工具，非注册税务/BAS 代理。以上为估算，报税前请咨询注册税务代理或核对 ATO。' : 'CIMO is a bookkeeping tool, not a registered tax/BAS agent. Estimates only — consult a registered tax agent or the ATO before lodging.'}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4">
            <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '总公里数' : 'Total KM'}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totalKm.toFixed(0)}km</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4">
            <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '总抵扣额' : 'Total Deduction'}</p>
            <p className="text-xl font-bold text-[#30D158] mt-1">${totalDeduction.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-4">
            <p className="text-[#8E8E93] text-xs">{lang === 'zh' ? '行程次数' : 'Trips'}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{fyEntries.length}</p>
          </div>
        </div>

        {centsPerKm.length > 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#3A3A3C]">
              <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">{lang === 'zh' ? '按公里计算 (88c/km)' : 'Cents per KM (88c/km)'}</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {centsPerKm.map((e: any) => (
                <div key={e.id} className="px-6 py-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-[#F2F2F7]">{e.trip_from} → {e.trip_to}</p>
                    <p className="text-[#8E8E93] text-xs">{formatDate(e.entry_date || e.created_at)} · {e.jobs?.name}</p>
                    <p className="text-[#8E8E93] text-xs">{Number(e.kilometers).toFixed(1)}km</p>
                  </div>
                  <span className="text-[#30D158] font-medium text-sm">${Number(e.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {actualCost.length > 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-[#3A3A3C]">
              <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">{lang === 'zh' ? '实际油费（凭收据）' : 'Actual Fuel Cost (receipts)'}</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {actualCost.map((e: any) => (
                <div key={e.id} className="px-6 py-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-[#F2F2F7]">{e.trip_from || (lang === 'zh' ? '油费' : 'Fuel')} {e.trip_to ? '→ ' + e.trip_to : ''}</p>
                    <p className="text-[#8E8E93] text-xs">{formatDate(e.entry_date || e.created_at)} · {e.jobs?.name}</p>
                  </div>
                  <span className="text-[#30D158] font-medium text-sm">${Number(e.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-12 text-center">
            <p className="text-4xl mb-3">🚗</p>
            <p className="text-[#8E8E93]">{lang === 'zh' ? '还没有行程记录' : 'No vehicle trips recorded yet.'}</p>
            <p className="text-[#8E8E93] text-xs mt-1">{lang === 'zh' ? '在添加工单条目时选择「油费」类型' : 'Add fuel entries to your jobs to track trips'}</p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-4">
          <p className="text-blue-700 dark:text-blue-300 text-xs">{lang === 'zh' ? '💡 ATO要求：保留行程日志至少5年。此页面可作为正式行程记录，建议截图保存或打印。' : '💡 ATO requires: Keep vehicle logs for at least 5 years. This page serves as your official trip log — screenshot or print for records.'}</p>
        </div>
      </main>
    </div>
  )
}
