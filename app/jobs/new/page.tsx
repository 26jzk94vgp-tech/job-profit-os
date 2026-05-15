'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'

export default function NewJob() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit() {
    if (!name) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('jobs').insert({
      name,
      client_name: clientName,
      owner_id: user?.id
    })
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/' }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = '/'} className="text-gray-500 hover:text-gray-700 text-sm">← 返回 / Back</button>
          <h1 className="font-semibold text-gray-900">新建工程 / New Job</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">工程名称 / Job Name *</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Kitchen Renovation" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">客户名称 / Client Name</label>
            <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Smith" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <button onClick={handleSubmit} disabled={loading || !name} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? '创建中... / Creating...' : '创建工程 / Create Job'}
          </button>
        </div>
      </main>
    </div>
  )
}