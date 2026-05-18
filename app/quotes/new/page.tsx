'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function NewQuote() {
  const supabase = createClient()
  const { lang } = useLanguage()

  const [jobs, setJobs] = useState<any[]>([])
  const [clientName, setClientName] = useState('')
  const [jobId, setJobId] = useState('')
  const [notes, setNotes] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [items, setItems] = useState([{ description: '', area: '', item_type: '', item_group: '', quantity: '1', unit: '', unit_price: '', cost_price: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {

    supabase.from('jobs').select('*').then(({ data }) => setJobs(data || []))
  }, [])

  function addItem(group?: string) { setItems([...items, { description: '', area: '', item_type: '', item_group: group || '', quantity: '1', unit: '', unit_price: '', cost_price: '' }]) }
  function updateItem(i: number, f: string, v: string) { const u = [...items]; u[i] = { ...u[i], [f]: v }; setItems(u) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }

  const totalSell = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
  const totalCost = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost_price) || 0), 0)
  const totalProfit = totalSell - totalCost
  const margin = totalSell > 0 ? (totalProfit / totalSell * 100).toFixed(1) : '0'

  const groups = [...new Set(items.map(i => i.item_group || ''))].filter(Boolean)
  const defaultGroups = ['Floors & Walls', 'Waterproofing', 'General Items', 'Labour']

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: quote, error } = await supabase.from('quotes').insert({
      client_name: clientName || null,
      job_id: jobId || null,
      notes,
      scope_of_work: scopeOfWork || null,
      owner_id: user?.id
    }).select().single()
    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    const quoteItems = items.filter(i => i.description && i.unit_price).map(i => ({
      quote_id: quote.id,
      description: i.description,
      area: i.area || null,
      item_type: i.item_type || null,
      item_group: i.item_group || null,
      quantity: Number(i.quantity) || 1,
      unit: i.unit,
      unit_price: Number(i.unit_price),
      cost_price: Number(i.cost_price) || 0
    }))
    if (quoteItems.length > 0) await supabase.from('quote_items').insert(quoteItems)
    window.location.href = '/quotes'
    setLoading(false)
  }

  const areaOptions = ['Bath', 'Ensuite', 'PWC', 'Kitchen', 'Laundry', 'Alfresco', 'Living', 'General']
  const typeOptions = ['Tile', 'Floor', 'Wall', 'Floor&Wall', 'Waterproofing', 'General Items', 'Labour']

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</button>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '新建报价单' : 'New Quote'}</h1>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '客户名称' : 'Client Name'}</label>
              <input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" placeholder={lang === 'zh' ? '例如：张先生' : 'e.g. John Smith'} value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div>
              <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '工单' : 'Job'}</label>
              <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                <option value="">{lang === 'zh' ? '选择工单...' : 'Select job...'}</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '报价条目' : 'Quote Items'}</label>
              <div className="flex gap-2">
                {defaultGroups.map(g => (
                  <button key={g} onClick={() => addItem(g)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200">+ {g}</button>
                ))}
                <button onClick={() => addItem()} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">+ {lang === 'zh' ? '条目' : 'Item'}</button>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-yellow-800 text-xs">💡 {lang === 'zh' ? '成本价仅自己可见，不会出现在报价单中' : 'Cost price is private — not shown on the quote'}</p>
            </div>

            {/* 按分组显示 */}
            {[...new Set(['', ...items.map(i => i.item_group || '')])].map(group => {
              const groupItems = items.filter(i => (i.item_group || '') === group)
              if (groupItems.length === 0) return null
              return (
                <div key={group} className="mb-4">
                  {group && <div className="bg-gray-100 px-3 py-1 rounded-lg mb-2 text-sm font-semibold text-gray-700">📁 {group}</div>}
                  <div className="space-y-2">
                    {groupItems.map((item) => {
                      const index = items.indexOf(item)
                      const sell = Number(item.quantity) * Number(item.unit_price) || 0
                      const cost = Number(item.quantity) * Number(item.cost_price) || 0
                      const profit = sell - cost
                      return (
                        <div key={index} className="border border-gray-200 rounded-xl p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">#{index + 1} {item.item_group && <span className="bg-blue-100 text-blue-600 px-1 rounded text-xs">{item.item_group}</span>}</span>
                            {items.length > 1 && <button onClick={() => removeItem(index)} className="text-red-400 text-xs">{lang === 'zh' ? '删除' : 'Remove'}</button>}
                          </div>
                          <input className="w-full border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '描述' : 'Description'} value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                          <div className="flex gap-2">
                            <select className="flex-1 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" value={item.area} onChange={(e) => updateItem(index, 'area', e.target.value)}>
                              <option value="">{lang === 'zh' ? '区域' : 'Area'}</option>
                              {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select className="flex-1 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" value={item.item_type} onChange={(e) => updateItem(index, 'item_type', e.target.value)}>
                              <option value="">{lang === 'zh' ? '类型' : 'Type'}</option>
                              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input className="w-14 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                            <input className="w-14 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder="Unit" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
                          </div>
                          <div className="flex gap-2">
                            <input className="flex-1 border border-gray-200 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '售价 $' : 'Rate $'} value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                            <input className="flex-1 border border-yellow-300 bg-yellow-50 rounded-lg p-2 text-gray-900 outline-none text-sm" placeholder={lang === 'zh' ? '成本 $' : 'Cost $'} value={item.cost_price} onChange={(e) => updateItem(index, 'cost_price', e.target.value)} />
                            {sell > 0 && <span className={profit >= 0 ? 'text-green-600 text-xs self-center font-medium' : 'text-red-500 text-xs self-center font-medium'}>${sell.toFixed(0)} {cost > 0 && '→ ' + (profit >= 0 ? '+' : '') + '$' + profit.toFixed(0)}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">{lang === 'zh' ? '报价总额' : 'Quote Total'}</span>
              <span className="font-semibold text-green-600">${totalSell.toLocaleString()}</span>
            </div>
            {totalCost > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{lang === 'zh' ? '总成本（私密）' : 'Total Cost (private)'}</span>
                  <span>${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{lang === 'zh' ? '预计利润' : 'Est. Profit'}</span>
                  <span className={totalProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>${totalProfit.toLocaleString()} ({margin}%)</span>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '工程范围 (General Scope of Work)' : 'General Scope of Work'}</label>
            <textarea className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none text-sm" rows={4} placeholder={lang === 'zh' ? '例如：\n- 地板和墙壁安装\n- 防水处理\n- 瓷砖供应' : 'e.g.\n- Installation of floors & walls\n- Waterproofing\n- Tiling materials supply'} value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} />
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '备注' : 'Notes'}</label>
            <textarea className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" rows={2} placeholder={lang === 'zh' ? '例如：14天内付款' : 'e.g. Payment due within 14 days'} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '创建报价单' : 'Create Quote')}
          </button>
        </div>
      </main>
    </div>
  )
}