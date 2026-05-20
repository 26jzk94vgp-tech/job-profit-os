'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { useLanguage } from '../../../../lib/i18n/LanguageContext'

export default function EditQuote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [quoteNumber, setQuoteNumber] = useState('')
  const [quoteType, setQuoteType] = useState('Residential')
  const [builderName, setBuilderName] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => setClients(data || []))
    supabase.from('quotes').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setQuoteNumber(data.quote_number || '')
        setQuoteType(data.quote_type || 'Residential')
        setBuilderName(data.builder_name || '')
        setSiteAddress(data.site_address || '')
        setScopeOfWork(data.scope_of_work || '')
        setNotes(data.notes || '')
        setClientName(data.client_name || '')
        setClientId(data.client_id || '')
      }
    })
    supabase.from('quote_items').select('*').eq('quote_id', id).then(({ data }) => setItems(data || []))
  }, [id])

  function addItem() {
    setItems([...items, { id: 'new-' + Date.now(), description: '', area: '', code: '', item_name: '', item_type: '', item_unit: '', quantity: '1', unit_price: '' }])
  }

  function updateItem(idx: number, field: string, value: string) {
    const updated = [...items]
    updated[idx] = { ...updated[idx], [field]: value }
    setItems(updated)
  }

  async function removeItem(item: any) {
    if (!item.id.startsWith('new-')) {
      await supabase.from('quote_items').delete().eq('id', item.id)
    }
    setItems(items.filter((_, i) => i !== items.indexOf(item)))
  }

  async function handleSave() {
    setLoading(true)
    await supabase.from('quotes').update({
      quote_number: quoteNumber,
      quote_type: quoteType,
      builder_name: builderName,
      site_address: siteAddress,
      scope_of_work: scopeOfWork,
      client_name: clientName || null,
      client_id: clientId || null,
      notes
    }).eq('id', id)

    for (const item of items) {
      if (item.id.startsWith('new-')) {
        await supabase.from('quote_items').insert({
          quote_id: id,
          description: item.description,
          area: item.area,
          code: item.code,
          item_name: item.item_name,
          item_type: item.item_type,
          item_unit: item.item_unit,
          item_group: item.item_group || null,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          cost_price: Number(item.cost_price) || 0
        })
      } else {
        await supabase.from('quote_items').update({
          description: item.description,
          area: item.area,
          code: item.code,
          item_name: item.item_name,
          item_type: item.item_type,
          item_unit: item.item_unit,
          item_group: item.item_group || null,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          cost_price: Number(item.cost_price) || 0
        }).eq('id', item.id)
      }
    }

    window.location.href = '/quotes/' + id
    setLoading(false)
  }

  const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
  const gst = subTotal * 0.1
  const total = subTotal + gst

  // Shared input classes
  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 mt-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition"
  const labelCls = "text-sm font-medium text-gray-700 dark:text-gray-300"
  const cellInputCls = "w-full p-1 outline-none text-sm bg-transparent text-gray-800 dark:text-gray-100 focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded transition"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <a href={"/quotes/" + id} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ← {lang === 'zh' ? '返回' : 'Back'}
          </a>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {lang === 'zh' ? '编辑报价单' : 'Edit Quote'}
          </h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {lang === 'zh' ? '基本信息' : 'Basic Info'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{lang === 'zh' ? '客户名称' : 'Client Name'}</label>
              <input
                className={inputCls}
                placeholder="e.g. John Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              {clients.length > 0 && (
                <select
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 outline-none text-sm"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value)
                    const found = clients.find((c: any) => c.id === e.target.value)
                    if (found) setClientName(found.name)
                  }}
                >
                  <option value="">{lang === 'zh' ? '或从客户列表选择...' : 'Or select from client list...'}</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={labelCls}>{lang === 'zh' ? '报价单号' : 'Quote Number'}</label>
              <input className={inputCls} value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} placeholder="Q-001" />
            </div>
            <div>
              <label className={labelCls}>{lang === 'zh' ? '类型' : 'Type'}</label>
              <select
                className={inputCls}
                value={quoteType}
                onChange={(e) => setQuoteType(e.target.value)}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{lang === 'zh' ? '建筑商' : 'Builder'}</label>
              <input className={inputCls} value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="Builder name" />
            </div>
          </div>
          <div>
            <label className={labelCls}>{lang === 'zh' ? '工地地址' : 'Site Address'}</label>
            <input className={inputCls} value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="e.g. Unit 6C 123 Main St" />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {lang === 'zh' ? '条目' : 'Items'}
            </h2>
            <button onClick={addItem} className="text-blue-500 dark:text-blue-400 text-sm font-medium hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
              + {lang === 'zh' ? '添加条目' : 'Add Item'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {[
                    lang === 'zh' ? '描述' : 'Description',
                    lang === 'zh' ? '区域' : 'Area',
                    'Code',
                    lang === 'zh' ? '名称' : 'Name',
                    lang === 'zh' ? '类型' : 'Type',
                    lang === 'zh' ? '单位' : 'Unit',
                    lang === 'zh' ? '数量' : 'Qty',
                    lang === 'zh' ? '分组' : 'Group',
                    lang === 'zh' ? '售价' : 'Rate',
                    lang === 'zh' ? '成本' : 'Cost',
                    lang === 'zh' ? '金额' : 'Amount',
                    '',
                  ].map((h, i) => (
                    <th key={i} className={`pb-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 ${i === 9 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-1 py-1"><input className={cellInputCls} value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} /></td>
                    <td className="px-1 py-1"><input className={cellInputCls} value={item.area || ''} onChange={(e) => updateItem(idx, 'area', e.target.value)} /></td>
                    <td className="px-1 py-1"><input className={cellInputCls} value={item.code || ''} onChange={(e) => updateItem(idx, 'code', e.target.value)} /></td>
                    <td className="px-1 py-1"><input className={cellInputCls} value={item.item_name || ''} onChange={(e) => updateItem(idx, 'item_name', e.target.value)} /></td>
                    <td className="px-1 py-1"><input className={cellInputCls} value={item.item_type || ''} onChange={(e) => updateItem(idx, 'item_type', e.target.value)} /></td>
                    <td className="px-1 py-1"><input className={cellInputCls} value={item.item_unit || ''} onChange={(e) => updateItem(idx, 'item_unit', e.target.value)} /></td>
                    <td className="px-1 py-1"><input type="number" className={cellInputCls + ' text-right'} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                    <td className="px-1 py-1"><input className={cellInputCls} value={item.item_group || ''} onChange={(e) => updateItem(idx, 'item_group', e.target.value)} /></td>
                    <td className="px-1 py-1"><input type="number" className={cellInputCls + ' text-right'} value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} /></td>
                    <td className="px-1 py-1 bg-yellow-50 dark:bg-yellow-900/20">
                      <input type="number" className={cellInputCls + ' text-right bg-transparent'} value={item.cost_price || ''} onChange={(e) => updateItem(idx, 'cost_price', e.target.value)} />
                    </td>
                    <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-300 font-medium">
                      ${(Number(item.quantity) * Number(item.unit_price) || 0).toFixed(2)}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <button onClick={() => removeItem(item)} className="text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 text-xs transition-colors">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between py-1 text-gray-500 dark:text-gray-400">
                <span>{lang === 'zh' ? '小计' : 'Sub-Total'}</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <span>GST (10%)</span>
                <span>${gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-semibold text-base text-gray-900 dark:text-white">
                <span>{lang === 'zh' ? '含GST总计' : 'Total Inc. GST'}</span>
                <span className="text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scope + Notes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              {lang === 'zh' ? '工作范围' : 'Scope of Work'}
            </h2>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition resize-none"
              rows={4}
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              placeholder={lang === 'zh' ? '描述工作范围...' : 'Describe the scope of work...'}
            />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              {lang === 'zh' ? '备注' : 'Notes'}
            </h2>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40 transition resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'zh' ? '付款条款等...' : 'Payment terms etc...'}
            />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存报价单' : 'Save Quote')}
        </button>

      </main>
    </div>
  )
}
