'use client'

import { createClient } from '../../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function JobStatusToggle({ jobId, currentStatus }: { jobId: string, currentStatus: string }) {
  const supabase = createClient()
  const router = useRouter()
  const { lang } = useLanguage()

  async function handleChange(newStatus: string) {
    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)
    router.refresh()
  }

  const statuses = [
    { value: 'active', label: lang === 'zh' ? '进行中' : 'Active', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: lang === 'zh' ? '已完成' : 'Completed', color: 'bg-green-100 text-green-700' },
    { value: 'paused', label: lang === 'zh' ? '暂停' : 'Paused', color: 'bg-gray-100 text-gray-600' },
  ]

  return (
    <div className="flex gap-2">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => handleChange(s.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${currentStatus === s.value ? s.color + ' ring-2 ring-offset-1 ring-blue-400' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}