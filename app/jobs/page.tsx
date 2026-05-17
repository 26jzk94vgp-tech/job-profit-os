'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Jobs() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    supabase.from('job_summary').select('*').order('created_at', { ascending: false }).then(({ data }) => setJobs(data || []))
  }, [])

  function sortJobs(jobList: any[]) {
    return [...jobList].sort((a: any, b: any) => {
      if (sortBy === 'profit') return Number(b.profit) - Number(a.profit)
      if (sortBy === 'revenue') return Number(b.revenue) - Number(a.revenue)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  function statusLabel(status: string) {
    if (lang === 'zh') {
      const labels: Record<string, string> = { active: '进行中', completed: '已完成', paused: '暂停', archived: '归档' }
      return labels[status] || status
    }
    const labels: Record<string, string> = { active: 'Active', completed: 'Completed', paused: 'Paused', archived: 'Archived' }
    return labels[status] || status
  }

  const activeJobs = sortJobs(jobs.filter(j => ['active', 'paused'].includes(j.status)))
  const completedJobs = sortJobs(jobs.filter(j => j.status === 'completed'))

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '工单列表' : 'Jobs'}</h1>
          <Link href="/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '新建工单' : 'New Job'}</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        <div className="md:hidden flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 text-lg">{lang === 'zh' ? '工单列表' : 'Jobs'}</h1>
          <Link href="/jobs/new" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">+ {lang === 'zh' ? '新建' : 'New'}</Link>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs">{jobs.filter(j => !['archived'].includes(j.status)).length} {lang === 'zh' ? '个工单' : 'jobs'}</p>
          <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">{lang === 'zh' ? '最新创建' : 'Newest First'}</option>
            <option value="profit">{lang === 'zh' ? '按利润' : 'By Profit'}</option>
            <option value="revenue">{lang === 'zh' ? '按收入' : 'By Revenue'}</option>
          </select>
        </div>

        {jobs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
            <p className="text-gray-400 mb-4">{lang === 'zh' ? '还没有工单' : 'No jobs yet.'}</p>
            <Link href="/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">{lang === 'zh' ? '新建工单' : 'New Job'}</Link>
          </div>
        )}

        {activeJobs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{lang === 'zh' ? '进行中' : 'Active'} ({activeJobs.length})</p>
            </div>
            <div className="divide-y divide-gray-100">
              {activeJobs.map((job: any) => {
                const profit = Number(job.profit)
                return (
                  <Link href={'/jobs/' + job.id} key={job.id} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{job.name}</p>
                      <p className="text-gray-500 text-sm">{job.client_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}</p>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{statusLabel(job.status)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {completedJobs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-green-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">{lang === 'zh' ? '已完成' : 'Completed'} ({completedJobs.length})</p>
            </div>
            <div className="divide-y divide-gray-100">
              {completedJobs.map((job: any) => {
                const profit = Number(job.profit)
                const unpaid = Number(job.unpaid_amount || 0)
                return (
                  <Link href={'/jobs/' + job.id} key={job.id} className={`flex justify-between items-center px-6 py-4 hover:bg-gray-50 ${unpaid > 0 ? 'border-l-4 border-red-400' : 'opacity-80'}`}>
                    <div>
                      <p className="font-medium text-gray-900">{job.name}</p>
                      <p className="text-gray-500 text-sm">{job.client_name}</p>
                      {unpaid > 0 && <p className="text-red-500 text-xs">💰 {lang === 'zh' ? `未收 $${unpaid.toLocaleString()}` : `Unpaid $${unpaid.toLocaleString()}`}</p>}
                    </div>
                    <div className="text-right">
                      <p className={profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString()}</p>
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{statusLabel(job.status)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <Link href="/archive" className="flex items-center justify-between px-6 py-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-xl">📦</span>
            <div>
              <p className="font-medium text-gray-700 text-sm">{lang === 'zh' ? '归档中心' : 'Archive Centre'}</p>
              <p className="text-gray-400 text-xs">{lang === 'zh' ? '查看已归档和已暂停的工单' : 'View archived and paused jobs'}</p>
            </div>
          </div>
          <span className="text-gray-400 text-sm">→</span>
        </Link>
      </main>
    </div>
  )
}