'use client'

import { useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function DeleteEntry({ entryId, jobId }: { entryId: string, jobId: string }) {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    await supabase.from('job_entries').delete().eq('id', entryId)
    window.location.href = '/jobs/' + jobId
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={handleDelete} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-lg font-medium">
          {lang === 'zh' ? '确认' : 'Yes'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 px-2 py-0.5 rounded-lg">
          {lang === 'zh' ? '取消' : 'No'}
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-red-400 text-sm hover:text-red-600">
      {lang === 'zh' ? '删除' : 'Delete'}
    </button>
  )
}
