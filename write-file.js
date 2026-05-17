const fs = require('fs')
const content = `'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function NewQuote() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [clients, setClients] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [clientId, setClientId] = useState('')
  const [jobId, setJobId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ description: '', quantity: '1', unit: '', unit_price: '', cost_price: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => setClients(data || []))
    supabase.from('jobs').select('*').then(({ data }) => setJobs(data || []))
  }, [])

  function addItem() { setItems([...items, { description: '', quantity: '1', unit: '', unit_price: '', cost_price: '' }]) }
  function updateItem(i: number, f: string, v: string) { const u = [...items]; u[i] = { ...u[i], [f]: v }; setItems(u) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }

  const totalSell = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
  const totalCost = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost_price) || 0), 0)
  const totalProfit = totalSell - totalCost
  const margin = totalSell > 0 ? (totalProfit / totalSell * 100).toFixed(1) : '0'

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
    const quoteItems = items.filter(i => i.description && i.unit_price).map(i => ({
      quote_id: quote.id,
      description: i.description,
      quantity: Number(i.quantity) || 1,
      unit: i.unit,
      unit_price: Number(i.unit_price),
      cost_price: Number(i.cost_price) || 0
    }))
    if (quoteItems.length > 0) await supabase.from('quote_items').insert(quoteItems)
    window.location.href = '/quotes'
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</button>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '新建报价单' : 'New Quote'}</h1>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '客户' : 'Client'}</label>
            <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">{lang === 'zh' ? '选择客户...' : 'Select client...'}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '工单' : 'Job'}</label>
            <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">{lang === 'zh' ? '选择工单...' : 'Select job...'}</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '报价条目' : 'Quote Items'}</label>
              <button onClick={addItem} className="text-blue-600 text-sm">+ {lang === 'zh' ? '添加条目' : 'Add Item'}</button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-yellow-800 text-xs font-medium">💡 {lang === 'zh' ? '成本价仅自己可见，不会出现在报价单或发票中' : 'Cost price is only visible to you — not shown on quotes or invoices'}</p>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => {
                const sell = Number(item.quantity) * Number(item.unit_price) || 0
                const cost = Number(item.quantity) * Number(item.cost_price) || 0
                const profit = sell - cost
                const itemMargin = sell > 0 ? (profit / sell * 100).toFixed(0) : '0'
                return (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs font-medium">{lang === 'zh' ? '条目' : 'Item'} {index + 1}</span>
                      {items.length > 1 && <button onClick={() => removeItem(index)} className="text-red-400 text-xs">{lang === 'zh' ? '删除' : 'Remove'}</button>}
                    </div>
                    <input className="w-full border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '描述' : 'Description'} value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                    <div className="flex gap-2">
                      <input className="w-16 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '数量' : 'Qty'} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                      <input className="w-16 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '单位' : 'Unit'} value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
                      <input className="flex-1 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '售价 $' : 'Sell price $'} value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                      <input className="flex-1 border border-yellow-300 bg-yellow-50 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '成本价 $' : 'Cost price $'} value={item.cost_price} onChange={(e) => updateItem(index, 'cost_price', e.target.value)} />
                    </div>
                    {sell > 0 && (
                      <div className="flex gap-3 text-xs">
                        <span className="text-green-600">{lang === 'zh' ? '售价' : 'Sell'}: \${sell.toFixed(2)}</span>
                        {cost > 0 && <span className="text-gray-500">{lang === 'zh' ? '成本' : 'Cost'}: \${cost.toFixed(2)}</span>}
                        {cost > 0 && <span className={profit >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{lang === 'zh' ? '利润' : 'Profit'}: \${profit.toFixed(2)} ({itemMargin}%)</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">{lang === 'zh' ? '报价总额' : 'Quote Total'}</span>
              <span className="font-semibold text-green-600">\${totalSell.toLocaleString()}</span>
            </div>
            {totalCost > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === 'zh' ? '总成本（仅自己可见）' : 'Total Cost (private)'}</span>
                  <span className="text-yellow-700">\${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === 'zh' ? '预计利润' : 'Est. Profit'}</span>
                  <span className={totalProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>\${totalProfit.toLocaleString()} ({margin}%)</span>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '备注' : 'Notes'}</label>
            <textarea className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" rows={3} placeholder={lang === 'zh' ? '例如：14天内付款' : 'e.g. Payment due within 14 days'} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '创建报价单' : 'Create Quote')}
          </button>
        </div>
      </main>
    </div>
  )
}`

fs.writeFileSync('app/quotes/new/page.tsx', content)
console.log('done')
