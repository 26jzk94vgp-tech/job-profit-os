'use client'

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
      .eq('status', 'archived')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setJobs(data || []); setLoading(false) })
  }, [])

  async function restoreJob(jobId: string) {
    if (!confirm(lang === 'zh' ? '恢复这个工单到进行中？' : 'Restore this job to active?')) return
    await supabase.from('jobs').update({ status: 'active' }).eq('id', jobId)
    setJobs(jobs.filter((j: any) => j.id !== jobId))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">
            ← {lang === 'zh' ? '首页' : 'Home'}
          </Link>
          <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">📦 {lang === 'zh' ? '归档中心' : 'Archive'}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="md:hidden flex items-center gap-2 mb-2">
          <Link href="/" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</Link>
          <span className="text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">📦 {lang === 'zh' ? '归档中心' : 'Archive'}</h1>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-4">
          <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">⚖️ {lang === 'zh' ? 'ATO 税务合规提示' : 'ATO Compliance Notice'}</p>
          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
            {lang === 'zh' ? '根据澳洲税法，所有财务记录需保留至少5年。归档工单永久保留，可随时恢复。' : 'Australian tax law requires records to be kept for at least 5 years. Archived jobs are kept permanently and can be restored anytime.'}
          </p>
        </div>

        {loading && <p className="text-[#8E8E93] text-center py-8">{lang === 'zh' ? '加载中...' : 'Loading...'}</p>}

        {!loading && jobs.length === 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-[#8E8E93]">{lang === 'zh' ? '暂无归档工单' : 'No archived jobs yet'}</p>
            <p className="text-[#8E8E93] text-xs mt-1">{lang === 'zh' ? '将工单状态设为「归档」后会显示在这里' : 'Jobs marked as Archived will appear here'}</p>
          </div>
        )}

        {jobs.length > 0 && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-gray-100 dark:border-[#3A3A3C]">
              <p className="text-xs font-bold text-yellow-700 dark:text-[#FF9F0A] uppercase tracking-wider">
                📦 {lang === 'zh' ? `已归档 (${jobs.length})` : `Archived (${jobs.length})`}
              </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {jobs.map((job: any) => (
                <div key={job.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div>
                    <Link href={'/jobs/' + job.id} className="font-medium text-gray-900 dark:text-[#F2F2F7] hover:text-[#0A84FF] transition-colors">
                      {job.name}
                    </Link>
                    <p className="text-[#8E8E93] text-xs mt-0.5">{job.client_name}</p>
                    <p className="text-[#8E8E93] text-xs">
                      {lang === 'zh' ? '收入' : 'Revenue'}: ${Number(job.revenue).toLocaleString()} · {lang === 'zh' ? '利润' : 'Profit'}:{' '}
                      <span className={Number(job.profit) >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}>
                        ${Number(job.profit).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => restoreJob(job.id)}
                    className="bg-blue-100 dark:bg-[#0A84FF]/20 hover:bg-blue-200 dark:hover:bg-[#0A84FF]/30 text-blue-700 dark:text-[#0A84FF] px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                  >
                    {lang === 'zh' ? '恢复' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
