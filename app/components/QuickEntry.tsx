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
  const [scanning, setScanning] = useState(false)
  const [vendor, setVendor] = useState('')
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [isAggregate, setIsAggregate] = useState(false)

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

  async function handleReceiptScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = () => rej(new Error('read failed'))
        r.readAsDataURL(file)
      })
      const resp = await fetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64, mediaType: file.type }) })
      const json = await resp.json()
      if (!json.success || !json.data) { alert(zh ? '\u8bc6\u522b\u5931\u8d25,\u8bf7\u624b\u52a8\u586b\u5199' : 'Scan failed, please enter manually'); return }
      const d = json.data
      const vtext = String(d.vendor || '').toLowerCase()
      const itemVendors = Array.isArray(d.items) ? d.items.map((it: any) => it.vendor).filter(Boolean) : []
      const multiByItems = new Set(itemVendors.map((x: any) => String(x).toLowerCase())).size > 1
      const multiByText = /multiple|various|several|mixed supplier/.test(vtext)
      const multiBySeparator = /\s\/\s|,|;|\s&\s|\sand\s/.test(vtext) && vtext.length > 25
      const dtext = String(d.description || '').toLowerCase()
      const multiByDesc = /multiple items|multiple suppliers|various items/.test(dtext)
      setIsAggregate(multiByText || multiByItems || multiBySeparator || multiByDesc)
      if (d.type && ['material','fuel','subcontract'].includes(d.type)) setType(d.type)
      if (d.description) setDesc(String(d.description))
      if (d.amount != null) setAmount(String(d.amount))
      if (d.quantity != null) setQty(String(d.quantity))
      if (d.unit_price != null) setUnitPrice(String(d.unit_price))
      const { data: { user } } = await supabase.auth.getUser()
      if (user && navigator.onLine) {
        const { data: rec } = await supabase.from('receipts').insert({ owner_id: user.id, job_id: job || null, amount: d.amount ?? null, gst: d.gst ?? null }).select('id').single()
        if (rec?.id) {
          setReceiptId(rec.id)
          const { data: ext } = await supabase.from('receipt_extractions').insert({ receipt_id: rec.id, owner_id: user.id, raw: d, model: 'claude-opus' }).select('id').single()
          let vId: string | null = null
          if (d.vendor) {
            const { data: m } = await supabase.rpc('match_vendor', { input_text: String(d.vendor) })
            const hit = Array.isArray(m) ? m[0] : m
            if (hit?.vendor_id) { vId = hit.vendor_id; setVendorId(hit.vendor_id) }
            setVendor(String(d.vendor))
          }
          if (vId) await supabase.from('receipts').update({ vendor_id: vId }).eq('id', rec.id)
          const items = Array.isArray(d.items) ? d.items : []
          if (items.length > 0 && ext?.id) {
            const rows = items.map((it: any) => ({
              owner_id: user.id, receipt_id: rec.id, extraction_id: ext.id,
              description: it.description ?? null,
              quantity: it.quantity ?? null,
              unit_price: it.unit_price ?? null,
              total: it.total ?? null,
              tax_rate: d.gst_status === 'free' ? 0 : 0.10,
              gst_category: d.gst_status === 'free' ? 'GST-free' : 'GST',
              vendor_id: vId,
              vendor_raw_text: d.vendor ? String(d.vendor) : null,
            }))
            await supabase.from('receipt_line_items').insert(rows)
          }
          const invNo = d.invoice_number ? (' #' + d.invoice_number) : ''
          if (d.vendor) setDesc(String(d.vendor) + invNo)
        }
      } else if (d.vendor) { setVendor(String(d.vendor)) }
    } catch (err) {
      console.error('receipt scan error', err)
      alert(zh ? '\u8bc6\u522b\u5931\u8d25,\u8bf7\u624b\u52a8\u586b\u5199' : 'Scan failed, please enter manually')
    } finally {
      setScanning(false)
      e.target.value = ''
    }
  }

  const save = async () => {
    if (!job) { alert(zh ? '请选择工单' : 'Pick a job'); return }
    const amt = calcAmount()
    if (!(amt > 0)) { alert(zh ? '请填写金额' : 'Enter amount'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const row: Record<string, unknown> = { job_id: job, owner_id: user.id, type, description: desc || type, amount: amt }
    const TAX_CAT: Record<string, string> = { material: 'cogs_material', fuel: 'fuel_expense', subcontract: 'subcontractor_expense', labor: 'labor_expense' }
    if (TAX_CAT[type]) row.tax_category = TAX_CAT[type]
    if (type === 'material') {
      if (qty) row.quantity = Number(qty)
      if (unit) row.unit = unit
      if (unitPrice) row.unit_price = Number(unitPrice)
      row.gst_status = 'inclusive'
    }
    if (vendorId) row.vendor_id = vendorId
    if (receiptId) row.receipt_id = receiptId
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
            <div className="mb-3">
              <input type="file" accept="image/*" capture="environment" className="sr-only" id="receipt-scan" onChange={handleReceiptScan} />
              <label htmlFor="receipt-scan" className={"flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors " + (scanning ? "bg-gray-100 dark:bg-[#3A3A3C] text-[#8E8E93]" : "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100")}>
                {scanning ? (zh ? '识别中...' : 'Scanning...') : (zh ? '\ud83d\udcf7 扫描收据' : '\ud83d\udcf7 Scan receipt')}
              </label>
              {vendor ? <div className="text-xs text-[#8E8E93] mt-1">{zh ? '供应商: ' : 'Vendor: '}{vendor}</div> : null}
              {isAggregate ? <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2.5 py-1.5 mt-1">{zh ? '检测到多供应商汇总单。已汇总为一条,明细已存档;如需逐项拆账请在财务中心整理。' : 'Multi-supplier summary detected. Saved as one entry (line items archived). Use Finance Centre to itemise.'}</div> : null}
            </div>
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
            {type === 'material' && !isAggregate && (
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
