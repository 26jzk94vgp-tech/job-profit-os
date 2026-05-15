'use client'

import { createClient } from '../../../utils/supabase/client'

export default function DeleteEntry({ entryId, jobId }: { entryId: string, jobId: string }) {
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('job_entries').delete().eq('id', entryId)
    if (error) { alert('Error: ' + error.message) } else { window.location.reload() }
  }

  return (
    <button onClick={handleDelete} className="text-red-400 text-sm hover:text-red-600">Delete</button>
  )
}