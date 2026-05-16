'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'

export default function NewQuote() {
  const router = useRouter()
  const supabase = createClient()
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

  const total = items.reduce((sum, item) => {
    if (item.quantity === '/' || item.unit_price === '/') return sum
    return sum + (Number(item.quantity) * Number(item.unit_price) || 0)
  }, 0)

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: quote, error } = await supabase.from('quotes').insert({
      client_id: clientId || null,
      job_id: jobId || null,
      notes,
      owner_id: user?.id
    }).select().single()
    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    const quoteItems = items.filter(i => i.description && i.unit_price && i.unit_price !== '/').map(i => ({
      quote_id: quote.id,
      description: i.description,
      quantity: i.quantity === '/' ? 1 : Number(i.quantity),
      unit: i.unit,
      unit_price: Number(i.unit_price)
    }))
    if (quoteItems.length > 0) await supabase.from('quote_items').insert(quoteItems)
    window.location.href = '/quotes'
    setLoading(false)
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← 返回 / Back</button>
          <h1 className="font-semibold text-gray-900">新建报价单 / New Quote</h1>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">客户 / Client</label>
            <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">选择客户 / Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">工单 / Job</label>
            <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">选择工单 / Select job...</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-700 text-sm font-medium">条目 / Items</label>
              <button onClick={addItem} className="text-blue-600 text-sm">+ 添加条目 / Add Item</button>
            </div>
            <p className="text-gray-400 text-xs mb-3">未知数值填 / (Use / for unknown values)</p>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">条目 / Item {index + 1}</span>
                    {items.length > 1 && <button onClick={() => removeItem(index)} className="text-red-400 text-sm">删除 / Remove</button>}
                  </div>
                  <input className="w-full border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder="描述 / Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                  <div className="flex gap-2">
                    <input className="w-20 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder="数量" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                    <input className="w-20 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder="单位" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
                    <input className="flex-1 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder="单价 $ (or /)" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex justify-between">
            <span className="font-semibold text-gray-900">合计 / Total</span>
            <span className="font-semibold text-green-600">${total.toLocaleString()}</span>
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">备注 / Notes</label>
            <textarea className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" rows={3} placeholder="e.g. 14天内付款 / Payment due within 14 days" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">{loading ? '保存中...' : '创建报价单 / Create Quote'}</button>
        </div>
      </main>
    </div>
  )
}