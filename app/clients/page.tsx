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
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('clients').select('*').order('created_at', { ascending: false }).then(({ data }) => setClients(data || []))
    supabase.from('job_summary').select('*').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))
  }, [])

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '客户' : 'Clients'}</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '新建客户' : 'New Client'}</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '客户' : 'Clients'}</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '新建' : 'New'}</Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          {!clients.length && <div className="px-6 py-16 text-center text-gray-400">{lang === 'zh' ? '还没有客户' : 'No clients yet.'}</div>}
          <div className="divide-y divide-gray-100">
            {clients.map((client) => {
              const stats = getClientStats(client.name)
              const clientJobs = getClientJobs(client.name)
              const isExpanded = expanded === client.id
              return (
                <div key={client.id}>
                  <div className="px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isExpanded ? null : client.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-gray-500 text-sm">{client.phone} {client.email}</p>
                        <p className="text-gray-400 text-xs">{client.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-semibold text-sm">${stats.totalRevenue.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">{stats.jobCount} {lang === 'zh' ? '个工单' : 'job(s)'}</p>
                        {stats.unpaid > 0 && <p className="text-red-500 text-xs">{lang === 'zh' ? '未收' : 'Unpaid'}: ${stats.unpaid.toLocaleString()}</p>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>{lang === 'zh' ? '利润' : 'Profit'}: <span className={stats.totalProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>${stats.totalProfit.toLocaleString()}</span></span>
                      </div>
                      <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && clientJobs.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {clientJobs.map(job => (
                        <Link href={'/jobs/' + job.id} key={job.id} className="flex justify-between items-center px-8 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{job.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${job.status === 'active' ? 'bg-blue-100 text-blue-600' : job.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                              {job.status === 'active' ? (lang === 'zh' ? '进行中' : 'Active') : job.status === 'completed' ? (lang === 'zh' ? '已完成' : 'Completed') : (lang === 'zh' ? '暂停' : 'Paused')}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">${Number(job.revenue).toLocaleString()}</p>
                            <p className={`text-xs ${Number(job.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{lang === 'zh' ? '利润' : 'Profit'}: ${Number(job.profit).toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {isExpanded && clientJobs.length === 0 && (
                    <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center text-gray-400 text-sm">
                      {lang === 'zh' ? '该客户暂无工单' : 'No jobs for this client yet.'}
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