'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Clients() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [clients, setClients] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    supabase.from('clients').select('*').order('created_at', { ascending: false }).then(({ data }) => setClients(data || []))
    supabase.from('job_summary').select('*').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))
  }, [])

  function getClientStats(clientId: string, clientName: string) {
    const clientJobs = jobs.filter(j => j.client_id === clientId || j.client_name === clientName)
    const totalRevenue = clientJobs.reduce((sum, j) => sum + Number(j.revenue), 0)
    const totalProfit = clientJobs.reduce((sum, j) => sum + Number(j.profit), 0)
    const unpaid = clientJobs.reduce((sum, j) => sum + Number(j.unpaid_amount || 0), 0)
    return { totalRevenue, totalProfit, unpaid, jobCount: clientJobs.length }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">
              ← {lang === 'zh' ? '首页' : 'Home'}
            </Link>
            <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '客户' : 'Clients'}</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            + {lang === 'zh' ? '新建客户' : 'New Client'}
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-16 pb-8 md:pt-8">
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <span className="text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '客户' : 'Clients'}</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
            + {lang === 'zh' ? '新建' : 'New'}
          </Link>
        </div>

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          {!clients.length && (
            <div className="px-6 py-16 text-center text-[#8E8E93]">
              {lang === 'zh' ? '还没有客户' : 'No clients yet.'}
            </div>
          )}
          <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
            {clients.map((client) => {
              const stats = getClientStats(client.id, client.name)
              return (
                <Link href={'/clients/' + client.id} key={client.id} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{client.name}</p>
                    <p className="text-[#8E8E93] text-sm mt-0.5">
                      {stats.jobCount} {lang === 'zh' ? '个工单' : 'job(s)'}
                      {client.phone && <span className="ml-2">· {client.phone}</span>}
                    </p>
                    {stats.unpaid > 0 && (
                      <p className="text-[#FF453A] text-xs mt-0.5">
                        {lang === 'zh' ? '未收款' : 'Unpaid'} ${stats.unpaid.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className={`font-semibold text-sm ${stats.totalRevenue > 0 ? 'text-[#30D158]' : 'text-[#8E8E93]'}`}>
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                    <p className={`text-xs ${stats.totalProfit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
                      {lang === 'zh' ? '利润' : 'Profit'} ${stats.totalProfit.toLocaleString()}
                    </p>
                    <span className="text-[#8E8E93] text-xs">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
