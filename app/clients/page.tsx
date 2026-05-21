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
  const [quotes, setQuotes] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('clients').select('*').order('created_at', { ascending: false }).then(({ data }) => setClients(data || []))
    supabase.from('job_summary').select('*').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))
    supabase.from('quotes').select('*').order('created_at', { ascending: false }).then(({ data }) => setQuotes(data || []))
  }, [])

  function getClientQuotes(clientId: string, clientName: string) {
    return quotes.filter((q: any) => q.client_id === clientId || q.client_name === clientName)
  }
  function getClientJobs(clientName: string) {
    return jobs.filter(j => j.client_name === clientName)
  }
  function getClientStats(clientName: string) {
    const clientJobs = getClientJobs(clientName)
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

      <main className="max-w-4xl mx-auto px-4 pt-10 pb-8 md:pt-8">
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
              const stats = getClientStats(client.name)
              const clientJobs = getClientJobs(client.name)
              const isExpanded = expanded === client.id
              return (
                <div key={client.id}>
                  <div className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors" onClick={() => setExpanded(isExpanded ? null : client.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{client.name}</p>
                        <p className="text-[#8E8E93] text-sm">{client.phone} {client.email}</p>
                        <p className="text-[#8E8E93] text-sm">{client.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#30D158] font-semibold text-sm">${stats.totalRevenue.toLocaleString()}</p>
                        <p className="text-[#8E8E93] text-sm">{stats.jobCount} {lang === 'zh' ? '个工单' : 'job(s)'}</p>
                        {stats.unpaid > 0 && <p className="text-[#FF453A] text-sm">{lang === 'zh' ? '未收' : 'Unpaid'}: ${stats.unpaid.toLocaleString()}</p>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-[#8E8E93]">
                        {lang === 'zh' ? '利润' : 'Profit'}:{' '}
                        <span className={stats.totalProfit >= 0 ? 'text-[#30D158] font-medium' : 'text-[#FF453A] font-medium'}>
                          ${stats.totalProfit.toLocaleString()}
                        </span>
                      </span>
                      <span className="text-[#8E8E93] text-sm">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && clientJobs.length > 0 && (
                    <div className="bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-[#3A3A3C]">
                      {clientJobs.map(job => (
                        <Link href={'/jobs/' + job.id} key={job.id} className="flex justify-between items-center px-8 py-3 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] border-b border-gray-100 dark:border-[#3A3A3C] last:border-0 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-[#F2F2F7]">{job.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${job.status === 'active' ? 'bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF]' : job.status === 'completed' ? 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]'}`}>
                              {job.status === 'active' ? (lang === 'zh' ? '进行中' : 'Active') : job.status === 'completed' ? (lang === 'zh' ? '已完成' : 'Completed') : (lang === 'zh' ? '暂停' : 'Paused')}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#30D158]">${Number(job.revenue).toLocaleString()}</p>
                            <p className={`text-sm ${Number(job.profit) >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>{lang === 'zh' ? '利润' : 'Profit'}: ${Number(job.profit).toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {isExpanded && clientJobs.length === 0 && (
                    <div className="bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-[#3A3A3C] px-8 py-4 text-center text-[#8E8E93] text-sm">
                      {lang === 'zh' ? '该客户暂无工单' : 'No jobs for this client yet.'}
                    </div>
                  )}

                  {isExpanded && getClientQuotes(client.id, client.name).length > 0 && (
                    <div className="bg-yellow-50 dark:bg-[#2C2100] border-t border-gray-100 dark:border-[#3A3A3C]">
                      <div className="px-6 py-2 border-b border-gray-100 dark:border-[#3A3A3C]">
                        <p className="text-xs font-bold text-yellow-700 dark:text-[#FF9F0A] uppercase tracking-wide">📋 {lang === 'zh' ? '报价单' : 'Quotes'}</p>
                      </div>
                      {getClientQuotes(client.id, client.name).map((q: any) => (
                        <a href={'/quotes/' + q.id} key={q.id} className="flex justify-between items-center px-8 py-3 hover:bg-yellow-100 dark:hover:bg-[#3A3A3C] border-b border-gray-100 dark:border-[#3A3A3C] last:border-0 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-[#F2F2F7]">{lang === 'zh' ? '报价单' : 'Quote'} #{q.quote_number || q.id.slice(0, 6)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${q.status === 'accepted' ? 'bg-green-100 dark:bg-[#30D158]/20 text-green-600 dark:text-[#30D158]' : q.status === 'sent' ? 'bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF]' : 'bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]'}`}>
                              {q.status === 'accepted' ? (lang === 'zh' ? '已接受' : 'Accepted') : q.status === 'sent' ? (lang === 'zh' ? '已发送' : 'Sent') : (lang === 'zh' ? '草稿' : 'Draft')}
                            </span>
                          </div>
                          <span className="text-[#8E8E93] text-sm">→</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
