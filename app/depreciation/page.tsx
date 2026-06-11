'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Depreciation() {
  const { lang } = useLanguage()
  const [cost, setCost] = useState('')
  const [bizPct, setBizPct] = useState(100)
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [isCar, setIsCar] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const THRESHOLD = 20000
  const CAR_LIMIT = 69674
  const now = new Date()
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  const fyEnd = new Date(fyStartYear + 1, 5, 30)
  const fyLabel = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`
  const daysToEofy = Math.ceil((fyEnd.getTime() - now.getTime()) / 86400000)

  const costN = Number(cost) || 0
  const pctN = Math.min(100, Math.max(0, Number(bizPct) || 0))
  const d = new Date(dateStr)
  const inWindow = d >= new Date(fyStartYear, 6, 1) && d <= fyEnd
  const baseCost = isCar ? Math.min(costN, CAR_LIMIT) : costN
  const bizPortion = baseCost * pctN / 100
  const eligible = costN > 0 && costN < THRESHOLD && inWindow
  const yr1Pool = bizPortion * 0.15
  const yr2Pool = (bizPortion - yr1Pool) * 0.30
  const yr3Pool = (bizPortion - yr1Pool - yr2Pool) * 0.30

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/tax" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">← {lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '设备即时抵扣' : 'Instant Asset Write-Off'}</h1>
        </div>
      </nav>
      <div className="md:hidden flex items-center gap-2 px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60">
        <Link href="/tax" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
        <span className="text-[#3A3A3C]">/</span>
        <h1 className="font-semibold text-gray-900 dark:text-white text-sm">{lang === 'zh' ? '设备即时抵扣' : 'Write-Off'}</h1>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-5">
          <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">💡 {lang === 'zh' ? `即时资产抵扣 $20,000/件 · ${fyLabel}` : `Instant asset write-off $20,000/asset · ${fyLabel}`}</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">{lang === 'zh' ? '单件<$20,000(不含GST)可当年全额抵;须在6月30日前装好可用,光下单不算。2026年7月1日起门槛降回 $1,000。' : 'Per asset < $20,000 ex-GST, deducted in full this year; must be installed and ready by 30 June. Threshold reverts to $1,000 from 1 Jul 2026.'}</p>
          {mounted && daysToEofy > 0 && daysToEofy <= 60 && (
            <p className="text-[#FF9F0A] text-xs font-semibold mt-2">⏰ {lang === 'zh' ? `距 6月30日 截止还剩 ${daysToEofy} 天` : `${daysToEofy} days until 30 June deadline`}</p>
          )}
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '算一件设备' : 'Check an asset'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '设备价格 $(不含GST)' : 'Cost $ (ex GST)'}</label>
              <input type="number" min="0" className={inputCls} placeholder="e.g. 15000" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '商业用途 %' : 'Business use %'}</label>
              <input type="number" min="0" max="100" className={inputCls} value={bizPct} onChange={e => setBizPct(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '装好可用日期' : 'Ready-for-use date'}</label>
              <input type="date" className={inputCls} value={dateStr} onChange={e => setDateStr(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 pb-3 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={isCar} onChange={e => setIsCar(e.target.checked)} className="w-4 h-4" />
              {lang === 'zh' ? '是汽车(上限 $69,674)' : 'Car (limit $69,674)'}
            </label>
          </div>
        </div>

        {mounted && costN > 0 && (
          eligible ? (
            <div className="bg-green-50 dark:bg-[#1C2E1C] border border-green-200 dark:border-green-800/40 rounded-2xl p-5 space-y-1">
              <p className="font-semibold text-green-800 dark:text-[#30D158]">✅ {lang === 'zh' ? '可即时全额抵扣' : 'Eligible for instant write-off'}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-[#30D158]">${bizPortion.toLocaleString()} <span className="text-sm font-normal">{lang === 'zh' ? `(${pctN}% 商业部分,本财年一次抵)` : `(${pctN}% business portion, this FY)`}</span></p>
              {!inWindow && <p className="text-xs text-[#FF453A]">{lang === 'zh' ? '注意:日期不在本财年窗口内' : 'Note: date outside this FY window'}</p>}
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-[#3A2E00]/40 border border-amber-200 dark:border-[#5C4A00] rounded-2xl p-5 space-y-2">
              <p className="font-semibold text-amber-800 dark:text-[#E3B341]">{!inWindow && costN < THRESHOLD ? (lang === 'zh' ? '⚠️ 日期不在本财年窗口' : '⚠️ Date outside FY window') : (lang === 'zh' ? '⛔ 超过 $20,000,走折旧池' : '⛔ Over $20,000 — small business pool')}</p>
              {costN >= THRESHOLD && (
                <div className="text-sm text-amber-800 dark:text-[#E3B341] space-y-1">
                  <p>{lang === 'zh' ? '整件价格超限即不可即时抵(与商业比例无关)。商业部分进折旧池:' : 'Full cost over limit disqualifies write-off regardless of business %. Business portion goes to pool:'}</p>
                  <p>{lang === 'zh' ? '第1年' : 'Yr 1'} (15%): <b>${yr1Pool.toFixed(0)}</b> · {lang === 'zh' ? '第2年' : 'Yr 2'} (30%): <b>${yr2Pool.toFixed(0)}</b> · {lang === 'zh' ? '第3年' : 'Yr 3'} (30%): <b>${yr3Pool.toFixed(0)}</b></p>
                  {isCar && costN > CAR_LIMIT && <p className="text-xs">{lang === 'zh' ? `汽车折旧上限 $${CAR_LIMIT.toLocaleString()},超出部分不可折旧。` : `Car limit $${CAR_LIMIT.toLocaleString()}; excess not depreciable.`}</p>}
                </div>
              )}
            </div>
          )
        )}

        <div className="bg-gray-100/60 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-[#8E8E93]">{lang === 'zh' ? '适用年营业额<$1000万且采用简化折旧的小企业;新旧设备均可;每件分别计算。CIMO 是记账计算工具,非注册税务/BAS 代理;以上为估算,报税前请核对 ATO 或咨询代理。' : 'For small businesses (turnover < $10M) using simplified depreciation; new and second-hand assets; per-asset basis. CIMO is a bookkeeping tool, not a registered tax/BAS agent. Estimates only.'}</p>
        </div>
      </main>
    </div>
  )
}
