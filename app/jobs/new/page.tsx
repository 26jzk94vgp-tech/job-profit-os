'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function NewJob() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(false)

async function handleSubmit() {
    if (!name) return
    setLoading(true)

    const { data, error } = await supabase.from('jobs').insert({
      name,
      client_name: clientName,
      owner_id: '00000000-0000-0000-0000-000000000000'
    }).select()

    if (error) {
      alert('Error: ' + error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">New Job</h1>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Job Name *</label>
            <input
              className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. Kitchen Renovation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Client Name</label>
            <input
              className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. John Smith"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !name}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </div>
    </main>
  )
}
