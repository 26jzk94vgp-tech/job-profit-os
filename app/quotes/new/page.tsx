'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function NewQuote() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [jobId, setJobId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ description: '', quantity: '1', unit: '', unit_price: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => setClients(data || []))
    supabase.from('jobs').select('*').then(({ data }) => setJobs(data || []))
  }, [])

  function addItem() { setItems([...items, { description: '', quantity: '1', unit: '', unit_price: '' }]) }
  function updateItem(i: number, f: string, v: string) { const u = [...items]; u[i] = { ...u[i], [f]: v }; setItems(u) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)

  async function handleSubmit() {
    setLoading(true)
    const { data: quote, error } = await supabase.from('quotes').insert({
      client_id: clientId || null,
      job_id: jobId || null,
      notes,
      owner_id: '00000000-0000-0000-0000-000000000000'
    }).select().single()
    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    const quoteItems = items.filter(i => i.description && i.unit_price).map(i => ({
      quote_id: quote.id,
      description: i.description,
      quantity: Number(i.quantity),
      unit: i.unit,
      unit_price: Number(i.unit_price)
    }))
    if (quoteItems.length > 0) await supabase.from('quote_items').insert(quoteItems)
    window.location.href = '/quotes'
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400">Back</button>
          <h1 className="text-2xl font-bold">New Quote</h1>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Client</label>
            <select className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm">Job</label>
            <select className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">Select job...</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-400 text-sm">Items</label>
              <button onClick={addItem} className="text-blue-400 text-sm">+ Add Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-900 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Item {index + 1}</span>
                    {items.length > 1 && <button onClick={() => removeItem(index)} className="text-red-400 text-sm">Remove</button>}
                  </div>
                  <input className="w-full bg-gray-800 rounded-lg p-2 text-white outline-none text-sm" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                  <div className="flex gap-2">
                    <input type="number" className="w-20 bg-gray-800 rounded-lg p-2 text-white outline-none text-sm" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                    <input className="w-20 bg-gray-800 rounded-lg p-2 text-white outline-none text-sm" placeholder="Unit" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
                    <input type="number" className="flex-1 bg-gray-800 rounded-lg p-2 text-white outline-none text-sm" placeholder="Price $" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold text-green-400">${total.toLocaleString()}</span>
          </div>
          <div>
            <label className="text-gray-400 text-sm">Notes</label>
            <textarea className="w-full bg-gray-900 rounded-lg p-3 mt-1 text-white outline-none" rows={3} placeholder="e.g. Payment due within 14 days" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? 'Saving...' : 'Create Quote'}</button>
        </div>
      </div>
    </main>
  )
}