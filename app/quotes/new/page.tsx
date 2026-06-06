'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

type Item = { description: string; area: string; item_type: string; item_group: string; quantity: string; unit: string; unit_price: string; cost_price: string; priceMode?: 'unit'|'total' }

export default function NewQuote() {
  const supabase = createClient()
  const { lang } = useLanguage()
  const [jobs, setJobs] = useState<any[]>([])
  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [jobId, setJobId] = useState('')
  const [jobName, setJobName] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [addrOptions, setAddrOptions] = useState<string[]>([])
  useEffect(() => {
    const q = siteAddress.trim()
    if (q.length < 4) { setAddrOptions([]); return }
    const tmr = setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then((data: string[]) => setAddrOptions(data))
        .catch(() => {})
    }, 400)
    return () => clearTimeout(tmr)
  }, [siteAddress])
  const [notes, setNotes] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [items, setItems] = useState<Item[]>([{ description: '', area: '', item_type: '', item_group: '', quantity: '1', unit: '', unit_price: '', cost_price: '' }])
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importedItems, setImportedItems] = useState<Item[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fromJob, setFromJob] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const allJobs = await supabase.from('jobs').select('*').eq('owner_id', user?.id)
      setJobs(allJobs.data || [])
      supabase.from('clients').select('*').eq('owner_id', user?.id).order('name').then(({ data }) => setClients(data || []))
      const params = new URLSearchParams(window.location.search)
      const presetJobId = params.get('job_id')
      if (presetJobId) {
        setJobId(presetJobId)
        setFromJob(true)
        const job = (allJobs.data || []).find((j: any) => j.id === presetJobId)
        if (job) {
          setJobName(job.name)
          if (job.client_name) setClientName(job.client_name)
          if (job.site_address) setSiteAddress(job.site_address)
        }
      }
    }
    load()
  }, [])

  // ✅ 如果#1是空的，直接把分组填到#1，不新增#2
  function addItem(group?: string) {
    if (items.length === 1 && !items[0].description && !items[0].unit_price) {
      setItems([{ ...items[0], item_group: group || '' }])
    } else {
      setItems([...items, { description: '', area: '', item_type: '', item_group: group || '', quantity: '1', unit: '', unit_price: '', cost_price: '' }])
    }
  }

  function updateItem(i: number, f: string, v: string) { const u = [...items]; u[i] = { ...u[i], [f]: v }; setItems(u) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }

  const totalSell = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
  const totalCost = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost_price) || 0), 0)
  const totalProfit = totalSell - totalCost
  const margin = totalSell > 0 ? (totalProfit / totalSell * 100).toFixed(1) : '0'

  const defaultGroups = lang === 'zh'
    ? ['地板与墙面', '防水', '杂项', '人工']
    : ['Floors & Walls', 'Waterproofing', 'General Items', 'Labour']

  const areaOptions = lang === 'zh'
    ? ['浴室', '套间浴室', '独立卫生间', '厨房', '洗衣房', '户外区', '客厅', '通用']
    : ['Bath', 'Ensuite', 'PWC', 'Kitchen', 'Laundry', 'Alfresco', 'Living', 'General']

  const typeOptions = lang === 'zh'
    ? ['瓷砖', '地板', '墙面', '地墙', '防水', '杂项', '人工']
    : ['Tile', 'Floor', 'Wall', 'Floor&Wall', 'Waterproofing', 'General Items', 'Labour']

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((res, rej) => {
        reader.onload = (ev) => res((ev.target?.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const response = await fetch('/api/ai-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64, mediaType: file.type }) })
      const data = await response.json()
      const parsed: Item[] = data.items
      if (!parsed || parsed.length === 0) throw new Error('No items found')
      setImportedItems(parsed)
      setShowPreview(true)
    } catch (err) {
      alert(lang === 'zh' ? '识别失败，请重试' : 'Recognition failed, please try again')
    }
    setImportLoading(false)
    e.target.value = ''
  }

  function handleImportConfirm() {
    setItems([...items.filter(i => i.description || i.unit_price), ...importedItems])
    setShowPreview(false)
    setImportedItems([])
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    const req = lang === 'zh' ? '此项为必填' : 'This field is required'
    if (!clientName.trim()) newErrors.clientName = req
    const firstItem = items[0]
    if (!firstItem.description.trim()) newErrors.firstDesc = lang === 'zh' ? '请填写第一个条目的描述' : 'First item description is required'
    if (!firstItem.unit_price.trim()) newErrors.firstPrice = lang === 'zh' ? '请填写第一个条目的售价' : 'First item price is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user?.id)
    const quoteNumber = `Q-${String((count || 0) + 1).padStart(3, '0')}`
    const { data: quote, error } = await supabase.from('quotes').insert({
      quote_number: quoteNumber,
      client_name: clientName || null,
      client_id: clientId || null,
      job_id: jobId || null,
      site_address: siteAddress || null,
      notes,
      scope_of_work: scopeOfWork || null,
      owner_id: user?.id
    }).select().single()
    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    const quoteItems = items.filter(i => i.description && i.unit_price).map(i => ({
      quote_id: quote.id, description: i.description, area: i.area || null,
      item_type: i.item_type || null, item_group: i.item_group || null,
      quantity: Number(i.quantity) || 1, unit: i.unit,
      unit_price: Number(i.unit_price), cost_price: Number(i.cost_price) || 0
    }))
    if (quoteItems.length > 0) await supabase.from('quote_items').insert(quoteItems)
    if (fromJob && jobId) {
      window.location.href = '/jobs/' + jobId + '?tab=invoice'
    } else {
      window.location.href = '/quotes'
    }
    setLoading(false)
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-blue-500/40 transition"
  const inputErrCls = "w-full border border-[#FF453A] rounded-xl p-2.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-[#FF453A]/40 transition"
  const selectCls = "border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-blue-500/40 transition"
  const errCls = "text-[#FF453A] text-xs mt-1"
  const backUrl = fromJob && jobId ? '/jobs/' + jobId : '/quotes'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-12 md:pt-0">
      <input type="file" accept="image/*,application/pdf" className="sr-only" id="ai-scan-input" onChange={handleFileSelect} />

      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.location.href = backUrl} className="text-gray-400 dark:text-[#8E8E93] text-sm">← {lang === 'zh' ? '返回' : 'Back'}</button>
            <span className="text-gray-300 dark:text-[#3A3A3C]">/</span>
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {fromJob ? (lang === 'zh' ? '新建报价单（追加）' : 'New Quote (Add-on)') : (lang === 'zh' ? '新建报价单' : 'New Quote')}
            </h1>
          </div>
          <label htmlFor="ai-scan-input" className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${importLoading ? 'bg-gray-100 dark:bg-[#3A3A3C] text-[#8E8E93]' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100'}`}>
            {importLoading ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg><span>{lang === 'zh' ? '识别中...' : 'Scanning...'}</span></> : <><span>📷</span><span>{lang === 'zh' ? 'AI 识别' : 'AI Scan'}</span></>}
          </label>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {fromJob && jobName && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-2xl p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">📋 {lang === 'zh' ? `为工单「${jobName}」新建追加报价单` : `Adding quote to job: ${jobName}`}</p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">{lang === 'zh' ? '成交后条目将自动加入该工单发票' : 'Items will be added to the job invoice when accepted'}</p>
          </div>
        )}

        {showPreview && importedItems.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/40 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-purple-800 dark:text-purple-300">✅ {lang === 'zh' ? `识别到 ${importedItems.length} 个条目` : `Found ${importedItems.length} items`}</p>
                <p className="text-purple-600 dark:text-purple-400 text-xs mt-0.5">{lang === 'zh' ? '确认后导入到报价单' : 'Confirm to add to quote'}</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-purple-400 text-sm">✕</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {importedItems.map((item, i) => (
                <div key={i} className="bg-white dark:bg-[#2C2C2E] rounded-xl px-3 py-2 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.description}</p>
                    <div className="flex gap-1 mt-0.5">{item.item_group && <span className="text-xs text-purple-600 dark:text-purple-300">{item.item_group}</span>}{item.area && <span className="text-xs text-[#8E8E93]">· {item.area}</span>}</div>
                  </div>
                  {item.unit_price && <p className="text-sm font-semibold text-[#30D158] shrink-0 ml-2">${Number(item.unit_price).toLocaleString()}</p>}
                </div>
              ))}
            </div>
            <button onClick={handleImportConfirm} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-semibold transition-colors">{lang === 'zh' ? `✨ 导入 ${importedItems.length} 个条目` : `✨ Import ${importedItems.length} items`}</button>
          </div>
        )}

        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-200 dark:border-transparent shadow-sm p-6 space-y-6">

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '客户名称' : 'Client Name'} <span className="text-[#FF453A]">*</span></label>
            <input className={(errors.clientName ? inputErrCls : inputCls) + ' mt-1.5'} placeholder={lang === 'zh' ? '例如：张先生' : 'e.g. John Smith'} value={clientName} onChange={e => { setClientName(e.target.value); if (errors.clientName) setErrors(p => ({ ...p, clientName: '' })) }} />
            {errors.clientName && <p className={errCls}>{errors.clientName}</p>}
            {!fromJob && clients.length > 0 && (
              <select className={selectCls + ' w-full mt-1.5'} value={clientId} onChange={e => {
                setClientId(e.target.value)
                const found = clients.find(c => c.id === e.target.value)
                if (found) { setClientName(found.name); if (found.address) setSiteAddress(found.address); if (errors.clientName) setErrors(p => ({ ...p, clientName: '' })) }
              }}>
                <option value="">{lang === 'zh' ? '或从客户列表选择...' : 'Or select from client list...'}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '关联工单' : 'Job'}</label>
            {fromJob ? (
              <div className={inputCls + ' mt-1.5 bg-gray-50 dark:bg-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]'}>{jobName}</div>
            ) : (
              <>
                <input className={inputCls + ' mt-1.5'} placeholder={lang === 'zh' ? '例如：厨房翻新' : 'e.g. Kitchen Renovation'} value={jobName} onChange={e => { setJobName(e.target.value); setJobId('') }} />
                {jobs.length > 0 && (
                  <select className={selectCls + ' w-full mt-1.5'} value={jobId} onChange={e => { setJobId(e.target.value); const found = jobs.find(j => j.id === e.target.value); if (found) setJobName(found.name) }}>
                    <option value="">{lang === 'zh' ? '或从已有工单选择...' : 'Or select from existing jobs...'}</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                  </select>
                )}
              </>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '工地地址' : 'Site Address'}</label>
            <input className={inputCls + ' mt-1.5'} placeholder={lang === 'zh' ? '例如：123 Smith St, Perth WA' : 'e.g. 123 Smith St, Perth WA'} value={siteAddress} onChange={e => setSiteAddress(e.target.value)} />{addrOptions.length>0 && <div className="mt-1 border border-gray-200 dark:border-[#3A3A3C] rounded-xl overflow-hidden">{addrOptions.map((a,i)=><button type="button" key={i} onClick={()=>{setSiteAddress(a);setAddrOptions([])}} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#2C2C2E] text-gray-900 dark:text-gray-100">{a}</button>)}</div>}
            {!fromJob && clients.filter(c => c.address).length > 0 && (
              <select className={selectCls + ' w-full mt-1.5'} value="" onChange={e => { if (e.target.value) setSiteAddress(e.target.value) }}>
                <option value="">{lang === 'zh' ? '或从客户地址选择...' : 'Or select from client addresses...'}</option>
                {clients.filter(c => c.address).map(c => <option key={c.id} value={c.address}>{c.name}: {c.address}</option>)}
              </select>
            )}
          </div>

          <div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5 block">{lang === 'zh' ? '报价条目' : 'Quote Items'} <span className="text-[#FF453A]">*</span></label>
              <div className="flex flex-wrap gap-2">
                {defaultGroups.map(g => <button key={g} onClick={() => addItem(g)} className="text-xs bg-gray-100 dark:bg-[#3A3A3C] text-gray-600 dark:text-[#8E8E93] px-2.5 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#48484A] transition-colors">+ {g}</button>)}
                <button onClick={() => addItem()} className="text-xs bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF] px-2.5 py-1.5 rounded-lg">+ {lang === 'zh' ? '条目' : 'Item'}</button>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-xl p-3 mb-4">
              <p className="text-yellow-800 dark:text-yellow-300 text-xs">💡 {lang === 'zh' ? '成本价仅自己可见，不会出现在报价单中' : 'Cost price is private — not shown on the quote'}</p>
            </div>
            {[...new Set(['', ...items.map(i => i.item_group || '')])].map(group => {
              const groupItems = items.filter(i => (i.item_group || '') === group)
              if (groupItems.length === 0) return null
              return (
                <div key={group} className="mb-5">
                  {group && <div className="bg-gray-100 dark:bg-[#3A3A3C] px-3 py-1.5 rounded-xl mb-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">📁 {group}</div>}
                  <div className="space-y-3">
                    {groupItems.map(item => {
                      const index = items.indexOf(item)
                      const isFirst = index === 0
                      const sell = Number(item.quantity) * Number(item.unit_price) || 0
                      const cost = Number(item.quantity) * Number(item.cost_price) || 0
                      return (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 bg-white dark:bg-gray-800">
                          <div className="flex justify-between items-center">
                            <span className="text-[#8E8E93] text-xs">#{index + 1} {item.item_group && <span className="bg-blue-100 dark:bg-[#0A84FF]/20 text-blue-600 dark:text-[#0A84FF] px-1 rounded text-xs">{item.item_group}</span>}</span>
                            {items.length > 1 && <button onClick={() => removeItem(index)} className="text-[#FF453A] text-xs">{lang === 'zh' ? '删除' : 'Remove'}</button>}
                          </div>
                          <div>
                            <input className={isFirst && errors.firstDesc ? inputErrCls : inputCls} placeholder={lang === 'zh' ? '描述' : 'Description'} value={item.description} onChange={e => { updateItem(index, 'description', e.target.value); if (isFirst && errors.firstDesc) setErrors(p => ({ ...p, firstDesc: '' })) }} />
                            {isFirst && errors.firstDesc && <p className={errCls}>{errors.firstDesc}</p>}
                          </div>
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
                            <input disabled={item.priceMode === 'total'} className={selectCls + ' w-20'} placeholder="Qty" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                            <input list="cimoUnits" className={selectCls + ' w-20'} placeholder="Unit" value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} />{isFirst && <datalist id="cimoUnits"><option value="sqm">平方米</option><option value="qbm">立方米</option><option value="L">升</option><option value="KL">千升</option><option value="KG">千克</option><option value="LM">米</option><option value="EA">个</option></datalist>}
                          </div>
                          <div className="flex items-center gap-1.5"><button type="button" onClick={() => updateItem(index, 'priceMode', 'unit')} className={item.priceMode !== 'total' ? 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0A84FF] text-white' : 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]'}>{lang === 'zh' ? '单价' : 'Unit'}</button><button type="button" onClick={() => { setItems(prev => prev.map((it, i) => i === index ? { ...it, priceMode: 'total', quantity: '1' } : it)) }} className={item.priceMode === 'total' ? 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E3B341] text-black' : 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-[#3A3A3C] text-gray-500 dark:text-[#8E8E93]'}>{lang === 'zh' ? '总价' : 'Total'}</button></div>
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <input className={isFirst && errors.firstPrice ? inputErrCls : inputCls} placeholder={item.priceMode === 'total' ? (lang === 'zh' ? '总价 $' : 'Total $') : (lang === 'zh' ? '售价 $' : 'Rate $')} value={item.unit_price} onChange={e => { updateItem(index, 'unit_price', e.target.value); if (isFirst && errors.firstPrice) setErrors(p => ({ ...p, firstPrice: '' })) }} />
                              {isFirst && errors.firstPrice && <p className={errCls}>{errors.firstPrice}</p>}
                            </div>
                            <input className="flex-1 border border-yellow-300 dark:border-yellow-700/60 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-2.5 text-gray-900 dark:text-gray-100 outline-none text-sm" placeholder={lang === 'zh' ? '成本 $' : 'Cost $'} value={item.cost_price} onChange={e => updateItem(index, 'cost_price', e.target.value)} />
                            {sell > 0 && <span className={`text-xs font-medium shrink-0 ${sell - cost >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>${sell.toFixed(0)}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-gray-50 dark:bg-[#1C1C1E] rounded-2xl p-5 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">{lang === 'zh' ? '报价总额' : 'Quote Total'}</span>
              <span className="font-semibold text-[#30D158]">${totalSell.toLocaleString()}</span>
            </div>
            {totalCost > 0 && <>
              <div className="flex justify-between text-sm text-[#8E8E93]">
                <span>{lang === 'zh' ? '总成本（私密）' : 'Total Cost (private)'}</span>
                <span>${totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E93]">{lang === 'zh' ? '预计利润' : 'Est. Profit'}</span>
                <span className={totalProfit >= 0 ? 'text-[#30D158] font-medium' : 'text-[#FF453A] font-medium'}>${totalProfit.toLocaleString()} ({margin}%)</span>
              </div>
            </>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '工程范围' : 'Scope of Work'}</label>
            <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-blue-500/40 transition resize-none" rows={4} value={scopeOfWork} onChange={e => setScopeOfWork(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{lang === 'zh' ? '备注' : 'Notes'}</label>
            <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 mt-1.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none resize-none focus:ring-2 focus:ring-blue-500/40 transition" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-semibold disabled:opacity-50 transition-colors">
            {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '创建报价单' : 'Create Quote')}
          </button>
        </div>
      </main>
    </div>
  )
}
