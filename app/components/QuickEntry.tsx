'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { createClient } from '../../utils/supabase/client'
import { saveEntry } from '../../lib/offlineQueue'

const TYPES = [
  { k: 'material', zh: '材料', en: 'Material' },
  { k: 'labor', zh: '人工', en: 'Labor' },
  { k: 'fuel', zh: '油费', en: 'Fuel' },
  { k: 'subcontract', zh: '分包', en: 'Subcontract' },
  { k: 'invoice', zh: '收款', en: 'Payment' },
]

export default function QuickEntry() {
  const { lang } = useLanguage()
  const zh = lang === 'zh'
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [job, setJob] = useState('')
  const [type, setType] = useState('material')
  const [mats, setMats] = useState<any[]>([])
  const [desc, setDesc] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [picked, setPicked] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    supabase.from('jobs').select('id, name').order('created_at', { ascending: false }).then(({ data }) => {
      setJobs(data || [])
      if (data && data.length && !job) setJob(data[0].id)
    })
  }, [open])

  useEffect(() => {
    if (!job) { setMats([]); return }
    supabase.from('job_entries').select('description, unit, unit_price').eq('job_id', job).eq('type', 'material').eq('notes', 'QUOTE_ESTIMATE').then(({ data }) => setMats(data || []))
  }, [job])

  const pickMat = (m: any) => {
    setPicked(m.description)
    setDesc(m.description)
    setUnit(m.unit || '')
    setUnitPrice(m.unit_price != null ? String(m.unit_price) : '')
  }

  const calcAmount = () => {
    const q = Number(qty), p = Number(unitPrice)
    if (type === 'material' && q > 0 && p > 0) return q * p
    return Number(amount) || 0
  }

  const save = async () => {
    if (!job) { alert(zh ? '请选择工单' : 'Pick a job'); return }
    const amt = calcAmount()
    if (!(amt > 0)) { alert(zh ? '请填写金额' : 'Enter amount'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const row: Record<string, unknown> = { job_id: job, owner_id: user.id, type, description: desc || type, amount: amt }
    if (type === 'material') {
      if (qty) row.quantity = Number(qty)
      if (unit) row.unit = unit
      if (unitPrice) row.unit_price = Number(unitPrice)
      row.gst_status = 'inclusive'
      row.tax_category = 'cogs_material'
    }
    const result = await saveEntry('job_entries', row)
    setSaving(false)
    setOpen(false)
    if (result === 'queued') {
      alert(zh ? '已离线保存,联网后自动上传' : 'Saved offline — will upload when back online')
    }
    window.location.reload()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="hidden md:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-sm text-sm font-semibold transition-colors"><span className="text-lg leading-none">+</span>{zh ? '记一笔' : 'Log entry'}</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#3A3A3C] shadow-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-4">{zh ? '记一笔' : 'Log entry'}</div>
            <label className="block text-xs text-gray-500 dark:text-[#8E8E93] mb-1">{zh ? '工单' : 'Job'}</label>
            <select value={job} onChange={e => setJob(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl text-sm text-gray-900 dark:text-white outline-none mb-4">
              {jobs.length === 0 && <option value="">{zh ? '暂无工单' : 'No jobs'}</option>}
              {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            <div className="flex flex-wrap gap-2 mb-4">
              {TYPES.map(t => <button key={t.k} onClick={() => setType(t.k)} className={'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ' + (type === t.k ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-[#2C2C2E] text-gray-600 dark:text-[#8E8E93] border-gray-200 dark:border-[#3A3A3C]')}>{zh ? t.zh : t.en}</button>)}
            </div>
            {type === 'material' && mats.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 dark:text-[#8E8E93] mb-2">{zh ? '从报价带入（点一下自动填名称/单价）' : 'From quote (tap to fill)'}</div>
                <div className="flex flex-wrap gap-2">
                  {mats.map((m, i) => <button key={i} onClick={() => pickMat(m)} className={'px-3 py-1.5 rounded-lg text-xs border transition-colors ' + (picked === m.description ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#3A3A3C]')}>{m.description}{m.unit_price != null ? ' $' + m.unit_price : ''}</button>)}
                </div>
              </div>
            )}
            <label className="block text-xs text-gray-500 dark:text-[#8E8E93] mb-1">{zh ? '名称/备注' : 'Description'}</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl text-sm text-gray-900 dark:text-white outline-none mb-4" placeholder={zh ? '如:水泥' : 'e.g. Cement'} />
            {type === 'material' && (
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-[#8E8E93] mb-1">{zh ? '数量' : 'Qty'}</label>
                  <input value={qty} onChange={e => setQty(e.target.value)} inputMode="decimal" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl text-sm text-gray-900 dark:text-white outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-[#8E8E93] mb-1">{zh ? '单价' : 'Unit price'}</label>
                  <input value={unitPrice} onChange={e => setUnitPrice(e.target.value)} inputMode="decimal" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl text-sm text-gray-900 dark:text-white outline-none" />
                </div>
              </div>
            )}
            <label className="block text-xs text-gray-500 dark:text-[#8E8E93] mb-1">{zh ? '金额' : 'Amount'}</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl text-sm text-gray-900 dark:text-white outline-none mb-2" placeholder={type === 'material' ? (zh ? '留空=数量×单价' : 'blank = qty x price') : ''} />
            {type === 'material' && Number(qty) > 0 && Number(unitPrice) > 0 && <div className="text-xs text-blue-500 mb-2">{zh ? '自动 $' : 'Auto $'}{(Number(qty) * Number(unitPrice)).toFixed(2)}</div>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-[#3A3A3C] text-sm font-semibold text-gray-600 dark:text-[#8E8E93]">{zh ? '取消' : 'Cancel'}</button>
              <button onClick={save} disabled={saving} className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors">{saving ? (zh ? '保存中…' : 'Saving') : (zh ? '保存' : 'Save')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
