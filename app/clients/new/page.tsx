'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function NewClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name) return
    setLoading(true)
    const { error } = await supabase.from('clients').insert({
      name, email, phone, address,
      owner_id: '00000000-0000-0000-0000-000000000000'
    })
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/clients' }
    setLoading(false)
  }
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400">Back</button>
          <h1 className="text-2xl font-bold">New Client</h1>
        </div>
        <div className="space-y-4">
          <div><label className="text-gray-400 text-sm">Name *</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. John Smith" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="text-gray-400 text-sm">Phone</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. 0400 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><label className="text-gray-400 text-sm">Email</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. john@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="text-gray-400 text-sm">Address</label><input className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" placeholder="e.g. 123 Main St, Sydney" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <button onClick={handleSubmit} disabled={loading || !name} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Save Client'}</button>
        </div>
      </div>
    </main>
  )
}