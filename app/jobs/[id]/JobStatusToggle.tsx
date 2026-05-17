'use client'

import { useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function JobStatusToggle({ jobId, currentStatus }: { jobId: string, currentStatus: string }) {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [status, setStatus] = useState(currentStatus)

  async function handleChange(newStatus: string) {
    setStatus(newStatus)
    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)
  }

  const statuses = [
    { value: 'active', label: lang === 'zh' ? '进行中' : 'Active', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: lang === 'zh' ? '已完成' : 'Completed', color: 'bg-green-100 text-green-700' },
    { value: 'paused', label: lang === 'zh' ? '暂停' : 'Paused', color: 'bg-gray-100 text-gray-600' },
    { value: 'archived', label: lang === 'zh' ? '归档' : 'Archived', color: 'bg-yellow-100 text-yellow-700' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => handleChange(s.value)}
          className={s.value === status ? s.color + ' px-3 py-1 rounded-full text-xs font-medium ring-2 ring-offset-1 ring-blue-400' : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 hover:bg-gray-200'}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}