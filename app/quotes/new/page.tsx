'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

type Item = { description: string; area: string; item_type: string; item_group: string; quantity: string; unit: string; unit_price: string; cost_price: string }

export default function NewQuote() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [notes, setNotes] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [items, setItems] = useState<Item[]>([{ description: '', area: '', item_type: '', item_group: '', quantity: '1', unit: '', unit_price: '', cost_price: '' }])
  const [loading, setLoading] = useState(false)

  // AI Import
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importedItems, setImportedItems] = useState<Item[]>([])
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('jobs').select('*').then(({ data }) => setJobs(data || []))
    supabase.from('clients').select('*').order('name').then(({ data }) => setClients(data || []))
  }, [])

  function addItem(group?: string) { setItems([...items, { description: '', area: '', item_type: '', item_group: group || '', quantity: '1', unit: '', unit_price: '', cost_price: '' }]) }
  function updateItem(i: number, f: string, v: string) { const u = [...items]; u[i] = { ...u[i], [f]: v }; setItems(u) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }

  const totalSell = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
  const totalCost = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost_price) || 0), 0)
  const totalProfit = totalSell - totalCost
  const margin = totalSell > 0 ? (totalProfit / totalSell * 100).toFixed(1) : '0'
  const defaultGroups = ['Floors & Walls', 'Waterproofing', 'General Items', 'Labour']
  const areaOptions = ['Bath', 'Ensuite', 'PWC', 'Kitchen', 'Laundry', 'Alfresco', 'Living', 'General']
  const typeOptions = ['Tile', 'Floor', 'Wall', 'Floor&Wall', 'Waterproofing', 'General Items', 'Labour']

  // Handle file select
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setImportPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setImportPreview(null)
    }
  }

  // Call Claude API to recognize quote
  async function handleRecognize() {
    if (!importFile) return
    setImportLoading(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((res, rej) => {
        reader.onload = (ev) => res((ev.target?.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(importFile)
      })

      const isImage = importFile.type.startsWith('image/')
      const isPdf = importFile.type === 'application/pdf'

      const contentBlock = isImage
        ? { type: 'image', source: { type: 'base64', media_type: importFile.type, data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              contentBlock,
              {
                type: 'text',
                text: `Extract all quote line items from this document. Return ONLY a JSON array, no markdown, no explanation.
Each item must have these fields:
- description (string): item name/description
- area (string): one of Bath/Ensuite/PWC/Kitchen/Laundry/Alfresco/Living/General or empty
- item_type (string): one of Tile/Floor/Wall/Floor&Wall/Waterproofing/General Items/Labour or empty
- item_group (string): group name like "Floors & Walls", "Waterproofing", "General Items", "Labour" or empty
- quantity (string): number as string, default "1"
- unit (string): m2/Lm/Each/etc or empty
- unit_price (string): sell price as string, empty if not found
- cost_price (string): always empty ""

Example: [{"description":"600x300 TILES BATH","area":"Bath","item_type":"Floor&Wall","item_group":"Floors & Walls","quantity":"1","unit":"m2","unit_price":"3500","cost_price":""}]`
              }
            ]
          }]
        })
      })

      const data = await response.json()
      const text = data.content?.find((c: any) => c.type === 'text')?.text || '[]'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed: Item[] = JSON.parse(clean)
      setImportedItems(parsed)
      setImportStep('preview')
    } catch (err) {
      alert(lang === 'zh' ? '识别失败，请重试' : 'Recognition failed, please try again')
      console.error(err)
    }
    setImportLoading(false)
  }

  function handleImportConfirm() {
    // Remove empty default item if it's blank
    const currentItems = items.filter(i => i.description || i.unit_price)
    setItems([...currentItems, ...importedItems])
    setShowImport(false)
    setImportStep('upload')
    setImportFile(null)
    setImportPreview(null)
    setImportedItems([])
  }

  function closeImport() {
    setShowImport(false)
    setImportStep('upload')
    setImportFile(null)
    setImportPreview(null)
    setImportedItems([])
  }

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: quote, error } = await supabase.from('quotes').insert({
      client_name: clientName || null, client_id: clientId || null, job_id: jobId || null,
      notes, scope_of_work: scopeOfWork || null, owner_id: user?.id
    }).select().single()
    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    const quoteItems = items.filter(i => i.description && i.unit_price).map(i => ({
      quote_id: quote.id, description: i.description, area: i.area || null,
      item_type: i.item_type || null, item_group: i.item_group || null,
      quantity: Number(i.quantity) || 1, unit: i.unit,
      unit_price: Number(i.unit_price), cost_price: Number(i.cost_price) || 0
    }))
    if (quoteItems.length > 0) await supabase.from('quote_items').insert(quoteItems)
    window.location.href = '/quotes'
    setLoading(false)
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-blue-500/40 transition"
  const selectCls = "border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-blue-500/40 transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-gray-400 dark:text-[#8E8E93] hover:text-gray-600 dark:hover:text-white text-sm transition-colors">
              ← {lang === 'zh' ? '返回' : 'Back'}
            </button>
            <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '新建报价单' : 'New Quote'}</h1>
          </div>
          {/* AI Import button */}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            <span>📷</span>
            <span>{lang === 'zh' ? 'AI 识别' : 'AI Scan'}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-5">

          {/* Client + Job */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '客户名称' : 'Client Name'}</label>
              <input className={inputCls + ' mt-1'} placeholder={lang === 'zh' ? '例如：张先生' : 'e.g. John Smith'} value={clientName} onChange={e => setClientName(e.target.value)} />
              {clients.length > 0 && (
                <select className={selectCls + ' w-full mt-1'} value={clientId} onChange={e => { setClientId(e.target.value); const found = clients.find(c => c.id === e.target.value); if (found) setClientName(found.name) }}>
                  <option value="">{lang === 'zh' ? '或从客户列表选择...' : 'Or select from client list...'}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '工单' : 'Job'}</label>
              <select className={selectCls + ' w-full mt-1'} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">{lang === 'zh' ? '选择工单...' : 'Select job...'}</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{lang === 'zh' ? '报价条目' : 'Quote Items'}</label>
              <div className="flex flex-wrap gap-2">
                {defaultGroups.map(g => (
                  <button key={g} onClick={() => addItem(g)} className="text-xs bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-[#48484A] transition-colors">+ {g}</button>
                ))}
                <button onClick={() => addItem()} className="text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF] px-2 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-[#0A84FF]/30 transition-colors">+ {lang === 'zh' ? '条目' : 'Item'}</button>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-xl p-3 mb-3">
              <p className="text-yellow-800 dark:text-yellow-300 text-xs">💡 {lang === 'zh' ? '成本价仅自己可见，不会出现在报价单中' : 'Cost price is private — not shown on the quote'}</p>
            </div>

            {[...new Set(['', ...items.map(i => i.item_group || '')])].map(group => {
              const groupItems = items.filter(i => (i.item_group || '') === group)
              if (groupItems.length === 0) return null
              return (
                <div key={group} className="mb-4">
                  {group && <div className="bg-gray-100 dark:bg-[#3A3A3C] px-3 py-1 rounded-xl mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">📁 {group}</div>}
                  <div className="space-y-2">
                    {groupItems.map((item) => {
                      const index = items.indexOf(item)
                      const sell = Number(item.quantity) * Number(item.unit_price) || 0
                      const cost = Number(item.quantity) * Number(item.cost_price) || 0
                      const profit = sell - cost
                      return (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 space-y-2 bg-white dark:bg-gray-800">
                          <div className="flex justify-between items-center">
                            <span className="text-[#8E8E93] text-xs">#{index + 1} {item.item_group && <span className="bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF] px-1 rounded text-xs">{item.item_group}</span>}</span>
                            {items.length > 1 && <button onClick={() => removeItem(index)} className="text-[#FF453A] text-xs">{lang === 'zh' ? '删除' : 'Remove'}</button>}
                          </div>
                          <input className={inputCls} placeholder={lang === 'zh' ? '描述' : 'Description'} value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                          <div className="flex gap-2">
                            <select className={selectCls + ' flex-1'} value={item.area} onChange={e => updateItem(index, 'area', e.target.value)}>
                              <option value="">{lang === 'zh' ? '区域' : 'Area'}</option>
                              {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <select className={selectCls + ' flex-1'} value={item.item_type} onChange={e => updateItem(index, 'item_type', e.target.value)}>
                              <option value="">{lang === 'zh' ? '类型' : 'Type'}</option>
                              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <input className={selectCls + ' w-20'} placeholder="Qty" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                            <input className={selectCls + ' w-20'} placeholder="Unit" value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} />
                          </div>
                          <div className="flex gap-2 items-center">
                            <input className={inputCls + ' flex-1'} placeholder={lang === 'zh' ? '售价 $' : 'Rate $'} value={item.unit_price} onChange={e => updateItem(index, 'unit_price', e.target.value)} />
                            <input className="flex-1 border border-yellow-300 dark:border-yellow-700/60 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 outline-none text-sm" placeholder={lang === 'zh' ? '成本 $' : 'Cost $'} value={item.cost_price} onChange={e => updateItem(index, 'cost_price', e.target.value)} />
                            {sell > 0 && <span className={`text-xs font-medium shrink-0 ${profit >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>${sell.toFixed(0)} {cost > 0 && '→ ' + (profit >= 0 ? '+' : '') + '$' + profit.toFixed(0)}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 dark:bg-[#1C1C1E] rounded-2xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '报价总额' : 'Quote Total'}</span>
              <span className="font-semibold text-[#30D158]">${totalSell.toLocaleString()}</span>
            </div>
            {totalCost > 0 && (
              <>
                <div className="flex justify-between text-sm text-[#8E8E93]">
                  <span>{lang === 'zh' ? '总成本（私密）' : 'Total Cost (private)'}</span>
                  <span>${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8E8E93]">{lang === 'zh' ? '预计利润' : 'Est. Profit'}</span>
                  <span className={totalProfit >= 0 ? 'text-[#30D158] font-medium' : 'text-[#FF453A] font-medium'}>${totalProfit.toLocaleString()} ({margin}%)</span>
                </div>
              </>
            )}
          </div>

          {/* Scope */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '工程范围' : 'General Scope of Work'}</label>
            <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-blue-500/40 transition resize-none" rows={4} value={scopeOfWork} onChange={e => setScopeOfWork(e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '备注' : 'Notes'}</label>
            <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none resize-none focus:ring-2 focus:ring-blue-500/40 transition" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '创建报价单' : 'Create Quote')}
          </button>
        </div>
      </main>

      {/* ── AI Import Sheet (Apple style bottom sheet) ── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeImport} />

          {/* Sheet */}
          <div className="relative bg-white dark:bg-[#1C1C1E] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-[#3A3A3C] rounded-full" />
            </div>

            <div className="px-6 pb-10 pt-2 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {importStep === 'upload'
                      ? (lang === 'zh' ? '📷 AI 识别报价单' : '📷 AI Quote Scan')
                      : (lang === 'zh' ? '✅ 识别结果' : '✅ Recognition Result')}
                  </h2>
                  <p className="text-[#8E8E93] text-sm mt-0.5">
                    {importStep === 'upload'
                      ? (lang === 'zh' ? '上传图片或PDF，自动识别条目' : 'Upload image or PDF to auto-extract items')
                      : (lang === 'zh' ? `识别到 ${importedItems.length} 个条目，确认后导入` : `Found ${importedItems.length} items — confirm to import`)}
                  </p>
                </div>
                <button onClick={closeImport} className="w-8 h-8 bg-gray-100 dark:bg-[#3A3A3C] rounded-full flex items-center justify-center text-[#8E8E93] hover:bg-gray-200 dark:hover:bg-[#48484A] transition-colors">
                  ✕
                </button>
              </div>

              {importStep === 'upload' && (
                <>
                  {/* Upload zone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${importFile ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-[#3A3A3C] hover:border-purple-400 dark:hover:border-purple-500'}`}
                  >
                    {importPreview ? (
                      <img src={importPreview} alt="preview" className="max-h-40 mx-auto rounded-xl object-contain mb-3" />
                    ) : (
                      <div className="text-4xl mb-3">{importFile ? '📄' : '📁'}</div>
                    )}
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {importFile ? importFile.name : (lang === 'zh' ? '点击上传图片或PDF' : 'Tap to upload image or PDF')}
                    </p>
                    {!importFile && <p className="text-[#8E8E93] text-xs mt-1">{lang === 'zh' ? '支持 JPG、PNG、PDF' : 'JPG, PNG, PDF supported'}</p>}
                    <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
                  </div>

                  {importFile && (
                    <button
                      onClick={handleRecognize}
                      disabled={importLoading}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {importLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          {lang === 'zh' ? 'AI 识别中...' : 'Recognizing...'}
                        </>
                      ) : (
                        <>{lang === 'zh' ? '✨ 开始识别' : '✨ Recognize'}</>
                      )}
                    </button>
                  )}
                </>
              )}

              {importStep === 'preview' && (
                <>
                  {/* Preview items */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importedItems.map((item, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.description}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {item.item_group && <span className="text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF] px-2 py-0.5 rounded-full">{item.item_group}</span>}
                              {item.area && <span className="text-xs bg-gray-100 dark:bg-[#3A3A3C] text-[#8E8E93] px-2 py-0.5 rounded-full">{item.area}</span>}
                              {item.unit && <span className="text-xs text-[#8E8E93]">×{item.quantity} {item.unit}</span>}
                            </div>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            {item.unit_price && <p className="font-semibold text-[#30D158]">${Number(item.unit_price).toLocaleString()}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setImportStep('upload'); setImportedItems([]) }}
                      className="flex-1 bg-gray-100 dark:bg-[#3A3A3C] text-gray-700 dark:text-[#8E8E93] py-3 rounded-2xl font-medium transition-colors"
                    >
                      {lang === 'zh' ? '重新上传' : 'Re-upload'}
                    </button>
                    <button
                      onClick={handleImportConfirm}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-2xl font-semibold transition-colors"
                    >
                      {lang === 'zh' ? `导入 ${importedItems.length} 条` : `Import ${importedItems.length} items`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
