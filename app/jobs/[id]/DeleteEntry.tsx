'use client'

import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function DeleteEntry({ entryId, jobId }: { entryId: string, jobId: string }) {
  const supabase = createClient()
  const { lang } = useLanguage()

  async function handleDelete() {
    if (!confirm(lang === 'zh' ? '确定删除这条记录？' : 'Delete this entry?')) return
    await supabase.from('job_entries').delete().eq('id', entryId)
    window.location.href = '/jobs/' + jobId
  }

  return (
    <button onClick={handleDelete} className="text-red-400 text-sm hover:text-red-600">
      {lang === 'zh' ? '删除' : 'Delete'}
    </button>
  )
}