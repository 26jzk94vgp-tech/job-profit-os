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
  const [quoteNumber, setQuoteNumber] = useState('')
  const [quoteType, setQuoteType] = useState('Residential')
  const [builderName, setBuilderName] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    supabase.from('quotes').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setQuoteNumber(data.quote_number || '')
        setQuoteType(data.quote_type || 'Residential')
        setBuilderName(data.builder_name || '')
        setSiteAddress(data.site_address || '')
        setScopeOfWork(data.scope_of_work || '')
        setNotes(data.notes || '')
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
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price)
        })
      } else {
        await supabase.from('quote_items').update({
          description: item.description,
          area: item.area,
          code: item.code,
          item_name: item.item_name,
          item_type: item.item_type,
          item_unit: item.item_unit,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price)
        }).eq('id', item.id)
      }
    }

    window.location.href = '/quotes/' + id
    setLoading(false)
  }

  const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0)
  const gst = subTotal * 0.1
  const total = subTotal + gst
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <a href={"/quotes/" + id} className="text-gray-500 hover:text-gray-700 text-sm">← {lang === 'zh' ? '返回' : 'Back'}</a>
          <h1 className="font-semibold text-gray-900">{lang === 'zh' ? '编辑报价单' : 'Edit Quote'}</h1>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '基本信息' : 'Basic Info'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '报价单号' : 'Quote Number'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} placeholder="Q-001" /></div>
            <div>
              <label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '类型' : 'Type'}</label>
              <select className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={quoteType} onChange={(e) => setQuoteType(e.target.value)}>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>
          </div>
          <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '建筑商' : 'Builder'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="Builder name" /></div>
          <div><label className="text-gray-700 text-sm font-medium">{lang === 'zh' ? '工地地址' : 'Site Address'}</label><input className="w-full border border-gray-200 rounded-lg p-3 mt-1 text-gray-900 outline-none" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="e.g. Unit 6C 123 Main St" /></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '条目' : 'Items'}</h2>
            <button onClick={addItem} className="text-blue-600 text-sm font-medium">+ {lang === 'zh' ? '添加条目' : 'Add Item'}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-2 text-left">{lang === 'zh' ? '描述' : 'Description'}</th>
                  <th className="border border-gray-200 px-2 py-2 text-left w-24">{lang === 'zh' ? '区域' : 'Area'}</th>
                  <th className="border border-gray-200 px-2 py-2 text-left w-16">Code</th>
                  <th className="border border-gray-200 px-2 py-2 text-left w-24">{lang === 'zh' ? '名称' : 'Name'}</th>
                  <th className="border border-gray-200 px-2 py-2 text-left w-20">{lang === 'zh' ? '类型' : 'Type'}</th>
                  <th className="border border-gray-200 px-2 py-2 text-left w-16">{lang === 'zh' ? '单位' : 'Unit'}</th>
                  <th className="border border-gray-200 px-2 py-2 text-right w-12">{lang === 'zh' ? '数量' : 'Qty'}</th>
                  <th className="border border-gray-200 px-2 py-2 text-right w-24">{lang === 'zh' ? '单价' : 'Rate'}</th>
                  <th className="border border-gray-200 px-2 py-2 text-right w-24">{lang === 'zh' ? '金额' : 'Amount'}</th>
                  <th className="border border-gray-200 px-2 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-gray-200 px-1"><input className="w-full p-1 outline-none text-sm" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} /></td>
                    <td className="border border-gray-200 px-1"><input className="w-full p-1 outline-none text-sm" value={item.area || ''} onChange={(e) => updateItem(idx, 'area', e.target.value)} /></td>
                    <td className="border border-gray-200 px-1"><input className="w-full p-1 outline-none text-sm" value={item.code || ''} onChange={(e) => updateItem(idx, 'code', e.target.value)} /></td>
                    <td className="border border-gray-200 px-1"><input className="w-full p-1 outline-none text-sm" value={item.item_name || ''} onChange={(e) => updateItem(idx, 'item_name', e.target.value)} /></td>
                    <td className="border border-gray-200 px-1"><input className="w-full p-1 outline-none text-sm" value={item.item_type || ''} onChange={(e) => updateItem(idx, 'item_type', e.target.value)} /></td>
                    <td className="border border-gray-200 px-1"><input className="w-full p-1 outline-none text-sm" value={item.item_unit || ''} onChange={(e) => updateItem(idx, 'item_unit', e.target.value)} /></td>
                    <td className="border border-gray-200 px-1"><input type="number" className="w-full p-1 outline-none text-sm text-right" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                    <td className="border border-gray-200 px-1"><input type="number" className="w-full p-1 outline-none text-sm text-right" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} /></td>
                    <td className="border border-gray-200 px-2 text-right text-gray-600">${(Number(item.quantity) * Number(item.unit_price) || 0).toFixed(2)}</td>
                    <td className="border border-gray-200 px-1 text-center"><button onClick={() => removeItem(item)} className="text-red-400 hover:text-red-600 text-xs">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end text-sm space-y-1">
            <div className="text-right space-y-1">
              <p className="text-gray-600">{lang === 'zh' ? '小计' : 'Sub-Total'}: <span className="font-medium">${subTotal.toFixed(2)}</span></p>
              <p className="text-gray-600">GST: <span className="font-medium">${gst.toFixed(2)}</span></p>
              <p className="font-bold text-blue-600">{lang === 'zh' ? '含GST总计' : 'Total Inc GST'}: ${total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '工作范围' : 'Scope of Work'}</h2>
          <textarea className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 outline-none" rows={4} value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} placeholder={lang === 'zh' ? '描述工作范围...' : 'Describe the scope of work...'} />
          <h2 className="font-semibold text-gray-900">{lang === 'zh' ? '备注' : 'Notes'}</h2>
          <textarea className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 outline-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={lang === 'zh' ? '付款条款等...' : 'Payment terms etc...'} />
        </div>

        <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
          {loading ? (lang === 'zh' ? '保存中...' : 'Saving...') : (lang === 'zh' ? '保存报价单' : 'Save Quote')}
        </button>

      </main>
    </div>
  )
}