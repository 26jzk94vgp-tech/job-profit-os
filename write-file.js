const fs = require('fs')

// clients/new/page.tsx
const clientsNew = `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'

export default function NewClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit() {
    if (!name) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('clients').insert({
      name, email, phone, address, owner_id: user?.id
    })
    if (error) { alert('Error: ' + error.message) } else { window.location.href = '/clients' }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="font-semibold text-gray-900">New Client</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div><label className="text-gray-700 text-sm font-medium">Name *</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Smith" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="text-gray-700 text-sm font-medium">Phone</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0400 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><label className="text-gray-700 text-sm font-medium">Email</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="text-gray-700 text-sm font-medium">Address</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main St, Sydney" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <button onClick={handleSubmit} disabled={loading || !name} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Save Client'}</button>
        </div>
      </main>
    </div>
  )
}`

// clients/page.tsx
const clients = `import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function Clients() {
  const supabase = await createClient()
  const { data: clientsList } = await supabase.from('clients').select('*').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Home</Link>
            <h1 className="font-semibold text-gray-900">Clients</h1>
          </div>
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ New Client</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200">
          {!clientsList?.length && <div className="px-6 py-16 text-center text-gray-400">No clients yet.</div>}
          <div className="divide-y divide-gray-100">
            {clientsList?.map((client) => (
              <div key={client.id} className="px-6 py-4">
                <p className="font-medium text-gray-900">{client.name}</p>
                <p className="text-gray-500 text-sm">{client.phone} {client.email}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}`

// quotes/page.tsx
const quotes = `import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'

export default async function Quotes() {
  const supabase = await createClient()
  const { data: quotesList } = await supabase.from('quotes').select('*, jobs(name), clients(name)').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">← Home</Link>
            <h1 className="font-semibold text-gray-900">Quotes</h1>
          </div>
          <Link href="/quotes/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ New Quote</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200">
          {!quotesList?.length && <div className="px-6 py-16 text-center text-gray-400">No quotes yet.</div>}
          <div className="divide-y divide-gray-100">
            {quotesList?.map((quote) => (
              <div key={quote.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{quote.clients?.name || 'No client'}</p>
                  <p className="text-gray-500 text-sm">{quote.jobs?.name || 'No job'}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{quote.status}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}`

fs.writeFileSync('app/clients/new/page.tsx', clientsNew)
fs.writeFileSync('app/clients/page.tsx', clients)
fs.writeFileSync('app/quotes/page.tsx', quotes)
console.log('done all pages')
