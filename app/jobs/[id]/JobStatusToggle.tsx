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
    { value: 'active', label: lang === 'zh' ? '进行中' : 'Active' },
    { value: 'completed', label: lang === 'zh' ? '已完成' : 'Done' },
    { value: 'paused', label: lang === 'zh' ? '暂停' : 'Paused' },
    { value: 'archived', label: lang === 'zh' ? '归档' : 'Archived' },
  ]

  const activeColors: Record<string, string> = {
    active: 'bg-[#0A84FF] text-white',
    completed: 'bg-[#30D158] text-white',
    paused: 'bg-[#FF9F0A] text-white',
    archived: 'bg-[#8E8E93] text-white',
  }

  return (
    <div className="flex bg-gray-100 dark:bg-[#2C2C2E] rounded-xl p-0.5 gap-0.5">
      {statuses.map(s => (
        <button
          key={s.value}
          onClick={() => handleChange(s.value)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            s.value === status
              ? activeColors[s.value]
              : 'text-[#8E8E93] hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
