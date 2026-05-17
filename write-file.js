const fs = require('fs')
const content = `'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Archive() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('job_summary').select('*')
      .in('status', ['archived', 'cancelled'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setJobs(data || [])
        setLoading(false)
      })
  }, [])

  async function restoreJob(jobId: string) {
    if (!confirm(lang === 'zh' ? '恢复这个工单到进行中？' : 'Restore this job to active?')) return
    await supabase.from('jobs').update({ status: 'active' }).eq('id', jobId)
    setJobs(jobs.filter((j: any) => j.id !== jobId))
  }

  const archived = jobs.filter((j: any) => j.status === 'archived')
  const cancelled = jobs.filter((j: any) => j.status === 'cancelled')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <h1 className="font-semibold text-gray-900">📦 {lang === 'zh' ? '归档中心' : 'Archive'}</h1>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="md:hidden flex items-center gap-3 mb-2">
          <Link href="/" className="text-gray-500 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <h1 className="font-semibold text-gray-900">📦 {lang === 'zh' ? '归档中心' : 'Archive'}</h1>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm font-medium">⚖️ {lang === 'zh' ? 'ATO 税务合规提示' : 'ATO Compliance Notice'}</p>
          <p className="text-blue-600 text-xs mt-1">{lang === 'zh' ? '根据澳洲税法，所有财务记录需保留至少5年。归档工单永久保留，可随时恢复。' : 'Australian tax law requires records to be kept for at least 5 years. Archived jobs are kept permanently and can be restored anytime.'}</p>
        </div>
        {loading && <p className="text-gray-400 text-center py-8">{lang === 'zh' ? '加载中...' : 'Loading...'}</p>}
        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-500">{lang === 'zh' ? '暂无归档工单' : 'No archived jobs yet'}</p>
            <p className="text-gray-400 text-xs mt-1">{lang === 'zh' ? '将工单状态设为「归档」或「取消」后会显示在这里' : 'Jobs marked as Archived or Cancelled will appear here'}</p>
          </div>
        )}
        {archived.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-yellow-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">📦 {lang === 'zh' ? \`已归档 (\${archived.length})\` : \`Archived (\${archived.length})\`}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {archived.map((job: any) => (
                <div key={job.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <Link href={'/jobs/' + job.id} className="font-medium text-gray-900 hover:text-blue-600">{job.name}</Link>
                    <p className="text-gray-500 text-xs mt-0.5">{job.client_name}</p>
                    <p className="text-gray-400 text-xs">{lang === 'zh' ? '收入' : 'Revenue'}: \${Number(job.revenue).toLocaleString()} · {lang === 'zh' ? '利润' : 'Profit'}: \${Number(job.profit).toLocaleString()}</p>
                  </div>
                  <button onClick={() => restoreJob(job.id)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium">{lang === 'zh' ? '恢复' : 'Restore'}</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {cancelled.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-red-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">❌ {lang === 'zh' ? \`已取消 (\${cancelled.length})\` : \`Cancelled (\${cancelled.length})\`}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {cancelled.map((job: any) => (
                <div key={job.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <Link href={'/jobs/' + job.id} className="font-medium text-gray-500 hover:text-blue-600 line-through">{job.name}</Link>
                    <p className="text-gray-400 text-xs mt-0.5">{job.client_name}</p>
                    <p className="text-gray-400 text-xs">{lang === 'zh' ? '收入' : 'Revenue'}: \${Number(job.revenue).toLocaleString()}</p>
                  </div>
                  <button onClick={() => restoreJob(job.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium">{lang === 'zh' ? '恢复' : 'Restore'}</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}`

fs.writeFileSync('app/archive/page.tsx', content)
console.log('done')
