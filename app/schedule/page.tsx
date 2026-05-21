'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import Link from 'next/link'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function Schedule() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [today] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('jobs').select('*').eq('owner_id', user?.id).not('start_date', 'is', null)
      setJobs(data || [])
    }
    load()
  }, [])

  // Calendar helpers
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = currentMonth.toLocaleString('en-AU', { month: 'long', year: 'numeric' })

  function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1, 1)) }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function jobsOnDate(dateS: string) {
    return jobs.filter(j => {
      if (!j.start_date) return false
      const start = j.start_date
      const end = j.end_date || j.start_date
      return dateS >= start && dateS <= end
    })
  }

  const todayStr = today.toISOString().split('T')[0]
  const selectedJobs = selectedDate ? jobsOnDate(selectedDate) : []

  const statusColor = (status: string) => {
    if (status === 'completed') return 'bg-[#30D158]/20 text-[#30D158]'
    if (status === 'cancelled') return 'bg-gray-100 dark:bg-[#3A3A3C] text-[#8E8E93]'
    if (status === 'paused') return 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
    return 'bg-[#0A84FF]/20 text-[#0A84FF]'
  }

  const statusLabel = (status: string) => {
    if (lang === 'zh') {
      if (status === 'active') return '进行中'
      if (status === 'completed') return '已完成'
      if (status === 'cancelled') return '已取消'
      if (status === 'paused') return '暂停'
    }
    return status
  }

  // Jobs this month
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  const jobsThisMonth = jobs.filter(j => {
    const start = j.start_date || ''
    const end = j.end_date || j.start_date || ''
    return start <= monthEnd && end >= monthStart
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-12 md:pt-0">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4 hidden md:block">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 dark:text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
            <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">📅 {lang === 'zh' ? '排班日历' : 'Schedule'}</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="md:hidden flex items-center gap-2">
          <Link href="/" className="text-[#8E8E93] text-sm">← {lang === 'zh' ? '首页' : 'Home'}</Link>
          <span className="text-[#3A3A3C]">/</span>
          <h1 className="font-semibold text-gray-900 dark:text-white">📅 {lang === 'zh' ? '排班日历' : 'Schedule'}</h1>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] hover:bg-gray-200 transition-colors">‹</button>
            <h2 className="font-semibold text-gray-900 dark:text-white">{monthLabel}</h2>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] hover:bg-gray-200 transition-colors">›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-[#8E8E93] py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ds = dateStr(day)
              const dayJobs = jobsOnDate(ds)
              const isToday = ds === todayStr
              const isSelected = ds === selectedDate
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : ds)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-colors
                    ${isSelected ? 'bg-[#0A84FF] text-white' : isToday ? 'bg-[#0A84FF]/10 text-[#0A84FF]' : 'hover:bg-gray-100 dark:hover:bg-[#3A3A3C] text-gray-900 dark:text-[#F2F2F7]'}`}
                >
                  {day}
                  {dayJobs.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayJobs.slice(0, 3).map((j, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#0A84FF]'}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected date jobs */}
        {selectedDate && (
          <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[#8E8E93] text-xs mt-0.5">{selectedJobs.length} {lang === 'zh' ? '个工单' : 'job(s)'}</p>
            </div>
            {selectedJobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#8E8E93]">
                <p>{lang === 'zh' ? '这天没有工单' : 'No jobs on this day'}</p>
                <Link href="/jobs/new" className="mt-3 inline-block text-[#0A84FF] text-sm">+ {lang === 'zh' ? '新建工单' : 'New Job'}</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
                {selectedJobs.map(job => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{job.name}</p>
                      <p className="text-[#8E8E93] text-xs mt-0.5">{job.client_name}</p>
                      {job.start_date && (
                        <p className="text-[#8E8E93] text-xs">
                          {job.start_date} {job.end_date && job.end_date !== job.start_date ? `→ ${job.end_date}` : ''}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(job.status)}`}>{statusLabel(job.status)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* This month's jobs */}
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#3A3A3C]">
            <p className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '本月工单' : 'This Month'}</p>
            <p className="text-[#8E8E93] text-xs mt-0.5">{jobsThisMonth.length} {lang === 'zh' ? '个' : 'job(s)'}</p>
          </div>
          {jobsThisMonth.length === 0 ? (
            <div className="px-5 py-8 text-center text-[#8E8E93]">
              <p>{lang === 'zh' ? '本月没有已排期的工单' : 'No scheduled jobs this month'}</p>
              <p className="text-xs mt-1">{lang === 'zh' ? '创建工单时设置开始日期' : 'Set a start date when creating a job'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              {jobsThisMonth.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')).map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[#F2F2F7]">{job.name}</p>
                    <p className="text-[#8E8E93] text-xs mt-0.5">{job.client_name}</p>
                    <p className="text-[#8E8E93] text-xs">
                      {job.start_date} {job.end_date && job.end_date !== job.start_date ? `→ ${job.end_date}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(job.status)}`}>{statusLabel(job.status)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
