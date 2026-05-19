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

  useEffect(() => {
    supabase.from('job_entries')
      .select('*, jobs(name)')
      .eq('type', 'fuel')
      .order('created_at', { ascending: false })
      .then(({ data }) => setEntries(data || []))
  }, [])

  const totalKm = entries.filter(e => e.ato_method === 'cents_per_km').reduce((sum, e) => sum + Number(e.kilometers || 0), 0)
  const totalDeduction = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const centsPerKm = entries.filter(e => e.ato_method === 'cents_per_km')
  const actualCost = entries.filter(e => e.ato_method === 'actual_cost')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/tax" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '税务中心' : 'Tax Hub'}</Link>
          <h1 className="font-semibold text-gray-900 dark:text-[#F2F2F7]">🚗 {lang === 'zh' ? '车辆行程记录' : 'Vehicle Log'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <Link href="/tax" className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <h1 className="font-semibold text-gray-900 dark:text-[#F2F2F7]">🚗 {lang === 'zh' ? '车辆行程记录' : 'Vehicle Log'}</h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 text-sm font-medium">{lang === 'zh' ? 'ATO 2024-25 标准：88分/公里' : 'ATO 2024-25 Rate: 88c/km'}</p>
          <p className="text-green-600 text-xs mt-1">{lang === 'zh' ? '工地间行驶100%可抵税。请保留此记录备查。' : 'Travel between job sites is 100% deductible. Keep this log for ATO records.'}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '总公里数' : 'Total KM'}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{totalKm.toFixed(0)}km</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '总抵扣额' : 'Total Deduction'}</p>
            <p className="text-xl font-bold text-green-600 mt-1">${totalDeduction.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-500 text-xs">{lang === 'zh' ? '行程次数' : 'Trips'}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{entries.length}</p>
          </div>
        </div>

        {centsPerKm.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 dark:border-[#3A3A3C]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '按公里计算 (88c/km)' : 'Cents per KM (88c/km)'}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {centsPerKm.map((e: any) => (
                <div key={e.id} className="px-6 py-4 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-[#F2F2F7]">{e.trip_from} → {e.trip_to}</p>
                    <p className="text-gray-400 text-xs">{formatDate(e.entry_date || e.created_at)} · {e.jobs?.name}</p>
                    <p className="text-gray-500 text-xs">{Number(e.kilometers).toFixed(1)}km</p>
                  </div>
                  <span className="text-green-600 font-medium text-sm">${Number(e.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {actualCost.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 dark:border-[#3A3A3C]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '实际油费（凭收据）' : 'Actual Fuel Cost (receipts)'}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {actualCost.map((e: any) => (
                <div key={e.id} className="px-6 py-4 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-[#F2F2F7]">{e.trip_from || (lang === 'zh' ? '油费' : 'Fuel')} {e.trip_to ? '→ ' + e.trip_to : ''}</p>
                    <p className="text-gray-400 text-xs">{formatDate(e.entry_date || e.created_at)} · {e.jobs?.name}</p>
                  </div>
                  <span className="text-green-600 font-medium text-sm">${Number(e.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">🚗</p>
            <p className="text-gray-500 dark:text-[#8E8E93] dark:text-[#636366]">{lang === 'zh' ? '还没有行程记录' : 'No vehicle trips recorded yet.'}</p>
            <p className="text-gray-400 text-xs mt-1">{lang === 'zh' ? '在添加工单条目时选择「油费」类型' : 'Add fuel entries to your jobs to track trips'}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-xs">{lang === 'zh' ? '💡 ATO要求：保留行程日志至少5年。此页面可作为正式行程记录，建议截图保存或打印。' : '💡 ATO requires: Keep vehicle logs for at least 5 years. This page serves as your official trip log — screenshot or print for records.'}</p>
        </div>
      </main>
    </div>
  )
}